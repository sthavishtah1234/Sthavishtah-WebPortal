-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_visible BOOLEAN DEFAULT TRUE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_is_visible ON documents(is_visible);

-- Sample data (optional)
INSERT INTO documents (title, url, description, category, is_visible)
VALUES 
  ('Getting Started Guide', 'https://docs.google.com/document/d/example1', 'A comprehensive guide for new users', 'general', TRUE),
  ('Yoga Poses Reference', 'https://docs.google.com/document/d/example2', 'Detailed explanations of all yoga poses covered in our courses', 'reference', TRUE),
  ('Meditation Techniques', 'https://docs.google.com/document/d/example3', 'Various meditation techniques for beginners and advanced practitioners', 'course_material', TRUE);
