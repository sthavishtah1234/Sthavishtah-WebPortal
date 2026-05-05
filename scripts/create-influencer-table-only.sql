CREATE TABLE IF NOT EXISTS influencer_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  influencer_name VARCHAR(255) NOT NULL,
  influencer_email VARCHAR(255),
  influencer_phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  booking_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);
