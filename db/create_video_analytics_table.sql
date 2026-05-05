-- Create video_analytics table to track video viewing metrics
CREATE TABLE IF NOT EXISTS video_analytics (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  course_id INTEGER REFERENCES courses(id),
  video_id VARCHAR(255) NOT NULL,
  watch_duration INTEGER NOT NULL DEFAULT 0, -- Duration watched in seconds
  completion_percentage INTEGER NOT NULL DEFAULT 0, -- 0-100
  last_position INTEGER NOT NULL DEFAULT 0, -- Last position in seconds
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  device_type VARCHAR(50),
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_video_analytics_user_id ON video_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_video_analytics_course_id ON video_analytics(course_id);
CREATE INDEX IF NOT EXISTS idx_video_analytics_video_id ON video_analytics(video_id);
CREATE INDEX IF NOT EXISTS idx_video_analytics_created_at ON video_analytics(created_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_video_analytics_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_video_analytics_timestamp
BEFORE UPDATE ON video_analytics
FOR EACH ROW
EXECUTE FUNCTION update_video_analytics_timestamp();

-- Create a view for aggregated analytics
CREATE OR REPLACE VIEW video_analytics_summary AS
SELECT
  course_id,
  video_id,
  COUNT(DISTINCT user_id) AS unique_viewers,
  AVG(completion_percentage) AS avg_completion,
  COUNT(CASE WHEN is_completed THEN 1 END) AS completions,
  MAX(updated_at) AS last_viewed
FROM
  video_analytics
GROUP BY
  course_id, video_id;

-- Create a function to get most viewed videos
CREATE OR REPLACE FUNCTION get_most_viewed_videos(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  course_id INTEGER,
  video_id VARCHAR,
  view_count BIGINT,
  course_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    va.course_id,
    va.video_id,
    COUNT(DISTINCT va.user_id) AS view_count,
    c.title AS course_name
  FROM 
    video_analytics va
  JOIN
    courses c ON va.course_id = c.id
  GROUP BY 
    va.course_id, va.video_id, c.title
  ORDER BY 
    view_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
