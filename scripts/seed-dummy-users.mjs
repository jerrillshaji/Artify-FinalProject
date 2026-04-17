import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const DEFAULT_PASSWORD = 'ArtifyDemo@123';
const SEED_POST_TAG = '[SEED30]';
const CREDENTIALS_OUTPUT_FILE = 'seed_15_users_credentials.csv';

const DUMMY_USERS = [
  {
    email: 'mia.santos@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'meeranair',
    full_name: 'Meera Nair',
    role: 'artist',
    bio: 'Indie pop vocalist and songwriter who loves intimate acoustic sets and dreamy hooks.',
    location: 'Thiruvananthapuram, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg',
    background_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80',
    website: 'https://meeranair.example.com',
    social_links: { instagram: 'https://instagram.com/meeranair.music', youtube: 'https://youtube.com/@meeranair' },
    artist: {
      stage_name: 'Meera Nair',
      genres: ['indie', 'pop'],
      price_range: 'mid',
      base_price: 18000,
      rating: 4.8,
      total_gigs: 42,
      tags: ['female vocal', 'acoustic set', 'songwriter'],
      portfolio_images: ['https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80'],
      videos: []
    },
    post: 'Just finished soundcheck for tonight. Bringing stripped-back versions of my new songs. [SEED30]'
  },
  {
    email: 'zane.rivera@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'sajanmenon',
    full_name: 'Sajan Menon',
    role: 'artist',
    bio: 'R&B guitarist with smooth groove-driven live sets and session experience.',
    location: 'Kochi, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg',
    background_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1600&q=80',
    website: 'https://sajanmenon.example.com',
    social_links: { instagram: 'https://instagram.com/zane.rivera.gtr' },
    artist: {
      stage_name: 'Sajan Menon',
      genres: ['rock', 'pop'],
      price_range: 'mid',
      base_price: 22000,
      rating: 4.7,
      total_gigs: 56,
      tags: ['lead guitar', 'session', 'live band'],
      portfolio_images: ['https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=1200&q=80'],
      videos: []
    },
    post: 'Booked for a rooftop sunset set this weekend. Groove mode on. [SEED30]'
  },
  {
    email: 'lara.kim@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'lakshmikrishnan',
    full_name: 'Lakshmi Krishnan',
    role: 'artist',
    bio: 'EDM vocalist and topliner, open to collabs for festivals and club nights.',
    location: 'Kozhikode, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/women/68.jpg',
    background_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80',
    website: 'https://lakshmikrishnan.example.com',
    social_links: { instagram: 'https://instagram.com/lakshmikrishnanvox', spotify: 'https://spotify.com' },
    artist: {
      stage_name: 'Lakshmi K',
      genres: ['pop', 'indie'],
      price_range: 'high',
      base_price: 32000,
      rating: 4.9,
      total_gigs: 73,
      tags: ['festival', 'edm vocal', 'topline'],
      portfolio_images: ['https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=1200&q=80'],
      videos: []
    },
    post: 'Dropped fresh vocal stems for a collab. Can not wait to play this live. [SEED30]'
  },
  {
    email: 'noah.velasco@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'nikhilvarma',
    full_name: 'Nikhil Varma',
    role: 'artist',
    bio: 'Drummer and percussionist focused on funk, soul, and high-energy stage shows.',
    location: 'Thrissur, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/men/21.jpg',
    background_url: 'https://images.unsplash.com/photo-1464375117522-1311dd6a1a0a?auto=format&fit=crop&w=1600&q=80',
    website: 'https://nikhilvarma.example.com',
    social_links: { instagram: 'https://instagram.com/noahgrooves' },
    artist: {
      stage_name: 'Nikhil Grooves',
      genres: ['rock', 'rap'],
      price_range: 'mid',
      base_price: 20000,
      rating: 4.6,
      total_gigs: 48,
      tags: ['drums', 'percussion', 'live grooves'],
      portfolio_images: ['https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&w=1200&q=80'],
      videos: []
    },
    post: 'New pocket, tighter fills, same energy. See you at the next gig. [SEED30]'
  },
  {
    email: 'ava.morgan@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'ashapillai',
    full_name: 'Asha Pillai',
    role: 'artist',
    bio: 'Jazz singer with lounge residency history and custom setlist offerings.',
    location: 'Kottayam, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/women/31.jpg',
    background_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80',
    website: 'https://ashapillai.example.com',
    social_links: { instagram: 'https://instagram.com/ashapillaijazz' },
    artist: {
      stage_name: 'Asha Pillai',
      genres: ['carnatic', 'hindustani'],
      price_range: 'high',
      base_price: 28000,
      rating: 4.9,
      total_gigs: 91,
      tags: ['jazz lounge', 'female vocal', 'private events'],
      portfolio_images: ['https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80'],
      videos: []
    },
    post: 'Tonight is all jazz standards and candlelight vibes. [SEED30]'
  },
  {
    email: 'jin.park@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'jibinrajan',
    full_name: 'Jibin Rajan',
    role: 'artist',
    bio: 'Hip-hop producer and live beatmaker blending lo-fi textures with hard drums.',
    location: 'Kannur, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/men/51.jpg',
    background_url: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?auto=format&fit=crop&w=1600&q=80',
    website: 'https://jibinrajan.example.com',
    social_links: { instagram: 'https://instagram.com/jibinrajanbeats' },
    artist: {
      stage_name: 'Jibin Beats',
      genres: ['rap', 'dj'],
      price_range: 'mid',
      base_price: 21000,
      rating: 4.5,
      total_gigs: 37,
      tags: ['beatmaker', 'producer', 'live set'],
      portfolio_images: ['https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=1200&q=80'],
      videos: []
    },
    post: 'Cooked up a new 90 BPM set for an underground showcase. [SEED30]'
  },
  {
    email: 'sara.delacruz@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'saranyadas',
    full_name: 'Saranya Das',
    role: 'artist',
    bio: 'Violinist for weddings, corporate events, and cinematic crossover projects.',
    location: 'Alappuzha, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/women/22.jpg',
    background_url: 'https://images.unsplash.com/photo-1460036521480-ff49c08c2781?auto=format&fit=crop&w=1600&q=80',
    website: 'https://saranyadas.example.com',
    social_links: { instagram: 'https://instagram.com/saraviolin' },
    artist: {
      stage_name: 'Saranya Das',
      genres: ['carnatic', 'hindustani'],
      price_range: 'mid',
      base_price: 24000,
      rating: 4.8,
      total_gigs: 64,
      tags: ['violin', 'weddings', 'strings'],
      portfolio_images: ['https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?auto=format&fit=crop&w=1200&q=80'],
      videos: []
    },
    post: 'String quartet arrangements done for a weekend wedding run. [SEED30]'
  },
  {
    email: 'kai.ortega@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'kirannambiar',
    full_name: 'Kiran Nambiar',
    role: 'artist',
    bio: 'Latin pop performer with dance-forward sets and crowd-heavy interactive shows.',
    location: 'Palakkad, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/men/62.jpg',
    background_url: 'https://images.unsplash.com/photo-1504704911898-68304a7d2807?auto=format&fit=crop&w=1600&q=80',
    website: 'https://kirannambiar.example.com',
    social_links: { instagram: 'https://instagram.com/kai.ortega.live' },
    artist: {
      stage_name: 'Kiran Nambiar',
      genres: ['pop', 'rock'],
      price_range: 'high',
      base_price: 30000,
      rating: 4.7,
      total_gigs: 58,
      tags: ['dance', 'latin', 'crowd work'],
      portfolio_images: ['https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80'],
      videos: []
    },
    post: 'Rehearsed full choreography set for the city fiesta stage. [SEED30]'
  },
  {
    email: 'nina.reyes@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'nithyarajesh',
    full_name: 'Nithya Rajesh',
    role: 'artist',
    bio: 'Soul-pop singer, studio writer, and storyteller performer for intimate venues.',
    location: 'Kollam, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/women/53.jpg',
    background_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1600&q=80',
    website: 'https://nithyarajesh.example.com',
    social_links: { instagram: 'https://instagram.com/nithyarajeshsings' },
    artist: {
      stage_name: 'Nithya Rajesh',
      genres: ['indie', 'carnatic'],
      price_range: 'mid',
      base_price: 19500,
      rating: 4.6,
      total_gigs: 33,
      tags: ['soul', 'storytelling', 'acoustic'],
      portfolio_images: ['https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1200&q=80'],
      videos: []
    },
    post: 'Writing camp day 2 and my voice is still surviving. [SEED30]'
  },
  {
    email: 'leo.tan@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'lijothomas',
    full_name: 'Lijo Thomas',
    role: 'artist',
    bio: 'DJ and music curator for nightlife, brand events, and rooftop sessions.',
    location: 'Ernakulam, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/men/73.jpg',
    background_url: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=1600&q=80',
    website: 'https://lijothomas.example.com',
    social_links: { instagram: 'https://instagram.com/djlijothomas' },
    artist: {
      stage_name: 'DJ Lijo',
      genres: ['dj', 'pop'],
      price_range: 'high',
      base_price: 35000,
      rating: 4.9,
      total_gigs: 102,
      tags: ['dj', 'nightlife', 'open format'],
      portfolio_images: ['https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80'],
      videos: []
    },
    post: 'Weekend mix uploaded. Testing a deeper house run for Friday. [SEED30]'
  },
  {
    email: 'aurora.events@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'aaravamevents',
    full_name: 'Aaravam Events',
    role: 'manager',
    bio: 'Boutique events team focused on premium weddings and private celebrations.',
    location: 'Kochi, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/women/79.jpg',
    background_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80',
    website: 'https://aaravamevents.example.com',
    social_links: { website: 'https://aaravamevents.example.com' },
    manager: {
      company_name: 'Aaravam Events',
      company_type: 'Wedding & Private Events',
      total_events: 140,
      upcoming_events: 12
    },
    post: 'Looking for acoustic duos for a sunset wedding series this quarter. [SEED30]'
  },
  {
    email: 'pulse.productions@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'thaalamproductions',
    full_name: 'Thaalam Productions',
    role: 'manager',
    bio: 'Concert and festival production house running multi-city live experiences.',
    location: 'Thiruvananthapuram, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/men/84.jpg',
    background_url: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1600&q=80',
    website: 'https://pulseprod.example.com',
    social_links: { website: 'https://pulseprod.example.com' },
    manager: {
      company_name: 'Thaalam Productions',
      company_type: 'Concert Production',
      total_events: 210,
      upcoming_events: 18
    },
    post: 'Open call for high-energy acts for a regional campus tour. [SEED30]'
  },
  {
    email: 'northstar.bookings@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'dhruvabookings',
    full_name: 'Dhruva Bookings',
    role: 'manager',
    bio: 'Artist management and venue booking partner for indie and mainstream acts.',
    location: 'Kozhikode, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/women/86.jpg',
    background_url: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80',
    website: 'https://dhruvabookings.example.com',
    social_links: { website: 'https://dhruvabookings.example.com' },
    manager: {
      company_name: 'Dhruva Bookings',
      company_type: 'Artist Management',
      total_events: 95,
      upcoming_events: 9
    },
    post: 'Seeking violin and piano duos for premium hotel residencies. [SEED30]'
  },
  {
    email: 'citylights.agency@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'nagarajyothiagency',
    full_name: 'Nagara Jyothi Agency',
    role: 'manager',
    bio: 'Brand activation specialists pairing creators and performers with campaigns.',
    location: 'Thrissur, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/men/46.jpg',
    background_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80',
    website: 'https://nagarajyothiagency.example.com',
    social_links: { website: 'https://nagarajyothiagency.example.com' },
    manager: {
      company_name: 'Nagara Jyothi Agency',
      company_type: 'Brand Activations',
      total_events: 122,
      upcoming_events: 11
    },
    post: 'Need a DJ and MC duo for a mall launch weekend campaign. [SEED30]'
  },
  {
    email: 'halo.creative@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'alocreativestudio',
    full_name: 'Alo Creative Studio',
    role: 'manager',
    bio: 'Creative production studio building hybrid livestream and on-ground music events.',
    location: 'Malappuram, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/women/64.jpg',
    background_url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1600&q=80',
    website: 'https://alocreativestudio.example.com',
    social_links: { website: 'https://alocreativestudio.example.com' },
    manager: {
      company_name: 'Alo Creative Studio',
      company_type: 'Hybrid Event Production',
      total_events: 77,
      upcoming_events: 7
    },
    post: 'Booking soulful live acts for a livestream mini-series. [SEED30]'
  },
  {
    email: 'ivy.mendes@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'devikapradeep',
    full_name: 'Devika Pradeep',
    role: 'artist',
    bio: 'Contemporary vocalist blending indie hooks with Malayalam folk textures.',
    location: 'Pathanamthitta, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/women/12.jpg',
    background_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80',
    website: 'https://devikapradeep.example.com',
    social_links: { instagram: 'https://instagram.com/devikapradeep.music' },
    artist: {
      stage_name: 'Devika P',
      genres: ['indie', 'carnatic'],
      price_range: 'mid',
      base_price: 23000,
      rating: 4.7,
      total_gigs: 46,
      tags: ['live vocal', 'folk fusion', 'originals'],
      portfolio_images: ['https://images.unsplash.com/photo-1516280030429-27679b3dc9cf?auto=format&fit=crop&w=1200&q=80'],
      videos: []
    },
    post: 'Finalized a new folk-fusion setlist for this month. [SEED30]'
  },
  {
    email: 'omar.hale@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'anandmohan',
    full_name: 'Anand Mohan',
    role: 'artist',
    bio: 'Fingerstyle guitarist and loop station performer for intimate and cafe gigs.',
    location: 'Idukki, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/men/19.jpg',
    background_url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1600&q=80',
    website: 'https://anandmohan.example.com',
    social_links: { instagram: 'https://instagram.com/anandmohan.strings' },
    artist: {
      stage_name: 'Anand Strings',
      genres: ['indie', 'rock'],
      price_range: 'mid',
      base_price: 21000,
      rating: 4.6,
      total_gigs: 39,
      tags: ['guitar', 'solo act', 'loop station'],
      portfolio_images: ['https://images.unsplash.com/photo-1519996521438-2ea2b5f7e8db?auto=format&fit=crop&w=1200&q=80'],
      videos: []
    },
    post: 'Testing a new fingerstyle medley for weekend cafe circuits. [SEED30]'
  },
  {
    email: 'priya.gupta@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'poojanair',
    full_name: 'Pooja Nair',
    role: 'artist',
    bio: 'Playback-trained vocalist with a cinematic-pop live performance style.',
    location: 'Kasaragod, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/women/15.jpg',
    background_url: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1600&q=80',
    website: 'https://poojanair.example.com',
    social_links: { instagram: 'https://instagram.com/poojanair.vox' },
    artist: {
      stage_name: 'Pooja N',
      genres: ['pop', 'hindustani'],
      price_range: 'high',
      base_price: 29000,
      rating: 4.8,
      total_gigs: 68,
      tags: ['playback style', 'cinematic', 'weddings'],
      portfolio_images: ['https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80'],
      videos: []
    },
    post: 'Wrapped rehearsals for a cinematic unplugged showcase. [SEED30]'
  },
  {
    email: 'ethan.cross@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'roshanmathew',
    full_name: 'Roshan Mathew',
    role: 'artist',
    bio: 'Percussion and handpan artist for ambient and meditative live experiences.',
    location: 'Wayanad, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/men/27.jpg',
    background_url: 'https://images.unsplash.com/photo-1461784121038-f088ca1e7714?auto=format&fit=crop&w=1600&q=80',
    website: 'https://roshanmathew.example.com',
    social_links: { instagram: 'https://instagram.com/roshan.handpan' },
    artist: {
      stage_name: 'Roshan Rhythm',
      genres: ['indie', 'dj'],
      price_range: 'mid',
      base_price: 22000,
      rating: 4.5,
      total_gigs: 29,
      tags: ['handpan', 'ambient', 'percussion'],
      portfolio_images: ['https://images.unsplash.com/photo-1461783436728-0a9217714694?auto=format&fit=crop&w=1200&q=80'],
      videos: []
    },
    post: 'Ambient handpan + percussion set ready for the retreat circuit. [SEED30]'
  },
  {
    email: 'sofia.lane@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'anjalijoseph',
    full_name: 'Anjali Joseph',
    role: 'artist',
    bio: 'Indie songwriter and keyboardist focused on storytelling-driven sets.',
    location: 'Kasaragod, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/women/26.jpg',
    background_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80',
    website: 'https://anjalijoseph.example.com',
    social_links: { instagram: 'https://instagram.com/anjalijoseph.music' },
    artist: {
      stage_name: 'Anjali J',
      genres: ['indie', 'pop'],
      price_range: 'mid',
      base_price: 20500,
      rating: 4.6,
      total_gigs: 34,
      tags: ['keys', 'songwriter', 'acoustic pop'],
      portfolio_images: ['https://images.unsplash.com/photo-1517232115160-ff93364542dd?auto=format&fit=crop&w=1200&q=80'],
      videos: []
    },
    post: 'Sharing two unreleased originals at this Friday listening room. [SEED30]'
  },
  {
    email: 'beacon.live@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'beaconlive',
    full_name: 'Beacon Live',
    role: 'manager',
    bio: 'Corporate events specialist curating polished live entertainment experiences.',
    location: 'Kochi, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/men/40.jpg',
    background_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80',
    website: 'https://beaconlive.example.com',
    social_links: { website: 'https://beaconlive.example.com' },
    manager: {
      company_name: 'Beacon Live',
      company_type: 'Corporate Events',
      total_events: 133,
      upcoming_events: 13
    },
    post: 'Hiring versatile live acts for a pan-Kerala annual summit series. [SEED30]'
  },
  {
    email: 'rhythm.bridge@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'rhythmbridge',
    full_name: 'Rhythm Bridge',
    role: 'manager',
    bio: 'Mid-scale event producer focused on cultural festivals and curated lineups.',
    location: 'Thrissur, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/women/41.jpg',
    background_url: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80',
    website: 'https://rhythmbridge.example.com',
    social_links: { website: 'https://rhythmbridge.example.com' },
    manager: {
      company_name: 'Rhythm Bridge',
      company_type: 'Festival Production',
      total_events: 111,
      upcoming_events: 10
    },
    post: 'Open to folk-pop and indie acts for temple arts festival season. [SEED30]'
  },
  {
    email: 'bluewave.bookings@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'bluewavebookings',
    full_name: 'Bluewave Bookings',
    role: 'manager',
    bio: 'Venue and talent booking agency handling hospitality and nightlife clients.',
    location: 'Ernakulam, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/men/55.jpg',
    background_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80',
    website: 'https://bluewavebookings.example.com',
    social_links: { website: 'https://bluewavebookings.example.com' },
    manager: {
      company_name: 'Bluewave Bookings',
      company_type: 'Venue Bookings',
      total_events: 168,
      upcoming_events: 15
    },
    post: 'Need weekend DJ lineups for a premium lounge partner network. [SEED30]'
  },
  {
    email: 'moonlit.stages@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'moonlitstages',
    full_name: 'Moonlit Stages',
    role: 'manager',
    bio: 'Boutique wedding and reception production house with premium artist curation.',
    location: 'Kottayam, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/women/59.jpg',
    background_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80',
    website: 'https://moonlitstages.example.com',
    social_links: { website: 'https://moonlitstages.example.com' },
    manager: {
      company_name: 'Moonlit Stages',
      company_type: 'Wedding Production',
      total_events: 84,
      upcoming_events: 8
    },
    post: 'Looking for violin-piano duos for destination wedding weekends. [SEED30]'
  },
  {
    email: 'echo.events@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'echoevents',
    full_name: 'Echo Events',
    role: 'manager',
    bio: 'Campus and youth event agency creating high-energy music experiences.',
    location: 'Kannur, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/men/66.jpg',
    background_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80',
    website: 'https://echoevents.example.com',
    social_links: { website: 'https://echoevents.example.com' },
    manager: {
      company_name: 'Echo Events',
      company_type: 'Campus Events',
      total_events: 126,
      upcoming_events: 14
    },
    post: 'Accepting artist applications for college fest headline slots. [SEED30]'
  },
  {
    email: 'ember.collective@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'embercollective',
    full_name: 'Ember Collective',
    role: 'manager',
    bio: 'Independent collective producing intimate listening-room and cafe shows.',
    location: 'Alappuzha, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/women/70.jpg',
    background_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1600&q=80',
    website: 'https://embercollective.example.com',
    social_links: { website: 'https://embercollective.example.com' },
    manager: {
      company_name: 'Ember Collective',
      company_type: 'Independent Promoters',
      total_events: 72,
      upcoming_events: 6
    },
    post: 'Curating soft indie-acoustic nights for waterfront cafe venues. [SEED30]'
  },
  {
    email: 'stagecraft.media@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'stagecraftmedia',
    full_name: 'Stagecraft Media',
    role: 'manager',
    bio: 'Live content and event production team for branded artist showcases.',
    location: 'Thiruvananthapuram, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/men/71.jpg',
    background_url: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1600&q=80',
    website: 'https://stagecraftmedia.example.com',
    social_links: { website: 'https://stagecraftmedia.example.com' },
    manager: {
      company_name: 'Stagecraft Media',
      company_type: 'Branded Productions',
      total_events: 158,
      upcoming_events: 16
    },
    post: 'Seeking charismatic live performers for a branded digital series. [SEED30]'
  },
  {
    email: 'horizon.talent@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'horizontalent',
    full_name: 'Horizon Talent',
    role: 'manager',
    bio: 'Talent and programming agency connecting artists with premium venues.',
    location: 'Kozhikode, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/women/74.jpg',
    background_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1600&q=80',
    website: 'https://horizontalent.example.com',
    social_links: { website: 'https://horizontalent.example.com' },
    manager: {
      company_name: 'Horizon Talent',
      company_type: 'Talent Agency',
      total_events: 143,
      upcoming_events: 12
    },
    post: 'Onboarding new artists for premium weekend venue circuits. [SEED30]'
  },
  {
    email: 'nexa.bookings@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'nexabookings',
    full_name: 'Nexa Bookings',
    role: 'manager',
    bio: 'Fast-moving bookings desk for clubs, lounges, and city showcase nights.',
    location: 'Palakkad, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/men/77.jpg',
    background_url: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=1600&q=80',
    website: 'https://nexabookings.example.com',
    social_links: { website: 'https://nexabookings.example.com' },
    manager: {
      company_name: 'Nexa Bookings',
      company_type: 'Club Bookings',
      total_events: 187,
      upcoming_events: 17
    },
    post: 'Looking for crowd-focused DJs for Friday and Saturday residencies. [SEED30]'
  },
  {
    email: 'urban.melody@artify.dev',
    password: DEFAULT_PASSWORD,
    username: 'urbanmelody',
    full_name: 'Urban Melody',
    role: 'manager',
    bio: 'City event curators building artist-first music experiences for new audiences.',
    location: 'Kollam, Kerala',
    avatar_url: 'https://randomuser.me/api/portraits/women/80.jpg',
    background_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80',
    website: 'https://urbanmelody.example.com',
    social_links: { website: 'https://urbanmelody.example.com' },
    manager: {
      company_name: 'Urban Melody',
      company_type: 'City Music Curators',
      total_events: 98,
      upcoming_events: 9
    },
    post: 'Applications open for our next citywide indie showcase. [SEED30]'
  }
];

