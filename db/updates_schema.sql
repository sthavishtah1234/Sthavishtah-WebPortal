-- Create updates table
CREATE TABLE IF NOT EXISTS updates (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'announcement', 'schedule', 'system', 'course'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_updates_created_at ON updates(created_at);
