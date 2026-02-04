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
    exportEmailTemplatesToJson,
    logEmailSentToDB,
    getEmailLogsFromDB,
    getAllEmailLogsFromDB,
    loginAdmin,
    createSessionToken,
    verifySessionToken,
    logoutSession,
    getAdminUserById,
    deleteEmailLogsForStudent,
    initializeColumnPreferencesTable,
    getColumnPreferences,
    saveColumnPreferences,
    deleteColumnPreferences,
    getAllColumnPreferences,
    getAllCohorts,
    createCohort,
    updateCohort,
    deleteCohort,
    getEmailTemplateCategories,
    saveEmailTemplateCategories,
    addEmailTemplateCategory,
    deleteEmailTemplateCategory,
    updateEmailTemplateCategory,
    getChecklistItems,
    saveChecklistItems,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    getStudentChecklistCompletion,
    saveStudentChecklistCompletion,
    authenticateStudent,
    createStudentSessionToken,
    verifyStudentSessionToken,
    getStudentById,
    logoutStudentSession,
    setStudentPassword,
    getStudentPassword
} from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;
const DATA_FILE = path.join(__dirname, 'students.json');

// Email logs are now stored in Supabase database, not in file

// ============================================
// EMAIL LOGGING (Uses Supabase Database)
// ============================================

// Note: Email logs are now stored in Supabase database
// Legacy file-based functions removed in favor of database storage
// See database.js for: logEmailSentToDB(), getEmailLogsFromDB()


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

// Middleware - Enable CORS for all origins (important for Vercel)
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
        'https://osama-eldrieny.github.io',
        'http://localhost:3000',
        'http://localhost:3002',
        'http://localhost:8000',
        'http://localhost:5173'
    ];
    
    // Always allow if origin is in our list
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    } else {
        // For other origins, set to *
        res.header('Access-Control-Allow-Origin', '*');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

// Also use cors middleware as backup
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            'https://osama-eldrieny.github.io',
            'http://localhost:3000',
            'https://cohort-manager-bao4aij45-osama-eldrienys-projects.vercel.app',
            'http://localhost:8000',
            'http://localhost:5173'
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

// Initialize database on startup (non-blocking for Vercel)
let dbReady = false;
let dbInitError = null;
(async () => {
    try {
        global.supabase = await initializeDatabase();
        await initializeColumnPreferencesTable();
        dbReady = true;
        console.log('🔧 Database initialization complete');
    } catch (error) {
        console.error('❌ Failed to initialize database:', error.message);
        dbInitError = error;
        // Don't exit - let the API handle gracefully
    }
})();

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Course Dashboard API Server', status: 'running' });
});

// Add a health check endpoint
app.get('/api/health', (req, res) => {
    if (dbReady) {
        res.json({ status: 'OK', database: 'ready' });
    } else if (dbInitError) {
        res.status(503).json({ status: 'ERROR', database: 'failed', error: dbInitError.message });
    } else {
        res.json({ status: 'initializing', database: 'pending' });
    }
});

// GET /api/students - Load all students
app.get('/api/students', async (req, res) => {
    try {
        if (!dbReady) {
            console.log('⚠️  Database not ready, attempting to read from JSON file');
            try {
                const data = fs.readFileSync(DATA_FILE, 'utf8');
                return res.json(JSON.parse(data));
            } catch (fileError) {
                return res.status(503).json({ error: 'Database not ready and cannot read from file' });
            }
        }
        const students = await getAllStudents();
        res.json(students);
    } catch (error) {
        console.error('❌ Error fetching students:', error.message);
        // Fallback to JSON file
        try {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            res.json(JSON.parse(data));
        } catch {
            res.status(500).json({ error: 'Failed to fetch students' });
        }
    }
});

