-- Add instructor_pose_session_id column to courses table
-- Run this in your MAIN Supabase database (not AI database)

-- Add the column to store the pose session ID
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS instructor_pose_session_id UUID;

-- Add comment to document the column
COMMENT ON COLUMN courses.instructor_pose_session_id IS 'References pose_sessions.id in AI database for instructor pose tracking';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_courses_instructor_pose_session 
ON courses(instructor_pose_session_id);

-- Optional: Add check to ensure pose tracking only for YouTube videos
-- ALTER TABLE courses 
-- ADD CONSTRAINT check_pose_tracking_youtube 
-- CHECK (
--   instructor_pose_session_id IS NULL OR 
--   video_type = 'youtube'
-- );
