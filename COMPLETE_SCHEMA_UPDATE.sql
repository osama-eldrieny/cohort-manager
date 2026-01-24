-- Add missing columns to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS linkedin VARCHAR(500);
ALTER TABLE students ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS figma_email VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS language VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS remaining NUMERIC(10,2) DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS checklist JSONB;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_language ON students(language);
CREATE INDEX IF NOT EXISTS idx_students_payment_method ON students(payment_method);
