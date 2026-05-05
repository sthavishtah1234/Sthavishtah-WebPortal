-- Create UUID extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create generated_links table
CREATE TABLE IF NOT EXISTS generated_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  link_type TEXT NOT NULL CHECK (link_type IN ('session', 'whatsapp')),
  token TEXT NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('all', 'users', 'user', 'subscription')),
  target_ids JSONB,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by INTEGER REFERENCES users(id), -- Using INTEGER for user IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create link_usages table
CREATE TABLE IF NOT EXISTS link_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id UUID REFERENCES generated_links(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- Using INTEGER for user IDs
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  UNIQUE(link_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_generated_links_token ON generated_links(token);
CREATE INDEX IF NOT EXISTS idx_link_usages_link_id ON link_usages(link_id);
CREATE INDEX IF NOT EXISTS idx_link_usages_user_id ON link_usages(user_id);
