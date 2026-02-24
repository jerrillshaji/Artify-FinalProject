-- Artify Supabase Database Schema (Optimized)
-- Run this in your Supabase SQL Editor to set up the database

-- =============================================
-- ENABLE REQUIRED EXTENSIONS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- =============================================
-- DROP EXISTING TABLES (Clean Slate)
-- =============================================
-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS collaborations CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS managers CASCADE;
DROP TABLE IF EXISTS artists CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS set_updated_at_profiles ON profiles;
DROP TRIGGER IF EXISTS set_updated_at_artists ON artists;
DROP TRIGGER IF EXISTS set_updated_at_managers ON managers;
DROP TRIGGER IF EXISTS set_updated_at_events ON events;
DROP TRIGGER IF EXISTS set_updated_at_bookings ON bookings;
DROP TRIGGER IF EXISTS set_updated_at_collaborations ON collaborations;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.increment_followers(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.decrement_followers(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_username_availability(TEXT) CASCADE;

-- =============================================
-- PROFILES TABLE
-- Core user profile information (normalized)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,  -- Unique username like @artist123
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('artist', 'manager')) NOT NULL,
  bio TEXT,
  location TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}',
  is_verified BOOLEAN DEFAULT FALSE,
  followers_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast username searches
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- =============================================
-- ARTISTS TABLE
-- Extended artist-specific information
-- =============================================
CREATE TABLE IF NOT EXISTS artists (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
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

-- =============================================
-- MANAGERS TABLE
-- Extended manager/organizer information
-- =============================================
CREATE TABLE IF NOT EXISTS managers (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  company_name TEXT,
  company_type TEXT,
  total_events INTEGER DEFAULT 0,
  upcoming_events INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EVENTS TABLE
-- Stores event listings
-- =============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organizer_id UUID REFERENCES managers(id) ON DELETE CASCADE NOT NULL,
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

-- =============================================
-- BOOKINGS TABLE
-- Stores booking requests between artists and managers
-- =============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  organizer_id UUID REFERENCES managers(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed')) DEFAULT 'pending',
  offer_amount NUMERIC NOT NULL,
  message TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- COLLABORATIONS TABLE
-- Stores collaboration/jam session requests
-- =============================================
CREATE TABLE IF NOT EXISTS collaborations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
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

-- =============================================
-- MESSAGES TABLE
-- Stores chat messages (simplified)
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_artists_genres ON artists USING GIN(genres);
CREATE INDEX IF NOT EXISTS idx_artists_available ON artists(is_available);
CREATE INDEX IF NOT EXISTS idx_artists_stage_name ON artists(stage_name);
CREATE INDEX IF NOT EXISTS idx_managers_company ON managers(company_name);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_bookings_artist ON bookings(artist_id);
CREATE INDEX IF NOT EXISTS idx_bookings_organizer ON bookings(organizer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_event ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_creator ON collaborations(creator_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_status ON collaborations(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Artists policies
CREATE POLICY "Artists are viewable by everyone"
  ON artists FOR SELECT
  USING (TRUE);

CREATE POLICY "Artists can insert own profile"
  ON artists FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Artists can update own profile"
  ON artists FOR UPDATE
  USING (auth.uid() = id);

-- Managers policies
CREATE POLICY "Managers are viewable by everyone"
  ON managers FOR SELECT
  USING (TRUE);

CREATE POLICY "Managers can insert own profile"
  ON managers FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Managers can update own profile"
  ON managers FOR UPDATE
  USING (auth.uid() = id);

-- Events policies
CREATE POLICY "Published events are viewable by everyone"
  ON events FOR SELECT
  USING (status = 'published' OR organizer_id = auth.uid());

CREATE POLICY "Managers can insert own events"
  ON events FOR INSERT
  WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Managers can update own events"
  ON events FOR UPDATE
  USING (organizer_id = auth.uid());

CREATE POLICY "Managers can delete own events"
  ON events FOR DELETE
  USING (organizer_id = auth.uid());

-- Bookings policies
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (artist_id = auth.uid() OR organizer_id = auth.uid());

CREATE POLICY "Artists can insert bookings"
  ON bookings FOR INSERT
  WITH CHECK (artist_id = auth.uid());

CREATE POLICY "Artists can update own bookings"
  ON bookings FOR UPDATE
  USING (artist_id = auth.uid());

CREATE POLICY "Organizers can update own bookings"
  ON bookings FOR UPDATE
  USING (organizer_id = auth.uid());

-- Collaborations policies
CREATE POLICY "Collaborations are viewable by everyone"
  ON collaborations FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can create collaborations"
  ON collaborations FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update own collaborations"
  ON collaborations FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "Users can delete own collaborations"
  ON collaborations FOR DELETE
  USING (creator_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to check if username is available
CREATE OR REPLACE FUNCTION public.check_username_availability(check_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles WHERE profiles.username = LOWER(check_username)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create profile and role-specific record on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_full_name TEXT;
  user_username TEXT;
BEGIN
  -- Get role from metadata, default to 'artist'
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'artist');
  
  -- Ensure role is valid
  IF user_role NOT IN ('artist', 'manager') THEN
    user_role := 'artist';
  END IF;
  
  -- Get full name from metadata or email
  user_full_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1));
  
  -- Get username from metadata, or generate from email
  user_username := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    split_part(NEW.email, '@', 1)
  );
  
  -- Ensure username is unique by appending random string if needed
  IF NOT public.check_username_availability(user_username) THEN
    user_username := user_username || '_' || floor(random() * 10000)::text;
  END IF;
  
  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, role, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    user_role,
    user_full_name,
    LOWER(user_username)
  );
  
  -- Insert into role-specific table
  IF user_role = 'artist' THEN
    INSERT INTO public.artists (id, stage_name)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Artist')
    );
  ELSIF user_role = 'manager' THEN
    INSERT INTO public.managers (id, company_name)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Manager')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to handle new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS set_updated_at_profiles ON profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_artists ON artists;
CREATE TRIGGER set_updated_at_artists
  BEFORE UPDATE ON artists
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_managers ON managers;
CREATE TRIGGER set_updated_at_managers
  BEFORE UPDATE ON managers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_events ON events;
CREATE TRIGGER set_updated_at_events
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_bookings ON bookings;
CREATE TRIGGER set_updated_at_bookings
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_collaborations ON collaborations;
CREATE TRIGGER set_updated_at_collaborations
  BEFORE UPDATE ON collaborations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to increment followers count
CREATE OR REPLACE FUNCTION public.increment_followers(profile_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET followers_count = followers_count + 1 WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement followers count
CREATE OR REPLACE FUNCTION public.decrement_followers(profile_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STORAGE BUCKETS
-- =============================================

-- Create storage buckets (run these separately in Supabase Dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio', 'portfolio', true);

-- Storage policies for avatars bucket
-- CREATE POLICY "Avatar images are publicly accessible"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'avatars');
-- 
-- CREATE POLICY "Users can upload own avatar"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
-- 
-- CREATE POLICY "Users can update own avatar"
--   ON storage.objects FOR UPDATE
--   USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
