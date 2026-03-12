-- ============================================================
-- SECTION 5: RLS + POLICIES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

DROP POLICY IF EXISTS "Artists are viewable by everyone" ON public.artists;
DROP POLICY IF EXISTS "Artists can insert own profile" ON public.artists;
DROP POLICY IF EXISTS "Artists can update own profile" ON public.artists;

DROP POLICY IF EXISTS "Managers are viewable by everyone" ON public.managers;
DROP POLICY IF EXISTS "Managers can insert own profile" ON public.managers;
DROP POLICY IF EXISTS "Managers can update own profile" ON public.managers;

DROP POLICY IF EXISTS "Published events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Managers can insert own events" ON public.events;
DROP POLICY IF EXISTS "Managers can update own events" ON public.events;
DROP POLICY IF EXISTS "Managers can delete own events" ON public.events;

DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can insert own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Artists can insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Artists can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Organizers can update own bookings" ON public.bookings;

DROP POLICY IF EXISTS "Collaborations are viewable by everyone" ON public.collaborations;
DROP POLICY IF EXISTS "Users can create collaborations" ON public.collaborations;
DROP POLICY IF EXISTS "Users can update own collaborations" ON public.collaborations;
DROP POLICY IF EXISTS "Users can delete own collaborations" ON public.collaborations;

DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Users can create own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;

DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
DROP POLICY IF EXISTS "Users can follow from own profile" ON public.follows;
DROP POLICY IF EXISTS "Users can update own follows" ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow from own profile" ON public.follows;

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

CREATE POLICY "Users can insert own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (artist_id = auth.uid() OR organizer_id = auth.uid());

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

CREATE POLICY "Posts are viewable by everyone"
  ON public.posts FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can create own posts"
  ON public.posts FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  USING (author_id = auth.uid());

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

CREATE POLICY "Users can update own follows"
  ON public.follows FOR UPDATE
  USING (follower_id = auth.uid());

CREATE POLICY "Users can unfollow from own profile"
  ON public.follows FOR DELETE
  USING (follower_id = auth.uid());
