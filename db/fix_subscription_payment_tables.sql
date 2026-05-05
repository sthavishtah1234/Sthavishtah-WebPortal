-- Fix user_subscriptions table
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT FALSE;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS cancellation_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Fix razorpay_orders table
ALTER TABLE razorpay_orders ADD COLUMN IF NOT EXISTS receipt_id TEXT;
ALTER TABLE razorpay_orders ADD COLUMN IF NOT EXISTS notes JSONB DEFAULT '{}'::jsonb;
ALTER TABLE razorpay_orders ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Fix razorpay_payments table
ALTER TABLE razorpay_payments ADD COLUMN IF NOT EXISTS signature TEXT;
ALTER TABLE razorpay_payments ADD COLUMN IF NOT EXISTS error_code TEXT;
ALTER TABLE razorpay_payments ADD COLUMN IF NOT EXISTS error_description TEXT;
ALTER TABLE razorpay_payments ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE;

-- Fix subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_link TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS is_external_link BOOLEAN DEFAULT FALSE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_payment_id ON user_subscriptions(payment_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_subscription_id ON user_subscriptions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_orders_user_id ON razorpay_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_payments_payment_id ON razorpay_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_payments_order_id ON razorpay_payments(order_id);
