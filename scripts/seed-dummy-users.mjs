import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const DEFAULT_PASSWORD = 'ArtifyDemo@123';

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
    post: 'Just finished soundcheck for tonight. Bringing stripped-back versions of my new songs. [SEED15]'
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
    post: 'Booked for a rooftop sunset set this weekend. Groove mode on. [SEED15]'
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
    post: 'Dropped fresh vocal stems for a collab. Can not wait to play this live. [SEED15]'
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
    post: 'New pocket, tighter fills, same energy. See you at the next gig. [SEED15]'
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
    post: 'Tonight is all jazz standards and candlelight vibes. [SEED15]'
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
    post: 'Cooked up a new 90 BPM set for an underground showcase. [SEED15]'
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
    post: 'String quartet arrangements done for a weekend wedding run. [SEED15]'
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
    post: 'Rehearsed full choreography set for the city fiesta stage. [SEED15]'
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
    post: 'Writing camp day 2 and my voice is still surviving. [SEED15]'
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
    post: 'Weekend mix uploaded. Testing a deeper house run for Friday. [SEED15]'
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
    post: 'Looking for acoustic duos for a sunset wedding series this quarter. [SEED15]'
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
    post: 'Open call for high-energy acts for a regional campus tour. [SEED15]'
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
    post: 'Seeking violin and piano duos for premium hotel residencies. [SEED15]'
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
    post: 'Need a DJ and MC duo for a mall launch weekend campaign. [SEED15]'
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
    post: 'Booking soulful live acts for a livestream mini-series. [SEED15]'
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
  ['alocreativestudio', 'nithyarajesh']
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
    .like('content', '%[SEED15]%');
  if (deleteSeedPostsError) throw deleteSeedPostsError;

  const postRows = DUMMY_USERS.map((item, index) => ({
    author_id: idByUsername.get(item.username),
    content: item.post,
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

  const outputPath = path.join(projectRoot, 'database', 'seed_15_users_credentials.csv');
  fs.writeFileSync(outputPath, credentialLines.join('\n'), 'utf8');

  console.log('Seeded 15 users successfully.');
  console.log(`Credentials saved to: ${outputPath}`);
}

main().catch((error) => {
  console.error('Seeding failed:', error.message);
  process.exit(1);
});

