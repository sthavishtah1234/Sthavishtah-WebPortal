-- Create link_usages table if it doesn't exist
CREATE TABLE IF NOT EXISTS link_usages (
    id SERIAL PRIMARY KEY,
    link_id INTEGER REFERENCES generated_links(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(link_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_link_usages_link_id ON link_usages(link_id);
CREATE INDEX IF NOT EXISTS idx_link_usages_user_id ON link_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_link_usages_used_at ON link_usages(used_at);

-- Add comments
COMMENT ON TABLE link_usages IS 'Tracks when users access generated links';
COMMENT ON COLUMN link_usages.link_id IS 'Reference to the generated link';
COMMENT ON COLUMN link_usages.user_id IS 'Reference to the user who used the link';
COMMENT ON COLUMN link_usages.used_at IS 'When the link was accessed';
COMMENT ON COLUMN link_usages.ip_address IS 'IP address of the user';
COMMENT ON COLUMN link_usages.user_agent IS 'Browser user agent string';
