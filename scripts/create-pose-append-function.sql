-- Create a PostgreSQL function to efficiently append poses using native JSONB concatenation
-- This is much faster than fetching, spreading arrays in JavaScript, and updating

CREATE OR REPLACE FUNCTION append_instructor_poses(
  p_course_id TEXT,
  p_new_poses JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE instructor_poses
  SET 
    poses = poses || p_new_poses,
    total_frames = jsonb_array_length(poses || p_new_poses),
    processed_at = NOW()
  WHERE course_id = p_course_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION append_instructor_poses(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION append_instructor_poses(TEXT, JSONB) TO anon;
