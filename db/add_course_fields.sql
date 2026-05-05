-- Add difficulty and category columns to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'hatha';

-- Update existing records to have default values
UPDATE courses 
SET difficulty = 'beginner', category = 'hatha'
WHERE difficulty IS NULL OR category IS NULL;
