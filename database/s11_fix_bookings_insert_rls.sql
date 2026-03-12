-- ============================================================
-- SECTION 11: HOTFIX - BOOKING INSERT RLS
-- Purpose: allow organizer-created booking offers as well as artist self-created bookings.
-- ============================================================

DROP POLICY IF EXISTS "Users can insert own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Artists can insert bookings" ON public.bookings;

CREATE POLICY "Users can insert own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (artist_id = auth.uid() OR organizer_id = auth.uid());
