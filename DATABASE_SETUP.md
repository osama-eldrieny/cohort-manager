# Database Setup Guide

## Supabase Configuration

This guide covers setting up the database infrastructure for the Course Dashboard application.

## Table of Contents
1. [User Preferences Table](#user-preferences-table)
2. [Setting Up in Supabase](#setting-up-in-supabase)
3. [Database Functions](#database-functions)
4. [Indexes and Performance](#indexes-and-performance)
5. [Backup and Restoration](#backup-and-restoration)
6. [Monitoring](#monitoring)

---

## User Preferences Table

### Purpose
Stores column visibility preferences for each page in the dashboard. Allows users to customize which columns they see, with settings synced across devices.

### Schema

```sql
CREATE TABLE IF NOT EXISTS user_preferences (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    page_id TEXT NOT NULL UNIQUE,
    visible_columns JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_page_id ON user_preferences(page_id);
```

### Column Definitions

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | BIGINT | No | Auto-increment | Primary key |
| page_id | TEXT | No | None | Unique page identifier (e.g., "students", "cohort-0") |
| visible_columns | JSONB | No | None | JSON array of column IDs to display |
| created_at | TIMESTAMP | No | CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | No | CURRENT_TIMESTAMP | Last update time |

### Constraints
- **PRIMARY KEY**: id
- **UNIQUE**: page_id (one preference set per page)

### Indexes
- **idx_page_id**: On page_id column for fast lookups

---

## Setting Up in Supabase

### Step 1: Access Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Create the Table
Copy and paste the SQL migration below:

```sql
-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    page_id TEXT NOT NULL UNIQUE,
    visible_columns JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_page_id ON user_preferences(page_id);

-- Add comment for documentation
COMMENT ON TABLE user_preferences IS 'Stores column visibility preferences for dashboard pages';
COMMENT ON COLUMN user_preferences.page_id IS 'Unique page identifier (students, cohort-0, status-waiting, etc.)';
COMMENT ON COLUMN user_preferences.visible_columns IS 'JSON array of column IDs that should be visible';
```

### Step 3: Execute Query
1. Click **Run** (or press Ctrl+Enter)
2. You should see: `executed successfully`

### Step 4: Verify Table Creation
Run this query to confirm:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_preferences';
```

Expected output: One row with `user_preferences`

### Step 5: View Table Structure
Click the **user_preferences** table in the **Tables** list (left sidebar) to view its structure.

---

## Database Functions

### Node.js Database Functions

These functions in `database.js` handle all database operations:

#### 1. initializeColumnPreferencesTable()
Checks if the table exists; gracefully handles if it doesn't.

```javascript
async function initializeColumnPreferencesTable() {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('count', { count: 'exact' });
    
    if (error && error.code === '42P01') {
      console.log('INFO: user_preferences table not found - using localStorage fallback');
      return;
    }
  } catch (error) {
    console.error('Error initializing preferences table:', error);
  }
}
```

**Called**: On server startup
**Handles**: Missing table gracefully

#### 2. getColumnPreferences(pageId)
Fetches preferences for a specific page.

```javascript
async function getColumnPreferences(pageId) {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('page_id', pageId)
      .single();
    
    if (error && error.code === 'PGRST116') return null;
    if (error && error.code === '42P01') {
      console.warn('Column preferences table not found');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching column preferences:', error);
    return null;
  }
}
```

**Input**: pageId (string)
**Returns**: Object or null
**Errors**: Returns null (falls back to localStorage)

#### 3. saveColumnPreferences(pageId, visibleColumns)
Saves or updates preferences for a page (UPSERT).

```javascript
async function saveColumnPreferences(pageId, visibleColumns) {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        page_id: pageId,
        visible_columns: visibleColumns,
        updated_at: new Date()
      })
      .select()
      .single();
    
    if (error && error.code === '42P01') {
      console.warn('Column preferences table not found - data saved to localStorage');
      return null;
    }
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving column preferences:', error);
    return null;
  }
}
```

**Inputs**: 
- pageId (string)
- visibleColumns (array of strings)

**Returns**: Saved object or null
**Behavior**: Inserts if new, updates if exists

#### 4. deleteColumnPreferences(pageId)
Deletes preferences for a page (resets to defaults).

```javascript
async function deleteColumnPreferences(pageId) {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .delete()
      .eq('page_id', pageId);
    
    if (error && error.code === '42P01') {
      console.warn('Column preferences table not found');
      return true;
    }
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting column preferences:', error);
    return false;
  }
}
```

**Input**: pageId (string)
**Returns**: true/false
**Behavior**: Gracefully handles missing table

#### 5. getAllColumnPreferences()
Fetches all saved preferences (useful for admin/export).

```javascript
async function getAllColumnPreferences() {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error && error.code === '42P01') {
      console.warn('Column preferences table not found');
      return [];
    }
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all column preferences:', error);
    return [];
  }
}
```

**Returns**: Array of preference objects
**Behavior**: Returns empty array on error

---

## Indexes and Performance

### Current Index
```sql
CREATE INDEX IF NOT EXISTS idx_page_id ON user_preferences(page_id);
```

**Purpose**: Fast lookups by page_id
**Query Types**: Used in GET and UPDATE operations
**Performance**: O(log n) complexity

### Suggested Additional Indexes (Optional)

#### If adding user tracking:
```sql
CREATE INDEX IF NOT EXISTS idx_user_id ON user_preferences(user_id);
```

#### For bulk operations:
```sql
CREATE INDEX IF NOT EXISTS idx_created_at ON user_preferences(created_at);
```

#### For performance monitoring:
```sql
CREATE INDEX IF NOT EXISTS idx_updated_at ON user_preferences(updated_at);
```

### Viewing Index Performance

```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename = 'user_preferences'
ORDER BY idx_scan DESC;

