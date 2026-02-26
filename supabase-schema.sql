-- ============================================================
-- ARTIFY: UNIFIED SUPABASE SQL (SINGLE FILE)
-- This file combines schema + RLS + triggers + auth helpers.
-- Run top-to-bottom in Supabase SQL Editor.
-- ============================================================

-- ============================================================
-- SECTION 1: EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- SECTION 2: CLEAN SLATE (DROP IN SAFE ORDER)
-- ============================================================
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.collaborations CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.managers CASCADE;
DROP TABLE IF EXISTS public.artists CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
DROP TRIGGER IF EXISTS set_updated_at_artists ON public.artists;
DROP TRIGGER IF EXISTS set_updated_at_managers ON public.managers;
DROP TRIGGER IF EXISTS set_updated_at_events ON public.events;
DROP TRIGGER IF EXISTS set_updated_at_bookings ON public.bookings;
DROP TRIGGER IF EXISTS set_updated_at_collaborations ON public.collaborations;
DROP TRIGGER IF EXISTS follows_after_insert ON public.follows;
DROP TRIGGER IF EXISTS follows_after_delete ON public.follows;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.increment_followers(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.decrement_followers(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_username_availability(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.adjust_followers_count() CASCADE;

-- ============================================================
-- SECTION 3: CORE TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('artist', 'manager')) NOT NULL,
  bio TEXT,
  location TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  is_verified BOOLEAN DEFAULT FALSE,
  followers_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.artists (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  stage_name TEXT NOT NULL,
  genres TEXT[] DEFAULT '{}',
  price_range TEXT,
  base_price NUMERIC,
  rating DECIMAL(3,2) DEFAULT 0,
  total_gigs INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  portfolio_images TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.managers (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  company_name TEXT,
  company_type TEXT,
  total_events INTEGER DEFAULT 0,
  upcoming_events INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organizer_id UUID REFERENCES public.managers(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT NOT NULL,
  venue_name TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  budget_min NUMERIC,
  budget_max NUMERIC,
  status TEXT CHECK (status IN ('draft', 'published', 'cancelled', 'completed')) DEFAULT 'draft',
  required_roles TEXT[] DEFAULT '{}',
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE NOT NULL,
  organizer_id UUID REFERENCES public.managers(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed')) DEFAULT 'pending',
  offer_amount NUMERIC NOT NULL,
  message TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.collaborations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  genre TEXT,
  location TEXT,
  is_remote BOOLEAN DEFAULT FALSE,
  collaboration_type TEXT CHECK (collaboration_type IN ('gig', 'collab', 'band_member', 'session')) NOT NULL,
  status TEXT CHECK (status IN ('open', 'closed', 'filled')) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT follows_no_self_follow CHECK (follower_id <> following_id)
);

-- ============================================================
-- SECTION 4: INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_artists_genres ON public.artists USING GIN(genres);
CREATE INDEX IF NOT EXISTS idx_artists_available ON public.artists(is_available);
CREATE INDEX IF NOT EXISTS idx_artists_stage_name ON public.artists(stage_name);
CREATE INDEX IF NOT EXISTS idx_managers_company ON public.managers(company_name);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_bookings_artist ON public.bookings(artist_id);
CREATE INDEX IF NOT EXISTS idx_bookings_organizer ON public.bookings(organizer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_event ON public.bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_creator ON public.collaborations(creator_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_status ON public.collaborations(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- ============================================================
-- SECTION 5: RLS + POLICIES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Artists are viewable by everyone"
  ON public.artists FOR SELECT
  USING (TRUE);

CREATE POLICY "Artists can insert own profile"
  ON public.artists FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Artists can update own profile"
  ON public.artists FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Managers are viewable by everyone"
  ON public.managers FOR SELECT
  USING (TRUE);

CREATE POLICY "Managers can insert own profile"
  ON public.managers FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Managers can update own profile"
  ON public.managers FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Published events are viewable by everyone"
  ON public.events FOR SELECT
  USING (status = 'published' OR organizer_id = auth.uid());

CREATE POLICY "Managers can insert own events"
  ON public.events FOR INSERT
  WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Managers can update own events"
  ON public.events FOR UPDATE
  USING (organizer_id = auth.uid());

CREATE POLICY "Managers can delete own events"
  ON public.events FOR DELETE
  USING (organizer_id = auth.uid());

CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (artist_id = auth.uid() OR organizer_id = auth.uid());

CREATE POLICY "Artists can insert bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (artist_id = auth.uid());

CREATE POLICY "Artists can update own bookings"
  ON public.bookings FOR UPDATE
  USING (artist_id = auth.uid());

CREATE POLICY "Organizers can update own bookings"
  ON public.bookings FOR UPDATE
  USING (organizer_id = auth.uid());

CREATE POLICY "Collaborations are viewable by everyone"
  ON public.collaborations FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can create collaborations"
  ON public.collaborations FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update own collaborations"
  ON public.collaborations FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "Users can delete own collaborations"
  ON public.collaborations FOR DELETE
  USING (creator_id = auth.uid());

CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Follows are viewable by everyone"
  ON public.follows FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can follow from own profile"
  ON public.follows FOR INSERT
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can unfollow from own profile"
  ON public.follows FOR DELETE
  USING (follower_id = auth.uid());

-- ============================================================
-- SECTION 6: FUNCTIONS + TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_username_availability(check_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE username = LOWER(check_username)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_full_name TEXT;
  base_username TEXT;
  candidate_username TEXT;
  suffix INTEGER := 0;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'artist');
  IF user_role NOT IN ('artist', 'manager') THEN
    user_role := 'artist';
  END IF;

  user_full_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    split_part(NEW.email, '@', 1)
  );

  base_username := LOWER(COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    split_part(NEW.email, '@', 1)
  ));

  base_username := REGEXP_REPLACE(base_username, '[^a-z0-9_]', '_', 'g');
  base_username := REGEXP_REPLACE(base_username, '_+', '_', 'g');
  base_username := TRIM(BOTH '_' FROM base_username);

  IF base_username IS NULL OR base_username = '' THEN
    base_username := 'user';
  END IF;

  candidate_username := base_username;
  WHILE EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE username = candidate_username
  ) LOOP
    suffix := suffix + 1;
    candidate_username := base_username || '_' || suffix::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, email, role, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    user_role,
    user_full_name,
    candidate_username
  );

  IF user_role = 'artist' THEN
    INSERT INTO public.artists (id, stage_name)
    VALUES (NEW.id, COALESCE(NULLIF(user_full_name, ''), 'New Artist'));
  ELSE
    INSERT INTO public.managers (id, company_name)
    VALUES (NEW.id, COALESCE(NULLIF(user_full_name, ''), 'New Manager'));
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for user % (%): %', NEW.id, NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_artists ON public.artists;
CREATE TRIGGER set_updated_at_artists
  BEFORE UPDATE ON public.artists
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_managers ON public.managers;
CREATE TRIGGER set_updated_at_managers
  BEFORE UPDATE ON public.managers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_events ON public.events;
CREATE TRIGGER set_updated_at_events
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_bookings ON public.bookings;
CREATE TRIGGER set_updated_at_bookings
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_collaborations ON public.collaborations;
CREATE TRIGGER set_updated_at_collaborations
  BEFORE UPDATE ON public.collaborations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.increment_followers(profile_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET followers_count = followers_count + 1
  WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_followers(profile_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET followers_count = GREATEST(0, followers_count - 1)
  WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.adjust_followers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET followers_count = followers_count + 1
    WHERE id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET followers_count = GREATEST(0, followers_count - 1)
    WHERE id = OLD.following_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS follows_after_insert ON public.follows;
CREATE TRIGGER follows_after_insert
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.adjust_followers_count();

DROP TRIGGER IF EXISTS follows_after_delete ON public.follows;
CREATE TRIGGER follows_after_delete
  AFTER DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.adjust_followers_count();

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

-- ============================================================
-- SECTION 9: STORAGE BUCKET NOTES
-- ============================================================
-- Create buckets manually or run these statements separately:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('avatars', 'avatars', true), ('portfolio', 'portfolio', true), ('event-images', 'event-images', true);

-- Example storage policies for avatars:
-- CREATE POLICY "Avatar images are publicly accessible"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'avatars');

-- CREATE POLICY "Users can upload own avatar"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can update own avatar"
--   ON storage.objects FOR UPDATE
--   USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

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
