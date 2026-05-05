-- Complete AI Database Setup Script
-- Run this in your AI Supabase database SQL editor

-- =====================================================
-- Table 1: pose_sessions
-- Stores metadata about processed instructor videos
-- =====================================================
CREATE TABLE IF NOT EXISTS pose_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL,
  video_name TEXT,
  video_duration NUMERIC NOT NULL,
  total_frames INTEGER NOT NULL,
  processing_status TEXT DEFAULT 'completed',
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pose_sessions_course_id ON pose_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_pose_sessions_created_at ON pose_sessions(created_at DESC);

-- =====================================================
-- Table 2: instructor_poses
-- Stores extracted pose landmarks from instructor videos
-- =====================================================
CREATE TABLE IF NOT EXISTS instructor_poses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES pose_sessions(id) ON DELETE CASCADE,
  timestamp_ms INTEGER NOT NULL,
  pose_landmarks JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instructor_poses_session_id ON instructor_poses(session_id);
CREATE INDEX IF NOT EXISTS idx_instructor_poses_timestamp ON instructor_poses(session_id, timestamp_ms);

-- =====================================================
-- Table 3: user_pose_tracking
-- Stores real-time user pose comparison data
-- =====================================================
CREATE TABLE IF NOT EXISTS user_pose_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  course_id TEXT NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  video_timestamp_ms INTEGER NOT NULL,
  overall_accuracy NUMERIC(5,2) NOT NULL,
  joint_accuracies JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_pose_tracking_user_email ON user_pose_tracking(user_email);
CREATE INDEX IF NOT EXISTS idx_user_pose_tracking_course_id ON user_pose_tracking(course_id);
CREATE INDEX IF NOT EXISTS idx_user_pose_tracking_session_date ON user_pose_tracking(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_pose_tracking_created_at ON user_pose_tracking(created_at DESC);

-- =====================================================
-- Enable Row Level Security (RLS)
-- =====================================================
ALTER TABLE pose_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_poses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pose_tracking ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies - Allow all operations for now
-- Adjust based on your security requirements
-- =====================================================

-- pose_sessions policies
CREATE POLICY "Allow all operations on pose_sessions" ON pose_sessions
  FOR ALL USING (true) WITH CHECK (true);

-- instructor_poses policies
CREATE POLICY "Allow all operations on instructor_poses" ON instructor_poses
  FOR ALL USING (true) WITH CHECK (true);

-- user_pose_tracking policies
CREATE POLICY "Allow all operations on user_pose_tracking" ON user_pose_tracking
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- Verification Queries
-- =====================================================
-- Run these to verify tables were created successfully:

-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('pose_sessions', 'instructor_poses', 'user_pose_tracking');

-- SELECT tablename, indexname FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('pose_sessions', 'instructor_poses', 'user_pose_tracking');
