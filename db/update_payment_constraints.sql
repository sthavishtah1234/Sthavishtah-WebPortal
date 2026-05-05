-- Add this migration to allow NULL values in subscription_id column of payments table
-- This will help when deleting subscriptions

DO $$
BEGIN
  -- Check if the column exists and is NOT NULL
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'payments' 
    AND column_name = 'subscription_id'
    AND is_nullable = 'NO'
  ) THEN
    -- Alter the column to allow NULL values
    ALTER TABLE payments ALTER COLUMN subscription_id DROP NOT NULL;
  END IF;
END $$;
