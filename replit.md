# MedStudent

A Nigerian medical student community app — posts, communities, AI chatbot, and study tools for health science students.

## Run & Operate

- `pnpm --filter @workspace/medical-app run dev` — run the frontend (port 20087, preview at `/`)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, preview at `/api`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind v4 + wouter (routing) + @supabase/supabase-js
- API: Express 5 + @google/generative-ai (Gemini)
- DB: PostgreSQL (Supabase) + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/medical-app/src/` — React frontend
  - `pages/` — all route pages (HomePage, ChatbotPage, LoginPage, etc.)
  - `components/` — shared components (AppShell, Sidebar, BottomNav, PostCard, etc.)
  - `lib/supabase.ts` — Supabase browser client (singleton)
  - `lib/userPrefs.ts` — localStorage-based onboarding preferences
  - `App.tsx` — wouter router with all routes
  - `index.css` — CSS variables, design tokens, global styles
- `artifacts/api-server/src/routes/chat.ts` — `/api/chat` endpoint (Gemini AI)
- `artifacts/api-server/src/routes/index.ts` — route registry

## Architecture decisions

- Routing via wouter (not React Router) — lighter, path-based, uses `import.meta.env.BASE_URL`
- Supabase auth is browser-side only — `@supabase/supabase-js` directly (no SSR client)
- AI chatbot hits `/api/chat` which is proxied by Vite dev server to the API server on port 8080
- OnboardingModal fires on first visit (localStorage check); profession/name stored locally
- All inline styles (no Tailwind classes in JSX) — design tokens via CSS custom properties

## Product

- **Home Feed** — posts sorted by hot/new/top, announcement banner, community sidebar
- **Communities** — scoped post views per community (`/c/:slug`)
- **Post Detail** — full post + comment thread with voting
- **AI Chatbot** — Gemini 1.5 Flash with medical system prompt, markdown rendering
- **Profiles** — user profile pages with post history
- **Admin Panel** — role management, post moderation (admin/super_admin only)
- **Settings** — profile editing, profession, password change, logout
- **Onboarding** — profession picker modal on first visit

## Required Secrets

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key
- `GEMINI_API_KEY` — Google AI Studio API key

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Vite proxies `/api/*` to `localhost:8080` (the API server) in dev
- `@supabase/supabase-js` must be a direct dependency of medical-app (not just ssr package)
- CSS variables define the entire design system — avoid hardcoded colors in components
- wouter Router base must strip trailing slash from `import.meta.env.BASE_URL`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
