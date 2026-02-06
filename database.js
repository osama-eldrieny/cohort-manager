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
            throw new Error('Supabase not initialized. Cannot fetch students.');
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
            throw new Error('Supabase not initialized. Cannot save students.');
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
            .upsert(studentsData, { onConflict: 'id' });

        if (upsertError) throw upsertError;

        console.log(`✅ Saved ${deduplicatedStudents.length} students to Supabase (deduplicated from ${students.length})`);
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
            throw new Error('Supabase not initialized. Cannot delete student.');
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
            throw new Error('Supabase not initialized. Cannot delete student by email.');
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
            throw new Error('Supabase not initialized. Cannot fetch email templates.');
        }

        const { data, error } = await supabase
            .from('email_templates')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;
        console.log(`✅ Loaded ${data?.length || 0} email templates from Supabase`);
        return data || [];
    } catch (error) {
        console.error('❌ Error fetching email templates:', error.message);
        throw error;
    }
}

// Save email template
export async function saveEmailTemplate(id, name, category, button_label, subject, body) {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized. Cannot save email template.');
        }

        const { error } = await supabase
            .from('email_templates')
            .upsert({
                id,
                name,
                category,
                button_label,
                subject,
                body
            }, {
                onConflict: 'id'
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
            throw new Error('Supabase not initialized. Cannot delete email template.');
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

        if (error) {
            console.error('❌ Supabase error saving email log:', error.message);
            // Don't throw - just log the warning
            return;
        }
        console.log(`💾 Email log saved to Supabase: Student ${studentId}, Template: ${templateName}, Status: ${status}`);
    } catch (error) {
        console.error('❌ Error saving email log to database:', error.message);
        // Don't throw - just log it
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

// ============================================
// COHORT MANAGEMENT
// ============================================

export async function getAllCohorts() {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        const { data, error } = await supabase
            .from('cohorts')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;
        
        // Enrich cohorts with their links and videos
        const enrichedCohorts = await Promise.all(
            (data || []).map(async (cohort) => {
                const links = await getCohortLinks(cohort.name);
                const videos = await getCohortVideos(cohort.name);
                return {
                    ...cohort,
                    links: links || [],
                    videos: videos || []
                };
            })
        );
        
        return enrichedCohorts;
    } catch (error) {
        console.error('❌ Error fetching cohorts:', error.message);
        return [];
    }
}

export async function createCohort(name, description = '', icon = 'fa-map-pin', color = '#4ECDC4') {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        const { data, error } = await supabase
            .from('cohorts')
            .insert([{ name, description, icon, color }])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('❌ Error creating cohort:', error.message);
        throw error;
    }
}

export async function updateCohort(id, name, description = '', icon = 'fa-map-pin', color = '#4ECDC4') {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        // Get the old cohort name before updating
        const { data: oldCohortData, error: fetchError } = await supabase
            .from('cohorts')
            .select('name')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;
        const oldName = oldCohortData?.name;

        // If the name is being changed, update all students with the old cohort name
        if (oldName && oldName !== name) {
            const { error: updateStudentsError } = await supabase
                .from('students')
                .update({ cohort: name, updated_at: new Date().toISOString() })
                .eq('cohort', oldName);

            if (updateStudentsError) throw updateStudentsError;
            console.log(`✅ Updated ${oldName} → ${name} for all students in this cohort`);
        }

        // Update the cohort record itself
        const { data, error } = await supabase
            .from('cohorts')
            .update({ name, description, icon, color, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0] || null;
    } catch (error) {
        console.error('❌ Error updating cohort:', error.message);
        throw error;
    }
}

export async function deleteCohort(id) {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        const { error } = await supabase
            .from('cohorts')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('❌ Error deleting cohort:', error.message);
        throw error;
    }
}

// Email Template Categories
export async function getEmailTemplateCategories() {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        const { data, error } = await supabase
            .from('email_template_categories')
            .select('name')
            .order('created_at', { ascending: true });

        if (error) throw error;
        
        const categories = data.map(row => row.name);
        console.log(`✅ Loaded ${categories.length} email template categories from Supabase`);
        return categories;
    } catch (error) {
        console.error('❌ Error getting email template categories:', error.message);
        return ['Setup Templates', 'Resources & Tools', 'Payments & Completion'];
    }
}

