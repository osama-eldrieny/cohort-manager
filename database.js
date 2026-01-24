import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'students.db');
const STUDENTS_JSON = path.join(__dirname, 'students.json');

let db = null;
let isServerless = false; // Flag to track if we're in serverless environment

// Initialize database
export function initializeDatabase() {
    return new Promise((resolve, reject) => {
        try {
            // Check if we're in a serverless environment (Vercel, etc)
            // In serverless, we won't have persistent storage for SQLite
            if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
                isServerless = true;
                console.log('ℹ️  Serverless environment detected - using JSON file fallback');
                resolve(null);
                return;
            }
            
            db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) {
                    console.error('❌ Error opening database:', err.message);
                    reject(err);
                } else {
                    console.log('✅ Connected to SQLite database');
                    createTablesIfNotExist()
                        .then(() => resolve(db))
                        .catch(reject);
                }
            });
        } catch (error) {
            console.error('❌ Error initializing database:', error.message);
            console.log('⚠️  Falling back to JSON file storage');
            isServerless = true;
            resolve(null);
        }
    });
}

// Create tables if they don't exist
async function createTablesIfNotExist() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Create students table
            db.run(
                `CREATE TABLE IF NOT EXISTS students (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    linkedin TEXT,
                    whatsapp TEXT,
                    location TEXT,
                    language TEXT,
                    status TEXT,
                    cohort TEXT,
                    totalAmount REAL DEFAULT 0,
                    paidAmount REAL DEFAULT 0,
                    remaining REAL DEFAULT 0,
                    note TEXT,
                    paymentMethod TEXT,
                    checklist JSON,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
                (err) => {
                    if (err) {
                        console.error('❌ Error creating students table:', err.message);
                        reject(err);
                    } else {
                        console.log('✅ Students table ready');
                        
                        // Check if table is empty, if so load from JSON
                        loadFromJsonIfEmpty()
                            .then(() => resolve())
                            .catch(reject);
                    }
                }
            );

            // Create email templates table
            db.run(
                `CREATE TABLE IF NOT EXISTS email_templates (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    button_label TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    body TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
                (err) => {
                    if (err) {
                        console.error('❌ Error creating email_templates table:', err.message);
                    } else {
                        console.log('✅ Email templates table ready');
                    }
                }
            );
        });
    });
}

// Load data from JSON if database is empty
async function loadFromJsonIfEmpty() {
    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM students', async (err, row) => {
            if (err) {
                console.error('❌ Error checking student count:', err.message);
                reject(err);
                return;
            }

            if (row.count === 0 && fs.existsSync(STUDENTS_JSON)) {
                console.log('📥 Database is empty, loading data from students.json...');
                try {
                    const data = JSON.parse(fs.readFileSync(STUDENTS_JSON, 'utf-8'));
                    if (Array.isArray(data) && data.length > 0) {
                        for (const student of data) {
                            await insertStudent(student);
                        }
                        console.log(`✅ Loaded ${data.length} students from JSON into database`);
                    }
                    resolve();
                } catch (error) {
                    console.error('❌ Error loading from JSON:', error.message);
                    reject(error);
                }
            } else {
                resolve();
            }
        });
    });
}

// Get all students
export function getAllStudents() {
    return new Promise((resolve, reject) => {
        // If in serverless environment, read from JSON
        if (isServerless) {
            try {
                const data = fs.readFileSync(STUDENTS_JSON, 'utf-8');
                resolve(JSON.parse(data));
            } catch (err) {
                console.error('❌ Error reading students from JSON:', err.message);
                resolve([]); // Return empty array on error
            }
            return;
        }

        // Otherwise use database
        if (!db) {
            resolve([]);
            return;
        }

        db.all('SELECT * FROM students ORDER BY updated_at DESC', (err, rows) => {
            if (err) {
                console.error('❌ Error fetching students:', err.message);
                reject(err);
            } else {
                // Parse checklist JSON strings back to objects
                const students = rows.map(row => ({
                    ...row,
                    checklist: row.checklist ? JSON.parse(row.checklist) : undefined
                }));
                resolve(students);
            }
        });
    });
}

// Insert or update student
async function insertStudent(student) {
    return new Promise((resolve, reject) => {
        const checklistJson = student.checklist ? JSON.stringify(student.checklist) : null;
        
        db.run(
            `INSERT OR REPLACE INTO students 
            (id, name, email, linkedin, whatsapp, location, language, status, cohort, 
             totalAmount, paidAmount, remaining, note, paymentMethod, checklist, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [
                student.id,
                student.name,
                student.email,
                student.linkedin || null,
                student.whatsapp || null,
                student.location || null,
                student.language || null,
                student.status || null,
                student.cohort || null,
                student.totalAmount || 0,
                student.paidAmount || 0,
                student.remaining || 0,
                student.note || null,
                student.paymentMethod || null,
                checklistJson
            ],
            (err) => {
                if (err) {
                    console.error('❌ Error inserting student:', err.message);
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
}

// Save all students
export async function saveAllStudents(students) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION', (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                let completed = 0;
                let hasError = false;

                students.forEach((student, index) => {
                    if (hasError) return;

                    const checklistJson = student.checklist ? JSON.stringify(student.checklist) : null;
                    
                    db.run(
                        `INSERT OR REPLACE INTO students 
                        (id, name, email, linkedin, whatsapp, location, language, status, cohort, 
                         totalAmount, paidAmount, remaining, note, paymentMethod, checklist, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                        [
                            student.id,
                            student.name,
                            student.email,
                            student.linkedin || null,
                            student.whatsapp || null,
                            student.location || null,
                            student.language || null,
                            student.status || null,
                            student.cohort || null,
                            student.totalAmount || 0,
                            student.paidAmount || 0,
                            student.remaining || 0,
                            student.note || null,
                            student.paymentMethod || null,
                            checklistJson
                        ],
                        (err) => {
                            if (err) {
                                hasError = true;
                                reject(err);
                            } else {
                                completed++;
                                if (completed === students.length) {
                                    db.run('COMMIT', (err) => {
                                        if (err) {
                                            reject(err);
                                        } else {
                                            resolve({ count: students.length });
                                        }
                                    });
                                }
                            }
                        }
                    );
                });

                if (students.length === 0) {
                    db.run('COMMIT', (err) => {
                        if (err) reject(err);
                        else resolve({ count: 0 });
                    });
                }
            });
        });
    });
}

