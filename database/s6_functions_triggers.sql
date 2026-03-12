-- ============================================================
-- SECTION 6: FUNCTIONS + TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_username_availability(check_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE username = LOWER(check_username)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_full_name TEXT;
  base_username TEXT;
  candidate_username TEXT;
  suffix INTEGER := 0;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'artist');
  IF user_role NOT IN ('artist', 'manager') THEN
    user_role := 'artist';
  END IF;

  user_full_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    split_part(NEW.email, '@', 1)
  );

  base_username := LOWER(COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    split_part(NEW.email, '@', 1)
  ));

  base_username := REGEXP_REPLACE(base_username, '[^a-z0-9_]', '_', 'g');
  base_username := REGEXP_REPLACE(base_username, '_+', '_', 'g');
  base_username := TRIM(BOTH '_' FROM base_username);

  IF base_username IS NULL OR base_username = '' THEN
    base_username := 'user';
  END IF;

  candidate_username := base_username;
  WHILE EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE username = candidate_username
  ) LOOP
    suffix := suffix + 1;
    candidate_username := base_username || '_' || suffix::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, email, role, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    user_role,
    user_full_name,
    candidate_username
  );

  IF user_role = 'artist' THEN
    INSERT INTO public.artists (id, stage_name)
    VALUES (NEW.id, COALESCE(NULLIF(user_full_name, ''), 'New Artist'));
  ELSE
    INSERT INTO public.managers (id, company_name)
    VALUES (NEW.id, COALESCE(NULLIF(user_full_name, ''), 'New Manager'));
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for user % (%): %', NEW.id, NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_artists ON public.artists;
CREATE TRIGGER set_updated_at_artists
  BEFORE UPDATE ON public.artists
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_managers ON public.managers;
CREATE TRIGGER set_updated_at_managers
  BEFORE UPDATE ON public.managers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_events ON public.events;
CREATE TRIGGER set_updated_at_events
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_bookings ON public.bookings;
CREATE TRIGGER set_updated_at_bookings
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_collaborations ON public.collaborations;
CREATE TRIGGER set_updated_at_collaborations
  BEFORE UPDATE ON public.collaborations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_posts ON public.posts;
CREATE TRIGGER set_updated_at_posts
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.increment_followers(profile_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET followers_count = followers_count + 1
  WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_followers(profile_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET followers_count = GREATEST(0, followers_count - 1)
  WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.adjust_followers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET followers_count = followers_count + 1
    WHERE id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET followers_count = GREATEST(0, followers_count - 1)
    WHERE id = OLD.following_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS follows_after_insert ON public.follows;
CREATE TRIGGER follows_after_insert
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.adjust_followers_count();

DROP TRIGGER IF EXISTS follows_after_delete ON public.follows;
CREATE TRIGGER follows_after_delete
  AFTER DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.adjust_followers_count();
