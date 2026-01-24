# Node.js Server Setup for Auto-Save

This Node.js server automatically saves all student data to a `students.json` file on the project.

## Quick Start

### 1. Install Dependencies
```bash
cd "/Users/oo/Library/CloudStorage/GoogleDrive-osama.eldrieny@gmail.com/My Drive/Design Tokens/Course Dashboard"
npm install
```

### 2. Start the Server
```bash
npm start
```

You should see:
```
🚀 Course Dashboard Server running on http://localhost:3000
📁 Data file: /Users/oo/Library/CloudStorage/GoogleDrive-osama.eldrieny@gmail.com/My Drive/Design Tokens/Course Dashboard/students.json
```

### 3. Open Your Dashboard
Go to: `http://localhost:3000`

## Features

✅ **Auto-Save to File**: Every edit, add, or delete is automatically saved to `students.json`  
✅ **Fallback to localStorage**: If server is unavailable, data saves to browser storage  
✅ **Persistent Storage**: Data survives browser restarts and refreshes  
✅ **Server Static Files**: Serves your HTML, CSS, and JS files  

## API Endpoints

- **GET `/api/students`** - Load all students from students.json
- **POST `/api/students`** - Save students to students.json (auto-called by app)
- **GET `/api/export`** - Download students as JSON file
- **GET `/api/health`** - Check if server is running

## Console Output

When you make changes in the dashboard, you'll see:

```
✅ Auto-saved to server: 174 students   (when changes are saved)
⚠️ Server save failed, using localStorage only   (if server is unavailable)
✅ Loaded 174 students from server (students.json)   (on page load)
```

## Files Created

- **server.js** - Node.js/Express server
- **package.json** - Dependencies (express, cors)
- **students.json** - Auto-generated data file (created after first save)

## Troubleshooting

### "Port 3000 already in use"
Change the PORT in server.js to 3001 or kill the existing process:
```bash
lsof -i :3000
kill -9 <PID>
```

### "Cannot reach server"
Make sure the server is running:
```bash
npm start
```

### Data not saving
Check the console for errors and ensure the directory is writable.

## Stop the Server
Press `Ctrl+C` in the terminal running the server.
