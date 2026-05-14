# Codebase Structure

**Analysis Date:** 2026-05-14

## Directory Layout

```
lens-flare/
├── src/                        # Application source
│   ├── main.tsx                # React DOM entry point
│   ├── App.tsx                 # Root: providers, routes, auth/team gates
│   ├── App.css                 # App-level styles (minimal)
│   ├── index.css               # CSS custom properties (theme tokens, fonts)
│   ├── vite-env.d.ts           # Vite environment type declarations
│   ├── types/
│   │   └── cr.ts               # All domain types + display constants
│   ├── context/                # React Context providers (state layer)
│   │   ├── AuthContext.tsx
│   │   ├── CRContext.tsx
│   │   ├── DemoCRContext.tsx
│   │   ├── DemoModeContext.tsx
│   │   ├── DemoTeamContext.tsx
│   │   ├── OnboardingContext.tsx
│   │   └── TeamContext.tsx
│   ├── pages/                  # Route-level page components
│   │   ├── Auth.tsx
│   │   ├── CRDetail.tsx
│   │   ├── CreateCR.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Feed.tsx
│   │   ├── Index.tsx           # Unused — redirects to /
│   │   ├── NotFound.tsx
│   │   ├── Settings.tsx
│   │   ├── TeamDetail.tsx
│   │   └── TeamSetup.tsx
│   ├── components/             # Reusable domain components
│   │   ├── CRCard.tsx
│   │   ├── DesignStageBadge.tsx
│   │   ├── Header.tsx
│   │   ├── NavLink.tsx
│   │   ├── OnboardingTour.tsx
│   │   ├── StatusPill.tsx
│   │   ├── TeamSwitcher.tsx
│   │   └── ui/                 # shadcn/ui generated primitives (50+)
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts       # Supabase client singleton
│   │       └── types.ts        # Generated DB types
│   ├── data/
│   │   └── mockData.ts         # Demo mode fixtures
│   ├── hooks/
│   │   ├── use-mobile.tsx      # Mobile breakpoint hook
│   │   └── use-toast.ts        # Toast hook (shadcn pattern)
│   ├── lib/
│   │   └── utils.ts            # cn() class merge utility
│   └── test/
│       ├── example.test.ts     # Placeholder passing test
│       └── setup.ts            # Vitest setup (jest-dom, matchMedia mock)
├── supabase/
│   ├── config.toml             # Supabase project ID
│   ├── migrations/             # 10 numbered SQL migrations (01–10)
│   └── functions/
│       └── fetch-artifact-thumbnails/
│           └── index.ts        # Deno edge function
├── public/                     # Static assets (favicon, robots.txt)
├── docs/                       # Project docs (PRD, Lovable spec, session notes)
├── .planning/
│   └── codebase/               # GSD codebase maps (these files)
├── index.html                  # Vite HTML entry
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── postcss.config.js
├── components.json             # shadcn/ui config
├── vercel.json                 # SPA rewrite rule
├── .env.example                # Required env var template
└── status.md                   # Project status (living doc)
```

## Directory Purposes

**`src/types/`:**
- Purpose: All domain type definitions and display metadata constants
- Key file: `cr.ts` — contains every interface (`CritiqueRequest`, `Comment`, `Reviewer`, `Artifact`, `CREvent`, `User`) plus `DESIGN_STAGES`, `COMMENT_TYPES`, `STATUS_CONFIG` arrays used across the app
- Import as: `import { CritiqueRequest, DESIGN_STAGES } from '@/types/cr'`

**`src/context/`:**
- Purpose: All application state — Supabase data fetching, mutations, and in-memory demo mode
- Pattern: Each context exports a Provider component and a `useX()` hook
- Key files: `CRContext.tsx` (domain data), `AuthContext.tsx` (session), `TeamContext.tsx` (teams)

**`src/pages/`:**
- Purpose: Top-level views matched to routes. Each file is a default-export functional component
- Pattern: Pages read from context via hooks, manage local UI state with `useState`
- Route map:
  - `/` → `Dashboard.tsx`
  - `/cr/:id` → `CRDetail.tsx`
  - `/cr/new` and `/cr/:id/edit` → `CreateCR.tsx`
  - `/dashboard` → `Feed.tsx`
  - `/settings` → `Settings.tsx`
  - `/settings/team/:teamId` → `TeamDetail.tsx`
  - `/auth` → `Auth.tsx`
  - `/team-setup` → `TeamSetup.tsx`

**`src/components/`:**
- Purpose: Reusable UI components with domain knowledge
- `ui/` subdirectory: shadcn/ui generated primitives — do not hand-edit, regenerate via `shadcn` CLI

**`src/integrations/supabase/`:**
- Purpose: Supabase client initialization and generated type definitions
- `client.ts` is marked "automatically generated" — treat as owned infrastructure
- `types.ts` is generated from the Supabase schema

