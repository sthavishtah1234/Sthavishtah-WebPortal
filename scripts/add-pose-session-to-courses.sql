-- Add pose_session_id column to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS pose_session_id UUID;

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_courses_pose_session ON courses(pose_session_id);
