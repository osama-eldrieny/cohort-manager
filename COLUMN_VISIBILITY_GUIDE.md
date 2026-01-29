# Column Visibility Control System

## Overview
The column visibility control system allows users to customize which columns are displayed in student tables across all pages. Column preferences are automatically saved and persist across browser sessions.

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
2. **Persistent Storage**: Preferences are saved in browser localStorage
3. **Per-Page Settings**: Each page (students, each cohort, each status) maintains its own column configuration
4. **Minimum Requirement**: At least one column must be visible at all times
5. **Browser Storage**: Clearing browser data/cache will reset preferences to defaults

## Technical Details

- **Storage Method**: localStorage
- **Key Format**: `columnPreferences_${pageId}`
- **Data Format**: JSON array of visible column IDs
- **Default**: All columns visible initially
- **Compatibility**: Works on all modern browsers

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
