-- Add country column to users table
ALTER TABLE users ADD COLUMN country VARCHAR(100);

-- Update existing records to have a default value (optional)
UPDATE users SET country = 'India' WHERE country IS NULL;

-- Add index for faster queries on country
CREATE INDEX idx_users_country ON users(country);
