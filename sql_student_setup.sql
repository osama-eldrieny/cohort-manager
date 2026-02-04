-- ============================================
-- STUDENT PASSWORD & AUTHENTICATION TABLES
-- ============================================

-- Create student_passwords table
CREATE TABLE IF NOT EXISTS public.student_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id INTEGER NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE
);

-- Create index for email lookup
CREATE INDEX IF NOT EXISTS idx_student_passwords_email ON public.student_passwords(email);
CREATE INDEX IF NOT EXISTS idx_student_passwords_student_id ON public.student_passwords(student_id);

-- Create student_sessions table
CREATE TABLE IF NOT EXISTS public.student_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id INTEGER NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE
);

-- Create index for session token lookup
CREATE INDEX IF NOT EXISTS idx_student_sessions_token ON public.student_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_student_sessions_student_id ON public.student_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_student_sessions_active ON public.student_sessions(is_active);

-- ============================================
-- NOTES FOR PRODUCTION
-- ============================================

-- IMPORTANT: In production, use bcrypt or argon2 to hash passwords
-- Current implementation stores passwords in plain text for development only
-- Update the password_hash column to store hashed passwords:
--   UPDATE student_passwords SET password_hash = crypt(password_hash, gen_salt('bf'))
--
-- Enable pgcrypto extension:
--   CREATE EXTENSION IF NOT EXISTS pgcrypto;
--
-- Then modify the password storage logic to use:
--   bcrypt or argon2 library in Node.js (bcryptjs recommended)
