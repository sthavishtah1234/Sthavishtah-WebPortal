-- Create video_analytics table to track video views and completions
CREATE TABLE IF NOT EXISTS video_analytics (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id),
  title VARCHAR(255) NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  completion_count INTEGER NOT NULL DEFAULT 0,
  completion_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_video_analytics_course_id ON video_analytics(course_id);
CREATE INDEX IF NOT EXISTS idx_video_analytics_view_count ON video_analytics(view_count);

-- Function to calculate total video views
CREATE OR REPLACE FUNCTION get_total_video_views()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COALESCE(SUM(view_count), 0) FROM video_analytics);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate average completion rate
CREATE OR REPLACE FUNCTION get_average_completion_rate()
RETURNS DECIMAL AS $$
BEGIN
  RETURN (SELECT COALESCE(AVG(completion_rate), 0) FROM video_analytics);
END;
$$ LANGUAGE plpgsql;

-- Function to get most viewed video
CREATE OR REPLACE FUNCTION get_most_viewed_video()
RETURNS TABLE (
  video_title VARCHAR,
  views INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    title,
    view_count
  FROM 
    video_analytics
  ORDER BY 
    view_count DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update video analytics when a user views or completes a video
CREATE OR REPLACE FUNCTION update_video_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- If a user viewed a video
  IF NEW.attended = TRUE AND (OLD.attended IS NULL OR OLD.attended = FALSE) THEN
    -- Update or insert into video_analytics
    INSERT INTO video_analytics (course_id, title, view_count, completion_count, completion_rate)
    SELECT 
      c.id,
      c.title,
      1,
      0,
      0
    FROM courses c
    WHERE c.id = NEW.course_id
    ON CONFLICT (course_id) DO UPDATE
    SET 
      view_count = video_analytics.view_count + 1,
      completion_rate = (video_analytics.completion_count::DECIMAL / (video_analytics.view_count + 1) * 100),
      updated_at = NOW();
  END IF;
  
  -- If a user completed a video
  IF NEW.completed_video = TRUE AND (OLD.completed_video IS NULL OR OLD.completed_video = FALSE) THEN
    -- Update or insert into video_analytics
    INSERT INTO video_analytics (course_id, title, view_count, completion_count, completion_rate)
    SELECT 
      c.id,
      c.title,
      CASE WHEN NEW.attended = TRUE THEN 1 ELSE 0 END,
      1,
      100 -- If this is the first view and completion, rate is 100%
    FROM courses c
    WHERE c.id = NEW.course_id
    ON CONFLICT (course_id) DO UPDATE
    SET 
      completion_count = video_analytics.completion_count + 1,
      completion_rate = ((video_analytics.completion_count + 1)::DECIMAL / video_analytics.view_count * 100),
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_course_video_analytics
AFTER UPDATE OR INSERT ON user_courses
FOR EACH ROW
EXECUTE FUNCTION update_video_analytics();
