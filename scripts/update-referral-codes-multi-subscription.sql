-- ============================================
-- Update Referral Codes to Support Multiple Subscriptions with Different Discounts
-- ============================================

-- 1. Drop unique constraint on code (allow same code for different subscriptions)
ALTER TABLE referral_codes DROP CONSTRAINT IF EXISTS referral_codes_code_key;

-- 2. Create unique index on code + subscription_id combination
CREATE UNIQUE INDEX IF NOT EXISTS referral_codes_code_subscription_unique 
ON referral_codes(code, COALESCE(subscription_id, 0));

-- 3. Remove the check constraint that requires either universal OR specific subscription
ALTER TABLE referral_codes DROP CONSTRAINT IF EXISTS check_universal_or_subscription;

-- 4. Add new constraint: subscription_id is required (no more universal codes)
ALTER TABLE referral_codes 
ADD CONSTRAINT check_subscription_required 
CHECK (subscription_id IS NOT NULL);

-- 5. Update is_universal to always be false since we're using subscription-specific codes
UPDATE referral_codes SET is_universal = false WHERE is_universal = true;

-- 6. Drop is_universal column as it's no longer needed
ALTER TABLE referral_codes DROP COLUMN IF EXISTS is_universal;

-- 7. Add index for better query performance on active codes
CREATE INDEX IF NOT EXISTS idx_referral_codes_active_code ON referral_codes(code) WHERE is_active = true;
