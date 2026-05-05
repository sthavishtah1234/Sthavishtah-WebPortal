-- Add columns for default subscriptions
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS is_default_for_new_users BOOLEAN DEFAULT FALSE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS is_one_time_only BOOLEAN DEFAULT FALSE;

-- Add a column to track if a user has received a one-time subscription
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS is_one_time_subscription BOOLEAN DEFAULT FALSE;
