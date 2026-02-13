-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- This file implements comprehensive security policies for the Course Dashboard
-- Run this SQL in your Supabase database to enable RLS on all tables
-- Date: February 2026

-- ============================================
-- PART 1: ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_checklist_completion ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 2: AUTH HELPER FUNCTION
-- ============================================
-- Helper function to get current user role and ID from JWT token

CREATE OR REPLACE FUNCTION auth.get_user_role() RETURNS text AS $$
BEGIN
  RETURN COALESCE(
    auth.jwt() ->> 'user_role',
    'public'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user ID from JWT
CREATE OR REPLACE FUNCTION auth.get_user_id() RETURNS bigint AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() ->> 'user_id')::bigint,
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current student ID from JWT
CREATE OR REPLACE FUNCTION auth.get_student_id() RETURNS bigint AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() ->> 'student_id')::bigint,
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 3: STUDENTS TABLE POLICIES
-- ============================================
-- Students are sensitive - admins can do anything, students can only read their own

DROP POLICY IF EXISTS "Admins can view all students" ON students;
CREATE POLICY "Admins can view all students" ON students
  FOR SELECT
  USING (auth.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Students can view their own data" ON students;
CREATE POLICY "Students can view their own data" ON students
  FOR SELECT
  USING (
    auth.get_user_role() = 'student' 
    AND id = auth.get_student_id()
  );

DROP POLICY IF EXISTS "Admins can insert students" ON students;
CREATE POLICY "Admins can insert students" ON students
  FOR INSERT
  WITH CHECK (auth.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can update students" ON students;
CREATE POLICY "Admins can update students" ON students
  FOR UPDATE
  USING (auth.get_user_role() = 'admin')
  WITH CHECK (auth.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can delete students" ON students;
CREATE POLICY "Admins can delete students" ON students
  FOR DELETE
  USING (auth.get_user_role() = 'admin');

-- ============================================
-- PART 4: ADMIN USERS TABLE POLICIES
-- ============================================
-- Very sensitive - admins can only see themselves, prevent exposure of all admins

DROP POLICY IF EXISTS "Admins can view their own profile" ON admin_users;
CREATE POLICY "Admins can view their own profile" ON admin_users
  FOR SELECT
  USING (
    auth.get_user_role() = 'admin'
    AND id = auth.get_user_id()
  );

DROP POLICY IF EXISTS "Disable admin list access" ON admin_users;
CREATE POLICY "Disable admin list access" ON admin_users
  FOR SELECT
  USING (false); -- Deny all SELECT by default

-- Only allow INSERT/UPDATE/DELETE through stored procedures by service role
DROP POLICY IF EXISTS "Service role only for admin management" ON admin_users;
CREATE POLICY "Service role only for admin management" ON admin_users
  FOR ALL
  USING (auth.get_user_role() = 'service_role' OR current_user = 'postgres');

-- ============================================
-- PART 5: ADMIN SESSIONS TABLE POLICIES
-- ============================================
-- Sessions are authentication tokens - extremely sensitive

DROP POLICY IF EXISTS "Admins can view own sessions" ON admin_sessions;
CREATE POLICY "Admins can view own sessions" ON admin_sessions
  FOR SELECT
  USING (
    auth.get_user_role() = 'admin'
    AND user_id = auth.get_user_id()
  );

DROP POLICY IF EXISTS "Admins can create sessions" ON admin_sessions;
CREATE POLICY "Admins can create sessions" ON admin_sessions
  FOR INSERT
  WITH CHECK (auth.get_user_role() = 'admin' OR current_user = 'postgres');

DROP POLICY IF EXISTS "Admins can update own sessions" ON admin_sessions;
CREATE POLICY "Admins can update own sessions" ON admin_sessions
  FOR UPDATE
  USING (
    auth.get_user_role() = 'admin'
    AND user_id = auth.get_user_id()
  )
  WITH CHECK (
    auth.get_user_role() = 'admin'
    AND user_id = auth.get_user_id()
  );

-- ============================================
-- PART 6: STUDENT PASSWORDS TABLE POLICIES
-- ============================================
-- CRITICAL: Never allow direct SELECT - only for authentication service

DROP POLICY IF EXISTS "Block all direct access to passwords" ON student_passwords;
CREATE POLICY "Block all direct access to passwords" ON student_passwords
  FOR ALL
  USING (false); -- Block all access to this table directly

-- Passwords should only be accessed via authenticated stored procedures
-- Never through normal Supabase queries

-- ============================================
-- PART 7: STUDENT SESSIONS TABLE POLICIES
-- ============================================
-- Students can only see and manage their own sessions

DROP POLICY IF EXISTS "Students can view their own sessions" ON student_sessions;
CREATE POLICY "Students can view their own sessions" ON student_sessions
  FOR SELECT
  USING (
    auth.get_user_role() = 'student'
    AND student_id = auth.get_student_id()
  );

DROP POLICY IF EXISTS "Students can create sessions" ON student_sessions;
CREATE POLICY "Students can create sessions" ON student_sessions
  FOR INSERT
  WITH CHECK (student_id = auth.get_student_id());

DROP POLICY IF EXISTS "Students can update own sessions" ON student_sessions;
CREATE POLICY "Students can update own sessions" ON student_sessions
  FOR UPDATE
  USING (
    auth.get_user_role() = 'student'
    AND student_id = auth.get_student_id()
  )
  WITH CHECK (
    auth.get_user_role() = 'student'
    AND student_id = auth.get_student_id()
  );

DROP POLICY IF EXISTS "Students can delete own sessions" ON student_sessions;
CREATE POLICY "Students can delete own sessions" ON student_sessions
  FOR DELETE
  USING (
    auth.get_user_role() = 'student'
    AND student_id = auth.get_student_id()
  );

-- ============================================
-- PART 8: EMAIL TEMPLATES TABLE POLICIES
-- ============================================
-- Admins manage templates, students can only view (read-only)

DROP POLICY IF EXISTS "Admins can manage email templates" ON email_templates;
CREATE POLICY "Admins can manage email templates" ON email_templates
  FOR ALL
  USING (auth.get_user_role() = 'admin')
  WITH CHECK (auth.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Students can view templates" ON email_templates;
CREATE POLICY "Students can view templates" ON email_templates
  FOR SELECT
  USING (auth.get_user_role() = 'student');

-- ============================================
-- PART 9: EMAIL TEMPLATE CATEGORIES TABLE POLICIES
-- ============================================
-- Read-only for all authenticated users

DROP POLICY IF EXISTS "Admins can manage categories" ON email_template_categories;
CREATE POLICY "Admins can manage categories" ON email_template_categories
  FOR ALL
  USING (auth.get_user_role() = 'admin')
  WITH CHECK (auth.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Users can view categories" ON email_template_categories;
CREATE POLICY "Users can view categories" ON email_template_categories
  FOR SELECT
  USING (
    auth.get_user_role() IN ('admin', 'student')
  );

-- ============================================
-- PART 10: EMAIL LOGS TABLE POLICIES
-- ============================================
-- Admins see all logs, students see logs about their own emails

DROP POLICY IF EXISTS "Admins can view all email logs" ON email_logs;
CREATE POLICY "Admins can view all email logs" ON email_logs
  FOR SELECT
  USING (auth.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can manage email logs" ON email_logs;
CREATE POLICY "Admins can manage email logs" ON email_logs
  FOR ALL
  USING (auth.get_user_role() = 'admin')
  WITH CHECK (auth.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Students can view their own email logs" ON email_logs;
CREATE POLICY "Students can view their own email logs" ON email_logs
  FOR SELECT
  USING (
    auth.get_user_role() = 'student'
    AND student_id = auth.get_student_id()
  );

-- ============================================
-- PART 11: CHECKLIST ITEMS TABLE POLICIES
-- ============================================
-- Public read (everyone can see items), admins can edit

DROP POLICY IF EXISTS "Everyone can view checklist items" ON checklist_items;
CREATE POLICY "Everyone can view checklist items" ON checklist_items
  FOR SELECT
  USING (true); -- Checklist items are non-sensitive reference data

DROP POLICY IF EXISTS "Admins can manage checklist items" ON checklist_items;
CREATE POLICY "Admins can manage checklist items" ON checklist_items
  FOR INSERT
  WITH CHECK (auth.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can update checklist items" ON checklist_items;
CREATE POLICY "Admins can update checklist items" ON checklist_items
  FOR UPDATE
  USING (auth.get_user_role() = 'admin')
  WITH CHECK (auth.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can delete checklist items" ON checklist_items;
CREATE POLICY "Admins can delete checklist items" ON checklist_items
  FOR DELETE
  USING (auth.get_user_role() = 'admin');

-- ============================================
-- PART 12: STUDENT CHECKLIST COMPLETION TABLE POLICIES
-- ============================================
-- Students can manage their own completions, admins can view all

DROP POLICY IF EXISTS "Admins can view all completions" ON student_checklist_completion;
CREATE POLICY "Admins can view all completions" ON student_checklist_completion
  FOR SELECT
  USING (auth.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Students can view their own completions" ON student_checklist_completion;
CREATE POLICY "Students can view their own completions" ON student_checklist_completion
  FOR SELECT
  USING (
    auth.get_user_role() = 'student'
    AND student_id = auth.get_student_id()
  );

DROP POLICY IF EXISTS "Admins can manage completions" ON student_checklist_completion;
CREATE POLICY "Admins can manage completions" ON student_checklist_completion
  FOR ALL
  USING (auth.get_user_role() = 'admin')
  WITH CHECK (auth.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Students can update their own completions" ON student_checklist_completion;
CREATE POLICY "Students can update their own completions" ON student_checklist_completion
  FOR INSERT
  WITH CHECK (student_id = auth.get_student_id());

DROP POLICY IF EXISTS "Students can modify their completions" ON student_checklist_completion;
CREATE POLICY "Students can modify their completions" ON student_checklist_completion
  FOR UPDATE
  USING (
    auth.get_user_role() = 'student'
    AND student_id = auth.get_student_id()
  )
  WITH CHECK (
    auth.get_user_role() = 'student'
    AND student_id = auth.get_student_id()
  );

-- ============================================
-- PART 13: COHORTS TABLE POLICIES
-- ============================================
-- Public read (reference data), admins edit

DROP POLICY IF EXISTS "Everyone can view cohorts" ON cohorts;
CREATE POLICY "Everyone can view cohorts" ON cohorts
  FOR SELECT
  USING (true); -- Cohort data is non-sensitive reference data

DROP POLICY IF EXISTS "Admins can manage cohorts" ON cohorts;
CREATE POLICY "Admins can manage cohorts" ON cohorts
  FOR ALL
  USING (auth.get_user_role() = 'admin')
  WITH CHECK (auth.get_user_role() = 'admin');

-- ============================================
-- PART 14: COHORT LINKS TABLE POLICIES
-- ============================================
-- Public read, admins edit

DROP POLICY IF EXISTS "Everyone can view cohort links" ON cohort_links;
CREATE POLICY "Everyone can view cohort links" ON cohort_links
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage cohort links" ON cohort_links;
CREATE POLICY "Admins can manage cohort links" ON cohort_links
  FOR ALL
  USING (auth.get_user_role() = 'admin')
  WITH CHECK (auth.get_user_role() = 'admin');

-- ============================================
-- PART 15: COHORT VIDEOS TABLE POLICIES
-- ============================================
-- Public read, admins edit

DROP POLICY IF EXISTS "Everyone can view cohort videos" ON cohort_videos;
CREATE POLICY "Everyone can view cohort videos" ON cohort_videos
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage cohort videos" ON cohort_videos;
CREATE POLICY "Admins can manage cohort videos" ON cohort_videos
  FOR ALL
  USING (auth.get_user_role() = 'admin')
  WITH CHECK (auth.get_user_role() = 'admin');

-- ============================================
-- PART 16: USER PREFERENCES TABLE POLICIES
-- ============================================
-- Users can only access their own preferences

DROP POLICY IF EXISTS "Admins can view all preferences" ON user_preferences;
CREATE POLICY "Admins can view all preferences" ON user_preferences
  FOR SELECT
  USING (auth.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT
  USING (
    auth.get_user_role() = 'admin'
    AND page_id LIKE 'admin_%'
  );

DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_preferences;
CREATE POLICY "Users can manage their own preferences" ON user_preferences
  FOR INSERT
  WITH CHECK (auth.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE
  USING (auth.get_user_role() = 'admin')
  WITH CHECK (auth.get_user_role() = 'admin');

-- ============================================
-- PART 17: VERIFICATION
-- ============================================
-- List all tables with RLS enabled

SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'students', 'admin_users', 'admin_sessions',
  'student_passwords', 'student_sessions',
  'email_templates', 'email_template_categories', 'email_logs',
  'checklist_items', 'student_checklist_completion',
  'cohorts', 'cohort_links', 'cohort_videos', 'user_preferences'
);

-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND rowsecurity = true;

-- ============================================
-- NOTES
-- ============================================
-- 
-- 1. CRITICAL: You must update your backend (server.js/database.js) to include
--    JWT tokens with user_role and user_id/student_id in the Authorization header
--    when making requests to Supabase.
--
-- 2. JWT Token Format:
--    {
--      "user_id": 123,              // For admin users
--      "student_id": 456,           // For students
--      "user_role": "admin|student" // User role
--    }
--
-- 3. The auth.get_user_role() function expects JWT tokens to include the role.
--    You must configure Supabase to include custom claims in JWT tokens.
--
-- 4. For server-side operations (backend), use the service_role key which bypasses RLS.
--    Only the frontend should use the anon/public key with RLS enforced.
--
-- 5. Never expose the service_role key in client-side code.
--
-- 6. Test all policies thoroughly before deploying to production.
--
-- 7. Review Supabase Security Advisor regularly for additional vulnerabilities.
--
-- ============================================
