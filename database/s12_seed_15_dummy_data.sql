-- SECTION 12: OPTIONAL RESEED FOR THE 30 DUMMY USERS
-- Run this after running scripts/seed-dummy-users.mjs at least once.
-- This SQL does NOT create auth users or passwords. It updates profile/app data only.

WITH seed AS (
  SELECT *
  FROM (
    VALUES
    ('mia.santos@artify.dev','meeranair','Meera Nair','artist','Indie pop vocalist and songwriter who loves intimate acoustic sets and dreamy hooks.','Thiruvananthapuram, Kerala','https://randomuser.me/api/portraits/women/44.jpg','https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80','https://meeranair.example.com','Meera Nair',ARRAY['indie','pop']::text[],NULL,8.5241,76.9366),
    ('zane.rivera@artify.dev','sajanmenon','Sajan Menon','artist','R&B guitarist with smooth groove-driven live sets and session experience.','Kochi, Kerala','https://randomuser.me/api/portraits/men/32.jpg','https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1600&q=80','https://sajanmenon.example.com','Sajan Menon',ARRAY['rock','pop']::text[],NULL,9.9816,76.2999),
    ('lara.kim@artify.dev','lakshmikrishnan','Lakshmi Krishnan','artist','EDM vocalist and topliner, open to collabs for festivals and club nights.','Kozhikode, Kerala','https://randomuser.me/api/portraits/women/68.jpg','https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80','https://lakshmikrishnan.example.com','Lakshmi K',ARRAY['pop','indie']::text[],NULL,11.2588,75.7804),
    ('noah.velasco@artify.dev','nikhilvarma','Nikhil Varma','artist','Drummer and percussionist focused on funk, soul, and high-energy stage shows.','Thrissur, Kerala','https://randomuser.me/api/portraits/men/21.jpg','https://images.unsplash.com/photo-1464375117522-1311dd6a1a0a?auto=format&fit=crop&w=1600&q=80','https://nikhilvarma.example.com','Nikhil Grooves',ARRAY['rock','rap']::text[],NULL,10.5276,76.2144),
    ('ava.morgan@artify.dev','ashapillai','Asha Pillai','artist','Jazz singer with lounge residency history and custom setlist offerings.','Kottayam, Kerala','https://randomuser.me/api/portraits/women/31.jpg','https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80','https://ashapillai.example.com','Asha Pillai',ARRAY['carnatic','hindustani']::text[],NULL,9.5916,76.5222),
    ('jin.park@artify.dev','jibinrajan','Jibin Rajan','artist','Hip-hop producer and live beatmaker blending lo-fi textures with hard drums.','Kannur, Kerala','https://randomuser.me/api/portraits/men/51.jpg','https://images.unsplash.com/photo-1571330735066-03aaa9429d89?auto=format&fit=crop&w=1600&q=80','https://jibinrajan.example.com','Jibin Beats',ARRAY['rap','dj']::text[],NULL,11.8745,75.3704),
    ('sara.delacruz@artify.dev','saranyadas','Saranya Das','artist','Violinist for weddings, corporate events, and cinematic crossover projects.','Alappuzha, Kerala','https://randomuser.me/api/portraits/women/22.jpg','https://images.unsplash.com/photo-1460036521480-ff49c08c2781?auto=format&fit=crop&w=1600&q=80','https://saranyadas.example.com','Saranya Das',ARRAY['carnatic','hindustani']::text[],NULL,9.4981,76.3388),
    ('kai.ortega@artify.dev','kirannambiar','Kiran Nambiar','artist','Latin pop performer with dance-forward sets and crowd-heavy interactive shows.','Palakkad, Kerala','https://randomuser.me/api/portraits/men/62.jpg','https://images.unsplash.com/photo-1504704911898-68304a7d2807?auto=format&fit=crop&w=1600&q=80','https://kirannambiar.example.com','Kiran Nambiar',ARRAY['pop','rock']::text[],NULL,10.7867,76.6548),
    ('nina.reyes@artify.dev','nithyarajesh','Nithya Rajesh','artist','Soul-pop singer, studio writer, and storyteller performer for intimate venues.','Kollam, Kerala','https://randomuser.me/api/portraits/women/53.jpg','https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1600&q=80','https://nithyarajesh.example.com','Nithya Rajesh',ARRAY['indie','carnatic']::text[],NULL,8.8932,76.6141),
    ('leo.tan@artify.dev','lijothomas','Lijo Thomas','artist','DJ and music curator for nightlife, brand events, and rooftop sessions.','Ernakulam, Kerala','https://randomuser.me/api/portraits/men/73.jpg','https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=1600&q=80','https://lijothomas.example.com','DJ Lijo',ARRAY['dj','pop']::text[],NULL,9.9816,76.2999),
    ('ivy.mendes@artify.dev','devikapradeep','Devika Pradeep','artist','Contemporary vocalist blending indie hooks with Malayalam folk textures.','Pathanamthitta, Kerala','https://randomuser.me/api/portraits/women/12.jpg','https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80','https://devikapradeep.example.com','Devika P',ARRAY['indie','carnatic']::text[],NULL,9.2648,76.7870),
    ('omar.hale@artify.dev','anandmohan','Anand Mohan','artist','Fingerstyle guitarist and loop station performer for intimate and cafe gigs.','Idukki, Kerala','https://randomuser.me/api/portraits/men/19.jpg','https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1600&q=80','https://anandmohan.example.com','Anand Strings',ARRAY['indie','rock']::text[],NULL,9.8497,76.9711),
    ('priya.gupta@artify.dev','poojanair','Pooja Nair','artist','Playback-trained vocalist with a cinematic-pop live performance style.','Kasaragod, Kerala','https://randomuser.me/api/portraits/women/15.jpg','https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1600&q=80','https://poojanair.example.com','Pooja N',ARRAY['pop','hindustani']::text[],NULL,12.4996,74.9869),
    ('ethan.cross@artify.dev','roshanmathew','Roshan Mathew','artist','Percussion and handpan artist for ambient and meditative live experiences.','Wayanad, Kerala','https://randomuser.me/api/portraits/men/27.jpg','https://images.unsplash.com/photo-1461784121038-f088ca1e7714?auto=format&fit=crop&w=1600&q=80','https://roshanmathew.example.com','Roshan Rhythm',ARRAY['indie','dj']::text[],NULL,11.6854,76.1320),
    ('sofia.lane@artify.dev','anjalijoseph','Anjali Joseph','artist','Indie songwriter and keyboardist focused on storytelling-driven sets.','Kasaragod, Kerala','https://randomuser.me/api/portraits/women/26.jpg','https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80','https://anjalijoseph.example.com','Anjali J',ARRAY['indie','pop']::text[],NULL,12.4996,74.9869),
    ('aurora.events@artify.dev','aaravamevents','Aaravam Events','manager','Boutique events team focused on premium weddings and private celebrations.','Kochi, Kerala','https://randomuser.me/api/portraits/women/79.jpg','https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80','https://aaravamevents.example.com',NULL,NULL,'Aaravam Events',9.9816,76.2999),
    ('pulse.productions@artify.dev','thaalamproductions','Thaalam Productions','manager','Concert and festival production house running multi-city live experiences.','Thiruvananthapuram, Kerala','https://randomuser.me/api/portraits/men/84.jpg','https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1600&q=80','https://pulseprod.example.com',NULL,NULL,'Thaalam Productions',8.5241,76.9366),
    ('northstar.bookings@artify.dev','dhruvabookings','Dhruva Bookings','manager','Artist management and venue booking partner for indie and mainstream acts.','Kozhikode, Kerala','https://randomuser.me/api/portraits/women/86.jpg','https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80','https://dhruvabookings.example.com',NULL,NULL,'Dhruva Bookings',11.2588,75.7804),
    ('citylights.agency@artify.dev','nagarajyothiagency','Nagara Jyothi Agency','manager','Brand activation specialists pairing creators and performers with campaigns.','Thrissur, Kerala','https://randomuser.me/api/portraits/men/46.jpg','https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80','https://nagarajyothiagency.example.com',NULL,NULL,'Nagara Jyothi Agency',10.5276,76.2144),
    ('halo.creative@artify.dev','alocreativestudio','Alo Creative Studio','manager','Creative production studio building hybrid livestream and on-ground music events.','Malappuram, Kerala','https://randomuser.me/api/portraits/women/64.jpg','https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1600&q=80','https://alocreativestudio.example.com',NULL,NULL,'Alo Creative Studio',11.0409,76.0810),
    ('beacon.live@artify.dev','beaconlive','Beacon Live','manager','Corporate events specialist curating polished live entertainment experiences.','Kochi, Kerala','https://randomuser.me/api/portraits/men/40.jpg','https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80','https://beaconlive.example.com',NULL,NULL,'Beacon Live',9.9816,76.2999),
    ('rhythm.bridge@artify.dev','rhythmbridge','Rhythm Bridge','manager','Mid-scale event producer focused on cultural festivals and curated lineups.','Thrissur, Kerala','https://randomuser.me/api/portraits/women/41.jpg','https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80','https://rhythmbridge.example.com',NULL,NULL,'Rhythm Bridge',10.5276,76.2144),
    ('bluewave.bookings@artify.dev','bluewavebookings','Bluewave Bookings','manager','Venue and talent booking agency handling hospitality and nightlife clients.','Ernakulam, Kerala','https://randomuser.me/api/portraits/men/55.jpg','https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80','https://bluewavebookings.example.com',NULL,NULL,'Bluewave Bookings',9.9816,76.2999),
    ('moonlit.stages@artify.dev','moonlitstages','Moonlit Stages','manager','Boutique wedding and reception production house with premium artist curation.','Kottayam, Kerala','https://randomuser.me/api/portraits/women/59.jpg','https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80','https://moonlitstages.example.com',NULL,NULL,'Moonlit Stages',9.5916,76.5222),
    ('echo.events@artify.dev','echoevents','Echo Events','manager','Campus and youth event agency creating high-energy music experiences.','Kannur, Kerala','https://randomuser.me/api/portraits/men/66.jpg','https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80','https://echoevents.example.com',NULL,NULL,'Echo Events',11.8745,75.3704),
    ('ember.collective@artify.dev','embercollective','Ember Collective','manager','Independent collective producing intimate listening-room and cafe shows.','Alappuzha, Kerala','https://randomuser.me/api/portraits/women/70.jpg','https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1600&q=80','https://embercollective.example.com',NULL,NULL,'Ember Collective',9.4981,76.3388),
    ('stagecraft.media@artify.dev','stagecraftmedia','Stagecraft Media','manager','Live content and event production team for branded artist showcases.','Thiruvananthapuram, Kerala','https://randomuser.me/api/portraits/men/71.jpg','https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1600&q=80','https://stagecraftmedia.example.com',NULL,NULL,'Stagecraft Media',8.5241,76.9366),
    ('horizon.talent@artify.dev','horizontalent','Horizon Talent','manager','Talent and programming agency connecting artists with premium venues.','Kozhikode, Kerala','https://randomuser.me/api/portraits/women/74.jpg','https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1600&q=80','https://horizontalent.example.com',NULL,NULL,'Horizon Talent',11.2588,75.7804),
    ('nexa.bookings@artify.dev','nexabookings','Nexa Bookings','manager','Fast-moving bookings desk for clubs, lounges, and city showcase nights.','Palakkad, Kerala','https://randomuser.me/api/portraits/men/77.jpg','https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=1600&q=80','https://nexabookings.example.com',NULL,NULL,'Nexa Bookings',10.7867,76.6548),
    ('urban.melody@artify.dev','urbanmelody','Urban Melody','manager','City event curators building artist-first music experiences for new audiences.','Kollam, Kerala','https://randomuser.me/api/portraits/women/80.jpg','https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80','https://urbanmelody.example.com',NULL,NULL,'Urban Melody',8.8932,76.6141)
  ) AS v(email, username, full_name, role, bio, location, avatar_url, background_url, website, stage_name, genres, company_name, latitude, longitude)
),
resolved AS (
  SELECT u.id, s.*
  FROM seed s
  JOIN auth.users u ON lower(u.email) = lower(s.email)
)
SELECT * INTO TEMPORARY resolved_data FROM resolved;