**`src/data/`:**
- Purpose: Static demo mode fixtures only. Not used in real/authenticated mode
- `mockData.ts` exports `MOCK_CRS`, `TEAM_MEMBERS`, `CURRENT_USER`, `MOCK_TEAMS`

**`src/test/`:**
- Purpose: Vitest test setup and test files
- `setup.ts` imported by Vitest config on every test run
- Test files should be co-located with source or placed here

**`supabase/migrations/`:**
- Purpose: Sequential SQL migrations for the Postgres schema
- Naming: `NN_YYYYMMDDHHMMSS_description.sql` (numbered 01–10)
- Applied via Supabase CLI or dashboard; not auto-applied on deploy

**`docs/`:**
- Purpose: Raw project artifacts — PRD, Lovable spec, session notes
- Not processed by the build

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React DOM mount
- `src/App.tsx`: Provider tree and route definitions
- `index.html`: Vite HTML shell

**Configuration:**
- `vite.config.ts`: Build + dev server
- `vitest.config.ts`: Test runner
- `tailwind.config.ts`: Design tokens (colors, fonts, shadows, animations)
- `src/index.css`: CSS custom properties (theme variables, dark mode)
- `components.json`: shadcn/ui CLI config
- `vercel.json`: Deployment SPA rewrite

**Core Logic:**
- `src/types/cr.ts`: Domain model — read this first when adding any new domain feature
- `src/context/CRContext.tsx`: All CR data operations
- `src/integrations/supabase/client.ts`: Supabase singleton

**Database:**
- `supabase/migrations/01_*.sql`: Initial schema (all tables, RLS, indexes)
- `supabase/migrations/06_*.sql`: Security hardening (email removal, policy fixes)
- `supabase/migrations/07_*.sql`: Teams and members schema

## Naming Conventions

**Files:**
- Pages: PascalCase matching the route concept — `CRDetail.tsx`, `CreateCR.tsx`, `TeamSetup.tsx`
- Context providers: PascalCase with `Context` suffix — `CRContext.tsx`, `TeamContext.tsx`
- shadcn/ui components: kebab-case — `alert-dialog.tsx`, `dropdown-menu.tsx`
- Hooks: kebab-case with `use-` prefix — `use-mobile.tsx`, `use-toast.ts`
- Domain data: camelCase with descriptive name — `mockData.ts`
- SQL migrations: `NN_YYYYMMDDHHMMSS_description.sql`

**Exports:**
- Pages: default export only, function name matches file name
- Context providers: named exports (`export function CRProvider`, `export function useCR`)
- Types: named exports from `src/types/cr.ts`
- Constants: SCREAMING_SNAKE_CASE (`DESIGN_STAGES`, `MOCK_CRS`, `STATUS_CONFIG`)

## Where to Add New Code

**New page/route:**
1. Create `src/pages/NewPage.tsx` with default export
2. Add `<Route>` in `src/App.tsx` inside `ProtectedRoutes`
3. Add nav link in `src/components/Header.tsx` if needed

**New domain type or constant:**
- Add to `src/types/cr.ts` alongside existing types

**New shared component:**
- If domain-aware (uses CR/Team types): `src/components/NewComponent.tsx`
- If generic UI primitive: use shadcn CLI to add to `src/components/ui/`

**New context / state slice:**
- Create `src/context/NewContext.tsx` following the existing pattern (createContext + Provider + useX hook)
- If it has a demo counterpart, also create `src/context/DemoNewContext.tsx`
- Wire into `App.tsx` provider tree

**New Supabase table:**
- Write migration as `supabase/migrations/NN_YYYYMMDDHHMMSS_description.sql`
- Regenerate `src/integrations/supabase/types.ts` via Supabase CLI

**New utility:**
- Small helpers: `src/lib/utils.ts`
- Hook that manages browser API: `src/hooks/use-name.tsx`

**Tests:**
- `src/test/` for standalone utility tests
- Co-located `ComponentName.test.tsx` next to the component for component tests

## Special Directories

**`src/components/ui/`:**
- Purpose: shadcn/ui generated components (Radix UI + Tailwind)
- Generated: Yes (by `shadcn` CLI)
- Committed: Yes
- Do not hand-edit. Update via `npx shadcn@latest add <component>` or `npx shadcn@latest update`

**`supabase/migrations/`:**
- Purpose: Database schema history
- Generated: No (hand-written SQL)
- Committed: Yes
- Sequential — do not reorder or rename after applying to production

**`dist/`:**
- Purpose: Vite production build output
- Generated: Yes
- Committed: No (in `.gitignore`)

**`.planning/codebase/`:**
- Purpose: GSD codebase maps (this directory)
- Generated: By Claude Code
- Committed: Optionally

---

*Structure analysis: 2026-05-14*