const FOLLOW_RELATIONS = [
  ['meeranair', 'sajanmenon'],
  ['meeranair', 'lakshmikrishnan'],
  ['meeranair', 'aaravamevents'],
  ['sajanmenon', 'meeranair'],
  ['sajanmenon', 'lijothomas'],
  ['lakshmikrishnan', 'thaalamproductions'],
  ['nikhilvarma', 'kirannambiar'],
  ['ashapillai', 'dhruvabookings'],
  ['jibinrajan', 'nagarajyothiagency'],
  ['saranyadas', 'aaravamevents'],
  ['kirannambiar', 'thaalamproductions'],
  ['nithyarajesh', 'alocreativestudio'],
  ['lijothomas', 'nagarajyothiagency'],
  ['aaravamevents', 'meeranair'],
  ['thaalamproductions', 'lakshmikrishnan'],
  ['dhruvabookings', 'saranyadas'],
  ['nagarajyothiagency', 'lijothomas'],
  ['alocreativestudio', 'nithyarajesh'],
  ['devikapradeep', 'beaconlive'],
  ['devikapradeep', 'rhythmbridge'],
  ['anandmohan', 'bluewavebookings'],
  ['poojanair', 'moonlitstages'],
  ['roshanmathew', 'echoevents'],
  ['anjalijoseph', 'embercollective'],
  ['beaconlive', 'meeranair'],
  ['rhythmbridge', 'saranyadas'],
  ['bluewavebookings', 'lijothomas'],
  ['moonlitstages', 'ashapillai'],
  ['echoevents', 'jibinrajan'],
  ['embercollective', 'anjalijoseph'],
  ['stagecraftmedia', 'devikapradeep'],
  ['horizontalent', 'poojanair'],
  ['nexabookings', 'roshanmathew'],
  ['urbanmelody', 'anandmohan']
];

