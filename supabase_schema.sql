-- Create checklist_items table
CREATE TABLE IF NOT EXISTS checklist_items (
    id SERIAL PRIMARY KEY,
    category VARCHAR(255) NOT NULL,
    label VARCHAR(255) NOT NULL,
    sort_position INTEGER DEFAULT 999,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create student_checklist_completion table
CREATE TABLE IF NOT EXISTS student_checklist_completion (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    checklist_item_id INTEGER NOT NULL REFERENCES checklist_items(id),
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, checklist_item_id)
);

-- Create cohorts table (with color and icon fields)
CREATE TABLE IF NOT EXISTS cohorts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(255),
    color VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create email_template_categories table
CREATE TABLE IF NOT EXISTS email_template_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create email_templates table (with category field and button_label)
CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    body TEXT,
    category VARCHAR(255),
    button_label VARCHAR(255),
    category_id INTEGER REFERENCES email_template_categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_checklist_completion_student_id ON student_checklist_completion(student_id);
CREATE INDEX IF NOT EXISTS idx_student_checklist_completion_item_id ON student_checklist_completion(checklist_item_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_category ON checklist_items(category);

-- Enable Row Level Security (RLS) if needed
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_checklist_completion ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_template_categories ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust as needed for security)
CREATE POLICY "Allow all operations on checklist_items" ON checklist_items
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on student_checklist_completion" ON student_checklist_completion
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on cohorts" ON cohorts
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on email_templates" ON email_templates
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on email_template_categories" ON email_template_categories
    FOR ALL USING (true) WITH CHECK (true);
