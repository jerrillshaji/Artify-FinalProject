-- ============================================================
-- SECTION 7: SIGNUP / AUTH DIAGNOSTICS & REPAIR QUERIES
-- (Safe helper queries for debugging auth + trigger issues)
-- ============================================================

-- Check signup trigger is attached to auth.users
SELECT
  c.relname AS table_name,
  t.tgname AS trigger_name,
  t.tgenabled
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'auth'
  AND c.relname = 'users'
  AND t.tgname = 'on_auth_user_created';

-- Check required columns in profiles table
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Verify signup functions exist
SELECT proname
FROM pg_proc
WHERE proname IN ('handle_new_user', 'check_username_availability')
ORDER BY proname;
