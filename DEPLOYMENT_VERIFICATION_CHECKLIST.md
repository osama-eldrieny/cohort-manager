# ✅ DEPLOYMENT CHECKLIST - STEP 6

## PRE-DEPLOYMENT (Before You Start)

- [ ] Read: [STEP6_COPY_PASTE_READY.md](STEP6_COPY_PASTE_READY.md)
- [ ] Have Supabase project open
- [ ] Have admin/owner permissions
- [ ] Browser ready to access Supabase
- [ ] Project selected in Supabase

## DEPLOYMENT EXECUTION

### Phase 1: Prepare SQL

- [ ] Open `STEP6_RLS_POLICIES.sql`
- [ ] Select all content (Cmd+A)
- [ ] Copy to clipboard (Cmd+C)
- [ ] Verify ~300 lines copied

### Phase 2: Deploy to Supabase

- [ ] Open https://app.supabase.com
- [ ] Verify correct project selected
- [ ] Click "SQL Editor" (left sidebar)
- [ ] Click "+ New Query"
- [ ] Paste SQL (Cmd+V)
- [ ] Verify code appears (~300 lines)
- [ ] Click blue "Run" button
- [ ] Wait 30-60 seconds
- [ ] Look for "Success" message

### Phase 3: Verify Policies Created

Run verification query:
```sql
SELECT table_name, rowsecurity 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND rowsecurity = true
ORDER BY table_name;
```

- [ ] Query returns 14 rows
- [ ] All tables show `rowsecurity = true`
- [ ] No errors in output

## POST-DEPLOYMENT TESTING

### Test 1: Admin Access
- [ ] Clear browser cache (Cmd+Shift+Delete)
- [ ] Log out completely
- [ ] Log in as admin
- [ ] Dashboard loads successfully
- [ ] See all 194 students
- [ ] Can edit/delete students
- [ ] No 403 errors

### Test 2: Student Access
- [ ] Log out from admin
- [ ] Log in as student
- [ ] Dashboard loads with 1 record
- [ ] Cannot see other students
- [ ] Can see checklist items
- [ ] Can see cohorts
- [ ] No 403 errors

### Test 3: Security Features
- [ ] Open DevTools → Network tab
- [ ] Check any API call
- [ ] Verify `Authorization: Bearer` header present
- [ ] JWT token visible in header

### Test 4: Password Protection
- [ ] Open browser console
- [ ] Execute: `fetch('http://localhost:3002/api/admin-passwords')`
- [ ] Should return 403 Forbidden ✅

### Test 5: Reference Data
- [ ] Admin can see cohorts
- [ ] Student can see cohorts
- [ ] Admin can see email templates
- [ ] Student can see email templates
- [ ] No access denied errors

## VERIFICATION QUERIES (Run in Supabase SQL Editor)

**Query 1: Check Policies Exist**
```sql
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public';
```
Expected: 18+ policies

**Query 2: Check Helper Functions**
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'auth'
AND routine_name IN ('get_user_role', 'get_user_id', 'get_student_id');
```
Expected: 3 functions

**Query 3: Check RLS on All Tables**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND rowsecurity = false;
```
Expected: 0 rows (all tables have RLS)

## TROUBLESHOOTING CHECKLIST

### If Policies Not Working
- [ ] Hard refresh browser (Cmd+Shift+R)
- [ ] Clear localStorage: DevTools → Application → Clear All
- [ ] Log out and log back in
- [ ] Check JWT token contains user_role
- [ ] Verify policies exist (Query 1 above)

### If 403 Errors Appear
- [ ] Expected for password tables ✅
- [ ] Unexpected for other tables → Check policy logic
- [ ] Run verification queries
- [ ] Check Supabase logs

### If Admin Can't See Data
- [ ] Check JWT token exists
- [ ] Verify `user_role: 'admin'` in JWT
- [ ] Check admin_users policy created
- [ ] Check RLS enabled on table

### If Student Can See All Data
- [ ] Hard refresh browser
- [ ] Log out and log back in
- [ ] Verify `student_id` in JWT
- [ ] Check student policies created
- [ ] Run permission check query

## ROLLBACK PROCEDURE (If Needed)

If something goes wrong:

```sql
-- Drop all new policies
DROP POLICY IF EXISTS admin_users_policy_admin ON admin_users;
-- ... repeat for all policies

-- Drop helper functions
DROP FUNCTION IF EXISTS auth.get_user_role();
DROP FUNCTION IF EXISTS auth.get_user_id();
DROP FUNCTION IF EXISTS auth.get_student_id();

-- Disable RLS on tables if needed
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
-- ... repeat for other tables
```

Or redeploy STEP6_RLS_POLICIES.sql (DROP IF EXISTS handles cleanup)

## FINAL VERIFICATION

After all tests pass:

- [ ] Admin access works ✅
- [ ] Student access limited ✅
- [ ] Passwords blocked ✅
- [ ] Reference data readable ✅
- [ ] No 500 errors in server logs ✅
- [ ] Load time still < 3 seconds ✅
- [ ] All 14 tables have RLS ✅
- [ ] 18+ policies created ✅
- [ ] 3 helper functions created ✅

## PRODUCTION READINESS

- [ ] All tests passed
- [ ] No errors in logs
- [ ] Performance acceptable
- [ ] Security working correctly
- [ ] Documented and ready
- [ ] Team notified
- [ ] Monitoring configured

## POST-DEPLOYMENT

**Within 24 Hours**:
- [ ] Monitor Supabase logs for errors
- [ ] Check JWT token generation
- [ ] Verify RLS enforcement
- [ ] Get team feedback

**Within 1 Week**:
- [ ] Review access patterns
- [ ] Check policy effectiveness
- [ ] Monitor performance
- [ ] Plan any adjustments

## SUCCESS INDICATORS

✅ **System is working correctly if**:
- Admin sees all 194 students
- Student sees only 1 record
- Password tables return 403
- Reference data accessible
- Dashboard loads < 3 seconds
- No application errors
- Logs show clean RLS evaluation
- JWT tokens in all headers

---

## 📊 DEPLOYMENT SUMMARY

| Component | Status | Verified |
|-----------|--------|----------|
| SQL File Ready | ✅ | Yes |
| Helper Functions | ⏳ | After Deploy |
| RLS Policies | ⏳ | After Deploy |
| Admin Access | ⏳ | After Test |
| Student Access | ⏳ | After Test |
| Security | ⏳ | After Test |

---

## 🎉 COMPLETION

When all checkboxes are marked:
✅ **Deployment Complete!**
✅ **System Secure!**
✅ **Ready for Production!**

---

**Estimated Total Time**: ~30 minutes
**Risk Level**: LOW (RLS policies safe to deploy)
**Rollback Time**: < 5 minutes (if needed)

Ready to proceed? Follow STEP6_COPY_PASTE_READY.md for execution steps.
