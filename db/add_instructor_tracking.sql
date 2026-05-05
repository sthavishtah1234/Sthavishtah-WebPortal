-- Add instructor_id to notifications table to track who created them
ALTER TABLE notifications 
ADD COLUMN instructor_id INTEGER REFERENCES instructors(id);

-- Add instructor_id to documents table to track who created them  
ALTER TABLE documents
ADD COLUMN instructor_id INTEGER REFERENCES instructors(id);

-- Add instructor_id to user_documents table to track who created them
ALTER TABLE user_documents  
ADD COLUMN instructor_id INTEGER REFERENCES instructors(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_instructor_id ON notifications(instructor_id);
CREATE INDEX IF NOT EXISTS idx_documents_instructor_id ON documents(instructor_id);  
CREATE INDEX IF NOT EXISTS idx_user_documents_instructor_id ON user_documents(instructor_id);
