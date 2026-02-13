# 🚀 STEP 6 DEPLOYMENT - COPY & PASTE READY

## ⚡ Quick Deploy (Follow These Steps Exactly)

### Step 1: Open Supabase SQL Editor
```
1. Go to: https://app.supabase.com
2. Select your project
3. Click "SQL Editor" (left sidebar)
4. Click "+ New Query"
```

### Step 2: Copy the SQL File
**File Location**: `STEP6_RLS_POLICIES.sql` (300 lines)

**Copy all contents**:
- Open the file in your editor
- Select All (Cmd+A)
- Copy (Cmd+C)

### Step 3: Paste into Supabase
1. Click into the SQL editor text box
2. Paste (Cmd+V)
3. You should see ~300 lines of SQL code

### Step 4: Execute
1. Click the blue "Run" button (or press Cmd+Enter)
2. Wait 30-60 seconds for execution
3. Look for "Success" message at bottom

### Step 5: Verify
Run this verification query in a NEW query:

```sql
SELECT table_name, rowsecurity 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND rowsecurity = true
ORDER BY table_name;
```

**Expected Result**: All 14 tables showing `rowsecurity = true`

---

## 📋 What the SQL Contains

### 3 Helper Functions
```sql
auth.get_user_role()    → Extract role from JWT
auth.get_user_id()      → Extract admin user ID from JWT  
auth.get_student_id()   → Extract student ID from JWT
```

### 18+ RLS Policies for Tables
- **admin_users**: Admins only
- **students**: Admins all, students own record
- **student_checklist_completion**: Admins all, students own
- **cohorts**: Everyone reads, admins write
- **checklist_items**: Everyone reads, admins write
- **email_templates**: Everyone reads, admins write
- **email_template_categories**: Everyone reads, admins write
- **email_logs**: Admins all, students own
- **column_preferences**: Admins all, users own
- **session_tokens**: Admins only
- **admin_passwords**: BLOCKED for everyone
- **student_passwords**: BLOCKED for everyone

---

## 🧪 Test After Deployment

### Test 1: Check Policies Exist
```sql
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected: ~15+ policies listed

### Test 2: Admin Login Test
```javascript
// In browser console after logging in as admin:
localStorage.getItem('admin_jwt_token')
// Should return a long JWT string starting with "eyJ..."
```

### Test 3: Check API Calls Include JWT
```
DevTools → Network tab → Any API call
Headers tab → Look for: Authorization: Bearer eyJ...
Should show JWT token is included
```

### Test 4: Verify Data Filtering
```
Admin login → Dashboard → Should show all 194 students
Student login → Dashboard → Should show only 1 record
```

### Test 5: Verify Password Table Blocked
```javascript
// In browser console:
fetch('http://localhost:3002/api/admin-passwords')
.then(r => r.json())
.catch(e => console.log(e))

// Should return 403 Forbidden
```

---

## ✅ Success Checklist

After running SQL, verify:

- [ ] No errors in Supabase query output
- [ ] All helper functions created
- [ ] All policies created  
- [ ] Verification query returns 14 tables
- [ ] Admin login shows all data
- [ ] Student login shows own data only
- [ ] Password tables return 403
- [ ] Server logs show no RLS errors
- [ ] Dashboard loads fast (<3 seconds)

---

## ⏱️ Timeline

| Step | Time | Action |
|------|------|--------|
| Copy SQL | 1 min | Open file, copy contents |
| Paste & Run | 2 min | Paste in Supabase, execute |
| Verify | 2 min | Check policies created |
| Test Admin | 3 min | Login as admin, check data |
| Test Student | 3 min | Login as student, check data |
| **Total** | **~15 min** | **Complete deployment** |

---

## 🔍 Troubleshooting

### Error: "Syntax error in SQL"
**Solution**: 
- Make sure entire file was copied (no truncation)
- Paste from the beginning again
- Check for any missing parts

### Error: "Function already exists"
**Solution**: This is normal! DROP IF EXISTS handles it.
- Continue, it's not an error
- Functions will be recreated

### Policies not working
**Checklist**:
1. ✅ JWT token is sent (check Network tab)
2. ✅ JWT contains `user_role` claim
3. ✅ All policies show in verification query
4. ✅ Refresh browser after deploying policies

### Student sees all data still
**Solution**:
1. Hard refresh (Cmd+Shift+R)
2. Clear localStorage
3. Log out and log back in
4. Check JWT contains `student_id` claim

---

## 📊 What to Expect After Deployment

### Admin Experience
```
Login → Dashboard → Loads all 194 students
           ↓
        Can edit/delete
        Can create new
        Can see all data
```

### Student Experience
```
Login → Dashboard → Loads only own record
          ↓
       Can see checklist items
       Can see email history
       Cannot see other students
```

### API Behavior
```
Authorized request → Returns filtered data ✅
Unauthorized request → Returns 403 Forbidden ❌
Password table request → Returns 403 Forbidden ❌
```

---

## 📝 Reference: SQL File Size

```
File: STEP6_RLS_POLICIES.sql
Size: ~15 KB
Lines: 300
Functions: 3
Policies: 18+
Comments: Extensive
Execution Time: 30-60 seconds
```

---

## 🎉 After Successful Deployment

✅ **All security features active**
✅ **Database-level access control enforced**
✅ **JWT tokens providing user context**
✅ **Automatic data filtering working**
✅ **Ready for production use**

---

## 📞 Need Help?

**See documentation files**:
- [STEP6_DEPLOYMENT_READY.md](STEP6_DEPLOYMENT_READY.md) - Main deployment guide
- [SECURITY_ARCHITECTURE_EXPLAINED.md](SECURITY_ARCHITECTURE_EXPLAINED.md) - How it works
- [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) - Full testing checklist

---

**Ready to Deploy!** 🚀

Follow the 5 steps above to complete Step 6 in ~15 minutes.
