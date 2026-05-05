-- Create subscription batches table
CREATE TABLE IF NOT EXISTS subscription_batches (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  batch_name VARCHAR(255) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  max_seats INTEGER,
  seats_taken INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add batch_id to user_subscriptions table
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS batch_id INTEGER REFERENCES subscription_batches(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_batches_subscription_id ON subscription_batches(subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_batch_id ON user_subscriptions(batch_id);
