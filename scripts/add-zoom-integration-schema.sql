-- Add Zoom integration fields to courses table
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS video_type VARCHAR(20) DEFAULT 'youtube' CHECK (video_type IN ('youtube', 'zoom'));

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS zoom_meeting_id VARCHAR(255);

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS zoom_passcode VARCHAR(50);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_courses_video_type ON courses(video_type);

-- Add comments for documentation
COMMENT ON COLUMN courses.video_type IS 'Video provider type: youtube or zoom';
COMMENT ON COLUMN courses.zoom_meeting_id IS 'Zoom meeting ID for live sessions';
COMMENT ON COLUMN courses.zoom_passcode IS 'Optional Zoom meeting passcode';
