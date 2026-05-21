-- Timezone-Aware Course Scheduling
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Add fix_timezone column: when TRUE, course time is pinned to a single timezone
-- and automatically converted to each user's local time
ALTER TABLE courses ADD COLUMN IF NOT EXISTS fix_timezone BOOLEAN DEFAULT FALSE;

-- Add timezone_name column: the IANA timezone identifier the course is pinned to
-- Defaults to Asia/Kolkata (IST) since most existing courses are India-based
ALTER TABLE courses ADD COLUMN IF NOT EXISTS timezone_name VARCHAR(50) DEFAULT 'Asia/Kolkata';

-- Add a comment for documentation
COMMENT ON COLUMN courses.fix_timezone IS 'When true, course start time is pinned to timezone_name and converted to user local time';
COMMENT ON COLUMN courses.timezone_name IS 'IANA timezone identifier (e.g. Asia/Kolkata, America/New_York) used when fix_timezone is true';
