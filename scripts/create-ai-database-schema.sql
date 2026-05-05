-- AI Supabase Database Schema for Pose Tracking System
-- Run this script in your AI Supabase database

-- 1. Pose Sessions (Metadata for processed instructor videos)
CREATE TABLE IF NOT EXISTS pose_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id VARCHAR(255) NOT NULL UNIQUE,
  video_duration_ms INTEGER NOT NULL,
  total_frames_processed INTEGER NOT NULL,
  processing_status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pose_sessions_course ON pose_sessions(course_id);

-- 2. Instructor Poses (Extracted landmark data from instructor videos)
CREATE TABLE IF NOT EXISTS instructor_poses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES pose_sessions(id) ON DELETE CASCADE,
  timestamp_ms INTEGER NOT NULL,
  pose_landmarks JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instructor_poses_session ON instructor_poses(session_id, timestamp_ms);

-- 3. User Pose Tracking (Real-time comparison data from live sessions)
CREATE TABLE IF NOT EXISTS user_pose_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  user_id TEXT,
  course_id VARCHAR(255) NOT NULL,
  session_id UUID REFERENCES pose_sessions(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  video_timestamp_ms INTEGER NOT NULL,
  accuracy_scores JSONB NOT NULL,
  overall_accuracy INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_tracking_user ON user_pose_tracking(user_email);
CREATE INDEX IF NOT EXISTS idx_user_tracking_course ON user_pose_tracking(course_id);
CREATE INDEX IF NOT EXISTS idx_user_tracking_session ON user_pose_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_user_tracking_date ON user_pose_tracking(session_date);

-- Enable Row Level Security
ALTER TABLE pose_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_poses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pose_tracking ENABLE ROW LEVEL SECURITY;

-- Policies for pose_sessions
CREATE POLICY "Allow all operations on pose_sessions" ON pose_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policies for instructor_poses
CREATE POLICY "Allow all operations on instructor_poses" ON instructor_poses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policies for user_pose_tracking
CREATE POLICY "Allow all operations on user_pose_tracking" ON user_pose_tracking
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE pose_sessions IS 'Metadata for processed instructor videos with pose data';
COMMENT ON TABLE instructor_poses IS 'Extracted pose landmarks from instructor videos at specific timestamps';
COMMENT ON TABLE user_pose_tracking IS 'Real-time pose comparison data from users during live sessions';
