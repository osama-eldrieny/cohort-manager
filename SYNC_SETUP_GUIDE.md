# Google Sheets Sync Setup Guide

## Step 1: Get Your Google Sheet ID
1. Open your Google Sheet
2. Copy the ID from the URL: `https://docs.google.com/spreadsheets/d/**1ABC2xyz3DEF4ghi5JKL6mno7PQR8stu**`
3. The part in bold is your **SHEET_ID**

## Step 2: Create Google Apps Script
1. Go to [script.google.com](https://script.google.com)
2. Click **+ New Project**
3. Replace all content with the code from `GoogleAppsScript.gs` file
4. Update these two lines with YOUR values:
   ```javascript
   const SHEET_NAME = 'Students'; // Match your sheet tab name
   const SHEET_ID = 'YOUR_SHEET_ID'; // Paste your Google Sheet ID here
   ```

## Step 3: Deploy as Web App
1. Click **Deploy** → **New deployment**
2. Select type: **Web app**
3. Execute as: **Me (your Google account)**
4. Who has access: **Anyone**
5. Click **Deploy**
6. Copy the deployment URL shown

## Step 4: Update Dashboard
1. Open `app.js` in the Course Dashboard folder
2. Find this line (around line 11):
   ```javascript
   const GOOGLE_SHEET_URL = 'https://script.google.com/macros/d/YOUR_DEPLOYMENT_ID/usercallback';
   ```
3. Replace `YOUR_DEPLOYMENT_ID` with the deployment ID from your URL
   - Your URL looks like: `https://script.google.com/macros/s/AKfycbYr..../usercallback`
   - The ID is the part between `/s/` and `/usercallback`

## Step 5: Test the Sync
1. Open your Course Dashboard (http://localhost:8000)
2. Go to **Settings** page
3. Click **☁️ Update Sheet Now** button
4. You should see a success message: "✅ Successfully synced!"
5. Check your Google Sheet - it should now have all your students!

## Troubleshooting

### "Sync failed" error
- ✅ Check that GOOGLE_SHEET_URL is correct in app.js
- ✅ Make sure Google Apps Script is deployed as "Web app"
- ✅ Verify "Who has access" is set to "Anyone"

### Data not appearing in sheet
- ✅ Confirm SHEET_ID and SHEET_NAME are correct in GoogleAppsScript.gs
- ✅ Make sure you have edit permissions on the Google Sheet
- ✅ Try the "Test Sync" function in Apps Script editor

### Error in Apps Script
1. Open the Apps Script project
2. Click **Executions** tab to see what went wrong
3. Check the logs for detailed error messages

## Features
✅ Syncs all student data automatically  
✅ Includes onboarding checklist status  
✅ Adds timestamp of last sync  
✅ Auto-formats columns  
✅ Shows sync status in Settings page  
✅ Can be run manually anytime  

## What Gets Synced
- Student name, email, contact info
- Cohort assignment & status
- Financial data (total, paid, remaining)
- Notes & onboarding checklist
- Figma approval status
- Timestamp of sync

---

**Questions?** Check the error messages in the sync status box or review the Google Apps Script execution logs.
