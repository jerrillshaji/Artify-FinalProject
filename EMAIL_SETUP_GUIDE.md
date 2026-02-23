# Supabase Email Configuration Guide

## Quick Fix: Enable Email in Supabase Dashboard

### Step 1: Go to Auth Settings
1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your Artify project
3. Go to **Authentication** → **Providers**

### Step 2: Enable Email Provider
1. Click on **Email** provider
2. Toggle **"Enable Email Signup"** to ON
3. Toggle **"Confirm email"** to ON
4. Click **Save**

### Step 3: Configure SMTP (For Real Emails)

#### Option A: Use Supabase Default (Emails may go to spam)
- No configuration needed
- Emails sent from `no-reply@your-project-id.supabase.co`
- Check spam folder!

#### Option B: Configure Gmail (For Testing)
1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Click **"Configure SMTP"**
3. Enter:
   ```
   Sender email: your-email@gmail.com
   Sender name: Artify
   Host: smtp.gmail.com
   Port number: 587
   Username: your-email@gmail.com
   Password: [Gmail App Password]
   ```

**To get Gmail App Password:**
1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Go to App Passwords
4. Create app password for "Mail"
5. Use this password (not your regular Gmail password)

#### Option C: Use SendGrid (Recommended for Production)
1. Sign up at [sendgrid.com](https://sendgrid.com) - Free for 100 emails/day
2. Create API Key in SendGrid dashboard
3. In Supabase:
   ```
   Sender email: verified-sender@yourdomain.com
   Sender name: Artify
   Host: smtp.sendgrid.net
   Port number: 587
   Username: apikey
   Password: [your-sendgrid-api-key]
   ```

### Step 4: Configure Redirect URLs
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:5173` (for development)
3. Add **Redirect URLs**:
   - `http://localhost:5173/auth/callback`
   - `http://localhost:5173/feed`
4. Click **Save**

### Step 5: Test Registration
1. Go to your app: `http://localhost:5173/register`
2. Create a test account
3. Check email (including spam folder)
4. Click confirmation link
5. Should redirect to `/feed`

---

## Alternative: Disable Email Confirmation (Development Only)

If you don't want to deal with emails during development:

### Via Supabase Dashboard:
1. Go to **Authentication** → **Providers**
2. Click **Email**
3. Toggle **"Confirm email"** to OFF
4. Click **Save**

Now users will be logged in immediately after registration without email confirmation.

⚠️ **Warning:** Only disable email confirmation for development. Always enable it for production!

---

## Troubleshooting

### Email Not Received?

1. **Check Spam/Junk Folder**
   - Supabase emails often go to spam

2. **Wait 1-2 Minutes**
   - Email delivery can be delayed

3. **Check Supabase Logs**
   - Go to **Authentication** → **Users**
   - Check if user was created
   - Check **Logs** section for email delivery status

4. **Manually Confirm User** (for testing):
   ```sql
   -- Run in Supabase SQL Editor
   UPDATE auth.users 
   SET email_confirmed_at = NOW(), 
       confirmed_at = NOW() 
   WHERE email = 'your-test-email@example.com';
   ```

5. **Resend Confirmation Email**:
   - Go to **Authentication** → **Users**
   - Find your user
   - Click three dots (⋮) → **"Resend confirmation email"**

### Still Not Working?

1. **Check SMTP Configuration**:
   - Go to **Project Settings** → **Auth**
   - Scroll to **SMTP Settings**
   - Verify all fields are filled correctly

2. **Test SMTP Connection**:
   - Some providers require verifying your domain first
   - Check your email provider's dashboard

3. **Try Different Email Provider**:
   - Gmail sometimes blocks automated emails
   - Try SendGrid, Mailgun, or Resend

---

## Recommended Email Providers

| Provider | Free Tier | Setup Difficulty | Deliverability |
|----------|-----------|------------------|----------------|
| **SendGrid** | 100 emails/day | Easy | Excellent |
| **Mailgun** | 5000 emails/month (first month) | Medium | Excellent |
| **Resend** | 3000 emails/month | Easy | Excellent |
| **Gmail SMTP** | Unlimited (with limits) | Easy | Poor (often spam) |
| **Supabase Default** | Unlimited | None | Poor (often spam) |

**Recommendation:** Use **SendGrid** for production. It's reliable and has a generous free tier.

---

## Quick Test Commands

### Check if user was created:
```sql
SELECT email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
```

### Manually confirm latest user:
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmed_at = NOW() 
WHERE id = (
  SELECT id FROM auth.users 
  ORDER BY created_at DESC 
  LIMIT 1
);
```

### Delete unconfirmed users older than 1 hour:
```sql
DELETE FROM auth.users 
WHERE email_confirmed_at IS NULL 
AND created_at < NOW() - INTERVAL '1 hour';
```
