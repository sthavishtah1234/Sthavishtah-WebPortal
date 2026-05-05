-- Add columns for subscription time tracking mechanism
-- This allows tracking active days separately from calendar days

-- Add columns to user_subscriptions table
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS total_active_days_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_status_change TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS paused_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS effective_end_date TIMESTAMPTZ;

-- Create function to calculate effective end date based on active days only
CREATE OR REPLACE FUNCTION calculate_effective_end_date(
  p_user_subscription_id INTEGER
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_activation_date TIMESTAMPTZ;
  v_duration_days INTEGER;
  v_total_active_days INTEGER;
  v_remaining_days INTEGER;
BEGIN
  -- Get subscription details
  SELECT 
    us.activation_date,
    s.duration_days,
    us.total_active_days_used
  INTO 
    v_activation_date,
    v_duration_days,
    v_total_active_days
  FROM user_subscriptions us
  JOIN subscriptions s ON us.subscription_id = s.id
  WHERE us.id = p_user_subscription_id;
  
  -- Calculate remaining days
  v_remaining_days := v_duration_days - v_total_active_days;
  
  -- If no remaining days, return activation date (expired)
  IF v_remaining_days <= 0 THEN
    RETURN v_activation_date;
  END IF;
  
  -- Return activation date + remaining days (assuming continuous active use)
  RETURN v_activation_date + (v_remaining_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Create function to update active days when subscription status changes
CREATE OR REPLACE FUNCTION update_subscription_active_days()
RETURNS TRIGGER AS $$
DECLARE
  v_days_since_last_change INTEGER;
BEGIN
  -- Only process if is_active status changed
  IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    
    -- Calculate days since last status change
    v_days_since_last_change := EXTRACT(DAY FROM (NOW() - OLD.last_status_change));
    
    -- If subscription was active, add those days to total_active_days_used
    IF OLD.is_active = true AND v_days_since_last_change > 0 THEN
      NEW.total_active_days_used := OLD.total_active_days_used + v_days_since_last_change;
    END IF;
    
    -- If subscription was inactive, add those days to paused_days
    IF OLD.is_active = false AND v_days_since_last_change > 0 THEN
      NEW.paused_days := OLD.paused_days + v_days_since_last_change;
    END IF;
    
    -- Update last status change timestamp
    NEW.last_status_change := NOW();
    
    -- Recalculate effective end date
    NEW.effective_end_date := calculate_effective_end_date(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update active days
DROP TRIGGER IF EXISTS trigger_update_subscription_active_days ON user_subscriptions;
CREATE TRIGGER trigger_update_subscription_active_days
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_active_days();

-- Create function to check if subscription is truly expired (used all active days)
CREATE OR REPLACE FUNCTION is_subscription_expired(p_user_subscription_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_duration_days INTEGER;
  v_total_active_days INTEGER;
BEGIN
  SELECT 
    s.duration_days,
    us.total_active_days_used
  INTO 
    v_duration_days,
    v_total_active_days
  FROM user_subscriptions us
  JOIN subscriptions s ON us.subscription_id = s.id
  WHERE us.id = p_user_subscription_id;
  
  RETURN v_total_active_days >= v_duration_days;
END;
$$ LANGUAGE plpgsql;

-- Update existing subscriptions to initialize the new fields
UPDATE user_subscriptions 
SET 
  total_active_days_used = CASE 
    WHEN is_active = true AND activation_date IS NOT NULL THEN 
      GREATEST(0, EXTRACT(DAY FROM (NOW() - activation_date))::INTEGER)
    ELSE 0 
  END,
  last_status_change = COALESCE(activation_date, NOW()),
  paused_days = 0,
  effective_end_date = calculate_effective_end_date(id)
WHERE activation_date IS NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active_days ON user_subscriptions(total_active_days_used);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_effective_end_date ON user_subscriptions(effective_end_date);
