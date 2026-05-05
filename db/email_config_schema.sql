-- Create email_config table if it doesn't exist
CREATE OR REPLACE FUNCTION create_email_config_table()
RETURNS void AS $$
BEGIN
  -- Check if the table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'email_config'
  ) THEN
    -- Create the table
    CREATE TABLE email_config (
      id SERIAL PRIMARY KEY,
      host VARCHAR(255) NOT NULL,
      port VARCHAR(10) NOT NULL,
      secure BOOLEAN DEFAULT false,
      user VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      admin_password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT create_email_config_table();
