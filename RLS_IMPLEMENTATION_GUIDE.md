# 🔒 Row Level Security (RLS) Implementation Guide

**Status**: ⚠️ CRITICAL - Needs Implementation Before Production  
**Date**: February 2026  
**Purpose**: Secure your Supabase database from unauthorized access

---

## 📋 Overview

Your Course Dashboard currently has **16 security errors** from Supabase's Security Advisor:
- **RLS Policy Always True** - Policies that grant universal access
- **RLS Disabled in Public** - Tables with no access restrictions
- **Sensitive Columns Exposed** - Admin sessions, passwords exposed to API

This guide implements **comprehensive RLS policies** to:
✅ Restrict data access by user role (admin vs student)  
✅ Prevent unauthorized data modification  
✅ Protect sensitive information (passwords, sessions, payment data)  
✅ Enable production deployment

---

## 🎯 Key Security Changes

### Before (Current - UNSAFE)
```
Anyone with API key can:
  ❌ View all students (emails, payment info, PII)
  ❌ Access admin sessions (hijack admin accounts)
  ❌ Read password hashes
  ❌ Delete any record
  ❌ Modify student data
```

### After (With RLS - SECURE)
```
With RLS Policies:
  ✅ Admins: Full access to their data only
  ✅ Students: Can only see/edit their own records
  ✅ Sensitive tables: Completely locked down
  ✅ Public data: Read-only access for reference info
  ✅ Password table: Completely blocked from API
```

---

## 📊 Policy Structure by Table

### TIER 1: Highly Sensitive (LOCKED DOWN)
| Table | Admin Access | Student Access | Others |
|-------|-------------|----------------|--------|
| `admin_users` | Own profile only | BLOCKED | BLOCKED |
| `admin_sessions` | Own sessions | BLOCKED | BLOCKED |
| `student_passwords` | BLOCKED* | BLOCKED | BLOCKED |
| `student_sessions` | Own sessions | Own sessions | BLOCKED |

*Service role only (backend)

### TIER 2: Sensitive (Restricted by ownership)
| Table | Admin Access | Student Access |
|-------|-------------|----------------|
| `students` | View/Edit all | View own only |
| `email_logs` | View all | View own only |
| `student_checklist_completion` | View/Edit all | Own only |

### TIER 3: Public Reference (Read-only)
| Table | Access |
|-------|--------|
| `checklist_items` | Everyone (read-only) |
| `cohorts` | Everyone (read-only) |
| `cohort_links` | Everyone (read-only) |
| `cohort_videos` | Everyone (read-only) |
| `email_templates` | Admins: Full, Students: Read-only |

---

## 🚀 Implementation Steps

### Step 1: Copy SQL Policies
1. Open [rls_security_policies.sql](rls_security_policies.sql)
2. Copy **all SQL code**

