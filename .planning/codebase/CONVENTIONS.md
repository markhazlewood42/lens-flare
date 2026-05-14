# Coding Conventions

**Analysis Date:** 2026-05-14

## Naming Patterns

**Files:**
- Pages: PascalCase — `CRDetail.tsx`, `CreateCR.tsx`, `TeamSetup.tsx`
- Context providers: PascalCase + `Context` in filename — `CRContext.tsx`, `AuthContext.tsx`
- shadcn/ui components: kebab-case — `alert-dialog.tsx`, `scroll-area.tsx`
- Hooks: kebab-case with `use-` prefix — `use-mobile.tsx`, `use-toast.ts`
- Types/constants file: camelCase or PascalCase — `cr.ts`, `mockData.ts`

**React Components:**
- PascalCase for all component functions — `function CRCard()`, `function TeamGate()`
- Default export for pages: `export default function Dashboard()`
- Named exports for context providers and hooks: `export function CRProvider()`, `export function useCR()`

**Variables and Functions:**
- camelCase — `filteredCRs`, `handleSubmitComment`, `detectArtifactType`
- Boolean state: verb prefix — `loading`, `uploading`, `creating`, `saving`
- Event handlers: `handle` prefix — `handlePublish`, `handleLeave`, `handleJoin`, `handleDrop`
- Toggle handlers: `toggle` prefix — `toggleReviewer`, `toggleDemoMode`

**Types and Interfaces:**
- PascalCase — `CritiqueRequest`, `CRContextType`, `ReviewerStatus`
- Interface suffix `Type` for context shapes — `CRContextType`, `AuthContextType`
- Union type aliases: PascalCase — `CRStatus`, `DesignStage`, `CommentType`, `FilterTab`

**Constants:**
- SCREAMING_SNAKE_CASE — `DESIGN_STAGES`, `COMMENT_TYPES`, `STATUS_CONFIG`, `MOCK_CRS`, `ACTIVE_TEAM_KEY`

**CSS Classes / Tailwind:**
- Utility-first inline Tailwind classes in JSX
- CSS custom property names: kebab-case — `--stage-exploration`, `--status-inreview`, `--shadow-card`
- Tailwind config extends: kebab-case keys — `stage.exploration`, `status.inreview`
- Custom CSS classes: kebab-case — `gradient-warm`, `card-hover`

## Code Style

**Formatting:**
- No Prettier config detected — formatting is manual or editor-driven
- Single quotes for string literals
- Semicolons used consistently
- Trailing commas in multi-line arrays/objects

**Linting:**
- ESLint 9 flat config in `eslint.config.js`
- Rules: `typescript-eslint` recommended + `react-hooks` recommended + `react-refresh`
- `@typescript-eslint/no-unused-vars` is **disabled** — unused vars do not produce errors
- `react-refresh/only-export-components` is `warn`

## Import Organization

**Order (consistent across files):**
1. React core — `import { useState, useEffect } from 'react'`
2. Third-party libraries — `react-router-dom`, `framer-motion`, `lucide-react`, `sonner`
3. Internal context — `import { useCR } from '@/context/CRContext'`
4. Internal types — `import { CRStatus, COMMENT_TYPES } from '@/types/cr'`
5. Local/sibling components — `import CRCard from '@/components/CRCard'`

**Path Aliases:**
- `@/` maps to `src/` — configured in `vite.config.ts` and `vitest.config.ts`
- Use `@/` for all cross-directory imports; avoid relative paths like `../../`

## Error Handling

**Patterns:**
- Supabase writes: `if (error || !data) return` — silent failure is common. Only some mutations surface errors via toast
- Async in context mutations: `try/finally` pattern for loading state (no `catch` that surfaces to UI in most places)
- Form guards: early return with disabled button — `if (!title.trim() || !stage) return`
- Context hook guards: throw `Error` if hook used outside provider — `if (!ctx) throw new Error('useCR must be used within CRProvider')`
- Edge function errors: caught with `try/catch` in Deno handler, returns JSON `{ error: string }` with appropriate HTTP status

## Logging

**Framework:** `console` (no structured logging library)

**Patterns:**
- No active `console.log` calls in source (cleaned up)
- Errors surfaced to users via `sonner` toast (imported as `import { toast } from 'sonner'`)
- Upload errors: `toast.error(err.message || 'Upload failed')`
- Team mutation success: `toast.success('Team updated')`

## Comments

**When to Comment:**
- Inline `// eslint-disable-next-line` suppression for known false positives
- Block comments to explain non-obvious Supabase RLS logic (see `supabase/migrations/06_*.sql`)
- `// Fetch thumbnails in background` and similar inline intent markers
- Context file header: `// Exported so DemoCRProvider can also provide to this context`

**No JSDoc/TSDoc** in the codebase — types are self-documenting via TypeScript interfaces.

## Function Design

**Size:** Pages are large (CRDetail 455 lines, CreateCR 429 lines) with multiple sub-components defined in the same file. Context files are 90-255 lines each.

**Parameters:** Prefer destructured props for components. Context mutation signatures use explicit parameter lists.

**Return Values:**
- Context mutations return `void` or `Promise<void>` (mutations are fire-and-refetch)
- `createTeam` returns `Promise<Team | null>` — null signals failure
- `joinTeam` returns `Promise<boolean>` — false signals failure

**Async:**
- All Supabase calls are `async/await`
- `useCallback` used for all context mutations to stabilize references for `useEffect` dependencies

## Module Design

**Exports:**
- Pages: one default export per file (the page component)
- Context files: named exports only — provider function + hook + optional type re-exports
- Types: all named exports from `src/types/cr.ts`
- shadcn/ui: follows shadcn patterns (default + named component exports)

**Barrel Files:** None. Import directly from the file — `import { useCR } from '@/context/CRContext'`, not `import { useCR } from '@/context'`

**Supabase Client:** Import the singleton from `src/integrations/supabase/client.ts` — `import { supabase } from '@/integrations/supabase/client'`. Never instantiate `createClient` elsewhere.

---

*Convention analysis: 2026-05-14*
