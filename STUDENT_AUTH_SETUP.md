# Student Authentication & Dashboard Setup Guide

## Overview

This guide explains how to set up the student authentication system that allows:
- Students to login with their email and a password set by admin
- Students to access their personalized dashboard showing:
  - Personal Information (Name, Email, Figma Email)
  - Assigned Cohort
  - Payment information (Amount Paid, Remaining Balance)
  - Cohort-specific resources (Links)
  - Cohort-specific recorded videos

## Architecture

### Database Schema

#### 1. `student_passwords` Table
Stores student login credentials.

```sql
CREATE TABLE student_passwords (
  id UUID PRIMARY KEY,
  student_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 2. `student_sessions` Table
Manages student session tokens (similar to admin sessions).

```sql
CREATE TABLE student_sessions (
  id UUID PRIMARY KEY,
  student_id TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN
);
```

### API Endpoints

#### Student Authentication Endpoints

**POST `/api/student/login`**
- **Description**: Student login
- **Body**: `{ email: string, password: string }`
- **Response**: `{ success: true, user: {...}, sessionToken: string }`
- **Status**: 401 if credentials invalid

**POST `/api/student/verify`**
- **Description**: Verify student session token
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success: true, user: {...} }`
- **Status**: 401 if token invalid/expired

**POST `/api/student/logout`**
- **Description**: Logout student (invalidate session)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success: true, message: 'Logged out' }`

#### Admin Endpoint to Set Student Password

**POST `/api/admin/set-student-password`**
- **Description**: Admin sets password for a student
- **Auth**: Requires admin session token
- **Headers**: `Authorization: Bearer <admin-token>`
- **Body**: `{ studentId: string, email: string, password: string }`
- **Response**: `{ success: true, message: 'Password set successfully' }`

### Files Modified/Created

1. **database.js**
   - Added: `setStudentPassword(studentId, email, password)`
   - Added: `authenticateStudent(email, password)`
   - Added: `createStudentSessionToken(studentId)`
   - Added: `verifyStudentSessionToken(sessionToken)`
   - Added: `getStudentById(studentId)`
   - Added: `logoutStudentSession(sessionToken)`

2. **server.js**
   - Added: Student login endpoints
   - Added: Student session management endpoints
   - Added: Admin password management endpoint

3. **login.html** (Updated)
   - Added: Dual authentication tabs (Admin/Student)
   - Added: Student login form
   - Added: Tab switching UI

4. **student-dashboard.html** (New)
   - Beautiful, responsive student dashboard
   - Displays all required information
   - Shows cohort resources and videos
   - Logout functionality

5. **auth.js** (Enhanced)
   - Works with both admin and student authentication
   - Handles session token management

6. **sql_student_setup.sql** (New)
   - SQL to create `student_passwords` and `student_sessions` tables
   - Setup instructions for Supabase

## Setup Instructions

### Step 1: Create Database Tables

1. Go to your Supabase project's SQL Editor
2. Copy the SQL from `sql_student_setup.sql`
3. Execute the queries to create the tables
4. Verify tables are created in your Supabase dashboard

### Step 2: Add Passwords for Students

Admin can set student passwords in two ways:

#### Option A: Via API (Programmatic)
```bash
curl -X POST http://localhost:3002/api/admin/set-student-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-session-token>" \
  -d '{
    "studentId": "1",
    "email": "student@example.com",
    "password": "SecurePassword123"
  }'
```

#### Option B: Via Admin Dashboard (Recommended)
Create a password management panel in the admin dashboard:
- Search for student by name/email
- Set/reset password
- Generate random passwords
- Send password via email

### Step 3: Student Login

1. Open login.html
2. Click "Student" tab
3. Enter student email and password
4. Click "Login"
5. Redirected to student-dashboard.html

## Student Dashboard Features

### Information Display
- **Name**: From students table
- **Email**: Login email
- **Figma Email**: From students table (if set)
- **Cohort**: Assigned cohort
- **Payment Status**:
  - Amount Paid
  - Total Amount
  - Remaining Balance
  - Visual progress bar

### Resources Display
- **Cohort Links**: All resources linked to student's cohort
- **Recorded Videos**: All videos linked to student's cohort

## Security Considerations

### Current Implementation (Development)
- Passwords stored as plain text
- Session tokens valid for 24 hours
- localStorage used for session storage

### Production Recommendations

1. **Password Hashing**
   ```javascript
   // Use bcryptjs
   const bcrypt = require('bcryptjs');
   const hashedPassword = await bcrypt.hash(password, 10);
   ```

2. **HTTPS Only**
   - All API calls must use HTTPS
   - Enable secure cookies

3. **Secure Cookies**
   ```javascript
   // Instead of localStorage, use httpOnly cookies
   res.cookie('session_token', token, {
     httpOnly: true,
     secure: true,
     sameSite: 'strict',
     maxAge: 24 * 60 * 60 * 1000
   });
   ```

4. **Rate Limiting**
   - Limit login attempts per IP
   - Implement CAPTCHA after failed attempts

5. **CORS Configuration**
   - Restrict to specific domains in production

## Testing

### Test Login Flow
1. Admin login: osama.eldrieny@gmail.com / Al7amdulla@8206
2. Set password for a test student via API
3. Logout from admin panel
4. Student login with email and password
5. Verify dashboard displays correct information

### Test Student Dashboard
- Verify all student information displays correctly
- Verify cohort resources load (should match admin dashboard)
- Verify recorded videos load correctly
- Test logout functionality
- Verify session validation on page reload

## Troubleshooting

### "Invalid email or password" Error
- Verify password was set for the student
- Check student email is correct
- Verify student_passwords table exists in Supabase

### Student Dashboard Not Loading
- Check browser console for errors
- Verify session token is valid
- Verify student record exists in database
- Check cohort name matches exactly

### Resources/Videos Not Displaying
- Verify cohort name matches exactly (case-sensitive)
- Verify cohort exists in Supabase
- Verify cohort has links/videos assigned
- Check browser console for API errors

## API Response Examples

### Successful Student Login
```json
{
  "success": true,
  "user": {
    "id": "1",
    "email": "student@example.com",
    "name": "John Doe",
    "cohort": "Cohort 1",
    "figmaEmail": "john@figma.com",
    "totalAmount": 500,
    "paidAmount": 250,
    "remaining": 250,
    "isStudent": true
  },
  "sessionToken": "abc123def456..."
}
```

### Failed Login
```json
{
  "message": "Invalid email or password"
}
```

### Set Student Password (Success)
```json
{
  "success": true,
  "message": "Password set successfully"
}
```

## Next Steps

1. Run `node server.js` to start the server
2. Set up student passwords via API or admin panel
3. Test student login at login.html
4. Deploy to Vercel when ready

## Support

For issues or questions:
1. Check browser console for error messages
2. Review server logs for API errors
3. Verify database tables exist in Supabase
4. Ensure all environment variables are set correctly