-- Check table size
SELECT pg_size_pretty(pg_total_relation_size('user_preferences'));

-- Check index size
SELECT pg_size_pretty(pg_relation_size('idx_page_id'));
```

---

## Backup and Restoration

### Automatic Backups
Supabase automatically backs up your data:
- Daily backups retained for 7 days
- Weekly backups retained for 4 weeks
- Access via **Backups** section in Supabase dashboard

### Manual Export

#### Export as SQL
```sql
-- In Supabase SQL Editor
SELECT * FROM user_preferences;
```

#### Export as JSON
```javascript
// In Node.js
const { data } = await supabase
  .from('user_preferences')
  .select('*');

const json = JSON.stringify(data, null, 2);
// Save to file or send to API
```

### Restore from Backup

1. Go to Supabase Dashboard → **Backups**
2. Select backup date
3. Click **Restore**
4. Confirm restoration

### Manual Data Migration

#### Import preferences from localStorage to database:
```javascript
async function migrateLocalStorageToDatabase() {
  const keys = Object.keys(localStorage);
  
  for (const key of keys) {
    if (key.startsWith('columnPreferences_')) {
      const pageId = key.replace('columnPreferences_', '');
      const visibleColumns = JSON.parse(localStorage.getItem(key));
      
      await saveColumnPreferences(pageId, visibleColumns);
      console.log(`Migrated: ${pageId}`);
    }
  }
}
```

---

## Monitoring

### Query Performance

#### View slow queries
```sql
SELECT query, mean_time, calls
FROM pg_stat_statements
WHERE query LIKE '%user_preferences%'
ORDER BY mean_time DESC;
```

#### Monitor table statistics
```sql
SELECT 
    schemaname,
    tablename,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
WHERE tablename = 'user_preferences';
```

### Error Tracking

#### Check Supabase logs
1. Dashboard → **Database** → **Extensions**
2. Look for errors in real-time logs
3. Set up alerts for table-not-found errors

#### Application logs
Check `server.js` console output for:
```
ERROR: Error fetching column preferences
WARNING: Column preferences table not found
INFO: user_preferences table initialized
```

### Health Check Endpoint

```javascript
// GET /api/health
{
  "status": "OK",
  "database": "ready",
  "timestamp": "2024-01-25T14:30:00Z"
}
```

---

## Troubleshooting

### Issue: "Table does not exist" (Error 42P01)
**Cause**: Table not created in Supabase
**Solution**: Run SQL migration in Supabase SQL Editor

### Issue: Slow queries
**Cause**: Missing index or large dataset
**Solution**: Verify idx_page_id exists, consider additional indexes

### Issue: Preferences not saving
**Cause**: Database error or missing table
**Solution**: Check server logs, verify Supabase connection string

### Issue: Connection refused
**Cause**: Supabase project not running or credentials invalid
**Solution**: Verify SUPABASE_URL and SUPABASE_KEY in environment

### Issue: Preferences visible in localStorage but not database
**Cause**: Table wasn't created before first save
**Solution**: Create table, then migrate data with migrateLocalStorageToDatabase()

---

## Environment Variables

Required in `.env`:
```
SUPABASE_URL=https://[project].supabase.co
SUPABASE_KEY=[your_anon_key]
SUPABASE_SERVICE_KEY=[your_service_role_key]
```

---

## File References

- **Migration**: `migrations/001_create_user_preferences.sql`
- **Database Functions**: `database.js` (lines ~490-640)
- **API Endpoints**: `server.js` (lines ~390-460)
- **Frontend Integration**: `app.js` (lines ~106-302)

---

## Support

For issues:
1. Check Supabase dashboard for table existence
2. Verify network connectivity
3. Review browser console for errors
4. Check server logs for database errors
5. Ensure environment variables are set correctly

