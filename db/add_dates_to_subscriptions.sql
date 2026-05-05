-- Add start_date and end_date columns to subscriptions table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'start_date') THEN
        ALTER TABLE subscriptions ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'end_date') THEN
        ALTER TABLE subscriptions ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Update existing subscriptions with default values
    UPDATE subscriptions 
    SET 
        start_date = COALESCE(start_date, NOW()),
        end_date = COALESCE(end_date, NOW() + (duration_days || ' days')::INTERVAL)
    WHERE 
        start_date IS NULL OR end_date IS NULL;
END $$;
