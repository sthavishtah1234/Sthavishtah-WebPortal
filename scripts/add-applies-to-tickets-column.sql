-- Add applies_to_tickets column to referral_codes table
ALTER TABLE referral_codes 
ADD COLUMN IF NOT EXISTS applies_to_tickets BOOLEAN DEFAULT true;

-- Update existing codes to apply to both by default
UPDATE referral_codes SET applies_to_tickets = true WHERE applies_to_tickets IS NULL;
