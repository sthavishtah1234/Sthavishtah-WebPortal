-- ============================================================
-- AICTE Points Column Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add 'points' column to aicte_events (default 1 point per event)
ALTER TABLE aicte_events ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 1;

-- 2. Ensure student_profiles table has aicte_points column
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS aicte_points integer NOT NULL DEFAULT 0;

-- 3. (Optional) Recalculate existing approved points retroactively
-- UPDATE student_profiles sp
-- SET aicte_points = (
--   SELECT COALESCE(SUM(ae.points), 0)
--   FROM aicte_submissions s
--   JOIN aicte_events ae ON ae.id = s.event_id
--   WHERE s.student_id = sp.user_id AND s.status = 'approved'
-- );
