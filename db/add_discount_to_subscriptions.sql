-- Add discount columns to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS has_discount BOOLEAN DEFAULT false;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2) DEFAULT NULL;

-- Create an API route to run this migration
