# LensFlare

Structured design critique for design teams. The PR model applied to design review.

**Domain:** lensflare.design

## What it does

LensFlare orchestrates the design critique lifecycle. Designers create Critique Requests (CRs), attach design artifacts (Figma, images, Loom, FigJam, URLs), assign reviewers, and track feedback through to resolution. It's an orchestration layer that tracks the CR lifecycle, not an annotation tool.

### Core concepts

- **Critique Request (CR):** The unit of work. Has a lifecycle: draft > open > in-review > changes-requested > approved > closed.
- **Design stage:** Each CR declares its stage (exploration, wireframe, high-fidelity, prototype, final-review), which signals what kind of feedback is useful.
- **Artifacts:** Attachments to a CR (Figma embeds, images, Loom videos, FigJam boards, URLs).
- **Typed comments:** Feedback is categorized as suggestion, question, blocker, or praise. Blockers must be resolved before approval.
- **Teams:** Multi-team support with invites, roles (admin/member), and team switching.
- **Demo mode:** Full interactive walkthrough with mock data, no account required.

### Routes

| Path | Page | Description |
|------|------|-------------|
| `/auth` | Auth | Google OAuth sign-in |
| `/` | Dashboard | Personal CR overview (authored, reviewing, recent) |
| `/dashboard` | Feed | Team-wide CR feed with filters |
| `/cr/new` | CreateCR | New critique request form |
| `/cr/:id` | CRDetail | Full CR view with artifacts, reviewers, comments, timeline |
| `/cr/:id/edit` | CreateCR | Edit existing CR |
| `/settings` | Settings | User profile and preferences |
| `/settings/team/:teamId` | TeamDetail | Team management (members, invites, roles) |
| `/team-setup` | TeamSetup | First-run team creation/join flow |

## Tech stack

- **Framework:** Vite + React 18 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui (Radix primitives)
- **Backend:** Supabase (Postgres, Auth, Realtime, Edge Functions, Storage)
- **State:** React Context + TanStack Query
- **Fonts:** DM Sans + Space Grotesk
- **Design:** Warm orange gradient palette, full dark mode

## Project structure

```
src/
  components/       # Shared components (Header, CRCard, StatusPill, etc.)
  components/ui/    # shadcn/ui primitives
  context/          # React context providers
    AuthContext      # Supabase auth session + profile
    CRContext        # Live CR data (Supabase queries + realtime)
    DemoCRContext    # Mock CR data for demo mode
    DemoModeContext  # Demo mode toggle
    DemoTeamContext  # Mock team data for demo mode
    OnboardingContext # First-run onboarding tour state
    TeamContext      # Team membership, switching, invites
  hooks/            # Custom hooks (use-mobile, use-toast)
  integrations/
    supabase/       # Supabase client + generated types
  pages/            # Route-level page components
  types/
    cr.ts           # Domain types (CR, Artifact, Reviewer, Comment, etc.)
supabase/
  migrations/       # 10 sequential SQL migrations (schema, RLS, realtime, teams)
  functions/        # Edge functions (fetch-artifact-thumbnails)
  config.toml       # Supabase project config
```

## Database schema

10 tables with full Row Level Security:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (auto-created on signup) |
| `user_roles` | Role-based access (admin/user) |
| `critique_requests` | CRs with status and design stage |
| `artifacts` | Attachments linked to CRs |
| `reviewers` | Assigned reviewers with per-reviewer status |
| `comments` | Typed, threaded comments with resolve tracking |
| `cr_events` | Audit log (review_completed, review_undone) |
| `teams` | Team entities |
| `team_members` | Team membership with roles |
| `team_invites` | Pending team invitations |

Realtime subscriptions on: critique_requests, reviewers, comments, cr_events.

## Setup

### Prerequisites

- Node.js 18+ or Bun
- A Supabase project (or use `supabase start` for local dev)

### Install and run

```bash
# Install dependencies
bun install    # or: npm install --registry https://registry.npmjs.org

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase URL and anon key

# Apply migrations (if using Supabase CLI)
supabase db push

# Start dev server
bun dev        # or: npm run dev
# Opens at http://localhost:8080
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |

## Origin

Built as a Lovable prototype (2026-03-30), exported and migrated to standalone. The Lovable auth wrapper (`@lovable.dev/cloud-auth-js`) has been replaced with direct Supabase Auth. The `lovable-tagger` Vite plugin has been removed.

## Audience

Day-one users: DPG UX team at HubSpot (6-8 designers). Goal is to replace informal Slack/Figma-comment critique with a structured, trackable workflow.
