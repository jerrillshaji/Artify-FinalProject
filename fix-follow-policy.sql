-- Add UPDATE policy for follows table (required for upsert to work)
DROP POLICY IF EXISTS "Users can update own follows" ON public.follows;

CREATE POLICY "Users can update own follows"
  ON public.follows FOR UPDATE
  USING (follower_id = auth.uid());
