-- First, let's see the current state of your subscriptions
SELECT 
    us.id,
    us.user_id,
    s.name as subscription_name,
    us.activation_date,
    us.is_active,
    us.total_active_days_used,
    s.duration_days,
    -- Calculate what the days SHOULD be
    CASE 
        WHEN us.activation_date IS NOT NULL THEN 
            GREATEST(0, CURRENT_DATE - us.activation_date::date + 1)
        ELSE 0 
    END as calculated_days_should_be,
    -- Show the difference
    CASE 
        WHEN us.activation_date IS NOT NULL THEN 
            CURRENT_DATE - us.activation_date::date + 1
        ELSE 0 
    END as raw_days_since_activation
FROM user_subscriptions us
JOIN subscriptions s ON us.subscription_id = s.id
WHERE us.activation_date IS NOT NULL
ORDER BY us.activation_date DESC;
