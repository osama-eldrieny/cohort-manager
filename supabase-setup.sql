-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  cohort VARCHAR(100),
  status VARCHAR(100),
  location VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_cohort ON students(cohort);
CREATE INDEX IF NOT EXISTS idx_students_location ON students(location);
CREATE INDEX IF NOT EXISTS idx_templates_name ON email_templates(name);
