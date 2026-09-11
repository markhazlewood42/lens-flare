---
type: status
title: LensFlare — Project Status
project: lens-flare
created: 2026-03-31
updated: 2026-08-26
tags: [status]
memory: [project_lensflare]
---

# LensFlare

## Overview
Design critique orchestration tool — the "Pull Request" for design review. Tracks the lifecycle of design critiques across tools (Figma, Loom, FigJam, prototypes).

## Current Status
**Phase:** Migration complete, deployed to Vercel
**Last updated:** 2026-04-03

## Deployment
- **Live URL:** https://lens-flare.vercel.app/
- **Domain:** lensflare.design (purchased, not yet pointed — blocked by work computer DNS)
- **Hosting:** Vercel (Hobby tier, personal account markhazlewood42)
- **Repo:** github.com/markhazlewood42/lens-flare (main branch)
- **Backend:** Supabase (own project, own account)
- **Edge Function:** `fetch-artifact-thumbnails` deployed via Supabase dashboard

## Key Dates
- **PRD drafted:** 2026-03-30
- **Lovable prototype built:** 2026-03-30 to 2026-03-31
- **Source exported:** 2026-04-02
- **Migration completed:** 2026-04-03
- **Deployed to Vercel:** 2026-04-03

## What Happened
- 2026-03-30: DPG UX Team Time meeting surfaced critique workflow problems — low visibility, inconsistent async feedback, no accountability
- 2026-03-30: Mark proposed "CritRequest" concept (design equivalent of a PR). PRD drafted
- 2026-03-30: Named the tool **LensFlare** (lens = perspective, flare = signal). CRs (crit requests) remain the unit of work
- 2026-03-30: Secured domain **lensflare.design**
- 2026-03-30 to 2026-03-31: Built full working prototype in Lovable (well beyond initial PRD scope)
- 2026-04-02: Exported full source from Lovable. Analyzed codebase, compared with Lovable spec doc, created migration plan. Executed Phase 1 (all code changes — removed Lovable deps, build passes clean)
- 2026-04-03: Executed Phases 2-4. Created Supabase project (own account), ran all 10 migrations, deployed edge function via dashboard. Set up Google OAuth (Cloud Console + Supabase auth). Tested locally — working. Deployed to Vercel at lens-flare.vercel.app. Added Vercel URL to Supabase redirect URLs and Google OAuth config.
- 2026-04-03: Fixed bug where CR creation form inputs reset on window focus. Root cause: Supabase auth token refresh on focus triggered TeamContext.fetchTeams which set loading=true, causing TeamGate to unmount all children. Fix: only show loading spinner on initial load, not background refetches (TeamContext.tsx).

## Key Decisions
- **Orchestration layer, not annotation tool** — integrates with Figma/Loom/FigJam rather than replacing them
- **Day-one audience:** DPG UX team only (6-8 designers)
- **Soft approval gates** — at least 1 review to close as Approved, but not blocking
- **Visual annotation** deferred to Milestone 2
- **Stack:** Vercel + Supabase + GitHub (personal account) — chosen for simplicity and Lovable compatibility

## Outstanding / Next Steps
- [ ] Point `lensflare.design` domain to Vercel (needs personal machine, work DNS blocks .design TLD)
- [ ] Update Supabase Site URL from localhost to `https://lensflare.design` once domain is live
- [ ] End-to-end verification on production (Phase 5 from migration plan)
- [ ] Team tables missing FK constraints and indexes (known gap from Lovable build)
- [ ] `user_roles` table / `has_role()` not wired into RLS (client-side only for demo mode admin toggle)
- [ ] Feature work beyond migration

## Current Stack
- **Frontend:** Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui (50+ Radix components)
- **Backend:** Supabase (own project)
- **Auth:** Supabase Auth — Google OAuth + email/password
- **Edge Functions:** 1 Deno function (`fetch-artifact-thumbnails`) on Supabase Edge Functions
- **Storage:** Supabase Storage bucket `artifact-uploads`
- **Realtime:** Supabase Realtime on comments, cr_events, reviewers, critique_requests
- **Fonts:** DM Sans (body) + Space Grotesk (headings)
- **Design:** Warm orange gradient (primary ~hsl(12,80%,58%)), full light/dark mode

