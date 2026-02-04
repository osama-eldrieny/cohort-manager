# Authentication Setup Guide

## Overview
The Course Dashboard now includes a complete admin authentication system using Supabase.

## Quick Start

### 1. Create the Users Table in Supabase

Go to your Supabase dashboard and run this SQL query in the SQL Editor:

```sql
-- Create users table for admin authentication
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    is_admin BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Insert admin user
-- Email: osama.eldrieny@gmail.com
-- Password: Al7amdulla@8206
INSERT INTO admin_users (email, password_hash, name, is_admin, is_active)
VALUES ('osama.eldrieny@gmail.com', 'Al7amdulla@8206', 'Admin User', true, true)
ON CONFLICT DO NOTHING;

-- Create sessions table for tracking logged-in users
CREATE TABLE IF NOT EXISTS admin_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
```

### 2. Admin Credentials

**Email:** `osama.eldrieny@gmail.com`  
**Password:** `Al7amdulla@8206`

### 3. Login Flow

1. Open `login.html` or go to the main app (it redirects to login if not authenticated)
2. Enter admin email and password
3. Click "Login"
4. You'll be redirected to the dashboard

### 4. Logout

Click the "Logout" button in the top-right corner of the header to end your session.

## Features

✅ **Email & Password Authentication**
- Simple email/password login
- Session token-based authentication
- 24-hour session expiration

✅ **All Pages Protected**
- Every page requires authentication
- Unauthenticated users are redirected to login.html
- Session validation on each page load

✅ **Admin Account**
- Single admin user configured
- Manage future users by adding entries to admin_users table

✅ **No Registration**
- No public registration form
- Add users manually via database

✅ **No Password Reset**
- Update passwords directly in the admin_users table
- In production, implement proper password reset workflow

## API Endpoints

### POST `/api/auth/login`
Login with email and password

**Request:**
```json
{
    "email": "osama.eldrieny@gmail.com",
    "password": "Al7amdulla@8206"
}
```

**Response:**
```json
{
    "success": true,
    "user": {
        "id": 1,
        "email": "osama.eldrieny@gmail.com",
        "name": "Admin User",
        "isAdmin": true
    },
    "sessionToken": "abc123..."
}
```

### POST `/api/auth/verify`
Verify a session token

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Response:**
```json
{
    "success": true,
    "user": { ... }
}
```

### POST `/api/auth/logout`
Logout and invalidate session

**Headers:**
```
Authorization: Bearer <sessionToken>
```

## File Structure

- **login.html** - Login page
- **auth.js** - Client-side authentication logic
- **database.js** - Server-side authentication functions
- **server.js** - Auth API endpoints
- **sql_setup_users.sql** - Database setup script

## Client-Side Functions (auth.js)

```javascript
isLoggedIn()                    // Check if user is authenticated
getCurrentUser()                // Get current user object
storeSession(user, token)       // Store session in localStorage
clearSession()                  // Clear session from localStorage
loginUser(email, password)      // Login user
logoutUser()                    // Logout user
verifySession()                 // Verify session is still valid
addLogoutButton()               // Add logout button to header
```

## Server-Side Functions (database.js)

```javascript
loginAdmin(email, password)        // Verify credentials and return user
createSessionToken(userId)         // Create new session token
verifySessionToken(token)          // Verify token validity
logoutSession(token)               // Invalidate token
getAdminUserById(userId)           // Get user details
```

## Security Notes

⚠️ **For Production:**
1. Use bcrypt to hash passwords (current: plaintext for demo)
2. Use HTTPS only
3. Implement CSRF protection
4. Add rate limiting to login endpoint
5. Use secure session cookies instead of localStorage
6. Implement proper password reset flow
7. Add two-factor authentication

## Adding More Admin Users

To add more admin users, insert them into the admin_users table:

```sql
INSERT INTO admin_users (email, password_hash, name, is_admin, is_active)
VALUES ('newadmin@example.com', 'SomePassword123', 'New Admin', true, true);
```

## Troubleshooting

**"Cannot login - Invalid credentials"**
- Check email spelling
- Verify password is correct
- Ensure user exists in admin_users table
- Check is_active is set to true

**"Session expired"**
- Sessions last 24 hours
- Login again to create a new session
- Check browser localStorage for session_token

**"Cannot access dashboard pages"**
- Clear browser cache
- Check localStorage for admin_session_token
- Verify server is running on port 3002
- Check browser console for errors
