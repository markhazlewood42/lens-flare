import { User, CritiqueRequest } from '@/types/cr';
import { Team } from '@/context/TeamContext';

export const TEAM_MEMBERS: User[] = [
  { id: '1', name: 'Mark Hazlewood', email: 'mark@hubspot.com', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mark' },
  { id: '2', name: 'Roary Chen', email: 'roary@hubspot.com', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Roary' },
  { id: '3', name: 'Jono Patel', email: 'jono@hubspot.com', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jono' },
  { id: '4', name: 'TJ Rodriguez', email: 'tj@hubspot.com', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TJ' },
  { id: '5', name: 'Pat Kim', email: 'pat@hubspot.com', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pat' },
  { id: '6', name: 'Sam Liu', email: 'sam@hubspot.com', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam' },
];

export const CURRENT_USER = TEAM_MEMBERS[0]; // Mark

export const MOCK_TEAMS: Team[] = [
  { id: 'team-1', name: 'Design Systems', slack_channel: '#design-systems', created_by: '1', created_at: '2026-03-01T10:00:00Z' },
  { id: 'team-2', name: 'Developer Platform', slack_channel: '#dev-platform-ux', created_by: '3', created_at: '2026-03-05T10:00:00Z' },
  { id: 'team-3', name: 'Growth & Onboarding', slack_channel: '#growth-design', created_by: '2', created_at: '2026-03-10T10:00:00Z' },
];

export const MOCK_CRS: CritiqueRequest[] = [
  {
    id: 'cr-1',
    title: 'Version Detail Page v2',
    description: 'Second iteration of the version detail page. Updated based on usability test feedback — simplified the version history timeline and added release notes preview.\n\nLooking for feedback on:\n• Is the timeline scannable enough?\n• Does the release notes preview make sense here?\n• Any Trellis component misuse?',
    author: TEAM_MEMBERS[0],
    status: 'open',
    design_stage: 'high-fidelity',
    project_tag: 'Release Management',
    artifacts: [
      { id: 'a1', cr_id: 'cr-1', type: 'figma', url: 'https://figma.com/design/abc123', title: 'Version Detail - Desktop', sort_order: 0 },
      { id: 'a2', cr_id: 'cr-1', type: 'loom', url: 'https://loom.com/share/xyz789', title: 'Walkthrough recording', sort_order: 1 },
      { id: 'a3', cr_id: 'cr-1', type: 'image', url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800', title: 'User flow diagram', sort_order: 2 },
    ],
    reviewers: [
      { cr_id: 'cr-1', user_id: '2', user: TEAM_MEMBERS[1], status: 'reviewed', reviewed_at: '2026-03-29T14:00:00Z' },
      { cr_id: 'cr-1', user_id: '3', user: TEAM_MEMBERS[2], status: 'reviewed', reviewed_at: '2026-03-29T16:30:00Z' },
      { cr_id: 'cr-1', user_id: '4', user: TEAM_MEMBERS[3], status: 'pending' },
    ],
    comments: [
      {
        id: 'c1', cr_id: 'cr-1', author: TEAM_MEMBERS[2], body: 'The timeline feels dense. Could we collapse older versions by default?',
        comment_type: 'suggestion', resolved: true, resolved_by: TEAM_MEMBERS[0], created_at: '2026-03-29T15:00:00Z',
        replies: [
          { id: 'c1r1', cr_id: 'cr-1', author: TEAM_MEMBERS[0], parent_id: 'c1', body: "Good call, I'll try accordion. ✅", comment_type: 'suggestion', resolved: false, created_at: '2026-03-29T15:30:00Z' },
        ],
      },
      {
        id: 'c2', cr_id: 'cr-1', author: TEAM_MEMBERS[1], body: "The release notes preview doesn't account for long content. What happens with 500+ word release notes?",
        comment_type: 'blocker', resolved: false, created_at: '2026-03-29T14:30:00Z',
      },
      {
        id: 'c3', cr_id: 'cr-1', author: TEAM_MEMBERS[1], body: 'Love the simplified timeline. Much cleaner than v1!',
        comment_type: 'praise', resolved: false, created_at: '2026-03-29T14:15:00Z',
      },
    ],
    created_at: '2026-03-28T10:00:00Z',
    updated_at: '2026-03-29T16:30:00Z',
    team_id: 'team-1',
    events: [],
  },
  {
    id: 'cr-2',
    title: 'Onboarding Flow Crit',
    description: 'Looking for feedback on the new stepper pattern for developer onboarding. This replaces the old wizard-style flow with a more flexible checklist approach.',
    author: TEAM_MEMBERS[1],
    status: 'in-review',
    design_stage: 'wireframe',
    project_tag: 'Developer Onboarding',
    artifacts: [
      { id: 'a4', cr_id: 'cr-2', type: 'figma', url: 'https://figma.com/design/def456', title: 'Onboarding stepper flow', sort_order: 0 },
      { id: 'a5', cr_id: 'cr-2', type: 'image', url: 'https://images.unsplash.com/photo-1512758017271-d7b84c2113f1?w=800', title: 'Competitor analysis', sort_order: 1 },
    ],
    reviewers: [
      { cr_id: 'cr-2', user_id: '1', user: TEAM_MEMBERS[0], status: 'pending' },
      { cr_id: 'cr-2', user_id: '3', user: TEAM_MEMBERS[2], status: 'reviewed', reviewed_at: '2026-03-28T11:00:00Z' },
    ],
    comments: [
      { id: 'c4', cr_id: 'cr-2', author: TEAM_MEMBERS[2], body: 'What happens if a user skips step 3? Can they come back to it?', comment_type: 'question', resolved: false, created_at: '2026-03-28T11:00:00Z' },
      { id: 'c5', cr_id: 'cr-2', author: TEAM_MEMBERS[2], body: 'The progress indicator is really clear. Nice work.', comment_type: 'praise', resolved: false, created_at: '2026-03-28T11:15:00Z' },
      { id: 'c6', cr_id: 'cr-2', author: TEAM_MEMBERS[0], body: 'Have you considered a non-linear navigation model? Some users might want to jump ahead.', comment_type: 'suggestion', resolved: false, created_at: '2026-03-28T14:00:00Z' },
      { id: 'c7', cr_id: 'cr-2', author: TEAM_MEMBERS[4], body: 'This needs to work for both first-time and returning users. How does it adapt?', comment_type: 'question', resolved: false, created_at: '2026-03-28T15:00:00Z' },
      { id: 'c8', cr_id: 'cr-2', author: TEAM_MEMBERS[1], body: 'Great question — I\'ll add a "returning user" variant to the next iteration.', comment_type: 'suggestion', resolved: false, created_at: '2026-03-28T15:30:00Z', parent_id: 'c7' },
      { id: 'c9', cr_id: 'cr-2', author: TEAM_MEMBERS[3], body: 'The stepper labels are too long for mobile. Can we truncate or use icons?', comment_type: 'suggestion', resolved: false, created_at: '2026-03-28T16:00:00Z' },
      { id: 'c10', cr_id: 'cr-2', author: TEAM_MEMBERS[5], body: 'Accessibility concern: make sure the stepper is keyboard navigable.', comment_type: 'blocker', resolved: false, created_at: '2026-03-28T17:00:00Z' },
    ],
    created_at: '2026-03-27T09:00:00Z',
    updated_at: '2026-03-28T17:00:00Z',
    team_id: 'team-3',
    events: [],
  },
  {
    id: 'cr-3',
    title: 'Navigation IA Proposal',
    description: 'Early exploration of a consolidated navigation for the developer platform. Exploring sidebar vs. top nav vs. hybrid approaches.',
    author: TEAM_MEMBERS[3],
    status: 'draft',
    design_stage: 'exploration',
    project_tag: 'Platform Navigation',
    artifacts: [
      { id: 'a6', cr_id: 'cr-3', type: 'image', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', title: 'IA mapping', sort_order: 0 },
    ],
    reviewers: [],
    comments: [],
    created_at: '2026-03-29T08:00:00Z',
    updated_at: '2026-03-29T08:00:00Z',
    team_id: 'team-2',
    events: [],
  },
  {
    id: 'cr-4',
    title: 'Data Hub Consolidated View',
    description: 'Early exploration of consolidated data views for the developer data hub. Combining multiple data sources into a unified dashboard.',
    author: TEAM_MEMBERS[4],
    status: 'open',
    design_stage: 'exploration',
    project_tag: 'Data Hub',
    artifacts: [
      { id: 'a7', cr_id: 'cr-4', type: 'figma', url: 'https://figma.com/design/ghi789', title: 'Dashboard exploration', sort_order: 0 },
      { id: 'a8', cr_id: 'cr-4', type: 'image', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800', title: 'Data architecture sketch', sort_order: 1 },
    ],
    reviewers: [
      { cr_id: 'cr-4', user_id: '1', user: TEAM_MEMBERS[0], status: 'pending' },
      { cr_id: 'cr-4', user_id: '6', user: TEAM_MEMBERS[5], status: 'pending' },
    ],
    comments: [],
    created_at: '2026-03-29T15:00:00Z',
    updated_at: '2026-03-29T15:00:00Z',
    team_id: 'team-2',
    events: [],
  },
  {
    id: 'cr-5',
    title: 'API Key Management Redesign',
    description: 'Redesigning the API key management page. Current design has poor discoverability and confusing permission model. Prototype ready for testing.',
    author: TEAM_MEMBERS[5],
    status: 'in-review',
    design_stage: 'prototype',
    project_tag: 'Developer Settings',
    artifacts: [
      { id: 'a9', cr_id: 'cr-5', type: 'url', url: 'https://prototype.hubspot.com/api-keys', title: 'Live prototype', sort_order: 0 },
      { id: 'a10', cr_id: 'cr-5', type: 'figma', url: 'https://figma.com/design/jkl012', title: 'Figma specs', sort_order: 1 },
      { id: 'a11', cr_id: 'cr-5', type: 'loom', url: 'https://loom.com/share/abc456', title: 'Prototype walkthrough', sort_order: 2 },
    ],
    reviewers: [
      { cr_id: 'cr-5', user_id: '1', user: TEAM_MEMBERS[0], status: 'pending' },
      { cr_id: 'cr-5', user_id: '2', user: TEAM_MEMBERS[1], status: 'reviewed', reviewed_at: '2026-03-30T10:00:00Z' },
      { cr_id: 'cr-5', user_id: '4', user: TEAM_MEMBERS[3], status: 'pending' },
    ],
    comments: [
      { id: 'c11', cr_id: 'cr-5', author: TEAM_MEMBERS[1], body: 'The permission model is much clearer now. Great improvement over the current design.', comment_type: 'praise', resolved: false, created_at: '2026-03-30T10:00:00Z' },
      { id: 'c12', cr_id: 'cr-5', author: TEAM_MEMBERS[1], body: 'Can we add a "copy to clipboard" action on the key itself? Currently requires opening details.', comment_type: 'suggestion', resolved: false, created_at: '2026-03-30T10:15:00Z' },
    ],
    created_at: '2026-03-29T11:00:00Z',
    updated_at: '2026-03-30T10:15:00Z',
    team_id: 'team-2',
    events: [],
  },
  {
    id: 'cr-6',
    title: 'Error State Patterns',
    description: 'Establishing consistent error state patterns across the developer platform. Includes empty states, error messages, and recovery flows.',
    author: TEAM_MEMBERS[2],
    status: 'approved',
    design_stage: 'high-fidelity',
    project_tag: 'Design System',
    artifacts: [
      { id: 'a12', cr_id: 'cr-6', type: 'figma', url: 'https://figma.com/design/mno345', title: 'Error state library', sort_order: 0 },
    ],
    reviewers: [
      { cr_id: 'cr-6', user_id: '1', user: TEAM_MEMBERS[0], status: 'approved', reviewed_at: '2026-03-27T14:00:00Z' },
      { cr_id: 'cr-6', user_id: '5', user: TEAM_MEMBERS[4], status: 'approved', reviewed_at: '2026-03-27T16:00:00Z' },
    ],
    comments: [
      { id: 'c13', cr_id: 'cr-6', author: TEAM_MEMBERS[0], body: 'These are solid. Ship it!', comment_type: 'praise', resolved: false, created_at: '2026-03-27T14:00:00Z' },
    ],
    created_at: '2026-03-25T09:00:00Z',
    updated_at: '2026-03-27T16:00:00Z',
    team_id: 'team-1',
    events: [],
  },
];
