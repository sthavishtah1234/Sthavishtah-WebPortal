-- Create plan comparison features table
CREATE TABLE IF NOT EXISTS plan_comparison_features (
  id SERIAL PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES subscription_pages(id) ON DELETE CASCADE,
  feature_name VARCHAR(255) NOT NULL,
  feature_description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create plan comparison values table (which plans include which features)
CREATE TABLE IF NOT EXISTS plan_comparison_values (
  id SERIAL PRIMARY KEY,
  feature_id INTEGER NOT NULL REFERENCES plan_comparison_features(id) ON DELETE CASCADE,
  subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  is_included BOOLEAN DEFAULT false,
  custom_value VARCHAR(255), -- Optional: for custom values like "Unlimited" instead of just checkmark
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comparison_features_page ON plan_comparison_features(page_id);
CREATE INDEX IF NOT EXISTS idx_comparison_values_feature ON plan_comparison_values(feature_id);
CREATE INDEX IF NOT EXISTS idx_comparison_values_subscription ON plan_comparison_values(subscription_id);

-- Add unique constraint to prevent duplicate feature-subscription combinations
ALTER TABLE plan_comparison_values 
ADD CONSTRAINT unique_feature_subscription 
UNIQUE (feature_id, subscription_id);
