-- Count of active subscriptions by type
SELECT 
  s.name AS subscription_type,
  COUNT(us.id) AS active_count
FROM 
  user_subscriptions us
JOIN 
  subscriptions s ON us.subscription_id = s.id
WHERE 
  us.status = 'active'
GROUP BY 
  s.name;

-- Monthly revenue calculation
SELECT 
  SUM(s.price) AS monthly_revenue
FROM 
  user_subscriptions us
JOIN 
  subscriptions s ON us.subscription_id = s.id
WHERE 
  us.status = 'active';

-- Subscription growth over time (monthly)
SELECT 
  DATE_TRUNC('month', us.created_at) AS month,
  COUNT(us.id) AS new_subscriptions
FROM 
  user_subscriptions us
GROUP BY 
  DATE_TRUNC('month', us.created_at)
ORDER BY 
  month;

-- Churn rate calculation
WITH active_subs AS (
  SELECT COUNT(*) AS count
  FROM user_subscriptions
  WHERE status = 'active'
),
cancelled_subs AS (
  SELECT COUNT(*) AS count
  FROM user_subscriptions
  WHERE 
    status = 'cancelled' AND 
    updated_at >= NOW() - INTERVAL '30 days'
)
SELECT 
  (cancelled_subs.count::float / NULLIF(active_subs.count + cancelled_subs.count, 0)) * 100 AS churn_rate_percentage
FROM 
  active_subs, cancelled_subs;

-- Average subscription duration
SELECT 
  AVG(EXTRACT(EPOCH FROM (COALESCE(us.ended_at, CURRENT_TIMESTAMP) - us.created_at))/86400)::integer AS avg_duration_days
FROM 
  user_subscriptions us;

-- Subscription distribution by country
SELECT 
  u.country,
  COUNT(us.id) AS subscription_count
FROM 
  user_subscriptions us
JOIN 
  users u ON us.user_id = u.id
WHERE 
  us.status = 'active' AND
  u.country IS NOT NULL
GROUP BY 
  u.country
ORDER BY 
  subscription_count DESC;
