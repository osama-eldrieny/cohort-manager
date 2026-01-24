import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let supabase = null;
const STUDENTS_JSON = path.join(__dirname, 'students.json');

// Initialize Supabase client
export function initializeDatabase() {
    return new Promise((resolve, reject) => {
        try {
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_KEY;

            if (!supabaseUrl || !supabaseKey) {
                console.log('⚠️  Supabase credentials not found. Using local SQLite fallback.');
                resolve(null);
                return;
            }

            supabase = createClient(supabaseUrl, supabaseKey);
            console.log('✅ Connected to Supabase PostgreSQL database');
            resolve(supabase);
        } catch (error) {
            console.error('❌ Error initializing Supabase:', error.message);
            reject(error);
        }
    });
}

// Get all students
export async function getAllStudents() {
    try {
        if (!supabase) {
            // Fallback to JSON file
            try {
                const data = fs.readFileSync(STUDENTS_JSON, 'utf-8');
                return JSON.parse(data);
            } catch (err) {
                console.log('ℹ️  No students data found');
                return [];
            }
        }

        const { data, error } = await supabase
            .from('students')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error fetching students:', error.message);
        throw error;
    }
}

// Save all students
export async function saveAllStudents(students) {
    try {
        if (!supabase) {
            // Fallback to JSON file
            const studentsPath = path.join(__dirname, 'students.json');
            fs.writeFileSync(studentsPath, JSON.stringify(students, null, 2));
            console.log(`✅ Saved ${students.length} students to JSON file (local fallback)`);
            return { count: students.length };
        }

        // Prepare data for insert/update
        const studentsData = students.map(student => ({
            name: student.name || null,
            email: student.email || null,
            cohort: student.cohort || null,
            status: student.status || null,
            location: student.location || null,
        }));

        // Clear existing and insert new
        const { error: deleteError } = await supabase
            .from('students')
            .delete()
            .neq('id', -1); // Delete all

        if (deleteError && deleteError.code !== 'PGRST116') {
            throw deleteError;
        }

        const { error: insertError } = await supabase
            .from('students')
            .insert(studentsData);

        if (insertError) throw insertError;

        console.log(`✅ Saved ${students.length} students to Supabase`);
        return { count: students.length };
    } catch (error) {
        console.error('❌ Error saving students:', error.message);
        throw error;
    }
}

// Delete student
export async function deleteStudent(id) {
    try {
        if (!supabase) {
            // Fallback to JSON file
            const studentsPath = path.join(__dirname, 'students.json');
            let students = [];

            try {
                const data = fs.readFileSync(studentsPath, 'utf-8');
                students = JSON.parse(data);
            } catch {
                students = [];
            }

            students = students.filter(s => s.id !== id);
            fs.writeFileSync(studentsPath, JSON.stringify(students, null, 2));
            console.log(`✅ Student deleted from JSON file (local fallback)`);
            return;
        }

        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', id);

        if (error) throw error;
        console.log(`✅ Student ${id} deleted from Supabase`);
    } catch (error) {
        console.error('❌ Error deleting student:', error.message);
        throw error;
    }
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

// Get all email templates
export async function getAllEmailTemplates() {
    try {
        if (!supabase) {
            // Fallback to JSON file
            try {
                const templatesPath = path.join(__dirname, 'email_templates.json');
                const data = fs.readFileSync(templatesPath, 'utf-8');
                return JSON.parse(data);
            } catch (err) {
                console.log('ℹ️  No email templates found');
                return [];
            }
        }

        const { data, error } = await supabase
            .from('email_templates')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error fetching email templates:', error.message);
        throw error;
    }
}

// Save email template
export async function saveEmailTemplate(id, name, button_label, subject, body) {
    try {
        if (!supabase) {
            // Fallback to JSON file
            const templatesPath = path.join(__dirname, 'email_templates.json');
            let templates = [];

            try {
                const data = fs.readFileSync(templatesPath, 'utf-8');
                templates = JSON.parse(data);
            } catch {
                templates = [];
            }

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

            fs.writeFileSync(templatesPath, JSON.stringify(templates, null, 2));
            console.log('✅ Email template saved to JSON file (local fallback)');
            return;
        }

        const { error } = await supabase
            .from('email_templates')
            .upsert({
                name,
                subject,
                body
            }, {
                onConflict: 'name'
            });

        if (error) throw error;
        console.log(`✅ Email template "${name}" saved to Supabase`);
    } catch (error) {
        console.error('❌ Error saving email template:', error.message);
        throw error;
    }
}

// Delete email template
export async function deleteEmailTemplate(id) {
    try {
        if (!supabase) {
            // Fallback to JSON file
            const templatesPath = path.join(__dirname, 'email_templates.json');
            let templates = [];

            try {
                const data = fs.readFileSync(templatesPath, 'utf-8');
                templates = JSON.parse(data);
            } catch {
                templates = [];
            }

            templates = templates.filter(t => t.id !== id);
            fs.writeFileSync(templatesPath, JSON.stringify(templates, null, 2));
            console.log('✅ Email template deleted from JSON file (local fallback)');
            return;
        }

        const { error } = await supabase
            .from('email_templates')
            .delete()
            .eq('id', id);

        if (error) throw error;
        console.log(`✅ Email template deleted from Supabase`);
    } catch (error) {
        console.error('❌ Error deleting email template:', error.message);
        throw error;
    }
}

// Export email templates to JSON
export async function exportEmailTemplatesToJson() {
    try {
        const templates = await getAllEmailTemplates();
        const templatesPath = path.join(__dirname, 'email_templates.json');
        fs.writeFileSync(templatesPath, JSON.stringify(templates, null, 2));
        console.log('✅ Email templates exported to JSON');
        return templates;
    } catch (error) {
        console.error('❌ Error exporting email templates:', error.message);
        throw error;
    }
}

// Close database connection
export function closeDatabase() {
    // Supabase client doesn't need explicit closing
    console.log('✅ Supabase connection closed');
}
