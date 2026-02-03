-- ============================================
-- COHORT LINKS & VIDEOS TABLES SETUP
-- ============================================
-- Run these SQL queries in your Supabase dashboard
-- SQL Editor > New Query > Paste all content below > Execute

-- CREATE COHORT_LINKS TABLE
CREATE TABLE IF NOT EXISTS cohort_links (
    id BIGSERIAL PRIMARY KEY,
    cohort_name TEXT NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- CREATE INDEX for faster queries
CREATE INDEX IF NOT EXISTS idx_cohort_links_cohort_name ON cohort_links(cohort_name);

-- CREATE COHORT_VIDEOS TABLE
CREATE TABLE IF NOT EXISTS cohort_videos (
    id BIGSERIAL PRIMARY KEY,
    cohort_name TEXT NOT NULL,
    name TEXT NOT NULL,
    thumbnail TEXT,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- CREATE INDEX for faster queries
CREATE INDEX IF NOT EXISTS idx_cohort_videos_cohort_name ON cohort_videos(cohort_name);

-- VERIFY TABLES WERE CREATED
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('cohort_links', 'cohort_videos');
