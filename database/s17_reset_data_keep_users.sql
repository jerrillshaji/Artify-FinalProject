-- ============================================================
-- SECTION 17: RESET APP DATA (KEEP USERS)
-- ============================================================
-- This script removes data from all public app tables while preserving
-- user accounts and user profile records.
--
-- Preserved tables:
--   - auth.users (not in public schema)
--   - public.profiles
--   - public.users (if present)
--   - public.artists
--   - public.managers
--
-- Safe to run multiple times.

BEGIN;

DO $$
DECLARE
  tables_to_truncate TEXT;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ' ORDER BY tablename)
  INTO tables_to_truncate
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT IN ('profiles', 'users', 'artists', 'managers');

  IF tables_to_truncate IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || tables_to_truncate || ' RESTART IDENTITY CASCADE';
  END IF;
END $$;

COMMIT;
