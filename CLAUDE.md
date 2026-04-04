# Claude Code — LensFlare

## What this project is

LensFlare is a standalone web app for structured design critique. The core abstraction is the Critique Request (CR), which follows a PR-like lifecycle: draft > open > in-review > changes-requested > approved > closed. It's an orchestration tool, not an annotation tool.

This is a personal project (not a HubSpot repo). Use standard npm/bun commands, not bend or HubSpot-internal tooling.

## Stack

- **Vite + React 18 + TypeScript** (SWC compiler)
- **Tailwind CSS + shadcn/ui** (Radix primitives in `src/components/ui/`)
- **Supabase** for everything backend: Postgres, Auth (Google OAuth), Realtime subscriptions, Edge Functions, Storage
- **React Context** for state (AuthContext, CRContext, TeamContext, DemoModeContext, OnboardingContext)
- **TanStack Query** for server state caching
- **Bun** as the package manager (bun.lockb present), npm also works

## Key conventions

### Domain model

The domain types live in `src/types/cr.ts`. The core entities:
- `CritiqueRequest` — the unit of work (has status, design_stage, artifacts, reviewers, comments, events)
- `Artifact` — attached design assets (Figma, image, Loom, FigJam, URL)
- `Reviewer` — assigned reviewer with individual status tracking
- `Comment` — typed (suggestion/question/blocker/praise), threaded, resolvable
- `CREvent` — audit log entries

### Dual-mode architecture

The app has a real mode (Supabase-backed) and a demo mode (all mock data in context providers). The switching happens in `App.tsx` via `CRProviderSwitch`:
- Real: `CRContext` + `TeamContext` (Supabase queries + realtime)
- Demo: `DemoCRContext` + `DemoTeamContext` (in-memory mock data)

When adding features to CR display or interaction, both contexts need to implement the same interface or the demo mode will break.

### Auth flow

Google OAuth via Supabase Auth. The `AuthContext` handles session management, profile syncing (including Google avatar), and admin role checking via the `has_role` RPC. Protected routes redirect to `/auth` if no session.

### Team model

Multi-team support with admin/member roles. Users must belong to at least one team (enforced by `TeamGate` in `App.tsx`). First-run users hit `TeamSetup` to create or join a team.

### Supabase

- Client is initialized in `src/integrations/supabase/client.ts` using env vars
- Generated types in `src/integrations/supabase/types.ts`
- Migrations in `supabase/migrations/` (numbered 01-10, sequential)
- All tables have RLS enabled. Policies enforce: authors manage their own CRs, reviewers update their own status, all authenticated users can read
- Realtime subscriptions on: critique_requests, reviewers, comments, cr_events
- Edge function: `fetch-artifact-thumbnails` for generating preview images

### Environment

Two env vars required (see `.env.example`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

The `.env.local` file has the actual values. Never commit it.

### Styling

- Warm orange gradient palette, DM Sans + Space Grotesk fonts, dark mode support
- shadcn/ui components in `src/components/ui/` (do not modify these directly, regenerate via shadcn CLI if needed)
- Custom components in `src/components/`
- Design tokens for CR status and design stage colors defined in `src/types/cr.ts` constants

## Commands

```bash
bun dev          # Start dev server (localhost:8080)
bun run build    # Production build
bun run lint     # ESLint
bun test         # Vitest (run once)
bun run test:watch  # Vitest (watch mode)
```

## What's next

This was originally a Lovable prototype. Known migration items:
1. Supabase project `xqwrgrwotnaudbshpbmw` is the Lovable-provisioned instance. May need to migrate to a self-managed Supabase project.
2. Figma embed in `CRDetail.tsx` uses `embed_host=lovable`. Should be updated.
3. No CI/CD pipeline yet. Domain (lensflare.design) is secured but hosting isn't set up.

## Don't

- Don't use HubSpot-internal tools (bend, devex-mcp-server, chirp). This is a personal project.
- Don't modify shadcn/ui primitives in `src/components/ui/` directly. Use the shadcn CLI to update them.
- Don't add features to real mode without considering the demo mode parallel. Both context providers need to stay in sync.
- Don't commit `.env.local` or Supabase secrets.