// POST /api/students - Save all students or delete by email
app.post('/api/students', async (req, res) => {
    try {
        const body = req.body;
        
        // Handle delete by email request
        if (body.deleteByEmail) {
            await deleteStudentByEmail(body.deleteByEmail);
            console.log(`✅ Deleted student with email: ${body.deleteByEmail}`);
            return res.json({ success: true, message: 'Student deleted successfully' });
        }
        
        // Handle save students - can be array or single object
        const studentsToSave = Array.isArray(body) ? body : [body];
        
        const result = await saveAllStudents(studentsToSave);
        console.log(`✅ Auto-saved ${result.count} students to database`);
        res.json({ 
            success: true, 
            count: result.count,
            message: 'Students saved successfully to database'
        });
    } catch (error) {
        console.error('❌ Error saving students:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to save students: ' + error.message });
    }
});

// DELETE /api/students/:id - Delete a student
app.delete('/api/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ DELETE request for student ID: ${id}`);
        await deleteStudent(id);
        console.log(`✅ Deleted student with ID: ${id}`);
        res.json({ success: true, message: 'Student deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting student:', error.message);
        res.status(500).json({ error: 'Failed to delete student: ' + error.message });
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
        if (!dbReady) {
            console.log('⚠️  Database not ready, attempting to read from JSON file');
            try {
                const templatesPath = path.join(__dirname, 'email_templates.json');
                const data = fs.readFileSync(templatesPath, 'utf8');
                return res.json(JSON.parse(data));
            } catch (fileError) {
                return res.json([]); // Return empty array if file doesn't exist
            }
        }
        const templates = await getAllEmailTemplates();
        res.json(templates);
    } catch (error) {
        console.error('❌ Error fetching email templates:', error.message);
        // Fallback to JSON file
        try {
            const templatesPath = path.join(__dirname, 'email_templates.json');
            const data = fs.readFileSync(templatesPath, 'utf8');
            res.json(JSON.parse(data));
        } catch {
            res.json([]); // Return empty array if all else fails
        }
    }
});

// POST /api/email-templates - Save email template
app.post('/api/email-templates', async (req, res) => {
    try {
        const { id, name, category, button_label, subject, body } = req.body;
        
        if (!id || !name || !button_label || !subject || !body) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        console.log(`📝 Saving email template: ${name} (ID: ${id}) in category: ${category}`);
        
        await saveEmailTemplate(id, name, category, button_label, subject, body);
        
        // Auto-export to JSON after saving
        try {
            await exportEmailTemplatesToJson();
        } catch (exportError) {
            console.warn('⚠️  Export to JSON failed, but template saved to database');
        }
        
        res.json({ success: true, message: 'Email template saved successfully' });
    } catch (error) {
        console.error('❌ Error saving email template:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to save email template: ' + error.message });
    }
});

// DELETE /api/email-templates/:id - Delete email template
app.delete('/api/email-templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🗑️  Deleting email template: ${id}`);
        await deleteEmailTemplate(id);
        
        // Auto-export to JSON after deleting (skipped in serverless)
        try {
            await exportEmailTemplatesToJson();
        } catch (exportError) {
            console.warn('⚠️  Export to JSON skipped (serverless or file system issue), but template deleted');
        }
        
        res.json({ success: true, message: 'Email template deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting email template:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to delete email template: ' + error.message });
    }
});

// GET /api/email-template-categories - Get all email template categories
app.get('/api/email-template-categories', async (req, res) => {
    try {
        const categories = await getEmailTemplateCategories();
        res.json(categories);
    } catch (error) {
        console.error('❌ Error fetching email template categories:', error.message);
        res.status(500).json({ error: 'Failed to fetch email template categories' });
    }
});

// POST /api/email-template-categories - Add new email template category
app.post('/api/email-template-categories', async (req, res) => {
    try {
        const { categoryName } = req.body;
        
        if (!categoryName || !categoryName.trim()) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        
        const categories = await addEmailTemplateCategory(categoryName.trim());
        res.json({ success: true, categories });
    } catch (error) {
        console.error('❌ Error adding email template category:', error.message);
        res.status(500).json({ error: error.message || 'Failed to add email template category' });
    }
});

