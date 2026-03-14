# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Seed 15 Dummy Users

This project includes a script that creates 15 dummy auth users and fills profile/app data (avatar, background, bio, location, role, artist/manager details, posts, and follows).

### 1) Add service role key to `.env`

Add this key (from Supabase Dashboard -> Project Settings -> API):

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

The script uses:
- `SUPABASE_URL` or `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 2) Run seed script

```bash
npm run seed:dummy-users
```

What it does:
- Creates or updates 15 users in Supabase Auth with password `ArtifyDemo@123`
- Upserts `profiles`, `artists`, and `managers`
- Seeds sample posts and follow relationships
- Writes credentials to `database/seed_15_users_credentials.csv`

### 3) Optional SQL reseed in Supabase SQL Editor

If users already exist and you only want to refresh profile/post dummy data, run:

- `database/s12_seed_15_dummy_data.sql`

This SQL does not create auth users/passwords. It updates app tables for seeded emails.
