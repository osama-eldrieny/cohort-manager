# Student Checklist System - Complete Flow Documentation

## System Overview

The checklist system tracks which students have completed which checklist items across different categories (Onboarding Checklist, Post-Course Actions, etc.). The percentages shown in the dashboard are calculated based on completion status.

---

## Database Schema

### Tables

#### `checklist_items`
```sql
CREATE TABLE checklist_items (
    id SERIAL PRIMARY KEY,
    category VARCHAR(255) NOT NULL,     -- e.g., "Onboarding Checklist"
    label VARCHAR(255) NOT NULL,        -- e.g., "Complete profile"
    sort_position INTEGER DEFAULT 999,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### `student_checklist_completion`
```sql
CREATE TABLE student_checklist_completion (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    checklist_item_id INTEGER NOT NULL REFERENCES checklist_items(id),
    completed_at TIMESTAMP,
    created_at TIMESTAMP,
    UNIQUE(student_id, checklist_item_id)
);
```

**Key Point**: The `UNIQUE` constraint prevents duplicate entries for the same (student, item) pair.

---

## Data Flow

### 1. **Editing a Student**

When you click "Edit" on a student:

```
User clicks Edit → editStudent(id)
  ├─ Load student object from `students` array
  ├─ Populate form fields
  ├─ Call loadStudentChecklistCompletion(student.id)
  │  └─ Fetch from API: GET /api/students/{id}/checklist-completion
  │     └─ Load into global variable: currentStudentChecklistCompletion[]
  └─ Call renderDynamicChecklist(student)
     ├─ Get completed IDs from currentStudentChecklistCompletion
     ├─ Normalize all IDs to numbers (parseInt)
     └─ Render checkboxes: checked if ID in completedItemIds Set
```

### 2. **Saving Changes**

When you click "Save":

```
User clicks Save → saveStudent()
  ├─ Collect form data
  ├─ Get selected checklist items from DOM
  │  └─ Call getSelectedChecklistItems()
  │     └─ Read all .checklist-checkbox:checked elements
  │        └─ Return array of item IDs (normalized to integers)
  ├─ Save student data
  │  └─ POST /api/students (or UPSERT if editing)
  ├─ **AWAIT** checklist completion save ⭐ (CRITICAL)
  │  └─ POST /api/students/{id}/checklist-completion
  │     ├─ Backend: DELETE old entries for this student
  │     └─ Backend: INSERT new entries from completedItemIds
  └─ **AWAIT** loadStudents()
     ├─ Reload all students from server
     └─ loadChecklistCompletionForAllStudents()
        └─ Populate student.checklistCompletion for each student
           └─ Re-render page with fresh data
```

### 3. **Calculating Percentages**

#### Onboarding Progress
```javascript
calculateChecklistProgress(student)
  ├─ Find all "Onboarding Checklist" items (exclude placeholders)
  ├─ Normalize student.checklistCompletion IDs to numbers
  ├─ Count matching items
  └─ Return percentage
```

#### Post-Course Progress
```javascript
calculatePostCourseProgress(student)
  ├─ Find all "Post-Course Actions" items (exclude placeholders)
  ├─ Normalize student.checklistCompletion IDs to numbers
  ├─ Count matching items
  └─ Return percentage
