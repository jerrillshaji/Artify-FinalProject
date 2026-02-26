# Artify Database Setup Guide

## Overview

This guide will help you set up the Supabase database for the Artify application with proper normalization and automatic user profile creation.

## Database Structure

### Core Tables (Required)

| Table | Purpose | Created On |
|-------|---------|------------|
| `profiles` | Core user data (email, name, role, bio, etc.) | User signup |
| `artists` | Artist-specific data (stage_name, genres, portfolio, etc.) | User signup (if role=artist) |
| `managers` | Manager-specific data (company_name, events count, etc.) | User signup (if role=manager) |

### Feature Tables (Optional - Future Use)

| Table | Purpose |
|-------|---------|
| `events` | Event listings by managers |
| `bookings` | Booking requests between artists and managers |
| `collaborations` | Jam session/collaboration requests |
| `messages` | Direct messages between users |

### Removed Tables (Not Needed)

- `posts` - Use external social media or implement later
- `likes` - Merged into profiles.followers_count
- `notifications` - Can be implemented later if needed

## Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in/Create account
3. Create new project named "Artify"
4. Set strong database password (save it securely)
5. Wait for project to initialize

### 2. Run Database Schema

1. In Supabase Dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy entire contents of `supabase-schema.sql`
4. Paste into SQL Editor
5. Click **Run** (or Ctrl+Enter)
6. Verify all tables created successfully

### 3. Create Storage Buckets

1. Go to **Storage** in Supabase Dashboard
2. Click **New Bucket**
3. Create these buckets:

| Bucket Name | Public | Purpose |
|-------------|--------|---------|
| `avatars` | ✓ Yes | User profile pictures |
| `portfolio` | ✓ Yes | Artist portfolio images |
| `event-images` | ✓ Yes | Event promotional images |

Or run this SQL:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('avatars', 'avatars', true),
  ('portfolio', 'portfolio', true),
  ('event-images', 'event-images', true);
```

### 4. Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. (Optional) Enable OAuth providers (Google, GitHub, etc.)
4. Go to **Authentication** → **URL Configuration**
5. Set **Site URL**: `http://localhost:5173` (development) or your production URL
6. Add **Redirect URLs**:
   - `http://localhost:5173/auth/callback`
   - `http://localhost:5173/feed`

### 5. Get API Credentials

1. Go to **Project Settings** (gear icon)
2. Navigate to **API**
3. Copy these values:
   - **Project URL**
   - **anon/public key**

### 6. Configure Environment Variables

1. Open `.env` file in project root
2. Replace placeholder values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 7. Test User Registration

1. Run the app: `npm run dev`
2. Go to `/register`
3. Fill in:
   - Full Name
   - Email
   - Password
   - Select role (Artist or Manager)
4. Click "Create Account"
5. Check Supabase Dashboard → **Authentication** → **Users**
6. Verify user was created
7. Check **Table Editor** → `profiles`, `artists`/`managers` tables
8. Verify data was inserted correctly

## How User Registration Works

### Automatic Profile Creation (Trigger)

When a user signs up, the `handle_new_user()` trigger automatically:

1. **Creates auth user** in Supabase Auth
2. **Inserts into `profiles`** table with:
   - `id` (from auth.users)
   - `email`
   - `role` (artist/manager from metadata)
   - `full_name` (from metadata)

3. **Inserts into role-specific table**:
   - If `artist`: Creates record in `artists` with `stage_name`
   - If `manager`: Creates record in `managers` with `company_name`

### Registration Data Flow

```
Register Component
    ↓
signUp(email, password, { full_name, role })
    ↓
Supabase Auth (creates user)
    ↓
Trigger: handle_new_user()
    ↓
┌─────────────────────────────┐
│ profiles (id, email, role)  │
│ artists OR managers         │
└─────────────────────────────┘
```

## Database Schema Details

### Profiles Table
```sql
profiles (
  id              UUID  -- Same as auth.users.id
  email           TEXT  -- Unique, required
  full_name       TEXT  -- User's real name
  avatar_url      TEXT  -- URL to profile picture
  role            TEXT  -- 'artist' or 'manager'
  bio             TEXT  -- About section
  location        TEXT  -- City, Country
  website         TEXT  -- Personal website
  social_links    JSONB -- { instagram, twitter, etc }
  is_verified     BOOLEAN -- Verification badge
  followers_count INTEGER -- Number of followers
  created_at      TIMESTAMP
  updated_at      TIMESTAMP
)
```

### Artists Table
```sql
artists (
  id               UUID  -- References profiles.id
  stage_name       TEXT  -- Performance name
  genres           TEXT[] -- Array of genres
  price_range      TEXT  -- e.g., "$500-$1000"
  base_price       NUMERIC -- Starting price
  rating           DECIMAL -- Average rating (0-5)
  total_gigs       INTEGER -- Completed gigs
  tags             TEXT[] -- Skills/tags
  portfolio_images TEXT[] -- Image URLs
  videos           TEXT[] -- Video URLs
  is_available     BOOLEAN -- Available for booking
  created_at       TIMESTAMP
  updated_at       TIMESTAMP
)
```

### Managers Table
```sql
managers (
  id              UUID  -- References profiles.id
  company_name    TEXT  -- Company/organization name
  company_type    TEXT  -- e.g., "Event Planning", "Corporate"
  total_events    INTEGER -- Total events organized
  upcoming_events INTEGER -- Scheduled events
  created_at      TIMESTAMP
  updated_at      TIMESTAMP
)
```

## Normalization Applied

1. **First Normal Form (1NF)**: All columns contain atomic values
   - Arrays used for multi-value fields (genres, tags, images)

2. **Second Normal Form (2NF)**: All non-key attributes depend on entire primary key
   - Separate tables for artists/managers specific data

3. **Third Normal Form (3NF)**: No transitive dependencies
   - User auth in `auth.users`
   - Profile data in `profiles`
   - Role-specific data in `artists`/`managers`

## Security (RLS Policies)

Row Level Security ensures:
- Profiles are publicly readable
- Users can only update their own profile
- Artists/Managers can only update their own records
- Messages are only visible to sender/receiver
- Events visible when published or owned by user

## Common Issues & Solutions

### Issue: Trigger not creating artist/manager record
**Solution**: Check trigger exists:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Issue: `Database error saving new user` during signup
**Solution**: Re-run the single consolidated `supabase-schema.sql` file in SQL Editor.

It already includes trigger-repair logic, diagnostics, and auth helper queries in clearly separated comment sections.

### Issue: RLS blocking reads
**Solution**: Verify policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### Issue: User data not matching
**Solution**: Check metadata is passed correctly in signUp:
```javascript
await signUp(email, password, {
  full_name: 'John Doe',
  role: 'artist'
});
```

## Testing the Database

### Check if trigger works:
```sql
-- Should show 1 row per user
SELECT p.id, p.email, p.role, a.stage_name, m.company_name
FROM profiles p
LEFT JOIN artists a ON p.id = a.id
LEFT JOIN managers m ON p.id = m.id;
```

### Check RLS is enabled:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

## Next Steps

1. Complete database setup following this guide
2. Test user registration flow
3. Implement profile editing
4. Add image upload functionality
5. Build out events and bookings features
