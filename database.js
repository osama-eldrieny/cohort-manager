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

            console.log('🔍 Checking environment variables:');
            console.log('   SUPABASE_URL:', supabaseUrl ? '✓ set' : '✗ missing');
            console.log('   SUPABASE_KEY:', supabaseKey ? '✓ set' : '✗ missing');

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
// Convert snake_case database columns to camelCase for frontend
function convertStudentFromDatabase(student) {
    return {
        id: student.id,
        name: student.name,
        email: student.email,
        cohort: student.cohort,
        status: student.status,
        location: student.location,
        linkedin: student.linkedin,
        whatsapp: student.whatsapp,
        figmaEmail: student.figma_email,  // ← Convert snake_case to camelCase
        language: student.language,
        totalAmount: student.total_amount,  // ← Convert snake_case to camelCase
        paidAmount: student.paid_amount,  // ← Convert snake_case to camelCase
        remaining: student.remaining,
        note: student.note,
        paymentMethod: student.payment_method,  // ← Convert snake_case to camelCase
        checklist: student.checklist ? (typeof student.checklist === 'string' ? JSON.parse(student.checklist) : student.checklist) : null,
        created_at: student.created_at,
        updated_at: student.updated_at
    };
}

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
            .order('name', { ascending: true });

        if (error) throw error;
        // Convert all students from snake_case to camelCase
        return (data || []).map(convertStudentFromDatabase);
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

        // Deduplicate by email - keep the last occurrence
        const seen = new Map();
        const deduplicatedStudents = [];
        
        for (const student of students) {
            if (student.email) {
                seen.set(student.email, student);
            } else {
                deduplicatedStudents.push(student);
            }
        }
        
        seen.forEach(student => {
            deduplicatedStudents.push(student);
        });

        // Prepare data for upsert - include ID to match existing records even when email changes
        const studentsData = deduplicatedStudents.map(student => {
            const data = {
                name: student.name || null,
                email: student.email || null,
                cohort: student.cohort || null,
                status: student.status || null,
                location: student.location || null,
                linkedin: student.linkedin || null,
                whatsapp: student.whatsapp || null,
                figma_email: student.figmaEmail || null,
                language: student.language || null,
                total_amount: parseFloat(student.totalAmount) || 0,
                paid_amount: parseFloat(student.paidAmount) || 0,
                remaining: parseFloat(student.remaining) || 0,
                note: student.note || null,
                payment_method: student.paymentMethod || null,
                checklist: student.checklist ? JSON.stringify(student.checklist) : null
            };
            
            // Include ID if present (for edits) - critical for matching existing records
            if (student.id) {
                data.id = student.id;
            }
            
            return data;
        });

        // UPSERT: Match on ID first (for existing records), then fall back to email for new records
        const { error: upsertError } = await supabase
            .from('students')
            .upsert(studentsData, { onConflict: 'id' }); // Changed from 'email' to 'id'

        if (upsertError) throw upsertError;

        console.log(`✅ Saved ${deduplicatedStudents.length} students to Supabase (deduplicated from ${students.length})`);
        console.log(`📝 Upsert strategy: Matching on ID (for updates including email changes), fallback to email for new records`);
        return { count: deduplicatedStudents.length };
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

            // Handle both string and numeric IDs
            const numericId = parseInt(id, 10);
            students = students.filter(s => {
                const studentId = typeof s.id === 'number' ? s.id : parseInt(s.id, 10);
                const searchId = isNaN(numericId) ? id : numericId;
                return s.id !== searchId && String(s.id) !== String(id);
            });
            fs.writeFileSync(studentsPath, JSON.stringify(students, null, 2));
            console.log(`✅ Student deleted from JSON file (local fallback) - ID: ${id}`);
            return;
        }

        // Parse ID to handle both string and number types
        const numericId = parseInt(id, 10);
        const finalId = isNaN(numericId) ? id : numericId;

        console.log(`🗑️ Deleting student ID: ${id} (parsed as: ${finalId}, type: ${typeof finalId})`);

        const { data, error } = await supabase
            .from('students')
            .delete()
            .eq('id', finalId)
            .select(); // Select deleted rows for confirmation

        if (error) {
            console.error('❌ Supabase delete error:', error);
            throw error;
        }

        if (data && data.length > 0) {
            console.log(`✅ Student ${id} deleted from Supabase (${data.length} row(s) deleted)`);
        } else {
            console.log(`⚠️ No student found with ID ${id} in Supabase - may have been deleted already`);
        }
    } catch (error) {
        console.error('❌ Error deleting student:', error.message);
        throw error;
    }
}

// Delete student by email (for handling email changes during edit)
export async function deleteStudentByEmail(email) {
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

            students = students.filter(s => s.email !== email);
            fs.writeFileSync(studentsPath, JSON.stringify(students, null, 2));
            console.log(`✅ Student with email ${email} deleted from JSON file (local fallback)`);
            return;
        }

        const { error } = await supabase
            .from('students')
            .delete()
            .eq('email', email);

        if (error) throw error;
        console.log(`✅ Student with email ${email} deleted from Supabase`);
    } catch (error) {
        console.error('❌ Error deleting student by email:', error.message);
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
                id,
                name,
                button_label,
                subject,
                body
            }, {
                onConflict: 'id'
            });

        if (error) throw error;
        console.log(`✅ Email template "${name}" saved to Supabase (UPSERT on ID to prevent duplicates when name changes)`);
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

// ============================================
// EMAIL LOGS FUNCTIONS (Supabase Database)
// ============================================

