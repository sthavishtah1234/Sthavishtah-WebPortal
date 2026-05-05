-- Create instructors table
CREATE TABLE IF NOT EXISTS instructors (
  id SERIAL PRIMARY KEY,
  instructor_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20),
  email VARCHAR(100),
  dob DATE,
  password VARCHAR(100) NOT NULL,
  profile_image VARCHAR(255),
  bio TEXT,
  specialization VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on instructor_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_instructor_id ON instructors(instructor_id);
