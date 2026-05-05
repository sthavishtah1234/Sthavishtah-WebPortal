-- Add zoom_join_url column for iframe fallback
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS zoom_join_url TEXT;

COMMENT ON COLUMN courses.zoom_join_url IS 'Optional Zoom web join URL for iframe embed fallback';
