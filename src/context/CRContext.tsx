import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { CritiqueRequest, Comment, CRStatus, CREvent, User, Reviewer } from '@/types/cr';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useTeam } from './TeamContext';

export interface CRContextType {
  crs: CritiqueRequest[];
  currentUser: User;
  teamMembers: User[];
  addCR: (cr: CritiqueRequest) => void;
  updateCR: (crId: string, updates: { title: string; description: string; design_stage: string; project_tag?: string; artifacts: any[]; reviewerIds: string[] }) => void;
  updateCRStatus: (crId: string, status: CRStatus) => void;
  addComment: (crId: string, comment: Comment) => void;
  resolveComment: (crId: string, commentId: string) => void;
  markReviewDone: (crId: string, userId: string) => void;
  loading: boolean;
  refetch: () => void;
}

// Exported so DemoCRProvider can also provide to this context
export const CRContext = createContext<CRContextType | null>(null);

function assembleData(
  dbCRs: any[],
  dbArtifacts: any[],
  dbReviewers: any[],
  dbComments: any[],
  dbEvents: any[],
  profiles: Map<string, User>,
): CritiqueRequest[] {
  return dbCRs.map(cr => {
    const author = profiles.get(cr.author_id) || { id: cr.author_id, name: 'Unknown', email: '', avatar_url: '' };
    const artifacts = dbArtifacts
      .filter(a => a.cr_id === cr.id)
      .sort((a, b) => a.sort_order - b.sort_order);
    const reviewers: Reviewer[] = dbReviewers
      .filter(r => r.cr_id === cr.id)
      .map(r => ({
        cr_id: r.cr_id,
        user_id: r.user_id,
        user: profiles.get(r.user_id) || { id: r.user_id, name: 'Unknown', email: '', avatar_url: '' },
        status: r.status,
        reviewed_at: r.reviewed_at,
      }));

    const crComments = dbComments.filter(c => c.cr_id === cr.id);
    const commentMap = new Map<string, Comment>();
    const topLevel: Comment[] = [];
    for (const c of crComments) {
      commentMap.set(c.id, {
        id: c.id, cr_id: c.cr_id,
        author: profiles.get(c.author_id) || { id: c.author_id, name: 'Unknown', email: '', avatar_url: '' },
        parent_id: c.parent_id, artifact_id: c.artifact_id, body: c.body,
        comment_type: c.comment_type, resolved: c.resolved,
        resolved_by: c.resolved_by ? profiles.get(c.resolved_by) : undefined,
        created_at: c.created_at, replies: [],
      });
    }
    for (const c of crComments) {
      const comment = commentMap.get(c.id)!;
      if (c.parent_id && commentMap.has(c.parent_id)) {
        commentMap.get(c.parent_id)!.replies!.push(comment);
      } else if (!c.parent_id) {
        topLevel.push(comment);
      }
    }

    const events: CREvent[] = dbEvents
      .filter(e => e.cr_id === cr.id)
      .map(e => ({
        id: e.id, cr_id: e.cr_id, type: e.type,
        actor: profiles.get(e.actor_id) || { id: e.actor_id, name: 'Unknown', email: '', avatar_url: '' },
        created_at: e.created_at, metadata: e.metadata,
      }));

    return {
      id: cr.id, title: cr.title, description: cr.description, author,
      status: cr.status as CRStatus, design_stage: cr.design_stage as any,
      project_tag: cr.project_tag, team_id: cr.team_id, artifacts, reviewers, comments: topLevel,
      events, created_at: cr.created_at, updated_at: cr.updated_at,
    };
  });
}

