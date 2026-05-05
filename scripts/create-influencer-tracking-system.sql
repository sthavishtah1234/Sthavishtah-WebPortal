-- ============================================
-- Influencer Referral Tracking System for Event Tickets
-- ============================================

-- 1. Create influencer_codes table to store influencer referral codes
CREATE TABLE IF NOT EXISTS influencer_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL, -- e.g., "john", "sarah_fitness", "yoga_guru"
  influencer_name VARCHAR(255) NOT NULL, -- Full name of the influencer
  influencer_email VARCHAR(255), -- Optional email for contact
  influencer_phone VARCHAR(20), -- Optional phone
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT -- Any additional notes about the influencer
);

-- 2. Add referral_code column to ticket_bookings table
ALTER TABLE ticket_bookings 
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50);

-- 3. Create index for faster referral code lookups
CREATE INDEX IF NOT EXISTS idx_ticket_bookings_referral_code ON ticket_bookings(referral_code);
CREATE INDEX IF NOT EXISTS idx_influencer_codes_code ON influencer_codes(code);
CREATE INDEX IF NOT EXISTS idx_influencer_codes_active ON influencer_codes(is_active);

-- 4. Create a view for influencer statistics
CREATE OR REPLACE VIEW influencer_stats AS
SELECT 
  ic.id,
  ic.code,
  ic.influencer_name,
  ic.influencer_email,
  ic.influencer_phone,
  ic.is_active,
  ic.created_at,
  COUNT(tb.id) AS total_bookings,
  COUNT(CASE WHEN tb.is_paid = true THEN 1 END) AS paid_bookings,
  COALESCE(SUM(CASE WHEN tb.is_paid = true THEN et.ticket_price ELSE 0 END), 0) AS total_revenue
FROM influencer_codes ic
LEFT JOIN ticket_bookings tb ON LOWER(tb.referral_code) = LOWER(ic.code)
LEFT JOIN event_tickets et ON tb.ticket_id = et.id
GROUP BY ic.id, ic.code, ic.influencer_name, ic.influencer_email, ic.influencer_phone, ic.is_active, ic.created_at
ORDER BY total_bookings DESC;

-- 5. Add comments for documentation
COMMENT ON TABLE influencer_codes IS 'Stores influencer referral codes for tracking event ticket bookings';
COMMENT ON COLUMN ticket_bookings.referral_code IS 'Referral code used during booking (links to influencer_codes.code)';
COMMENT ON VIEW influencer_stats IS 'Aggregated statistics for each influencer showing bookings and revenue';
