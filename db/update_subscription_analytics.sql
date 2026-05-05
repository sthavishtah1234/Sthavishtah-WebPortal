-- Ensure subscription_analytics table exists
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

-- Create or update indexes for faster queries
DROP INDEX IF EXISTS idx_subscription_analytics_month;
CREATE INDEX idx_subscription_analytics_month ON subscription_analytics(month);

DROP INDEX IF EXISTS idx_subscription_analytics_subscription_id;
CREATE INDEX idx_subscription_analytics_subscription_id ON subscription_analytics(subscription_id);

-- Function to update subscription analytics for the current month
CREATE OR REPLACE FUNCTION update_subscription_analytics()
RETURNS VOID AS $$
DECLARE
  current_month DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  sub_record RECORD;
BEGIN
  -- For each subscription type
  FOR sub_record IN SELECT id FROM subscriptions LOOP
    -- Check if we already have an entry for this month and subscription
    IF NOT EXISTS (
      SELECT 1 FROM subscription_analytics 
      WHERE subscription_id = sub_record.id AND month = current_month
    ) THEN
      -- Insert new record for this month
      INSERT INTO subscription_analytics (
        subscription_id, month, new_subscriptions, renewals, cancellations, revenue
      )
      VALUES (
        sub_record.id,
        current_month,
        (SELECT COUNT(*) FROM user_subscriptions 
         WHERE subscription_id = sub_record.id 
         AND DATE_TRUNC('month', created_at) = current_month),
        0, -- Renewals will be updated separately
        (SELECT COUNT(*) FROM user_subscriptions 
         WHERE subscription_id = sub_record.id 
         AND status = 'cancelled'
         AND DATE_TRUNC('month', updated_at) = current_month),
        (SELECT COALESCE(SUM(s.price), 0)
         FROM user_subscriptions us
         JOIN subscriptions s ON us.subscription_id = s.id
         WHERE us.subscription_id = sub_record.id 
         AND us.status = 'active'
         AND DATE_TRUNC('month', us.created_at) = current_month)
      );
    ELSE
      -- Update existing record
      UPDATE subscription_analytics
      SET 
        new_subscriptions = (
          SELECT COUNT(*) FROM user_subscriptions 
          WHERE subscription_id = sub_record.id 
          AND DATE_TRUNC('month', created_at) = current_month
        ),
        cancellations = (
          SELECT COUNT(*) FROM user_subscriptions 
          WHERE subscription_id = sub_record.id 
          AND status = 'cancelled'
          AND DATE_TRUNC('month', updated_at) = current_month
        ),
        revenue = (
          SELECT COALESCE(SUM(s.price), 0)
          FROM user_subscriptions us
          JOIN subscriptions s ON us.subscription_id = s.id
          WHERE us.subscription_id = sub_record.id 
          AND us.status = 'active'
          AND DATE_TRUNC('month', us.created_at) = current_month
        ),
        updated_at = NOW()
      WHERE 
        subscription_id = sub_record.id 
        AND month = current_month;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update subscription analytics daily
CREATE OR REPLACE FUNCTION daily_subscription_analytics_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_subscription_analytics();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS daily_subscription_update ON user_subscriptions;

-- Create the trigger
CREATE TRIGGER daily_subscription_update
AFTER INSERT OR UPDATE OR DELETE ON user_subscriptions
FOR EACH STATEMENT
EXECUTE FUNCTION daily_subscription_analytics_update();

-- Function to get subscription growth over time
CREATE OR REPLACE FUNCTION get_subscription_growth(months_back INTEGER DEFAULT 6)
RETURNS TABLE (
  month DATE,
  subscription_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE_TRUNC('month', us.created_at)::DATE AS month,
    COUNT(us.id) AS subscription_count
  FROM 
    user_subscriptions us
  WHERE 
    us.created_at >= (CURRENT_DATE - (months_back || ' months')::INTERVAL)
  GROUP BY 
    DATE_TRUNC('month', us.created_at)
  ORDER BY 
    month;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate churn rate
CREATE OR REPLACE FUNCTION calculate_churn_rate(days_back INTEGER DEFAULT 30)
RETURNS DECIMAL AS $$
DECLARE
  active_count INTEGER;
  cancelled_count INTEGER;
  churn_rate DECIMAL;
BEGIN
  -- Get count of active subscriptions
  SELECT COUNT(*) INTO active_count
  FROM user_subscriptions
  WHERE status = 'active';
  
  -- Get count of cancelled subscriptions in the period
  SELECT COUNT(*) INTO cancelled_count
  FROM user_subscriptions
  WHERE 
    status = 'cancelled' AND 
    updated_at >= (CURRENT_DATE - (days_back || ' days')::INTERVAL);
  
  -- Calculate churn rate
  IF (active_count + cancelled_count) > 0 THEN
    churn_rate := (cancelled_count::DECIMAL / (active_count + cancelled_count)) * 100;
  ELSE
    churn_rate := 0;
  END IF;
  
  RETURN churn_rate;
END;
$$ LANGUAGE plpgsql;