// DELETE /api/email-template-categories/:categoryName - Delete email template category
app.delete('/api/email-template-categories/:categoryName', async (req, res) => {
    try {
        const { categoryName } = req.params;
        
        if (!categoryName) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        
        const categories = await deleteEmailTemplateCategory(decodeURIComponent(categoryName));
        res.json({ success: true, categories });
    } catch (error) {
        console.error('❌ Error deleting email template category:', error.message);
        res.status(500).json({ error: error.message || 'Failed to delete email template category' });
    }
});

// PUT /api/email-template-categories/:oldName - Update email template category name
app.put('/api/email-template-categories/:oldName', async (req, res) => {
    try {
        const { oldName } = req.params;
        const { newName } = req.body;
        
        if (!oldName || !newName || !newName.trim()) {
            return res.status(400).json({ error: 'Category names are required' });
        }
        
        const categories = await updateEmailTemplateCategory(decodeURIComponent(oldName), newName.trim());
        res.json({ success: true, categories });
    } catch (error) {
        console.error('❌ Error updating email template category:', error.message);
        res.status(500).json({ error: error.message || 'Failed to update email template category' });
    }
});

// ============================================
// STUDENT CHECKLIST API ENDPOINTS
// ============================================

// GET /api/checklist-items - Get all checklist items
app.get('/api/checklist-items', async (req, res) => {
    try {
        const items = await getChecklistItems();
        res.json(items);
    } catch (error) {
        console.error('❌ Error fetching checklist items:', error.message);
        res.status(500).json({ error: 'Failed to fetch checklist items' });
    }
});

// POST /api/checklist-items - Add new checklist item
app.post('/api/checklist-items', async (req, res) => {
    try {
        const { category, label, sort_position } = req.body;
        
        if (!category || !label) {
            return res.status(400).json({ error: 'Category and label are required' });
        }
        
        const item = await addChecklistItem(category, label, sort_position);
        res.json({ success: true, item });
    } catch (error) {
        console.error('❌ Error adding checklist item:', error.message);
        res.status(500).json({ error: error.message || 'Failed to add checklist item' });
    }
});

// PUT /api/checklist-items/:id - Update checklist item
app.put('/api/checklist-items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { category, label, sort_position } = req.body;
        
        if (!id) {
            return res.status(400).json({ error: 'Item ID is required' });
        }
        
        const item = await updateChecklistItem(parseInt(id), category, label, sort_position);
        res.json({ success: true, item });
    } catch (error) {
        console.error('❌ Error updating checklist item:', error.message);
        res.status(500).json({ error: error.message || 'Failed to update checklist item' });
    }
});

// DELETE /api/checklist-items/:id - Delete checklist item
app.delete('/api/checklist-items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ error: 'Item ID is required' });
        }
        
        await deleteChecklistItem(parseInt(id));
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error deleting checklist item:', error.message);
        res.status(500).json({ error: error.message || 'Failed to delete checklist item' });
    }
});

// GET /api/students/:id/checklist-completion - Get student checklist completion
app.get('/api/students/:id/checklist-completion', async (req, res) => {
    try {
        const { id } = req.params;
        const completion = await getStudentChecklistCompletion(id);
        res.json(completion);
    } catch (error) {
        console.error('❌ Error fetching checklist completion:', error.message);
        res.status(500).json({ error: 'Failed to fetch checklist completion' });
    }
});

// POST /api/students/:id/checklist-completion - Save student checklist completion
app.post('/api/students/:id/checklist-completion', async (req, res) => {
    try {
        const { id } = req.params;
        const { completedItemIds } = req.body;
        
        if (!Array.isArray(completedItemIds)) {
            return res.status(400).json({ error: 'completedItemIds must be an array' });
        }
        
        const completion = await saveStudentChecklistCompletion(id, completedItemIds);
        res.json({ success: true, completion });
    } catch (error) {
        console.error('❌ Error saving checklist completion:', error.message);
        res.status(500).json({ error: error.message || 'Failed to save checklist completion' });
    }
});

