-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS link_usages CASCADE;
DROP TABLE IF EXISTS generated_links CASCADE;

-- Create UUID extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create generated_links table
CREATE TABLE generated_links (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  link_type TEXT NOT NULL CHECK (link_type IN ('session', 'whatsapp')),
  token TEXT NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('all', 'user', 'users', 'subscription')),
  target_ids TEXT, -- Store as comma-separated string for simplicity
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create link_usages table
CREATE TABLE link_usages (
  id SERIAL PRIMARY KEY,
  link_id INTEGER REFERENCES generated_links(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE
);

-- Create indexes
CREATE INDEX idx_generated_links_token ON generated_links(token);
CREATE INDEX idx_generated_links_active ON generated_links(is_active);
CREATE INDEX idx_link_usages_link_id ON link_usages(link_id);
CREATE INDEX idx_link_usages_user_id ON link_usages(user_id);

-- Insert some test data
INSERT INTO generated_links (title, description, link_type, token, target_url, target_type, target_ids, is_active) VALUES
('Test All Users Link', 'Link for all users', 'session', 'test123', '/user/dashboard', 'all', NULL, true),
('Test User 1 Link', 'Link for user 1 only', 'session', 'user001', '/user/dashboard', 'user', '1', true),
('Test Subscription Link', 'Link for subscription 1', 'whatsapp', 'sub001', 'https://chat.whatsapp.com/test', 'subscription', '1', true);
