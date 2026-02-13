# STEP 6: Implement Row Level Security Policies

## Overview
This step implements role-based access control (RBAC) at the database level using PostgreSQL Row Level Security (RLS) policies.

## How It Works

### 1. Authentication Context
The JWT token sent from frontend contains:
```json
{
  "user_id": 1,           // For admins
  "student_id": 123,      // For students  
  "user_role": "admin"    // or "student"
}
```

### 2. Helper Functions
Three helper functions extract JWT claims in database:

```sql
-- Get user role from JWT
auth.get_user_role() → 'admin' or 'student'

-- Get admin user ID from JWT
auth.get_user_id() → user_id value

-- Get student ID from JWT
auth.get_student_id() → student_id value
```

### 3. RLS Policies by Table

#### Admin Access (user_role = 'admin')
| Table | Admin Access |
|-------|--------------|
| admin_users | ✅ See all |
| students | ✅ See all |
| student_checklist_completion | ✅ See all |
| cohorts | ✅ See all |
| checklist_items | ✅ See all |
| email_templates | ✅ See all |
| email_logs | ✅ See all |
| column_preferences | ✅ See all |
| admin_passwords | ❌ BLOCKED |
| student_passwords | ❌ BLOCKED |

#### Student Access (user_role = 'student')
| Table | Student Access |
|-------|-----------------|
| admin_users | ❌ BLOCKED |
| students | ✅ Own record only |
| student_checklist_completion | ✅ Own completions |
| cohorts | ✅ Read-only |
| checklist_items | ✅ Read-only |
| email_templates | ✅ Read-only |
| email_logs | ✅ Own logs only |
| column_preferences | ✅ Own preferences |
| admin_passwords | ❌ BLOCKED |
| student_passwords | ❌ BLOCKED |

## Implementation Steps

### Step 6.1: Copy SQL File to Supabase
1. Open Supabase Dashboard → SQL Editor
2. Create new query
3. Copy entire contents of `STEP6_RLS_POLICIES.sql`
4. Execute the SQL

### Step 6.2: Verify Policies Are Applied
Run this query to confirm:
```sql
SELECT table_name, rowsecurity 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND rowsecurity = true
ORDER BY table_name;
```

Expected output: All 14 tables show `rowsecurity = true`

### Step 6.3: Test Each Policy

#### Test as Admin
```bash
# Get admin JWT token (from login response)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Should return all students
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3002/api/students

# Should return error for passwords
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3002/api/admin-passwords
```

#### Test as Student
```bash
# Get student JWT token (from login response)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Should return only own record
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3002/api/students

# Should return error
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3002/api/admin-users
```

## Policy Structure

### ADMIN-ONLY TABLES
Example: `admin_users`
```sql
CREATE POLICY admin_users_policy_admin ON admin_users
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (auth.get_user_role() = 'admin');
```

### OWNER-BASED ACCESS
Example: `students` (students see own, admins see all)
```sql
-- Admin sees all
CREATE POLICY students_policy_admin ON students
    USING (auth.get_user_role() = 'admin');

-- Student sees only self
CREATE POLICY students_policy_student ON students
    USING (
        auth.get_user_role() = 'student' 
        AND id::text = auth.get_student_id()
    );
```

### PUBLIC READ-ONLY
Example: `cohorts` (everyone reads, admins edit)
```sql
-- Everyone reads
CREATE POLICY cohorts_read ON cohorts
    FOR SELECT
    USING (true);

-- Admins edit
CREATE POLICY cohorts_write ON cohorts
    FOR INSERT, UPDATE, DELETE
    USING (auth.get_user_role() = 'admin');
```

### COMPLETELY BLOCKED
Example: `admin_passwords`
```sql
CREATE POLICY admin_passwords_block ON admin_passwords
    AS RESTRICTIVE
    FOR ALL
    USING (false);  -- Always false = completely blocked
```

## Security Benefits

✅ **Database-Level Enforcement**
- Security at DB level, not just application
- Cannot bypass with direct SQL queries
- Enforced for all API calls

✅ **Automatic Filtering**
- Data is automatically filtered by user role
- No need to write WHERE clauses in application
- Eliminates risk of forgotten security checks

✅ **Role-Based Access**
- Admin role has full access
- Student role limited to own data
- Sensitive tables always blocked

✅ **Scalable**
- Works automatically for all users
- No manual permission management
- Easy to add new users

## Troubleshooting

### Policy Not Working?
1. Verify JWT token contains correct `user_role`
2. Check function names match JWT field names
3. Verify `Authorization: Bearer {token}` header sent
4. Check Supabase logs for RLS errors

### Seeing Error 403?
This is correct! It means RLS is blocking the request.
- ✅ If blocking admin passwords → working correctly
- ❌ If blocking legitimate admin request → policy needs adjustment

### Can't Execute SQL?
- Verify you're using PostgreSQL (not SQLite)
- Check syntax with Supabase SQL validator
- Try executing one policy at a time

## Files Created

1. **STEP6_RLS_POLICIES.sql**
   - Complete RLS policy implementation
   - Helper functions for JWT claims
   - All 10 table policies
   - Test queries

## Next Steps

After implementing policies:
1. ✅ Test admin login - should see all data
2. ✅ Test student login - should see only own data
3. ✅ Try accessing password tables - should get 403
4. 🚀 Deploy to production with confidence

## Status

**Implementation Ready** ✅
- JWT generation: ✅ Working
- JWT transmission: ✅ Working
- RLS policies: ⏳ Ready to implement
- Database filtering: ⏳ Pending policy execution

---

**Next Action**: Run `STEP6_RLS_POLICIES.sql` in Supabase SQL Editor
