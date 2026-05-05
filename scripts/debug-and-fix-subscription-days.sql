-- First, let's see what's actually in the database
SELECT 
    us.id,
    us.user_id,
    s.name as subscription_name,
    us.activation_date,
    us.is_active,
    us.total_active_days_used,
    s.duration_days,
    us.created_at,
    us.start_date,
    -- Calculate what the days SHOULD be
    CASE 
        WHEN us.activation_date IS NOT NULL THEN 
            CURRENT_DATE - us.activation_date::date + 1
        ELSE 0 
    END as calculated_days_should_be,
    -- Show the difference
    CASE 
        WHEN us.activation_date IS NOT NULL THEN 
            (CURRENT_DATE - us.activation_date::date + 1) - COALESCE(us.total_active_days_used, 0)
        ELSE 0 
    END as days_difference
FROM user_subscriptions us
JOIN subscriptions s ON us.subscription_id = s.id
WHERE us.is_active = true
ORDER BY us.created_at DESC;

-- Now fix ALL active subscriptions by recalculating days from activation date
UPDATE user_subscriptions 
SET total_active_days_used = CASE 
    WHEN activation_date IS NOT NULL AND activation_date::date <= CURRENT_DATE THEN 
        CURRENT_DATE - activation_date::date + 1
    WHEN activation_date IS NULL AND is_active = true THEN 
        -- If no activation date but marked active, use days since creation
        CURRENT_DATE - created_at::date + 1
    ELSE 
        COALESCE(total_active_days_used, 0)
END
WHERE is_active = true;

-- Deactivate subscriptions that have exceeded their duration
UPDATE user_subscriptions 
SET is_active = false
WHERE is_active = true 
    AND total_active_days_used >= (
        SELECT duration_days 
        FROM subscriptions 
        WHERE id = user_subscriptions.subscription_id
    );

-- Final verification - show results
SELECT 
    us.id,
    us.user_id,
    s.name as subscription_name,
    us.activation_date,
    us.is_active,
    us.total_active_days_used,
    s.duration_days,
    (s.duration_days - us.total_active_days_used) as remaining_days,
    CASE 
        WHEN us.total_active_days_used >= s.duration_days THEN 'EXPIRED'
        WHEN us.is_active = true THEN 'ACTIVE'
        ELSE 'INACTIVE'
    END as status,
    -- Show calculation details
    CASE 
        WHEN us.activation_date IS NOT NULL THEN 
            'Activated ' || (CURRENT_DATE - us.activation_date::date + 1) || ' days ago'
        ELSE 'No activation date'
    END as activation_info
FROM user_subscriptions us
JOIN subscriptions s ON us.subscription_id = s.id
WHERE us.is_active = true OR us.total_active_days_used > 0
ORDER BY us.created_at DESC;
