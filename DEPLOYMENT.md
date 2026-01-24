# 🚀 Deployment Guide - Cohort Manager

Your code is now on GitHub! Here's how to get a live URL:

## Option 1: Vercel (Recommended - 2 minutes)

### Step 1: Visit Vercel
1. Go to https://vercel.com
2. Click **"Sign up"** (or login if you have an account)
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

### Step 2: Import Your Project
1. After login, you'll see "Create" button
2. Click **"Import Project"**
3. Paste your GitHub repo URL: `https://github.com/osama-eldrieny/cohort-manager`
4. Click **"Import"**

### Step 3: Configure & Deploy
1. Project name: `cohort-manager` (or whatever you prefer)
2. Framework: Select **"Other"** from dropdown
3. Click **"Deploy"**
4. Wait 2-3 minutes for deployment to complete

### ✅ Your Live URL will be:
```
https://cohort-manager.vercel.app
```

---

## Option 2: Railway.app (Alternative)

### Step 1: Visit Railway
1. Go to https://railway.app
2. Click **"Start Project"**
3. Select **"Deploy from GitHub"**
4. Authorize Railway

### Step 2: Select Your Repo
1. Find `cohort-manager` in your list
2. Click **"Deploy Now"**

### ✅ Your Live URL will be:
```
https://cohort-manager.up.railway.app
```

---

## Option 3: Heroku (Free tier)

### Step 1: Install Heroku CLI
```bash
brew tap heroku/brew && brew install heroku
```

### Step 2: Deploy
```bash
cd "/Users/oo/Library/CloudStorage/GoogleDrive-osama.eldrieny@gmail.com/My Drive/Design Tokens/Course Dashboard"
heroku login
heroku create cohort-manager
git push heroku main
```

### ✅ Your Live URL will be:
```
https://cohort-manager.herokuapp.com
```

---

## 📋 Your GitHub Repository

- **Repo URL**: https://github.com/osama-eldrieny/cohort-manager
- **Latest commit**: Notes column added to Students and Status pages
- **Vercel config**: Already included in `vercel.json`

---

## ✨ Latest Changes Deployed

✅ Analytics page merged into overview
✅ Charts center-aligned
✅ Students page: Removed Cohort & Paid/Total columns, added LinkedIn, WhatsApp, Notes
✅ Status pages: Added LinkedIn, WhatsApp, Notes columns
✅ SQLite database for persistent data
✅ Revenue privacy toggles
✅ Multi-select status filtering
✅ Onboarding checklist progress tracking

---

## 🎯 Next Steps

Choose your preferred deployment option above and follow the steps. **Vercel is easiest and fastest!**

Once deployed, you'll have a live URL you can share with your team.

---

**Need help?** Check the main [README.md](README.md) for more information.
