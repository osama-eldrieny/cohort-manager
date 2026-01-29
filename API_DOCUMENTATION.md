# API Documentation

## Column Preferences Endpoints

### Base URL
```
http://localhost:3002/api
```

---

## GET /column-preferences/:pageId

Fetch column visibility preferences for a specific page.

### Request
```http
GET /api/column-preferences/students
```

### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "page_id": "students",
    "visible_columns": ["col-id", "col-name", "col-email", "col-status"],
    "created_at": "2024-01-25T10:30:00Z",
    "updated_at": "2024-01-25T14:15:00Z"
  }
}
```

### Response (Not Found - 404)
```json
{
  "success": false,
  "message": "No preferences found for page: students"
}
```

### Response (Error - 500)
```json
{
  "success": false,
  "error": "Error message"
}
```

### Parameters
| Name | Type | Required | Description |
|------|------|----------|-------------|
| pageId | String (URL) | Yes | Unique page identifier (e.g., "students", "cohort-0", "status-waiting") |

### Example cURL
```bash
curl -X GET http://localhost:3002/api/column-preferences/students
```

---

## POST /column-preferences

Save or update column visibility preferences for a page.

### Request
```http
POST /api/column-preferences
Content-Type: application/json

{
  "pageId": "students",
  "visibleColumns": ["col-id", "col-name", "col-email", "col-status"]
}
```

### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "page_id": "students",
    "visible_columns": ["col-id", "col-name", "col-email", "col-status"],
    "created_at": "2024-01-25T10:30:00Z",
    "updated_at": "2024-01-25T14:15:00Z"
  }
}
```

### Response (Error - 400)
```json
{
  "success": false,
  "error": "Missing required fields"
}
```

### Response (Error - 500)
```json
{
  "success": false,
  "error": "Error message"
}
```

### Body Parameters
| Name | Type | Required | Description |
|------|------|----------|-------------|
| pageId | String | Yes | Unique page identifier |
| visibleColumns | Array[String] | Yes | Array of column IDs to show |

### Example cURL
```bash
curl -X POST http://localhost:3002/api/column-preferences \
  -H "Content-Type: application/json" \
  -d '{
    "pageId": "students",
    "visibleColumns": ["col-id", "col-name", "col-email", "col-status"]
  }'
```

### Example JavaScript
```javascript
async function savePreferences(pageId, visibleColumns) {
  const response = await fetch('/api/column-preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pageId, visibleColumns })
  });
  return response.json();
}
```

---

## DELETE /column-preferences/:pageId

Delete column visibility preferences for a page (resets to defaults).

### Request
```http
DELETE /api/column-preferences/students
```

### Response (Success - 200)
```json
{
  "success": true,
  "message": "Preferences deleted successfully"
}
```

### Response (Error - 500)
```json
{
  "success": false,
  "error": "Error message"
}
```

### Parameters
| Name | Type | Required | Description |
|------|------|----------|-------------|
| pageId | String (URL) | Yes | Unique page identifier |

### Example cURL
```bash
curl -X DELETE http://localhost:3002/api/column-preferences/students
```

### Example JavaScript
```javascript
async function resetPreferences(pageId) {
  const response = await fetch(`/api/column-preferences/${pageId}`, {
    method: 'DELETE'
  });
  return response.json();
}
```

---

## GET /column-preferences

Fetch all column visibility preferences for all pages.

### Request
```http
GET /api/column-preferences
```

