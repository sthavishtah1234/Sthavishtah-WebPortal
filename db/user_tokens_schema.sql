-- Create user_tokens table with enhanced security features
CREATE TABLE IF NOT EXISTS user_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_valid BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT 1,
  device_fingerprint TEXT,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_user_tokens_hash ON user_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);

-- Add a constraint to ensure token_hash is unique for valid tokens
ALTER TABLE user_tokens ADD CONSTRAINT unique_valid_token UNIQUE (token_hash, is_valid) 
WHERE is_valid = TRUE;
