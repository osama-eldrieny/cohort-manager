# Column Visibility Control System

## Overview
The column visibility control system allows users to customize which columns are displayed in student tables across all pages. **Column preferences are now saved to Supabase database with automatic browser localStorage fallback for offline support.**

## Storage & Persistence

### Primary Storage: Supabase Database
- **Table**: `user_preferences` in Supabase PostgreSQL
- **Synced Across**: All devices and browsers
- **Backup**: Automatically backed up by Supabase
- **Survival**: Persists even after clearing browser cache

### Fallback Storage: Browser localStorage
- **Used When**: Database table doesn't exist or network unavailable
- **Scope**: Single browser/device only
- **Automatic**: Happens transparently without user intervention
- **Cache**: Also used alongside database for performance

## How to Use

### 1. Access Column Controls
- Navigate to any students table page:
  - **Students** page (main student list)
  - **Cohort pages** (Cohort 0, 1, 2, 3, English 1, etc.)
  - **Status pages** (Waiting list, Can't reach, Next Cohort, Standby, Graduated)
  
- Look for the **"Columns"** button in the page controls (top of the table)
- Click the button to open the column visibility modal

### 2. Configure Visible Columns
In the modal, you'll see:
- **Checkboxes** for each available column
- Checked columns = visible in the table
- Unchecked columns = hidden in the table

### 3. Apply Changes
- Click **"Apply"** to save your preferences
- Click **"Reset to Default"** to restore all columns
- Click **"Close"** to exit without saving changes

## Supported Columns

### Students Page (10 columns)
- \# (ID)
- Name
- Email
- Status
- Location
- Language
- LinkedIn
- WhatsApp
- Notes
- Actions

### Cohort Pages (11 columns)
- \# (ID)
- Name
- Email
- Figma Email
- Location
- Language
- LinkedIn
- WhatsApp
- Onboarding (progress %)
- Post-Course (progress %)
- Actions

### Status Pages (11 columns)
- \# (ID)
- Name
- Email
- Location
- Language
- LinkedIn
- WhatsApp
- Notes
- Onboarding (progress %)
- Post-Course (progress %)
- Actions

## Important Notes

1. **Unified Display**: Desktop and mobile views show the same columns based on your preference
2. **Persistent Storage**: Preferences are saved to Supabase database with localStorage fallback
3. **Per-Page Settings**: Each page (students, each cohort, each status) maintains its own column configuration
4. **Minimum Requirement**: At least one column must be visible at all times
5. **Offline Support**: Works offline using localStorage cache
6. **Browser Fallback**: If database table doesn't exist, localStorage is used automatically

## Technical Details

### Storage Methods
| Method | Storage | Scope | Persistence |
|--------|---------|-------|-------------|
| Primary | Supabase Database | All devices | Permanent |
| Fallback | Browser localStorage | Single device | Session-based |

### API Endpoints

```
GET  /api/column-preferences/:pageId       - Fetch preferences
POST /api/column-preferences               - Save preferences
DELETE /api/column-preferences/:pageId     - Reset to defaults
GET  /api/column-preferences               - Get all preferences
```

### Database Schema
```sql
CREATE TABLE user_preferences (
    id BIGINT PRIMARY KEY,
    page_id TEXT UNIQUE NOT NULL,
    visible_columns JSONB NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Setup Instructions

### Creating the Database Table

If you want to enable database persistence, run this SQL in your Supabase SQL editor:

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

**Note**: If you don't create this table, the system will automatically fall back to localStorage - everything still works!

## Examples

### Example 1: Simplified Students View
1. Go to Students page
2. Click "Columns"
3. Uncheck: Location, Language, Notes
4. Check: Name, Email, Status, LinkedIn, WhatsApp, Actions
5. Click "Apply"
6. Result: See only the most important contact info

### Example 2: Cohort Progress Tracking
1. Go to any Cohort page
2. Click "Columns"
3. Check only: Name, Email, Onboarding, Post-Course, Actions
4. Click "Apply"
5. Result: Focus on student progress tracking

### Example 3: Reset to Default
1. On any page, click "Columns"
2. Click "Reset to Default"
3. All columns will be restored and visible

## FAQ

**Q: Will my settings sync across devices?**
A: Yes, if the database table is created. They're stored in Supabase and synced automatically.

**Q: What if I clear my browser cache?**
A: Desktop version: Settings restored from Supabase database. If database table doesn't exist, you'll need to reconfigure.

**Q: Can I backup/restore my column preferences?**
A: Yes, they're automatically backed up in Supabase. You can export them using the API.

**Q: What happens if the database is down?**
A: The system uses localStorage as fallback - you'll still be able to use your last saved preferences.

**Q: How many columns can I customize?**
A: All columns on every table - 10 for Students, 11 for Cohorts/Status pages.

## Data Format

Preferences are stored as JSON arrays of column IDs:

```json
{
  "pageId": "students",
  "visibleColumns": ["col-id", "col-name", "col-email", "col-status"]
}
```

## Support

For issues or feature requests related to column visibility:
1. Check that the database table exists in Supabase
2. Verify localStorage is enabled in your browser
3. Clear browser cache and try again
4. Check browser console for error messages
