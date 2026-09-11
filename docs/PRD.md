---
type: project-doc
title: LensFlare PRD
project: lens-flare
created: 2026-03-31
updated: 2026-08-26
tags: [prd, design-critique]
memory: [project_lensflare]
---

# PRD: LensFlare — Design Critique as a First-Class Workflow

> **Status:** Draft v3 — name finalized
> **Author:** Mark Hazlewood (Staff Product Designer, DPG)
> **Date:** 2026-03-30
> **Target MVP:** 1 week from kickoff
> **Prototype approach:** Standalone web app (vibe coded), designed for eventual migration to internal stack
> **Day-one audience:** DPG UX team (6-8 designers)
> **Name:** LensFlare (lens-flare) — the lens is perspective; the flare is the signal that draws reviewers in

---

## 1. Problem Statement

Design teams at HubSpot lack a structured, accountable workflow for design critique. Today, critique happens informally — squeezed into the tail end of team meetings, posted as Looms in Slack with inconsistent uptake, or skipped entirely. The result:

- **Low visibility** into what teammates are working on ("If someone asks what Jono is working on, I don't know")
- **Critique gets deprioritized** — good intentions, but standup/topics always eat the time
- **Async feedback is unreliable** — Looms and Figma links posted in Slack get inconsistent engagement
- **No accountability** — unlike code PRs, there's no expectation or mechanism for required review
- **No follow-through tracking** — feedback given in crit sessions isn't tracked to resolution
- **Prep friction** — designers don't have a natural moment to package work for review (especially Monday mornings)
- **Artifact fragmentation** — work lives across Figma, code prototypes, Looms, FigJam, screen recordings with no unified view

**The core insight:** Software engineers solved this exact problem with the Pull Request. PRs create a structured, async-first, accountable review workflow with required reviewers, threaded discussion, status tracking, and approval gates. Design has no equivalent. The crit request (CR) — powered by LensFlare — is that equivalent.

### Why now?

- DPG UX team is actively discussing splitting their meeting to create dedicated crit time (meeting on 2026-03-30)
- Design workflows are bifurcating — some designers work in Figma, others in code prototypes, others in FigJam — making a unified review surface more urgent
- Multiple team members expressed the need independently (Roary, Mark, Jono all raised aspects of this)
- HubSpot's old internal tool "Wave" (Pinterest-like design board) is gone, leaving a visibility gap
- No existing tool in the market fills this niche — Figma comments are too informal, and no tool replicates the PR model's accountability structure

---

## 2. Vision

**LensFlare makes design review as natural and accountable as a pull request — but designed for designers, not developers.**

A designer packages their work — Figma frames, prototype URLs, Looms, screenshots, anything — into a CR with context about what stage it's at and what feedback they need. Reviewers are assigned (or volunteer). The CR tracks the lifecycle of the critique: who's been asked, who's responded, what's resolved, what's still open.

**LensFlare is an orchestration layer, not another annotation tool.** Detailed feedback still happens where it's best — Figma comments on designs, Loom responses on walkthroughs, threaded discussion on the CR itself for higher-level feedback. LensFlare ties it all together, tracks the review lifecycle, and makes sure nothing falls through the cracks.

The "Pinterest board" and the "PR" are the same thing — the feed of open CRs *is* the visibility into what everyone's working on.

### Design Philosophy

While the CR workflow echoes GitHub PRs conceptually, the aesthetic and interaction design should be **distinctly for designers**:

- **Visual-first**: Rich previews, thumbnail galleries, embedded media — not data tables
- **Bright, warm, expressive**: Fun to use, not clinical. Think Dribbble energy, not Jira energy
- **Idea-forward**: The artifact (the design) is always the hero, not metadata
- **Low ceremony**: Creating a CR should feel like sharing something cool, not filing a ticket
- **Interactive**: Hover previews, smooth transitions, delightful micro-interactions

### Deployment Strategy

**Phase 1 (now):** Standalone web app — vibe coded as a prototype, deployed to **lensflare.design** (Vercel/Netlify). Fastest path to a working tool the team can use immediately.

**Phase 2 (future):** If adoption warrants it, migrate to HubSpot's internal platform. The architecture should be clean enough to port — standard web stack, REST/GraphQL API, no exotic dependencies.

---

## 3. Target Users

### Primary: DPG UX Design Team (6-8 people)
- Product designers working on HubSpot's developer platform
- Mix of tenures: some deeply familiar with the platform, some new
- Work in Figma, FigJam, code prototypes (Claude Code + Trellis), Looms
- Current pain: low visibility, inconsistent crit, no structured review process