export async function saveEmailTemplateCategories(categories) {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        // This function is deprecated - use addEmailTemplateCategory instead
        console.log('⚠️  saveEmailTemplateCategories is deprecated, use addEmailTemplateCategory');
        return categories;
    } catch (error) {
        console.error('❌ Error saving email template categories:', error.message);
        throw error;
    }
}

export async function addEmailTemplateCategory(categoryName) {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        if (!categoryName || typeof categoryName !== 'string') {
            throw new Error('Invalid category name');
        }

        // Check if category already exists
        const { data: existing, error: checkError } = await supabase
            .from('email_template_categories')
            .select('name')
            .eq('name', categoryName.trim());

        if (checkError) throw checkError;

        if (existing && existing.length > 0) {
            throw new Error(`Category "${categoryName}" already exists`);
        }

        const { error } = await supabase
            .from('email_template_categories')
            .insert({ name: categoryName });

        if (error) throw error;
        
        const categories = await getEmailTemplateCategories();
        console.log(`✅ Added new category: "${categoryName}"`);
        return categories;
    } catch (error) {
        console.error('❌ Error adding email template category:', error.message);
        throw error;
    }
}

export async function deleteEmailTemplateCategory(categoryName) {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        if (!categoryName || typeof categoryName !== 'string') {
            throw new Error('Invalid category name');
        }

        const { error } = await supabase
            .from('email_template_categories')
            .delete()
            .eq('name', categoryName);

        if (error) throw error;
        
        const categories = await getEmailTemplateCategories();
        console.log(`✅ Deleted category: "${categoryName}"`);
        return categories;
    } catch (error) {
        console.error('❌ Error deleting email template category:', error.message);
        throw error;
    }
}

export async function updateEmailTemplateCategory(oldCategoryName, newCategoryName) {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        if (!oldCategoryName || !newCategoryName || typeof oldCategoryName !== 'string' || typeof newCategoryName !== 'string') {
            throw new Error('Invalid category names');
        }

        if (oldCategoryName === newCategoryName) {
            return await getEmailTemplateCategories();
        }

        // Update in email_template_categories table
        const { error: updateError } = await supabase
            .from('email_template_categories')
            .update({ name: newCategoryName })
            .eq('name', oldCategoryName);

        if (updateError) throw updateError;

        // Also update templates that reference this category
        const { error: templateError } = await supabase
            .from('email_templates')
            .update({ category: newCategoryName })
            .eq('category', oldCategoryName);

        if (templateError) throw templateError;
        
        const categories = await getEmailTemplateCategories();
        console.log(`✅ Renamed category: "${oldCategoryName}" → "${newCategoryName}"`);
        return categories;
    } catch (error) {
        console.error('❌ Error updating email template category:', error.message);
        throw error;
    }
}

// ============================================
// STUDENT CHECKLIST MANAGEMENT
// ============================================

// Get all checklist items
export async function getChecklistItems() {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        const { data, error } = await supabase
            .from('checklist_items')
            .select('*')
            .order('sort_position', { ascending: true });

        if (error) {
            console.error('❌ Error fetching checklist items from Supabase:', error.message);
            throw error;
        }
        
        return data || [];
    } catch (error) {
        console.error('❌ Error fetching checklist items:', error.message);
        throw error;
    }
}

// Save checklist items (for JSON fallback)
export async function saveChecklistItems(items) {
    try {
        const checklistPath = path.join(__dirname, 'checklist_items.json');
        fs.writeFileSync(checklistPath, JSON.stringify(items, null, 2));
        console.log(`✅ Saved ${items.length} checklist items`);
        return items;
    } catch (error) {
        console.error('❌ Error saving checklist items:', error.message);
        throw error;
    }
}

