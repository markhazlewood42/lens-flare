# Architecture

**Analysis Date:** 2026-05-14

## System Overview

```text
┌──────────────────────────────────────────────────────────────────┐
│                        Browser SPA (React 18)                    │
├───────────────┬──────────────────────────────┬───────────────────┤
│  Pages        │  Shared Components           │  shadcn/ui        │
│ `src/pages/`  │  `src/components/`           │  `src/components/ │
│               │  (Header, CRCard, Status     │   ui/`            │
│               │   Pill, DesignStageBadge…)   │  (50+ Radix prims)│
└───────┬───────┴──────────────┬───────────────┴───────────────────┘
        │                      │
        ▼                      ▼
┌──────────────────────────────────────────────────────────────────┐
│                   React Context Layer                            │
│                                                                  │
│  AuthContext   TeamContext   CRContext   DemoModeContext          │
│  `src/context/AuthContext.tsx`           ┌──────────────────────┤
│  `src/context/TeamContext.tsx`           │ Demo Mode (parallel) │
│  `src/context/CRContext.tsx`             │ DemoCRContext        │
│  `src/context/DemoModeContext.tsx`       │ DemoTeamContext      │
│  `src/context/OnboardingContext.tsx`     └──────────────────────┤
└──────────┬───────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Supabase Client  `src/integrations/supabase/client.ts`          │
│  Postgres · Auth · Realtime · Storage · Edge Functions           │
└──────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| App | Provider tree, route setup, auth guard, demo mode switch | `src/App.tsx` |
| AuthContext | Supabase session, user profile, admin role | `src/context/AuthContext.tsx` |
| TeamContext | Multi-team membership, current team, team CRUD | `src/context/TeamContext.tsx` |
| CRContext | CR data, realtime subscriptions, all CR mutations | `src/context/CRContext.tsx` |
| DemoCRContext | In-memory mock CR data (same interface as CRContext) | `src/context/DemoCRContext.tsx` |
| DemoTeamContext | In-memory mock team data | `src/context/DemoTeamContext.tsx` |
| DemoModeContext | Toggle between real and demo mode | `src/context/DemoModeContext.tsx` |
| OnboardingContext | Guided tour state (active tour, start/stop) | `src/context/OnboardingContext.tsx` |
| Dashboard | Card grid with filter tabs and team switcher | `src/pages/Dashboard.tsx` |
| CRDetail | Full CR view: artifacts, comments, reviewer sidebar | `src/pages/CRDetail.tsx` |
| CreateCR | CR creation and edit form | `src/pages/CreateCR.tsx` |
| Feed | List view for "needs my review" / "my CRs" | `src/pages/Feed.tsx` |
| Settings | Team management (create, join, leave, edit) | `src/pages/Settings.tsx` |
| TeamDetail | Member management, invitations, roles | `src/pages/TeamDetail.tsx` |
| Auth | Login/signup, Google OAuth | `src/pages/Auth.tsx` |
| TeamSetup | First-run flow: create or join a team | `src/pages/TeamSetup.tsx` |
| Header | Top nav, team switcher, demo toggle | `src/components/Header.tsx` |
| CRCard | Dashboard card (thumbnail, stage, status, meta) | `src/components/CRCard.tsx` |
| StatusPill | CR lifecycle status badge | `src/components/StatusPill.tsx` |
| DesignStageBadge | Design stage badge | `src/components/DesignStageBadge.tsx` |
| TeamSwitcher | Team dropdown in header/dashboard | `src/components/TeamSwitcher.tsx` |
| OnboardingTour | Spotlight guided tour overlay | `src/components/OnboardingTour.tsx` |

## Pattern Overview

**Overall:** Context-driven SPA with dual-mode data layer (real vs. demo)

**Key Characteristics:**
- All shared application state lives in React Context providers
- No Redux, no Zustand, no TanStack Query data fetching (Query is mounted but unused)
- Direct Supabase client calls in context providers (no service/repository layer)
- Dual-mode: the same `CRContext` interface is implemented by both `CRProvider` (Supabase-backed) and `DemoCRProvider` (in-memory mock). The switch happens in `CRProviderSwitch` in `App.tsx`
- Realtime: Supabase Realtime channels in `CRContext` — any change to DB tables triggers a full refetch

## Layers

**Routing + Entry:**
- Purpose: App initialization, provider tree, auth guards, route definitions
- Location: `src/App.tsx`, `src/main.tsx`
- Contains: `QueryClientProvider`, `BrowserRouter`, `AuthProvider`, `TeamProvider`, `DemoModeProvider`, `CRProviderSwitch`, route components
- Depends on: All context providers, all pages

**Pages:**
- Purpose: Top-level route views, compose components, read from context
- Location: `src/pages/`
- Contains: Route-specific logic, form state, local UI state
- Depends on: Context hooks (`useCR`, `useTeam`, `useAuth`), shared components, shadcn/ui
- Used by: React Router `<Route>` definitions in `App.tsx`

**Context (data layer):**
- Purpose: Server state management, Supabase mutations, realtime subscriptions
- Location: `src/context/`
- Contains: Provider components, custom hooks, Supabase queries
- Depends on: `src/integrations/supabase/client.ts`, `src/types/cr.ts`
- Used by: Pages and shared components via custom hooks

**Shared Components:**
- Purpose: Reusable domain-specific UI
- Location: `src/components/` (non-ui)
- Contains: CRCard, StatusPill, DesignStageBadge, TeamSwitcher, OnboardingTour, Header, NavLink
- Depends on: Context hooks, `src/types/cr.ts`, shadcn/ui primitives

**shadcn/ui Primitives:**
- Purpose: Accessible, styled Radix UI components
- Location: `src/components/ui/`
- Contains: 50+ generated components (accordion, dialog, dropdown, toast, etc.)
- Do not modify directly; regenerate via `shadcn` CLI

**Domain Types + Constants:**
- Purpose: Canonical type definitions and display constants for the CR domain
- Location: `src/types/cr.ts`
- Contains: `CritiqueRequest`, `Artifact`, `Reviewer`, `Comment`, `CREvent`, `User` interfaces; `DESIGN_STAGES`, `COMMENT_TYPES`, `STATUS_CONFIG` arrays

**Supabase Integration:**
- Purpose: Single initialized client and generated DB types
- Location: `src/integrations/supabase/`
- Files: `client.ts` (client init), `types.ts` (generated DB types)

**Mock Data:**
- Purpose: Demo mode fixtures, not used in real mode
- Location: `src/data/mockData.ts`
- Contains: `MOCK_CRS`, `TEAM_MEMBERS`, `CURRENT_USER`, `MOCK_TEAMS`

## Data Flow

### Primary Request Path (Real Mode)

1. App mounts → `AuthProvider` subscribes to Supabase auth state changes (`src/context/AuthContext.tsx:23`)
2. On authenticated session → `TeamProvider` fetches team memberships from Supabase (`src/context/TeamContext.tsx:45`)
3. `TeamGate` in `App.tsx` checks `userTeams.length > 0` — redirects to `TeamSetup` if empty
4. `CRProviderSwitch` renders `CRProvider` (real mode) or `DemoCRProvider` (demo mode)
5. `CRProvider.fetchData()` fires parallel Supabase queries for all tables (`src/context/CRContext.tsx:97`)
6. `assembleData()` joins flat DB rows into nested `CritiqueRequest[]` in memory (`src/context/CRContext.tsx:24`)
7. Data flows down to pages via `useCR()` hook
8. Realtime channel on `cr-realtime` triggers `fetchData()` on any table change (`src/context/CRContext.tsx:137`)

### CR Mutation Path

1. User action in page (e.g., submit comment in `CRDetail.tsx`)
2. Page calls context mutation (e.g., `addComment(crId, comment)`)
3. `CRContext` writes to Supabase directly (`src/context/CRContext.tsx:211`)
4. Calls `fetchData()` to refresh local state
5. Realtime subscription on remote clients also triggers `fetchData()`

### Demo Mode Path

1. User toggles demo mode via `Header.tsx` → `DemoModeContext.toggleDemoMode()`
2. `CRProviderSwitch` in `App.tsx` re-renders with `DemoTeamProvider` + `DemoCRProvider`
3. `DemoCRProvider` provides `MOCK_CRS` / `CURRENT_USER` / `TEAM_MEMBERS` from `src/data/mockData.ts`
4. All mutations are in-memory state updates — no Supabase calls

**State Management:**
- Auth state: `AuthContext` (Supabase session + profile)
- Team state: `TeamContext` (user's teams, current team in localStorage)
- CR/domain state: `CRContext` or `DemoCRContext` (depending on mode)
- Onboarding state: `OnboardingContext` (active tour type)
- Demo toggle: `DemoModeContext`
- Local UI state: `useState` in each page/component

## Key Abstractions

**CritiqueRequest:**
- Purpose: The core unit of work — a design artifact submitted for review
- Examples: `src/types/cr.ts`, `src/context/CRContext.tsx`
- Pattern: Assembled in-memory from 5 flat DB tables (CRs, artifacts, reviewers, comments, events) by `assembleData()`

**CRContextType interface:**
- Purpose: The contract both `CRProvider` and `DemoCRProvider` must satisfy
- Examples: `src/context/CRContext.tsx:7`, `src/context/DemoCRContext.tsx:62`
- Pattern: Both providers call `CRContext.Provider` with the same value shape

**`cn()` utility:**
- Purpose: Merges Tailwind classes with clsx and tailwind-merge
- Location: `src/lib/utils.ts`
- Used throughout all components for conditional class composition

## Entry Points

**Browser Entry:**
- Location: `src/main.tsx`
- Triggers: Vite dev server or production build
- Responsibilities: Mounts React root into `#root` DOM element

**App Root:**
- Location: `src/App.tsx`
- Triggers: Rendered by `main.tsx`
- Responsibilities: Full provider tree, auth guard (`ProtectedRoutes`), team gate (`TeamGate`), demo mode switch (`CRProviderSwitch`), all route definitions

**Supabase Edge Function Entry:**
- Location: `supabase/functions/fetch-artifact-thumbnails/index.ts`
- Triggers: Called via `supabase.functions.invoke()` after CR creation/update
- Responsibilities: Fetches thumbnail URLs for Figma (oEmbed + og:image fallback) and Loom artifacts

## Architectural Constraints

- **Global state:** `queryClient` is a module-level singleton in `App.tsx` (not inside component — intentional). Supabase `supabase` client is a module-level singleton in `src/integrations/supabase/client.ts`
- **Realtime = full refetch:** Supabase Realtime subscriptions do not perform granular updates — any change triggers a full `fetchData()` which re-fetches all 6 tables and rebuilds the entire `CritiqueRequest[]` array in memory
- **No team-scoped RLS:** CRs are globally readable by all authenticated users (RLS policy: `USING (true)`) — team filtering happens client-side in `Dashboard.tsx:18` and `CRContext.tsx:106-122`
- **No route-level code splitting:** All pages are eagerly imported in `App.tsx`
- **Circular dependency risk:** `CRContext` imports from `AuthContext` and `TeamContext`; `App.tsx` imports all three. Do not create imports in the reverse direction.

## Anti-Patterns

### Full Refetch on Every Mutation

**What happens:** Every write operation (add comment, update status, mark review done) calls `fetchData()` after the Supabase write, which re-fetches all 6 tables for all CRs.

**Why it's wrong:** This is wasteful for small mutations and will degrade with data growth. A comment addition re-fetches all artifacts, reviewers, and events for the entire team.

**Do this instead:** Optimistic local state update for the specific entity, with Realtime as eventual consistency. Or use TanStack Query with targeted query invalidation.

### Artifact Update as Delete+Insert

**What happens:** `updateCR()` in `src/context/CRContext.tsx:186-200` deletes all artifacts and all reviewers for a CR, then re-inserts. This is used on every save, including minor text edits.

**Why it's wrong:** Destroys and recreates foreign-key records unnecessarily; any downstream reference to artifact IDs breaks between saves.

**Do this instead:** Diff the artifact list and only insert/delete changed items.

## Error Handling

**Strategy:** Silent failure with optional toast on user-initiated actions

**Patterns:**
- Supabase mutations: errors are checked with `if (error || !data) return` — silent failure, no user feedback (e.g., `addCR` in `src/context/CRContext.tsx:159`)
- Upload errors in `CreateCR.tsx`: surfaced via `sonner` toast
- Team mutations in `Settings.tsx`: surfaced via `sonner` toast
- Auth errors: not explicitly handled — Supabase redirects to `/auth`
- Route not found: `src/pages/NotFound.tsx`

## Cross-Cutting Concerns

**Logging:** None. No structured logging, no error tracking service.

**Validation:** Client-side only. Form validation is manual `if (!value.trim()) return` pattern, not react-hook-form or Zod (despite both being installed). Server-side validation relies entirely on Postgres CHECK constraints.

**Authentication:** All protected routes wrapped in `ProtectedRoutes` component in `App.tsx:61`. Checks `session` from `AuthContext`. Unauthenticated users redirected to `/auth`.

---

*Architecture analysis: 2026-05-14*