// POST /api/send-email - Send email to student
app.post('/api/send-email', async (req, res) => {
    try {
        const { studentId, studentEmail, studentName, templateId, templateName, subject, body } = req.body;
        
        if (!studentEmail || !templateId || !subject || !body) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const trimmedEmail = studentEmail.trim();
        if (!emailRegex.test(trimmedEmail)) {
            console.warn(`⚠️ Invalid email format: "${trimmedEmail}"`);
            await logEmailSentToDB(studentId, templateId, templateName, 'failed');
            return res.status(400).json({ error: `Invalid email format: "${trimmedEmail}"` });
        }
        
        // Check if Gmail is configured
        if (!transporter) {
            console.log(`📧 Email prepared for: ${studentName} <${trimmedEmail}>`);
            console.log(`Subject: ${subject}`);
            console.log(`⚠️  Gmail SMTP not configured. Set GMAIL_APP_PASSWORD environment variable.`);
            await logEmailSentToDB(studentId, templateId, templateName, 'failed');
            return res.status(503).json({ 
                success: false, 
                error: 'Email service not configured. Contact administrator.' 
            });
        }

        // Send email via Gmail SMTP
        const mailOptions = {
            from: `"Design Tokens Camp" <${SENDER_EMAIL}>`,
            to: trimmedEmail,
            subject: subject,
            html: `<pre style="font-family: Arial, sans-serif; white-space: pre-wrap; word-wrap: break-word;">${body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`
        };

        console.log(`📧 Email headers: From=${mailOptions.from}, To=${trimmedEmail}, Subject="${subject.substring(0, 50)}..."`);
        
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${studentName} <${trimmedEmail}>`);
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Response: ${info.response}`);
        
        // Log the email sent to Supabase database
        await logEmailSentToDB(studentId, templateId, templateName, 'sent');
        
        res.json({ 
            success: true, 
            message: `Email successfully sent to ${studentName}!`,
            messageId: info.messageId
        });
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        // Log the failed email to Supabase database
        const { studentId, templateId, templateName } = req.body;
        if (studentId && templateId) {
            await logEmailSentToDB(studentId, templateId, templateName, 'failed');
        }
        res.status(500).json({ 
            success: false,
            error: `Failed to send email: ${error.message}` 
        });
    }
});

// GET /api/email-logs/:studentId - Get email sending history for a student
app.get('/api/email-logs/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const logs = await getEmailLogsFromDB(studentId);
        console.log(`📋 Retrieved ${logs.length} email logs for student ${studentId}`);
        res.json(logs);
    } catch (error) {
        console.error('❌ Error fetching email logs:', error.message);
        res.status(500).json({ error: 'Failed to fetch email logs' });
    }
});

// ============================================
// COLUMN PREFERENCES ENDPOINTS
// ============================================

// GET /api/column-preferences/:pageId - Get column preferences for a page
app.get('/api/column-preferences/:pageId', async (req, res) => {
    try {
        const { pageId } = req.params;
        const preferences = await getColumnPreferences(pageId);
        res.json({ 
            pageId,
            visibleColumns: preferences,
            found: preferences !== null
        });
    } catch (error) {
        console.error('❌ Error fetching column preferences:', error.message);
        res.status(500).json({ error: 'Failed to fetch column preferences' });
    }
});

// POST /api/column-preferences - Save column preferences for a page
app.post('/api/column-preferences', async (req, res) => {
    try {
        const { pageId, visibleColumns } = req.body;
        
        if (!pageId || !Array.isArray(visibleColumns)) {
            return res.status(400).json({ 
                error: 'Missing or invalid pageId or visibleColumns' 
            });
        }

        const result = await saveColumnPreferences(pageId, visibleColumns);
        res.json({ 
            success: true,
            message: 'Column preferences saved',
            pageId,
            visibleColumns
        });
    } catch (error) {
        console.error('❌ Error saving column preferences:', error.message);
        res.status(500).json({ error: 'Failed to save column preferences' });
    }
});

