# 🔐 Backend Integration Guide for RLS

This guide shows how to integrate RLS with your Node.js backend.

---

## 🎯 Overview

Your backend needs to:
1. **Generate JWT tokens** with user information
2. **Send JWT tokens** in requests to Supabase
3. **Use different API keys** for different contexts:
   - **Service Role Key**: Backend operations (bypasses RLS)
   - **Anon Key**: Frontend operations (RLS enforced)

---

## 📋 Implementation

### Step 1: Install JWT Library

```bash
npm install jsonwebtoken
```

### Step 2: Add to database.js

```javascript
import jwt from 'jsonwebtoken';

// ============================================
// JWT TOKEN GENERATION FOR RLS
// ============================================

/**
 * Generate JWT token for admin users
 * Token includes user_id and admin role
 */
export function generateAdminJWT(userId) {
    const payload = {
        user_id: userId,
        user_role: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    try {
        const token = jwt.sign(payload, process.env.SUPABASE_JWT_SECRET);
        console.log(`✅ Generated admin JWT for user ${userId}`);
        return token;
    } catch (error) {
        console.error('❌ Error generating admin JWT:', error.message);
        throw error;
    }
}

/**
 * Generate JWT token for students
 * Token includes student_id and student role
 */
export function generateStudentJWT(studentId) {
    const payload = {
        student_id: studentId,
        user_role: 'student',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    try {
        const token = jwt.sign(payload, process.env.SUPABASE_JWT_SECRET);
        console.log(`✅ Generated student JWT for student ${studentId}`);
        return token;
    } catch (error) {
        console.error('❌ Error generating student JWT:', error.message);
        throw error;
    }
}

/**
 * Create authenticated Supabase client with user JWT
 * Use this for requests that need RLS enforcement
 */
export function createAuthenticatedClient(jwtToken) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    // Create a new client with the JWT token
    const authenticatedSupabase = supabase;
    
    // Set the auth token
    authenticatedSupabase.auth.session = () => ({
        access_token: jwtToken,
        user: { id: extractUserIdFromJWT(jwtToken) }
    });

    return authenticatedSupabase;
}

/**
 * Extract user ID or student ID from JWT token
 */
function extractUserIdFromJWT(token) {
    try {
        const decoded = jwt.decode(token);
        return decoded.user_id || decoded.student_id || null;
    } catch (error) {
        console.error('❌ Error decoding JWT:', error.message);
        return null;
    }
}

// ============================================
// ADMIN AUTHENTICATED QUERIES
// ============================================

/**
 * Get all students (admin only)
 * Uses service role (no RLS)
 */
export async function getAllStudentsAdmin() {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized. Cannot fetch students.');
        }

        const { data, error } = await supabase
            .from('students')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return (data || []).map(convertStudentFromDatabase);
    } catch (error) {
        console.error('❌ Error fetching students:', error.message);
        throw error;
    }
}

/**
 * Get single admin user
 * Only returns own profile
 */
export async function getAdminUser(userId, token) {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        // Use the JWT token to enforce RLS
        const { data, error } = await supabase
            .from('admin_users')
            .select('id, email, name, is_admin, is_active')
            .eq('id', userId)
            .single();

        if (error || !data) {
            throw new Error('Unauthorized: Cannot access this admin profile');
        }

        return data;
    } catch (error) {
        console.error('❌ Error fetching admin user:', error.message);
        throw error;
    }
}

// ============================================
// STUDENT AUTHENTICATED QUERIES
// ============================================

/**
 * Get student's own data
 * RLS ensures they can only see themselves
 */
export async function getStudentOwnData(studentId, token) {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        // Token ensures RLS filters to only this student
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('id', studentId)
            .single();

        if (error || !data) {
            throw new Error('Student not found or access denied');
        }

        return convertStudentFromDatabase(data);
    } catch (error) {
        console.error('❌ Error fetching student data:', error.message);
        throw error;
    }
}

/**
 * Get student's own checklist completions
 * RLS ensures they can only see their own
 */
export async function getStudentChecklistCompletion(studentId, token) {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        const { data, error } = await supabase
            .from('student_checklist_completion')
            .select('*')
            .eq('student_id', studentId);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error fetching student checklist completion:', error.message);
        throw error;
    }
}

/**
 * Get student's own email logs
 * RLS ensures they can only see their own emails
 */
export async function getStudentEmailLogs(studentId, token) {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        const { data, error } = await supabase
            .from('email_logs')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error fetching email logs:', error.message);
        throw error;
    }
}

/**
 * Save student's own checklist completion
 * RLS ensures they can only update their own
 */
export async function saveStudentChecklistCompletionWithAuth(studentId, completedItemIds, token) {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        // Delete old entries for this student
        const { error: deleteError } = await supabase
            .from('student_checklist_completion')
            .delete()
            .eq('student_id', studentId);

        if (deleteError) {
            console.error('❌ Error deleting old checklist entries:', deleteError.message);
            throw deleteError;
        }

        // Insert new entries
        const newCompletions = completedItemIds.map(itemId => ({
            student_id: studentId,
            checklist_item_id: itemId,
            completed_at: new Date().toISOString()
        }));

        if (newCompletions.length === 0) {
            return [];
        }

        const { data, error: insertError } = await supabase
            .from('student_checklist_completion')
            .insert(newCompletions)
            .select();

        if (insertError) {
            console.error('❌ Error inserting new checklist entries:', insertError.message);
            throw insertError;
        }

        console.log(`✅ Saved checklist completion for student ${studentId}`);
        return data || [];
    } catch (error) {
        console.error('❌ Error saving student checklist completion:', error.message);
        throw error;
    }
}
```