// Add new checklist item
export async function addChecklistItem(category, label, sortPosition = 999) {
    try {
        if (!category || !label) {
            throw new Error('Category and label are required');
        }

        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        // Get all existing IDs to find a safe one
        const { data: allItems, error: fetchError } = await supabase
            .from('checklist_items')
            .select('id')
            .order('id', { ascending: false });

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.warn('⚠️ Could not fetch IDs:', fetchError);
        }

        // Find the next available ID by checking for gaps
        let newId = 1;
        if (allItems && allItems.length > 0) {
            const existingIds = new Set(allItems.map(item => item.id));
            // Find first available ID starting from max + 1
            const maxId = Math.max(...allItems.map(item => item.id));
            newId = maxId + 1;
            
            // Double-check this ID doesn't exist
            while (existingIds.has(newId)) {
                newId++;
            }
        }

        console.log(`📝 Creating checklist item with ID: ${newId}, Label: "${label}"`);

        const { data, error } = await supabase
            .from('checklist_items')
            .insert([{
                id: newId,
                category,
                label,
                sort_position: sortPosition,
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) {
            console.error('❌ Error inserting checklist item:', error.message, error);
            throw error;
        }
        
        console.log(`✅ Added checklist item: "${label}" with ID ${newId}`);
        return data?.[0];
    } catch (error) {
        console.error('❌ Error adding checklist item:', error.message);
        throw error;
    }
}

// Update checklist item
export async function updateChecklistItem(id, category, label, sortPosition) {
    try {
        if (!id) {
            throw new Error('Item ID is required');
        }

        if (!supabase) {
            // JSON fallback
            const items = await getChecklistItems();
            const itemIndex = items.findIndex(i => i.id === id);
            if (itemIndex === -1) throw new Error('Item not found');
            
            if (category) items[itemIndex].category = category;
            if (label) items[itemIndex].label = label;
            if (sortPosition !== undefined) items[itemIndex].sort_position = sortPosition;
            
            await saveChecklistItems(items);
            return items[itemIndex];
        }

        const updates = {};
        if (category) updates.category = category;
        if (label) updates.label = label;
        if (sortPosition !== undefined) updates.sort_position = sortPosition;

        const { data, error } = await supabase
            .from('checklist_items')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) {
            // Fallback to JSON for Supabase errors
            console.log('📄 Supabase update failed, using JSON fallback');
            const items = await getChecklistItems();
            const itemIndex = items.findIndex(i => i.id === id);
            if (itemIndex === -1) throw new Error('Item not found');
            
            if (category) items[itemIndex].category = category;
            if (label) items[itemIndex].label = label;
            if (sortPosition !== undefined) items[itemIndex].sort_position = sortPosition;
            
            await saveChecklistItems(items);
            return items[itemIndex];
        }
        
        console.log(`✅ Updated checklist item: "${label}"`);
        return data?.[0];
    } catch (error) {
        console.error('❌ Error updating checklist item:', error.message);
        throw error;
    }
}

// Delete checklist item
export async function deleteChecklistItem(id) {
    try {
        if (!id) {
            throw new Error('Item ID is required');
        }

        if (!supabase) {
            // JSON fallback
            const items = await getChecklistItems();
            const filtered = items.filter(i => i.id !== id);
            await saveChecklistItems(filtered);
            return true;
        }

        // First, delete all student_checklist_completion records for this item
        console.log(`🗑️  Deleting completion records for item ${id}...`);
        const { data: deletedCompletion, error: completionError } = await supabase
            .from('student_checklist_completion')
            .delete()
            .eq('checklist_item_id', id);

        if (completionError) {
            console.warn('⚠️  Completion delete error:', completionError.message, completionError.code);
        } else {
            console.log(`✅ Deleted ${deletedCompletion ? 'completion records' : 'no completion records found'}`);
        }

        // Then delete the checklist item itself
        console.log(`🗑️  Deleting checklist item ${id}...`);
        const { data: deletedItem, error } = await supabase
            .from('checklist_items')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('❌ Supabase error deleting item:', error.message, error.code);
            console.log('Full error details:', JSON.stringify(error, null, 2));
            // Fallback to JSON for Supabase errors
            console.log('📄 Using JSON fallback');
            const items = await getChecklistItems();
            const filtered = items.filter(i => i.id !== id);
            await saveChecklistItems(filtered);
            return true;
        }
        
        console.log(`✅ Deleted checklist item with ID: ${id}`);
        return true;
    } catch (error) {
        console.error('❌ Error deleting checklist item:', error.message);
        throw error;
    }
}

// Get student checklist completion
export async function getStudentChecklistCompletion(studentId) {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        const { data, error } = await supabase
            .from('student_checklist_completion')
            .select('*')
            .eq('student_id', studentId);

        if (error) {
            console.error('❌ Error fetching from Supabase:', error.message);
            throw error;
        }
        
        return data || [];
    } catch (error) {
        console.error('❌ Error fetching student checklist completion:', error.message);
        throw error;
    }
}

