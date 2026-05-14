# Codebase Concerns

**Analysis Date:** 2026-05-14

## Tech Debt

**Full refetch on every mutation:**
- Issue: Every write (add comment, update status, mark review done, resolve comment) calls `fetchData()` which re-fetches all 6 Supabase tables unconditionally
- Files: `src/context/CRContext.tsx:171`, `src/context/CRContext.tsx:202`, `src/context/CRContext.tsx:208`, `src/context/CRContext.tsx:217`, `src/context/CRContext.tsx:227`, `src/context/CRContext.tsx:239`
- Impact: Unnecessary network load; will noticeably degrade as data grows; duplicates the Realtime subscription (both the mutation caller and remote clients do full refetches)
- Fix approach: Optimistic local state updates for targeted mutations + use TanStack Query (already installed) with query invalidation; or at minimum scope queries to current team's CRs

**Artifact sync as delete + re-insert:**
- Issue: `updateCR()` deletes all artifacts and all reviewers for a CR, then inserts the new list on every save — including minor title edits
- Files: `src/context/CRContext.tsx:186-200`
- Impact: Destroys artifact `id` values, breaking any reference to a specific artifact (e.g., stored thumbnail links). Reviewer `reviewed_at` timestamps are wiped on every edit.
- Fix approach: Diff incoming vs. existing — only delete removed items, only insert added items

**`any` type casts in core data layer:**
- Issue: `design_stage: cr.design_stage as any` in `assembleData()` and `artifacts: any[]` in `updateCR` signature bypass TypeScript
- Files: `src/context/CRContext.tsx:79`, `src/context/CRContext.tsx:175`
- Impact: Type errors in this codepath won't be caught at compile time
- Fix approach: Use the generated `src/integrations/supabase/types.ts` types directly; map DB row types to domain types explicitly

**`(profileData as any).onboarding_dismissed`:**
- Issue: The `onboarding_dismissed` column exists in the DB (migration 05) but the generated types in `src/integrations/supabase/types.ts` may not include it, causing a cast to `any`
- Files: `src/context/AuthContext.tsx:51`
- Impact: Type safety loss; will silently break if column is renamed or removed
- Fix approach: Regenerate `types.ts` from current Supabase schema

**Dual lockfiles:**
- Issue: Both `bun.lockb` (Bun) and `package-lock.json` (npm) are committed
- Files: `bun.lockb`, `package-lock.json`
- Impact: Potential version drift between the two; CI or collaborators may install different dependency trees depending on which tool they use
- Fix approach: Choose one package manager, remove the other's lockfile, add to `.gitignore`

**TanStack Query mounted but unused:**
- Issue: `QueryClientProvider` wraps the entire app in `App.tsx:1,25`, but no `useQuery` or `useMutation` calls exist — all data fetching is done directly in contexts
- Files: `src/App.tsx:1,25`
- Impact: Dead dependency adds ~50KB to bundle; also signals an incomplete migration intention
- Fix approach: Either migrate context data fetching to TanStack Query (recommended) or remove the dependency

**Installed but unused packages:**
- `recharts` 2.15 — no chart components in any page
- `react-hook-form` + `@hookform/resolvers` + `zod` — forms use manual `useState` patterns instead
- `cmdk` — command menu not implemented
- `vaul` — drawer not used in current pages
- Impact: Increases bundle size unnecessarily
- Fix approach: Remove with `bun remove` if not planned for near-term features

## Known Bugs

**Stale CR ID in `handlePublish`:**
- Symptoms: When creating a new CR, the `id` and `cr_id` fields in the passed object use `cr-${Date.now()}` but the actual DB-generated ID comes from the Supabase insert response
- Files: `src/pages/CreateCR.tsx:170-190`
- Trigger: Appears when creating a CR in real mode — the passed artifact `cr_id` values are placeholder IDs that never match the real DB ID. The `addCR` function in CRContext correctly uses `newCR.id` from the DB response for artifact inserts, so it works, but the object passed to `addCR` carries wrong IDs
- Workaround: `CRContext.addCR()` ignores the passed CR id and uses the DB response id

