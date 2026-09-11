---
type: project-doc
title: LensFlare — Product and Architecture Document
project: lens-flare
created: 2026-03-31
updated: 2026-08-26
tags: [spec, architecture]
memory: [project_lensflare]
---

# LensFlare — Product & Architecture Document

> **Version:** 1.0  
> **Date:** April 2, 2026  
> **Status:** Alpha  

---

## 1. Product Overview

**LensFlare** is a web-based design critique platform that enables design teams to share work-in-progress designs, collect structured feedback, and track review progress. Think of it as "pull requests for design" — designers post Critique Requests (CRs), attach artifacts (Figma files, Loom recordings, images, URLs), assign reviewers, and receive categorized feedback through threaded comments.

### Core Value Proposition

- **Structured design reviews** with explicit design stages and feedback categories
- **Multi-artifact support** — Figma embeds, Loom embeds, image uploads, and arbitrary URLs in a single review
- **Team-based collaboration** with role management (admin/member)
- **Review tracking** — clear visibility into who has reviewed, what's unresolved, and current status

---

## 2. User Personas

| Persona | Description |
|---|---|
| **Designer (Author)** | Creates CRs to get feedback on designs at various stages. Attaches Figma files, screenshots, prototypes. |
| **Reviewer** | Assigned to review CRs. Leaves typed feedback (suggestions, questions, blockers, praise). Marks review as done. |
| **Team Admin** | Manages team membership, promotes/demotes members, invites new users. |
| **App Admin** | Has global admin role. Can toggle Demo Mode for showcasing the product. |

---

## 3. Information Architecture & Navigation

### 3.1 Route Map

| Route | Page | Description |
|---|---|---|
| `/auth` | Auth | Login/signup (email + Google OAuth) |
| `/team-setup` | Team Setup | Shown when user has no teams — create or join |
| `/` | Dashboard | Card grid of all CRs with status/team filters |
| `/dashboard` | Feed | List view focused on "Needs My Review" and "My CRs" |
| `/cr/new` | Create CR | Full CR creation form |
| `/cr/:id` | CR Detail | View a CR with artifacts, comments, reviewer sidebar |
| `/cr/:id/edit` | Edit CR | Same form as Create, pre-populated |
| `/settings` | Settings | Team list, create/join teams, edit team details |
| `/settings/team/:teamId` | Team Detail | Member management, invites, role admin |

### 3.2 Navigation Structure

- **Header (sticky)**: Logo ("LensFlare"), nav links (Dashboard, Feed with pending review badge), "New CR" button, user avatar dropdown menu
- **User Menu**: Settings, Show Tour, Demo Mode toggle (admin only), Sign Out
- **Dashboard filter bar**: Team switcher dropdown → vertical divider → status filter tabs (All, Open, In Review, My CRs, Needs My Review)

---

## 4. Feature Specifications

### 4.1 Authentication

**Implementation:** Supabase Auth with email/password and Google OAuth.

- Email signup requires verification (auto-confirm is disabled)
- On first Google login, avatar and name sync from Google metadata to the `profiles` table
- Admin role is checked via a `has_role` database function (security definer to avoid RLS recursion)
- Session persistence via Supabase client

**Post-Auth Flow:**
1. User signs in → AuthProvider loads profile + admin status
2. If user belongs to zero teams → redirected to Team Setup
3. Otherwise → Dashboard

### 4.2 Teams

**Data Model:**
- `teams`: id, name, slack_channel (optional, stored for future Slack integration), created_by, created_at
- `team_members`: id, team_id, user_id, role (admin | member), joined_at — unique on (team_id, user_id)

**Features:**
- **Create Team**: Name + optional Slack channel
- **Join Team**: Browse and join any existing team
- **Leave Team**: Self-removal with confirmation
- **Team Switcher**: Dropdown on the Dashboard that filters CRs by team
- **Edit Team**: Creator can rename and update Slack channel
- **Active Team**: Persisted in localStorage, carried across sessions

