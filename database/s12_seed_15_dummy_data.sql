-- SECTION 12: OPTIONAL RESEED FOR THE 15 DUMMY USERS
-- Run this after running scripts/seed-dummy-users.mjs at least once.
-- This SQL does NOT create auth users or passwords. It updates profile/app data only.

WITH seed(email, username, full_name, role, bio, location, avatar_url, background_url, website) AS (
  VALUES
    ('mia.santos@artify.dev','meeranair','Meera Nair','artist','Indie pop vocalist and songwriter who loves intimate acoustic sets and dreamy hooks.','Thiruvananthapuram, Kerala','https://randomuser.me/api/portraits/women/44.jpg','https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80','https://meeranair.example.com'),
    ('zane.rivera@artify.dev','sajanmenon','Sajan Menon','artist','R&B guitarist with smooth groove-driven live sets and session experience.','Kochi, Kerala','https://randomuser.me/api/portraits/men/32.jpg','https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1600&q=80','https://sajanmenon.example.com'),
    ('lara.kim@artify.dev','lakshmikrishnan','Lakshmi Krishnan','artist','EDM vocalist and topliner, open to collabs for festivals and club nights.','Kozhikode, Kerala','https://randomuser.me/api/portraits/women/68.jpg','https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80','https://lakshmikrishnan.example.com'),
    ('noah.velasco@artify.dev','nikhilvarma','Nikhil Varma','artist','Drummer and percussionist focused on funk, soul, and high-energy stage shows.','Thrissur, Kerala','https://randomuser.me/api/portraits/men/21.jpg','https://images.unsplash.com/photo-1464375117522-1311dd6a1a0a?auto=format&fit=crop&w=1600&q=80','https://nikhilvarma.example.com'),
    ('ava.morgan@artify.dev','ashapillai','Asha Pillai','artist','Jazz singer with lounge residency history and custom setlist offerings.','Kottayam, Kerala','https://randomuser.me/api/portraits/women/31.jpg','https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80','https://ashapillai.example.com'),
    ('jin.park@artify.dev','jibinrajan','Jibin Rajan','artist','Hip-hop producer and live beatmaker blending lo-fi textures with hard drums.','Kannur, Kerala','https://randomuser.me/api/portraits/men/51.jpg','https://images.unsplash.com/photo-1571330735066-03aaa9429d89?auto=format&fit=crop&w=1600&q=80','https://jibinrajan.example.com'),
    ('sara.delacruz@artify.dev','saranyadas','Saranya Das','artist','Violinist for weddings, corporate events, and cinematic crossover projects.','Alappuzha, Kerala','https://randomuser.me/api/portraits/women/22.jpg','https://images.unsplash.com/photo-1460036521480-ff49c08c2781?auto=format&fit=crop&w=1600&q=80','https://saranyadas.example.com'),
    ('kai.ortega@artify.dev','kirannambiar','Kiran Nambiar','artist','Latin pop performer with dance-forward sets and crowd-heavy interactive shows.','Palakkad, Kerala','https://randomuser.me/api/portraits/men/62.jpg','https://images.unsplash.com/photo-1504704911898-68304a7d2807?auto=format&fit=crop&w=1600&q=80','https://kirannambiar.example.com'),
    ('nina.reyes@artify.dev','nithyarajesh','Nithya Rajesh','artist','Soul-pop singer, studio writer, and storyteller performer for intimate venues.','Kollam, Kerala','https://randomuser.me/api/portraits/women/53.jpg','https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1600&q=80','https://nithyarajesh.example.com'),
    ('leo.tan@artify.dev','lijothomas','Lijo Thomas','artist','DJ and music curator for nightlife, brand events, and rooftop sessions.','Ernakulam, Kerala','https://randomuser.me/api/portraits/men/73.jpg','https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=1600&q=80','https://lijothomas.example.com'),
    ('aurora.events@artify.dev','aaravamevents','Aaravam Events','manager','Boutique events team focused on premium weddings and private celebrations.','Kochi, Kerala','https://randomuser.me/api/portraits/women/79.jpg','https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80','https://aaravamevents.example.com'),
    ('pulse.productions@artify.dev','thaalamproductions','Thaalam Productions','manager','Concert and festival production house running multi-city live experiences.','Thiruvananthapuram, Kerala','https://randomuser.me/api/portraits/men/84.jpg','https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1600&q=80','https://pulseprod.example.com'),
    ('northstar.bookings@artify.dev','dhruvabookings','Dhruva Bookings','manager','Artist management and venue booking partner for indie and mainstream acts.','Kozhikode, Kerala','https://randomuser.me/api/portraits/women/86.jpg','https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80','https://dhruvabookings.example.com'),
    ('citylights.agency@artify.dev','nagarajyothiagency','Nagara Jyothi Agency','manager','Brand activation specialists pairing creators and performers with campaigns.','Thrissur, Kerala','https://randomuser.me/api/portraits/men/46.jpg','https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80','https://nagarajyothiagency.example.com'),
    ('halo.creative@artify.dev','alocreativestudio','Alo Creative Studio','manager','Creative production studio building hybrid livestream and on-ground music events.','Malappuram, Kerala','https://randomuser.me/api/portraits/women/64.jpg','https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1600&q=80','https://alocreativestudio.example.com')
),
resolved AS (
  SELECT u.id, s.*
  FROM seed s
  JOIN auth.users u ON lower(u.email) = lower(s.email)
)
UPDATE public.profiles p
SET username = r.username,
    full_name = r.full_name,
    role = r.role,
    bio = r.bio,
    location = r.location,
    avatar_url = r.avatar_url,
    background_url = r.background_url,
    website = r.website,
    updated_at = now()
