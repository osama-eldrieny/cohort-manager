import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
    initializeDatabase, 
    getAllStudents, 
    saveAllStudents, 
    deleteStudent,
    exportData,
    closeDatabase 
} from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;
const DATA_FILE = path.join(__dirname, 'students.json');

// Middleware
app.use(cors());
app.use(express.json());
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
