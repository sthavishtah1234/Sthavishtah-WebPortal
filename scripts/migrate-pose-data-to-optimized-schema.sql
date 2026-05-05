-- Migration Script for Optimized Pose Storage
-- Run this in your AI Supabase database

-- =====================================================
-- OPTION 1: DELETE ALL EXISTING DATA (CLEAN START)
-- =====================================================
-- Uncomment these lines if you want to delete all existing pose data:

-- DELETE FROM user_pose_tracking;
-- DELETE FROM instructor_poses;
-- DELETE FROM pose_sessions;


-- =====================================================
-- OPTION 2: CONVERT EXISTING DATA TO NEW SCHEMA
-- =====================================================
-- This converts multiple rows per video into single rows with arrays

-- Step 1: Create temporary table with aggregated data
CREATE TEMP TABLE temp_aggregated_poses AS
SELECT 
  session_id,
  jsonb_agg(
    jsonb_build_object(
      'timestamp_ms', timestamp_ms,
      'pose_landmarks', pose_landmarks
    ) ORDER BY timestamp_ms
  ) as poses_array
FROM instructor_poses
GROUP BY session_id;

-- Step 2: Drop the old instructor_poses table
DROP TABLE IF EXISTS instructor_poses;

-- Step 3: Create new optimized schema
CREATE TABLE pose_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL UNIQUE,
  video_name TEXT,
  video_duration NUMERIC NOT NULL,
  total_frames INTEGER NOT NULL,
  poses_data JSONB NOT NULL,
  processing_status TEXT DEFAULT 'completed',
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pose_sessions_course_id ON pose_sessions(course_id);
CREATE INDEX idx_pose_sessions_created_at ON pose_sessions(created_at DESC);

-- Step 4: Migrate data from temp table to new schema
INSERT INTO pose_sessions (id, course_id, video_name, video_duration, total_frames, poses_data, processing_status, processed_at, created_at)
SELECT 
  ps.id,
  ps.course_id,
  ps.video_name,
  ps.video_duration,
  ps.total_frames,
  COALESCE(tap.poses_array, '[]'::jsonb) as poses_data,
  ps.processing_status,
  ps.processed_at,
  ps.created_at
FROM pose_sessions ps
LEFT JOIN temp_aggregated_poses tap ON ps.id = tap.session_id;

-- Step 5: Drop temporary table
DROP TABLE temp_aggregated_poses;

-- Step 6: Update user_pose_tracking table (no changes needed, just verify)
-- The user_pose_tracking table structure remains the same

-- Step 7: Enable RLS
ALTER TABLE pose_sessions ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies
DROP POLICY IF EXISTS "Allow all operations on pose_sessions" ON pose_sessions;
CREATE POLICY "Allow all operations on pose_sessions" ON pose_sessions
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the migration:

-- Check pose_sessions table structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'pose_sessions';

-- Count total pose sessions
-- SELECT COUNT(*) as total_sessions FROM pose_sessions;

-- Check sample data
-- SELECT id, course_id, total_frames, jsonb_array_length(poses_data) as poses_count FROM pose_sessions LIMIT 5;
