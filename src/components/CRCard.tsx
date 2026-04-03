import { Link } from 'react-router-dom';
import { MessageSquare, Eye } from 'lucide-react';
import { CritiqueRequest } from '@/types/cr';
import DesignStageBadge from './DesignStageBadge';
import StatusPill from './StatusPill';
import { motion } from 'framer-motion';

export default function CRCard({ cr, index = 0 }: { cr: CritiqueRequest; index?: number }) {
  const reviewedCount = cr.reviewers.filter(r => r.status !== 'pending').length;
  const totalComments = cr.comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);
  const firstArtifact = cr.artifacts[0];
  const thumbnail = firstArtifact?.type === 'image'
    ? firstArtifact.url
    : firstArtifact?.thumbnail_url || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
    >
      <Link to={`/cr/${cr.id}`} className="block">
        <div className="group overflow-hidden rounded-xl border border-border bg-card shadow-card card-hover">
          {/* Thumbnail */}
          <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={cr.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2">
                <div className="text-4xl opacity-40">
                  {firstArtifact?.type === 'figma' ? '🎨' : firstArtifact?.type === 'loom' ? '🎬' : '🔗'}
                </div>
                {firstArtifact && (
                  <span className="text-xs font-medium text-muted-foreground/60">
                    {firstArtifact.title || firstArtifact.type}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DesignStageBadge stage={cr.design_stage} />
                <span className="text-muted-foreground text-xs">–</span>
                <StatusPill status={cr.status} />
              </div>
              {cr.project_tag && (
                <span className="text-xs text-muted-foreground truncate ml-2">{cr.project_tag}</span>
              )}
            </div>

            <h3 className="font-display text-base font-semibold text-foreground line-clamp-2 mb-3 group-hover:text-primary transition-colors">
              {cr.title}
            </h3>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={cr.author.avatar_url}
                  alt={cr.author.name}
                  className="h-6 w-6 rounded-full"
                />
                <span className="text-sm text-muted-foreground">{cr.author.name.split(' ')[0]}</span>
              </div>

              <div className="flex items-center gap-3 text-muted-foreground">
                {totalComments > 0 && (
                  <span className="flex items-center gap-1 text-xs">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {totalComments}
                  </span>
                )}
                {cr.reviewers.length > 0 && (
                  <span className="flex items-center gap-1 text-xs">
                    <Eye className="h-3.5 w-3.5" />
                    {reviewedCount}/{cr.reviewers.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
