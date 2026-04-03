# LensFlare Migration Session — 2026-04-02

## What happened this session

### 1. Full codebase analysis of the Lovable prototype

Mark exported the LensFlare source from Lovable into `personal-projects/lens-flare/`. I read every file in the project and produced a detailed analysis of the architecture, features, database schema, and Lovable-specific dependencies.

**Key finding:** The prototype is far more built out than the original PRD — 15 features, 10 database tables, full auth/teams/realtime/onboarding. But the Lovable-specific dependency surface is tiny: only 3 touchpoints.

### 2. Compared with Lovable-generated spec doc

Lovable also generated a spec doc (`docs/lovable-spec-doc.md`). I compared it against my source analysis. The spec is accurate for features/behavior but **omits all Lovable-specific dependencies** — it never mentions `@lovable.dev/cloud-auth-js`, `lovable-tagger`, or the `integrations/lovable/` directory. For migration purposes, trust the `status.md` I wrote over the Lovable spec for dependency information.

### 3. Migration plan: Vercel + Supabase

Created and approved a migration plan at:
**`/Users/mhazlewood/.claude/plans/unified-marinating-mochi.md`**

Target stack: **Vercel** (hosting) + **Supabase** (new project, own account) + **GitHub** (`markhazlewood42/lens-flare`, personal account).

### 4. Executed Phase 1: Code changes (COMPLETE)

All Lovable-specific code has been removed and the build passes clean.

**Files modified:**
- `vite.config.ts` — removed lovable-tagger import and plugin
- `package.json` — removed `@lovable.dev/cloud-auth-js` and `lovable-tagger`, renamed to `lens-flare`
- `src/pages/Auth.tsx` — replaced Lovable OAuth wrapper with direct `supabase.auth.signInWithOAuth({ provider: 'google' })`
- `src/pages/CRDetail.tsx` — changed Figma `embed_host=lovable` to `embed_host=lensflare`

**Files deleted:**
- `src/integrations/lovable/index.ts` — the 38-line Lovable auth wrapper

**Files created:**
- `.gitignore` — standard Vite/React ignores
- `.env.example` — template with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- `vercel.json` — SPA rewrite rules

**Build verified:** `npm run build` succeeds with zero errors.

## What's left (Mark doing manually)

### Phase 2: Supabase project setup
- Create new Supabase project
- Run all 10 migration SQL files in order via SQL Editor
- Deploy `fetch-artifact-thumbnails` edge function via Supabase CLI
- Full migration list in `supabase/migrations/` (chronological order in the plan)

### Phase 3: Google OAuth setup
- Create Google Cloud Console project with OAuth 2.0 Client ID
- Configure OAuth consent screen (External, email + profile scopes)
- Add redirect URI: `https://<supabase-project>.supabase.co/auth/v1/callback`
- Enable Google provider in Supabase Auth dashboard
- Add redirect URLs for lensflare.design + localhost:5173 + localhost:8080

### Phase 4: Git + Vercel deployment
- `git init` + push to `markhazlewood42/lens-flare` (needs personal GitHub credentials, not work `gh` CLI)
- Connect repo to Vercel, set env vars, deploy
- Point `lensflare.design` domain to Vercel

### Phase 5: Verify
- Test email signup, Google OAuth, team creation, CR creation, image upload, realtime, demo mode
- Full checklist in the plan file

## Key files for context

| File | Purpose |
|------|---------|
| `personal-projects/lens-flare/status.md` | Full project status with architecture, features, schema, file structure |
| `.claude/plans/unified-marinating-mochi.md` | The approved migration plan with all steps |
| `personal-projects/lens-flare/docs/lovable-spec-doc.md` | Lovable-generated spec (good for features, omits Lovable deps) |
| `personal-projects/lens-flare/PRD.md` | Original PRD from 2026-03-30 |

## Important notes for next session

- The `gh` CLI is authed to HubSpot GitHub (`mhazlewood_hubspot`), NOT the personal account. Git pushes to `markhazlewood42/lens-flare` need manual credentials or a personal access token.
- `npm install` has been run with `--registry https://registry.npmjs.org` (per Mark's preference for personal projects).
- The `supabase/config.toml` still has the old Lovable project ID (`xqwrgrwotnaudbshpbmw`) — update it after creating the new Supabase project.
- The `user_roles` table and `has_role()` function exist but aren't wired into any RLS policy — they're only used client-side for the demo mode admin toggle.
- Team tables (`teams`, `team_members`, `team_invites`) are missing FK constraints and indexes — a known gap from the Lovable build, not blocking but worth adding later.