function loadEnvFromDotEnv() {
  const envPath = path.join(projectRoot, '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    if (!process.env[key.trim()]) {
      process.env[key.trim()] = value;
    }
  }
}

function pickEnv(nameList) {
  for (const name of nameList) {
    if (process.env[name]) return process.env[name];
  }
  return '';
}

function toRoleMetadata(item) {
  return {
    role: item.role,
    username: item.username,
    full_name: item.full_name,
  };
}

async function main() {
  loadEnvFromDotEnv();

  const supabaseUrl = pickEnv(['SUPABASE_URL', 'VITE_SUPABASE_URL']);
  const serviceRoleKey = pickEnv(['SUPABASE_SERVICE_ROLE_KEY', 'SERVICE_ROLE_KEY']);

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in your environment.');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: usersPage, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;

  const existingByEmail = new Map((usersPage?.users || []).map((u) => [String(u.email || '').toLowerCase(), u]));
  const idByUsername = new Map();
  const authSummaries = [];

  for (const item of DUMMY_USERS) {
    const email = item.email.toLowerCase();
    let authUser = existingByEmail.get(email);

    if (!authUser) {
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: item.email,
        password: item.password,
        email_confirm: true,
        user_metadata: toRoleMetadata(item),
      });
      if (createError) throw createError;
      authUser = created.user;
    } else {
      const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
        password: item.password,
        user_metadata: toRoleMetadata(item),
      });
      if (updateError) throw updateError;
    }

    idByUsername.set(item.username, authUser.id);
    authSummaries.push({ email: item.email, password: item.password, id: authUser.id, role: item.role, username: item.username });
  }

  const profileRows = DUMMY_USERS.map((item) => ({
    id: idByUsername.get(item.username),
    email: item.email,
    username: item.username,
    full_name: item.full_name,
    avatar_url: item.avatar_url,
    background_url: item.background_url,
    role: item.role,
    bio: item.bio,
    location: item.location,
    website: item.website,
    social_links: item.social_links,
    is_verified: Math.random() > 0.5,
  }));

  const { error: profileError } = await supabase.from('profiles').upsert(profileRows, { onConflict: 'id' });
  if (profileError) throw profileError;

  const artistRows = DUMMY_USERS
    .filter((item) => item.role === 'artist')
    .map((item) => ({ id: idByUsername.get(item.username), ...item.artist }));

  if (artistRows.length > 0) {
    const { error: artistError } = await supabase.from('artists').upsert(artistRows, { onConflict: 'id' });
    if (artistError) throw artistError;
  }

  const managerRows = DUMMY_USERS
    .filter((item) => item.role === 'manager')
    .map((item) => ({ id: idByUsername.get(item.username), ...item.manager }));

  if (managerRows.length > 0) {
    const { error: managerError } = await supabase.from('managers').upsert(managerRows, { onConflict: 'id' });
    if (managerError) throw managerError;
  }

  const seedUserIds = profileRows.map((row) => row.id);

  const { error: deleteSeedPostsError } = await supabase
    .from('posts')
    .delete()
    .in('author_id', seedUserIds)
    .like('content', '%[SEED%');
  if (deleteSeedPostsError) throw deleteSeedPostsError;

  const postRows = DUMMY_USERS.map((item, index) => ({
    author_id: idByUsername.get(item.username),
    content: item.post.replace(/\[SEED\d+\]/g, SEED_POST_TAG),
    location: item.location,
    image_url: item.artist?.portfolio_images?.[0] || item.background_url,
    tags: item.role === 'artist' ? ['seed', 'artist', `u${index + 1}`] : ['seed', 'manager', `u${index + 1}`],
  }));

  const { error: postError } = await supabase.from('posts').insert(postRows);
  if (postError) throw postError;

  const { error: clearFollowsError } = await supabase
    .from('follows')
    .delete()
    .in('follower_id', seedUserIds)
    .in('following_id', seedUserIds);
  if (clearFollowsError) throw clearFollowsError;

  const followRows = FOLLOW_RELATIONS.map(([fromUsername, toUsername]) => ({
    follower_id: idByUsername.get(fromUsername),
    following_id: idByUsername.get(toUsername),
  })).filter((row) => row.follower_id && row.following_id && row.follower_id !== row.following_id);

  if (followRows.length > 0) {
    const { error: followError } = await supabase.from('follows').insert(followRows);
    if (followError) throw followError;
  }

  const credentialLines = [
    'email,password,role,username,user_id',
    ...authSummaries.map((item) => `${item.email},${item.password},${item.role},${item.username},${item.id}`),
  ];

  const outputPath = path.join(projectRoot, 'database', CREDENTIALS_OUTPUT_FILE);
  fs.writeFileSync(outputPath, credentialLines.join('\n'), 'utf8');

  console.log(`Seeded ${DUMMY_USERS.length} users successfully.`);
  console.log(`Credentials saved to: ${outputPath}`);
}

main().catch((error) => {
  console.error('Seeding failed:', error.message);
  process.exit(1);
});


