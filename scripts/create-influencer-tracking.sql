-- ============================================
-- Influencer Referral Link Tracking for Tickets
-- ============================================

-- 1. Create influencer_codes table
CREATE TABLE IF NOT EXISTS influencer_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  influencer_name VARCHAR(255) NOT NULL,
  discount_percentage INTEGER NOT NULL DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- 2. Add referral_code column to ticket_bookings
ALTER TABLE ticket_bookings 
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50);

-- 3. Add discount_applied column to track how much discount was given
ALTER TABLE ticket_bookings 
ADD COLUMN IF NOT EXISTS discount_applied DECIMAL(10, 2) DEFAULT 0;

-- 4. Add original_price column to track price before discount
ALTER TABLE ticket_bookings 
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2);

-- 5. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ticket_bookings_referral ON ticket_bookings(referral_code);
CREATE INDEX IF NOT EXISTS idx_influencer_codes_code ON influencer_codes(code);
CREATE INDEX IF NOT EXISTS idx_influencer_codes_active ON influencer_codes(is_active);

-- 6. Create view for influencer stats
CREATE OR REPLACE VIEW influencer_stats AS
SELECT 
  ic.id,
  ic.code,
  ic.influencer_name,
  ic.discount_percentage,
  ic.is_active,
  ic.created_at,
  COUNT(tb.id) AS total_bookings,
  COUNT(CASE WHEN tb.is_paid = true THEN 1 END) AS paid_bookings,
  COALESCE(SUM(CASE WHEN tb.is_paid = true THEN tb.original_price END), 0) AS total_revenue,
  COALESCE(SUM(CASE WHEN tb.is_paid = true THEN tb.discount_applied END), 0) AS total_discount_given
FROM influencer_codes ic
LEFT JOIN ticket_bookings tb ON tb.referral_code = ic.code
GROUP BY ic.id, ic.code, ic.influencer_name, ic.discount_percentage, ic.is_active, ic.created_at
ORDER BY paid_bookings DESC;

-- 7. Insert some sample influencer codes (optional - you can remove these)
-- INSERT INTO influencer_codes (code, influencer_name, discount_percentage, notes) VALUES
-- ('JOHN10', 'John Doe', 10, 'Instagram influencer'),
-- ('SARAH15', 'Sarah Smith', 15, 'YouTube channel'),
-- ('MIKE5', 'Mike Johnson', 5, 'Twitter promoter')
-- ON CONFLICT (code) DO NOTHING;
