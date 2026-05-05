-- Drop existing tables first
DROP TABLE IF EXISTS plan_comparison_values CASCADE;
DROP TABLE IF EXISTS plan_comparison_features CASCADE;

-- Recreate with correct UUID types
CREATE TABLE plan_comparison_features (
  id SERIAL PRIMARY KEY,
  subscription_page_id UUID NOT NULL,
  feature_name VARCHAR(255) NOT NULL,
  feature_description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE plan_comparison_values (
  id SERIAL PRIMARY KEY,
  feature_id INTEGER NOT NULL REFERENCES plan_comparison_features(id) ON DELETE CASCADE,
  subscription_plan_id UUID NOT NULL,
  is_included BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feature_id, subscription_plan_id)
);

-- Create indexes
CREATE INDEX idx_comparison_features_page ON plan_comparison_features(subscription_page_id);
CREATE INDEX idx_comparison_features_order ON plan_comparison_features(display_order);
CREATE INDEX idx_comparison_values_feature ON plan_comparison_values(feature_id);
CREATE INDEX idx_comparison_values_plan ON plan_comparison_values(subscription_plan_id);
