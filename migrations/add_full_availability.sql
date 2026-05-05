-- Add full_availability column to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS full_availability BOOLEAN DEFAULT false;

-- Add comment to explain the purpose of the column
COMMENT ON COLUMN subscriptions.full_availability IS 'When enabled, all courses related to this subscription are available until 10 days after subscription expiry. When disabled, only the previous two classes are available.';
