-- ============================================================
-- SECTION 10: DASHBOARD CHECKLIST (REFERENCE)
-- ============================================================
/*
Authentication dashboard settings:
1) Authentication -> Providers -> Email
   - Enable Email Signup = ON
   - Confirm email = ON
2) Authentication -> URL Configuration
   - Site URL: http://localhost:5173 (dev)
   - Redirect URLs:
     - http://localhost:5173/auth/callback
     - http://localhost:5173/feed
3) Project Settings -> Auth -> SMTP
   - Configure SMTP provider (SendGrid/Mailgun/etc.) for real email delivery
*/
