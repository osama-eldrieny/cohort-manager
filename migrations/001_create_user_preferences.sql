-- Create user_preferences table for column visibility settings
-- Run this SQL directly in Supabase SQL Editor if table doesn't exist

CREATE TABLE IF NOT EXISTS user_preferences (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    page_id TEXT NOT NULL UNIQUE,
    visible_columns JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_page_id ON user_preferences(page_id);

-- Add comment for documentation
COMMENT ON TABLE user_preferences IS 'Stores user column visibility preferences for each page';
COMMENT ON COLUMN user_preferences.page_id IS 'Unique identifier for the page (e.g., students, cohort0, status-waiting)';
COMMENT ON COLUMN user_preferences.visible_columns IS 'JSON array of visible column IDs';