```

---

## API Endpoints

### GET `/api/checklist-items`
Returns all checklist items grouped by category.

**Response:**
```json
[
  {
    "id": 1,
    "category": "Onboarding Checklist",
    "label": "Complete profile",
    "sort_position": 999,
    "created_at": "2026-02-01T..."
  }
]
```

### GET `/api/students/{id}/checklist-completion`
Returns completed checklist items for a student.

**Response:**
```json
[
  {
    "id": 924,
    "student_id": "1769959344",
    "checklist_item_id": 9,
    "completed_at": "2026-02-02T09:45:23.065",
    "created_at": "2026-02-02T09:45:23.431417"
  }
]
```

### POST `/api/students/{id}/checklist-completion`
Save/update checklist completion for a student.

**Request:**
```json
{
  "completedItemIds": [1, 2, 3, 5]
}
```

**Backend Logic:**
1. Delete all existing entries for this student
2. Insert new entries for each item in completedItemIds
3. Return the newly inserted entries

---

## Critical Fixes Applied

### 1. **Data Type Normalization** ✅
**Problem**: `checklist_item_id` from Supabase could be string or number, causing Set.has() to fail.

**Solution**: All IDs are explicitly converted to integers using `parseInt()` before comparisons.

**Files Fixed:**
- `renderDynamicChecklist()` - Normalizes loaded completion data
- `getSelectedChecklistItems()` - Normalizes DOM selections
- `calculateChecklistProgress()` - Normalizes for percentage calculation
- `calculatePostCourseProgress()` - Normalizes for percentage calculation

### 2. **Async/Await for Save Operations** ✅
**Problem**: Checklist completion was saved asynchronously without awaiting, so `loadStudents()` could complete before the save was finished.

**Solution**: The code now awaits the POST request for checklist completion before proceeding to reload student data.

**Code Location**: `app.js`, lines ~2540-2570 in `saveStudent()`

### 3. **Cascade Delete for Related Records** ✅
**Problem**: Deleting a checklist item failed if student completion records referenced it.

**Solution**: `deleteChecklistItem()` in `database.js` now:
1. Deletes dependent `student_checklist_completion` records first
2. Then deletes the checklist item itself

---

## Debugging Checklist Issues

### Check 1: Verify Database Data
```bash
# Get a student
curl http://localhost:3002/api/students | jq '.[0] | {id, name}'

# Get their checklist completion
curl http://localhost:3002/api/students/STUDENT_ID/checklist-completion | jq '.[].checklist_item_id'
```

### Check 2: Test Save Operation
```bash
# Save with items 1, 2, 3
curl -X POST http://localhost:3002/api/students/STUDENT_ID/checklist-completion \
  -H "Content-Type: application/json" \
  -d '{"completedItemIds": [1, 2, 3]}'

# Verify
curl http://localhost:3002/api/students/STUDENT_ID/checklist-completion | jq 'length'
```

### Check 3: Browser Console Logging
Open browser DevTools and look for logs like:
```
📋 Rendering checklist for student: {
  totalItems: 15,
  completedItems: 7,
  completedItemIds: [1, 2, 3, 4, 13, 14, 10]
}

📊 Checklist progress for Student Name (ID: 123):
{onboardingItems: 5, completedOnboardingItems: 4, percentage: 80}

📊 Post-course progress for Student Name (ID: 123):
{postCourseItems: 3, completedPostCourseItems: 2, percentage: 67}
```

---

## Expected Behavior

### When Editing a Student
✅ All previously completed checklist items show as checked
✅ Unchecking an item removes the checkmark
✅ Checking an item adds the checkmark

### When Saving
✅ Selected items are saved to the database
✅ Page refreshes to show latest data
✅ Onboarding and Post-Course percentages update automatically

### When Reopening Student
✅ Previously saved state is restored from database
✅ No stale data or cached values
✅ All percentages match the actual completion count

---

## Recent Commits

1. **0dbbb24** - Fix checklist data type consistency
2. **98e536d** - Fix post-course progress percentage calculation
3. **0e13c32** - Fix checklist persistence (wait for save before reload)
4. **6bd352d** - Fix cascade delete for checklist items

---

## Key Variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `currentStudentChecklistCompletion` | Global | Stores completion data for student being edited |
| `student.checklistCompletion` | Per-student | Completion data in the student object |
| `checklistItems` | Global | All available checklist items |
| `selectedChecklistItems` | Local | Items selected in the current form |

---

## Notes

- Placeholders (items starting with `~`) are filtered out everywhere
- Percentages are calculated separately for each category
- The system supports multiple checklist categories (Onboarding, Post-Course, etc.)
- All operations are atomic at the database level