## Features Implemented
1. **Auth** — email/password + Google OAuth
2. **Teams** — create, join, switch, team-scoped CRs, admin roles, email invitations with auto-join on signup
3. **CRs** — full CRUD, 6-state lifecycle (draft→open→in-review→changes-requested→approved→closed)
4. **Design stages** — 5 stages with color coding (exploration, wireframe, high-fidelity, prototype, final-review)
5. **Artifacts** — URL auto-detect (Figma/Loom/FigJam/image/generic), image upload (drag+drop, clipboard paste, file picker), Figma/Loom embeds, thumbnail fetching
6. **Reviewers** — assign, mark done/undone, soft gate (1 minimum)
7. **Comments** — 4 types (suggestion/question/blocker/praise), threaded replies, resolve/unresolve
8. **Events** — review_completed/review_undone interleaved with comments
9. **Dashboard** — card grid with thumbnails, team switcher, 5 filter tabs
10. **Feed** — list view for "needs my review" and "my CRs"
11. **Settings** — team management
12. **Team Detail** — member management, invite by email, role promote/demote
13. **Demo mode** — admin toggle for mock data (fully local, bypasses Supabase)
14. **Onboarding** — 2 guided tours (main nav + CR creation) with spotlight UI
15. **Realtime** — live updates via Supabase channels

## Database Schema (10 tables)
- `profiles` — user profiles (auto-created on signup via trigger, email column removed in security hardening)
- `user_roles` — admin/user roles (not yet wired into RLS)
- `critique_requests` — the core CR entity
- `artifacts` — links/files attached to CRs
- `reviewers` — who's assigned to review each CR
- `comments` — threaded, typed comments on CRs
- `cr_events` — review lifecycle events
- `teams` — team entities with Slack channel
- `team_members` — team membership with roles
- `team_invites` — email-based team invitations
- 3 functions: `handle_new_user()`, `update_updated_at_column()`, `has_role()`
- Full RLS on all tables + storage bucket
- 10 migrations (renamed with numbered prefixes for clarity)

## Key Files
| File | Purpose |
|------|---------|
| `status.md` | This file — project status |
| `PRD.md` | Original PRD from 2026-03-30 |
| `docs/lovable-spec-doc.md` | Lovable-generated spec (good for features, omits Lovable deps) |
| `2026-04-02-lensflare-migration-session.md` | Migration session 1 notes (Phase 1 + planning) |
| `.claude/plans/unified-marinating-mochi.md` | The approved migration plan |
| `supabase/migrations/` | 10 numbered SQL migrations |
| `vercel.json` | SPA rewrite rules |
| `.env.example` | Template for env vars |

## File Structure
```
src/
  App.tsx                    — routes, providers, auth gate
  main.tsx                   — entry point
  index.css                  — theme tokens, fonts, custom classes
  types/cr.ts                — all domain types + constants
  context/
    AuthContext.tsx           — Supabase auth state
    CRContext.tsx             — CR data layer (Supabase queries + realtime)
    TeamContext.tsx           — team data layer
    DemoModeContext.tsx       — demo toggle
    DemoCRContext.tsx         — mock CR data for demo mode
    DemoTeamContext.tsx       — mock team data for demo mode
    OnboardingContext.tsx     — tour state
  pages/
    Auth.tsx                  — login/signup + Google OAuth (direct Supabase)
    Dashboard.tsx             — card grid with filters
    Feed.tsx                  — list view (needs review / my CRs)
    CreateCR.tsx              — CR creation/edit form
    CRDetail.tsx              — full CR view (artifacts, comments, reviewers)
    Settings.tsx              — team management
    TeamSetup.tsx             — first-time team join/create
    TeamDetail.tsx            — team member management
    NotFound.tsx              — 404
    Index.tsx                 — (unused, redirects)
  components/
    Header.tsx                — top nav with team context
    CRCard.tsx                — dashboard card
    StatusPill.tsx            — status badge
    DesignStageBadge.tsx      — stage badge
    TeamSwitcher.tsx          — team dropdown
    OnboardingTour.tsx        — guided tour overlay
    NavLink.tsx               — nav helper
    ui/                       — 50+ shadcn/ui components
  integrations/
    supabase/client.ts        — Supabase client init
    supabase/types.ts         — generated DB types
  data/mockData.ts            — demo mode fixtures
  hooks/                      — use-mobile, use-toast
  lib/utils.ts                — cn() utility
supabase/
  config.toml                 — project ID
  migrations/                 — 10 numbered SQL migrations
  functions/
    fetch-artifact-thumbnails/ — Deno edge function
```

## Artifacts
- PRD: `PRD.md` (this directory)
- Source: full exported codebase (this directory)
- Lovable spec: `docs/lovable-spec-doc.md`