// DELETE /api/column-preferences/:pageId - Delete column preferences (reset to defaults)
app.delete('/api/column-preferences/:pageId', async (req, res) => {
    try {
        const { pageId } = req.params;
        const success = await deleteColumnPreferences(pageId);
        
        if (success) {
            res.json({ 
                success: true,
                message: 'Column preferences reset to defaults',
                pageId
            });
        } else {
            res.status(500).json({ error: 'Failed to delete column preferences' });
        }
    } catch (error) {
        console.error('❌ Error deleting column preferences:', error.message);
        res.status(500).json({ error: 'Failed to delete column preferences' });
    }
});

// GET /api/column-preferences - Get all column preferences
app.get('/api/column-preferences', async (req, res) => {
    try {
        const allPreferences = await getAllColumnPreferences();
        res.json({ 
            success: true,
            count: allPreferences.length,
            preferences: allPreferences
        });
    } catch (error) {
        console.error('❌ Error fetching all column preferences:', error.message);
        res.status(500).json({ error: 'Failed to fetch column preferences' });
    }
});

// ============================================
// COHORTS API ROUTES
// ============================================

// Get all cohorts
app.get('/api/cohorts', async (req, res) => {
    try {
        const cohorts = await getAllCohorts();
        res.json(cohorts);
    } catch (error) {
        console.error('❌ Error fetching cohorts:', error);
        res.status(500).json({ error: 'Failed to fetch cohorts' });
    }
});

// Create a new cohort
app.post('/api/cohorts', async (req, res) => {
    try {
        const { name, description, icon, color } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Cohort name is required' });
        }
        
        const newCohort = await createCohort(name, description || '', icon || 'fa-map-pin', color || '#4ECDC4');
        res.status(201).json(newCohort);
    } catch (error) {
        console.error('❌ Error creating cohort:', error);
        res.status(500).json({ error: 'Failed to create cohort' });
    }
});

// Update a cohort
app.put('/api/cohorts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, icon, color } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Cohort name is required' });
        }
        
        const updated = await updateCohort(parseInt(id), name, description || '', icon || 'fa-map-pin', color || '#4ECDC4');
        if (!updated) {
            return res.status(404).json({ error: 'Cohort not found' });
        }
        res.json(updated);
    } catch (error) {
        console.error('❌ Error updating cohort:', error);
        res.status(500).json({ error: 'Failed to update cohort' });
    }
});

// Delete a cohort
app.delete('/api/cohorts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await deleteCohort(parseInt(id));
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error deleting cohort:', error);
        res.status(500).json({ error: 'Failed to delete cohort' });
    }
});

// ============================================
// COHORT LINKS ENDPOINTS
// ============================================

// Get all links for a cohort
app.get('/api/cohort-links/:cohortName', async (req, res) => {
    try {
        const { cohortName } = req.params;
        if (!global.supabase) {
            res.json([]);
            return;
        }
        
        const { data, error } = await global.supabase
            .from('cohort_links')
            .select('*')
            .eq('cohort_name', decodeURIComponent(cohortName))
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('❌ Error fetching cohort links:', error);
        res.status(500).json({ error: 'Failed to fetch links' });
    }
});

// Add a new link
app.post('/api/cohort-links', async (req, res) => {
    try {
        const { cohort_name, name, url } = req.body;
        console.log('📝 Adding cohort link:', { cohort_name, name, url });
        
        if (!global.supabase) {
            console.error('❌ Supabase not initialized');
            res.status(500).json({ error: 'Database not available' });
            return;
        }
        
        const { data, error } = await global.supabase
            .from('cohort_links')
            .insert([{ cohort_name, name, url }])
            .select();
        
        if (error) {
            console.error('❌ Supabase error:', error.message, error.code, error.details);
            throw error;
        }
        console.log('✅ Link added:', data);
        res.json(data[0]);
    } catch (error) {
        console.error('❌ Error adding cohort link:', error.message);
        res.status(500).json({ error: 'Failed to add link', details: error.message });
    }
});

