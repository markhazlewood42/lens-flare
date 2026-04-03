import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCR } from '@/context/CRContext';
import { ArrowRight, MessageSquare } from 'lucide-react';
import DesignStageBadge from '@/components/DesignStageBadge';
import StatusPill from '@/components/StatusPill';
import { motion } from 'framer-motion';

type DashTab = 'needs-review' | 'my-crs';

export default function Feed() {
  const { crs, currentUser } = useCR();
  const [tab, setTab] = useState<DashTab>('needs-review');

  const needsReview = crs.filter(cr =>
    cr.reviewers.some(r => r.user_id === currentUser.id && r.status === 'pending') && cr.status !== 'draft'
  );
  const myCRs = crs.filter(cr => cr.author.id === currentUser.id);

  const items = tab === 'needs-review' ? needsReview : myCRs;

  function getTimeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <div className="container max-w-3xl py-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Feed</h1>

        <div className="flex gap-2">
          <button
            onClick={() => setTab('needs-review')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === 'needs-review' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            Needs My Review ({needsReview.length})
          </button>
          <button
            onClick={() => setTab('my-crs')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === 'my-crs' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            My CRs ({myCRs.length})
          </button>
        </div>

        <div className="space-y-3">
          {items.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-border py-12 text-center">
              <p className="text-muted-foreground">
                {tab === 'needs-review' ? 'No CRs waiting for your review 🎉' : 'You haven\'t created any CRs yet'}
              </p>
            </div>
          )}

          {items.map((cr, i) => (
            <motion.div
              key={cr.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/cr/${cr.id}`}
                className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-card-hover hover:border-primary/20"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <DesignStageBadge stage={cr.design_stage} />
                    <StatusPill status={cr.status} />
                  </div>
                  <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                    {cr.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <img src={cr.author.avatar_url} alt="" className="h-4 w-4 rounded-full" />
                      {cr.author.name}
                    </span>
                    <span>{getTimeAgo(cr.updated_at)}</span>
                    {cr.comments.length > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> {cr.comments.length}
                      </span>
                    )}
                  </div>
                  {cr.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-1">{cr.description}</p>
                  )}
                </div>

                {tab === 'needs-review' && (
                  <span className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary whitespace-nowrap">
                    Start Review <ArrowRight className="h-3 w-3" />
                  </span>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