### Secondary: Adjacent HubSpot Design Teams
- Other product design teams with the same crit challenges
- Design system team (Trellis) — component review is a natural CR use case
- Could expand to cross-team design review

### Tertiary: Non-Designer Stakeholders
- PMs, engineers, and leadership who want visibility into design work
- Read-only or comment-only participation
- "What is the design team working on?" answered by the CR feed

---

## 4. Goals & Success Metrics

### Goals
1. **Make critique a habit, not an event** — shift from scheduled crit meetings to continuous, async-first review
2. **Create accountability** — every designer should be reviewing others' work regularly
3. **Increase visibility** — anyone can see what the design team is working on at a glance
4. **Capture feedback that sticks** — comments are threaded, tracked, and resolvable
5. **Support any artifact type** — Figma, code prototypes, Looms, screenshots, URLs

### Success Metrics (post-MVP)
- Number of CRs created per week (target: 2+ per designer)
- Average time-to-first-review (target: <24 hours)
- Percentage of CRs with at least one review (target: >90%)
- Team self-reported satisfaction with critique process (qualitative)
- Reduction in "I don't know what X is working on" sentiment

---

## 5. Core Concepts

### The Critique Request (CR)
A CR is a package of design work submitted for review. It contains:

- **Title** — what you're sharing (e.g., "Release Management — Version Detail Page v2")
- **Description** — context about the work, what stage it's at, what feedback you're looking for
- **Design stage tag** — signals what kind of feedback is appropriate:
  - `Exploration` — early concepts, feedback on direction and assumptions
  - `Wireframe` — structural feedback on flows and layout
  - `High-fidelity` — visual polish, interaction details, edge cases
  - `Prototype` — interactive review, test the flow yourself
  - `Final review` — last eyes before handoff/ship
- **Artifacts** — the actual design work, embedded or linked:
  - Figma frames (embedded preview + link)
  - Prototype URLs (Figma prototypes, deployed code prototypes, staging links)
  - Loom/video recordings (embedded)
  - Screenshots/images (uploaded or pasted)
  - FigJam boards
  - Any URL
- **Reviewers** — assigned people whose feedback is requested (not required to block, but tracked)
- **Status** — `Draft` → `Open` → `In Review` → `Changes Requested` → `Approved` → `Closed`
  - **Soft gate**: CRs can't move to `Approved` without at least 1 completed review. This isn't blocking any real workflow — it creates a ritual of completion
- **Project/team tag** — which project or team this belongs to

### Feedback & Comments

LensFlare supports two layers of feedback:

**1. On-platform (CR-level) feedback** — threaded comments on the CR itself for high-level, cross-artifact, and process-oriented discussion:
- **Threaded comments** on the CR overall or on specific artifacts
- **Comment types** (lightweight, not bureaucratic):
  - 💡 **Suggestion** — "Have you considered..."
  - ❓ **Question** — "What happens when..."
  - 🚫 **Blocker** — "This doesn't meet [accessibility/brand/pattern] standards"
  - 👍 **Praise** — "This is great because..."
- **Resolvable threads** — mark feedback as addressed, like GitHub PR comments

**2. Off-platform (deep) feedback** — detailed, artifact-specific feedback happens in the native tool:
- Figma comments on specific frames (linked back to the CR)
- Loom video responses
- FigJam annotations
- LensFlare tracks that this feedback exists and whether it's been addressed, but doesn't try to replicate those tools' annotation capabilities

### The Feed
- A living view of all CRs across the team
- Filterable by: status, author, reviewer, project, design stage, date
- Gallery/card view — each CR shows a thumbnail preview of the primary artifact
- This IS the "Pinterest board" / "Wave" replacement — passive visibility into all work

### Review Dashboard
- "My reviews" — CRs assigned to me for review
- "My CRs" — CRs I've authored
- Review activity metrics (lightweight, not punitive) — how active is the team in reviewing?

---

## 6. Key Interactions

### Creating a CR
1. Click "New CR" (or use a quick-create shortcut)
2. Add title, description, design stage
3. Attach artifacts — paste Figma links (auto-embeds preview), upload images, paste Loom URLs, add any URL
4. Optionally assign reviewers (can also be picked up organically)
5. Set status: Draft (not ready for eyes) or Open (ready for review)
6. Publish — appears in the feed, notifies assigned reviewers

### Reviewing a CR
1. Open CR from feed, notification, or "My Reviews" dashboard
2. View all artifacts inline — Figma embeds, video players, image gallery
3. Leave threaded comments — general or on specific artifacts
4. Tag comment type (suggestion, question, blocker, praise)
5. For image artifacts: click to annotate at specific coordinates
6. Submit review: "Looks good" / "Has feedback" / "Blocker" (overall status)
7. Author can mark threads as resolved, update artifacts, re-request review

