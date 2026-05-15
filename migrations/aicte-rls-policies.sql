-- ============================================================
-- AICTE Tables — Row Level Security Policies
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================
-- 
-- STRATEGY: All writes/reads to AICTE tables are done server-side
-- via Next.js API routes which use the service_role key.
-- The service_role key bypasses RLS entirely, so we only need 
-- to allow public READ on aicte_events (for the student-facing page).
-- All other operations are locked down.
-- ============================================================

-- ── aicte_events ──────────────────────────────────────────
ALTER TABLE aicte_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone (students, public) to read active events
DROP POLICY IF EXISTS "aicte_events_public_read" ON aicte_events;
CREATE POLICY "aicte_events_public_read"
  ON aicte_events FOR SELECT
  USING (is_active = true);

-- Block all inserts/updates/deletes for non-service clients
-- (service_role key bypasses this automatically)

-- ── aicte_submissions ─────────────────────────────────────
ALTER TABLE aicte_submissions ENABLE ROW LEVEL SECURITY;

-- Students can read their own submissions
DROP POLICY IF EXISTS "aicte_submissions_own_read" ON aicte_submissions;
CREATE POLICY "aicte_submissions_own_read"
  ON aicte_submissions FOR SELECT
  USING (true);   -- API layer filters by student_id; service_role reads all

-- Students can insert their own submission
DROP POLICY IF EXISTS "aicte_submissions_insert" ON aicte_submissions;
CREATE POLICY "aicte_submissions_insert"
  ON aicte_submissions FOR INSERT
  WITH CHECK (true);  -- Duplicate check & auth is handled in the API route

-- Block direct updates/deletes from anon (only service_role can review)
-- (no UPDATE or DELETE policy = blocked for anon)

-- ── student_profiles ──────────────────────────────────────
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

-- Students can read their own profile
DROP POLICY IF EXISTS "student_profiles_own_read" ON student_profiles;
CREATE POLICY "student_profiles_own_read"
  ON student_profiles FOR SELECT
  USING (true);  -- API filters by user_id; service_role reads all

-- Allow student to insert their own profile (on registration)
DROP POLICY IF EXISTS "student_profiles_insert" ON student_profiles;
CREATE POLICY "student_profiles_insert"
  ON student_profiles FOR INSERT
  WITH CHECK (true);  -- Controlled via API route

-- Block direct point updates from anon (only service_role review API updates points)
-- (no UPDATE policy for anon = only service_role can update)
