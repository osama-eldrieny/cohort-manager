# Course Dashboard - Setup Guide

## Overview
This is a simple, clean student management dashboard that connects to Google Sheets for data storage. No login required, no backend server needed.

---

## Quick Start (5 minutes)

### Step 1: Open the Dashboard
1. Open `index.html` in your web browser
2. You'll see sample data pre-loaded (stored in browser's local storage)
3. Add, edit, or delete students directly

### Step 2: Set Up Google Sheets Integration (Optional)

#### Why use Google Sheets?
- Cloud backup of all data
- Multiple team members can access
- Data never lost (even if browser cache clears)
- Spreadsheet backup in Google Drive

---

## Step-by-Step Setup: Google Sheets Integration

### Part A: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **+ New** → **Blank spreadsheet**
3. Name it `Course Dashboard - Students`
4. Share with your team (click Share button)

### Part B: Set Up Google Apps Script

1. In your Google Sheet, go to **Extensions** → **Apps Script**
2. Delete any existing code
3. Copy the entire code from `AppsScript.gs` file
4. Paste it into the Apps Script editor
5. Click **Save** (Ctrl+S or Cmd+S)

### Part C: Deploy as Web App

1. In Apps Script, click **Deploy** → **New deployment**
2. Click the **Select type** dropdown → choose **Web app**
3. Set up as:
   - **Execute as:** Your email address
   - **Who has access:** Anyone
4. Click **Deploy**
5. A dialog will appear. Click **Authorize access**
6. Select your Google account
7. Accept the permissions
8. **Copy the deployment URL** (you'll need this)

### Part D: Connect Dashboard to Google Sheets

1. Open `index.html` in a text editor
2. Find this line (around line 195):
   ```javascript
   const SCRIPT_URL = 'https://script.google.com/macros/d/YOUR_SCRIPT_ID/useFunctionName?useCache=true';
   ```

3. Replace `YOUR_SCRIPT_ID` with your actual Script ID:
   - In Apps Script, click **Project Settings** (gear icon)
   - Copy the **Script ID**
   - Replace it in the URL

4. The final URL should look like:
   ```javascript
   const SCRIPT_URL = 'https://script.google.com/macros/d/AKfycbxXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/useFunctionName?useCache=true';
   ```

5. Save the HTML file

### Part E: Add Sample Data to Google Sheet

1. Go back to Apps Script
2. Find the `addSampleData()` function
3. Click the dropdown next to the **Run** button and select `addSampleData`
4. Click **Run**
5. Check your Google Sheet - it should now have 2 sample students

---

## Features

### Student Information
- **Name** - Student's full name
- **Email** - Contact email
- **WhatsApp** - Mobile number for quick contact
- **Location** - Country only
- **Language** - English or Arabic
- **Status** - Current status in the course:
  - Waiting list
  - Can't reach
  - Next Cohort
  - Standby
  - Current Cohort
  - Graduated

### Financial Tracking
- **Total Amount** - Course fee
- **Paid Amount** - Amount already paid
- **Remaining Amount** - Auto-calculated (Total - Paid)

### Current Cohort Checklist
When a student status is set to "Current Cohort", a checklist appears:
- Added to private community ✓
- Share course agreement and roles ✓
- Signed course agreement and roles ✓
- Share Google Drive folder with Student ✓
- Create specific Figma file and share it ✓
- Share Master Figma file ✓
- Figma Educational Account Status:
  - Not started
  - Submitted
  - Approved
  - Rejected

### Actions
- **Add Student** - Create new student record
- **Edit** - Update student info or checklist
- **Delete** - Remove student from list
- **Export Data** - Download as JSON file (backup)
- **Import Data** - Upload JSON file to restore data

### Filters
- Filter by **Cohort** (dropdown)
- Filter by **Status** (dropdown)
- Combine filters for specific views

---

## Data Storage Options

### Option 1: Local Storage (Current)
- **How:** Data stored in your browser
- **Pros:** No setup needed, works immediately
- **Cons:** Data lost if cache is cleared
- **Best for:** Testing, single device

### Option 2: Google Sheets (Recommended)
- **How:** Data synced to Google Sheet
- **Pros:** Cloud backup, team access, never lost
- **Cons:** Requires Google Apps Script setup
- **Best for:** Production use, team collaboration

### Option 3: Both
- Uses local storage for quick access
- Syncs to Google Sheets automatically
- **Best of both worlds**

---

## Troubleshooting

### Data not saving to Google Sheets?
1. Check if `SCRIPT_URL` is correctly set in `index.html`
2. Go to Apps Script → **Executions** tab to check for errors
3. Make sure the script is published as Web App (Deploy → New deployment)

### Can't authorize Google?
1. Try logging out of Google account
2. Clear browser cache
3. Try in Incognito/Private mode
4. Reload the page

### Checklist not appearing?
1. Make sure student status is set to **"Current Cohort"**
2. Save the student record
3. Edit again - checklist should appear

### Lost all data?
1. Check `AppsScript.gs` - run `addSampleData()` again
2. If using local storage, import from backup JSON file
3. Check browser cache/storage settings

---

## Tips & Best Practices

1. **Regular Backups**
   - Click "Export Data" weekly
   - Save the JSON file to Google Drive or Dropbox

2. **Organization**
   - Create separate cohorts: "Cohort 1 - Jan 2024", "Cohort 2 - Feb 2024"
   - Use cohort filter to view specific groups

3. **Notes**
   - Use the Notes field for important info
   - Example: "Needs payment reminder", "Design experience level: Intermediate"

4. **Financial Tracking**
   - Always enter payment amounts
   - Remaining amount calculates automatically
   - Sort by remaining to see who owes payment

5. **Checklist Management**
   - Check items as they're completed
   - Use Figma status for educational account requests
   - Mark checklist items as complete even if not applicable

---

## How to Share with Team

### If using Google Sheets:
1. Click **Share** button on Google Sheet
2. Add team member emails
3. Each person can open `index.html` file
4. Make sure they have access to the same Google Sheet
5. Data syncs automatically for all users

### If using Local Storage:
1. Export data as JSON
2. Share the JSON file via email or Drive
3. Team members can import it
4. Note: Changes won't sync (each person has local copy)

---

## File Structure

```
Course Dashboard/
├── index.html           # Main dashboard (open this in browser)
├── AppsScript.gs        # Google Apps Script (copy to Google Sheet)
└── README.md           # This file
```

---

## Browser Compatibility

✅ Chrome
✅ Firefox  
✅ Safari
✅ Edge

---

## Need Help?

1. **Check this README first** - most answers are here
2. **Check browser console** - Ctrl+Shift+J (Windows) or Cmd+Option+J (Mac)
3. **Verify Google Apps Script** - check Executions tab for errors
4. **Export and inspect** - use JSON export to verify data structure

---

## Version
v1.0 - January 2024

---

## Features Coming Soon
- Email notifications for payments due
- Bulk student import from CSV
- Student progress tracking
- Attendance tracking
- Certificate tracking
