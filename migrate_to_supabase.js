import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateChecklistItems() {
    console.log('\n📋 Migrating checklist items...');
    try {
        const checklistPath = path.join(__dirname, 'checklist_items.json');
        if (!fs.existsSync(checklistPath)) {
            console.log('⚠️  No checklist_items.json found, skipping');
            return;
        }

        const data = fs.readFileSync(checklistPath, 'utf-8');
        const items = JSON.parse(data);

        // Delete existing records
        await supabase.from('checklist_items').delete().neq('id', 0);

        // Insert new records
        const { error, data: insertedData } = await supabase
            .from('checklist_items')
            .insert(items);

        if (error) {
            console.error('❌ Error inserting checklist items:', error.message);
            return;
        }

        console.log(`✅ Migrated ${items.length} checklist items to Supabase`);
    } catch (error) {
        console.error('❌ Error migrating checklist items:', error.message);
    }
}

async function migrateStudentChecklistCompletion() {
    console.log('\n📋 Migrating student checklist completion...');
    try {
        const completionPath = path.join(__dirname, 'student_checklist_completion.json');
        if (!fs.existsSync(completionPath)) {
            console.log('⚠️  No student_checklist_completion.json found, skipping');
            return;
        }

        const data = fs.readFileSync(completionPath, 'utf-8');
        const completions = JSON.parse(data);

        // Delete existing records
        await supabase.from('student_checklist_completion').delete().neq('student_id', '');

        // Insert in batches (Supabase has size limits)
        const batchSize = 500;
        for (let i = 0; i < completions.length; i += batchSize) {
            const batch = completions.slice(i, i + batchSize);
            const { error } = await supabase
                .from('student_checklist_completion')
                .insert(batch);

            if (error) {
                console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
                continue;
            }

            console.log(`✅ Migrated batch ${i / batchSize + 1} (${batch.length} records)`);
        }

        console.log(`✅ Total: Migrated ${completions.length} student checklist completion records`);
    } catch (error) {
        console.error('❌ Error migrating student checklist completion:', error.message);
    }
}

async function migrateCohorts() {
    console.log('\n📋 Migrating cohorts...');
    try {
        const cohortsPath = path.join(__dirname, 'cohorts.json');
        if (!fs.existsSync(cohortsPath)) {
            console.log('⚠️  No cohorts.json found, skipping');
            return;
        }

        const data = fs.readFileSync(cohortsPath, 'utf-8');
        const cohorts = JSON.parse(data);

        // Delete existing records
        await supabase.from('cohorts').delete().neq('id', 0);

        // Insert new records
        const { error } = await supabase
            .from('cohorts')
            .insert(cohorts);

        if (error) {
            console.error('❌ Error inserting cohorts:', error.message);
            return;
        }

        console.log(`✅ Migrated ${cohorts.length} cohorts to Supabase`);
    } catch (error) {
        console.error('❌ Error migrating cohorts:', error.message);
    }
}

async function migrateEmailTemplates() {
    console.log('\n📋 Migrating email templates...');
    try {
        const templatesPath = path.join(__dirname, 'email_templates.json');
        if (!fs.existsSync(templatesPath)) {
            console.log('⚠️  No email_templates.json found, skipping');
            return;
        }

        const data = fs.readFileSync(templatesPath, 'utf-8');
        const templates = JSON.parse(data);

        // Delete existing records
        await supabase.from('email_templates').delete().neq('id', 0);

        // Insert in batches
        const batchSize = 500;
        for (let i = 0; i < templates.length; i += batchSize) {
            const batch = templates.slice(i, i + batchSize);
            const { error } = await supabase
                .from('email_templates')
                .insert(batch);

            if (error) {
                console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
                continue;
            }

            console.log(`✅ Migrated batch ${i / batchSize + 1} (${batch.length} templates)`);
        }

        console.log(`✅ Total: Migrated ${templates.length} email templates`);
    } catch (error) {
        console.error('❌ Error migrating email templates:', error.message);
    }
}

async function migrateEmailTemplateCategories() {
    console.log('\n📋 Migrating email template categories...');
    try {
        const categoriesPath = path.join(__dirname, 'email_template_categories.json');
        if (!fs.existsSync(categoriesPath)) {
            console.log('⚠️  No email_template_categories.json found, skipping');
            return;
        }

        const data = fs.readFileSync(categoriesPath, 'utf-8');
        const categories = JSON.parse(data);

        // Delete existing records
        await supabase.from('email_template_categories').delete().neq('id', 0);

        // Insert new records
        const { error } = await supabase
            .from('email_template_categories')
            .insert(categories.map((name, idx) => ({ id: idx + 1, name })));

        if (error) {
            console.error('❌ Error inserting categories:', error.message);
            return;
        }

        console.log(`✅ Migrated ${categories.length} email template categories`);
    } catch (error) {
        console.error('❌ Error migrating email template categories:', error.message);
    }
}

async function main() {
    console.log('🚀 Starting Supabase migration...');
    console.log(`📍 Supabase URL: ${supabaseUrl}`);

    // Test connection
    try {
        const { data, error } = await supabase.from('students').select('id').limit(1);
        if (error && !error.message.includes('relation')) {
            console.error('❌ Could not connect to Supabase:', error.message);
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Connection error:', error.message);
        process.exit(1);
    }

    // Migrate all data
    await migrateChecklistItems();
    await migrateStudentChecklistCompletion();
    await migrateCohorts();
    await migrateEmailTemplates();
    await migrateEmailTemplateCategories();

    console.log('\n✅ Migration complete!');
    console.log('📝 All data should now be in Supabase.');
    console.log('💡 Tip: If you see errors about missing tables, create them in Supabase console first.');
    process.exit(0);
}

main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
