-- Add activation fields to user_subscriptions table
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS activation_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_activated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS activation_notes TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_is_active ON user_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_activation_date ON user_subscriptions(activation_date);

-- Update existing subscriptions to be active with their start_date as activation_date
UPDATE user_subscriptions 
SET is_active = true, 
    activation_date = start_date,
    admin_activated = false
WHERE activation_date IS NULL;

-- Add batch activation fields to subscription_batches table
ALTER TABLE subscription_batches
ADD COLUMN IF NOT EXISTS activation_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add activation settings to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS requires_activation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_activate_after_days INTEGER DEFAULT 0;
