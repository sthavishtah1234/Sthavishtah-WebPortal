-- Make youtube_link nullable since Zoom courses don't need it
ALTER TABLE courses 
ALTER COLUMN youtube_link DROP NOT NULL;

-- Add constraint to ensure proper video data exists
ALTER TABLE courses 
ADD CONSTRAINT check_video_data CHECK (
  (video_type = 'youtube' AND youtube_link IS NOT NULL) OR
  (video_type = 'zoom' AND zoom_meeting_id IS NOT NULL)
);
