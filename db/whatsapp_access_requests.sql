-- Create table for tracking WhatsApp access requests
CREATE TABLE IF NOT EXISTS whatsapp_access_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_link_id UUID REFERENCES generated_links(id) ON DELETE SET NULL,
  UNIQUE(user_id, subscription_id, status)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_access_requests_status ON whatsapp_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_access_requests_user ON whatsapp_access_requests(user_id);
