-- ============================================
-- Influencer Tracking System for Tickets
-- ============================================

-- 1. Create influencer_links table (for tracking bookings from influencer links)
CREATE TABLE IF NOT EXISTS influencer_links (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,  -- e.g., "john", "sarah"
  influencer_name VARCHAR(255) NOT NULL,
  influencer_email VARCHAR(255),
  influencer_phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- 2. Add columns to ticket_bookings for tracking
ALTER TABLE ticket_bookings 
ADD COLUMN IF NOT EXISTS influencer_code VARCHAR(50);

ALTER TABLE ticket_bookings 
ADD COLUMN IF NOT EXISTS referral_code_used VARCHAR(50);

ALTER TABLE ticket_bookings 
ADD COLUMN IF NOT EXISTS discount_applied DECIMAL(10, 2) DEFAULT 0;

ALTER TABLE ticket_bookings 
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2);

-- 3. Extend referral_codes to support tickets
ALTER TABLE referral_codes 
ADD COLUMN IF NOT EXISTS applies_to_tickets BOOLEAN DEFAULT false;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_influencer_links_code ON influencer_links(code);
CREATE INDEX IF NOT EXISTS idx_influencer_links_active ON influencer_links(is_active);
CREATE INDEX IF NOT EXISTS idx_ticket_bookings_influencer ON ticket_bookings(influencer_code);
CREATE INDEX IF NOT EXISTS idx_ticket_bookings_referral ON ticket_bookings(referral_code_used);

-- 5. Create view for influencer stats
CREATE OR REPLACE VIEW influencer_ticket_stats AS
SELECT 
  il.id,
  il.code,
  il.influencer_name,
  il.influencer_email,
  il.influencer_phone,
  il.is_active,
  il.created_at,
  il.notes,
  COUNT(tb.id) as total_bookings,
  COALESCE(SUM(CASE WHEN tb.is_paid THEN 1 ELSE 0 END), 0) as paid_bookings,
  COALESCE(SUM(et.ticket_price), 0) as total_revenue
FROM influencer_links il
LEFT JOIN ticket_bookings tb ON tb.influencer_code = il.code
LEFT JOIN event_tickets et ON tb.ticket_id = et.id
GROUP BY il.id, il.code, il.influencer_name, il.influencer_email, il.influencer_phone, il.is_active, il.created_at, il.notes;

-- 6. Add comments
COMMENT ON TABLE influencer_links IS 'Stores influencer tracking links for ticket bookings';
COMMENT ON COLUMN ticket_bookings.influencer_code IS 'Tracks which influencer link was used (no discount)';
COMMENT ON COLUMN ticket_bookings.referral_code_used IS 'Tracks which referral/discount code was used';
COMMENT ON COLUMN ticket_bookings.discount_applied IS 'Amount of discount applied in INR';
COMMENT ON COLUMN referral_codes.applies_to_tickets IS 'Whether code also applies to ticket bookings';
