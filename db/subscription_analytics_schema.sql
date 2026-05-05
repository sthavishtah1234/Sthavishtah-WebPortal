-- Create subscription_analytics table to track subscription metrics
CREATE TABLE IF NOT EXISTS subscription_analytics (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER NOT NULL REFERENCES subscriptions(id),
  month DATE NOT NULL,
  new_subscriptions INTEGER NOT NULL DEFAULT 0,
  renewals INTEGER NOT NULL DEFAULT 0,
  cancellations INTEGER NOT NULL DEFAULT 0,
  revenue DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscription_analytics_month ON subscription_analytics(month);
CREATE INDEX IF NOT EXISTS idx_subscription_analytics_subscription_id ON subscription_analytics(subscription_id);

-- Function to calculate total active subscriptions
CREATE OR REPLACE FUNCTION get_total_active_subscriptions()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active');
END;
$$ LANGUAGE plpgsql;

-- Function to calculate monthly revenue
CREATE OR REPLACE FUNCTION get_monthly_revenue()
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(s.price), 0)
    FROM user_subscriptions us
    JOIN subscriptions s ON us.subscription_id = s.id
    WHERE us.status = 'active'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to calculate subscription distribution
CREATE OR REPLACE FUNCTION get_subscription_distribution()
RETURNS TABLE (
  subscription_name VARCHAR,
  subscription_count INTEGER,
  subscription_percentage DECIMAL
) AS $$
DECLARE
  total INTEGER;
BEGIN
  total := (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active');
  
  RETURN QUERY
  SELECT 
    s.name AS subscription_name,
    COUNT(us.id) AS subscription_count,
    CASE WHEN total > 0 THEN (COUNT(us.id)::DECIMAL / total * 100) ELSE 0 END AS subscription_percentage
  FROM 
    user_subscriptions us
  JOIN 
    subscriptions s ON us.subscription_id = s.id
  WHERE 
    us.status = 'active'
  GROUP BY 
    s.name;
END;
$$ LANGUAGE plpgsql;
