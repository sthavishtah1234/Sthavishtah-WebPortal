-- Create phone_verification table
CREATE TABLE IF NOT EXISTS phone_verification (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  phone_number TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_phone_verification_phone ON phone_verification(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_verification_user_id ON phone_verification(user_id);
