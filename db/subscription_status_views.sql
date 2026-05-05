-- Create views for the new subscription page structure

-- View for current subscriptions (both active and inactive, but not expired)
CREATE OR REPLACE VIEW current_subscriptions AS
SELECT 
  us.*,
  s.name as subscription_name,
  s.duration_days,
  s.price,
  u.name as user_name,
  u.email as user_email,
  u.phone as user_phone,
  (s.duration_days - us.total_active_days_used) as remaining_days,
  CASE 
    WHEN us.is_active = true THEN 'Active'
    ELSE 'Inactive (Paused)'
  END as status_display
FROM user_subscriptions us
JOIN subscriptions s ON us.subscription_id = s.id
JOIN users u ON us.user_id = u.id
WHERE us.total_active_days_used < s.duration_days
  AND us.activation_date IS NOT NULL;

-- View for expired subscriptions (used all active days)
CREATE OR REPLACE VIEW expired_subscriptions AS
SELECT 
  us.*,
  s.name as subscription_name,
  s.duration_days,
  s.price,
  u.name as user_name,
  u.email as user_email,
  u.phone as user_phone,
  0 as remaining_days,
  'Expired' as status_display
FROM user_subscriptions us
JOIN subscriptions s ON us.subscription_id = s.id
JOIN users u ON us.user_id = u.id
WHERE us.total_active_days_used >= s.duration_days
  AND us.activation_date IS NOT NULL;

-- Function to get subscription statistics
CREATE OR REPLACE FUNCTION get_subscription_stats()
RETURNS TABLE (
  total_current INTEGER,
  total_active INTEGER,
  total_inactive INTEGER,
  total_expired INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM current_subscriptions)::INTEGER as total_current,
    (SELECT COUNT(*) FROM current_subscriptions WHERE is_active = true)::INTEGER as total_active,
    (SELECT COUNT(*) FROM current_subscriptions WHERE is_active = false)::INTEGER as total_inactive,
    (SELECT COUNT(*) FROM expired_subscriptions)::INTEGER as total_expired;
END;
$$ LANGUAGE plpgsql;
