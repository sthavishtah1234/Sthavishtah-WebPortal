-- Add missing columns to user_subscriptions table
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'razorpay';
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_payment_id ON user_subscriptions(payment_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_razorpay_payment_id ON user_subscriptions(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_razorpay_order_id ON user_subscriptions(razorpay_order_id);