// Delete student
export function deleteStudent(id) {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM students WHERE id = ?', [id], (err) => {
            if (err) {
                console.error('❌ Error deleting student:', err.message);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// Export data
export async function exportData() {
    try {
        const students = await getAllStudents();
        return students;
    } catch (error) {
        console.error('❌ Error exporting data:', error.message);
        throw error;
    }
}

// Close database connection
export function closeDatabase() {
    if (db) {
        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err.message);
            } else {
                console.log('✅ Database connection closed');
            }
        });
    }
}

// Email template functions
export function getAllEmailTemplates() {
    return new Promise((resolve, reject) => {
        // If in serverless environment, read from JSON
        if (isServerless) {
            try {
                const templatesPath = path.join(__dirname, 'email_templates.json');
                const data = fs.readFileSync(templatesPath, 'utf-8');
                resolve(JSON.parse(data));
            } catch (err) {
                console.log('ℹ️  No email templates file found, returning empty array');
                resolve([]); // Return empty array on error
            }
            return;
        }

        // Otherwise use database
        if (!db) {
            resolve([]);
            return;
        }

        db.all('SELECT * FROM email_templates ORDER BY created_at ASC', (err, rows) => {
            if (err) {
                console.error('❌ Error fetching email templates:', err.message);
                reject(err);
            } else {
                resolve(rows || []);
            }
        });
    });
}

export function saveEmailTemplate(id, name, button_label, subject, body) {
    return new Promise((resolve, reject) => {
        // If in serverless environment, save to JSON
        if (isServerless || !db) {
            try {
                const templatesPath = path.join(__dirname, 'email_templates.json');
                let templates = [];
                
                // Read existing templates
                try {
                    const data = fs.readFileSync(templatesPath, 'utf-8');
                    templates = JSON.parse(data);
                } catch {
                    templates = [];
                }
                
                // Find and update or add new template
                const existingIndex = templates.findIndex(t => t.id === id);
                const newTemplate = {
                    id,
                    name,
                    button_label,
                    subject,
                    body,
                    updated_at: new Date().toISOString(),
                    created_at: existingIndex >= 0 ? templates[existingIndex].created_at : new Date().toISOString()
                };
                
                if (existingIndex >= 0) {
                    templates[existingIndex] = newTemplate;
                } else {
                    templates.push(newTemplate);
                }
                
                // Save back to JSON
                fs.writeFileSync(templatesPath, JSON.stringify(templates, null, 2));
                console.log('✅ Email template saved to JSON file');
                resolve();
            } catch (err) {
                console.error('❌ Error saving email template to JSON:', err.message);
                reject(err);
            }
            return;
        }

        // Otherwise use database
        db.run(
            `INSERT OR REPLACE INTO email_templates (id, name, button_label, subject, body, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [id, name, button_label, subject, body],
            (err) => {
                if (err) {
                    console.error('❌ Error saving email template:', err.message);
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
}

export function deleteEmailTemplate(id) {
    return new Promise((resolve, reject) => {
        // If in serverless environment, delete from JSON
        if (isServerless || !db) {
            try {
                const templatesPath = path.join(__dirname, 'email_templates.json');
                let templates = [];
                
                // Read existing templates
                try {
                    const data = fs.readFileSync(templatesPath, 'utf-8');
                    templates = JSON.parse(data);
                } catch {
                    templates = [];
                }
                
                // Filter out the template to delete
                templates = templates.filter(t => t.id !== id);
                
                // Save back to JSON
                fs.writeFileSync(templatesPath, JSON.stringify(templates, null, 2));
                console.log('✅ Email template deleted from JSON file');
                resolve();
            } catch (err) {
                console.error('❌ Error deleting email template from JSON:', err.message);
                reject(err);
            }
            return;
        }

        // Otherwise use database
        db.run('DELETE FROM email_templates WHERE id = ?', [id], (err) => {
            if (err) {
                console.error('❌ Error deleting email template:', err.message);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// Export email templates to JSON file
export async function exportEmailTemplatesToJson() {
    try {
        // In serverless environment, skip file export (data is already in JSON file)
        if (isServerless) {
            console.log('ℹ️  Serverless mode - skipping file export (data saved to JSON)');
            const templates = await getAllEmailTemplates();
            return templates;
        }

        const templates = await getAllEmailTemplates();
        const templatesPath = path.join(__dirname, 'email_templates.json');
        fs.writeFileSync(templatesPath, JSON.stringify(templates, null, 2));
        console.log('✅ Email templates exported to email_templates.json');
        return templates;
    } catch (error) {
        console.error('❌ Error exporting email templates:', error.message);
        throw error;
    }
}