// Save student checklist completion
export async function saveStudentChecklistCompletion(studentId, completedItemIds) {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized. Check SUPABASE_URL and SUPABASE_KEY environment variables.');
        }

        // Delete old entries for this student
        const { error: deleteError } = await supabase
            .from('student_checklist_completion')
            .delete()
            .eq('student_id', studentId);

        if (deleteError) {
            console.error('❌ Error deleting old checklist entries:', deleteError.message);
            throw deleteError;
        }

        // Insert new entries
        const newCompletions = completedItemIds.map(itemId => ({
            student_id: studentId,
            checklist_item_id: itemId,
            completed_at: new Date().toISOString()
        }));

        if (newCompletions.length === 0) {
            return [];
        }

        const { data, error: insertError } = await supabase
            .from('student_checklist_completion')
            .insert(newCompletions)
            .select();

        if (insertError) {
            console.error('❌ Error inserting new checklist entries:', insertError.message);
            throw insertError;
        }
        
        console.log(`✅ Saved checklist completion for student ${studentId}`);
        return data || [];
    } catch (error) {
        console.error('❌ Error saving student checklist completion:', error.message);
        throw error;
    }
}

// Get all checklist completions in one query (batch endpoint)
export async function getAllChecklistCompletions() {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        const { data, error } = await supabase
            .from('student_checklist_completion')
            .select('*');

        if (error) {
            console.error('❌ Error fetching all checklist completions:', error.message);
            throw error;
        }
        
        return data || [];
    } catch (error) {
        console.error('❌ Error fetching all checklist completions:', error.message);
        throw error;
    }
}

// Close database connection
export function closeDatabase() {
    // Supabase client doesn't need explicit closing
    console.log('✅ Supabase connection closed');
}

// ============================================
// COHORT LINKS & VIDEOS MANAGEMENT
// ============================================

// Get all cohort links
export async function getCohortLinks(cohortName) {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available, returning empty links');
            return [];
        }

        const { data, error } = await supabase
            .from('cohort_links')
            .select('*')
            .eq('cohort_name', cohortName)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error fetching cohort links:', error.message);
            return [];
        }
        
        return data || [];
    } catch (error) {
        console.error('❌ Error fetching cohort links:', error.message);
        return [];
    }
}

// Add cohort link
export async function addCohortLink(cohortName, name, url) {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        const { data, error } = await supabase
            .from('cohort_links')
            .insert([{
                cohort_name: cohortName,
                name,
                url,
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) throw error;
        console.log(`✅ Added link "${name}" to ${cohortName}`);
        return data?.[0];
    } catch (error) {
        console.error('❌ Error adding cohort link:', error.message);
        throw error;
    }
}

// Update cohort link
export async function updateCohortLink(id, name, url) {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        const { data, error } = await supabase
            .from('cohort_links')
            .update({ name, url })
            .eq('id', id)
            .select();

        if (error) throw error;
        console.log(`✅ Updated link "${name}"`);
        return data?.[0];
    } catch (error) {
        console.error('❌ Error updating cohort link:', error.message);
        throw error;
    }
}

// Delete cohort link
export async function deleteCohortLink(id) {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        const { error } = await supabase
            .from('cohort_links')
            .delete()
            .eq('id', id);

        if (error) throw error;
        console.log(`✅ Deleted link`);
        return true;
    } catch (error) {
        console.error('❌ Error deleting cohort link:', error.message);
        throw error;
    }
}

// Get all cohort videos
export async function getCohortVideos(cohortName) {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available, returning empty videos');
            return [];
        }

        const { data, error } = await supabase
            .from('cohort_videos')
            .select('*')
            .eq('cohort_name', cohortName)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error fetching cohort videos:', error.message);
            return [];
        }
        
        return data || [];
    } catch (error) {
        console.error('❌ Error fetching cohort videos:', error.message);
        return [];
    }
}

