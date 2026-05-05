-- Step 1: Fix the data type issue and update all subscription days
UPDATE user_subscriptions 
SET total_active_days_used = CASE 
    WHEN activation_date IS NOT NULL THEN 
        GREATEST(0, CURRENT_DATE - activation_date::date + 1)
    ELSE 0
END
WHERE activation_date IS NOT NULL;

-- Step 2: Deactivate expired subscriptions
UPDATE user_subscriptions 
SET is_active = false
WHERE activation_date IS NOT NULL 
    AND (CURRENT_DATE - activation_date::date + 1) >= (
        SELECT duration_days 
        FROM subscriptions 
        WHERE id = user_subscriptions.subscription_id
    );

-- Step 3: Verify the results
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
    END as status
FROM user_subscriptions us
JOIN subscriptions s ON us.subscription_id = s.id
WHERE us.activation_date IS NOT NULL
ORDER BY us.activation_date DESC;