-- Update profile data.
UPDATE public.profiles p
SET username = r.username,
    full_name = r.full_name,
    role = r.role,
    bio = r.bio,
    location = r.location,
    avatar_url = r.avatar_url,
    background_url = r.background_url,
    website = r.website,
    latitude = r.latitude,
    longitude = r.longitude,
    updated_at = now()
FROM resolved_data r
WHERE p.id = r.id;

-- Optional cleanup and one sample post per seeded user.
DELETE FROM public.posts
WHERE content LIKE '%[SEED%'
  AND author_id IN (SELECT id FROM resolved_data);

INSERT INTO public.posts (author_id, content, location, image_url, tags)
SELECT r.id,
       '[SEED30] Hello from ' || COALESCE(r.full_name, r.username) || '. Dummy post for testing feed and profiles.',
       r.location,
       COALESCE(r.avatar_url, r.background_url),
       ARRAY['seed','demo','dummy']::text[]
FROM resolved_data r;

-- Update artist details for seeded artists.
UPDATE public.artists a
SET stage_name = COALESCE(r.stage_name, a.stage_name),
    genres = COALESCE(r.genres, a.genres),
    updated_at = now()
FROM resolved_data r
WHERE a.id = r.id
  AND r.role = 'artist';

-- Update manager details for seeded managers.
UPDATE public.managers m
SET company_name = COALESCE(r.company_name, m.company_name),
    updated_at = now()
FROM resolved_data r
WHERE m.id = r.id
  AND r.role = 'manager';

-- Clean up temporary table.
DROP TABLE IF EXISTS resolved_data;