// Add cohort video
export async function addCohortVideo(cohortName, name, thumbnail, url) {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        const { data, error } = await supabase
            .from('cohort_videos')
            .insert([{
                cohort_name: cohortName,
                name,
                thumbnail,
                url,
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) throw error;
        console.log(`✅ Added video "${name}" to ${cohortName}`);
        return data?.[0];
    } catch (error) {
        console.error('❌ Error adding cohort video:', error.message);
        throw error;
    }
}

// Update cohort video
export async function updateCohortVideo(id, name, thumbnail, url) {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        const { data, error } = await supabase
            .from('cohort_videos')
            .update({ name, thumbnail, url })
            .eq('id', id)
            .select();

        if (error) throw error;
        console.log(`✅ Updated video "${name}"`);
        return data?.[0];
    } catch (error) {
        console.error('❌ Error updating cohort video:', error.message);
        throw error;
    }
}

// Delete cohort video
export async function deleteCohortVideo(id) {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        const { error } = await supabase
            .from('cohort_videos')
            .delete()
            .eq('id', id);

        if (error) throw error;
        console.log(`✅ Deleted video`);
        return true;
    } catch (error) {
        console.error('❌ Error deleting cohort video:', error.message);
        throw error;
    }
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

// Login user - verify credentials
export async function loginAdmin(email, password) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    try {
        const { data, error } = await supabase
            .from('admin_users')
            .select('id, email, name, is_admin, is_active')
            .eq('email', email)
            .eq('is_active', true)
            .single();

        if (error || !data) {
            throw new Error('User not found');
        }

        // Verify password (in production, use bcrypt)
        const { data: passwordCheck } = await supabase
            .from('admin_users')
            .select('password_hash')
            .eq('id', data.id)
            .single();

        if (!passwordCheck || passwordCheck.password_hash !== password) {
            throw new Error('Invalid password');
        }

        // Update last login timestamp
        await supabase
            .from('admin_users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', data.id);

        console.log(`✅ Admin user logged in: ${email}`);
        return data;
    } catch (error) {
        console.error('❌ Error logging in admin:', error.message);
        throw error;
    }
}

// Create session token
export async function createSessionToken(userId) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    try {
        const sessionToken = generateSessionToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const { data, error } = await supabase
            .from('admin_sessions')
            .insert({
                user_id: userId,
                session_token: sessionToken,
                expires_at: expiresAt.toISOString(),
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;
        console.log(`✅ Session created for user ${userId}`);
        return sessionToken;
    } catch (error) {
        console.error('❌ Error creating session:', error.message);
        throw error;
    }
}

// Verify session token
export async function verifySessionToken(sessionToken) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    try {
        const { data, error } = await supabase
            .from('admin_sessions')
            .select('user_id, expires_at, is_active')
            .eq('session_token', sessionToken)
            .single();

        if (error || !data) {
            throw new Error('Session not found');
        }

        if (!data.is_active) {
            throw new Error('Session inactive');
        }

        // Check if session expired
        if (new Date(data.expires_at) < new Date()) {
            throw new Error('Session expired');
        }

        return data.user_id;
    } catch (error) {
        console.error('❌ Error verifying session:', error.message);
        throw error;
    }
}

// Logout - invalidate session
export async function logoutSession(sessionToken) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    try {
        const { error } = await supabase
            .from('admin_sessions')
            .update({ is_active: false })
            .eq('session_token', sessionToken);

        if (error) throw error;
        console.log('✅ Session logged out');
        return true;
    } catch (error) {
        console.error('❌ Error logging out:', error.message);
        throw error;
    }
}

// Get admin user by ID
export async function getAdminUserById(userId) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    try {
        const { data, error } = await supabase
            .from('admin_users')
            .select('id, email, name, is_admin, is_active')
            .eq('id', userId)
            .single();

        if (error || !data) {
            throw new Error('User not found');
        }

        return data;
    } catch (error) {
        console.error('❌ Error fetching user:', error.message);
        throw error;
    }
}

// Generate random session token
function generateSessionToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// ============================================
// STUDENT PASSWORD MANAGEMENT
// ============================================