### Browsing the Feed
1. Open the app — see a card grid of all recent/open CRs
2. Each card: thumbnail, title, author avatar, design stage badge, status, comment count
3. Filter/sort by any dimension
4. Click through to any CR for full detail
5. This is the "what is everyone working on?" view

---

## 7. Integration Points

LensFlare's value is proportional to how seamlessly it integrates with designers' existing tools. The goal: creating a CR should feel like a natural extension of the design workflow, not a separate admin task.

### MVP — Embed & Preview
- **Figma** — paste a Figma URL → embedded live frame preview (Figma embed API / oEmbed). Link back to the Figma file for detailed commenting
- **Loom** — paste a Loom URL → embedded video player
- **Image upload** — drag-and-drop or paste screenshots directly
- **Any URL** — Open Graph preview card with thumbnail, title, description
- **FigJam** — paste a FigJam URL → embedded board preview

### Milestone 2 — Notify & Connect
- **Slack notifications** — notify reviewers when assigned, notify author on new feedback. Configurable per-user
- **Slack quick-create** — slash command (`/cr`) or emoji reaction in a channel creates a CR from a shared Figma/Loom link
- **Linear integration** — link CRs to Linear issues/projects for traceability between design and engineering work

### Milestone 3 — Companion Figma Plugin
A Figma plugin that brings LensFlare into the designer's primary workspace:
- **Create CR from Figma** — select frames, add context, assign reviewers without leaving Figma
- **See CR status** — badge/indicator on frames that are part of an active CR
- **Jump to CR** — open the full CR view from within Figma
- **Sync comments** — surface Figma comments made on CR-linked frames back in the CR timeline (read-only sync)

