-- Ultra-Optimized Pose Storage Schema
-- Stores only 12 key joints instead of 33 full pose landmarks
-- Reduces database size by 70-80%

-- Create optimized table
CREATE TABLE IF NOT EXISTS instructor_poses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL UNIQUE,
  video_url TEXT,
  total_frames INTEGER NOT NULL DEFAULT 0,
  poses JSONB NOT NULL DEFAULT '[]'::jsonb,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_instructor_poses_course_id 
ON instructor_poses(course_id);

-- Enable RLS
ALTER TABLE instructor_poses ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Allow all operations on instructor_poses" ON instructor_poses
  FOR ALL USING (true) WITH CHECK (true);

-- Verification
-- SELECT 
--   course_id,
--   total_frames,
--   jsonb_array_length(poses) as stored_frames,
--   pg_size_pretty(pg_total_relation_size('instructor_poses')) as table_size
-- FROM instructor_poses;