// Set/Update student password
export async function setStudentPassword(studentId, email, password) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    try {
        const { data: existing, error: fetchError } = await supabase
            .from('student_passwords')
            .select('id')
            .eq('student_id', studentId)
            .single();

        if (existing) {
            // Update existing password
            const { error } = await supabase
                .from('student_passwords')
                .update({ 
                    password_hash: password, // In production, use bcrypt
                    updated_at: new Date().toISOString()
                })
                .eq('student_id', studentId);

            if (error) throw error;
            console.log(`✅ Password updated for student: ${email}`);
            return true;
        } else {
            // Create new password record
            const { error } = await supabase
                .from('student_passwords')
                .insert([{
                    student_id: studentId,
                    email: email,
                    password_hash: password, // In production, use bcrypt
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;
            console.log(`✅ Password set for student: ${email}`);
            return true;
        }
    } catch (error) {
        console.error('❌ Error setting student password:', error.message);
        throw error;
    }
}

// Get student password for email templates
export async function getStudentPassword(studentId, email) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    try {
        const { data, error } = await supabase
            .from('student_passwords')
            .select('password_hash')
            .eq('student_id', studentId)
            .eq('email', email)
            .single();

        if (error) {
            console.warn(`⚠️  Could not retrieve password for student ${studentId}:`, error.message);
            return null;
        }

        return data ? data.password_hash : null;
    } catch (error) {
        console.error('❌ Error getting student password:', error.message);
        return null;
    }
}

// Authenticate student with email and password
export async function authenticateStudent(email, password) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    try {
        // Check if student has a password set
        const { data: studentPass, error: passError } = await supabase
            .from('student_passwords')
            .select('student_id, password_hash')
            .eq('email', email)
            .single();

        console.log(`🔍 Auth attempt for email: ${email}`);
        console.log(`📋 Query result:`, { studentPass, passError });

        if (passError || !studentPass) {
            console.error(`❌ No password record found for ${email}:`, passError);
            throw new Error('Invalid email or password');
        }

        // Compare password (in production, use bcrypt)
        if (studentPass.password_hash !== password) {
            console.error(`❌ Password mismatch for ${email}`);
            console.log(`   Stored: ${studentPass.password_hash}`);
            console.log(`   Provided: ${password}`);
            throw new Error('Invalid email or password');
        }

        console.log(`✅ Password matched for ${email}, fetching student details`);

        // Get student details
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('*')
            .eq('id', studentPass.student_id)
            .single();

        if (studentError || !student) {
            console.error(`❌ Student not found for ID ${studentPass.student_id}:`, studentError);
            throw new Error('Student not found');
        }

        return convertStudentFromDatabase(student);
    } catch (error) {
        console.error('❌ Error authenticating student:', error.message);
        throw error;
    }
}

// Create student session token
export async function createStudentSessionToken(studentId) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    try {
        const sessionToken = generateSessionToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        const { error } = await supabase
            .from('student_sessions')
            .insert([{
                student_id: studentId,
                session_token: sessionToken,
                created_at: new Date().toISOString(),
                expires_at: expiresAt,
                is_active: true
            }]);

        if (error) throw error;
        return sessionToken;
    } catch (error) {
        console.error('❌ Error creating student session:', error.message);
        throw error;
    }
}

// Verify student session token
export async function verifyStudentSessionToken(sessionToken) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    try {
        const { data, error } = await supabase
            .from('student_sessions')
            .select('student_id, expires_at, is_active')
            .eq('session_token', sessionToken)
            .single();

        if (error || !data) {
            throw new Error('Session not found');
        }

        if (!data.is_active) {
            throw new Error('Session inactive');
        }

        // Check if session expired
        if (new Date(data.expires_at) < new Date()) {
            throw new Error('Session expired');
        }

        return data.student_id;
    } catch (error) {
        console.error('❌ Error verifying student session:', error.message);
        throw error;
    }
}

// Get student by ID
export async function getStudentById(studentId) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    try {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('id', studentId)
            .single();

        if (error || !data) {
            throw new Error('Student not found');
        }

        return convertStudentFromDatabase(data);
    } catch (error) {
        console.error('❌ Error fetching student:', error.message);
        throw error;
    }
}

// Logout student - invalidate session
export async function logoutStudentSession(sessionToken) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    try {
        const { error } = await supabase
            .from('student_sessions')
            .update({ is_active: false })
            .eq('session_token', sessionToken);

        if (error) throw error;
        console.log('✅ Student session logged out');
        return true;
    } catch (error) {
        console.error('❌ Error logging out student:', error.message);
        throw error;
    }
}