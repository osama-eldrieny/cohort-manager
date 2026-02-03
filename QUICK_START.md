# Quick Start - Cohort Links & Videos Feature

## ⚡ TL;DR

You now have a new feature that lets admins add **Important Links** and **Session Recordings** to each cohort page. Everything is coded and ready - just need to:

1. Create 2 database tables in Supabase
2. Test it locally
3. Ask me to push to GitHub

## 📋 One-Time Setup (5 minutes)

### Create Database Tables
1. Go to https://app.supabase.com → Your Project
2. Click **SQL Editor** on the left
3. Click **New Query**
4. Copy-paste the SQL from: **`sql_setup_cohort_resources.sql`**
5. Click **Execute**

Done! Tables are created.

## 🧪 Testing (2 minutes)

1. Open http://localhost:3002
2. Click on any cohort to go to its page
3. Scroll down - you'll see two new sections:
   - **Important Links**
   - **Session Recordings**

### Try Adding a Link
1. Click "Add New Link" button
2. Enter: Name = "Course Resources", URL = "https://example.com"
3. Click "Save"
4. Link appears in the table and opens in new tab when clicked

### Try Adding a Video
1. Click "Add New Video" button
2. Enter:
   - Name: "Intro Video"
   - Thumbnail: `https://via.placeholder.com/300x200`
   - URL: "https://youtube.com/embed/dQw4w9WgXcQ"
3. Click "Save"
4. Video card appears with thumbnail and opens on click

### Edit/Delete
- Click the ✏️ pencil icon to edit
- Click the 🗑️ trash icon to delete
- Refresh the page - data persists! (saved to Supabase)

## 📁 What Was Added

| File | Changes | Status |
|------|---------|--------|
| `cohort_resources.js` | NEW file (492 lines) - All UI logic | ✅ Ready |
| `app.js` | +16 lines (added containers) | ✅ Ready |
| `server.js` | +8 endpoints (~180 lines) | ✅ Ready |
| `database.js` | +8 functions (at end) | ✅ Ready |
| `index.html` | +1 import line | ✅ Ready |

## 🎯 Features

✅ Add unlimited links and videos per cohort
✅ Edit names, URLs, and thumbnails
✅ Delete items (with confirmation)
✅ Data persists across page refreshes
✅ Responsive design on all screen sizes
✅ Works completely offline with graceful fallback
✅ Full error handling and validation

## 🐛 Troubleshooting

**Q: Links/videos section doesn't show?**
A: Run the SQL from `sql_setup_cohort_resources.sql` first

**Q: Can't save new items?**
A: Check browser console (right-click → Inspect → Console tab). Make sure server is running (`npm start`)

**Q: Changes not saving?**
A: Verify Supabase tables were created (check Supabase dashboard → Table Editor)

**Q: Getting 404 errors?**
A: Server crashed. Run `npm start` again.

## 📞 Next Steps

When you're ready to push to GitHub, just tell me! I'll commit all changes with a clear message.

Remember: **All code is local only** - not pushed yet as you requested.

## 📚 Full Documentation

For more details, see:
- `SETUP_COHORT_RESOURCES.md` - Complete setup guide
- `IMPLEMENTATION_STATUS.md` - What was done and what's pending
