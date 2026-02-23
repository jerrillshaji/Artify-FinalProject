# Supabase Setup Guide for Artify

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Wait for the project to be set up

## 2. Get Your Credentials

1. Go to **Project Settings** (gear icon in sidebar)
2. Navigate to **API**
3. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

## 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 4. Set Up Database

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy the contents of `supabase-schema.sql`
3. Paste and run the SQL script
4. This will create all tables, indexes, RLS policies, and triggers

## 5. Set Up Storage Buckets

1. Go to **Storage** in Supabase Dashboard
2. Create the following buckets:
   - `avatars` (public)
   - `event-images` (public)
   - `portfolio` (public)
   - `posts` (public)

Or run this SQL:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('avatars', 'avatars', true),
  ('event-images', 'event-images', true),
  ('portfolio', 'portfolio', true),
  ('posts', 'posts', true);
```

## 6. Enable Email Authentication (Optional)

1. Go to **Authentication** > **Providers**
2. Enable **Email** provider
3. Configure email templates if needed

## 7. Test the Connection

Run the development server:
```bash
npm run dev
```

## Usage in Components

```jsx
import { useSupabase } from './context/SupabaseContext';
// or
import { useAuth } from './hooks/useAuth';

function MyComponent() {
  const { supabase } = useSupabase();
  const { user, isAuthenticated, signIn, signOut } = useAuth();

  // Use Supabase client
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id);

  // Use auth helpers
  await signIn(email, password);
  await signOut();
}
```

## Database Tables Overview

| Table | Description |
|-------|-------------|
| `profiles` | User profile information |
| `artists` | Extended artist data |
| `managers` | Extended manager data |
| `events` | Event listings |
| `bookings` | Booking requests |
| `collaborations` | Jam session requests |
| `messages` | Chat messages |
| `posts` | Community feed posts |
| `likes` | Post likes |
| `notifications` | User notifications |

## Security

- Row Level Security (RLS) is enabled on all tables
- Users can only modify their own data
- Public data (profiles, artists, posts) is readable by everyone
- Private data (messages, bookings, notifications) is restricted to involved parties
