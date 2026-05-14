# External Integrations

**Analysis Date:** 2026-05-14

## APIs & External Services

**Supabase (primary backend):**
- Database: PostgreSQL via Supabase - all CRs, comments, teams, users
  - SDK: `@supabase/supabase-js` 2.101
  - Client: `src/integrations/supabase/client.ts`
  - Auth: `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`
- Auth: Supabase Auth - Google OAuth + email/password
- Storage: Supabase Storage bucket `artifact-uploads` - user-uploaded images
- Realtime: Supabase Realtime channels - live updates on `critique_requests`, `reviewers`, `comments`, `cr_events`
- Edge Functions: Supabase Edge Functions (Deno) - `fetch-artifact-thumbnails`

**Figma (embed + thumbnail):**
- Figma embeds: iframes via `https://www.figma.com/embed?embed_host=lensflare&url=...` in `src/pages/CRDetail.tsx`
- Figma thumbnail fetching: oEmbed API (`https://www.figma.com/api/oembed`) in `supabase/functions/fetch-artifact-thumbnails/index.ts`
- Fallback: HTML scrape of og:image meta tag from Figma page
- Auth: None (public oEmbed endpoint; embed access depends on Figma sharing settings)

**Loom (embed + thumbnail):**
- Loom embeds: iframes via `https://www.loom.com/embed/{videoId}` in `src/pages/CRDetail.tsx`
- Loom thumbnails: CDN pattern `https://cdn.loom.com/sessions/thumbnails/{id}-with-play.gif` in edge function
- Auth: None (public CDN)

**Google Fonts:**
- Loaded via CSS `@import` in `src/index.css`
- Fonts: DM Sans (body) + Space Grotesk (headings)
- No API key required

**DiceBear Avatars:**
- Fallback avatar generation: `https://api.dicebear.com/7.x/avataaars/svg?seed={userId}`
- Used in `src/integrations/supabase/client.ts` trigger logic and `src/data/mockData.ts`
- No API key required

## Data Storage

**Database:**
- Provider: Supabase Postgres (hosted)
- Connection: `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key, RLS-enforced)
- Client: `@supabase/supabase-js` via `src/integrations/supabase/client.ts`
- Generated types: `src/integrations/supabase/types.ts`

**File Storage:**
- Provider: Supabase Storage bucket `artifact-uploads`
- Path convention: `{userId}/{timestamp}-{random}.{ext}`
- Max file size: 10MB (enforced client-side in `src/pages/CreateCR.tsx`)
- Image types only (enforced client-side)
- RLS policy: upload path must start with authenticated user's ID

**Client-side Storage:**
- `localStorage` key `lensflare-active-team` - persists active team selection (`src/context/TeamContext.tsx`)
- `sessionStorage` key `crTourSeen` - prevents tour auto-start on repeat visits (`src/pages/CreateCR.tsx`)
- Supabase session: `localStorage` (configured in `src/integrations/supabase/client.ts`)

**Caching:**
- TanStack Query `QueryClient` mounted in `App.tsx` but not actively used for data fetching
- No other caching layer

## Authentication & Identity

**Auth Provider:** Supabase Auth
- Google OAuth - primary auth path
- Email/password - secondary path
- Session persistence: `localStorage`
- Auto token refresh: enabled
- Profile auto-creation: PostgreSQL trigger `handle_new_user()` on `auth.users` insert
- Profile sync: Google avatar and name synced to `profiles` table on every auth state change (`src/context/AuthContext.tsx`)
- Admin roles: `user_roles` table + `has_role()` RPC function - checked on login

## Monitoring & Observability

**Error Tracking:** None configured

**Logs:**
- Supabase Edge Function logs via Supabase dashboard
- No frontend error tracking (no Sentry, Datadog, etc.)
- Errors surfaced to users via `sonner` toast notifications

## CI/CD & Deployment

**Hosting:** Vercel (Hobby tier, personal account `markhazlewood42`)
- Automatic deploys from `main` branch of `github.com/markhazlewood42/lens-flare`
- SPA routing via `vercel.json` rewrite rule

**CI Pipeline:** None (no GitHub Actions, no test automation on push)

**Database Migrations:** Manual - run via Supabase dashboard or CLI. 10 numbered migrations in `supabase/migrations/`

## Environment Configuration

**Required env vars:**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key (safe to expose client-side, RLS enforces authorization)

**Secrets location:**
- `.env.local` - local development (gitignored)
- Vercel dashboard - production environment variables
- Supabase Edge Function env: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by Supabase into edge functions (not in repo)

## Webhooks & Callbacks

**Incoming:**
- Supabase Realtime websocket subscriptions (not HTTP webhooks) - managed by `@supabase/supabase-js` client

**Outgoing:**
- None configured

---

*Integration audit: 2026-05-14*
