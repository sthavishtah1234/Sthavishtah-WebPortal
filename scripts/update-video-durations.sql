-- Update video_duration column for courses
-- This ensures the database has accurate duration data

-- Note: This script cannot automatically fetch YouTube durations
-- Admin needs to manually update video_duration for each course
-- OR use an API route to fetch and update durations

-- Example manual update:
-- UPDATE courses SET video_duration = 3000 WHERE id = 'course-id-here';

-- Add comment for clarity
COMMENT ON COLUMN courses.video_duration IS 'Video duration in seconds. Should match actual YouTube video length.';
