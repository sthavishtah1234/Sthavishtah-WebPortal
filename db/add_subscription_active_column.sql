-- Add is_active column to subscriptions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE subscriptions ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Update existing subscriptions to be active by default
UPDATE subscriptions SET is_active = TRUE WHERE is_active IS NULL;
