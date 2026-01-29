# Implementation Guide - Column Preferences Feature

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Implementation Details](#implementation-details)
4. [Code Files Modified](#code-files-modified)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Frontend Integration](#frontend-integration)
8. [Error Handling](#error-handling)
9. [Testing](#testing)
10. [Deployment](#deployment)

---

## Overview

### Feature Summary
Column Preferences allows users to customize which columns are visible in student data tables across the Course Dashboard. Preferences are persisted to Supabase database with localStorage fallback.

### Key Benefits
- **User Customization**: Control table display per page
- **Cross-Device Sync**: Preferences sync via Supabase
- **Offline Support**: Works offline with localStorage fallback
- **Graceful Degradation**: Functions without database table
- **Production Ready**: Comprehensive error handling

### Technology Stack
- **Frontend**: Vanilla JavaScript ES6+
- **Backend**: Node.js/Express
- **Database**: Supabase PostgreSQL
- **Cache**: Browser localStorage
- **API**: REST with JSON

---

## Architecture

### System Architecture Diagram
```
┌─────────────────────────────────────────────────────────┐
│                   USER INTERFACE                         │
│              (HTML Modal + JavaScript)                   │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│  app.js Events   │      │  localStorage    │
│  Handlers        │      │  Fallback        │
└────────┬─────────┘      └──────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│    Express.js REST API (server.js)          │
│  /api/column-preferences                    │
│  GET, POST, DELETE                          │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│     Database Layer (database.js)            │
│   5 Functions for DB Operations             │
└────────────┬────────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌─────────────┐  ┌──────────────────┐
│  Supabase   │  │  localStorage    │
│  PostgreSQL │  │  (Backup)        │
└─────────────┘  └──────────────────┘
```

### Data Flow

#### Save Preferences
```
1. User clicks "Apply" button
   ↓
2. applyColumnPreferences(pageId) called
   ↓
3. saveColumnPreferences(pageId, columns) called
   ↓
4. POST /api/column-preferences
   ↓
5. database.saveColumnPreferences() executed
   ↓
6. UPSERT to user_preferences table
   ↓
7. localStorage updated (cache)
   ↓
8. Response sent back
   ↓
9. applyColumnVisibility() called
   ↓
10. Table re-rendered
```

#### Load Preferences
```
1. Page loads
   ↓
2. renderStudentsTable() called
   ↓
3. applyColumnVisibility(pageId) called
   ↓
4. getColumnPreferences(pageId) called
   ↓
5. GET /api/column-preferences/:pageId
   ↓
6. database.getColumnPreferences() executed
   ↓
7. Query user_preferences table
   ↓
8. Return data or null
   ↓
9. App checks: Supabase data → localStorage → defaults
   ↓
10. Apply visibility to table columns
```

---

## Implementation Details

### 1. Frontend Implementation (app.js)

#### Modal Creation
```javascript
function createColumnControlModal(pageId, pageTitle) {
  // Creates modal with:
  // - Title
  // - Checkboxes for each column
  // - Apply/Reset/Close buttons
  // - Event listeners for async operations
}
```

**Location**: Lines ~222-270 in app.js

#### Preference Retrieval
```javascript
async function getColumnPreferences(pageId) {
  // 1. Try API first
  // 2. Fall back to localStorage
  // 3. Fall back to defaults
  // 4. Cache in localStorage
}
```

**Location**: Lines ~106-141 in app.js

#### Preference Saving
```javascript
async function saveColumnPreferences(pageId, visibleColumns) {
  // 1. POST to API
  // 2. Update localStorage
  // 3. Handle errors gracefully
}
```

**Location**: Lines ~143-160 in app.js

#### Apply Preferences
```javascript
async function applyColumnPreferences(pageId) {
  // 1. Get selected columns from modal
  // 2. Save to database
  // 3. Re-render table
  // 4. Show confirmation
}
```

**Location**: Lines ~272-285 in app.js

#### Reset Preferences
```javascript
async function resetColumnPreferences(pageId) {
  // 1. DELETE to API
  // 2. Remove from localStorage
  // 3. Re-render with defaults
}
```

**Location**: Lines ~287-302 in app.js

#### Apply Visibility
```javascript
async function applyColumnVisibility(tableBodyId, pageId, pageType) {
  // 1. Get preferences
  // 2. Hide/show columns
  // 3. Update table display
}
```

**Location**: Lines ~183-220 in app.js

### 2. Backend Implementation (server.js)

#### API Endpoint: GET /api/column-preferences/:pageId
```javascript
app.get('/api/column-preferences/:pageId', async (req, res) => {
  const { pageId } = req.params;
  const data = await getColumnPreferences(pageId);
  
  if (data) {
    res.json({ success: true, data });
  } else {
    res.status(404).json({ success: false, message: 'No preferences found' });
  }
});
```

#### API Endpoint: POST /api/column-preferences
```javascript
app.post('/api/column-preferences', async (req, res) => {
  const { pageId, visibleColumns } = req.body;
  
  if (!pageId || !visibleColumns) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }
  
  const result = await saveColumnPreferences(pageId, visibleColumns);
  res.json({ success: true, data: result });
});
```

#### API Endpoint: DELETE /api/column-preferences/:pageId
```javascript
app.delete('/api/column-preferences/:pageId', async (req, res) => {
  const { pageId } = req.params;
  await deleteColumnPreferences(pageId);
  res.json({ success: true, message: 'Deleted successfully' });
});
```

#### API Endpoint: GET /api/column-preferences
```javascript
app.get('/api/column-preferences', async (req, res) => {
  const data = await getAllColumnPreferences();
  res.json({ success: true, data });
});
```

**Location**: Lines ~390-460 in server.js

### 3. Database Implementation (database.js)

#### Function: initializeColumnPreferencesTable()
```javascript
async function initializeColumnPreferencesTable() {
  // Verifies table exists
  // Logs info if missing
  // Enables graceful fallback
}
```

**Location**: Lines ~490-505 in database.js

#### Function: getColumnPreferences(pageId)
```javascript
async function getColumnPreferences(pageId) {
  // SELECT * FROM user_preferences WHERE page_id = pageId
  // Returns null if error or table missing
}
```

**Location**: Lines ~507-540 in database.js

#### Function: saveColumnPreferences(pageId, visibleColumns)
```javascript
async function saveColumnPreferences(pageId, visibleColumns) {
  // UPSERT to user_preferences
  // INSERT if new, UPDATE if exists
  // Returns saved data or null
}
```

**Location**: Lines ~542-580 in database.js

#### Function: deleteColumnPreferences(pageId)
```javascript
async function deleteColumnPreferences(pageId) {
  // DELETE FROM user_preferences WHERE page_id = pageId
  // Returns true even if table missing
}
```

**Location**: Lines ~582-610 in database.js

#### Function: getAllColumnPreferences()
```javascript
async function getAllColumnPreferences() {
  // SELECT * FROM user_preferences ORDER BY updated_at DESC
  // Returns array, empty array on error
}
```

**Location**: Lines ~612-635 in database.js

---

## Code Files Modified

### 1. app.js
**Type**: Frontend Logic
**Lines Changed**: ~150 lines
**Functions Added/Modified**: 7

| Function | Type | Lines | Changes |
|----------|------|-------|---------|
| getColumnPreferences | Modified | 106-141 | Async, API-first |
| saveColumnPreferences | Modified | 143-160 | Async, dual-save |
| isColumnVisible | Modified | 162-168 | Signature updated |
| applyColumnVisibility | Modified | 183-220 | Async with await |
| createColumnControlModal | Modified | 222-270 | Async, events added |
| applyColumnPreferences | Modified | 272-285 | Async, API call added |
| resetColumnPreferences | Modified | 287-302 | Async, DELETE call added |

**Key Changes**:
- Functions converted to async/await
- API calls added with error handling
- Event listeners replace onclick handlers
- localStorage fallback on all errors

### 2. server.js
**Type**: Backend API
**Lines Added**: ~70 lines
**Functions Added**: 1
**Routes Added**: 4

| Route | Method | Lines | Purpose |
|-------|--------|-------|---------|
| /api/column-preferences/:pageId | GET | ~395-405 | Fetch preferences |
| /api/column-preferences | POST | ~407-425 | Save preferences |
| /api/column-preferences/:pageId | DELETE | ~427-440 | Delete preferences |
| /api/column-preferences | GET | ~442-455 | Get all preferences |

**Imports Added**: 5 new database functions

**Startup**: Added `await initializeColumnPreferencesTable()`

### 3. database.js
**Type**: Database Layer
**Lines Added**: ~150 lines
**Functions Added**: 5

| Function | Purpose | Lines | Error Handling |
|----------|---------|-------|-----------------|
| initializeColumnPreferencesTable | Verify table exists | 490-505 | Logs if missing |
| getColumnPreferences | Fetch preferences | 507-540 | Returns null |
| saveColumnPreferences | Save/update preferences | 542-580 | Returns null |
| deleteColumnPreferences | Delete preferences | 582-610 | Returns true |
| getAllColumnPreferences | Get all preferences | 612-635 | Returns [] |

**All functions**:
- Have error handling for missing table
- Check error code 42P01 (table not found)
- Log warnings instead of errors
- Return sensible defaults

### 4. migrations/001_create_user_preferences.sql (New)
**Type**: Database Schema
**Lines**: ~15

```sql
CREATE TABLE user_preferences (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    page_id TEXT NOT NULL UNIQUE,
    visible_columns JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_id ON user_preferences(page_id);
```

---

## Database Schema

### Table: user_preferences

#### Purpose
Store column visibility preferences for each dashboard page.

#### Structure
```sql
CREATE TABLE user_preferences (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    page_id TEXT NOT NULL UNIQUE,
    visible_columns JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO | Unique row identifier |
| page_id | TEXT | NOT NULL, UNIQUE | Page identifier (e.g., "students") |
| visible_columns | JSONB | NOT NULL | JSON array of column IDs |
| created_at | TIMESTAMP | DEFAULT NOW | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW | Last modification timestamp |

#### Indexes
```sql
CREATE INDEX idx_page_id ON user_preferences(page_id);
```

**Purpose**: O(log n) lookup by page_id

#### Example Data
```sql
INSERT INTO user_preferences (page_id, visible_columns)
VALUES (
  'students',
  '["col-id", "col-name", "col-email", "col-status"]'::jsonb
);
```

---

## API Endpoints

### Endpoint 1: GET /api/column-preferences/:pageId

**Purpose**: Fetch preferences for a specific page

**Request**:
```http
GET /api/column-preferences/students
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "page_id": "students",
    "visible_columns": ["col-id", "col-name"],
    "created_at": "2024-01-25T10:30:00Z",
    "updated_at": "2024-01-25T14:15:00Z"
  }
}
```

**Response (404)**:
```json
{
  "success": false,
  "message": "No preferences found for page: students"
}
```

---

### Endpoint 2: POST /api/column-preferences

**Purpose**: Save or update preferences

**Request**:
```http
POST /api/column-preferences
Content-Type: application/json

{
  "pageId": "students",
  "visibleColumns": ["col-id", "col-name", "col-email"]
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "page_id": "students",
    "visible_columns": ["col-id", "col-name", "col-email"],
    "created_at": "2024-01-25T10:30:00Z",
    "updated_at": "2024-01-25T14:15:00Z"
  }
}
```

---

### Endpoint 3: DELETE /api/column-preferences/:pageId

**Purpose**: Delete preferences (reset to defaults)

**Request**:
```http
DELETE /api/column-preferences/students
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Preferences deleted successfully"
}
```

---

### Endpoint 4: GET /api/column-preferences

**Purpose**: Fetch all preferences

**Request**:
```http
GET /api/column-preferences
```

**Response (200)**:
```json
{
  "success": true,
  "data": [
    { "page_id": "students", "visible_columns": [...] },
    { "page_id": "cohort-0", "visible_columns": [...] }
  ]
}
```

---

## Frontend Integration

### Modal Initialization

```javascript
// In any page rendering function
const columnControlBtn = document.getElementById('column-control-btn');
columnControlBtn.addEventListener('click', async () => {
  await createColumnControlModal('students', 'Students');
});
```

### Modal Elements

```html
<div id="columnModal" class="modal">
  <div class="modal-content">
    <h3>Visible Columns</h3>
    
    <div id="columnCheckboxes">
      <!-- Generated by createColumnControlModal() -->
    </div>
    
    <div class="modal-buttons">
      <button data-action="apply">Apply</button>
      <button data-action="reset">Reset to Default</button>
      <button data-action="close">Close</button>
    </div>
  </div>
</div>
```

### Event Handling

```javascript
// Apply button
document.querySelector('[data-action="apply"]')
  .addEventListener('click', async () => {
    await applyColumnPreferences(currentPageId);
  });

// Reset button
document.querySelector('[data-action="reset"]')
  .addEventListener('click', async () => {
    await resetColumnPreferences(currentPageId);
  });

// Close button
document.querySelector('[data-action="close"]')
  .addEventListener('click', () => {
    document.getElementById('columnModal').style.display = 'none';
  });
```

---

## Error Handling

### Error Codes

#### 42P01: Table Does Not Exist
```javascript
if (error.code === '42P01') {
  console.warn('user_preferences table not found - using localStorage');
  return null; // Graceful fallback
}
```

#### PGRST116: No Record Found
```javascript
if (error.code === 'PGRST116') {
  console.log('No preferences found - using defaults');
  return null;
}
```

#### Network Errors
```javascript
.catch(error => {
  console.error('Network error:', error);
  // Fall back to localStorage
  return getFromLocalStorage(pageId);
});
```

### Error Recovery Strategy

```
Try Supabase
  ↓ [Error]
Try localStorage
  ↓ [Error/Missing]
Use defaults
  ↓
Apply to table
```

### Logging

```javascript
// Errors (non-fatal)
console.error('Error fetching preferences:', error);

// Warnings (expected cases)
console.warn('Column preferences table not found');

// Info (normal flow)
console.log('Column preferences loaded from database');
```

---

## Testing

### Manual Testing Checklist

#### Functionality
- [ ] Click "Columns" button - modal opens
- [ ] Check/uncheck columns - checkboxes work
- [ ] Click "Apply" - preferences save
- [ ] Refresh page - preferences persist
- [ ] Click "Reset to Default" - all columns show
- [ ] Multiple pages have separate preferences

#### Database Integration
- [ ] Preferences saved to Supabase
- [ ] Preferences sync on second device/browser
- [ ] Database errors logged correctly
- [ ] localStorage fallback works offline

#### Error Scenarios
- [ ] Works without database table
- [ ] Handles network errors gracefully
- [ ] Shows user-friendly messages
- [ ] Doesn't break on edge cases

### API Testing

#### Test GET endpoint
```bash
curl http://localhost:3002/api/column-preferences/students
```

#### Test POST endpoint
```bash
curl -X POST http://localhost:3002/api/column-preferences \
  -H "Content-Type: application/json" \
  -d '{"pageId":"students","visibleColumns":["col-id"]}'
```

#### Test DELETE endpoint
```bash
curl -X DELETE http://localhost:3002/api/column-preferences/students
```

#### Test GET all endpoint
```bash
curl http://localhost:3002/api/column-preferences
```

---

## Deployment

### Pre-Deployment Checklist
- [x] All syntax checked with `node -c`
- [x] Database functions have error handling
- [x] API endpoints tested
- [x] localStorage fallback verified
- [x] Code committed to git
- [x] Documentation updated

### Deployment Steps

1. **Commit Code**
   ```bash
   git add -A
   git commit -m "Add column preferences feature"
   git push origin main
   ```

2. **Deploy to Server**
   ```bash
   # Pull latest code
   git pull origin main
   
   # Restart server
   npm stop
   npm start
   ```

3. **Create Database Table (Optional)**
   - Go to Supabase dashboard
   - SQL Editor
   - Run: migrations/001_create_user_preferences.sql

4. **Verify Deployment**
   ```bash
   curl http://your-domain.com/api/health
   # Should return: {"status":"OK","database":"ready"}
   ```

### Rollback Plan
If issues occur:

1. Revert code: `git revert [commit-hash]`
2. Restart server: `npm restart`
3. Check logs: `tail -f /tmp/server.log`
4. localStorage will keep system functional

---

## Files Summary

| File | Type | Status | Purpose |
|------|------|--------|---------|
| app.js | JavaScript | Modified | Frontend logic |
| server.js | JavaScript | Modified | API endpoints |
| database.js | JavaScript | Modified | Database layer |
| migrations/001_create_user_preferences.sql | SQL | New | Schema setup |
| COLUMN_VISIBILITY_GUIDE.md | Documentation | Updated | User guide |
| API_DOCUMENTATION.md | Documentation | New | API reference |
| DATABASE_SETUP.md | Documentation | New | Setup guide |
| QUICK_REFERENCE.md | Documentation | New | Quick ref |
| IMPLEMENTATION_GUIDE.md | Documentation | New | This file |

---

## Support & References

- **User Guide**: COLUMN_VISIBILITY_GUIDE.md
- **API Reference**: API_DOCUMENTATION.md
- **Database Setup**: DATABASE_SETUP.md
- **Quick Reference**: QUICK_REFERENCE.md
- **Source Code**: app.js, server.js, database.js

