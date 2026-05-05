-- Create documents table with subscription support
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  is_visible BOOLEAN DEFAULT TRUE,
  subscription_id INTEGER REFERENCES subscriptions(id) NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_is_active ON documents(is_active);
CREATE INDEX IF NOT EXISTS idx_documents_subscription_id ON documents(subscription_id);

-- Create user_documents table for individual document access
CREATE TABLE IF NOT EXISTS user_documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  user_id INTEGER REFERENCES users(id) NOT NULL
);

-- Add index for user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);

-- Create a function to check if a user has access to a document
CREATE OR REPLACE FUNCTION user_has_document_access(p_user_id INTEGER, p_document_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription_id INTEGER;
  v_user_subscription_id INTEGER;
BEGIN
  -- Get the document's subscription_id
  SELECT subscription_id INTO v_subscription_id
  FROM documents
  WHERE id = p_document_id AND is_active = TRUE;
  
  -- If document has no subscription requirement (null), everyone has access
  IF v_subscription_id IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has the required subscription
  SELECT subscription_id INTO v_user_subscription_id
  FROM user_subscriptions
  WHERE user_id = p_user_id AND is_active = TRUE;
  
  -- Return true if user has the required subscription
  RETURN v_user_subscription_id = v_subscription_id;
END;
$$ LANGUAGE plpgsql;
