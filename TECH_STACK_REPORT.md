# Artify – Detailed Technology & Packages Report

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Frontend – Core Framework](#frontend-core-framework)
4. [Frontend – Build Tooling](#frontend-build-tooling)
5. [Frontend – Routing](#frontend-routing)
6. [Frontend – Styling & UI](#frontend-styling-ui)
7. [Frontend – Icon Library](#frontend-icon-library)
8. [Frontend – Image Cropping](#frontend-image-cropping)
9. [Frontend – State Management](#frontend-state-management)
10. [Frontend – Encryption & Web Crypto API](#frontend-encryption-web-crypto-api)
11. [Frontend – Geolocation & Mapping](#frontend-geolocation-mapping)
12. [Frontend – Currency Formatting](#frontend-currency-formatting)
13. [Frontend – Animation](#frontend-animation)
14. [Frontend – Code Quality & Linting](#frontend-code-quality-linting)
15. [Frontend – Compiler Plugin](#frontend-compiler-plugin)
16. [Backend – Supabase Platform](#backend-supabase-platform)
17. [Backend – PostgreSQL Database](#backend-postgresql-database)
18. [Backend – Authentication (Supabase Auth)](#backend-authentication)
19. [Backend – Row Level Security (RLS)](#backend-row-level-security)
20. [Backend – Realtime Subscriptions](#backend-realtime-subscriptions)
21. [Backend – Storage](#backend-storage)
22. [Backend – PostgreSQL Extensions](#backend-postgresql-extensions)
23. [Backend – Database Functions & Triggers](#backend-database-functions-triggers)
24. [Backend – Database Schema Tables](#backend-database-schema-tables)
25. [Backend – Indexes & Query Optimization](#backend-indexes-query-optimization)
26. [External APIs Used](#external-apis-used)
27. [Development Scripts & Tooling](#development-scripts-tooling)
28. [Security Measures](#security-measures)
29. [Data Models & Relationships](#data-models-relationships)
30. [Full Package Dependency Reference](#full-package-dependency-reference)

---

## 1. Project Overview

**Artify** is a full-stack web application built for the Indian music industry — specifically targeting the state of Kerala — enabling artists and event managers to connect, collaborate, book events, message one another, and rate performances. The application is built entirely as a Single Page Application (SPA) on the frontend with Supabase serving as the sole, self-contained backend.

| Property         | Value                                             |
|------------------|---------------------------------------------------|
| Project Name     | Artify                                            |
| Version          | 0.0.0 (Development Build)                         |
| Module System    | ES Modules (`"type": "module"`)                   |
| Target Users     | Musicians (Artists) and Event Organizers (Managers) |
| Region Focus     | Kerala, India (14 districts supported)            |
| Entry Point      | `src/main.jsx`                                    |
| App Shell        | `src/App.jsx`                                     |
| Backend Provider | Supabase (BaaS)                                   |

---

## 2. Architecture Overview

Artify follows a **Backend-as-a-Service (BaaS)** architecture. There is no custom Node.js or Python server. All server-side logic is handled through Supabase's managed cloud infrastructure.

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                      │
│                                                             │
│   React 19 SPA                                              │
│   ├── React Router v7 (SPA routing)                         │
│   ├── Tailwind CSS v4 (styling)                             │
│   ├── Lucide React (icons)                                  │
│   ├── React Easy Crop (image cropping)                      │
│   ├── Web Crypto API (message encryption)                   │
│   ├── Browser Geolocation API (location services)          │
│   └── Nominatim API calls (geocoding, via fetch)            │
│                                                             │
│   Supabase JS Client (@supabase/supabase-js)                │
│   ├── Auth  (sign in / sign up / email confirmation)        │
│   ├── Database queries (PostgREST over HTTPS)               │
│   ├── Realtime (WebSocket subscriptions)                    │
│   └── Storage (avatar / banner image uploads)              │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS + WSS
┌──────────────────────▼──────────────────────────────────────┐
│                   SUPABASE CLOUD (Backend)                   │
│                                                             │
│   PostgreSQL 15+                                            │
│   ├── 11 core tables (profiles, artists, managers, …)       │
│   ├── RLS policies (per-row auth enforcement)               │
│   ├── PL/pgSQL triggers (auto-profile creation, ratings)    │
│   ├── GIN indexes (text search on arrays)                   │
│   └── pg_trgm, uuid-ossp extensions                        │
│                                                             │
│   Supabase Auth (GoTrue)                                    │
│   Supabase Realtime (Phoenix Channels / Elixir)             │
│   Supabase Storage (S3-compatible)                          │
│   PostgREST (auto-generated REST API from schema)           │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Frontend – Core Framework

### React 19
**Package:** `react@^19.2.0` | **Peer:** `react-dom@^19.2.0`

React is the foundational UI library for Artify. Version 19 is the latest major release of React and introduces several significant changes over React 18.

**Why React 19?**
- **React Compiler** integration (used via `babel-plugin-react-compiler`) — automatically memoizes components and hooks, which replaces the need for manual `useMemo` / `useCallback` in many cases.
- **Concurrent Mode** is the default rendering behavior, which allows React to interrupt and prioritise renders, improving perceived performance.
- Improved `use()` hook for reading resources in JSX.
- Better Server Components compatibility for future migration.

**Key React APIs used in Artify:**

| API | Where Used | Purpose |
|-----|-----------|---------|
| `useState` | All views | Local reactive state |
| `useEffect` | CommunityFeed, ArtistDashboard, MessagesView | Side effects, data fetching |
| `useContext` | SupabaseContext | Global Supabase/auth state |
| `createContext` | `SupabaseContext.jsx` | Auth + Supabase client context |
| `useCallback` | MainLayout, MessagesView, CommunityFeed | Stable function references |
| `useMemo` | MainLayout, ArtistDashboard | Derived state computation |
| `useRef` | MessagesView | DOM reference for scroll control |
| `StrictMode` | `main.jsx` | Development double-render check |
| `createRoot` | `main.jsx` | React 18+ root mounting API |

**Entry Point (`src/main.jsx`):**
```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
```

`StrictMode` causes all effects and renders to run twice in development to detect side effects — a best practice for React apps.

---

## 4. Frontend – Build Tooling

### Vite
**Package:** `vite@^7.3.1` | **Dev Dependency**

Vite is the build tool and development server for Artify. It replaces older tooling like Create React App (webpack-based) and provides near-instant development startup via native ES Module serving.

**Configuration (`vite.config.js`):**
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
  ],
});
```

**Key Vite features leveraged:**

| Feature | Benefit |
|---------|---------|
| Native ESM dev server | Component changes reflect in milliseconds (no bundling during dev) |
| HMR (Hot Module Replacement) | React state preserved across file saves |
| Rollup bundling for prod | Tree-shaking removes unused code, small bundles |
| `import.meta.env` | Securely reads `.env` variables (prefixed `VITE_`) at build time |
| `vite preview` command | Locally previews the production build |

**Plugin: `@vitejs/plugin-react@^5.1.1`**

This official Vite plugin integrates React's fast-refresh (HMR), JSX transform, and Babel configuration. Here it is configured to also run the React Compiler Babel plugin.

**Build Scripts (from `package.json`):**
```json
{
  "dev":     "vite",
  "build":   "vite build",
  "preview": "vite preview",
  "lint":    "eslint ."
}
```

The `build` command produces optimised static files in `dist/` ready for deployment to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

---

## 5. Frontend – Routing

### React Router DOM v7
**Package:** `react-router-dom@^7.13.0`

React Router DOM v7 is a major upgrade that unifies the older v5 and v6 APIs, adds framework mode (comparable to Remix), and improves file-based routing support. Artify uses it in library mode (declarative `<Routes>` and `<Route>` components).

**Routes defined in `src/App.jsx` (unauthenticated):**

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `LandingPage` | Marketing/welcome page |
| `/login` | `Login` | Email + password sign in |
| `/register` | `Register` | New user registration |
| `/auth/callback` | `AuthCallback` | OAuth / magic link callback handler |
| `*` | `Navigate to /` | Catch-all redirect |

**Protected routes (when authenticated) are nested inside `MainLayout`:**

| Path | Component | Role Access |
|------|-----------|------------|
| `/community` | `CommunityFeed` | All |
| `/feed` | `FeedOffersView` | All (artists see gig offers) |
| `/discover` | `ManagerDiscovery` | Managers discover artists |
| `/collaborate` | `ArtistCollaborationView` | Artists find collaborators |
| `/dashboard` | `ArtistDashboard` / `ManagerDashboard` | Role-split |
| `/messages` | `MessagesView` | All |
| `/profile/:username` | `ProfileView` | All |
| `/profile/edit` | `EditProfileView` | All (own profile) |
| `/post/create` | `CreatePostView` | All |
| `/post/:id` | `PostDetailView` | All |
| `/payments` | `PaymentView` | Managers |

**Key React Router hooks used:**

| Hook | Used In | Purpose |
|------|---------|---------|
| `useNavigate` | Most views | Programmatic navigation |
| `useLocation` | MainLayout | Active route detection for nav badge clearing |
| `useSearchParams` | MessagesView, PaymentView | Reading URL query parameters |
| `useParams` | ProfileView, PostDetailView | Dynamic route segments |
| `<Link>` | LandingPage, Login | Declarative navigation links |
| `<Navigate>` | App.jsx | Redirect components |

---

## 6. Frontend – Styling & UI

### Tailwind CSS v4
**Packages:** `tailwindcss@^4.2.0` | `@tailwindcss/vite@^4.2.0`

Tailwind CSS is a utility-first CSS framework. Version 4 is a ground-up rewrite that moves all configuration into CSS variables and uses a new Vite plugin instead of the traditional `tailwind.config.js`.

**Key v4 Changes leveraged in Artify:**

| Change | Impact |
|--------|--------|
| CSS-based `@theme` configuration | Custom colours and animations defined directly in `src/index.css` |
| No `tailwind.config.js` | All `@theme` tokens live in CSS |
| New Vite plugin (`@tailwindcss/vite`) | Zero separate PostCSS step |
| Renamed utilities | `flex-shrink-0` → `shrink-0`, `bg-gradient-to-r` → `bg-linear-to-r`, etc. |

**Custom theme defined in `src/index.css`:**
```css
@import "tailwindcss";

@theme {
  --color-fuchsia-500:  #d946ef;
  --color-fuchsia-600:  #c026d3;
  --color-purple-600:   #9333ea;
  --color-cyan-500:     #06b6d4;
  --color-emerald-400:  #34d399;
  --color-yellow-400:   #facc15;

  --animate-pulse: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  --animate-bounce: bounce 1s infinite;
}
```

**Design system characteristics in Artify:**
- **Dark theme only** — `body { background-color: #050505; color: white; }`
- **Glass-morphism cards** — `bg-white/5 backdrop-blur-xl border border-white/10`
- **Gradient accents** — Fuchsia-to-purple-to-cyan gradients throughout
- **Responsive** — Mobile-first breakpoints (`sm:`, `md:`, `lg:`)
- **Custom scrollbar** — `.scrollbar-hide` class hides scrollbars on all browsers
- **Rounded extras** — `rounded-3xl`, `rounded-[2rem]`, `rounded-full` for pill/card shapes

### tailwindcss-animate
**Package:** `tailwindcss-animate@^1.0.7`

A Tailwind CSS plugin providing pre-built animation utility classes. Used to extend the default animation capabilities with classes like `animate-in`, `fade-in`, `slide-in-from-bottom`, etc. Used for loading states and transitions throughout the app.

---

## 7. Frontend – Icon Library

### Lucide React
**Package:** `lucide-react@^0.575.0`

Lucide React is a community-maintained fork of Feather Icons, providing over 1,000 clean, consistent SVG icons as tree-shakeable React components.

**Icons used across Artify views:**

| Icon | View | Usage |
|------|------|-------|
| `Search` | ManagerDiscovery, MessagesView | Search bar |
| `MessageCircle` | MessagesView, NavItem | Conversation icon |
| `Send` | MessagesView | Send message button |
| `X` | MessagesView, EditProfileView | Close/dismiss |
| `Paperclip` | MessagesView | Attachment placeholder |
| `Mic` | MessagesView | Voice placeholder |
| `Star` | CommunityFeed, ManagerDiscovery | Rating stars |
| `MapPin` | Multiple views | Location display |
| `Navigation` | ManagerDiscovery | Near Me button |
| `CalendarDays` | FeedOffersView | Event date |
| `IndianRupee` | FeedOffersView, ArtistDashboard | Payment amounts |
| `UserRound` | FeedOffersView | Organizer label |
| `RefreshCw` | FeedOffersView | Refresh button |
| `CreditCard` | PaymentView | Payment card icon |
| `CheckCircle2` | PaymentView | Success state |
| `Mail`, `Lock`, `Eye`, `EyeOff` | Login | Form field icons |
| `ArrowLeft` | BackButton | Navigation back |
| `Check` | ManagerDiscovery | Verified badge |
| `ArrowUpRight` | ArtistCollaborationView | External link |

**Why Lucide React?**
- **Tree-shakeable** — only imported icons are bundled, keeping the build size small.
- **Consistent style** — 2px stroke width, 24px grid, perfectly consistent across all icons.
- **TypeScript-friendly** — ships with full type declarations.
- **React-native** — renders as `<svg>` elements with `size`, `color`, `strokeWidth` props.

### React Icons
**Package:** `react-icons@^5.5.0`

A complementary icon library providing access to multiple icon sets in one package: Font Awesome, Material Icons, Bootstrap Icons, Heroicons, Phosphor, and many others.

**Icon sets available:** FontAwesome (fa), Material Design (md), Bootstrap (bs), Heroicons (hi), Phosphor (ph), Tabler (tb), and 30+ more.

Used in Artify for specific icons not available in Lucide or for visual variety in marketing / UI elements.

---

## 8. Frontend – Image Cropping

### React Easy Crop
**Package:** `react-easy-crop@^5.5.6`

A React component for interactive image cropping, used in Artify's `EditProfileView` to let users crop their avatar photos to a square before uploading to Supabase Storage.

**How it works in Artify:**

1. User selects an image file.
2. `react-easy-crop` renders a pinch/zoom drag UI overlaid on the image.
3. The crop area coordinates (`pixelCrop` object) are captured.
4. `getCroppedImage()` in `src/lib/cropImage.js` uses the HTML5 **Canvas API** to cut the exact crop region and export it as a `data:image/jpeg` base64 string at 92% quality.
5. The base64 image is uploaded to Supabase Storage.

**`src/lib/cropImage.js` — Canvas-based cropping:**
```js
export async function getCroppedImage(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  context.drawImage(
    image,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    pixelCrop.width, pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg', 0.92);
}
```

The `crossOrigin = 'anonymous'` attribute is set on the image to allow Canvas to read cross-origin images without CORS taint errors.

---

## 9. Frontend – State Management

Artify does **not** use Redux, Zustand, Jotai, or any third-party state manager. Instead, it uses React's built-in primitives:

### React Context API (`src/context/SupabaseContext.jsx`)

The `SupabaseProvider` wraps the entire app and exposes:

| State / Method | Type | Purpose |
|----------------|------|---------|
| `session` | `object \| null` | Active Supabase session (JWT + user) |
| `user` | `object \| null` | Currently authenticated user |
| `profile` | `object \| null` | Full profile record (profiles + artists/managers join) |
| `loading` | `boolean` | Auth loading state |
| `refreshProfile()` | `async fn` | Re-fetches and enriches profile from Supabase |
| `signIn()` | `async fn` | Email/password login via Supabase Auth |
| `signUp()` | `async fn` | Registration via Supabase Auth |
| `signOut()` | `async fn` | Destroys session |
| `resendConfirmation()` | `async fn` | Resends email confirmation link |

### `localStorage` (tab-seen badge tracking)

`MainLayout.jsx` uses `localStorage` to track when a user last visited each navigation tab, enabling the unread-badge system for messages, feed, etc.

```js
localStorage.setItem(`artify_seen_nav_messages_${userId}`, new Date().toISOString());
```

### Custom Hook: `useAuth`

`src/hooks/useAuth.js` is a thin convenience hook over `useSupabase()`:

```js
export function useAuth() {
  const { user, session, loading, signIn, signUp, signOut } = useSupabase();
  return { user, session, loading, isAuthenticated: !!user, signIn, signUp, signOut };
}
```

---

## 10. Frontend – Encryption & Web Crypto API

Artify implements **end-to-end encryption** for messages using the browser's native **Web Crypto API** (no third-party library required).

### Encryption Scheme

**Algorithm:** AES-GCM (Advanced Encryption Standard in Galois/Counter Mode)

AES-GCM provides both confidentiality and authenticity — it is an authenticated encryption scheme meaning the decryption will detect tampering.

**Key Derivation:**
A symmetric key is derived from a SHA-256 hash of the two user IDs (always sorted so both sides derive the same key):

```js
const generateKey = async (userId1, userId2) => {
  const keyString = [userId1, userId2].sort().join('-');
  const keyData = new TextEncoder().encode(keyString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
  return crypto.subtle.importKey(
    'raw', hashBuffer, { name: 'AES-GCM' }, false, ['encrypt']
  );
};
```

**Encryption:**
```js
const encryptMessage = async (message, key) => {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit random IV
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, new TextEncoder().encode(message)
  );
  return JSON.stringify({
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  });
};
```

The 12-byte IV is randomly generated for every message and stored alongside the ciphertext as a JSON payload in the database.

**APIs Used:**
- `crypto.subtle.digest` — SHA-256 hashing
- `crypto.subtle.importKey` — Import raw bytes as a CryptoKey
- `crypto.subtle.encrypt` — AES-GCM encryption
- `crypto.subtle.decrypt` — AES-GCM decryption
- `crypto.getRandomValues` — Cryptographically secure random numbers

**Used in:** `MessagesView.jsx`, `FeedOffersView.jsx`, `PaymentView.jsx`

---

## 11. Frontend – Geolocation & Mapping

### Browser Geolocation API (Native)

```js
export function getDeviceLocation(options = {}) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 10000, enableHighAccuracy: false, maximumAge: 0, ...options }
    );
  });
}
```

Used in `ManagerDiscovery.jsx` for the **"Near Me"** feature. The user's device GPS coordinates are used as the search origin.

### Nominatim OpenStreetMap API (External, Free)

`src/lib/geocoding.js` makes `fetch()` calls to the free OpenStreetMap geocoding API:

```
GET https://nominatim.openstreetmap.org/search?q=Thiruvananthapuram&format=json&limit=1
```

- **No API key required**
- Used to convert text location strings (e.g. "Kochi, Kerala") into `{ lat, lng }` coordinates
- `User-Agent: ArtifyApp/1.0` set per Nominatim usage policy

### Haversine Formula (Custom Implementation)

The **Haversine formula** computes the great-circle distance between two WGS84 coordinates on Earth's surface:

```js
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

Used for:
1. **ManagerDiscovery** — Sorting artists by physical distance from the searcher.
2. **ArtistDashboard** — Sorting booking requests by distance from the artist.

### Kerala District Data (`src/data/keralaDistricts.js`)

A static dataset of all 14 Kerala districts with precise lat/lng coordinates. Enables "search by district" without any external API call:

```js
export const KERALA_DISTRICTS = [
  { value: 'thiruvananthapuram', label: 'Thiruvananthapuram', latitude: 8.5241,  longitude: 76.9366 },
  { value: 'kollam',             label: 'Kollam',             latitude: 8.8932,  longitude: 76.6141 },
  // … 12 more districts …
  { value: 'kasaragod',          label: 'Kasaragod',          latitude: 12.4996, longitude: 74.9869 },
];
```

---

## 12. Frontend – Currency Formatting

### `Intl.NumberFormat` (Native Browser API)

`src/lib/currency.js` uses the browser's built-in Internationalization API to format numbers as Indian Rupees:

```js
const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatINR(amount) {
  return inrFormatter.format(Number(amount || 0));
}
```

**Output examples:**
- `18000` → `₹18,000`
- `150000` → `₹1,50,000` (Indian lakh system)

Used in: `FeedOffersView.jsx`, `ArtistDashboard.jsx`, `ManagerDashboard.jsx`, `PaymentView.jsx`

---

## 13. Frontend – Animation

### tailwindcss-animate
**Package:** `tailwindcss-animate@^1.0.7`

Provides ready-made Tailwind utilities for CSS animations:
- `animate-in`, `animate-out` — entry/exit animation orchestration
- `fade-in`, `fade-out` — opacity transitions
- `slide-in-from-bottom`, `slide-in-from-top` — translate-based entry
- `zoom-in`, `zoom-out` — scale-based transitions

### Custom CSS Animations (Tailwind `@theme`)

Defined directly in `src/index.css`:
```css
@theme {
  --animate-pulse: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  --animate-bounce: bounce 1s infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: .5; }
  }
  @keyframes bounce {
    0%, 100% { transform: translateY(-25%); }
    50%      { transform: translateY(0); }
  }
}
```

Used as: `animate-pulse` (loading skeletons, online indicators) and `animate-spin` (spinner for loading states).

---

## 14. Frontend – Code Quality & Linting

### ESLint v9
**Package:** `eslint@^9.39.1` | **Dev Dependency**

ESLint v9 uses the new **flat config format** (`eslint.config.js` instead of `.eslintrc`). Artify's config:

```js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    // …
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
]);
```

**ESLint Plugins used:**

| Plugin | Package | Purpose |
|--------|---------|---------|
| `eslint-plugin-react-hooks` | `^7.0.1` | Enforces Rules of Hooks (`no-conditional-hooks`, exhaustive deps) |
| `eslint-plugin-react-refresh` | `^0.4.24` | Warns when components can't be hot-reloaded safely |
| `@eslint/js` | `^9.39.1` | Core JS ESLint recommended rules |
| `globals` | `^16.5.0` | Browser global variable definitions (`window`, `navigator`, `localStorage`) |

**TypeScript type hints:**

Although Artify uses JavaScript (not TypeScript), it includes:
- `@types/react@^19.2.7`
- `@types/react-dom@^19.2.3`

These provide IDE auto-complete and type checking support in editors like VS Code via JSDoc inference.

---

## 15. Frontend – Compiler Plugin

### babel-plugin-react-compiler
**Package:** `babel-plugin-react-compiler@^1.0.0` | **Dev Dependency**

The **React Compiler** (formerly React Forget) is an experimental Babel plugin from the React core team. It statically analyses React component and hook source code and **automatically inserts memoization** — replacing many manual `useMemo`, `useCallback`, and `React.memo` calls.

**How it's configured in Artify:**
```js
// vite.config.js
react({
  babel: {
    plugins: [['babel-plugin-react-compiler']],
  },
}),
```

**How it works:**
- At build time, the Babel transform analyses each component.
- It identifies which values are stable (won't change between renders) vs. reactive (depend on state/props).
- It automatically wraps expensive computations and callback functions with equivalent memoization, without the developer writing any `useMemo` calls manually.

This means Artify gets **automatic performance optimisation** at the compiler level.

---

## 16. Backend – Supabase Platform

Supabase is an open-source Firebase alternative built on top of PostgreSQL. It provides a complete BaaS (Backend as a Service) with the following components:

| Supabase Service | Technology Under the Hood | Purpose in Artify |
|-----------------|--------------------------|------------------|
| **Supabase Auth** | GoTrue (Go) | User sign-up, login, email confirmation, JWT tokens |
| **Supabase Database** | PostgreSQL 15+ | All application data |
| **PostgREST** | PostgREST (Haskell) | Auto-generates REST API from PostgreSQL schema |
| **Supabase Realtime** | Elixir / Phoenix Channels | WebSocket subscriptions for live updates |
| **Supabase Storage** | S3-compatible (Go) | Avatar images, background banners |
| **Supabase Edge Functions** | Deno | (Not used in this project) |

### `@supabase/supabase-js`
**Package:** `@supabase/supabase-js@^2.97.0`

The official JavaScript client library. It wraps all Supabase services behind a clean JavaScript API:

```js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

**Environment Variables (`.env`):**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

The `anon` key is the public key. It is safe to expose in the browser because access is enforced by **Row Level Security (RLS)** on the database — users never see rows they're not authorised to see, regardless of the key.

---

## 17. Backend – PostgreSQL Database

PostgreSQL (version 15+) is the database engine powering Artify's backend. It is hosted and managed entirely by Supabase — no infrastructure setup required.

**What PostgreSQL provides to Artify:**

| Feature | Usage |
|---------|-------|
| Relational tables | All core data (profiles, bookings, events, messages, etc.) |
| Foreign keys | Referential integrity (e.g. `bookings.artist_id → artists.id`) |
| `CHECK` constraints | Enum-like validation on `role`, `status`, `payment_status` fields |
| `UUID` primary keys | Globally unique IDs, no auto-increment collisions |
| `TIMESTAMPTZ` | Timezone-aware timestamps for all created_at/updated_at |
| `TEXT[]` (arrays) | `genres`, `tags`, `portfolio_images`, `videos`, `required_roles` |
| `JSONB` | `social_links` field on profiles (flexible key-value) |
| `GIN indexes` | Fast `@>` and `&&` array containment/overlap queries on genres |
| `NUMERIC` | Precise monetary values (offer_amount, base_price) |
| `DOUBLE PRECISION` | lat/lng coordinates |
| PL/pgSQL | Custom server-side functions and triggers |
| Row Level Security | Per-row auth enforcement |

---

## 18. Backend – Authentication

### Supabase Auth (GoTrue)

All authentication in Artify is handled by Supabase's built-in GoTrue authentication service.

**Sign-up flow:**
1. User submits `email`, `password`, `full_name`, `role`, `username` in `Register.jsx`.
2. `supabase.auth.signUp({ email, password, options: { data: { full_name, role, username } } })` is called.
3. GoTrue creates an `auth.users` record.
4. A PostgreSQL trigger (`on_auth_user_created`) fires automatically, creates the `profiles` row AND the matching `artists` or `managers` row.
5. A confirmation email is sent (via Supabase's email service / SMTP).
6. User clicks the email link → `AuthCallback.jsx` handles the redirect.

**Login flow:**
1. User enters email **or** username.
2. If username is entered, a Supabase query resolves the email from `profiles`.
3. `supabase.auth.signInWithPassword({ email, password })` is called.
4. On success, a JWT Session is returned and stored in `localStorage` by the Supabase client.

**Session handling:**
```js
supabase.auth.getSession()            // Initial session check
supabase.auth.onAuthStateChange(...)  // Reactive listener
supabase.auth.setSession({ access_token, refresh_token }) // Manual set (email links)
```

**Auth events handled in `SupabaseContext.jsx`:**
- `SIGNED_IN` — User logged in
- `SIGNED_OUT` — User logged out
- `USER_UPDATED` — Email confirmation completed
- `TOKEN_REFRESHED` — JWT auto-refreshed by client library

---

## 19. Backend – Row Level Security (RLS)

All 11 database tables have **Row Level Security enabled**. This is PostgreSQL's built-in access control system that evaluates a policy expression for every database row before returning it to a query.

**Pattern:**

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (TRUE);  -- Anyone can read profiles

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);  -- Can only update YOUR row
```

**Supabase injects `auth.uid()`** — the UUID of the currently authenticated user from the JWT — into every SQL query. This means the database itself enforces access control, not just the application layer.

**RLS policies across all tables:**

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `profiles` | Public (all) | Own only (`auth.uid() = id`) | Own only | — |
| `artists` | Public (all) | Own only | Own only | — |
| `managers` | Public (all) | Own only | Own only | — |
| `events` | Published & public | Managers (own) | Own events | Own events |
| `bookings` | Own bookings (artist or organizer) | Artists insert | Artist / Organizer | — |
| `collaborations` | Public | Authenticated | Own | Own |
| `posts` | Public | Authenticated | Own | Own |
| `messages` | Own (sender or receiver) | Authenticated | — | — |
| `follows` | Public | Own (follower = uid) | Own | Own (unfollow) |
| `artist_ratings` | Public | Own (rater = uid, no self-rate) | Own | Own |

---

## 20. Backend – Realtime Subscriptions

Supabase Realtime uses an Elixir/Phoenix server to broadcast PostgreSQL changes to connected WebSocket clients. Artify uses realtime in two views:

### CommunityFeed — Trending Artist Updates

```js
const channel = supabase
  .channel(`feed-live-${user.id}`)
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => {
    loadFeed();
  })
  .on('postgres_changes', { event: '*', schema: 'public', table: 'artists' }, () => {
    loadFeed();
  })
  .on('postgres_changes', { event: '*', schema: 'public', table: 'artist_ratings' }, () => {
    loadFeed();
  })
  .subscribe();
```

When any artist rating is added/updated, the trending banner **automatically refreshes** to reflect the new ranking.

### MessagesView — Live Chat

```js
const channel = supabase
  .channel(`messages-${conversationId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `receiver_id=eq.${user.id}`
  }, (payload) => {
    // Append new message to state
  })
  .subscribe();
```

Real-time updates for new incoming messages without polling. The channel is cleaned up (`channel.unsubscribe()`) when navigating away.

---

## 21. Backend – Storage

Supabase Storage provides S3-compatible object storage used in Artify for:

1. **Avatar images** — User profile photos (cropped via `react-easy-crop` before upload)
2. **Background banners** — Profile header/banner images

**Upload pattern:**
```js
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${user.id}/avatar.jpg`, file, {
    contentType: 'image/jpeg',
    upsert: true,
  });

const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${user.id}/avatar.jpg`);
```

The `publicUrl` is then saved to `profiles.avatar_url`.

Storage buckets use **public access** for reading (any URL works) but **RLS-equivalent bucket policies** ensure only the owner can upload to their own path.

---

## 22. Backend – PostgreSQL Extensions

Enabled via `database/s1_extensions.sql`:

### uuid-ossp
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

Provides `uuid_generate_v4()` function used as the default primary key generator for all tables:
```sql
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY
```

UUID v4 generates cryptographically random 128-bit identifiers, ensuring globally unique IDs with no coordination required.

### pg_trgm
```sql
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

The **trigram-based text search extension**. Enables:
- `ILIKE` queries on indexed text without full sequential scans
- `%word%` pattern matching at scale
- Future `similarity()` based fuzzy matching

In Artify this supports the `ilike` queries in ManagerDiscovery (search by stage name, username, full name, location, bio).

---

## 23. Backend – Database Functions & Triggers

All custom logic is in `database/s6_functions_triggers.sql` and `database/s16_artist_ratings.sql`.

### `handle_new_user()` — Auto Profile Creation

This PL/pgSQL trigger function fires automatically after every new `auth.users` INSERT:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  candidate_username TEXT;
  suffix INTEGER := 0;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'artist');

  -- Auto-generate unique username from email prefix
  base_username := REGEXP_REPLACE(LOWER(split_part(NEW.email, '@', 1)), '[^a-z0-9_]', '_', 'g');
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate_username) LOOP
    suffix := suffix + 1;
    candidate_username := base_username || '_' || suffix::TEXT;
  END LOOP;

  -- Create profile row
  INSERT INTO public.profiles (id, email, role, full_name, username)
  VALUES (NEW.id, NEW.email, user_role, user_full_name, candidate_username);

  -- Create artist or manager sub-record
  IF user_role = 'artist' THEN
    INSERT INTO public.artists (id, stage_name) VALUES (NEW.id, user_full_name);
  ELSE
    INSERT INTO public.managers (id, company_name) VALUES (NEW.id, user_full_name);
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed: %', SQLERRM;
    RETURN NEW; -- Never block auth signup
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### `handle_updated_at()` — Automatic Timestamp

Applied to every table via separate triggers:
```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### `refresh_artist_rating_summary()` — Live Rating Aggregation

```sql
CREATE OR REPLACE FUNCTION public.refresh_artist_rating_summary(target_artist_id UUID)
RETURNS VOID AS $$
BEGIN
  SELECT ROUND(COALESCE(AVG(rating::NUMERIC), 0)::NUMERIC, 2), COUNT(*)::INTEGER
  INTO avg_rating, rating_count
  FROM public.artist_ratings WHERE artist_id = target_artist_id;

  UPDATE public.artists
  SET rating = avg_rating, total_ratings = rating_count, updated_at = NOW()
  WHERE id = target_artist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

This runs automatically after every INSERT/UPDATE/DELETE on `artist_ratings` via the `handle_artist_rating_change` trigger, keeping `artists.rating` and `artists.total_ratings` always in sync.

### `check_username_availability()` — Unique Username Check

```sql
CREATE OR REPLACE FUNCTION public.check_username_availability(check_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE username = LOWER(check_username)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Called from `Register.jsx` to give real-time username availability feedback.

---

## 24. Backend – Database Schema Tables

### Table: `public.profiles`

The central user table. Every authenticated user has exactly one row.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID` | FK → `auth.users.id` (CASCADE DELETE) |
| `email` | `TEXT UNIQUE` | Login email |
| `username` | `TEXT UNIQUE` | URL-safe handle |
| `full_name` | `TEXT` | Display name |
| `avatar_url` | `TEXT` | Supabase Storage URL |
| `background_url` | `TEXT` | Profile banner image URL |
| `role` | `TEXT` | `CHECK IN ('artist', 'manager')` |
| `bio` | `TEXT` | Free-text biography |
| `location` | `TEXT` | Human-readable location string |
| `latitude` | `DOUBLE PRECISION` | GPS latitude |
| `longitude` | `DOUBLE PRECISION` | GPS longitude |
| `website` | `TEXT` | Personal/business website |
| `social_links` | `JSONB` | `{ instagram: "...", youtube: "..." }` |
| `is_verified` | `BOOLEAN` | Manually set verified badge |
| `followers_count` | `INTEGER` | Denormalized follower count |
| `created_at` | `TIMESTAMPTZ` | Auto-set |
| `updated_at` | `TIMESTAMPTZ` | Auto-updated via trigger |

### Table: `public.artists`

One-to-one extension of `profiles` for artist-specific fields.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID` | FK → `profiles.id` (CASCADE DELETE) |
| `stage_name` | `TEXT` | Artist's performing name |
| `genres` | `TEXT[]` | Array: `['indie', 'pop']` |
| `price_range` | `TEXT` | e.g. `'mid'`, `'premium'` |
| `base_price` | `NUMERIC` | Starting rate in INR |
| `rating` | `DECIMAL(3,2)` | Aggregate rating (0.00–5.00) |
| `total_ratings` | `INTEGER` | Count of individual ratings |
| `total_gigs` | `INTEGER` | Completed performance count |
| `tags` | `TEXT[]` | Freeform searchable tags |
| `portfolio_images` | `TEXT[]` | Image URLs |
| `videos` | `TEXT[]` | Video URLs |
| `is_available` | `BOOLEAN` | Active booking status |

### Table: `public.managers`

One-to-one extension for manager/organizer data.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID` | FK → `profiles.id` |
| `company_name` | `TEXT` | Events company name |
| `company_type` | `TEXT` | e.g. `'boutique'`, `'agency'` |
| `total_events` | `INTEGER` | Total events organised |
| `upcoming_events` | `INTEGER` | Upcoming event count |

### Table: `public.events`

Event listings created by managers.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID` | PK |
| `organizer_id` | `UUID` | FK → `managers.id` |
| `title` | `TEXT` | Event name |
| `description` | `TEXT` | Event details |
| `event_date` | `TIMESTAMPTZ` | Start date/time |
| `location` | `TEXT` | Venue location text |
| `budget_min/max` | `NUMERIC` | Budget range in INR |
| `status` | `TEXT` | `draft / published / cancelled / completed` |
| `required_roles` | `TEXT[]` | Needed artist types |
| `visibility` | `TEXT` | `public / private` |

### Table: `public.bookings`

Links an artist to an event. The booking lifecycle.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID` | PK |
| `event_id` | `UUID` | FK → `events.id` |
| `artist_id` | `UUID` | FK → `artists.id` |
| `organizer_id` | `UUID` | FK → `managers.id` |
| `status` | `TEXT` | `pending / accepted / declined / cancelled / completed` |
| `payment_status` | `TEXT` | `unpaid / paid` |
| `paid_at` | `TIMESTAMPTZ` | Payment timestamp |
| `offer_amount` | `NUMERIC` | Agreed fee in INR |
| `message` | `TEXT` | Booking request message |
| `event_date` | `TIMESTAMPTZ` | Copied from event for quick access |

### Table: `public.messages`

Direct messages between users (encrypted content stored as JSON string).

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID` | PK |
| `sender_id` | `UUID` | FK → `profiles.id` |
| `receiver_id` | `UUID` | FK → `profiles.id` |
| `content` | `TEXT` | AES-GCM encrypted JSON payload |
| `is_read` | `BOOLEAN` | Read receipt flag |
| `created_at` | `TIMESTAMPTZ` | Message time |

### Table: `public.posts`

Community feed posts (text + optional image + tags).

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID` | PK |
| `author_id` | `UUID` | FK → `profiles.id` |
| `content` | `TEXT` | Post body (cannot be empty) |
| `location` | `TEXT` | Optional location tag |
| `image_url` | `TEXT` | Optional post image |
| `tags` | `TEXT[]` | Hashtag-style tags |

### Table: `public.collaborations`

Artist-to-artist collaboration requests.

| Column | Type | Notes |
|--------|------|-------|
| `collaboration_type` | `TEXT` | `gig / collab / band_member / session` |
| `status` | `TEXT` | `open / closed / filled` |
| `is_remote` | `BOOLEAN` | Remote-friendly flag |

### Table: `public.follows`

Many-to-many follow relationships between users.

| Column | Type | Notes |
|--------|------|-------|
| `follower_id` | `UUID` | Who is following |
| `following_id` | `UUID` | Who is being followed |
| PK | `(follower_id, following_id)` | Composite, prevents duplicates |
| CONSTRAINT | `no_self_follow` | `follower_id <> following_id` |

### Table: `public.artist_ratings`

Individual artist ratings (1–5 stars + optional comment).

| Column | Type | Notes |
|--------|------|-------|
| `artist_id` | `UUID` | FK → `artists.id` |
| `rater_id` | `UUID` | FK → `profiles.id` |
| `rating` | `SMALLINT` | 1–5 CHECK constraint |
| `comment` | `TEXT` | Optional review text |
| UNIQUE | `(artist_id, rater_id)` | One rating per user per artist |
| CONSTRAINT | `no_self_rating` | `artist_id <> rater_id` |

---

## 25. Backend – Indexes & Query Optimization

All index definitions live in `database/s4_indexes.sql`. Indexes ensure fast lookups as data grows.

| Index | Column(s) | Type | Purpose |
|-------|-----------|------|---------|
| `idx_profiles_username` | `profiles(username)` | BTree | Username lookup during login |
| `idx_profiles_email` | `profiles(email)` | BTree | Email-based auth queries |
| `idx_profiles_role` | `profiles(role)` | BTree | Filter artists vs managers |
| `idx_artists_genres` | `artists(genres)` | **GIN** | Array `@>` / `&&` containment queries |
| `idx_artists_stage_name` | `artists(stage_name)` | BTree | Stage name ILIKE search |
| `idx_artists_available` | `artists(is_available)` | BTree | Available-only filter |
| `idx_events_organizer` | `events(organizer_id)` | BTree | Manager's event list |
| `idx_events_status` | `events(status)` | BTree | Published events filter |
| `idx_events_date` | `events(event_date)` | BTree | Chronological ordering |
| `idx_bookings_artist` | `bookings(artist_id)` | BTree | Artist's bookings list |
| `idx_bookings_organizer` | `bookings(organizer_id)` | BTree | Manager's bookings list |
| `idx_bookings_status` | `bookings(status)` | BTree | Status-based filtering |
| `idx_bookings_payment_status` | `bookings(payment_status)` | BTree | Unpaid filter in PaymentView |
| `idx_messages_sender_created` | `messages(sender_id, created_at DESC)` | BTree | Conversation history |
| `idx_messages_receiver_created` | `messages(receiver_id, created_at DESC)` | BTree | Inbox queries |
| `idx_posts_author_created` | `posts(author_id, created_at DESC)` | BTree | Profile post feed |
| `idx_posts_created` | `posts(created_at DESC)` | BTree | Global post feed |
| `idx_artist_ratings_artist_id` | `artist_ratings(artist_id)` | BTree | Ratings per artist |
| `idx_artist_ratings_updated_at_desc` | `artist_ratings(updated_at DESC)` | BTree | Latest ratings |
| `idx_follows_follower` | `follows(follower_id)` | BTree | Who user follows |
| `idx_follows_following` | `follows(following_id)` | BTree | User's followers |

**GIN Index explained:** The `idx_artists_genres` GIN (Generalised Inverted Index) index is specifically designed for PostgreSQL array operations. It enables extremely fast `genres @> ARRAY['indie']` (contains) and `genres && ARRAY['indie', 'Indie']` (overlaps) queries — the core of Artify's genre search functionality.

---

## 26. External APIs Used

| API | Endpoint | Auth | Purpose |
|-----|----------|------|---------|
| **Nominatim (OpenStreetMap)** | `https://nominatim.openstreetmap.org/search` | None (User-Agent required) | Convert location text → lat/lng |
| **RandomUser.me** | `https://randomuser.me/api/portraits/...` | None | Seed data avatar images |
| **Unsplash** | `https://images.unsplash.com/...` | None (public CDN) | Seed data background images |
| **Pravatar** | `https://i.pravatar.cc/150?u={id}` | None | Fallback avatar generation |

---

## 27. Development Scripts & Tooling

### Seed Script (`scripts/seed-dummy-users.mjs`)

A Node.js ES Module script that:
1. Reads dummy user definitions (15 users: 10 artists + 5 managers)
2. Creates `auth.users` entries via Supabase Admin API (`service_role` key)
3. Writes a CSV (`database/seed_15_users_credentials.csv`) with all created user credentials

```bash
npm run seed:dummy-users
```

Uses:
- `node:fs`, `node:path`, `node:url` — Node built-in file system modules
- `@supabase/supabase-js` — Supabase client with `service_role` key for admin operations

### Supabase SQL Migration Files

Sequential `.sql` files in `database/` representing the schema migration history:

| File | Purpose |
|------|---------|
| `s1_extensions.sql` | Enable uuid-ossp, pg_trgm |
| `s2_clean_slate.sql` | DROP all for fresh reinstall |
| `s3_core_tables.sql` | All 9 core tables |
| `s4_indexes.sql` | All performance indexes |
| `s5_rls_policies.sql` | All Row Level Security policies |
| `s6_functions_triggers.sql` | PL/pgSQL functions and triggers |
| `s7_signup_auth_diagnostics_repair.sql` | Auth troubleshooting utilities |
| `s8_auth_admin_test_queries.sql` | Admin test queries |
| `s9_storage_bucket_notes.sql` | Storage setup documentation |
| `s10_dashboard_checklist.sql` | Feature verification queries |
| `s11_fix_bookings_insert_rls.sql` | Booking insert RLS fix |
| `s12_seed_15_dummy_data.sql` | Seed 15 dummy profiles |
| `s13_add_location_coords.sql` | Add lat/lng columns to profiles |
| `s14_add_event_visibility.sql` | Add visibility column to events |
| `s15_add_booking_payment_status.sql` | Add payment tracking to bookings |
| `s16_artist_ratings.sql` | Artist rating system + trigger |

---

## 28. Security Measures

### Client-Side Security

| Measure | Implementation |
|---------|---------------|
| **Environment variables** | Supabase keys in `.env`, prefixed `VITE_` for Vite injection. Not hardcoded. |
| **AES-GCM message encryption** | All messages encrypted before storage; server receives only ciphertext |
| **Random IV per message** | Each message uses a unique 96-bit IV preventing pattern analysis |
| **No service_role key on client** | Only `anon` key used in frontend; `service_role` only in seed script |
| **Auth state from JWT** | User identity never trusted from client request body; always from JWT |

### Server-Side Security (PostgreSQL RLS)

| Measure | Implementation |
|---------|---------------|
| **RLS on all tables** | No table is accessible without matching policy |
| **`auth.uid()` in policies** | Identity provided by JWT; cannot be spoofed |
| **CHECK constraints** | Enum validation on database level (role, status, payment_status) |
| **No self-follow** | `CHECK (follower_id <> following_id)` constraint |
| **No self-rating** | `CHECK (artist_id <> rater_id)` in artist_ratings |
| **Unique ratings** | `UNIQUE (artist_id, rater_id)` — one rating per person per artist |
| **SECURITY DEFINER** | PL/pgSQL functions call `SECURITY DEFINER` to run with elevated database role, not caller's permissions |
| **`set search_path = public`** | Prevents search_path hijacking attacks in functions |

---

## 29. Data Models & Relationships

```
auth.users (Supabase managed)
     │
     │ 1:1 (trigger on INSERT)
     ▼
public.profiles ──────────────────────────────────┐
     │                                            │
     │ 1:1                            1:1         │
     ▼                                ▼           │
public.artists              public.managers       │
     │                                │           │
     │ 1:N                      1:N   │           │
     ▼                          ▼     │           │
public.bookings ◄─────────── public.events        │
     │                              (organizer_id)│
     │                                            │
     │                                            │ N:M (follows)
     │                    public.follows ─────────┘
     │
     │ (artist_id)
     ▼
public.artist_ratings (many per artist, one per rater)


public.profiles
     │
     │ 1:N
     ├─────────► public.posts
     │
     │ 1:N
     └─────────► public.collaborations


public.profiles (sender)────►
public.profiles (receiver)──►  public.messages
```

---

## 30. Full Package Dependency Reference

### Production Dependencies

| Package | Version | Category | Purpose |
|---------|---------|----------|---------|
| `@supabase/supabase-js` | `^2.97.0` | Backend Client | Supabase database, auth, storage, realtime |
| `@tailwindcss/vite` | `^4.2.0` | Styling | Tailwind CSS v4 Vite integration plugin |
| `lucide-react` | `^0.575.0` | UI Icons | 1000+ SVG icon components |
| `react` | `^19.2.0` | Core Framework | UI rendering library |
| `react-dom` | `^19.2.0` | Core Framework | React DOM renderer |
| `react-easy-crop` | `^5.5.6` | UI Component | Interactive image cropping |
| `react-icons` | `^5.5.0` | UI Icons | Multi-library icon pack |
| `react-router-dom` | `^7.13.0` | Routing | SPA client-side routing |
| `tailwindcss` | `^4.2.0` | Styling | Utility-first CSS framework |
| `tailwindcss-animate` | `^1.0.7` | Styling | Tailwind animation utilities plugin |

### Development Dependencies

| Package | Version | Category | Purpose |
|---------|---------|----------|---------|
| `@eslint/js` | `^9.39.1` | Linting | ESLint core JS config |
| `@types/react` | `^19.2.7` | Type Hints | React TypeScript definitions (IDE support) |
| `@types/react-dom` | `^19.2.3` | Type Hints | ReactDOM TS definitions (IDE support) |
| `@vitejs/plugin-react` | `^5.1.1` | Build | Vite React HMR + JSX transform plugin |
| `babel-plugin-react-compiler` | `^1.0.0` | Compiler | Auto-memoization via React Compiler |
| `eslint` | `^9.39.1` | Linting | JavaScript static analysis |
| `eslint-plugin-react-hooks` | `^7.0.1` | Linting | Enforces React Hooks rules |
| `eslint-plugin-react-refresh` | `^0.4.24` | Linting | Vite HMR compatibility checks |
| `globals` | `^16.5.0` | Linting | Browser global definitions for ESLint |
| `vite` | `^7.3.1` | Build Tool | Dev server + production bundler |

### Native Browser APIs (No Package Install Required)

| API | Used Via | Purpose |
|-----|----------|---------|
| `crypto.subtle` | Built-in | AES-GCM encryption/decryption |
| `crypto.getRandomValues` | Built-in | Secure random IV generation |
| `navigator.geolocation` | Built-in | Device GPS coordinates |
| `Intl.NumberFormat` | Built-in | INR currency formatting |
| `localStorage` | Built-in | Tab-seen badge tracking |
| `Canvas API` | Built-in | Image cropping pixel operations |
| `fetch` | Built-in | Nominatim geocoding HTTP calls |
| `TextEncoder` | Built-in | Encode strings for crypto operations |
| `URL` / `URLSearchParams` | Built-in | URL parsing in auth callback |
| `WebSocket` | Built-in (via Supabase) | Realtime subscriptions |

---

*This report covers the complete technology stack of the Artify platform as of March 2026. All dependencies are current stable releases. The architecture prioritises zero-backend-cost development by leveraging Supabase BaaS fully, native browser APIs for cryptography and location, and React 19 with compiler-level optimisation for UI performance.*
