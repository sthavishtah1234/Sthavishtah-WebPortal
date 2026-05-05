-- ============================================
-- Sthavishtah AICTE Points System Migration
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Add 'role' column to users table (preserves existing users as 'user')
ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- 2. Create student_profiles table
CREATE TABLE IF NOT EXISTS student_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id bigint REFERENCES users(id) ON DELETE CASCADE,
  college_name text,
  usn_number text,
  aicte_points integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. Create AICTE events table (separate from ticket events)
CREATE TABLE IF NOT EXISTS aicte_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date date NOT NULL,
  day_of_week text NOT NULL,
  location text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);

-- 4. Create AICTE photo submissions table
CREATE TABLE IF NOT EXISTS aicte_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id bigint REFERENCES users(id) ON DELETE CASCADE,
  event_id uuid REFERENCES aicte_events(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ai_score float,
  admin_note text,
  submitted_at timestamp DEFAULT now(),
  reviewed_at timestamp,
  UNIQUE(student_id, event_id)
);

-- 5. Create Supabase Storage bucket for AICTE photos
-- NOTE: Run this via Supabase Dashboard > Storage > New Bucket
-- Bucket name: aicte-photos
-- Public: Yes (so photos can be viewed)
-- File size limit: 2MB

-- 6. Optional: Create some sample events for testing
-- INSERT INTO aicte_events (name, date, day_of_week, location) VALUES
--   ('International Yoga Day', '2026-06-21', 'Sunday', 'Main Auditorium'),
--   ('Morning Wellness Workshop', '2026-05-15', 'Friday', 'Community Hall'),
--   ('Pranayama Session', '2026-05-20', 'Wednesday', 'Yoga Studio');
