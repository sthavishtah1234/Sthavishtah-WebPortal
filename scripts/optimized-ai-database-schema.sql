-- Optimized AI Database Schema
-- Store all poses for one video in a single JSONB column

-- Drop old tables if they exist
DROP TABLE IF EXISTS user_pose_tracking CASCADE;
DROP TABLE IF EXISTS instructor_poses CASCADE;
DROP TABLE IF EXISTS pose_sessions CASCADE;

-- =====================================================
-- Table 1: instructor_pose_data
-- Stores ALL pose data for one video in a single row
-- =====================================================
CREATE TABLE instructor_pose_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT UNIQUE NOT NULL,
  video_name TEXT,
  video_duration NUMERIC NOT NULL,
  total_frames INTEGER NOT NULL,
  -- JSONB array: [{ timestamp_ms: 0, landmarks: [...] }, { timestamp_ms: 500, landmarks: [...] }, ...]
  poses JSONB NOT NULL,
  processing_status TEXT DEFAULT 'completed',
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_instructor_pose_data_course_id ON instructor_pose_data(course_id);
CREATE INDEX idx_instructor_pose_data_created_at ON instructor_pose_data(created_at DESC);

-- =====================================================
-- Table 2: user_pose_sessions
-- Stores aggregated user pose tracking per session
-- =====================================================
CREATE TABLE user_pose_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  course_id TEXT NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  average_accuracy NUMERIC(5,2),
  -- JSONB array of accuracy snapshots: [{ timestamp_ms: 1000, overall: 85, joints: {...} }, ...]
  accuracy_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_pose_sessions_user_email ON user_pose_sessions(user_email);
CREATE INDEX idx_user_pose_sessions_course_id ON user_pose_sessions(course_id);
CREATE INDEX idx_user_pose_sessions_session_date ON user_pose_sessions(session_date DESC);

-- =====================================================
-- Enable Row Level Security (RLS)
-- =====================================================
ALTER TABLE instructor_pose_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pose_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all operations on instructor_pose_data" ON instructor_pose_data
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on user_pose_sessions" ON user_pose_sessions
  FOR ALL USING (true) WITH CHECK (true);
