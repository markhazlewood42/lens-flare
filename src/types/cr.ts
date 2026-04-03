export type DesignStage = 'exploration' | 'wireframe' | 'high-fidelity' | 'prototype' | 'final-review';
export type CRStatus = 'draft' | 'open' | 'in-review' | 'changes-requested' | 'approved' | 'closed';
export type ReviewerStatus = 'pending' | 'reviewed' | 'approved' | 'changes-requested';
export type CommentType = 'suggestion' | 'question' | 'blocker' | 'praise';
export type ArtifactType = 'image' | 'figma' | 'loom' | 'figjam' | 'url';
export type CREventType = 'review_completed' | 'review_undone';

export interface CREvent {
  id: string;
  cr_id: string;
  type: CREventType;
  actor: User;
  created_at: string;
  metadata?: Record<string, string>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  onboarding_dismissed?: boolean;
}

export interface Artifact {
  id: string;
  cr_id: string;
  type: ArtifactType;
  url: string;
  thumbnail_url?: string;
  title?: string;
  sort_order: number;
}

export interface Reviewer {
  cr_id: string;
  user_id: string;
  user: User;
  status: ReviewerStatus;
  reviewed_at?: string;
}

export interface Comment {
  id: string;
  cr_id: string;
  author: User;
  parent_id?: string;
  artifact_id?: string;
  body: string;
  comment_type: CommentType;
  resolved: boolean;
  resolved_by?: User;
  created_at: string;
  replies?: Comment[];
}

export interface CritiqueRequest {
  id: string;
  title: string;
  description: string;
  author: User;
  status: CRStatus;
  design_stage: DesignStage;
  project_tag?: string;
  team_id?: string;
  artifacts: Artifact[];
  reviewers: Reviewer[];
  comments: Comment[];
  events: CREvent[];
  created_at: string;
  updated_at: string;
}

export const DESIGN_STAGES: { value: DesignStage; label: string; emoji: string; color: string; description: string }[] = [
  { value: 'exploration', label: 'Exploration', emoji: '🔵', color: 'stage-exploration', description: 'Feedback on direction, assumptions, and alternatives' },
  { value: 'wireframe', label: 'Wireframe', emoji: '🟡', color: 'stage-wireframe', description: 'Structural feedback on flows and layout' },
  { value: 'high-fidelity', label: 'High-fidelity', emoji: '🟣', color: 'stage-highfidelity', description: 'Visual polish, interaction details, edge cases' },
  { value: 'prototype', label: 'Prototype', emoji: '🟢', color: 'stage-prototype', description: 'Interactive review — test the flow yourself' },
  { value: 'final-review', label: 'Final Review', emoji: '🔴', color: 'stage-finalreview', description: 'Last eyes before handoff/ship' },
];

export const COMMENT_TYPES: { value: CommentType; label: string; emoji: string; color: string }[] = [
  { value: 'suggestion', label: 'Suggestion', emoji: '💡', color: 'comment-suggestion' },
  { value: 'question', label: 'Question', emoji: '❓', color: 'comment-question' },
  { value: 'blocker', label: 'Blocker', emoji: '🚫', color: 'comment-blocker' },
  { value: 'praise', label: 'Praise', emoji: '👍', color: 'comment-praise' },
];

export const STATUS_CONFIG: Record<CRStatus, { label: string; color: string }> = {
  'draft': { label: 'Draft', color: 'status-draft' },
  'open': { label: 'Open', color: 'status-open' },
  'in-review': { label: 'In Review', color: 'status-inreview' },
  'changes-requested': { label: 'Changes Requested', color: 'status-changes' },
  'approved': { label: 'Approved', color: 'status-approved' },
  'closed': { label: 'Closed', color: 'status-closed' },
};