export function CRProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const { currentTeam } = useTeam();
  const [crs, setCRs] = useState<CritiqueRequest[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser: User = profile || { id: '', name: '', email: '', avatar_url: '' };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [crsRes, artifactsRes, reviewersRes, commentsRes, eventsRes, profilesRes] = await Promise.all([
        supabase.from('critique_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('artifacts').select('*'),
        supabase.from('reviewers').select('*'),
        supabase.from('comments').select('*').order('created_at', { ascending: true }),
        supabase.from('cr_events').select('*').order('created_at', { ascending: true }),
        supabase.from('profiles').select('*'),
      ]);

      let teamMemberIds: Set<string> | null = null;
      if (currentTeam) {
        const { data: tmData } = await supabase.from('team_members').select('user_id').eq('team_id', currentTeam.id);
        if (tmData) teamMemberIds = new Set(tmData.map((m: any) => m.user_id));
      }

      const profilesMap = new Map<string, User>();
      const members: User[] = [];
      for (const p of profilesRes.data || []) {
        const user: User = {
          id: p.id, name: p.name,
          email: '',
          avatar_url: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
        };
        profilesMap.set(p.id, user);
        if (!teamMemberIds || teamMemberIds.has(p.id)) {
          members.push(user);
        }
      }
      setTeamMembers(members);
      setCRs(assembleData(crsRes.data || [], artifactsRes.data || [], reviewersRes.data || [], commentsRes.data || [], eventsRes.data || [], profilesMap));
    } finally {
      setLoading(false);
    }
  }, [currentTeam]);

  useEffect(() => {
    if (profile) fetchData();
  }, [profile, fetchData]);

  // Realtime subscriptions
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('cr-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cr_events' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviewers' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'critique_requests' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, fetchData]);

  const addCR = useCallback(async (cr: CritiqueRequest) => {
    const { data: newCR, error } = await supabase.from('critique_requests').insert({
      title: cr.title, description: cr.description, author_id: cr.author.id,
      status: cr.status, design_stage: cr.design_stage, project_tag: cr.project_tag,
      team_id: currentTeam?.id || null,
    }).select().single();
    if (error || !newCR) return;
    if (cr.artifacts.length > 0) {
      await supabase.from('artifacts').insert(cr.artifacts.map((a, i) => ({
        cr_id: newCR.id, type: a.type, url: a.url, thumbnail_url: a.thumbnail_url, title: a.title, sort_order: i,
      })));
    }
    if (cr.reviewers.length > 0) {
      await supabase.from('reviewers').insert(cr.reviewers.map(r => ({
        cr_id: newCR.id, user_id: r.user_id, status: 'pending',
      })));
    }
    // Fetch thumbnails in background
    supabase.functions.invoke('fetch-artifact-thumbnails', { body: { cr_id: newCR.id } }).then(() => fetchData());
    fetchData();
  }, [fetchData, currentTeam]);

  const updateCR = useCallback(async (crId: string, updates: { title: string; description: string; design_stage: string; project_tag?: string; artifacts: any[]; reviewerIds: string[] }) => {
    // Update CR fields
    await supabase.from('critique_requests').update({
      title: updates.title,
      description: updates.description,
      design_stage: updates.design_stage,
      project_tag: updates.project_tag || null,
      updated_at: new Date().toISOString(),
    }).eq('id', crId);

    // Sync artifacts: delete old, insert new
    await supabase.from('artifacts').delete().eq('cr_id', crId);
    if (updates.artifacts.length > 0) {
      await supabase.from('artifacts').insert(updates.artifacts.map((a: any, i: number) => ({
        cr_id: crId, type: a.type, url: a.url, thumbnail_url: a.thumbnail_url || null, title: a.title || null, sort_order: i,
      })));
    }

    // Sync reviewers: delete old, insert new
    await supabase.from('reviewers').delete().eq('cr_id', crId);
    if (updates.reviewerIds.length > 0) {
      await supabase.from('reviewers').insert(updates.reviewerIds.map(uid => ({
        cr_id: crId, user_id: uid, status: 'pending',
      })));
    }

    // Fetch thumbnails in background
    supabase.functions.invoke('fetch-artifact-thumbnails', { body: { cr_id: crId } }).then(() => fetchData());
    fetchData();
  }, [fetchData]);

  const updateCRStatus = useCallback(async (crId: string, status: CRStatus) => {
    await supabase.from('critique_requests').update({ status }).eq('id', crId);
    fetchData();
  }, [fetchData]);

  const addComment = useCallback(async (crId: string, comment: Comment) => {
    await supabase.from('comments').insert({
      cr_id: crId, author_id: comment.author.id,
      parent_id: comment.parent_id || null, artifact_id: comment.artifact_id || null,
      body: comment.body, comment_type: comment.comment_type,
    });
    fetchData();
  }, [fetchData]);

  const resolveComment = useCallback(async (crId: string, commentId: string) => {
    const { data: c } = await supabase.from('comments').select('resolved').eq('id', commentId).single();
    if (!c) return;
    await supabase.from('comments').update({
      resolved: !c.resolved, resolved_by: c.resolved ? null : currentUser.id,
    }).eq('id', commentId);
    fetchData();
  }, [fetchData, currentUser.id]);

  const markReviewDone = useCallback(async (crId: string, userId: string) => {
    const { data: r } = await supabase.from('reviewers').select('status').eq('cr_id', crId).eq('user_id', userId).single();
    if (!r) return;
    const wasReviewed = r.status === 'reviewed';
    await supabase.from('reviewers').update({
      status: wasReviewed ? 'pending' : 'reviewed', reviewed_at: new Date().toISOString(),
    }).eq('cr_id', crId).eq('user_id', userId);
    await supabase.from('cr_events').insert({
      cr_id: crId, type: wasReviewed ? 'review_undone' : 'review_completed', actor_id: userId,
    });
    fetchData();
  }, [fetchData]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  return (
    <CRContext.Provider value={{ crs, currentUser, teamMembers, addCR, updateCR, updateCRStatus, addComment, resolveComment, markReviewDone, loading, refetch: fetchData }}>
      {children}
    </CRContext.Provider>
  );
}

export function useCR() {
  const ctx = useContext(CRContext);
  if (!ctx) throw new Error('useCR must be used within CRProvider');
  return ctx;
}
