-- Add features column to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_features ON subscriptions USING GIN (features);
