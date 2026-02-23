-- =============================================
-- SUPABASE AUTH CONFIGURATION
-- Run this in Supabase SQL Editor to configure auth
-- =============================================

-- Note: Email configuration must be done via Supabase Dashboard
-- This file contains helper queries and instructions

-- =============================================
-- CHECK CURRENT AUTH CONFIGURATION
-- =============================================

-- View current users and their email confirmation status
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'username' as username
FROM auth.users
ORDER BY created_at DESC;

-- =============================================
-- MANUALLY CONFIRM A USER (FOR TESTING)
-- =============================================

-- To manually confirm a user's email (replace with actual email):
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW(), 
--     confirmed_at = NOW() 
-- WHERE email = 'your-email@example.com';

-- =============================================
-- DELETE UNCONFIRMED USERS (FOR TESTING)
-- =============================================

-- Delete users who haven't confirmed their email (older than 1 hour):
-- DELETE FROM auth.users 
-- WHERE email_confirmed_at IS NULL 
-- AND created_at < NOW() - INTERVAL '1 hour';

-- =============================================
-- SMTP CONFIGURATION INSTRUCTIONS
-- =============================================

/*
To enable real email sending in Supabase:

1. Go to Supabase Dashboard → Project Settings → Auth

2. Scroll to "SMTP Settings" section

3. Configure with your email provider:

   FOR GMAIL (not recommended for production):
   - Sender email: your-email@gmail.com
   - Sender name: Artify
   - Host: smtp.gmail.com
   - Port: 587
   - Username: your-email@gmail.com
   - Password: your-app-password (not regular password)
   
   FOR SENDGRID (recommended):
   - Sign up at https://sendgrid.com
   - Create API key
   - Use SMTP relay:
     - Host: smtp.sendgrid.net
     - Port: 587
     - Username: apikey
     - Password: your-sendgrid-api-key

   FOR MAILGUN:
   - Host: smtp.mailgun.org
   - Port: 587
   - Username: postmaster@your-domain.mailgun.org
   - Password: your-mailgun-password

4. Click "Save"

5. Test by registering a new account
*/

-- =============================================
-- ENABLE EMAIL CONFIRMATION
-- =============================================

/*
In Supabase Dashboard:

1. Go to Authentication → Providers

2. Click on "Email" provider

3. Ensure "Enable Email Signup" is toggled ON

4. Set "Confirm email" to ON (required)

5. Set "Secure email change" to ON (recommended)

6. Under "Email Templates", customize:
   - Confirmation email subject: "Confirm your email for Artify"
   - Add your logo and branding
*/

-- =============================================
-- CONFIGURE SITE URL AND REDIRECTS
-- =============================================

/*
In Supabase Dashboard → Authentication → URL Configuration:

1. Site URL: https://your-domain.com (or http://localhost:5173 for dev)

2. Add these to "Redirect URLs":
   - http://localhost:5173/auth/callback
   - http://localhost:5173/feed
   - https://your-domain.com/auth/callback
   - https://your-domain.com/feed

3. Click "Save"
*/

-- =============================================
-- TEST EMAIL DELIVERY
-- =============================================

/*
After configuring SMTP, test by:

1. Go to Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter test email and password
4. Check if email is received

Or:

1. Go to your app's register page
2. Create a new account
3. Check email (including spam folder)
*/

-- =============================================
-- HELPER: VIEW PENDING CONFIRMATIONS
-- =============================================

-- Show users who haven't confirmed their email
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'username' as username,
  raw_user_meta_data->>'role' as role,
  created_at,
  NOW() - created_at as time_since_signup
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- =============================================
-- HELPER: RESEND CONFIRMATION EMAIL
-- =============================================

/*
To resend confirmation email via SQL:

You cannot directly resend from SQL, but you can:

1. Go to Authentication → Users in dashboard
2. Find the user
3. Click the three dots (⋮)
4. Select "Resend confirmation email"

Or use Supabase API:
*/

-- Example API call (run from your app's console):
/*
const { data, error } = await supabase.auth.resend({
  type: 'signup',
  email: 'user@example.com'
});
*/