### Step 2: Apply to Supabase
1. Go to [Supabase Dashboard](https://app.supabase.com) → Your Project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Paste the entire SQL file
5. Click **Run** (⚠️ This will modify your database)

### Step 3: Verify Implementation
After running the SQL:
- Go to **Authentication** → **Policies**
- Verify all tables show RLS enabled (🔒)
- Review Security Advisor - errors should be resolved

### Step 4: Update Backend Code
Your backend needs to send JWT tokens with user information:

**database.js - Add this function:**
```javascript
// Create JWT token with user role and ID
export function createJWTToken(userId, userRole) {
    const payload = {
        user_id: userId,
        user_role: userRole,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    // Sign with your secret (use Supabase JWT secret)
    return jwt.sign(payload, process.env.SUPABASE_JWT_SECRET);
}

// For students
export function createStudentJWTToken(studentId) {
    const payload = {
        student_id: studentId,
        user_role: 'student',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    };
    return jwt.sign(payload, process.env.SUPABASE_JWT_SECRET);
}
```

**server.js - Modify Supabase client creation:**
```javascript
// When creating Supabase client for authenticated requests:
const { createClient } = require('@supabase/supabase-js');

// For admin operations
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY  // Use service role for backend
);

// For client-side (frontend)
const supabaseClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
        headers: {
            Authorization: `Bearer ${jwtToken}` // JWT with user_role
        }
    }
);
```

---

## ⚡ How RLS Works

### Request Flow with RLS

```
1. Client makes request with JWT token
   ↓
2. Supabase extracts JWT claims (user_role, user_id, student_id)
   ↓
3. RLS policy checks: Does user have permission?
   - auth.get_user_role() → 'admin' or 'student'
   - auth.get_user_id() → 123 (for admins)
   - auth.get_student_id() → 456 (for students)
   ↓
4. Policy condition evaluated:
   ✅ ALLOWED: User meets all conditions → Return data
   ❌ BLOCKED: User fails condition → 0 rows returned
   ↓
5. Response sent to client
```

### Example: Reading Students Table

```sql
-- Policy: "Admins can view all students"
SELECT * FROM students;

-- Condition: auth.get_user_role() = 'admin'
-- ✅ Admin with role='admin' → Returns all rows
-- ❌ Student with role='student' → Returns 0 rows
```

---

## 🔑 Security Best Practices

### DO ✅
- ✅ Use **service_role key** for backend operations (doesn't check RLS)
- ✅ Use **anon key** for frontend with JWT token (RLS enforced)
- ✅ Include JWT token in all frontend requests
- ✅ Never expose service_role key in frontend code
- ✅ Rotate API keys after implementing RLS
- ✅ Review Supabase Security Advisor monthly

### DON'T ❌
- ❌ Use service_role key in frontend
- ❌ Share API keys in repositories
- ❌ Commit .env files with secrets
- ❌ Disable RLS "just to test" in production
- ❌ Use RLS policies with `true` condition (allows everything)
- ❌ Store passwords in plaintext (use bcrypt/argon2)

---

## 🧪 Testing RLS Policies

### Test 1: Admin Access
```javascript
// Login as admin
const token = createJWTToken(123, 'admin');

// Should return ALL students
const { data, error } = await supabase
    .from('students')
    .select('*')
    .headers({ 'Authorization': `Bearer ${token}` });
// ✅ Returns all students
```

### Test 2: Student Access (Own Data)
```javascript
// Login as student 456
const token = createStudentJWTToken(456);

// Should return ONLY their own record
const { data, error } = await supabase
    .from('students')
    .select('*')
    .headers({ 'Authorization': `Bearer ${token}` });
// ✅ Returns only student 456's record
```

### Test 3: Student Access (Other Data)
```javascript
// Login as student 456, try to read students table
const token = createStudentJWTToken(456);

// Should return NOTHING (empty array)
const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', 789) // Different student
    .headers({ 'Authorization': `Bearer ${token}` });
// ✅ Returns empty array (access denied)
```

### Test 4: Password Table (BLOCKED)
```javascript
// Even admin can't directly access passwords
const token = createJWTToken(123, 'admin');

const { data, error } = await supabase
    .from('student_passwords')
    .select('*')
    .headers({ 'Authorization': `Bearer ${token}` });
// ✅ Returns error: "new row violates row-level security policy"
```

---

## 🛠️ Troubleshooting

### Problem: "new row violates row-level security policy"
**Cause**: RLS policy returned false
**Solution**: 
- Check JWT token includes `user_role` and `user_id`
- Verify auth.get_user_role() function is accessible
- Review policy conditions in Supabase dashboard

### Problem: "403 Forbidden" on queries
**Cause**: Missing Authorization header
**Solution**:
- Ensure JWT token is in `Authorization: Bearer <token>` header
- Token must be valid and not expired
- Verify SUPABASE_JWT_SECRET matches token signing secret

### Problem: Backend can't access data
**Cause**: Using anon key instead of service_role
**Solution**:
- Backend should use `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
- Only frontend uses anon key with RLS enforced

---

## 📈 Performance Considerations

RLS has minimal performance impact:
- RLS policies are compiled into PostgreSQL queries
- No additional round-trips or HTTP calls
- Indexing still works normally
- Add indexes on columns used in policies

**Recommendation**: Add these indexes for performance:
```sql
CREATE INDEX idx_students_id ON students(id);
CREATE INDEX idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX idx_student_sessions_student_id ON student_sessions(student_id);
CREATE INDEX idx_student_checklist_completion_student_id ON student_checklist_completion(student_id);
```

---

## 📚 Resources

- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/security)
- [JWT Claims Configuration](https://supabase.com/docs/guides/auth/jwt)

---

## ✅ Implementation Checklist

- [ ] Download `rls_security_policies.sql`
- [ ] Run SQL in Supabase SQL Editor
- [ ] Verify RLS enabled on all tables
- [ ] Review Security Advisor (errors resolved)
- [ ] Update backend to create JWT tokens
- [ ] Test admin access
- [ ] Test student access
- [ ] Test cross-student access (should be blocked)
- [ ] Test password table access (should be blocked)
- [ ] Deploy to staging environment
- [ ] Run security audit
- [ ] Deploy to production
- [ ] Monitor logs for RLS violations
- [ ] Rotate API keys after implementation

---

## 🚨 Critical: Before Going to Production

1. **Enable RLS** on all tables ✓
2. **Update backend** to send JWT tokens ✓
3. **Test thoroughly** in staging ✓
4. **Review Supabase Security Advisor** ✓
5. **Rotate API keys** after implementation ✓
6. **Monitor for RLS violations** in logs ✓

**Without these steps, your application is vulnerable to data breaches.**

---

**Questions?** Review the RLS policies in `rls_security_policies.sql` or check the Supabase Security Advisor for ongoing recommendations.
