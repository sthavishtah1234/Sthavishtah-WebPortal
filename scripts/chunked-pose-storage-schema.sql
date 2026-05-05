-- Chunked Pose Storage Schema
-- Splits pose data across multiple JSONB columns to prevent timeout issues
-- Each chunk stores max 1000 frames

-- Step 1: Create new table with chunked columns
CREATE TABLE IF NOT EXISTS instructor_poses_chunked (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL UNIQUE,
  video_url TEXT,
  total_frames INTEGER NOT NULL DEFAULT 0,
  poses_chunk_1 JSONB DEFAULT '[]'::jsonb,
  poses_chunk_2 JSONB DEFAULT '[]'::jsonb,
  poses_chunk_3 JSONB DEFAULT '[]'::jsonb,
  poses_chunk_4 JSONB DEFAULT '[]'::jsonb,
  poses_chunk_5 JSONB DEFAULT '[]'::jsonb,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_instructor_poses_chunked_course_id 
ON instructor_poses_chunked(course_id);

CREATE INDEX IF NOT EXISTS idx_instructor_poses_chunked_created_at 
ON instructor_poses_chunked(created_at DESC);

-- Enable RLS
ALTER TABLE instructor_poses_chunked ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Allow all operations on instructor_poses_chunked" 
ON instructor_poses_chunked
FOR ALL USING (true) WITH CHECK (true);

-- Step 2: Create function to append poses to correct chunk
CREATE OR REPLACE FUNCTION append_to_pose_chunk(
  p_course_id TEXT,
  p_new_poses JSONB,
  p_chunk_number INTEGER
)
RETURNS VOID AS $$
DECLARE
  chunk_column TEXT;
BEGIN
  -- Determine which chunk column to update
  chunk_column := 'poses_chunk_' || p_chunk_number;
  
  -- Update the specific chunk using dynamic SQL
  EXECUTE format(
    'UPDATE instructor_poses_chunked 
     SET %I = %I || $1,
         total_frames = total_frames + jsonb_array_length($1)
     WHERE course_id = $2',
    chunk_column, chunk_column
  ) USING p_new_poses, p_course_id;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Migration - Convert existing single-column data to chunked format
-- Run this ONLY if you have existing data in instructor_poses table
DO $$
DECLARE
  pose_record RECORD;
  poses_array JSONB;
  chunk_size INTEGER := 1000;
  chunk_num INTEGER;
  chunk_start INTEGER;
  chunk_end INTEGER;
BEGIN
  -- Check if old table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'instructor_poses') THEN
    
    -- Iterate through each video
    FOR pose_record IN 
      SELECT id, course_id, video_url, total_frames, poses, processed_at, created_at
      FROM instructor_poses
    LOOP
      poses_array := pose_record.poses;
      
      -- Insert base record
      INSERT INTO instructor_poses_chunked (id, course_id, video_url, total_frames, processed_at, created_at)
      VALUES (
        pose_record.id,
        pose_record.course_id,
        pose_record.video_url,
        pose_record.total_frames,
        pose_record.processed_at,
        pose_record.created_at
      );
      
      -- Split poses into chunks
      FOR chunk_num IN 1..5 LOOP
        chunk_start := (chunk_num - 1) * chunk_size;
        chunk_end := chunk_num * chunk_size;
        
        -- Extract chunk using jsonb_array_elements with limit
        EXECUTE format(
          'UPDATE instructor_poses_chunked 
           SET poses_chunk_%s = (
             SELECT jsonb_agg(elem)
             FROM (
               SELECT elem
               FROM jsonb_array_elements($1) WITH ORDINALITY AS t(elem, idx)
               WHERE idx > $2 AND idx <= $3
             ) sub
           )
           WHERE course_id = $4',
          chunk_num
        ) USING poses_array, chunk_start, chunk_end, pose_record.course_id;
        
        -- Exit if we've processed all poses
        EXIT WHEN chunk_end >= pose_record.total_frames;
      END LOOP;
    END LOOP;
    
    -- Rename old table as backup
    ALTER TABLE instructor_poses RENAME TO instructor_poses_old_backup;
    
    RAISE NOTICE 'Migration completed successfully';
  END IF;
END $$;

-- Step 4: Rename new table to original name
ALTER TABLE instructor_poses_chunked RENAME TO instructor_poses;

-- Verification query
SELECT 
  course_id,
  total_frames,
  jsonb_array_length(COALESCE(poses_chunk_1, '[]'::jsonb)) as chunk1_count,
  jsonb_array_length(COALESCE(poses_chunk_2, '[]'::jsonb)) as chunk2_count,
  jsonb_array_length(COALESCE(poses_chunk_3, '[]'::jsonb)) as chunk3_count,
  jsonb_array_length(COALESCE(poses_chunk_4, '[]'::jsonb)) as chunk4_count,
  jsonb_array_length(COALESCE(poses_chunk_5, '[]'::jsonb)) as chunk5_count
FROM instructor_poses
ORDER BY created_at DESC
LIMIT 5;
