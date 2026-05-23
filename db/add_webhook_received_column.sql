-- Add missing webhook_received column to payments table
-- This column is used by the payment-webhook handler to track webhook delivery
ALTER TABLE payments ADD COLUMN IF NOT EXISTS webhook_received BOOLEAN DEFAULT FALSE;

-- Create index for faster queries filtering by webhook status
CREATE INDEX IF NOT EXISTS idx_payments_webhook_received ON payments(webhook_received);