### Future — Intelligence & Hosting
- **AI-powered review suggestions** — accessibility checks, design system compliance, heuristic review
- **Prototype hosting** — deploy code prototypes directly from a CR (like Shopify's internal tooling)
- **Calendar integration** — schedule sync crit sessions around open CRs

---

## 8. What Makes This Different from "Just Use Figma Comments"

LensFlare doesn't replace Figma comments — it orchestrates the entire critique workflow across tools.

| Dimension | Figma Comments | LensFlare |
|-----------|---------------|-------------|
| **Role** | Annotation tool (where feedback lives) | Orchestration layer (tracks the review lifecycle) |
| **Scope** | Single Figma file | Any artifact across any tool |
| **Accountability** | No assignment or tracking | Assigned reviewers, soft approval gates |
| **Status** | None | Draft → Open → In Review → Approved → Closed |
| **Visibility** | Must open each file individually | Feed shows all team work at a glance |
| **Follow-through** | Threads easily lost | Resolvable threads, tracked to completion |
| **Audience** | Figma users only | Anyone with a browser |
| **Design stage** | No context | Explicit stage signals what feedback level is appropriate |
| **Integration** | Figma only | Figma + Loom + FigJam + prototypes + any URL |

---

## 9. Milestones

### MVP — Week 1: "The Core Loop"
Ship the fundamental create → review → respond cycle with the feed. Designed for the DPG UX team (6-8 people). Rough edges are fine — this is an internal alpha.

**In scope:**
- Create a CR: title, description, design stage tag
- Attach artifacts: image upload + any URL with rich preview (Figma, Loom, FigJam, prototype URLs)
- Figma link auto-embed (oEmbed or live embed iframe)
- Loom embed (oEmbed)
- Assign reviewers from team roster
- CR status workflow: Draft → Open → In Review → Closed
- Soft gate: at least 1 review required to close as "Approved"
- Threaded comments on CRs with comment type tags (suggestion, question, blocker, praise)
- Mark comment threads as resolved
- **The Feed**: visual card grid of all CRs — thumbnail preview, title, author avatar, stage badge, status pill, comment count. Filterable by status, author, project
- "My Reviews" and "My CRs" dashboard views
- Simple auth: invite-based (email magic link or Google SSO)
- In-app notification indicators (unread reviews, new comments)
- **Slack notifications** — notify reviewers when assigned to a CR, notify CR author when new feedback arrives. Delivered via Slack bot/webhook to the team's crit channel and/or DMs
- **Visual design**: bright, warm, designer-friendly aesthetic. The artifact is the hero — large previews, gallery layouts, smooth interactions

**Out of scope for MVP:**
- Visual annotation / spatial commenting on images
- Slack slash command quick-create (Milestone 2)
- Linear integration
- Figma plugin
- Review activity metrics
- AI-powered features
- Cross-team / multi-team support

### Milestone 2 — Week 2-3: "Polish & Enrich"
- Full status workflow with `Changes Requested` and `Approved` states
- Slack slash command `/cr` for quick-create from shared links
- Visual annotation: pin comments to coordinates on image artifacts
- Review activity dashboard (lightweight — who's reviewing, who's waiting)
- Enhanced project/team tagging and filtering
- Polish: transitions, hover previews, loading states, delightful empty states
- Email digest option (daily summary of open CRs needing attention)

### Milestone 3 — Month 2: "Figma Plugin & Scale"
- **Companion Figma plugin** — create CRs from selected frames, see CR status on frames, jump to CR
- Linear integration (link CRs to issues/projects)
- Cross-team support (multiple teams, team-level feeds)
- Search across CRs, comments, artifacts
- Figma comment sync (surface Figma comments on CR-linked frames in the CR timeline)

### Milestone 4 — Future: "Intelligence & Hosting"
- AI design review suggestions (accessibility checks, design system compliance, heuristic review)
- Prototype hosting — deploy code prototypes directly from a CR
- Analytics: team critique health metrics, bottleneck identification
- Calendar integration for scheduling sync crit around open CRs

---

## 10. Design Principles

1. **Async-first, sync-compatible** — the tool should work great without ever being in a meeting together, but also support live review sessions
2. **Low friction to create** — posting a CR should be as easy as dropping a Figma link in Slack, not harder
3. **Accountability without bureaucracy** — reviewers are tracked, but this isn't a gate that blocks shipping. Culture, not compliance
4. **Stage-appropriate feedback** — the design stage tag prevents "wrong level" feedback (don't nitpick colors on an exploration)
5. **Visibility as a byproduct** — you don't have to do extra work to make your work visible; creating a CR *is* making it visible
6. **Any artifact, any tool** — not Figma-only. Code prototypes, Looms, screenshots, URLs all first-class
7. **Comments that resolve** — every piece of feedback has a lifecycle (open → addressed → resolved), preventing the "feedback black hole"

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Low adoption** — designers don't create CRs | Tool is useless | Make CR creation extremely low-friction; integrate with existing workflow (Slack); start with team commitment |
| **Review fatigue** — assigned reviewers don't engage | Same problem as today | Keep reviews lightweight; comment types reduce friction; track review activity visibly (social pressure) |
| **Over-engineering the process** | Feels like busywork, not creativity | Keep MVP minimal; design stage tags prevent over-scrutiny; no formal gates in MVP |
| **Artifact fragmentation** — embeds break or look bad | Poor experience | Prioritize image upload (always works) over embeds; graceful fallback to URL + preview card |
| **"Just use Figma" pushback** | Resistance to new tool | Emphasize what Figma can't do: cross-tool visibility, accountability, any-artifact support, the feed |

---

## 12. Open Questions

> Most questions resolved. Remaining items for consideration during build:

1. **Slack channel strategy** — Does LensFlare's Slack bot post to the existing team channel, a dedicated #dpg-ux-crit channel, or just DMs? Recommendation: dedicated channel + DMs for assigned reviews
2. **Data model for "teams"** — Even for MVP, should we model teams/groups (for future multi-team support), or just a flat user list? Recommendation: flat user list for MVP, add team model in Milestone 3
3. **Figma embed approach** — Figma's embed API requires the viewer to be signed into Figma. Acceptable for MVP since all users are HubSpot designers with Figma accounts. Add server-side screenshot fallback in Milestone 2 for non-Figma users

---

## 13. Prototyping Context (for handoff)

This section provides enough context for a human developer or AI coding agent to start building the MVP.

### Tech Preferences
- **Frontend**: React + TypeScript (or Next.js for full-stack)
- **Styling**: Tailwind CSS — fast to iterate, easy to make visually rich
- **Database**: Supabase (Postgres + auth + realtime) or similar BaaS for speed
- **Deployment**: Vercel or Netlify
- **Auth**: Supabase Auth (magic link or Google SSO) — keep it simple for 6-8 users
- **File storage**: Supabase Storage or Cloudinary for image uploads
- **Realtime**: Supabase Realtime for live comment updates (nice-to-have for MVP)

### Design References & Mood
The aesthetic should feel like a creative tool, not a project management tool:
- **Dribbble** — the card grid, the visual-first browsing, the "shots" as hero content
- **Linear** — the polish, the keyboard shortcuts, the speed and responsiveness
- **Notion** — the clean typography, the block-based content, the collaborative feel
- **Pinterest** — the masonry grid, the visual discovery, the "board" as a collection
- **NOT Jira** — no dense tables, no enterprise chrome, no gray everything

**Color direction**: Warm, vibrant. Think coral/salmon accents, soft gradients, generous white space. Designer-friendly, not developer-dark-mode.

### Key UI Surfaces (MVP)

1. **The Feed** (home) — masonry or card grid of CRs. Each card: large artifact thumbnail, title, author avatar, design stage badge (color-coded), status pill, comment count. Hover to preview. Click to open.

2. **CR Detail View** — hero artifact display (embedded Figma, Loom player, image gallery). Below: description, metadata sidebar (status, reviewers, stage, project). Below that: threaded comment stream with type badges.

3. **Create CR** — modal or dedicated page. Title, description (rich text), design stage selector (visual chips, not dropdown), artifact attachment zone (drag-drop + URL paste), reviewer assignment (avatar picker). Should feel like composing a post, not filling a form.

4. **My Dashboard** — two tabs: "My CRs" (authored) and "My Reviews" (assigned). Cards with status indicators. Badges for items needing attention.

### Screen Specs (wireframe-level)

#### Screen 1: The Feed (Home / `/`)

The primary surface. This is what you see when you open LensFlare. It answers: "What is everyone working on, and what needs my attention?"

```
┌─────────────────────────────────────────────────────────────┐
│  🎨 LensFlare                    [My Reviews (3)] [+ New CR] │
│                                                               │
│  ┌─ Filter Bar ──────────────────────────────────────────┐   │
│  │ [All] [Open] [In Review] [My CRs] [Needs My Review]  │   │
│  │ Stage: [All ▾]  Author: [All ▾]  Project: [All ▾]    │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │       │
│  │ │          │ │  │ │          │ │  │ │          │ │       │
│  │ │  Figma   │ │  │ │  Loom    │ │  │ │ Screenshot│ │       │
│  │ │ preview  │ │  │ │ thumbnail│ │  │ │  image   │ │       │
│  │ │          │ │  │ │          │ │  │ │          │ │       │
│  │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │       │
│  │              │  │              │  │              │       │
│  │ Version Detail│  │ Onboarding  │  │ Nav IA       │       │
│  │ Page v2       │  │ Flow Crit   │  │ Proposal     │       │
│  │              │  │              │  │              │       │
│  │ 🟣 High-fi   │  │ 🟡 Wireframe │  │ 🔵 Exploration│       │
│  │ ● Open       │  │ ● In Review  │  │ ● Draft      │       │
│  │              │  │              │  │              │       │
│  │ 👤 Mark    💬3│  │ 👤 Roary  💬7│  │ 👤 TJ     💬0│       │
│  │ 👁 2 reviews │  │ 👁 1 review  │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ...                     │
│  │   ...        │  │   ...        │                          │
│  └──────────────┘  └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

**Card anatomy:**
- **Hero thumbnail** — largest element. Auto-generated from the primary artifact (Figma embed screenshot, Loom thumbnail, uploaded image). 16:10 or 4:3 aspect ratio.
- **Title** — bold, 1-2 lines, truncated with ellipsis
- **Design stage badge** — color-coded chip: 🔵 Exploration, 🟡 Wireframe, 🟣 High-fidelity, 🟢 Prototype, 🔴 Final Review
- **Status pill** — Draft (gray), Open (blue), In Review (amber), Changes Requested (red), Approved (green), Closed (gray)
- **Author avatar** + name
- **Comment count** icon
- **Review count** — "2 of 3 reviewed" or similar
- **Hover**: subtle scale-up + shadow lift. Show description preview tooltip.

**Layout**: Responsive card grid. 3 columns on desktop, 2 on tablet, 1 on mobile. Cards are roughly equal height (masonry optional for V2, fixed grid for MVP).

**Empty state**: Illustrated empty state with "No CRs yet — share something you're working on!" and a prominent "+ New CR" button. Warm, encouraging tone.

---

#### Screen 2: CR Detail View (`/cr/:id`)

The full view of a single LensFlare. This is where review happens.

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Feed          CR-14: Version Detail Page v2      │
│                                                               │
│  ┌─ Header ──────────────────────────────────────────────┐   │
│  │ 👤 Mark Hazlewood · Created Mar 28 · Updated 2h ago  │   │
│  │ 🟣 High-fidelity  ● Open  📁 Release Management      │   │
│  │                                                        │   │
│  │ [Edit] [Change Status ▾]                               │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ Description ─────────────────────────────────────────┐   │
│  │ Second iteration of the version detail page. Updated  │   │
│  │ based on usability test feedback — simplified the      │   │
│  │ version history timeline and added release notes       │   │
│  │ preview. Looking for feedback on:                      │   │
│  │ • Is the timeline scannable enough?                    │   │
│  │ • Does the release notes preview make sense here?      │   │
│  │ • Any Trellis component misuse?                        │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ Artifacts ───────────────────────────────────────────┐   │
│  │                                                        │   │
│  │  ┌────────────────────────────────────────────────┐   │   │
│  │  │                                                │   │   │
│  │  │         [Embedded Figma Frame]                 │   │   │
│  │  │         (live interactive embed)               │   │   │
│  │  │                                                │   │   │
│  │  │                                                │   │   │
│  │  └────────────────────────────────────────────────┘   │   │
│  │  🔗 Open in Figma                                     │   │
│  │                                                        │   │
│  │  ┌────────────────────────────────────────────────┐   │   │
│  │  │         [Embedded Loom Video]                   │   │   │
│  │  │         (play inline)                          │   │   │
│  │  └────────────────────────────────────────────────┘   │   │
│  │  🔗 Open in Loom                                      │   │
│  │                                                        │   │
│  │  ┌──────┐ ┌──────┐ ┌──────┐                          │   │
│  │  │ img1 │ │ img2 │ │ img3 │  ← thumbnail gallery     │   │
│  │  └──────┘ └──────┘ └──────┘    click to expand        │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ Sidebar ─────────┐  ┌─ Comments ────────────────────┐   │
│  │                    │  │                                │   │
│  │ Reviewers          │  │ 💬 3 comments · 1 unresolved  │   │
│  │ ┌───┐ Roary       │  │                                │   │
│  │ │ 👤│ ✅ Reviewed  │  │ ┌─ Jono · 💡 Suggestion ───┐ │   │
│  │ └───┘              │  │ │ The timeline feels dense.  │ │   │
│  │ ┌───┐ Jono        │  │ │ Could we collapse older    │ │   │
│  │ │ 👤│ ✅ Reviewed  │  │ │ versions by default?       │ │   │
│  │ └───┘              │  │ │                            │ │   │
│  │ ┌───┐ TJ          │  │ │ ↳ Mark: Good call, I'll   │ │   │
│  │ │ 👤│ ⏳ Pending   │  │ │   try accordion. ✅ Resolved│ │   │
│  │ └───┘              │  │ └────────────────────────────┘ │   │
│  │                    │  │                                │   │
│  │ [+ Add reviewer]  │  │ ┌─ Roary · 🚫 Blocker ─────┐ │   │
│  │                    │  │ │ The release notes preview  │ │   │
│  │ Status             │  │ │ doesn't account for long   │ │   │
│  │ [Open ▾]          │  │ │ content. What happens with  │ │   │
│  │                    │  │ │ 500+ word release notes?    │ │   │
│  │ Soft gate:         │  │ │                   ○ Open   │ │   │
│  │ 1 of 2 reviewed   │  │ └────────────────────────────┘ │   │
│  │ ⚠️ Need 1 more    │  │                                │   │
│  │ review to approve  │  │ ┌─ New comment ─────────────┐ │   │
│  │                    │  │ │ Type: [💡][❓][🚫][👍]      │ │   │
│  └────────────────────┘  │ │ [Write a comment...]       │ │   │
│                          │ │              [Submit]       │ │   │
│                          │ └────────────────────────────┘ │   │
│                          └────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Layout**: Two-column on desktop. Artifacts + comments take ~70% width. Sidebar (reviewers, status, metadata) takes ~30%. On mobile: single column, sidebar collapses to a top summary bar.

**Artifact display rules:**
- Figma URLs → live embedded frame (Figma embed API). "Open in Figma" link below
- Loom URLs → embedded video player. "Open in Loom" link below
- Images → inline display (click to lightbox/zoom). Multiple images show as a thumbnail row
- Other URLs → Open Graph preview card (thumbnail + title + description + link)
- Artifacts are displayed in author-defined sort order

**Comment anatomy:**
- Author avatar + name
- Comment type badge (color-coded: 💡 blue, ❓ amber, 🚫 red, 👍 green)
- Comment body (rich text — bold, italic, links, code)
- Timestamp
- Thread replies (indented)
- Resolved toggle (checkmark) — only CR author or comment author can resolve
- Artifact reference (optional) — "On: [artifact name]" if comment is about a specific artifact

**Status change actions:**
- Author can change status via dropdown
- When moving to "Approved": system checks soft gate (at least 1 review). If not met, shows warning but doesn't hard-block
- Status change is logged in the comment stream as a system event

---

#### Screen 3: Create CR (`/cr/new`)

Should feel like composing a social media post or a Notion page — not filling out a form.

```
┌─────────────────────────────────────────────────────────────┐
│  New LensFlare                              [Save Draft] [Publish] │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Give your CR a title...                                 │ │
│  │ (large, bold, placeholder text)                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─ Design Stage ────────────────────────────────────────┐   │
│  │                                                        │   │
│  │  [🔵 Exploration] [🟡 Wireframe] [🟣 High-fi]        │   │
│  │  [🟢 Prototype]   [🔴 Final Review]                   │   │
│  │                                                        │   │
│  │  (visual chips — click to select, selected = filled)  │   │
│  │  Helper text below selected: "Exploration — feedback   │   │
│  │  on direction, assumptions, and alternatives"          │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ Description ─────────────────────────────────────────┐   │
│  │ What are you sharing? What feedback do you need?       │   │
│  │ (rich text editor — bold, lists, links)                │   │
│  │                                                        │   │
│  │                                                        │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ Artifacts ───────────────────────────────────────────┐   │
│  │                                                        │   │
│  │  ┌──────────────────────────────────────────────────┐ │   │
│  │  │                                                  │ │   │
│  │  │   📎 Drop images here, or paste a URL           │ │   │
│  │  │                                                  │ │   │
│  │  │   Supports: Figma, Loom, FigJam, images, any URL│ │   │
│  │  │                                                  │ │   │
│  │  └──────────────────────────────────────────────────┘ │   │
│  │                                                        │   │
│  │  Added:                                                │   │
│  │  ┌────────┐                                           │   │
│  │  │ Figma  │ Version Detail Page v2                    │   │
│  │  │ embed  │ figma.com/design/abc123...  [🔗] [✕]     │   │
│  │  └────────┘                                           │   │
│  │  ┌────────┐                                           │   │
│  │  │ Loom   │ Walkthrough recording                     │   │
│  │  │ thumb  │ loom.com/share/xyz789...    [🔗] [✕]     │   │
│  │  └────────┘                                           │   │
│  │                                                        │   │
│  │  [+ Add another artifact]                              │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ Reviewers ───────────────────────────────────────────┐   │
│  │                                                        │   │
│  │  Who should review this?                               │   │
│  │                                                        │   │
│  │  [👤 Roary ✕] [👤 Jono ✕] [+ Add reviewer]           │   │
│  │                                                        │   │
│  │  (avatar chips — searchable dropdown to add)          │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ Project (optional) ──────────────────────────────────┐   │
│  │  [Release Management ▾]                                │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│                              [Save as Draft]  [Publish CR]   │
└─────────────────────────────────────────────────────────────┘
```

**Interaction details:**
- **Title**: Auto-focus on load. Large, bold input. No label — the placeholder IS the prompt
- **Design stage chips**: Horizontal row of colored chips. Click to select (only one). Below the selected chip, show a helper description of what kind of feedback is appropriate at this stage
- **Description**: Rich text (Tiptap or similar). Supports bold, italic, bullet lists, links. Placeholder guides: "What are you sharing? What feedback do you need?"
- **Artifact zone**: Drag-and-drop zone + URL paste input. When a URL is pasted, auto-detect type (Figma, Loom, FigJam, generic) and show preview. Images can be dragged in or pasted from clipboard. Each added artifact shows as a card with thumbnail, title, link, and remove button. Artifacts are reorderable (drag handles)
- **Reviewers**: Avatar chip selector. Type to search team members. Selected reviewers appear as dismissible chips with avatars
- **Publish**: Publishes the CR as "Open", notifies reviewers via Slack. "Save as Draft" saves but doesn't notify

---

#### Screen 4: My Dashboard (`/dashboard`)

Personal view of CRs that need your attention.

```
┌─────────────────────────────────────────────────────────────┐
│  🎨 LensFlare          [Feed] [Dashboard●] [+ New CR]     │
│                                                               │
│  ┌─ Tabs ────────────────────────────────────────────────┐   │
│  │  [Needs My Review (3)] [My CRs (5)] [All Activity]   │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ── Needs My Review ─────────────────────────────────────    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ 🟡 Onboarding Flow Crit           ● In Review       │     │
│  │ 👤 Roary · 2 days ago · 💬 7 comments               │     │
│  │ "Looking for feedback on the new stepper pattern..." │     │
│  │                                      [Start Review →]│     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ 🔵 Data Hub IA Exploration         ● Open            │     │
│  │ 👤 Pat · 5 hours ago · 💬 0 comments                │     │
│  │ "Early exploration of consolidated data views..."     │     │
│  │                                      [Start Review →]│     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  ── My CRs ──────────────────────────────────────────────    │
│  (same card format, showing status + review progress)        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Dashboard cards**: More compact than feed cards — list format instead of grid. Emphasis on status, action needed, and recency. "Start Review" CTA for items awaiting your review.

**Notification dot**: The Dashboard nav item shows a dot/badge when there are unreviewed CRs assigned to you.

---

#### Screen 5: Slack Notifications

Slack messages are the primary pull mechanism — they bring people back to LensFlare.

**New CR assigned to reviewer:**
```
🎨 New LensFlare for you to review

*Version Detail Page v2* by Mark Hazlewood
🟣 High-fidelity · Release Management

"Second iteration based on usability test feedback.
Looking for feedback on timeline scannability and
release notes preview placement."

[View CR →]  [Open in Figma →]
```

**New comment on your CR:**
```
💬 Jono left feedback on your CR

*Version Detail Page v2*
💡 Suggestion: "The timeline feels dense. Could we
collapse older versions by default?"

[View Comment →]
```

**CR status change:**
```
✅ Your CR was approved

*Onboarding Flow Crit* — approved by Roary
All reviewers have completed their review.

[View CR →]
```

**Design**: Slack messages use Block Kit for rich formatting. Include action buttons that deep-link to the CR. Keep messages concise — the goal is to pull people into the app, not replicate the full experience in Slack.

---

### Data Model (conceptual)

```
User { id, name, email, avatar_url }

LensFlare {
  id, title, description,
  author_id → User,
  status: Draft | Open | InReview | ChangesRequested | Approved | Closed,
  design_stage: Exploration | Wireframe | HighFidelity | Prototype | FinalReview,
  project_tag: string (optional),
  created_at, updated_at
}

Artifact {
  id, cr_id → LensFlare,
  type: image | figma | loom | figjam | url,
  url: string,
  thumbnail_url: string (optional),
  title: string (optional),
  sort_order: number
}

Reviewer {
  cr_id → LensFlare,
  user_id → User,
  status: Pending | Reviewed | Approved | ChangesRequested,
  reviewed_at: timestamp (optional)
}

Comment {
  id, cr_id → LensFlare,
  author_id → User,
  parent_id → Comment (nullable, for threading),
  artifact_id → Artifact (nullable, for artifact-specific comments),
  body: string,
  comment_type: Suggestion | Question | Blocker | Praise,
  resolved: boolean,
  resolved_by → User (nullable),
  created_at
}
```

---

## Appendix A: Competitive Landscape

**No direct competitor exists.** The CR concept fills a genuine gap:

- **Figma** — collaborative design, but critique is a secondary feature (comments only, no workflow)
- **InVision** — shut down Dec 2024; was the closest to structured design review but lost to Figma
- **Abstract** — Git-like version control for design, but too focused on file management
- **Zeplin** — designer-to-developer handoff, not critique
- **Pastel** — lightweight visual feedback but expensive ($29/user/mo), 72-hour comment expiration
- **HubSpot's "Wave"** — internal Pinterest board, now defunct. LensFlare's feed is the spiritual successor

The PR model in software engineering is the proven reference architecture: GitHub PRs, GitLab MRs, Bitbucket PRs all demonstrate that structured, async, accountable review works at scale.

## Appendix B: Source Context

This PRD is informed by:
- **DPG UX Team Time meeting** (2026-03-30) — transcript of the team discussion that surfaced these problems and the CR concept
- **Design critique research** — NNGroup, Figma's internal methods, A List Apart async critique patterns
- **Code review effectiveness data** — GitHub Staff Engineering, Swarmia research (reviews catch 55-60% of defects vs 25-45% from testing)
- **Market analysis** — current state of design review tools (Figma, Penpot, Zeplin, Abstract, Pastel)
- **Microsoft Engineering Playbook** — async design review patterns

## Appendix C: Key Quotes from Team Discussion

> "What I feel like I'm missing out on is crit and visibility into everybody's work. It's really hard. If someone wants to be like, what is Jono working on? I don't know." — Roary

> "Devs have the same problem and through the PR work process [they solved it]... I wonder if there's some, from a process sense and a tooling sense, we could piggyback on the PR model where like, here's a thing, I need some eyes on it, and it's actually part of accountability for doing your job." — Mark

> "Review process... there's some sort of required layer there where people are, in fact, needing to review in order to get approved. And that works very well. Which is actually much more equivalent of what a PR is." — Jono

> "I share a lot of prototypes and screen recordings with my team in our channels... but the uptake to actually reviewing them is kind of inconsistent." — Jono

> "We used to use a tool called Wave. It was like an internal Pinterest board. People would put stuff on it... We need something like that." — Pat

> "They had this tool where designers could basically create a live feed of what they're working on." — Mark (on Shopify's internal tooling)

> "Design workflows are going to start bifurcating in the way we work on design quite a bit. So definitely a topic that I think is worth coming back to and trying to think about holistically." — Pat
