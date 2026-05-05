-- Add ticket_discount_percentage column to referral_codes
ALTER TABLE referral_codes 
ADD COLUMN IF NOT EXISTS ticket_discount_percentage INTEGER;

-- Make subscription_id nullable for ticket-only codes
ALTER TABLE referral_codes 
ALTER COLUMN subscription_id DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN referral_codes.ticket_discount_percentage IS 'Discount percentage for ticket bookings (can differ from subscription discount)';
