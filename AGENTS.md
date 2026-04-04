# Agents — LensFlare

## Project overview

LensFlare is a standalone design critique web app (Vite + React 18 + TS + Tailwind + shadcn/ui + Supabase). The core abstraction is the Critique Request (CR), which follows a PR-like lifecycle. This is a personal project, not a HubSpot repo.

## Workspace layout

```
personal-projects/lens-flare/
  src/
    App.tsx                    # Root: routing, auth gate, team gate, provider tree
    types/cr.ts                # Domain types and constants (CR, Artifact, Reviewer, Comment, etc.)
    context/
      AuthContext.tsx           # Supabase auth session, profile, admin role
      CRContext.tsx             # Live CR data (Supabase queries + realtime)
      DemoCRContext.tsx         # Mock CR data for demo mode
      TeamContext.tsx           # Team membership, switching, invites
      DemoTeamContext.tsx       # Mock team data for demo mode
      DemoModeContext.tsx       # Demo mode toggle
      OnboardingContext.tsx     # First-run tour state
    pages/
      Auth.tsx                 # Google OAuth sign-in
      Dashboard.tsx            # Personal CR overview
      Feed.tsx                 # Team-wide CR feed
      CreateCR.tsx             # New/edit CR form
      CRDetail.tsx             # Full CR view (artifacts, reviewers, comments, timeline)
      Settings.tsx             # User profile
      TeamDetail.tsx           # Team management
      TeamSetup.tsx            # First-run team creation/join
    components/                # Shared components (Header, CRCard, StatusPill, etc.)
    components/ui/             # shadcn/ui primitives (do not edit directly)
    hooks/                     # Custom hooks
    integrations/supabase/     # Supabase client + generated DB types
  supabase/
    migrations/                # 10 SQL migrations (schema, RLS, realtime, teams)
    functions/                 # Edge functions
    config.toml                # Supabase project config
```

## Key architecture decisions

### Dual-mode (real + demo)

The app runs in two modes, switched by `CRProviderSwitch` in `App.tsx`:
- **Real mode:** `CRContext` + `TeamContext` query Supabase with realtime subscriptions
- **Demo mode:** `DemoCRContext` + `DemoTeamContext` provide in-memory mock data

Both context pairs expose the same interface. Any feature touching CR display or interaction must work in both modes.

### Auth and access

- Google OAuth via Supabase Auth
- `AuthContext` manages session, syncs Google profile data, checks admin role via `has_role` RPC
- Protected routes redirect to `/auth` without a session
- `TeamGate` requires at least one team membership before accessing the app

### Database

Supabase Postgres with 10 tables, full RLS, realtime on 4 tables. Schema is defined across sequential migrations in `supabase/migrations/`. Key tables: `critique_requests`, `artifacts`, `reviewers`, `comments`, `cr_events`, `teams`, `team_members`, `team_invites`.

## Working with this project

### Commands

```bash
bun install                # Install dependencies
bun dev                    # Dev server at localhost:8080
bun run build              # Production build
bun run lint               # ESLint
bun test                   # Vitest
```

### Environment

Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Never commit `.env.local`.

### Rules

- This is NOT a HubSpot repo. Use bun/npm, not bend. Do not use devex-mcp-server or HubSpot-internal tools.
- Use `--registry https://registry.npmjs.org` if installing via npm.
- Do not modify files in `src/components/ui/` directly. Those are shadcn/ui generated primitives.
- When adding CR features, update both `CRContext` and `DemoCRContext` to keep demo mode functional.
- Supabase migrations are numbered sequentially (01-10). New migrations should continue the numbering.
- All tables use RLS. New tables or policies must follow the existing pattern (authenticated users can read, authors/owners can write).

### Known Lovable migration debt

1. Supabase project ID `xqwrgrwotnaudbshpbmw` is Lovable-provisioned. May need migration.
2. Figma embed `embed_host=lovable` in `CRDetail.tsx` should be updated.
3. No CI/CD or hosting configured yet. Domain `lensflare.design` is secured.