### Response (Success - 200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "page_id": "students",
      "visible_columns": ["col-id", "col-name", "col-email"],
      "created_at": "2024-01-25T10:30:00Z",
      "updated_at": "2024-01-25T14:15:00Z"
    },
    {
      "id": 2,
      "page_id": "cohort-0",
      "visible_columns": ["col-id", "col-name", "col-email", "col-onboarding"],
      "created_at": "2024-01-25T10:35:00Z",
      "updated_at": "2024-01-25T14:20:00Z"
    }
  ]
}
```

### Response (Error - 500)
```json
{
  "success": false,
  "error": "Error message"
}
```

### Example cURL
```bash
curl -X GET http://localhost:3002/api/column-preferences
```

### Example JavaScript
```javascript
async function getAllPreferences() {
  const response = await fetch('/api/column-preferences');
  return response.json();
}
```

---

## Error Handling

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 200 | Success | Operation completed successfully |
| 400 | Bad Request | Check request body and parameters |
| 404 | Not Found | Page ID doesn't exist in preferences |
| 500 | Server Error | Server-side issue; check logs |

### Database Table Not Found

If the `user_preferences` table doesn't exist in Supabase:
- API calls return graceful errors
- Frontend falls back to localStorage
- No breaking changes to functionality

To create the table, run this SQL in Supabase:
```sql
CREATE TABLE IF NOT EXISTS user_preferences (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    page_id TEXT NOT NULL UNIQUE,
    visible_columns JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_page_id ON user_preferences(page_id);
```

---

## Page IDs Reference

### Students Pages
- `students` - Main students table

### Cohort Pages
- `cohort-0` - Cohort 0
- `cohort-1` - Cohort 1
- `cohort-2` - Cohort 2
- `cohort-3` - Cohort 3
- `cohort-english-1` - English 1
- `cohort-english-2` - English 2
- `cohort-english-3` - English 3

### Status Pages
- `status-waiting` - Waiting list
- `status-cant-reach` - Can't reach
- `status-next-cohort` - Next Cohort
- `status-standby` - Standby
- `status-graduated` - Graduated

---

## Column IDs Reference

### Students Page Columns
- `col-id` - ID number
- `col-name` - Student name
- `col-email` - Email address
- `col-status` - Current status
- `col-location` - Location
- `col-language` - Language
- `col-linkedin` - LinkedIn profile
- `col-whatsapp` - WhatsApp number
- `col-notes` - Notes
- `col-actions` - Actions button

### Cohort Page Columns
- `col-id` - ID number
- `col-name` - Student name
- `col-email` - Email address
- `col-figma-email` - Figma email
- `col-location` - Location
- `col-language` - Language
- `col-linkedin` - LinkedIn profile
- `col-whatsapp` - WhatsApp number
- `col-onboarding` - Onboarding progress %
- `col-post-course` - Post-course progress %
- `col-actions` - Actions button

### Status Page Columns
- `col-id` - ID number
- `col-name` - Student name
- `col-email` - Email address
- `col-location` - Location
- `col-language` - Language
- `col-linkedin` - LinkedIn profile
- `col-whatsapp` - WhatsApp number
- `col-notes` - Notes
- `col-onboarding` - Onboarding progress %
- `col-post-course` - Post-course progress %
- `col-actions` - Actions button

---

## Usage Examples

### Example 1: Get Current Preferences
```javascript
async function getCurrentPreferences() {
  try {
    const response = await fetch('/api/column-preferences/students');
    const result = await response.json();
    
    if (result.success) {
      console.log('Current columns:', result.data.visible_columns);
    } else {
      console.log('No preferences found, using defaults');
    }
  } catch (error) {
    console.error('Error fetching preferences:', error);
  }
}
```

### Example 2: Hide Specific Columns
```javascript
async function hideLocationsAndLanguage() {
  const currentPrefs = await fetch('/api/column-preferences/students')
    .then(r => r.json());
  
  const hiddenColumns = currentPrefs.data.visible_columns.filter(
    col => col !== 'col-location' && col !== 'col-language'
  );
  
  await fetch('/api/column-preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pageId: 'students',
      visibleColumns: hiddenColumns
    })
  });
}
```

### Example 3: Bulk Update Multiple Pages
```javascript
async function updateMultiplePages() {
  const pages = [
    { pageId: 'students', columns: ['col-id', 'col-name', 'col-email'] },
    { pageId: 'cohort-0', columns: ['col-id', 'col-name', 'col-onboarding'] },
    { pageId: 'cohort-1', columns: ['col-id', 'col-name', 'col-onboarding'] }
  ];
  
  for (const page of pages) {
    await fetch('/api/column-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageId: page.pageId,
        visibleColumns: page.columns
      })
    });
  }
}
```

---

## Rate Limiting

Currently, there is no rate limiting on these endpoints. If needed in the future, implement rate limiting using:
- Express rate limiter middleware
- Redis-backed rate limiting
- IP-based throttling

---

## Security Considerations

1. **No Authentication**: Currently, these endpoints are not authenticated
2. **Public Data**: Preferences are not user-specific; they're page-specific
3. **CORS**: Check CORS configuration if accessing from different domain
4. **Input Validation**: Server validates `pageId` and `visibleColumns` formats

To add user authentication in the future:
1. Add user_id to preferences table
2. Add auth middleware to routes
3. Filter results by authenticated user
4. Update client to pass user token

---

## Troubleshooting

### Issue: 404 Not Found on POST
**Solution**: Ensure Content-Type header is `application/json`

### Issue: Empty Column List
**Solution**: At least one column must be visible. Client prevents saving empty lists.

### Issue: Changes Not Persisting
**Solution**: Check if database table exists. Run migration SQL if needed.

### Issue: Slow API Calls
**Solution**: Ensure `idx_page_id` index is created on Supabase

---

## Version History

- **v1.0** (2024-01-25): Initial release with 4 endpoints
  - GET /api/column-preferences/:pageId
  - POST /api/column-preferences
  - DELETE /api/column-preferences/:pageId
  - GET /api/column-preferences
