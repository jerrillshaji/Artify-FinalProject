-- ============================================================
-- SECTION 2: CLEAN SLATE (DROP IN SAFE ORDER)
-- ============================================================
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
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
DROP TRIGGER IF EXISTS set_updated_at_posts ON public.posts;
DROP TRIGGER IF EXISTS follows_after_insert ON public.follows;
DROP TRIGGER IF EXISTS follows_after_delete ON public.follows;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.increment_followers(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.decrement_followers(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_username_availability(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.adjust_followers_count() CASCADE;