### Step 3: Update server.js

Add JWT generation to your authentication endpoints:

```javascript
import { generateAdminJWT, generateStudentJWT } from './database.js';

// ============================================
// ADMIN LOGIN - GENERATE JWT
// ============================================

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        // Login user
        const user = await loginAdmin(email, password);

        // Create session token (for your session table)
        const sessionToken = await createSessionToken(user.id);

        // 🔐 NEW: Generate JWT token with user info for RLS
        const jwtToken = generateAdminJWT(user.id);

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                isAdmin: user.is_admin
            },
            sessionToken,
            jwtToken  // 🔐 Send JWT to frontend
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// ============================================
// STUDENT LOGIN - GENERATE JWT
// ============================================

app.post('/api/student/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        // Authenticate student
        const student = await authenticateStudent(email, password);

        // Create student session token
        const sessionToken = await createStudentSessionToken(student.id);

        // 🔐 NEW: Generate JWT token with student info for RLS
        const jwtToken = generateStudentJWT(student.id);

        res.json({
            success: true,
            user: {
                id: student.id,
                email: student.email,
                name: student.name,
                cohort: student.cohort,
                figmaEmail: student.figmaEmail,
                totalAmount: student.totalAmount,
                paidAmount: student.paidAmount,
                remaining: student.remaining,
                isStudent: true
            },
            sessionToken,
            jwtToken  // 🔐 Send JWT to frontend
        });
    } catch (error) {
        console.error('❌ Student login error:', error);
        res.status(401).json({ message: 'Invalid email or password' });
    }
});

// ============================================
// VERIFY JWT TOKEN
// ============================================

app.post('/api/auth/verify-jwt', (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No JWT token' });
        }

        const jwtToken = authHeader.substring(7);

        // Verify the JWT
        const decoded = jwt.verify(jwtToken, process.env.SUPABASE_JWT_SECRET);

        res.json({
            success: true,
            valid: true,
            user: {
                userId: decoded.user_id,
                studentId: decoded.student_id,
                role: decoded.user_role,
                expiresAt: new Date(decoded.exp * 1000)
            }
        });
    } catch (error) {
        console.error('❌ JWT verification error:', error.message);
        res.status(401).json({ 
            success: false,
            valid: false,
            message: 'Invalid or expired JWT token' 
        });
    }
});
```

