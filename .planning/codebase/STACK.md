# Technology Stack

**Analysis Date:** 2026-05-14

## Languages

**Primary:**
- TypeScript 5.8 - all frontend source (`src/`)
- SQL (PostgreSQL) - database migrations (`supabase/migrations/`)

**Secondary:**
- TypeScript (Deno runtime) - Supabase Edge Functions (`supabase/functions/`)
- CSS - theme tokens and global styles (`src/index.css`)

## Runtime

**Environment:**
- Node.js (dev/build) via Vite
- Deno - Supabase Edge Functions runtime
- Browser (production target)

**Package Manager:**
- Bun (primary) - `bun.lockb` present
- npm also works - `package-lock.json` present (both lockfiles committed)
- `bun dev` starts the server; `bun test` runs tests

## Frameworks

**Core:**
- React 18.3 - UI framework
- Vite 5.4 (SWC compiler via `@vitejs/plugin-react-swc`) - build tool and dev server
- React Router DOM 6.30 - client-side routing

**Styling:**
- Tailwind CSS 3.4 - utility classes
- shadcn/ui - component library (Radix UI primitives wrapped with Tailwind)
- tailwindcss-animate - keyframe animations
- framer-motion 12 - page/card entry animations

**State:**
- React Context API - all application state (no Redux or Zustand)
- TanStack Query 5.83 - `QueryClientProvider` mounted in `App.tsx` but not actively used in data fetching (CRContext uses direct Supabase calls instead)

**Testing:**
- Vitest 3.2 - test runner
- jsdom 20 - browser environment for tests
- @testing-library/react 16 + @testing-library/jest-dom 6 - component testing utilities
- @playwright/test 1.57 - E2E test framework (config present but no E2E tests written)

**Build/Dev:**
- Vite 5.4 - bundler and dev server (port 8080)
- typescript-eslint 8 + ESLint 9 - linting
- PostCSS + autoprefixer - CSS processing

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.101 - database, auth, storage, realtime, edge function invocation
- `react-router-dom` 6.30 - all navigation
- `framer-motion` 12.38 - motion animations on CRCard and page entries

**UI Components (all Radix-based via shadcn):**
- Full Radix UI suite (~25 packages) in `src/components/ui/`
- `lucide-react` 1.7 - icons throughout
- `sonner` 1.7 - toast notifications (alongside legacy `@radix-ui/react-toast`)
- `cmdk` 1.1 - command menu primitive (installed, not actively used)
- `next-themes` 0.3 - dark mode theming

**Forms:**
- `react-hook-form` 7.61 + `@hookform/resolvers` 3.10 + `zod` 3.25 - form handling and validation (installed, minimal use in current pages)

**Other:**
- `date-fns` 3.6 - date formatting
- `recharts` 2.15 - charts (installed but not currently used in any page)
- `class-variance-authority` + `clsx` + `tailwind-merge` - className utilities (`cn()` in `src/lib/utils.ts`)
- `vaul` 0.9 - drawer component

## Configuration

**Environment:**
- Two env vars required (see `.env.example`):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- Local values in `.env.local` (gitignored)
- Vite exposes them via `import.meta.env`

**Build:**
- `vite.config.ts` - dev server on port 8080, `@` alias to `src/`, React deduplication
- `vitest.config.ts` - jsdom environment, globals true, setup file, includes `src/**/*.{test,spec}.{ts,tsx}`
- `tsconfig.json` + `tsconfig.app.json` + `tsconfig.node.json` - three-config TypeScript setup
- `tailwind.config.ts` - custom colors for CR status, design stages, comment types, custom shadows and animations
- `postcss.config.js` - autoprefixer
- `eslint.config.js` - flat config, typescript-eslint, react-hooks, react-refresh plugins; `@typescript-eslint/no-unused-vars` disabled
- `components.json` - shadcn/ui config (specifies component output path, alias, Tailwind settings)

## Platform Requirements

**Development:**
- Bun or Node.js
- Supabase project with env vars configured (or demo mode works without backend)

**Production:**
- **Hosting:** Vercel (Hobby tier, personal account `markhazlewood42`)
- **Live URL:** https://lens-flare.vercel.app/
- **Domain:** `lensflare.design` (DNS not yet pointed — blocked by work computer)
- `vercel.json` - SPA rewrite: all routes → `/index.html`
- **Backend:** Supabase (self-managed project, personal account)
- **Edge Functions:** Supabase Edge Functions (Deno runtime) - 1 function deployed

---

*Stack analysis: 2026-05-14*
