# GitHub Sync Guide

## Overview
This guide explains how to automatically sync your local server with the latest code from GitHub.

## Quick Start

### Manual Sync (One-Time)
```bash
npm run sync
```

This will:
1. ✅ Fetch latest changes from GitHub
2. ✅ Compare local version with remote
3. ✅ Pull if versions don't match
4. ✅ Restart server automatically if changes were pulled

### View Sync Logs
```bash
tail -f sync-log.txt
```

## Usage Scenarios

### Scenario 1: Check and Sync Manually
When you want to manually check for updates:
```bash
node sync-from-github.js
```

### Scenario 2: Automatic Sync Every 5 Minutes
Set up a cron job to auto-sync every 5 minutes:

```bash
# Edit crontab
crontab -e

# Add this line to run sync every 5 minutes
*/5 * * * * cd /Users/oo/Library/CloudStorage/GoogleDrive-osama.eldrieny@gmail.com/My\ Drive/Design\ Tokens/Course\ Dashboard && node sync-from-github.js >> sync-log.txt 2>&1
```

### Scenario 3: On-Demand via API
You can trigger sync from a webhook or API call:

```bash
# Add this to your server.js to expose a sync endpoint:
app.post('/api/sync', async (req, res) => {
    try {
        execSync('node sync-from-github.js', { stdio: 'inherit' });
        res.json({ success: true, message: 'Sync completed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

## What the Script Does

1. **Fetches from GitHub** - Gets latest commits without merging
2. **Compares versions** - Checks if local matches remote
3. **Pulls if different** - Automatically pulls latest if versions don't match
4. **Restarts server** - Kills old process and starts new one with updated code
5. **Logs everything** - All actions logged to `sync-log.txt`

## Log File Location
```
sync-log.txt
```

Example log output:
```
[2026-01-25T10:30:45.123Z] 🔄 Starting sync check with GitHub...
[2026-01-25T10:30:45.456Z] 📥 Fetching from GitHub...
[2026-01-25T10:30:47.789Z]    Local commit: f0e2e8c
[2026-01-25T10:30:47.890Z]    Remote commit: a1b2c3d
[2026-01-25T10:30:47.891Z] ⚠️  Local version differs from GitHub - pulling changes...
[2026-01-25T10:30:50.123Z] ✅ Successfully pulled latest changes from GitHub
[2026-01-25T10:30:50.124Z] 💾 Restarting server to apply changes...
[2026-01-25T10:30:50.456Z]    ⏹️  Old server stopped
[2026-01-25T10:30:52.789Z]    🚀 Starting new server...
[2026-01-25T10:30:53.012Z] ✅ Server restarted with latest code
[2026-01-25T10:30:53.013Z] ✅ Sync completed successfully
```

## Requirements
- Git must be installed
- Node.js must be installed
- You must have write permissions to the project directory
- The `.git` folder must exist (it's part of your repository)

## Troubleshooting

### "Permission denied" error
```bash
# Make script executable
chmod +x sync-from-github.js
```

### "git not found" error
Install Git on your system. For macOS:
```bash
brew install git
```

### Server not restarting
Check if the old process is still running:
```bash
ps aux | grep "node server.js"

# If stuck, kill manually:
pkill -f "node server.js"
```

### Check if sync worked
```bash
# View last 20 lines of sync log
tail -20 sync-log.txt

# View real-time updates
tail -f sync-log.txt
```

## Integration with Your Workflow

### Option A: Manual Before Starting Work
Before starting to work on the dashboard:
```bash
npm run sync
```

### Option B: Automatic via Cron (Recommended)
Set it to sync every hour:
```bash
crontab -e

# Add:
0 * * * * cd /path/to/project && node sync-from-github.js >> sync-log.txt 2>&1
```

### Option C: GitHub Webhook
Push to GitHub → Webhook triggers → Server pulls automatically

## Status Check

Check if local is synced with GitHub:
```bash
git fetch origin main
git log --oneline -1 HEAD
git log --oneline -1 origin/main
# If hashes are the same, you're synced ✅
```

## Notes
- ✅ Safe to run multiple times
- ✅ Won't lose local changes (git pull merges properly)
- ✅ Logs all activity for debugging
- ✅ Automatically restarts server when changes detected
- ✅ If remote hasn't changed, nothing happens
