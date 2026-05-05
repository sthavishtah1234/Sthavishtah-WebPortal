-- Influencer Links Table for tracking bookings from influencer referral links
-- Run this in Supabase SQL Editor

-- Table for storing influencer codes
CREATE TABLE IF NOT EXISTS influencer_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  influencer_name VARCHAR(255) NOT NULL,
  influencer_email VARCHAR(255),
  influencer_phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  booking_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Add influencer tracking column to ticket_bookings
ALTER TABLE ticket_bookings 
ADD COLUMN IF NOT EXISTS influencer_code VARCHAR(50);

-- Add referral code and discount columns to ticket_bookings
ALTER TABLE ticket_bookings 
ADD COLUMN IF NOT EXISTS referral_code_used VARCHAR(50);

ALTER TABLE ticket_bookings 
ADD COLUMN IF NOT EXISTS discount_applied DECIMAL(10, 2) DEFAULT 0;

ALTER TABLE ticket_bookings 
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2);

-- Add applies_to_tickets column to referral_codes
ALTER TABLE referral_codes 
ADD COLUMN IF NOT EXISTS applies_to_tickets BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_influencer_links_code ON influencer_links(code);
CREATE INDEX IF NOT EXISTS idx_ticket_bookings_influencer ON ticket_bookings(influencer_code);
CREATE INDEX IF NOT EXISTS idx_ticket_bookings_referral_used ON ticket_bookings(referral_code_used);