**Role Management (Team Detail page):**
- Team admins can:
  - Add existing users as members
  - Remove members
  - Promote members to admin / demote admins to member
  - **Constraint:** The team creator cannot be demoted — their crown icon is always shown
- Invite by email (creates `team_invites` record with pending/accepted status)

### 4.3 Critique Requests (CRs)

A CR is the core entity. It represents a design artifact (or set of artifacts) submitted for review.

**CR Fields:**
| Field | Type | Description |
|---|---|---|
| title | string | Required. The headline of the review request. |
| description | string | Optional. Context about what feedback is needed. |
| design_stage | enum | Required. One of: Exploration 🔵, Wireframe 🟡, High-fidelity 🟣, Prototype 🟢, Final Review 🔴 |
| status | enum | draft, open, in-review, changes-requested, approved, closed |
| project_tag | string | Optional free-text project label |
| team_id | uuid | Associates CR with a team (nullable for backward compat) |
| author | user ref | The creator |
| artifacts | array | Attached design files/links |
| reviewers | array | Assigned reviewers with status |

**Design Stages** serve as a signal to reviewers about what *kind* of feedback is appropriate:
- **Exploration**: Feedback on direction, assumptions, and alternatives
- **Wireframe**: Structural feedback on flows and layout
- **High-fidelity**: Visual polish, interaction details, edge cases
- **Prototype**: Interactive review — test the flow yourself
- **Final Review**: Last eyes before handoff/ship

**Status Lifecycle:** Draft → Open → In Review → Changes Requested / Approved → Closed  
Status can be changed manually by any viewer (dropdown on CR Detail page).

### 4.4 Artifacts

Artifacts are links or uploads attached to a CR.

**Supported Types:**
| Type | Detection | Rendering |
|---|---|---|
| `figma` | URL contains `figma.com` | Figma embed iframe |
| `loom` | URL contains `loom.com` | Loom embed iframe |
| `figjam` | URL contains `figjam` | Stored as type, rendered as external link |
| `image` | File upload or image URL pattern | `<img>` tag, max 500px height |
| `url` | Fallback for any other URL | External link card with 🔗 icon |

