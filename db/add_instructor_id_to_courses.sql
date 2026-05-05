-- Add instructor_id column to courses table if it doesn't exist
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_id INTEGER REFERENCES instructors(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
