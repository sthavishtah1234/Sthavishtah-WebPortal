-- Add scheduling type and related columns to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS scheduling_type VARCHAR(10) DEFAULT 'date',
ADD COLUMN IF NOT EXISTS subscription_day INTEGER,
ADD COLUMN IF NOT EXISTS subscription_week INTEGER;

-- Update existing records to use date scheduling type
UPDATE courses 
SET scheduling_type = 'date'
WHERE scheduling_type IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_courses_scheduling_type ON courses(scheduling_type);
CREATE INDEX IF NOT EXISTS idx_courses_subscription_day ON courses(subscription_day);
CREATE INDEX IF NOT EXISTS idx_courses_subscription_week ON courses(subscription_week);
