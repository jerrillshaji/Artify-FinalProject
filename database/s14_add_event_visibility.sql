-- ============================================================
-- SECTION 14: PUBLIC VS PRIVATE EVENT VISIBILITY
-- ============================================================
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS visibility TEXT
  CHECK (visibility IN ('public', 'private'));

-- Heuristic backfill:
-- If an event already has booking rows that look like organizer-targeted offers,
-- treat it as private; otherwise default to public.
UPDATE public.events e
SET visibility = 'private'
WHERE visibility IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.event_id = e.id
      AND (
        b.message IS NULL
        OR (
          lower(b.message) NOT LIKE '%artist requested%'
          AND lower(b.message) NOT LIKE '%ready for this gig%'
        )
      )
  );

UPDATE public.events
SET visibility = 'public'
WHERE visibility IS NULL;

ALTER TABLE public.events
  ALTER COLUMN visibility SET DEFAULT 'public';

CREATE INDEX IF NOT EXISTS idx_events_visibility_status_date
  ON public.events (visibility, status, event_date DESC);

COMMENT ON COLUMN public.events.visibility IS 'Controls event discovery visibility: public in feed for all artists, private for direct invitations only';