-- Add terms_accepted column to user_subscriptions table
ALTER TABLE user_subscriptions ADD COLUMN terms_accepted BOOLEAN DEFAULT TRUE;

-- Add terms_accepted column to payments table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payments') THEN
        ALTER TABLE payments ADD COLUMN terms_accepted BOOLEAN DEFAULT TRUE;
    END IF;
END
$$;