// Save email log to database
export async function logEmailSentToDB(studentId, templateId, templateName, status = 'sent') {
    try {
        if (!supabase) {
            // Fallback to JSON file for local development
            console.warn('⚠️ Supabase not available, email log not saved to database');
            return;
        }

        const { error } = await supabase
            .from('email_logs')
            .insert({
                student_id: studentId,
                template_id: templateId,
                template_name: templateName,
                status: status,
                created_at: new Date().toISOString()
            });

        if (error) throw error;
        console.log(`💾 Email log saved to Supabase: Student ${studentId}, Template: ${templateName}, Status: ${status}`);
    } catch (error) {
        console.error('❌ Error saving email log to database:', error.message);
        throw error;
    }
}

// Get email logs for a specific student from database
export async function getEmailLogsFromDB(studentId) {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available, returning empty logs');
            return [];
        }

        // Convert studentId to number to match database BIGINT type
        const numericStudentId = parseInt(studentId, 10);
        
        if (isNaN(numericStudentId)) {
            console.warn(`⚠️ Invalid student ID: ${studentId}`);
            return [];
        }

        const { data, error } = await supabase
            .from('email_logs')
            .select('*')
            .eq('student_id', numericStudentId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        console.log(`📋 Retrieved ${(data || []).length} email logs for student ${numericStudentId}`);
        return data || [];
    } catch (error) {
        console.error('❌ Error fetching email logs from database:', error.message);
        throw error;
    }
}

// Get all email logs from database (admin/reporting)
export async function getAllEmailLogsFromDB() {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available, returning empty logs');
            return [];
        }

        const { data, error } = await supabase
            .from('email_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        console.log(`📋 Retrieved ${(data || []).length} total email logs`);
        return data || [];
    } catch (error) {
        console.error('❌ Error fetching all email logs:', error.message);
        throw error;
    }
}

// Delete email logs for a student (when deleting student)
export async function deleteEmailLogsForStudent(studentId) {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available, email logs not deleted');
            return;
        }

        const { error } = await supabase
            .from('email_logs')
            .delete()
            .eq('student_id', studentId);

        if (error) throw error;
        console.log(`🗑️ Deleted email logs for student ${studentId}`);
    } catch (error) {
        console.error('❌ Error deleting email logs:', error.message);
        throw error;
    }
}

// Initialize column preferences table
export async function initializeColumnPreferencesTable() {
    try {
        if (!supabase) return;

        // Try to fetch a record to verify table exists
        // If it doesn't exist, the API will handle it gracefully
        const { error } = await supabase
            .from('user_preferences')
            .select('id', { count: 'exact', head: true });

        if (error) {
            // Table doesn't exist yet - log a message but don't fail
            // User can create it manually via Supabase dashboard if needed
            console.log('ℹ️  user_preferences table not found in Supabase (will be created on first use)');
            return;
        }

        console.log('✅ Column preferences table ready');
    } catch (error) {
        console.warn('ℹ️  Could not verify column preferences table:', error.message);
    }
}

// Get column preferences for a page
export async function getColumnPreferences(pageId) {
    try {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('user_preferences')
            .select('visible_columns')
            .eq('page_id', pageId)
            .single();

        // If table doesn't exist or record not found, return null gracefully
        if (error) {
            if (error.code === 'PGRST116') {
                // Record not found (table might exist)
                return null;
            }
            if (error.code === '42P01' || error.message.includes('does not exist')) {
                // Table doesn't exist - log once and return null
                console.warn('ℹ️  user_preferences table does not exist yet. Please run migration SQL.');
                return null;
            }
            // Other errors
            console.warn('Warning fetching column preferences:', error.message);
            return null;
        }

        return data?.visible_columns || null;
    } catch (error) {
        console.warn('Could not fetch column preferences:', error.message);
        return null;
    }
}

// Save column preferences for a page
export async function saveColumnPreferences(pageId, visibleColumns) {
    try {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('user_preferences')
            .upsert(
                {
                    page_id: pageId,
                    visible_columns: visibleColumns,
                    updated_at: new Date().toISOString()
                },
                { onConflict: 'page_id' }
            )
            .select()
            .single();

        if (error) {
            if (error.code === '42P01' || error.message.includes('does not exist')) {
                // Table doesn't exist - log message
                console.warn('ℹ️  user_preferences table does not exist. Please run migration SQL to create it.');
                return null;
            }
            throw error;
        }

        return data;
    } catch (error) {
        console.warn('Could not save column preferences:', error.message);
        return null;
    }
}

// Delete column preferences for a page (reset to defaults)
export async function deleteColumnPreferences(pageId) {
    try {
        if (!supabase) return null;

        const { error } = await supabase
            .from('user_preferences')
            .delete()
            .eq('page_id', pageId);

        if (error) {
            if (error.code === '42P01' || error.message.includes('does not exist')) {
                // Table doesn't exist - graceful handling
                return true;
            }
            throw error;
        }
        
        return true;
    } catch (error) {
        console.warn('Could not delete column preferences:', error.message);
        return false;
    }
}

// Get all column preferences
export async function getAllColumnPreferences() {
    try {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
            if (error.code === '42P01' || error.message.includes('does not exist')) {
                // Table doesn't exist - return empty array
                console.warn('ℹ️  user_preferences table does not exist yet');
                return [];
            }
            throw error;
        }

        return data || [];
    } catch (error) {
        console.warn('Could not fetch all column preferences:', error.message);
        return [];
    }
}

// Close database connection
export function closeDatabase() {
    // Supabase client doesn't need explicit closing
    console.log('✅ Supabase connection closed');
}
