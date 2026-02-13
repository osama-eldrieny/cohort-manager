-- ============================================
-- STEP 6: ROW LEVEL SECURITY POLICIES
-- Role-Based Access Control for All Tables
-- ============================================

-- Strategy:
-- 1. Admins (user_role = 'admin') can see all data
-- 2. Students (user_role = 'student') see only their own data
-- 3. Sensitive tables (passwords) blocked for API access

-- ============================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================

-- Get current user role from JWT
CREATE OR REPLACE FUNCTION get_user_role() 
RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('request.jwt.claims'->>'user_role', true);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get current admin user ID from JWT
CREATE OR REPLACE FUNCTION get_user_id() 
RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('request.jwt.claims'->>'user_id', true);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get current student ID from JWT
CREATE OR REPLACE FUNCTION get_student_id() 
RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('request.jwt.claims'->>'student_id', true);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- ADMIN_USERS TABLE
-- Only admins can view other admins
-- ============================================

DROP POLICY IF EXISTS admin_users_policy_admin ON admin_users;
DROP POLICY IF EXISTS admin_users_policy_student ON admin_users;

CREATE POLICY admin_users_policy_admin ON admin_users
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (get_user_role() = 'admin');

CREATE POLICY admin_users_policy_student ON admin_users
    AS RESTRICTIVE
    FOR ALL
    TO authenticated
    USING (get_user_role() = 'admin');

-- ============================================
-- STUDENTS TABLE
-- Admins see all students
-- Students see only their own record
-- ============================================

DROP POLICY IF EXISTS students_policy_admin ON students;
DROP POLICY IF EXISTS students_policy_student ON students;

CREATE POLICY students_policy_admin ON students
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (get_user_role() = 'admin');

CREATE POLICY students_policy_student ON students
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (
        get_user_role() = 'student' 
        AND id::text = get_student_id()
    );

-- ============================================
-- STUDENT_CHECKLIST_COMPLETION TABLE
-- Admins see all completions
-- Students see only their own
-- ============================================

DROP POLICY IF EXISTS checklist_completion_admin ON student_checklist_completion;
DROP POLICY IF EXISTS checklist_completion_student ON student_checklist_completion;

CREATE POLICY checklist_completion_admin ON student_checklist_completion
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (get_user_role() = 'admin');

CREATE POLICY checklist_completion_student ON student_checklist_completion
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (
        get_user_role() = 'student'
        AND student_id::text = get_student_id()
    );

-- ============================================
-- COHORTS TABLE
-- Everyone can read
-- Only admins can modify
-- ============================================

DROP POLICY IF EXISTS cohorts_policy_select ON cohorts;
DROP POLICY IF EXISTS cohorts_policy_insert ON cohorts;
DROP POLICY IF EXISTS cohorts_policy_update ON cohorts;
DROP POLICY IF EXISTS cohorts_policy_delete ON cohorts;

CREATE POLICY cohorts_policy_select ON cohorts
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY cohorts_policy_insert ON cohorts
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (get_user_role() = 'admin');

CREATE POLICY cohorts_policy_update ON cohorts
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    WITH CHECK (get_user_role() = 'admin');

CREATE POLICY cohorts_policy_delete ON cohorts
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING (get_user_role() = 'admin');

-- ============================================
-- CHECKLIST_ITEMS TABLE
-- Everyone can read
-- Only admins can modify
-- ============================================

DROP POLICY IF EXISTS checklist_items_select ON checklist_items;
DROP POLICY IF EXISTS checklist_items_insert ON checklist_items;
DROP POLICY IF EXISTS checklist_items_update ON checklist_items;
DROP POLICY IF EXISTS checklist_items_delete ON checklist_items;

CREATE POLICY checklist_items_select ON checklist_items
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY checklist_items_insert ON checklist_items
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (get_user_role() = 'admin');

CREATE POLICY checklist_items_update ON checklist_items
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    WITH CHECK (get_user_role() = 'admin');

CREATE POLICY checklist_items_delete ON checklist_items
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING (get_user_role() = 'admin');

-- ============================================
-- EMAIL_TEMPLATES TABLE
-- Everyone can read
-- Only admins can modify
-- ============================================

DROP POLICY IF EXISTS email_templates_select ON email_templates;
DROP POLICY IF EXISTS email_templates_insert ON email_templates;
DROP POLICY IF EXISTS email_templates_update ON email_templates;
DROP POLICY IF EXISTS email_templates_delete ON email_templates;

CREATE POLICY email_templates_select ON email_templates
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY email_templates_insert ON email_templates
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (get_user_role() = 'admin');

CREATE POLICY email_templates_update ON email_templates
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    WITH CHECK (get_user_role() = 'admin');

CREATE POLICY email_templates_delete ON email_templates
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING (get_user_role() = 'admin');

-- ============================================
-- EMAIL_TEMPLATE_CATEGORIES TABLE
-- Everyone can read
-- Only admins can modify
-- ============================================

DROP POLICY IF EXISTS email_categories_select ON email_template_categories;
DROP POLICY IF EXISTS email_categories_insert ON email_template_categories;
DROP POLICY IF EXISTS email_categories_update ON email_template_categories;
DROP POLICY IF EXISTS email_categories_delete ON email_template_categories;

CREATE POLICY email_categories_select ON email_template_categories
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY email_categories_insert ON email_template_categories
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (get_user_role() = 'admin');

CREATE POLICY email_categories_update ON email_template_categories
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    WITH CHECK (get_user_role() = 'admin');

CREATE POLICY email_categories_delete ON email_template_categories
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING (get_user_role() = 'admin');

-- ============================================
-- VERIFY POLICIES ARE ENABLED
-- ============================================

-- Check policies created
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- ============================================
-- TEST POLICIES (Run these to verify)
-- ============================================

-- Test 1: Admin can see all students
-- SELECT * FROM students;  -- Should return all rows

-- Test 2: Student can only see their own record
-- SELECT * FROM students WHERE id = current_student_id;  -- Should return 1 row

-- Test 3: No one can access passwords table
-- SELECT * FROM admin_passwords;  -- Should return 0 rows (forbidden)
-- SELECT * FROM student_passwords;  -- Should return 0 rows (forbidden)

-- Test 4: Everyone can read reference data
-- SELECT * FROM cohorts;  -- Should return all cohorts
-- SELECT * FROM checklist_items;  -- Should return all items
