-- ============================================================
-- SECTION 16: ARTIST RATINGS + COMMENTS
-- ============================================================

-- Keep aggregate metadata on artists so dashboards can render quickly.
ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS total_ratings INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.artist_ratings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE NOT NULL,
  rater_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT artist_ratings_unique_artist_rater UNIQUE (artist_id, rater_id),
  CONSTRAINT artist_ratings_no_self_rating CHECK (artist_id <> rater_id)
);

CREATE INDEX IF NOT EXISTS idx_artist_ratings_artist_id ON public.artist_ratings (artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_ratings_updated_at_desc ON public.artist_ratings (updated_at DESC);

ALTER TABLE public.artist_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Artist ratings are viewable by everyone" ON public.artist_ratings;
DROP POLICY IF EXISTS "Users can insert own rating" ON public.artist_ratings;
DROP POLICY IF EXISTS "Users can update own rating" ON public.artist_ratings;
DROP POLICY IF EXISTS "Users can delete own rating" ON public.artist_ratings;

CREATE POLICY "Artist ratings are viewable by everyone"
  ON public.artist_ratings FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can insert own rating"
  ON public.artist_ratings FOR INSERT
  WITH CHECK (rater_id = auth.uid());

CREATE POLICY "Users can update own rating"
  ON public.artist_ratings FOR UPDATE
  USING (rater_id = auth.uid())
  WITH CHECK (rater_id = auth.uid());

CREATE POLICY "Users can delete own rating"
  ON public.artist_ratings FOR DELETE
  USING (rater_id = auth.uid());

CREATE OR REPLACE FUNCTION public.refresh_artist_rating_summary(target_artist_id UUID)
RETURNS VOID AS $$
DECLARE
  avg_rating NUMERIC(3,2);
  rating_count INTEGER;
BEGIN
  SELECT
    ROUND(COALESCE(AVG(rating::NUMERIC), 0)::NUMERIC, 2),
    COUNT(*)::INTEGER
  INTO avg_rating, rating_count
  FROM public.artist_ratings
  WHERE artist_id = target_artist_id;

  UPDATE public.artists
  SET
    rating = COALESCE(avg_rating, 0),
    total_ratings = COALESCE(rating_count, 0),
    updated_at = NOW()
  WHERE id = target_artist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_artist_rating_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_artist_rating_summary(OLD.artist_id);
    RETURN OLD;
  END IF;

  PERFORM public.refresh_artist_rating_summary(NEW.artist_id);

  IF TG_OP = 'UPDATE' AND OLD.artist_id <> NEW.artist_id THEN
    PERFORM public.refresh_artist_rating_summary(OLD.artist_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS artist_ratings_set_updated_at ON public.artist_ratings;
CREATE TRIGGER artist_ratings_set_updated_at
  BEFORE UPDATE ON public.artist_ratings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS artist_ratings_after_insert ON public.artist_ratings;
CREATE TRIGGER artist_ratings_after_insert
  AFTER INSERT ON public.artist_ratings
  FOR EACH ROW EXECUTE FUNCTION public.handle_artist_rating_change();

DROP TRIGGER IF EXISTS artist_ratings_after_update ON public.artist_ratings;
CREATE TRIGGER artist_ratings_after_update
  AFTER UPDATE ON public.artist_ratings
  FOR EACH ROW EXECUTE FUNCTION public.handle_artist_rating_change();

DROP TRIGGER IF EXISTS artist_ratings_after_delete ON public.artist_ratings;
CREATE TRIGGER artist_ratings_after_delete
  AFTER DELETE ON public.artist_ratings
  FOR EACH ROW EXECUTE FUNCTION public.handle_artist_rating_change();

-- Backfill aggregate values for artists if rows already exist.
UPDATE public.artists a
SET
  rating = COALESCE(agg.avg_rating, 0),
  total_ratings = COALESCE(agg.rating_count, 0)
FROM (
  SELECT
    artist_id,
    ROUND(AVG(rating::NUMERIC), 2) AS avg_rating,
    COUNT(*)::INTEGER AS rating_count
  FROM public.artist_ratings
  GROUP BY artist_id
) agg
WHERE a.id = agg.artist_id;

UPDATE public.artists
SET
  rating = 0,
  total_ratings = 0
WHERE id NOT IN (SELECT DISTINCT artist_id FROM public.artist_ratings);
