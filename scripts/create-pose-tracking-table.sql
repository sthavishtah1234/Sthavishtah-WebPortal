-- Create pose tracking table in AI Supabase database
CREATE TABLE IF NOT EXISTS pose_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  course_id TEXT NOT NULL,
  session_date TIMESTAMP DEFAULT NOW(),
  instructor_angles JSONB,
  user_angles JSONB,
  accuracy_score INTEGER,
  video_timestamp INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_pose_sessions_user ON pose_sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_pose_sessions_course ON pose_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_pose_sessions_date ON pose_sessions(session_date);

-- Enable Row Level Security
ALTER TABLE pose_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts
CREATE POLICY "Allow anonymous inserts" ON pose_sessions
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow reads for authenticated users
CREATE POLICY "Allow authenticated reads" ON pose_sessions
  FOR SELECT
  USING (true);
