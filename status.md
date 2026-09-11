---
type: status
title: LensFlare — Project Status
project: lens-flare
created: 2026-03-31
updated: 2026-09-11
tags: [status]
memory: [project_lensflare]
---

# LensFlare

## Overview
Design critique orchestration tool — the "Pull Request" for design review. Tracks the lifecycle of design critiques across tools (Figma, Loom, FigJam, prototypes).

## Current Status
**Phase:** Rebuilt as a public, read-only resume demo. Seeded and verified; final Vercel deploy is on Mark.
**Last updated:** 2026-09-11

## Deployment
- **Live URL:** https://lens-flare.vercel.app/ (new Vercel project created 2026-09-11; env vars set; deploy pending on Mark's side)
- **Domain:** lensflare.design (purchased, not in use for this deploy — deliberately using the default Vercel URL instead, see Key Decisions)
- **Hosting:** Vercel (Hobby tier, personal account markhazlewood42)
- **Repo:** github.com/markhazlewood42/lens-flare (main branch)
- **Backend:** Supabase project `jnumgymfmzraaovjjbyt` (own account) — `supabase/config.toml` previously pointed at the original Lovable-provisioned project ref; fixed 2026-09-11
- **Edge Function:** `fetch-artifact-thumbnails` still deployed but unused by this build (no CR creation in the read-only demo)

## Key Dates
- **PRD drafted:** 2026-03-30
- **Lovable prototype built:** 2026-03-30 to 2026-03-31
- **Source exported / migrated off Lovable:** 2026-04-02 to 2026-04-03
- **Rebuilt as public read-only demo:** 2026-09-11

## What Happened
- 2026-03-30: DPG UX Team Time meeting surfaced critique workflow problems — low visibility, inconsistent async feedback, no accountability
- 2026-03-30: Mark proposed "CritRequest" concept (design equivalent of a PR). PRD drafted, named **LensFlare**, domain secured
- 2026-03-30 to 2026-03-31: Built full working prototype in Lovable (well beyond initial PRD scope)
- 2026-04-02 to 2026-04-03: Exported off Lovable, ran migration (Supabase project, Google OAuth, Vercel deploy), fixed a focus-refetch bug in TeamContext
- 2026-09-11: **Reworked into a public, read-only resume demo** (Mark no longer needs the app maintained as a live product — just a working, shareable artifact):
  - Stripped auth entirely: deleted `AuthContext`'s real Supabase session handling, `TeamGate`, `ProtectedRoutes`, and the old dual real/demo-mode split (`CRProviderSwitch`, `DemoModeContext`, `DemoCRContext`, `DemoTeamContext`). Every visitor now gets a fixed stub "Guest Viewer" identity.
  - Deleted all write-surface pages: `Auth.tsx`, `CreateCR.tsx`, `Settings.tsx`, `TeamDetail.tsx`, `TeamSetup.tsx`. Remaining routes: `/`, `/dashboard`, `/cr/:id`.
  - `CRContext`/`TeamContext` now only read from Supabase (no realtime subscription, no create/update/comment/review mutations) — deliberately kept as real Supabase queries rather than falling back to the old client-side mock data, so the deployed app is illustrative of a real full-stack build, not a fake.
  - Added migration `11_20260911000000_public_readonly_demo.sql`: grants the `anon` role `SELECT` on every table the read-only UI needs. No anon write policies anywhere — verified directly (anon `curl` insert against `critique_requests` returns 401).
  - Added `scripts/seed-demo-data.ts`: seeds the DB with the same fictional content as the old `src/data/mockData.ts` (6 people, 3 teams, 6 CRs with artifacts/reviewers/comments). Creates inert `auth.users` rows via the Supabase Admin API to satisfy the `auth.users` FK on `profiles`/`critique_requests`/etc. — nobody logs in as them, there's no login UI. Ran successfully; cleaned up 2 leftover "TEST" CRs and 2 empty legacy teams that predated this rebuild.
  - Swapped every seeded artifact to a real static Unsplash image — the mock data's fake `figma.com`/`loom.com` URLs would have rendered as broken embeds in production.
  - Replaced the leftover Lovable favicon with an SVG reproduction of the header's flame mark (same gradient, same Lucide path).
  - Full Lovable remnant sweep: removed `og:image`/`twitter:image`/`twitter:site` (pointed at a lovable.app CDN screenshot + `@Lovable`) from `index.html`; fixed `playwright.config.ts`/`playwright-fixture.ts`, which imported a `lovable-agent-playwright-config` package that was never even a listed dependency (dead/broken code); corrected `CLAUDE.md`/`AGENTS.md`'s stale "Lovable migration debt" sections.
  - Discovered Supabase's newer API key naming during this work: `sb_publishable_...` (formerly "anon key") and `sb_secret_...` (formerly "service_role key") — same roles, new prefixes, shown in the dashboard's Project Settings → API page.

## Key Decisions
- **Orchestration layer, not annotation tool** — integrates with Figma/Loom/FigJam rather than replacing them
- **Soft approval gates** — at least 1 review to close as Approved, but not blocking
- **Visual annotation** deferred to Milestone 2 (never picked back up — app is now a static demo, not an active product)
- **2026-09-11: Public read-only demo, not a live product.** Mark just needs a shareable resume link, not auth, not real users, not a maintained backend. Read-only was chosen specifically to avoid needing anon write policies, spam/defacement risk, or a reset job. Real Supabase (seeded) was chosen over reviving the old client-side demo mode so the link is illustrative of a real full-stack build.
- **Default `*.vercel.app` URL, not `lensflare.design`** — no DNS/custom-domain work needed for a resume link.