### Step 4: Update Frontend (app.js)

Send JWT tokens in API requests:

```javascript
// Store JWT token after login
let jwtToken = localStorage.getItem('jwtToken');

// Before any API call that needs RLS, include the JWT
async function fetchWithJWT(url, options = {}) {
    const token = localStorage.getItem('jwtToken');
    
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,  // 🔐 Include JWT
            ...options.headers
        }
    });
}

// Example usage
async function loadStudentData() {
    try {
        const response = await fetchWithJWT(`${API_BASE_URL}/api/student/me`);
        
        if (!response.ok) {
            if (response.status === 401) {
                // JWT expired or invalid
                localStorage.removeItem('jwtToken');
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`Failed to load student data: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Loaded student data (RLS enforced):', data);
        return data;
    } catch (error) {
        console.error('❌ Error loading student data:', error);
    }
}
```

---

## ✅ Testing Checklist

After implementing:

```
□ Admin can login and get JWT token
□ Student can login and get JWT token
□ JWT tokens include user_role and user_id/student_id
□ Admin can access all students
□ Student cannot access other students' data
□ Student can only see/edit own records
□ JWT tokens expire after 24 hours
□ Expired tokens are rejected
□ Password table is completely blocked
□ Admin sessions blocked from API access
```

---

## 🔑 Environment Variables Needed

```bash
# .env file

# Existing
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# NEW for RLS
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret-key
```

**Get these from:**
- Supabase Dashboard → Settings → API
- Service Role Key: Under "API keys"
- JWT Secret: Under "JWT Settings"

---

## 🚨 Important Notes

1. **Never expose JWT_SECRET in frontend code**
   - Only generate JWT on backend
   - Only store JWT token in browser (short-lived)

2. **Service Role Key bypasses RLS**
   - Use only on backend for admin operations
   - Never put in frontend code

3. **JWT tokens should be short-lived**
   - Default: 24 hours
   - Could be shorter (1 hour) for more security

4. **Store JWT in secure storage**
   - localStorage: Simple, not HttpOnly
   - Cookies (HttpOnly): More secure against XSS

---

## 📊 Request Flow with JWT

```
1. User logs in with email/password
   ↓
2. Backend validates credentials
   ↓
3. Backend generates JWT token with user info
   ↓
4. Backend returns JWT to frontend
   ↓
5. Frontend stores JWT in localStorage
   ↓
6. Frontend includes JWT in Authorization header:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   ↓
7. Backend/Supabase receives request with JWT
   ↓
8. RLS policies use JWT claims to filter data
   ↓
9. Only authorized data is returned
```

---

## 🎯 Security Flow Diagram

```
Hacker with API Key
    ↓
Tries to access student data
    ↓
No JWT token in request
    ↓
RLS policy: auth.get_user_role() = null
    ↓
Policy returns false
    ↓
Query blocked ✅
Response: 0 rows

---

Student with JWT Token
    ↓
Includes token in request header
    ↓
Supabase extracts JWT claims
    ↓
RLS policy: auth.get_user_role() = 'student' ✓
    AND student_id = auth.get_student_id() ✓
    ↓
Policy returns true
    ↓
Query allowed ✅
Response: Their own data only
```

---

## 🆘 Troubleshooting

### JWT not working
**Check:**
- SUPABASE_JWT_SECRET is set correctly
- JWT_SECRET matches Supabase project secret
- Token is sent in Authorization header

### Students seeing other data
**Check:**
- JWT token is being sent with requests
- student_id in JWT matches query
- RLS policies are applied to tables

### Admin can't access data
**Check:**
- Using service_role key for admin queries (bypasses RLS)
- Or JWT includes user_role='admin'
- No WHERE clauses that restrict beyond user_id

---

**Ready to implement? Start with Step 1 above!**
