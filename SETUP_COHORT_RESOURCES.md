# Cohort Links & Videos Feature - Setup Guide

## Overview
Added two new sections to each cohort page:
1. **Important Links** - Manage and display important resources/links for the cohort
2. **Session Recordings** - Manage and display video recordings with thumbnails

## What's Been Done ✅

### 1. **Frontend Code** (✅ Complete)
- **cohort_resources.js** - Full CRUD operations for links and videos
  - `renderCohortLinks(cohort)` - Renders links section
  - `renderCohortVideos(cohort)` - Renders videos section
  - Modal forms for add/edit operations
  - Full validation and error handling

- **app.js** - Updated cohort page rendering
  - Added containers for links and videos sections
  - Calls `renderCohortLinks()` and `renderCohortVideos()` after page loads
  - Integrates seamlessly with existing UI

### 2. **Backend API Endpoints** (✅ Complete)
All 8 endpoints added to **server.js**:
- `GET /api/cohort-links/:cohortName` - Fetch all links
- `POST /api/cohort-links` - Create new link
- `PUT /api/cohort-links/:id` - Update link
- `DELETE /api/cohort-links/:id` - Delete link
- `GET /api/cohort-videos/:cohortName` - Fetch all videos
- `POST /api/cohort-videos` - Create new video
- `PUT /api/cohort-videos/:id` - Update video
- `DELETE /api/cohort-videos/:id` - Delete video

### 3. **Database Functions** (✅ Complete)
Added to **database.js**:
- `getCohortLinks(cohortName)`
- `addCohortLink(cohortName, name, url)`
- `updateCohortLink(id, name, url)`
- `deleteCohortLink(id)`
- `getCohortVideos(cohortName)`
- `addCohortVideo(cohortName, name, thumbnail, url)`
- `updateCohortVideo(id, name, thumbnail, url)`
- `deleteCohortVideo(id)`

## What You Need To Do 🔧

### Step 1: Create Supabase Tables

You can do this in two ways:

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to https://app.supabase.com
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy all content from `sql_setup_cohort_resources.sql`
6. Paste into the query editor
7. Click **Execute**

#### Option B: Manual Table Creation in Supabase Dashboard
1. Click **Table Editor** (left sidebar)
2. Click **Create a new table**
3. Name: `cohort_links`
   - Column 1: `id` (BIGINT, Primary Key, Auto-increment)
   - Column 2: `cohort_name` (TEXT, Required)
   - Column 3: `name` (TEXT, Required)
   - Column 4: `url` (TEXT, Required)
   - Column 5: `created_at` (TIMESTAMP, Default: now())
   - Column 6: `updated_at` (TIMESTAMP, Default: now())

4. Create a new table
5. Name: `cohort_videos`
   - Column 1: `id` (BIGINT, Primary Key, Auto-increment)
   - Column 2: `cohort_name` (TEXT, Required)
   - Column 3: `name` (TEXT, Required)
   - Column 4: `thumbnail` (TEXT)
   - Column 5: `url` (TEXT, Required)
   - Column 6: `created_at` (TIMESTAMP, Default: now())
   - Column 7: `updated_at` (TIMESTAMP, Default: now())

### Step 2: Verify Tables Are Created
In Supabase SQL Editor, run:
```sql
SELECT * FROM cohort_links LIMIT 1;
SELECT * FROM cohort_videos LIMIT 1;
```

Both should work without errors (will show empty results if no data yet).

### Step 3: Test the Feature

1. **Start the local server** (if not running):
   ```bash
   npm start
   ```

2. **Open the app** in your browser:
   - http://localhost:3002

3. **Navigate to a cohort page** (e.g., click on any cohort)

4. **Add a Link**:
   - Scroll to "Important Links" section
   - Click "Add New Link"
   - Enter name and URL
   - Click "Save"
   - Link should appear in the list

5. **Add a Video**:
   - Scroll to "Session Recordings" section
   - Click "Add New Video"
   - Enter name, thumbnail URL (optional), and video URL
   - Click "Save"
   - Video should appear with thumbnail

6. **Edit/Delete**:
   - Click edit icon (pencil) on any item to modify
   - Click delete icon (trash) to remove
   - Changes saved immediately to Supabase

## Features

### Important Links Section
- **Add**: Button to create new link with name and URL
- **Display**: Table with link names, clickable URLs
- **Edit**: Modify name and URL
- **Delete**: Remove links
- **Data**: Saved per cohort to Supabase
- **Icons**: Link icon, edit/delete buttons

### Session Recordings Section
- **Add**: Button to create video with name, thumbnail, and URL
- **Display**: Grid of video cards with thumbnail images
- **Edit**: Modify name, thumbnail, and URL
- **Delete**: Remove videos
- **Data**: Saved per cohort to Supabase
- **Icons**: Video icon, edit/delete buttons, clickable thumbnails

## File Structure

```
├── cohort_resources.js          ← Frontend CRUD + modals
├── app.js                       ← Added containers + function calls
├── database.js                  ← Added DB helper functions
├── server.js                    ← Added 8 API endpoints
├── sql_setup_cohort_resources.sql  ← SQL to create tables
└── sql_setup_guide.md           ← This file
```

## API Examples

### Add a Link
```
POST /api/cohort-links
Body: {
  "cohort_name": "Web Design 101",
  "name": "Course Resources",
  "url": "https://example.com/resources"
}
```

### Add a Video
```
POST /api/cohort-videos
Body: {
  "cohort_name": "Web Design 101",
  "name": "Intro to CSS",
  "thumbnail": "https://img.youtube.com/vi/VIDEO_ID/0.jpg",
  "url": "https://youtube.com/watch?v=VIDEO_ID"
}
```

## Troubleshooting

### Issue: Links/videos section not showing
- **Check**: Is Supabase connected? (Server should show "database: ready")
- **Solution**: Verify SUPABASE_URL and SUPABASE_KEY in .env

### Issue: Can't save links/videos
- **Check**: Did you create the tables? (See Step 1 above)
- **Solution**: Run the SQL queries in Supabase SQL Editor

### Issue: Getting 404 error for API endpoints
- **Check**: Is the server running? (`npm start`)
- **Check**: Is server on port 3002? (Check package.json)
- **Solution**: Restart server with `npm start`

### Issue: Modal doesn't appear when clicking "Add"
- **Check**: Are you on a cohort page?
- **Check**: Open browser console for errors
- **Solution**: Verify cohort_resources.js is loaded (check Network tab)

## Next Steps (IMPORTANT!)

✅ **All code is ready locally**
⏳ **When you want to deploy to GitHub**:
1. Review the changes locally and test thoroughly
2. Push to GitHub only when everything works
3. Run: `git add -A && git commit -m "Add cohort links and videos management" && git push`

## Rollback (If Needed)

If you need to remove this feature:
1. Delete `cohort_resources.js`
2. Remove the script import from `index.html`
3. Remove the containers from `renderCohortPage()` in `app.js`
4. Remove API endpoints from `server.js`
5. Delete database functions from `database.js`
6. Drop tables in Supabase: `DROP TABLE cohort_links; DROP TABLE cohort_videos;`