## Security Considerations

**`user_roles` / `has_role()` not wired into RLS:**
- Risk: The `user_roles` table and `has_role()` function exist but are only used client-side to show/hide admin UI. No Supabase RLS policy checks `has_role()` — admin-only operations are not server-enforced
- Files: `src/context/AuthContext.tsx:54-59`, `supabase/migrations/01_*.sql:63-70`
- Current mitigation: None beyond UI gating
- Recommendations: Add RLS policies on sensitive operations (e.g., deleting other users' CRs, managing team membership) that call `has_role(auth.uid(), 'admin')`

**CORS wildcard on Edge Function:**
- Risk: `fetch-artifact-thumbnails` allows `Access-Control-Allow-Origin: *`
- Files: `supabase/functions/fetch-artifact-thumbnails/index.ts:3-8`
- Current mitigation: The function requires a valid `Authorization` header — unauthenticated calls return 401
- Recommendations: Restrict origin to `https://lens-flare.vercel.app` and `https://lensflare.design` in production

**Team scoping is client-side only:**
- Risk: CRs are globally readable by all authenticated users. RLS policy is `USING (true)`. Team filtering is applied in `Dashboard.tsx` and `CRContext.tsx` but the raw Supabase queries fetch all CRs
- Files: `supabase/migrations/01_*.sql:89-97`, `src/context/CRContext.tsx:97-98`
- Current mitigation: All users are in a trusted team context (small team tool)
- Recommendations: Add `WHERE team_id = ANY(SELECT team_id FROM team_members WHERE user_id = auth.uid())` to the CR `SELECT` RLS policy if multi-team access isolation is needed

**No rate limiting:**
- Risk: The edge function `fetch-artifact-thumbnails` fetches external URLs (Figma, Loom) without rate limiting or abuse protection
- Files: `supabase/functions/fetch-artifact-thumbnails/index.ts`
- Current mitigation: Requires auth token; limited to CR authors
- Recommendations: Add per-user rate limiting if the app scales

## Performance Bottlenecks

**N+6 queries on every data load:**
- Problem: `fetchData()` fires 6 parallel Supabase queries (`critique_requests`, `artifacts`, `reviewers`, `comments`, `cr_events`, `profiles`) and then a 7th for team members — every time any table changes via Realtime
- Files: `src/context/CRContext.tsx:97-110`
- Cause: Flat denormalized query pattern — all rows from all tables, filtered client-side
- Improvement path: Use Supabase joins (PostgREST nested selects) to fetch CRs with nested artifacts, reviewers, and comments in fewer queries; add `WHERE team_id = currentTeam.id` to scope the data

**In-memory join of all data:**
- Problem: `assembleData()` iterates over all CRs, artifacts, reviewers, comments, and events every time `fetchData()` returns — O(n×m) comment threading loop
- Files: `src/context/CRContext.tsx:24-84`
- Cause: Full DB dump assembled in-memory on every update
- Improvement path: Let Supabase do the join server-side with nested selects

## Fragile Areas

**Dual-mode context interface drift:**
- Files: `src/context/CRContext.tsx:7-19`, `src/context/DemoCRContext.tsx:60-66`
- Why fragile: `DemoCRProvider` must implement every method in `CRContextType`. `updateCR` is currently a no-op stub (`const updateCR = useCallback(() => {}, [])`) in demo mode. Adding new methods to `CRContextType` without updating `DemoCRContext.tsx` will cause TypeScript errors but may be silently ignored if `@typescript-eslint/no-unused-vars` is off
- Safe modification: Always update both `CRContext.tsx` (interface + real implementation) and `DemoCRContext.tsx` (mock implementation) together
- Test coverage: None

**`TeamGate` remount on auth token refresh:**
- Files: `src/context/TeamContext.tsx:47`, `src/App.tsx:27-44`
- Why fragile: The bug where auth token refresh triggered `TeamGate` to unmount all children was fixed by the `hasLoaded.current` ref pattern, but the fix is subtle. Removing or misunderstanding `hasLoaded.current` reintroduces a bug where form inputs reset on window focus
- Safe modification: Do not change the loading state logic in `TeamProvider.fetchTeams()` without understanding this fix

**Large page files with embedded sub-components:**
- Files: `src/pages/CRDetail.tsx` (455 lines), `src/pages/CreateCR.tsx` (429 lines), `src/pages/TeamDetail.tsx` (454 lines)
- Why fragile: `CRDetail.tsx` defines `ArtifactEmbed`, `CommentThread`, and `getTimeAgo` as local functions. Changes to the data shape ripple through multiple closures in a single file
- Safe modification: Extract sub-components to `src/components/` before making structural changes

**`assembleData()` non-null assertions:**
- Files: `src/context/CRContext.tsx:61-63`
- Why fragile: Uses `commentMap.get(c.id)!` and `commentMap.get(c.parent_id)!.replies!.push()` — these will throw if DB returns orphaned parent references
- Safe modification: Add null guards: `const comment = commentMap.get(c.id); if (!comment) continue;`

## Scaling Limits

**Supabase free tier:**
- Current: Supabase Hobby/Free tier (personal account)
- Limit: 500MB database, 1GB storage, 50,000 monthly active users, Edge Functions have cold starts
- Scaling path: Upgrade to Supabase Pro when team size or data volume grows

**Client-side data assembly:**
- Current capacity: Works well for small teams (6-8 designers, tens of CRs)
- Limit: Full table fetches with client-side joins will degrade noticeably at ~100 CRs or ~1,000 comments
- Scaling path: Server-side joins via Supabase nested selects + pagination

## Dependencies at Risk

**`react-day-picker` 8.x:**
- Risk: v8 has known compatibility issues with React 19; v9 has breaking API changes
- Impact: Calendar component (`src/components/ui/calendar.tsx`) depends on v8
- Migration plan: Upgrade to `react-day-picker` v9 when ready, update `calendar.tsx` via shadcn CLI

**Two package manager lockfiles:**
- Risk: `bun.lockb` and `package-lock.json` may diverge silently
- Impact: Different dependency resolutions in different environments
- Migration plan: Delete `package-lock.json`, commit only `bun.lockb`, add `package-lock.json` to `.gitignore`

## Missing Critical Features

**No email notifications:**
- Problem: Reviewers have no way to know they've been assigned a CR except by checking the app
- Blocks: Core reviewer workflow — assignment is silent

**No visual/annotation layer:**
- Problem: Comments are text-only and not attached to specific locations in artifacts (deferred by design)
- Blocks: Deep critique workflow — reviewers can't point at specific elements

**No CI/CD pipeline:**
- Problem: No automated tests, linting, or build checks on push or PR
- Blocks: Safe collaborative development — any push to `main` deploys directly to production

## Test Coverage Gaps

**Context providers (entire data layer):**
- What's not tested: `CRContext`, `TeamContext`, `AuthContext`, `DemoCRContext` — all untested
- Files: `src/context/*.tsx`
- Risk: Silent regressions in data assembly, mutations, realtime subscription lifecycle
- Priority: High

**Domain logic utilities:**
- What's not tested: `assembleData()`, `detectArtifactType()`, `getTimeAgo()`
- Files: `src/context/CRContext.tsx:24`, `src/pages/CreateCR.tsx:61`, `src/pages/CRDetail.tsx:182`
- Risk: Edge cases (orphaned comments, unknown URL patterns, sub-hour time formatting) silently break
- Priority: High — these are pure functions with no dependencies, easiest to test

**CR creation and edit flow:**
- What's not tested: The full create/edit/publish flow in `CreateCR.tsx`
- Files: `src/pages/CreateCR.tsx`
- Risk: Artifact drag-and-drop, paste upload, URL detection regressions
- Priority: Medium

**All UI components:**
- What's not tested: Every page and shared component
- Files: `src/pages/`, `src/components/`
- Risk: Visual regressions, interaction bugs
- Priority: Medium (demo mode provides manual coverage path)

---

*Concerns audit: 2026-05-14*
