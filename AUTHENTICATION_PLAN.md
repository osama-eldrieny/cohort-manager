# Cohort Manager - Role-Based Authentication Implementation Plan

**Version**: 1.0  
**Date**: January 24, 2026  
**Status**: Planning Phase (No Code Changes Made Yet)

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Frontend Changes](#frontend-changes)
5. [Backend Changes](#backend-changes)
6. [API Endpoints & Access Control](#api-endpoints--access-control)
7. [Configuration](#configuration)
8. [Implementation Checklist](#implementation-checklist)
9. [Manual Deployment Steps](#manual-deployment-steps)
10. [Testing Plan](#testing-plan)

---

## Overview

### Goal
Implement two-tier authentication with role-based access control (RBAC):
- **Admin**: Full access to all features and data
- **Coordinator**: Limited access to student/cohort management, NO financial/analytics access

### Key Features
- ✅ Login/Logout system
- ✅ Session-based authentication
- ✅ Role-based page visibility
- ✅ Role-based API protection
- ✅ Role-based field editing restrictions

---

## Architecture

### Stack
- **Frontend**: HTML/CSS/JavaScript (localStorage + session storage)
- **Backend**: Node.js/Express (middleware-based authorization)
- **Database**: SQLite (existing, unchanged)
- **Sessions**: In-memory (can upgrade to Redis)
- **Security**: HMAC token-based sessions

### Flow
```
User Login Form
    ↓
POST /api/login (username, password)
    ↓
Verify credentials against env vars
    ↓
Create session token
    ↓
Return token to frontend
    ↓
Store token in sessionStorage
    ↓
All subsequent requests include token
    ↓
Middleware verifies token + role
    ↓
Check if role has permission
    ↓
Allow/Deny access
```

---

## User Roles & Permissions

### Admin User
**Username**: `admin`  
**Password**: Set via `ADMIN_PASSWORD` env var

#### Permissions
| Feature | Access |
|---------|--------|
| **Overview Page** | ✅ Full access |
| **Dashboard Stats** | ✅ View all (revenue, etc.) |
| **Students Page** | ✅ Full CRUD |
| **Cohort 0-3 Pages** | ✅ Full CRUD |
| **Status Pages** | ✅ View all |
| **Analytics Section** | ✅ View all |
| **Revenue Cards** | ✅ View all |
| **Edit Students** | ✅ All fields |
| **Delete Students** | ✅ Yes |
| **Export Data** | ✅ Yes |
| **Import Data** | ✅ Yes |
| **Settings** | ✅ Full access |

---

### Coordinator User
**Username**: `coordinator`  
**Password**: Set via `COORDINATOR_PASSWORD` env var

#### Permissions
| Feature | Access |
|---------|--------|
| **Overview Page** | ❌ Hidden |
| **Dashboard Stats** | ❌ Not visible |
| **Students Page** | ✅ View only |
| **Cohort 0-1 Pages** | ❌ Hidden |
| **Cohort 2 Page** | ✅ Full access |
| **Cohort 3 Page** | ✅ Full access |
| **Status Pages** | ❌ Hidden |
| **Analytics Section** | ❌ Hidden |
| **Revenue Cards** | ❌ Hidden (can't see financial data) |
| **Edit Students** | ✅ Limited fields only: Name, Email, Location, Language, LinkedIn, WhatsApp, Notes |
| **Edit Students** | ❌ Cannot edit: Status, Cohort, Financial fields, Checklist |
| **Delete Students** | ❌ No |
| **Export Data** | ✅ Yes |
| **Import Data** | ❌ No |
| **Settings** | ❌ Hidden |

---

## Frontend Changes

### 1. Login Page
**File**: `index.html`

Add new section before main dashboard:
```html
<div id="loginPage" class="login-container">
  <div class="login-box">
    <h1>Cohort Manager</h1>
    <form id="loginForm" onsubmit="handleLogin(event)">
      <input type="text" id="username" placeholder="Username" required>
      <input type="password" id="password" placeholder="Password" required>
      <button type="submit">Login</button>
      <div id="loginError" class="error"></div>
    </form>
  </div>
</div>
```

### 2. Logout Button
Add to header:
```html
<button id="logoutBtn" onclick="handleLogout()" style="position: absolute; top: 20px; right: 20px;">
  Logout (<span id="userDisplay"></span>)
</button>
```

### 3. Role-Based Navigation
Show/hide sidebar items based on role:
- Admin: Show all nav items
- Coordinator: Show only Students, Cohort 2, Cohort 3

### 4. Role-Based Content
Hide pages based on role in `renderPage()`:
- Admin: All pages available
- Coordinator: Show only allowed pages, redirect others to Students

---

## Backend Changes

### 1. Authentication Middleware (`auth.js`)

**Responsibilities**:
- Verify session token
- Extract user role
- Attach user info to request

```javascript
// Usage in routes
router.get('/api/students', authMiddleware, coordinatorOrAdmin, getStudents);
```

### 2. Authorization Middleware (`auth.js`)

**Functions**:
- `adminOnly`: Only admin can access
- `coordinatorOrAdmin`: Both roles can access
- `coordinatorOnlySpecific`: Coordinator with field restrictions

### 3. Session Management

**In-memory store**:
```javascript
// Store active sessions
sessions: {
  'token-string': {
    username: 'admin',
    role: 'admin',
    createdAt: timestamp,
    expiresAt: timestamp
  }
}
```

### 4. Login Endpoint

**Route**: `POST /api/login`

**Request**:
```json
{
  "username": "admin",
  "password": "admin-password"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "token": "session-token",
  "role": "admin",
  "username": "admin"
}
```

**Response (Failure)**:
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### 5. Logout Endpoint

**Route**: `POST /api/logout`

**Request**:
```json
{
  "token": "session-token"
}
```

### 6. Protected Student Edit

**Current**: `POST /api/students` (saves all fields)

**New Logic**:
- Admin: Can edit all fields
- Coordinator: Can only edit specific fields
  - Allowed: name, email, location, language, linkedin, whatsapp, note
  - Blocked: status, cohort, totalAmount, paidAmount, remaining, paymentMethod, checklist items

---

## API Endpoints & Access Control

### Authentication Endpoints

| Method | Endpoint | Auth Required | Admin Only | Coordinator OK |
|--------|----------|---------------|-----------|-----------------|
| POST | `/api/login` | No | N/A | N/A |
| POST | `/api/logout` | Yes | ✅ | ✅ |

### Student Management Endpoints

| Method | Endpoint | Admin | Coordinator | Notes |
|--------|----------|-------|-------------|-------|
| GET | `/api/students` | ✅ | ✅ | All students visible to both |
| POST | `/api/students` | ✅ Create/Edit all | ✅ Edit allowed fields only | Field-level restrictions |
| DELETE | `/api/students/:id` | ✅ | ❌ | Admin only |
| GET | `/api/students/:id` | ✅ | ✅ | View only |

### Data Endpoints

| Method | Endpoint | Admin | Coordinator | Notes |
|--------|----------|-------|-------------|-------|
| GET | `/api/export` | ✅ | ✅ | Both can export |
| POST | `/api/import` | ✅ | ❌ | Admin only |

---

## Configuration

### Environment Variables (Set in Vercel)

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password

COORDINATOR_USERNAME=coordinator
COORDINATOR_PASSWORD=coordinator-password

SESSION_SECRET=random-secret-key-for-signing-tokens
SESSION_EXPIRY=86400000  (24 hours in milliseconds)
```

### Files to Create/Modify

**New Files**:
- `auth.js` - Authentication middleware and utilities
- `login.html` - Could be part of index.html or separate

**Modified Files**:
- `server.js` - Add auth middleware and login routes
- `app.js` - Frontend auth logic, role-based rendering
- `index.html` - Add login form, logout button, role-based nav
- `style.css` - Add login page styles

---

## Implementation Checklist

### Backend Implementation
- [ ] Create `auth.js` with middleware functions
- [ ] Create session store (in-memory initially)
- [ ] Add `/api/login` endpoint
- [ ] Add `/api/logout` endpoint
- [ ] Add `authMiddleware` to verify tokens
- [ ] Add role-based authorization middleware
- [ ] Add field-level restrictions to student edit
- [ ] Update all protected endpoints with auth middleware
- [ ] Add environment variable validation
- [ ] Add session expiry/cleanup mechanism

### Frontend Implementation
- [ ] Add login form HTML to index.html
- [ ] Add login page styles to style.css
- [ ] Create login handler function in app.js
- [ ] Store session token in sessionStorage
- [ ] Add token to all API requests
- [ ] Implement logout functionality
- [ ] Add role-based navigation visibility
- [ ] Add role-based page rendering
- [ ] Add user display in header
- [ ] Handle session expiry (redirect to login)
- [ ] Add role-based field visibility in edit modal
- [ ] Disable/hide delete button for coordinators

### Testing
- [ ] Test admin login
- [ ] Test coordinator login
- [ ] Test invalid credentials
- [ ] Test session expiry
- [ ] Test admin page access
- [ ] Test coordinator page access
- [ ] Test coordinator field restrictions
- [ ] Test logout functionality
- [ ] Test token refresh/persistence
- [ ] Test API authorization (try coordinator accessing admin endpoint)

---

## Manual Deployment Steps

### Step 1: Update GitHub
```bash
# All code changes will be committed to main branch
git checkout main
git pull origin main
```

### Step 2: Deploy to Vercel
1. Go to https://vercel.com/dashboard
2. Select `cohort-manager` project
3. Click "Redeploy" or push to trigger auto-deploy
4. Wait for deployment to complete

### Step 3: Set Environment Variables in Vercel
1. Go to Project Settings → Environment Variables
2. Add the following:
   ```
   ADMIN_USERNAME = admin
   ADMIN_PASSWORD = [your-secure-password]
   COORDINATOR_USERNAME = coordinator
   COORDINATOR_PASSWORD = [coordinator-password]
   SESSION_SECRET = [random-secret-key]
   SESSION_EXPIRY = 86400000
   ```
3. Redeploy the project
4. Wait for deployment with new env vars

### Step 4: Test Login
1. Visit https://cohort-manager.vercel.app (or your Vercel URL)
2. You should see login page
3. Try logging in as admin
4. Try logging in as coordinator
5. Verify they see different content

---

## Testing Plan

### Unit Tests
- [ ] Auth middleware validates token correctly
- [ ] Invalid tokens rejected
- [ ] Role checking works for both roles
- [ ] Field restriction logic works

### Integration Tests
- [ ] Admin can access all endpoints
- [ ] Coordinator can access allowed endpoints
- [ ] Coordinator cannot access restricted endpoints
- [ ] Edit restrictions prevent field modification

### User Tests
- [ ] Admin login → full dashboard
- [ ] Coordinator login → limited dashboard
- [ ] Coordinator cannot see Overview
- [ ] Coordinator cannot see Status pages
- [ ] Coordinator cannot see Analytics
- [ ] Coordinator cannot see Revenue
- [ ] Coordinator cannot delete students
- [ ] Coordinator cannot import data
- [ ] Logout works for both roles
- [ ] Session persists on page refresh
- [ ] Session expires after timeout

---

## Security Considerations

### Implemented
- ✅ Password protected login
- ✅ Server-side session validation
- ✅ Role-based API protection
- ✅ HMAC token signing (prevent tampering)
- ✅ Session expiry (24 hours)

### Not Implemented (Future)
- 🔲 HTTPS only (handled by Vercel)
- 🔲 Password hashing (use bcrypt in future)
- 🔲 Rate limiting on login
- 🔲 Two-factor authentication
- 🔲 Audit logging
- 🔲 Redis session store (for production)

---

## Questions Before Implementation

Before I write the code, please clarify:

1. **Coordinator Cohort Access**: Should coordinator see Cohort 0 and 1?
   - Current plan: Only Cohort 2 & 3
   - Alternative: All cohorts

2. **Coordinator Edit Permissions**: Can coordinator edit any student field (except financial/status)?
   - Current plan: Yes, all non-sensitive fields
   - Alternative: Read-only for coordinator

3. **Password Requirements**: Any specific password format or complexity?
   - Current plan: Plain text (no requirements)
   - Alternative: Must be 8+ chars, special characters, etc.

4. **Session Timeout**: How long before automatic logout?
   - Current plan: 24 hours
   - Alternative: 1 hour, 8 hours, never

5. **Data Export**: Should coordinator export show all students or only assigned ones?
   - Current plan: All students
   - Alternative: Filter by cohort

---

## Next Steps

1. ✅ You review this plan
2. ✅ Clarify any questions above
3. ✅ I implement all code changes
4. ✅ Code gets pushed to GitHub main branch
5. ✅ You deploy to Vercel
6. ✅ You set environment variables
7. ✅ Login system is live!

---

**Status**: Ready for implementation once you confirm the clarification questions above.
