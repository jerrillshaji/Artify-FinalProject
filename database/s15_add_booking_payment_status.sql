-- ============================================================
-- SECTION 15: Add booking payment tracking
--             Prevent duplicate dummy payments and show paid state
-- ============================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('unpaid', 'paid')) DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

UPDATE public.bookings
SET payment_status = COALESCE(payment_status, 'unpaid')
WHERE payment_status IS NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_payment_status
  ON public.bookings (payment_status);
