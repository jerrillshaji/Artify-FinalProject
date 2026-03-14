-- ============================================================
-- SECTION 13: Add latitude/longitude to profiles
--             Enables distance-based artist/manager discovery
-- ============================================================

-- Add coordinate columns (safe to run multiple times)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Partial index for fast proximity queries
CREATE INDEX IF NOT EXISTS idx_profiles_lat_lng
  ON public.profiles (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON COLUMN public.profiles.latitude  IS 'WGS84 latitude – geocoded from the location text field';
COMMENT ON COLUMN public.profiles.longitude IS 'WGS84 longitude – geocoded from the location text field';
