-- Check if video_analytics table exists, if not create it
CREATE TABLE IF NOT EXISTS video_analytics (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  completion_count INTEGER NOT NULL DEFAULT 0,
  completion_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a function to populate video_analytics from user_courses if it's empty
CREATE OR REPLACE FUNCTION populate_video_analytics()
RETURNS void AS $$
BEGIN
  -- Only populate if the table is empty
  IF (SELECT COUNT(*) FROM video_analytics) = 0 THEN
    -- Insert data from user_courses aggregated by course
    INSERT INTO video_analytics (course_id, title, view_count, completion_count, completion_rate)
    SELECT 
      c.id AS course_id,
      c.title,
      COUNT(uc.id) FILTER (WHERE uc.attended = true) AS view_count,
      COUNT(uc.id) FILTER (WHERE uc.completed_video = true) AS completion_count,
      CASE 
        WHEN COUNT(uc.id) FILTER (WHERE uc.attended = true) > 0 
        THEN (COUNT(uc.id) FILTER (WHERE uc.completed_video = true)::DECIMAL / 
              COUNT(uc.id) FILTER (WHERE uc.attended = true)) * 100
        ELSE 0
      END AS completion_rate
    FROM 
      courses c
    LEFT JOIN 
      user_courses uc ON c.id = uc.course_id
    GROUP BY 
      c.id, c.title;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update video analytics when user_courses changes
CREATE OR REPLACE FUNCTION update_video_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- If a user viewed or completed a video
  IF (NEW.attended = TRUE OR NEW.completed_video = TRUE) THEN
    -- Update or insert into video_analytics
    INSERT INTO video_analytics (course_id, title, view_count, completion_count, completion_rate)
    SELECT 
      c.id,
      c.title,
      CASE WHEN NEW.attended = TRUE AND (OLD IS NULL OR OLD.attended = FALSE) THEN 1 ELSE 0 END,
      CASE WHEN NEW.completed_video = TRUE AND (OLD IS NULL OR OLD.completed_video = FALSE) THEN 1 ELSE 0 END,
      0 -- Will be recalculated below
    FROM courses c
    WHERE c.id = NEW.course_id
    ON CONFLICT (course_id) DO UPDATE
    SET 
      view_count = CASE 
        WHEN NEW.attended = TRUE AND (OLD IS NULL OR OLD.attended = FALSE)
        THEN video_analytics.view_count + 1
        ELSE video_analytics.view_count
      END,
      completion_count = CASE 
        WHEN NEW.completed_video = TRUE AND (OLD IS NULL OR OLD.completed_video = FALSE)
        THEN video_analytics.completion_count + 1
        ELSE video_analytics.completion_count
      END,
      updated_at = NOW();
      
    -- Update completion rate
    UPDATE video_analytics
    SET completion_rate = 
      CASE 
        WHEN view_count > 0 
        THEN (completion_count::DECIMAL / view_count) * 100
        ELSE 0
      END
    WHERE course_id = NEW.course_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on user_courses table
DROP TRIGGER IF EXISTS user_course_video_analytics ON user_courses;
CREATE TRIGGER user_course_video_analytics
AFTER INSERT OR UPDATE ON user_courses
FOR EACH ROW
EXECUTE FUNCTION update_video_analytics();

-- Run the populate function to fill the table if it's empty
SELECT populate_video_analytics();
