import { useState, useCallback, ReactNode } from 'react';
import { CRContext, CRContextType } from '@/context/CRContext';
import { CritiqueRequest, Comment, CRStatus, CREvent } from '@/types/cr';
import { MOCK_CRS, CURRENT_USER, TEAM_MEMBERS } from '@/data/mockData';

export function DemoCRProvider({ children }: { children: ReactNode }) {
  const [crs, setCRs] = useState<CritiqueRequest[]>(MOCK_CRS);

  const addCR = useCallback((cr: CritiqueRequest) => {
    setCRs(prev => [cr, ...prev]);
  }, []);

  const updateCRStatus = useCallback((crId: string, status: CRStatus) => {
    setCRs(prev => prev.map(cr => cr.id === crId ? { ...cr, status, updated_at: new Date().toISOString() } : cr));
  }, []);

  const addComment = useCallback((crId: string, comment: Comment) => {
    setCRs(prev => prev.map(cr => {
      if (cr.id !== crId) return cr;
      if (comment.parent_id) {
        const updatedComments = cr.comments.map(c => {
          if (c.id === comment.parent_id) return { ...c, replies: [...(c.replies || []), comment] };
          return c;
        });
        return { ...cr, comments: updatedComments, updated_at: new Date().toISOString() };
      }
      return { ...cr, comments: [...cr.comments, comment], updated_at: new Date().toISOString() };
    }));
  }, []);

  const resolveComment = useCallback((crId: string, commentId: string) => {
    setCRs(prev => prev.map(cr => {
      if (cr.id !== crId) return cr;
      return { ...cr, comments: cr.comments.map(c =>
        c.id === commentId ? { ...c, resolved: !c.resolved, resolved_by: c.resolved ? undefined : CURRENT_USER } : c
      )};
    }));
  }, []);

  const markReviewDone = useCallback((crId: string, userId: string) => {
    setCRs(prev => prev.map(cr => {
      if (cr.id !== crId) return cr;
      const reviewer = cr.reviewers.find(r => r.user_id === userId);
      if (!reviewer) return cr;
      const wasReviewed = reviewer.status === 'reviewed';
      const now = new Date().toISOString();
      const event: CREvent = {
        id: `ev-${Date.now()}`, cr_id: crId,
        type: wasReviewed ? 'review_undone' : 'review_completed',
        actor: reviewer.user, created_at: now,
      };
      return {
        ...cr,
        reviewers: cr.reviewers.map(r => r.user_id === userId ? { ...r, status: wasReviewed ? 'pending' : 'reviewed', reviewed_at: now } : r),
        events: [...(cr.events || []), event], updated_at: now,
      };
    }));
  }, []);

  const updateCR = useCallback(() => {}, []);

  const value: CRContextType = {
    crs, currentUser: CURRENT_USER, teamMembers: TEAM_MEMBERS,
    addCR, updateCR, updateCRStatus, addComment, resolveComment, markReviewDone,
    loading: false, refetch: () => {},
  };

  return (
    <CRContext.Provider value={value}>
      {children}
    </CRContext.Provider>
  );
}
