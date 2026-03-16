-- ============================================================
-- SECTION 11: HOTFIX - BOOKING RLS ALIGNMENT
-- Purpose: ensure managers can send gig requests/offers and respond,
--          while artists can request gigs and keep calendar visibility.
-- ============================================================

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can insert own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Artists can insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Artists can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Organizers can update own bookings" ON public.bookings;

CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (artist_id = auth.uid() OR organizer_id = auth.uid());

CREATE POLICY "Users can insert own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (artist_id = auth.uid() OR organizer_id = auth.uid());

CREATE POLICY "Artists can update own bookings"
  ON public.bookings FOR UPDATE
  USING (artist_id = auth.uid());

CREATE POLICY "Organizers can update own bookings"
  ON public.bookings FOR UPDATE
  USING (organizer_id = auth.uid());

-- Ensure profile coordinates exist for nearest-artist sorting
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

