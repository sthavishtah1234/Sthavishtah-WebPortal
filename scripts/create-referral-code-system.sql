-- ============================================
-- Referral Code System
-- ============================================

-- 1. Create referral_codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_percentage INTEGER NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  usage_limit INTEGER DEFAULT NULL, -- NULL means unlimited
  times_used INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL, -- NULL means no expiry
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- 2. Create referral_code_usage table to track who used which code
CREATE TABLE IF NOT EXISTS referral_code_usage (
  id SERIAL PRIMARY KEY,
  referral_code_id INTEGER REFERENCES referral_codes(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE CASCADE,
  discount_applied INTEGER NOT NULL,
  original_price DECIMAL(10, 2) NOT NULL,
  discounted_price DECIMAL(10, 2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referral_code_id, user_id, subscription_id)
);

-- 3. Add referral_code column to user_subscriptions
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS referral_code_used VARCHAR(50) REFERENCES referral_codes(code);

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_active ON referral_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_referral_code_usage_user ON referral_code_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_code_usage_code ON referral_code_usage(referral_code_id);

-- 5. Create function to validate and apply referral code
CREATE OR REPLACE FUNCTION validate_referral_code(
  p_code VARCHAR(50),
  p_subscription_id INTEGER
) RETURNS TABLE (
  is_valid BOOLEAN,
  discount_percentage INTEGER,
  message TEXT
) AS $$
DECLARE
  v_code RECORD;
BEGIN
  -- Check if code exists and is active
  SELECT * INTO v_code
  FROM referral_codes
  WHERE code = p_code
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until >= NOW());

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'Invalid or expired referral code'::TEXT;
    RETURN;
  END IF;

  -- Check if code is for specific subscription
  IF v_code.subscription_id IS NOT NULL AND v_code.subscription_id != p_subscription_id THEN
    RETURN QUERY SELECT false, 0, 'This referral code is not valid for this subscription'::TEXT;
    RETURN;
  END IF;

  -- Check usage limit
  IF v_code.usage_limit IS NOT NULL AND v_code.times_used >= v_code.usage_limit THEN
    RETURN QUERY SELECT false, 0, 'Referral code usage limit reached'::TEXT;
    RETURN;
  END IF;

  -- Code is valid
  RETURN QUERY SELECT true, v_code.discount_percentage, 'Valid referral code'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to increment times_used when referral code is used
CREATE OR REPLACE FUNCTION increment_referral_code_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE referral_codes
  SET times_used = times_used + 1,
      updated_at = NOW()
  WHERE code = NEW.referral_code_used;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_referral_usage ON user_subscriptions;
CREATE TRIGGER trigger_increment_referral_usage
AFTER INSERT ON user_subscriptions
FOR EACH ROW
WHEN (NEW.referral_code_used IS NOT NULL)
EXECUTE FUNCTION increment_referral_code_usage();

-- 7. Add comments for documentation
COMMENT ON TABLE referral_codes IS 'Stores referral/promo codes with discount percentages';
COMMENT ON TABLE referral_code_usage IS 'Tracks which users used which referral codes';
COMMENT ON COLUMN referral_codes.usage_limit IS 'NULL means unlimited usage';
COMMENT ON COLUMN referral_codes.valid_until IS 'NULL means no expiry date';
