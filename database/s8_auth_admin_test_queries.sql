-- ============================================================
-- SECTION 8: AUTH ADMIN/TEST QUERIES
-- ============================================================

-- View users and confirmation status
SELECT
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at,
  raw_user_meta_data->>'role' AS role,
  raw_user_meta_data->>'username' AS username
FROM auth.users
ORDER BY created_at DESC;

-- View pending email confirmations
SELECT
  id,
  email,
  raw_user_meta_data->>'full_name' AS full_name,
  raw_user_meta_data->>'username' AS username,
  raw_user_meta_data->>'role' AS role,
  created_at,
  NOW() - created_at AS time_since_signup
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- Manual confirm example:
-- UPDATE auth.users
-- SET email_confirmed_at = NOW(), confirmed_at = NOW()
-- WHERE email = 'your-email@example.com';

-- Delete old unconfirmed users example:
-- DELETE FROM auth.users
-- WHERE email_confirmed_at IS NULL
--   AND created_at < NOW() - INTERVAL '1 hour';
