# Supabase Migration Setup Guide

## Overview
This project needs to migrate all data from local JSON files to Supabase for proper synchronization between local development and live Vercel deployment.

## Step 1: Create Supabase Tables

1. Go to your Supabase dashboard: https://supabase.com
2. Open your project console
3. Go to SQL Editor
4. Copy and paste the contents of `supabase_schema.sql`
5. Click "Run" to create all tables

## Step 2: Verify Supabase Environment Variables

Make sure your `.env` file has:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

## Step 3: Migrate Data to Supabase

Run the migration script:
```bash
node migrate_to_supabase.js
```

This will:
- Migrate all checklist items from `checklist_items.json`
- Migrate all student checklist completion data from `student_checklist_completion.json`
- Migrate all cohorts from `cohorts.json`
- Migrate all email templates from `email_templates.json`
- Migrate email template categories

## Step 4: Verify Data Sync

1. Make changes on local (check a checklist item)
2. Verify it appears on live URL
3. Make changes on live URL (edit student name)
4. Hard refresh local and verify it appears

## Troubleshooting

### "Supabase table not available, using JSON fallback"
- Tables haven't been created yet - run the SQL script from Step 1
- Check Supabase credentials in environment variables

### Data not syncing between local and live
- Verify both are using the same Supabase URL and key
- Check network tab in browser for API errors
- Verify Supabase tables have RLS policies that allow read/write

### Duplicate data or conflicts
- The migration script deletes existing data and inserts fresh data
- If you need to preserve old data, manually edit `migrate_to_supabase.js`

## Files Modified

- `database.js` - Updated to require Supabase (no JSON fallback)
- `migrate_to_supabase.js` - NEW: Migration script  
- `supabase_schema.sql` - NEW: SQL schema file

## Next Steps

After migration:
1. Keep JSON files as backups but don't rely on them
2. Remove JSON reading/writing code from database.js eventually
3. Consider deleting JSON files once you're confident in Supabase
