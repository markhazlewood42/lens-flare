import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCR } from '@/context/CRContext';
import { ArrowLeft, ExternalLink, Check, Clock, MessageSquare, Eye } from 'lucide-react';
import DesignStageBadge from '@/components/DesignStageBadge';
import StatusPill from '@/components/StatusPill';
import { COMMENT_TYPES, Comment, CREvent } from '@/types/cr';
import { motion } from 'framer-motion';

function getFigmaEmbedUrl(url: string): string {
  // Convert Figma URLs to embed format
  return `https://www.figma.com/embed?embed_host=lensflare&url=${encodeURIComponent(url)}`;
}

function getLoomEmbedUrl(url: string): string {
  // Extract Loom video ID and build embed URL
  const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (match) return `https://www.loom.com/embed/${match[1]}`;
  return url;
}

function ArtifactEmbed({ artifact }: { artifact: any }) {
  const isFigma = artifact.type === 'figma' || artifact.url?.includes('figma.com');
  const isLoom = artifact.type === 'loom' || artifact.url?.includes('loom.com');

  const renderContent = () => {
    if (artifact.type === 'image') {
      return <img src={artifact.url} alt={artifact.title || ''} className="w-full object-cover max-h-[500px]" />;
    }
    if (isFigma) {
      return (
        <iframe
          src={getFigmaEmbedUrl(artifact.url)}
          className="block w-full h-full border-0"
          allowFullScreen
          title={artifact.title || 'Figma design'}
        />
      );
    }
    if (isLoom) {
      return (
        <iframe
          src={getLoomEmbedUrl(artifact.url)}
          className="w-full aspect-video border-0"
          allowFullScreen
          title={artifact.title || 'Loom recording'}
        />
      );
    }
    return (
      <div className="flex aspect-video items-center justify-center bg-secondary">
        <div className="text-center p-8">
          <div className="mb-3 text-3xl">🔗</div>
          <p className="font-display font-semibold text-foreground">{artifact.title || 'External artifact'}</p>
          <p className="mt-1 text-sm text-muted-foreground">External link</p>
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card flex flex-col">
      <div className="flex-1 min-h-0">{renderContent()}</div>
      <div className="flex items-center justify-between border-t border-border px-4 py-2">
        <span className="text-sm font-medium text-foreground">{artifact.title}</span>
        <a
          href={artifact.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Open <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

function CommentThread({ comment, crId, depth = 0 }: { comment: Comment; crId: string; depth?: number }) {
  const typeConfig = COMMENT_TYPES.find(t => t.value === comment.comment_type)!;
  const timeAgo = getTimeAgo(comment.created_at);

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-border pl-4' : ''}`}>
      <div className={`rounded-xl border border-border p-4 ${comment.resolved ? 'opacity-60' : ''}`}>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={comment.author.avatar_url} alt="" className="h-6 w-6 rounded-full" />
            <span className="text-sm font-medium text-foreground">{comment.author.name}</span>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `hsl(var(--${typeConfig.color}) / 0.12)`,
                color: `hsl(var(--${typeConfig.color}))`,
              }}
            >
              {typeConfig.emoji} {typeConfig.label}
            </span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          {depth === 0 && comment.resolved && (
            <span className="flex items-center gap-1 rounded-lg bg-status-approved/10 px-2 py-1 text-xs text-status-approved">
              <Check className="h-3 w-3" />
              Resolved
            </span>
          )}
        </div>
        <p className="text-sm text-foreground leading-relaxed">{comment.body}</p>
      </div>

      {comment.replies?.map(reply => (
        <div key={reply.id} className="mt-2">
          <CommentThread comment={reply} crId={crId} depth={depth + 1} />
        </div>
      ))}
    </div>
  );
}

function getTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function CRDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { crs } = useCR();
  const cr = crs.find(c => c.id === id);

  if (!cr) {
    return (
      <div className="container py-20 text-center">
        <h2 className="font-display text-2xl font-bold">CR not found</h2>
        <Link to="/" className="mt-4 text-primary hover:underline">Back to Feed</Link>
      </div>
    );
  }

  const reviewedCount = cr.reviewers.filter(r => r.status !== 'pending').length;
  const unresolvedCount = cr.comments.filter(c => !c.resolved && !c.parent_id).length;
  const totalComments = cr.comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

  return (
    <div className="container max-w-6xl py-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Back */}
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <img src={cr.author.avatar_url} alt="" className="h-8 w-8 rounded-full" />
            <span className="text-sm text-muted-foreground">{cr.author.name} · Created {getTimeAgo(cr.created_at)}</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">{cr.title}</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <DesignStageBadge stage={cr.design_stage} size="md" />
            <StatusPill status={cr.status} />
            {cr.project_tag && (
              <span className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                📁 {cr.project_tag}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-line">{cr.description}</p>

        {/* Main content: Artifacts + Comments | Sidebar */}
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <div className="space-y-8">
            {/* Artifacts */}
            <div className="space-y-4">
              
              <div className={cr.artifacts.length > 1 ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-4"}>
                {cr.artifacts.map(a => (
                  <ArtifactEmbed key={a.id} artifact={a} />
                ))}
              </div>
            </div>

            {/* Comments */}
            <div id="comments-section" className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 shrink-0">
                  <MessageSquare className="h-5 w-5" />
                  {totalComments} comments · {unresolvedCount} unresolved
                </h2>
                <hr className="flex-1 border-t border-border" />
              </div>

              <div className="space-y-3">
                {(() => {
                  const topComments = cr.comments.filter(c => !c.parent_id);
                  const events = cr.events || [];
                  const items: { type: 'comment'; data: Comment; time: string }[] | { type: 'event'; data: CREvent; time: string }[] = [];
                  const merged = [
                    ...topComments.map(c => ({ type: 'comment' as const, data: c, time: c.created_at })),
                    ...events.map(e => ({ type: 'event' as const, data: e, time: e.created_at })),
                  ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

                  return merged.map(item => {
                    if (item.type === 'comment') {
                      return <CommentThread key={item.data.id} comment={item.data as Comment} crId={cr.id} />;
                    }
                    const event = item.data as CREvent;
                    const label = event.type === 'review_completed'
                      ? `${event.actor.name} finished their review`
                      : `${event.actor.name} re-opened their review`;
                    return (
                      <div key={event.id} className="flex items-center gap-3 py-2 px-4">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <span className="text-xs text-muted-foreground/60">{getTimeAgo(event.created_at)}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Reviewers */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="font-display text-sm font-semibold text-foreground">Reviewers</h3>
              {cr.reviewers.length > 0 ? (
                <div className="space-y-2">
                  {cr.reviewers.map(r => (
                    <div key={r.user_id} className="flex items-center gap-2">
                      <img src={r.user.avatar_url} alt="" className="h-6 w-6 rounded-full" />
                      <span className="text-sm text-foreground flex-1">{r.user.name}</span>
                      {r.status === 'pending' ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-status-approved">
                          <Check className="h-3 w-3" /> Reviewed
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No reviewers assigned</p>
              )}

              {/* Soft gate */}
              {cr.reviewers.length > 0 && (
                <div className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
                  <span className="font-medium">{reviewedCount} of {cr.reviewers.length}</span> reviewed
                  {reviewedCount === 0 && cr.status !== 'draft' && (
                    <p className="mt-1 text-status-inreview">⚠️ Needs at least 1 review to approve</p>
                  )}
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-sm text-muted-foreground">
              <p>Created {new Date(cr.created_at).toLocaleDateString()}</p>
              <p>Updated {getTimeAgo(cr.updated_at)}</p>
              {cr.project_tag && <p>Project: {cr.project_tag}</p>}
            </div>

            {/* Jump to comments */}
            <button
              onClick={() => document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-1 text-sm text-primary hover:underline transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Jump to Comments ({totalComments})
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
