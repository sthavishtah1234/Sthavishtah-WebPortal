-- Add last_day_counted column to track when we last updated the day count
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS last_day_counted DATE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active_date 
ON user_subscriptions(is_active, activation_date) 
WHERE is_active = true AND activation_date IS NOT NULL;

-- Update existing active subscriptions to have proper day counts
UPDATE user_subscriptions 
SET total_active_days_used = CASE 
  WHEN activation_date IS NOT NULL AND is_active = true THEN 
    LEAST(
      EXTRACT(DAY FROM (CURRENT_DATE - activation_date::date)),
      (SELECT duration_days FROM subscriptions WHERE id = user_subscriptions.subscription_id)
    )
  ELSE total_active_days_used
END
WHERE activation_date IS NOT NULL;
