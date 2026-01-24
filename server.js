import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import 'dotenv/config.js';
import { 
    initializeDatabase, 
    getAllStudents, 
    saveAllStudents, 
    deleteStudent,
    exportData,
    closeDatabase,
    getAllEmailTemplates,
    saveEmailTemplate,
    deleteEmailTemplate,
    exportEmailTemplatesToJson
} from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;
const DATA_FILE = path.join(__dirname, 'students.json');

// Gmail SMTP Configuration
const SENDER_EMAIL = 'osama.eldrieny@gmail.com';
const SENDER_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || ''; // Will need to be set via environment variable

// Create email transporter
let transporter = null;
if (SENDER_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: SENDER_EMAIL,
            pass: SENDER_APP_PASSWORD
        }
    });
    console.log('📧 Gmail SMTP configured for ' + SENDER_EMAIL);
} else {
    console.log('⚠️  GMAIL_APP_PASSWORD not set. Email sending will be disabled.');
    console.log('📝 To enable email sending, set the GMAIL_APP_PASSWORD environment variable.');
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

// Initialize database on startup
let dbReady = false;
(async () => {
    try {
        await initializeDatabase();
        dbReady = true;
        console.log('🔧 Database initialization complete');
    } catch (error) {
        console.error('❌ Failed to initialize database:', error.message);
        process.exit(1);
    }
})();

// GET /api/students - Load all students
app.get('/api/students', async (req, res) => {
    try {
        const students = await getAllStudents();
        res.json(students);
    } catch (error) {
        console.error('❌ Error fetching students:', error.message);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// POST /api/students - Save all students
app.post('/api/students', async (req, res) => {
    try {
        const students = req.body;
        
        if (!Array.isArray(students)) {
            return res.status(400).json({ error: 'Students must be an array' });
        }
        
        const result = await saveAllStudents(students);
        console.log(`✅ Auto-saved ${result.count} students to database`);
        res.json({ 
            success: true, 
            count: result.count,
            message: 'Students saved successfully to database'
        });
    } catch (error) {
        console.error('❌ Error saving students:', error.message);
        res.status(500).json({ error: 'Failed to save students' });
    }
});

// DELETE /api/students/:id - Delete a student
app.delete('/api/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await deleteStudent(id);
        console.log(`✅ Deleted student with ID: ${id}`);
        res.json({ success: true, message: 'Student deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting student:', error.message);
        res.status(500).json({ error: 'Failed to delete student' });
    }
});

// GET /api/export - Get current data as JSON (for download)
app.get('/api/export', async (req, res) => {
    try {
        const students = await exportData();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        res.setHeader('Content-Disposition', `attachment; filename="students_${timestamp}.json"`);
        res.json(students);
    } catch (error) {
        console.error('❌ Error exporting data:', error.message);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

// GET /api/email-templates - Get all email templates
app.get('/api/email-templates', async (req, res) => {
    try {
        const templates = await getAllEmailTemplates();
        res.json(templates);
    } catch (error) {
        console.error('❌ Error fetching email templates:', error.message);
        res.status(500).json({ error: 'Failed to fetch email templates' });
    }
});

// POST /api/email-templates - Save email template
app.post('/api/email-templates', async (req, res) => {
    try {
        const { id, name, button_label, subject, body } = req.body;
        
        if (!id || !name || !button_label || !subject || !body) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        await saveEmailTemplate(id, name, button_label, subject, body);
        // Auto-export to JSON after saving
        await exportEmailTemplatesToJson();
        res.json({ success: true, message: 'Email template saved successfully' });
    } catch (error) {
        console.error('❌ Error saving email template:', error.message);
        res.status(500).json({ error: 'Failed to save email template' });
    }
});

// DELETE /api/email-templates/:id - Delete email template
app.delete('/api/email-templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await deleteEmailTemplate(id);
        // Auto-export to JSON after deleting
        await exportEmailTemplatesToJson();
        res.json({ success: true, message: 'Email template deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting email template:', error.message);
        res.status(500).json({ error: 'Failed to delete email template' });
    }
});

// POST /api/send-email - Send email to student
app.post('/api/send-email', async (req, res) => {
    try {
        const { studentEmail, studentName, templateId, subject, body } = req.body;
        
        if (!studentEmail || !templateId || !subject || !body) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Check if Gmail is configured
        if (!transporter) {
            console.log(`📧 Email prepared for: ${studentName} <${studentEmail}>`);
            console.log(`Subject: ${subject}`);
            console.log(`⚠️  Gmail SMTP not configured. Set GMAIL_APP_PASSWORD environment variable.`);
            return res.json({ 
                success: false, 
                message: 'Email service not configured. Contact administrator.' 
            });
        }

        // Send email via Gmail SMTP
        const mailOptions = {
            from: `"Design Tokens Camp" <${SENDER_EMAIL}>`,
            to: studentEmail,
            subject: subject,
            html: `<pre style="font-family: Arial, sans-serif; white-space: pre-wrap; word-wrap: break-word;">${body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${studentName} <${studentEmail}> (Message ID: ${info.messageId})`);
        
        res.json({ 
            success: true, 
            message: `Email successfully sent to ${studentName}!`,
            messageId: info.messageId
        });
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        res.status(500).json({ error: `Failed to send email: ${error.message}` });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'Server running', 
        database: dbReady ? 'ready' : 'initializing',
        timestamp: new Date().toISOString() 
    });
});

// Catch-all route - serve index.html for all other routes (SPA routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    closeDatabase();
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Course Dashboard Server running on http://localhost:${PORT}`);
    console.log(`💾 Data storage: SQLite Database (students.db)`);
    console.log(`📊 API Endpoints:`);
    console.log(`   GET  /api/students - Load students`);
    console.log(`   POST /api/students - Save students`);
    console.log(`   DELETE /api/students/:id - Delete student`);
    console.log(`   GET  /api/export - Export students`);
    console.log(`   GET  /api/health - Health check`);
});
