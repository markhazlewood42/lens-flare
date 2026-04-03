import { useState, useMemo } from 'react';
import { useCR } from '@/context/CRContext';
import { useTeam } from '@/context/TeamContext';
import { CRStatus } from '@/types/cr';
import CRCard from '@/components/CRCard';
import TeamSwitcher from '@/components/TeamSwitcher';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

type FilterTab = 'all' | 'open' | 'in-review' | 'my-crs' | 'needs-review';

export default function Dashboard() {
  const { crs, currentUser, loading } = useCR();
  const { currentTeam } = useTeam();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  

  const filteredCRs = useMemo(() => {
    let result = currentTeam ? crs.filter(cr => cr.team_id === currentTeam.id || !cr.team_id) : crs;

    if (activeTab === 'open') result = result.filter(cr => cr.status === 'open');
    else if (activeTab === 'in-review') result = result.filter(cr => cr.status === 'in-review');
    else if (activeTab === 'my-crs') result = result.filter(cr => cr.author.id === currentUser.id);
    else if (activeTab === 'needs-review') result = result.filter(cr =>
      cr.reviewers.some(r => r.user_id === currentUser.id && r.status === 'pending') && cr.status !== 'draft'
    );


    return result;
  }, [crs, activeTab, currentUser, currentTeam]);

  const tabs: { value: FilterTab; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'in-review', label: 'In Review' },
    { value: 'my-crs', label: 'My CRs' },
    { value: 'needs-review', label: 'Needs My Review' },
  ];


  return (
    <div className="container py-8">
      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 space-y-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          <TeamSwitcher />
          <div className="h-5 w-px bg-border mx-1" />
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                activeTab === tab.value
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </motion.div>

      {/* Card grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : filteredCRs.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCRs.map((cr, i) => (
            <CRCard key={cr.id} cr={cr} index={i} />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card/50 py-20"
        >
          <div className="gradient-warm mb-4 rounded-2xl p-4">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <h3 className="font-display text-xl font-semibold text-foreground mb-2">No CRs yet</h3>
          <p className="text-muted-foreground text-sm">Share something you're working on!</p>
        </motion.div>
      )}
    </div>
  );
}
