# Testing Patterns

**Analysis Date:** 2026-05-14

## Test Framework

**Runner:**
- Vitest 3.2
- Config: `vitest.config.ts`

**Assertion Library:**
- Vitest built-in (`expect`, `describe`, `it`)
- `@testing-library/jest-dom` 6.6 — DOM matchers (imported in `src/test/setup.ts`)

**Component Testing:**
- `@testing-library/react` 16 — installed, not yet used in any test

**E2E:**
- `@playwright/test` 1.57 — installed
- Config: `playwright.config.ts`
- Fixture: `playwright-fixture.ts`
- No E2E tests written yet

**Run Commands:**
```bash
bun test              # Run all tests once (vitest run)
bun run test:watch    # Watch mode (vitest)
npx vitest            # Alternative via npx
```

## Test File Organization

**Location:**
- Centralized: `src/test/` for setup and standalone utility tests
- Co-location not yet established (no component tests exist)

**Naming:**
- `*.test.ts` or `*.test.tsx` for TypeScript test files
- `*.spec.ts` or `*.spec.tsx` also accepted (Vitest config includes both)

**Structure:**
```
src/
  test/
    setup.ts         # Global setup: jest-dom matchers + matchMedia mock
    example.test.ts  # Placeholder test (trivially passes)
```

## Test Structure

**Suite Organization:**
```typescript
// src/test/example.test.ts — the only test currently in the codebase
import { describe, it, expect } from "vitest";

describe("example", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  });
});
```

**Patterns:**
- Setup: `src/test/setup.ts` is automatically imported before every test via Vitest config `setupFiles`
- `@testing-library/jest-dom` extends `expect` with DOM matchers globally
- `matchMedia` is mocked in setup (required for any component using media queries)
- Vitest globals (`describe`, `it`, `expect`, `beforeEach`, etc.) are enabled — no explicit import needed when `globals: true` in config

## Mocking

**Framework:** Vitest built-in (`vi.mock`, `vi.fn`, `vi.spyOn`)

**Patterns (established by setup, not yet used):**
- `window.matchMedia` is mocked in `src/test/setup.ts:3-15`
- Supabase client would need to be mocked via `vi.mock('@/integrations/supabase/client')` for any context tests

**What to Mock:**
- Supabase client — required for any test touching `CRContext`, `TeamContext`, or `AuthContext`
- `localStorage`/`sessionStorage` — required for `TeamContext` (active team key) and onboarding tour state

**What NOT to Mock:**
- Domain logic in `src/types/cr.ts` constants (`DESIGN_STAGES`, `STATUS_CONFIG`) — use real values
- `src/lib/utils.ts` (`cn()`) — use real implementation

## Fixtures and Factories

**Test Data:**
```typescript
// Demo mode mock data doubles as test fixtures
// src/data/mockData.ts
import { MOCK_CRS, CURRENT_USER, TEAM_MEMBERS, MOCK_TEAMS } from '@/data/mockData';
```

The demo mode mock data in `src/data/mockData.ts` provides 6 realistic `CritiqueRequest` objects with comments, reviewers, artifacts, and events. These can be imported directly in tests.

**Location:**
- `src/data/mockData.ts` — reusable fixture data

## Coverage

**Requirements:** None enforced — no coverage threshold in `vitest.config.ts`

**View Coverage:**
```bash
bun run vitest --coverage
# or
npx vitest --coverage
```

## Test Types

**Unit Tests:**
- Target: utility functions, type guards, domain logic
- Framework: Vitest
- Where to place: `src/test/` or co-located as `ComponentName.test.ts`

**Integration Tests (component):**
- Target: context providers with mocked Supabase, page components with mocked context
- Framework: Vitest + `@testing-library/react`
- Pattern not yet established — `@testing-library/react` is installed but unused

**E2E Tests:**
- Framework: Playwright (`@playwright/test`)
- Config: `playwright.config.ts` and `playwright-fixture.ts` exist
- Status: No tests written — infrastructure is in place

## Common Patterns

**Async Testing:**
```typescript
// Pattern for testing async context mutations
import { describe, it, expect, vi } from "vitest";

it("should update CR status", async () => {
  // Mock supabase
  vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
      from: vi.fn(() => ({
        update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
      })),
    },
  }));
  // ... test body
});
```

**Error Testing:**
```typescript
it("should handle missing CR gracefully", () => {
  // CRDetail renders "CR not found" when cr is undefined
  // Test by passing an id that doesn't exist in the mock CRS array
});
```

## Notes on Current State

The test suite is effectively empty — `src/test/example.test.ts` is a placeholder that always passes. The infrastructure is fully configured (Vitest + jsdom + jest-dom + matchMedia mock + Playwright) but no meaningful tests exist for any component, context, or utility.

When adding tests, the highest-value targets are:
1. `assembleData()` in `src/context/CRContext.tsx` — pure function, complex join logic, no dependencies
2. `detectArtifactType()` in `src/pages/CreateCR.tsx` — pure function, URL pattern matching
3. `getTimeAgo()` in `src/pages/CRDetail.tsx` — pure function, time formatting
4. `cn()` in `src/lib/utils.ts` — trivially testable

---

*Testing analysis: 2026-05-14*
