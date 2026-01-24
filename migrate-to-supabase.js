import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
    try {
        console.log('🔄 Starting data migration to Supabase...\n');

        // 1. Migrate students
        console.log('📥 Migrating students data...');
        const studentsPath = path.join(__dirname, 'students.json');
        
        if (fs.existsSync(studentsPath)) {
            const studentsData = JSON.parse(fs.readFileSync(studentsPath, 'utf-8'));
            
            // Remove duplicates by email (keep first occurrence)
            const uniqueStudents = [];
            const seenEmails = new Set();
            
            for (const student of studentsData) {
                if (!seenEmails.has(student.email)) {
                    uniqueStudents.push(student);
                    seenEmails.add(student.email);
                }
            }
            
            console.log(`📊 Found ${studentsData.length} students, ${uniqueStudents.length} unique by email`);
            
            // Clear existing students
            const { error: deleteError } = await supabase
                .from('students')
                .delete()
                .neq('id', -1);

            if (deleteError && deleteError.code !== 'PGRST116') {
                throw deleteError;
            }

            // Insert new students
            const studentsForDB = uniqueStudents.map(student => ({
                name: student.name || null,
                email: student.email || null,
                cohort: student.cohort || null,
                status: student.status || null,
                location: student.location || null,
            }));

            const { data, error: insertError } = await supabase
                .from('students')
                .insert(studentsForDB)
                .select();

            if (insertError) throw insertError;

            console.log(`✅ Migrated ${data.length} students to Supabase\n`);
        } else {
            console.log('⚠️  students.json not found, skipping student migration\n');
        }

        // 2. Migrate email templates
        console.log('📥 Migrating email templates...');
        const templatesPath = path.join(__dirname, 'email_templates.json');
        
        if (fs.existsSync(templatesPath)) {
            const templatesData = JSON.parse(fs.readFileSync(templatesPath, 'utf-8'));
            
            // Clear existing templates
            const { error: deleteError } = await supabase
                .from('email_templates')
                .delete()
                .neq('id', -1);

            if (deleteError && deleteError.code !== 'PGRST116') {
                throw deleteError;
            }

            // Insert new templates
            const templatesForDB = templatesData.map(template => ({
                name: template.name || null,
                subject: template.subject || null,
                body: template.body || null,
            }));

            const { data, error: insertError } = await supabase
                .from('email_templates')
                .insert(templatesForDB)
                .select();

            if (insertError) throw insertError;

            console.log(`✅ Migrated ${data.length} email templates to Supabase\n`);
        } else {
            console.log('⚠️  email_templates.json not found, skipping template migration\n');
        }

        console.log('✨ Migration complete! Your data is now in Supabase.');
        console.log('🚀 Ready to deploy to production.');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

migrateData();