// Update a link
app.put('/api/cohort-links/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, url } = req.body;
        if (!global.supabase) {
            res.status(500).json({ error: 'Database not available' });
            return;
        }
        
        const { data, error } = await global.supabase
            .from('cohort_links')
            .update({ name, url })
            .eq('id', parseInt(id))
            .select();
        
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('❌ Error updating cohort link:', error);
        res.status(500).json({ error: 'Failed to update link' });
    }
});

// Delete a link
app.delete('/api/cohort-links/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!global.supabase) {
            res.status(500).json({ error: 'Database not available' });
            return;
        }
        
        const { error } = await global.supabase
            .from('cohort_links')
            .delete()
            .eq('id', parseInt(id));
        
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error deleting cohort link:', error);
        res.status(500).json({ error: 'Failed to delete link' });
    }
});

// ============================================
// COHORT VIDEOS ENDPOINTS
// ============================================

// Get all videos for a cohort
app.get('/api/cohort-videos/:cohortName', async (req, res) => {
    try {
        const { cohortName } = req.params;
        if (!global.supabase) {
            res.json([]);
            return;
        }
        
        const { data, error } = await global.supabase
            .from('cohort_videos')
            .select('*')
            .eq('cohort_name', decodeURIComponent(cohortName))
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('❌ Error fetching cohort videos:', error);
        res.status(500).json({ error: 'Failed to fetch videos' });
    }
});

// Add a new video
app.post('/api/cohort-videos', async (req, res) => {
    try {
        const { cohort_name, name, thumbnail, url } = req.body;
        console.log('📹 Adding cohort video:', { cohort_name, name, thumbnail, url });
        
        if (!global.supabase) {
            console.error('❌ Supabase not initialized');
            res.status(500).json({ error: 'Database not available' });
            return;
        }
        
        const { data, error } = await global.supabase
            .from('cohort_videos')
            .insert([{ cohort_name, name, thumbnail, url }])
            .select();
        
        if (error) {
            console.error('❌ Supabase error:', error.message, error.code, error.details);
            throw error;
        }
        console.log('✅ Video added:', data);
        res.json(data[0]);
    } catch (error) {
        console.error('❌ Error adding cohort video:', error.message);
        res.status(500).json({ error: 'Failed to add video', details: error.message });
    }
});

// Update a video
app.put('/api/cohort-videos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, thumbnail, url } = req.body;
        if (!global.supabase) {
            res.status(500).json({ error: 'Database not available' });
            return;
        }
        
        const { data, error } = await global.supabase
            .from('cohort_videos')
            .update({ name, thumbnail, url })
            .eq('id', parseInt(id))
            .select();
        
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('❌ Error updating cohort video:', error);
        res.status(500).json({ error: 'Failed to update video' });
    }
});

// Delete a video
app.delete('/api/cohort-videos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!global.supabase) {
            res.status(500).json({ error: 'Database not available' });
            return;
        }
        
        const { error } = await global.supabase
            .from('cohort_videos')
            .delete()
            .eq('id', parseInt(id));
        
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error deleting cohort video:', error);
        res.status(500).json({ error: 'Failed to delete video' });
    }
});

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        // Login user
        const user = await loginAdmin(email, password);

        // Create session token
        const sessionToken = await createSessionToken(user.id);

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                isAdmin: user.is_admin
            },
            sessionToken
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Verify session endpoint
app.post('/api/auth/verify', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No session token' });
        }

        const sessionToken = authHeader.substring(7);

        // Verify session
        const userId = await verifySessionToken(sessionToken);

        // Get user details
        const user = await getAdminUserById(userId);

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                isAdmin: user.is_admin
            }
        });
    } catch (error) {
        console.error('❌ Session verification error:', error);
        res.status(401).json({ message: 'Invalid or expired session' });
    }
});

