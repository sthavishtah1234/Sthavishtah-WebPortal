-- ============================================
-- PLAN COMPARISON SCHEMA (FINAL CORRECTED VERSION)
-- Drop existing tables and recreate with correct types
-- subscription_page_id = UUID (pages use UUID)
-- subscription_plan_id = INTEGER (plans use INTEGER)
-- ============================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS plan_comparison_values CASCADE;
DROP TABLE IF EXISTS plan_comparison_features CASCADE;

-- Create plan comparison features table
CREATE TABLE plan_comparison_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_page_id UUID NOT NULL,
  feature_name VARCHAR(255) NOT NULL,
  feature_description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create plan comparison values table (which plans include which features)
-- Changed subscription_plan_id from UUID to INTEGER to match subscriptions table
CREATE TABLE plan_comparison_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES plan_comparison_features(id) ON DELETE CASCADE,
  subscription_plan_id INTEGER NOT NULL,
  is_included BOOLEAN DEFAULT false,
  custom_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feature_id, subscription_plan_id)
);

-- Create indexes for better performance
CREATE INDEX idx_comparison_features_page ON plan_comparison_features(subscription_page_id);
CREATE INDEX idx_comparison_features_order ON plan_comparison_features(display_order);
CREATE INDEX idx_comparison_values_feature ON plan_comparison_values(feature_id);
CREATE INDEX idx_comparison_values_plan ON plan_comparison_values(subscription_plan_id);