**Upload Support:**
- Drag-and-drop onto the artifact zone
- Paste from clipboard (image detection)
- File browser (image/* only, 10MB limit)
- Uploaded to Supabase Storage bucket `artifact-uploads`

**Ordering:** Artifacts are drag-sortable during creation/editing. Sort order is persisted.

**Thumbnails:** After CR creation, an edge function (`fetch-artifact-thumbnails`) runs in the background to generate/fetch thumbnail URLs for non-image artifacts.

### 4.5 Comments & Feedback

Comments are threaded and typed. Each comment has a **comment type**:

| Type | Emoji | Use Case |
|---|---|---|
| Suggestion 💡 | Actionable improvement idea |
| Question ❓ | Clarification needed |
| Blocker 🚫 | Must fix before proceeding |
| Praise 👍 | Positive reinforcement |

**Comment Features:**
- **Threaded replies**: Any top-level comment can receive replies (nested one level)
- **Resolution**: Top-level comments can be marked Resolved/Unresolved (toggle)
- **Resolve tracking**: `resolved_by` records who resolved it
- **Comment type selection**: Picker shown above the text input with colored pills
- **Inline display**: Comments are interleaved chronologically with review events in the timeline

### 4.6 Review Tracking

Each CR has assigned **reviewers**. Each reviewer has a status:

| Status | Meaning |
|---|---|
| `pending` | Reviewer hasn't marked their review as done |
| `reviewed` | Reviewer clicked "Mark Done" |

**Review Flow:**
1. Author assigns reviewers during CR creation
2. Each reviewer sees a "Mark Done" button on the CR Detail page
3. Clicking it toggles between `pending` and `reviewed`
4. Each toggle creates a `cr_event` record (type: `review_completed` or `review_undone`)
5. Events appear in the comment timeline as system messages (e.g., "Alex finished their review")

**Sidebar Display:** The reviewer panel on CR Detail shows each reviewer with their avatar, name, and status (pending clock icon or green checkmark).

### 4.7 Dashboard

The main landing page displays CRs as **visual cards** in a responsive grid (1→2→3 columns).

**Card Anatomy:**
- Thumbnail (first artifact's image or type icon)
- Design stage badge + status pill
- Project tag
- Title (2-line clamp)
- Author avatar + name
- Comment count + review progress (e.g., "2/3")

**Filtering:**
- **Team Switcher**: Dropdown showing "All Teams" + user's teams. Filters CRs by `team_id`.
- **Status Tabs**: All, Open, In Review, My CRs, Needs My Review

**Cards use hover animations** (translateY -4px with elevated shadow) via the `card-hover` utility class.

### 4.8 Feed

A focused list view with two tabs:
- **Needs My Review**: CRs where the current user is a pending reviewer
- **My CRs**: CRs authored by the current user

Each item shows design stage, status, author, time ago, comment count, and a "Start Review →" action for pending reviews.

### 4.9 Onboarding Tour

A guided tour system with two variants:

1. **Main Tour** (triggered from user menu → "Show Tour"): Highlights nav elements — Dashboard link, Feed link, New CR button, profile area
2. **Create CR Tour** (auto-triggered on first CR creation): Walks through title, design stage, description, artifacts, reviewers, and publish button

Tours use `data-tour` attributes on target elements and display tooltip-style overlays with step-by-step guidance.

### 4.10 Demo Mode

Available to app admins only (users with `admin` role in `user_roles` table).

- Toggle from user menu
- Swaps real data providers with mock data providers (`DemoCRProvider`, `DemoTeamProvider`)
- Shows a yellow banner: "Demo Mode — viewing mock data"
- Header styling changes (accent-colored border, demo badge)
- "New CR" button is hidden in demo mode
- Mock data includes: sample teams, team members, CRs across all stages/statuses, comments, and reviewers

---

## 5. Design System

### 5.1 Typography

| Role | Font | Weights |
|---|---|---|
| Body text | DM Sans | 400, 500, 600, 700 |
| Headings (h1–h6) | Space Grotesk | 400, 500, 600, 700 |
| Base size | 15px | — |

### 5.2 Color Palette (HSL)

**Light Mode:**
| Token | HSL | Usage |
|---|---|---|
| `--background` | 30 33% 98% | Page background |
| `--foreground` | 20 20% 14% | Primary text |
| `--card` | 30 25% 97% | Card surfaces |
| `--primary` | 12 80% 58% | Brand color (warm orange-red) |
| `--accent` | 24 90% 62% | Secondary brand |
| `--secondary` | 30 30% 93% | Muted backgrounds |
| `--muted-foreground` | 20 8% 52% | Secondary text |
| `--border` | 30 15% 90% | Borders |
| `--destructive` | 0 72% 55% | Error/danger |

**Dark Mode:** Inverted luminance with same hue family. Background `20 15% 8%`, card `20 15% 11%`.

**Semantic Status Colors:**
| Token | Color | Status |
|---|---|---|
| `--status-draft` | Gray | Draft |
| `--status-open` | Blue | Open |
| `--status-inreview` | Amber | In Review |
| `--status-changes` | Red | Changes Requested |
| `--status-approved` | Green | Approved |
| `--status-closed` | Dark Gray | Closed |

**Design Stage Colors:**
| Stage | Color |
|---|---|
| Exploration | Blue (210°) |
| Wireframe | Yellow (45°) |
| High-fidelity | Purple (280°) |
| Prototype | Green (145°) |
| Final Review | Red (0°) |

**Comment Type Colors:**
| Type | Color |
|---|---|
| Suggestion | Blue |
| Question | Amber |
| Blocker | Red |
| Praise | Green |

### 5.3 Visual Effects

- **Gradient (warm):** `linear-gradient(135deg, primary, accent)` — used on CTA buttons, logo background
- **Card shadow:** Subtle multi-layer shadow with brand-tinted hover state
- **Animations:** Framer Motion for page transitions (fade + slide), card stagger animations, hover scale effects
- **Backdrop blur:** Header uses `backdrop-blur-xl` for glass effect
- **Border radius:** `0.75rem` (12px) default, `rounded-xl` for cards, `rounded-full` for badges/pills

### 5.4 Component Library

Built on **shadcn/ui** (Radix primitives + Tailwind). Key custom components:

| Component | Description |
|---|---|
| `CRCard` | Visual card with thumbnail, stage badge, status, metadata |
| `DesignStageBadge` | Colored pill with emoji + stage label |
| `StatusPill` | Small colored indicator for CR status |
| `TeamSwitcher` | Dropdown filter for switching between teams |
| `Header` | Sticky nav with logo, links, actions, user menu |
| `OnboardingTour` | Step-by-step guided overlay tour |

---

## 6. Architecture

### 6.1 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript 5 |
| Build | Vite 5 |
| Styling | Tailwind CSS v3 + shadcn/ui |
| Animation | Framer Motion |
| Routing | React Router v6 |
| State | React Context (no external state library) |
| Data Fetching | Supabase JS Client (direct) |
| Realtime | Supabase Realtime (Postgres Changes) |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Testing | Vitest + Playwright |

### 6.2 Context Architecture

The app uses layered React Context providers, nested as follows:

```
AuthProvider
  └── TeamProvider
       └── DemoModeProvider
            └── CRProviderSwitch (real or demo based on mode)
                 ├── CRProvider (production — fetches from Supabase)
                 └── DemoCRProvider + DemoTeamProvider (mock data)
                      └── OnboardingProvider
                           └── Routes
```

**Key Contexts:**

| Context | Responsibilities |
|---|---|
| `AuthContext` | Session, user profile, admin check, sign out |
| `TeamContext` | User's teams, all teams, CRUD operations, active team (localStorage) |
| `DemoModeContext` | Boolean toggle for demo mode |
| `CRContext` | All CR data fetching, mutations (add/update/comment/review), realtime subscriptions |
| `DemoCRContext` | In-memory mock CRs for demo mode |
| `DemoTeamContext` | Mock teams/members for demo mode |
| `OnboardingContext` | Tour state management (active tour, start/stop) |

### 6.3 Data Flow

1. **On mount:** `AuthProvider` listens to `onAuthStateChange`, fetches profile + admin role
2. **TeamProvider** fetches user's team memberships and all teams
3. **TeamGate** component checks if user has ≥1 team; if not, shows TeamSetup
4. **CRProvider** (or DemoCRProvider) fetches all CRs + artifacts + reviewers + comments + events in parallel, then assembles into rich `CritiqueRequest` objects client-side
5. **Realtime**: CRProvider subscribes to Postgres changes on `comments`, `cr_events`, `reviewers`, and `critique_requests` tables — any change triggers a full refetch

### 6.4 Database Schema

```
profiles
├── id (uuid, PK — matches auth.users.id)
├── name (text)
├── avatar_url (text, nullable)
├── onboarding_dismissed (boolean)
├── created_at, updated_at

teams
├── id (uuid, PK)
├── name (text)
├── slack_channel (text, nullable)
├── created_by (uuid)
├── created_at

team_members
├── id (uuid, PK)
├── team_id (uuid)
├── user_id (uuid)
├── role (text: 'admin' | 'member')
├── joined_at
├── UNIQUE(team_id, user_id)

team_invites
├── id (uuid, PK)
├── team_id (uuid)
├── email (text)
├── invited_by (uuid)
├── status (text: 'pending' | 'accepted')
├── created_at

critique_requests
├── id (uuid, PK)
├── title (text)
├── description (text)
├── author_id (uuid)
├── status (text)
├── design_stage (text)
├── project_tag (text, nullable)
├── team_id (uuid, nullable)
├── created_at, updated_at

artifacts
├── id (uuid, PK)
├── cr_id (uuid, FK → critique_requests)
├── type (text)
├── url (text)
├── thumbnail_url (text, nullable)
├── title (text, nullable)
├── sort_order (integer)
├── created_at

reviewers
├── id (uuid, PK)
├── cr_id (uuid, FK → critique_requests)
├── user_id (uuid)
├── status (text: 'pending' | 'reviewed')
├── reviewed_at (timestamptz, nullable)
├── created_at

comments
├── id (uuid, PK)
├── cr_id (uuid, FK → critique_requests)
├── author_id (uuid)
├── parent_id (uuid, nullable, FK → comments — for threading)
├── artifact_id (uuid, nullable, FK → artifacts)
├── body (text)
├── comment_type (text: 'suggestion' | 'question' | 'blocker' | 'praise')
├── resolved (boolean, default false)
├── resolved_by (uuid, nullable)
├── created_at

cr_events
├── id (uuid, PK)
├── cr_id (uuid, FK → critique_requests)
├── type (text: 'review_completed' | 'review_undone')
├── actor_id (uuid)
├── metadata (jsonb, nullable)
├── created_at

user_roles
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users)
├── role (enum: 'admin' | 'user')
├── UNIQUE(user_id, role)
```

**Note:** Foreign keys to `auth.users` are avoided on most tables. The `profiles` table serves as the public-facing user data store. User IDs are stored as plain UUIDs without FK constraints (except `user_roles`).

### 6.5 Row-Level Security (RLS)

All tables have RLS enabled. Key patterns:
- **profiles**: Users can read all profiles; can only update their own
- **teams**: Authenticated users can read all; only creator can update/delete
- **team_members**: Authenticated users can read all; users can insert themselves; deletion by self or team creator
- **critique_requests, artifacts, comments, reviewers, cr_events**: Authenticated users have broad read/write access (collaborative by design)
- **user_roles**: Accessed via `has_role()` security definer function to prevent RLS recursion

### 6.6 Edge Functions

| Function | Purpose |
|---|---|
| `fetch-artifact-thumbnails` | Called after CR creation/update. Fetches thumbnail URLs for non-image artifacts (e.g., Figma, Loom) and updates the `artifacts` table. |

### 6.7 Storage

| Bucket | Purpose |
|---|---|
| `artifact-uploads` | User-uploaded images for CR artifacts. Path: `{user_id}/{timestamp}-{random}.{ext}` |

### 6.8 Realtime

Postgres Changes subscriptions on four tables enable live updates:
- `comments` — new comments appear instantly
- `cr_events` — review completions show in timeline
- `reviewers` — reviewer status changes reflect immediately
- `critique_requests` — status changes, edits propagate

---

## 7. File Structure

```
src/
├── App.tsx                    # Root component, routing, provider nesting
├── main.tsx                   # Entry point
├── index.css                  # Design tokens, Tailwind config, custom utilities
│
├── components/
│   ├── Header.tsx             # Sticky nav with logo, links, user menu
│   ├── CRCard.tsx             # Visual card for dashboard grid
│   ├── DesignStageBadge.tsx   # Colored stage indicator
│   ├── StatusPill.tsx         # Small status label
│   ├── TeamSwitcher.tsx       # Team filter dropdown
│   ├── NavLink.tsx            # Reusable nav link
│   ├── OnboardingTour.tsx     # Guided tour overlay
│   └── ui/                    # shadcn/ui primitives (button, card, dialog, etc.)
│
├── context/
│   ├── AuthContext.tsx         # Auth state, profile, admin check
│   ├── TeamContext.tsx         # Team CRUD, active team
│   ├── CRContext.tsx           # CR data fetching, mutations, realtime
│   ├── DemoCRContext.tsx       # Mock CR data for demo mode
│   ├── DemoTeamContext.tsx     # Mock team data for demo mode
│   ├── DemoModeContext.tsx     # Demo mode toggle
│   └── OnboardingContext.tsx   # Tour state
│
├── pages/
│   ├── Auth.tsx                # Login/signup page
│   ├── Dashboard.tsx           # Card grid with filters
│   ├── Feed.tsx                # List view (needs review / my CRs)
│   ├── CreateCR.tsx            # CR creation/edit form
│   ├── CRDetail.tsx            # Full CR view with comments
│   ├── Settings.tsx            # Team management
│   ├── TeamDetail.tsx          # Team members & invites
│   ├── TeamSetup.tsx           # First-time team selection
│   └── NotFound.tsx            # 404 page
│
├── types/
│   └── cr.ts                   # All TypeScript types, enums, config constants
│
├── data/
│   └── mockData.ts             # Mock data for demo mode
│
├── hooks/
│   ├── use-mobile.tsx          # Responsive breakpoint hook
│   └── use-toast.ts            # Toast notification hook
│
├── integrations/
│   └── supabase/
│       ├── client.ts           # Auto-generated Supabase client
│       └── types.ts            # Auto-generated database types
│
└── lib/
    └── utils.ts                # Utility functions (cn, etc.)

supabase/
├── config.toml                 # Supabase project configuration
├── functions/
│   └── fetch-artifact-thumbnails/
│       └── index.ts            # Edge function for thumbnail fetching
└── migrations/                 # Database migration files
```

---

## 8. Key User Flows

### 8.1 New User Onboarding
1. User signs up via email or Google
2. Verifies email (if email signup)
3. Lands on Team Setup — creates or joins a team
4. Redirected to Dashboard
5. Onboarding tour auto-starts (can be retriggered from menu)

### 8.2 Creating a CR
1. Click "New CR" in header
2. Enter title (required)
3. Select design stage (required)
4. Add description
5. Attach artifacts (drag/drop, paste, URL, file browse)
6. Reorder artifacts by dragging
7. Select reviewers from team members
8. Optionally add project tag
9. "Publish CR" (status: open) or "Save Draft" (status: draft)
10. Background: thumbnail fetch runs for non-image artifacts

### 8.3 Reviewing a CR
1. Navigate from Feed ("Needs My Review") or Dashboard
2. View artifacts (embedded Figma/Loom, images, links)
3. Read existing comments in threaded timeline
4. Add comments with type selection (suggestion/question/blocker/praise)
5. Reply to existing comments
6. Resolve/unresolve comments
7. Click "Mark Done" to complete review
8. System event logged in timeline

### 8.4 Managing a Team
1. Go to Settings → click team → Team Detail page
2. View member list with roles
3. Admin actions: add members, invite by email, promote/demote, remove
4. Team creator has permanent admin status (crown icon, cannot be demoted)

---

## 9. Future Considerations

The following are partially built or planned features visible in the codebase:

1. **Slack Integration**: Teams have a `slack_channel` field. An edge function for Slack notifications was designed but not yet connected (requires Slack app authorization). Planned notifications: new CR created, CR approved.
2. **Artifact-level comments**: The `artifact_id` field on comments exists but is not yet used in the UI — would enable pin-pointing feedback to specific artifacts.
3. **Email notifications**: Not yet implemented; could notify reviewers when assigned or when comments are added.
4. **Advanced filtering**: Dashboard could support search, date range, multi-tag filtering.
5. **Review approval workflow**: Reviewer status currently only has `pending`/`reviewed`. Could add `approved`/`changes-requested` per-reviewer for formal approval gates.

---

## 10. Non-Functional Requirements

| Requirement | Implementation |
|---|---|
| **Authentication** | Supabase Auth (email + Google OAuth) |
| **Authorization** | RLS on all tables; `has_role()` security definer function |
| **Realtime** | Supabase Realtime on 4 tables |
| **Responsive** | Tailwind responsive classes, 1-3 column grid |
| **Dark mode** | Full dark mode via CSS variables (`.dark` class) |
| **Performance** | Vite build, lazy loading candidates identified |
| **File uploads** | 10MB limit, image/* only, Supabase Storage |
| **Animations** | Framer Motion for transitions and micro-interactions |