// Logout endpoint
app.post('/api/auth/logout', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(400).json({ message: 'No session token' });
        }

        const sessionToken = authHeader.substring(7);

        // Logout session
        await logoutSession(sessionToken);

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('❌ Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

// ============================================
// STUDENT AUTHENTICATION ENDPOINTS
// ============================================

// Student login endpoint
app.post('/api/student/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        // Authenticate student
        const student = await authenticateStudent(email, password);

        // Create student session token
        const sessionToken = await createStudentSessionToken(student.id);

        res.json({
            success: true,
            user: {
                id: student.id,
                email: student.email,
                name: student.name,
                cohort: student.cohort,
                figmaEmail: student.figmaEmail,
                totalAmount: student.totalAmount,
                paidAmount: student.paidAmount,
                remaining: student.remaining,
                isStudent: true
            },
            sessionToken
        });
    } catch (error) {
        console.error('❌ Student login error:', error);
        res.status(401).json({ message: 'Invalid email or password' });
    }
});

// Student verify session endpoint
app.post('/api/student/verify', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No session token' });
        }

        const sessionToken = authHeader.substring(7);

        // Verify student session
        const studentId = await verifyStudentSessionToken(sessionToken);

        // Get student details
        const student = await getStudentById(studentId);

        res.json({
            success: true,
            user: {
                id: student.id,
                email: student.email,
                name: student.name,
                cohort: student.cohort,
                figmaEmail: student.figmaEmail,
                totalAmount: student.totalAmount,
                paidAmount: student.paidAmount,
                remaining: student.remaining,
                isStudent: true
            }
        });
    } catch (error) {
        console.error('❌ Student session verification error:', error.message);
        res.status(401).json({ message: 'Invalid or expired session', error: error.message });
    }
});

// Student logout endpoint
app.post('/api/student/logout', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(400).json({ message: 'No session token' });
        }

        const sessionToken = authHeader.substring(7);

        // Logout student session
        await logoutStudentSession(sessionToken);

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('❌ Student logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

// Set student password (admin endpoint)
app.post('/api/admin/set-student-password', async (req, res) => {
    try {
        const { studentId, email, password } = req.body;

        if (!studentId || !email || !password) {
            return res.status(400).json({ message: 'Student ID, email, and password required' });
        }

        // Verify admin is logged in (check token in headers)
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Admin authentication required' });
        }

        const sessionToken = authHeader.substring(7);
        await verifySessionToken(sessionToken); // Will throw if invalid

        // Set student password
        await setStudentPassword(studentId, email, password);

        res.json({ success: true, message: 'Password set successfully' });
    } catch (error) {
        console.error('❌ Error setting student password:', error);
        res.status(500).json({ error: 'Failed to set password' });
    }
});

// Get student password for email templates
app.post('/api/admin/get-student-password', async (req, res) => {
    try {
        const { studentId, studentEmail } = req.body;

        if (!studentId || !studentEmail) {
            return res.status(400).json({ error: 'Student ID and email required' });
        }

        // Verify admin is logged in (check token in headers)
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Admin authentication required' });
        }

        const sessionToken = authHeader.substring(7);
        await verifySessionToken(sessionToken); // Will throw if invalid

        // Get student password from database
        const password = await getStudentPassword(studentId, studentEmail);
        
        if (!password) {
            return res.status(404).json({ error: 'Password not found for student' });
        }

        res.json({ success: true, password });
    } catch (error) {
        console.error('❌ Error retrieving student password:', error);
        res.status(500).json({ error: 'Failed to retrieve password' });
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
    const environment = process.env.VERCEL ? 'Vercel (Serverless)' : 
                       process.env.AWS_LAMBDA_FUNCTION_NAME ? 'AWS Lambda' : 'Local';
    
    console.log(`🚀 Course Dashboard Server running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${environment}`);
    console.log(`💾 Data storage: ${process.env.VERCEL ? 'JSON File (Serverless)' : 'SQLite Database'}`);
    console.log(`📊 API Endpoints:`);
    console.log(`   POST /api/auth/login - Login admin`);
    console.log(`   POST /api/auth/verify - Verify session`);
    console.log(`   POST /api/auth/logout - Logout admin`);
    console.log(`   GET  /api/students - Load students`);
    console.log(`   POST /api/students - Save students`);
    console.log(`   DELETE /api/students/:id - Delete student`);
    console.log(`   GET  /api/export - Export students`);
    console.log(`   GET  /api/health - Health check`);
});
