-- Add created_by_type column to existing tables
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS created_by_type VARCHAR(20) DEFAULT 'admin';

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS created_by_type VARCHAR(20) DEFAULT 'admin';

ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS created_by_type VARCHAR(20) DEFAULT 'admin';

ALTER TABLE user_documents 
ADD COLUMN IF NOT EXISTS created_by_type VARCHAR(20) DEFAULT 'admin';

-- Update existing records to have proper created_by_type
UPDATE courses SET created_by_type = 'instructor' WHERE instructor_id IS NOT NULL;
UPDATE notifications SET created_by_type = 'instructor' WHERE instructor_id IS NOT NULL;
UPDATE documents SET created_by_type = 'instructor' WHERE instructor_id IS NOT NULL;
UPDATE user_documents SET created_by_type = 'instructor' WHERE instructor_id IS NOT NULL;

-- Add check constraints
ALTER TABLE courses ADD CONSTRAINT courses_created_by_type_check 
CHECK (created_by_type IN ('admin', 'instructor'));

ALTER TABLE notifications ADD CONSTRAINT notifications_created_by_type_check 
CHECK (created_by_type IN ('admin', 'instructor'));

ALTER TABLE documents ADD CONSTRAINT documents_created_by_type_check 
CHECK (created_by_type IN ('admin', 'instructor'));

ALTER TABLE user_documents ADD CONSTRAINT user_documents_created_by_type_check 
CHECK (created_by_type IN ('admin', 'instructor'));