FROM resolved r
WHERE p.id = r.id;

-- Optional cleanup and one sample post per seeded user.
DELETE FROM public.posts
WHERE content LIKE '%[SEED15]%'
  AND author_id IN (
    SELECT u.id
    FROM auth.users u
    WHERE lower(u.email) LIKE '%@artify.dev'
  );

INSERT INTO public.posts (author_id, content, location, image_url, tags)
SELECT p.id,
       '[SEED15] Hello from ' || COALESCE(p.full_name, p.username) || '. Dummy post for testing feed and profiles.',
       p.location,
       COALESCE(p.avatar_url, p.background_url),
       ARRAY['seed','demo','dummy']::text[]
FROM public.profiles p
WHERE p.email LIKE '%@artify.dev';

-- Update artist stage names
UPDATE public.artists a
SET stage_name = CASE p.email
  WHEN 'mia.santos@artify.dev'   THEN 'Meera Nair'
  WHEN 'zane.rivera@artify.dev'  THEN 'Sajan Menon'
  WHEN 'lara.kim@artify.dev'     THEN 'Lakshmi K'
  WHEN 'noah.velasco@artify.dev' THEN 'Nikhil Grooves'
  WHEN 'ava.morgan@artify.dev'   THEN 'Asha Pillai'
  WHEN 'jin.park@artify.dev'     THEN 'Jibin Beats'
  WHEN 'sara.delacruz@artify.dev' THEN 'Saranya Das'
  WHEN 'kai.ortega@artify.dev'   THEN 'Kiran Nambiar'
  WHEN 'nina.reyes@artify.dev'   THEN 'Nithya Rajesh'
  WHEN 'leo.tan@artify.dev'      THEN 'DJ Lijo'
  ELSE a.stage_name
END,
genres = CASE p.email
  WHEN 'mia.santos@artify.dev'   THEN ARRAY['indie', 'pop']::text[]
  WHEN 'zane.rivera@artify.dev'  THEN ARRAY['rock', 'pop']::text[]
  WHEN 'lara.kim@artify.dev'     THEN ARRAY['pop', 'indie']::text[]
  WHEN 'noah.velasco@artify.dev' THEN ARRAY['rock', 'rap']::text[]
  WHEN 'ava.morgan@artify.dev'   THEN ARRAY['carnatic', 'hindustani']::text[]
  WHEN 'jin.park@artify.dev'     THEN ARRAY['rap', 'dj']::text[]
  WHEN 'sara.delacruz@artify.dev' THEN ARRAY['carnatic', 'hindustani']::text[]
  WHEN 'kai.ortega@artify.dev'   THEN ARRAY['pop', 'rock']::text[]
  WHEN 'nina.reyes@artify.dev'   THEN ARRAY['indie', 'carnatic']::text[]
  WHEN 'leo.tan@artify.dev'      THEN ARRAY['dj', 'pop']::text[]
  ELSE a.genres
END,
updated_at = now()
FROM public.profiles p
WHERE a.id = p.id
  AND p.email IN (
    'mia.santos@artify.dev','zane.rivera@artify.dev','lara.kim@artify.dev',
    'noah.velasco@artify.dev','ava.morgan@artify.dev','jin.park@artify.dev',
    'sara.delacruz@artify.dev','kai.ortega@artify.dev','nina.reyes@artify.dev',
    'leo.tan@artify.dev'
  );

-- Update manager company names
UPDATE public.managers m
SET company_name = CASE p.email
  WHEN 'aurora.events@artify.dev'      THEN 'Aaravam Events'
  WHEN 'pulse.productions@artify.dev'  THEN 'Thaalam Productions'
  WHEN 'northstar.bookings@artify.dev' THEN 'Dhruva Bookings'
  WHEN 'citylights.agency@artify.dev'  THEN 'Nagara Jyothi Agency'
  WHEN 'halo.creative@artify.dev'      THEN 'Alo Creative Studio'
  ELSE m.company_name
END,
updated_at = now()
FROM public.profiles p
WHERE m.id = p.id
  AND p.email IN (
    'aurora.events@artify.dev','pulse.productions@artify.dev',
    'northstar.bookings@artify.dev','citylights.agency@artify.dev',
    'halo.creative@artify.dev'
  );

