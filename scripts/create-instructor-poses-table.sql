-- Create table in AI Supabase database to store instructor pose data
CREATE TABLE IF NOT EXISTS instructor_poses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  course_id VARCHAR(255) NOT NULL,
  timestamp_ms INTEGER NOT NULL,
  pose_landmarks JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Index for fast lookups during live sessions
  INDEX idx_session_timestamp (session_id, timestamp_ms),
  INDEX idx_course_id (course_id)
);

-- Metadata table for pose sessions
CREATE TABLE IF NOT EXISTS pose_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id VARCHAR(255) NOT NULL UNIQUE,
  video_duration_ms INTEGER NOT NULL,
  total_frames_processed INTEGER NOT NULL,
  processing_status VARCHAR(50) DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