## Outstanding / Next Steps
- [ ] Mark to trigger the actual Vercel deploy (project + env vars already set as of 2026-09-11) and do a final incognito-window check of the live URL
- [ ] Team tables (`teams`, `team_members`) still missing FK constraints/indexes — harmless for a static read-only demo, not worth fixing unless this becomes a live product again
- [ ] `user_roles` / `has_role()` unused now that there's no admin toggle — could be dropped in a future migration, not urgent
- [ ] If this is ever turned back into a live, editable product: the whole auth/write layer would need to be rebuilt from scratch, not un-deleted — see the 2026-09-11 entry above for exactly what was removed

## Current Stack
- **Frontend:** Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui (50+ Radix components)
- **Backend:** Supabase (own project `jnumgymfmzraaovjjbyt`) — read-only via anon key for the public demo; a `service_role`/"secret" key is only ever used locally to run `scripts/seed-demo-data.ts`
- **Auth:** none — removed entirely 2026-09-11; every visitor is an anonymous "Guest Viewer"
- **Edge Functions:** `fetch-artifact-thumbnails` still deployed on Supabase but unused by the current build
- **Realtime:** removed 2026-09-11 (nothing ever writes, so there's nothing to subscribe to)
- **Fonts:** DM Sans (body) + Space Grotesk (headings)
- **Design:** Warm orange gradient (primary ~hsl(12,80%,58%)), full light/dark mode

## Features (current, read-only demo)
1. **Dashboard** — card grid of seeded CRs with team switcher and filter tabs
2. **Feed** — list view (needs review / my CRs, evaluated against the fixed guest identity)
3. **CR Detail** — artifacts, reviewers, comment threads, status — all display-only, no mutation controls
4. **Onboarding tour** — still available via the header menu, dismiss state is per-visit only (no persistence, no session to persist against)

Removed 2026-09-11 (see the "What Happened" entry above for full detail): auth (email/password + Google OAuth), team create/join/leave, CR create/edit, comment/reply, resolve, mark-review-done, status changes, team member/invite management, the old client-side demo-mode toggle.

## Database Schema (11 migrations)
- `profiles`, `user_roles`, `critique_requests`, `artifacts`, `reviewers`, `comments`, `cr_events`, `teams`, `team_members`, `team_invites` — same 10 tables as before
- Migration 11 (2026-09-11): anon-role `SELECT` policies for the public read-only demo, on every table above except `user_roles`/`team_invites`. No anon write policies anywhere.
- 3 functions: `handle_new_user()`, `update_updated_at_column()`, `has_role()` (the last is now unused)

## Key Files
| File | Purpose |
|------|---------|
| `status.md` | This file — project status |
| `PRD.md` | Original PRD from 2026-03-30 |
| `docs/lovable-spec-doc.md` | Lovable-generated spec (historical — good for original features, omits Lovable deps) |
| `2026-04-02-lensflare-migration-session.md` | Migration-off-Lovable session notes (2026-04) |
| `supabase/migrations/` | 11 numbered SQL migrations |
| `scripts/seed-demo-data.ts` | One-off script: seeds the DB with fictional demo content (new 2026-09-11) |
| `vercel.json` | SPA rewrite rules |
| `.env.example` | Template for env vars |

## File Structure
```
src/
  App.tsx                    — routes (/, /dashboard, /cr/:id) + provider tree, no auth gate
  main.tsx                   — entry point
  index.css                  — theme tokens, fonts, custom classes
  types/cr.ts                — all domain types + constants
  context/
    AuthContext.tsx           — stub: fixed "Guest Viewer" identity, no real session
    CRContext.tsx              — read-only CR data layer (Supabase SELECTs only)
    TeamContext.tsx            — read-only team data layer (all teams, no membership concept)
    OnboardingContext.tsx      — tour state
  pages/
    Dashboard.tsx              — card grid with filters
    Feed.tsx                   — list view (needs review / my CRs)
    CRDetail.tsx               — full CR view, read-only
    NotFound.tsx               — 404
  components/
    Header.tsx                 — top nav, no sign-out/settings/New CR
    CRCard.tsx, StatusPill.tsx, DesignStageBadge.tsx, TeamSwitcher.tsx, OnboardingTour.tsx, NavLink.tsx
    ui/                        — 50+ shadcn/ui components
  integrations/supabase/       — client init + generated DB types
  data/mockData.ts             — source content reused by scripts/seed-demo-data.ts (no longer imported at runtime)
  hooks/, lib/utils.ts
supabase/
  config.toml                  — project ID (fixed 2026-09-11)
  migrations/                  — 11 numbered SQL migrations
  functions/fetch-artifact-thumbnails/ — deployed but unused
scripts/
  seed-demo-data.ts            — new 2026-09-11, seeds fictional demo content
```

## Artifacts
- PRD: `PRD.md` (this directory)
- Source: full exported codebase (this directory)
- Lovable spec (historical): `docs/lovable-spec-doc.md`
