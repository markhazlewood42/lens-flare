import { useState } from 'react';
import { useTeam } from '@/context/TeamContext';
import { useNavigate } from 'react-router-dom';
import { Flame, Plus, Users, Hash, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function TeamSetup() {
  const { allTeams, userTeams, joinTeam, createTeam, loading } = useTeam();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'choose' | 'create'>('choose');
  const [teamName, setTeamName] = useState('');
  const [slackChannel, setSlackChannel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const joinableTeams = allTeams.filter(t => !userTeams.some(ut => ut.id === t.id));

  const handleCreate = async () => {
    if (!teamName.trim()) return;
    setSubmitting(true);
    try {
      const team = await createTeam(teamName.trim(), slackChannel.trim() || undefined);
      if (team) {
        toast.success(`Team "${team.name}" created!`);
      } else {
        toast.error('Failed to create team');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (teamId: string) => {
    setJoiningId(teamId);
    try {
      const ok = await joinTeam(teamId);
      if (ok) toast.success('Joined team!');
      else toast.error('Failed to join team');
    } finally {
      setJoiningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg space-y-8"
      >
        {/* Back button - only show if user has teams */}
        {userTeams.length > 0 && (
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </button>
        )}
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="gradient-warm rounded-xl p-2.5">
            <Flame className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {userTeams.length > 0 ? 'Manage Teams' : 'Welcome to LensFlare'}
          </h1>
          <p className="text-center text-muted-foreground">
            {userTeams.length > 0
              ? 'Join another team or create a new one.'
              : 'Join or create a team to get started with design critiques.'}
          </p>
        </div>

        {/* Current teams */}
        {userTeams.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your Teams</p>
            {userTeams.map(team => (
              <div
                key={team.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <p className="font-medium text-foreground">{team.name}</p>
                  {team.slack_channel && (
                    <p className="text-xs text-muted-foreground">
                      <Hash className="mr-0.5 inline h-3 w-3" />
                      {team.slack_channel}
                    </p>
                  )}
                </div>
                <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">Joined</span>
              </div>
            ))}
          </div>
        )}

        {/* Mode toggle */}
        <div className="flex gap-2 rounded-xl bg-secondary p-1">
          <button
            onClick={() => setMode('choose')}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              mode === 'choose' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="mr-1.5 inline h-4 w-4" />
            Join a Team
          </button>
          <button
            onClick={() => setMode('create')}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              mode === 'create' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Plus className="mr-1.5 inline h-4 w-4" />
            Create a Team
          </button>
        </div>

        {mode === 'create' ? (
          <motion.div
            key="create"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="e.g., Design Systems"
                autoFocus
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                <Hash className="mr-1 inline h-3.5 w-3.5" />
                Slack Channel (optional)
              </label>
              <input
                type="text"
                value={slackChannel}
                onChange={e => setSlackChannel(e.target.value)}
                placeholder="e.g., #design-reviews"
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground">
                We'll use this later to send CR notifications to your team's Slack channel.
              </p>
            </div>
            <button
              onClick={handleCreate}
              disabled={!teamName.trim() || submitting}
              className="gradient-warm flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:shadow-lg disabled:opacity-40"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Team
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="join"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {joinableTeams.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-border py-12 text-center">
                <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-1">
                  {userTeams.length > 0 ? "You're already in all available teams" : 'No teams to join yet'}
                </p>
                <button
                  onClick={() => setMode('create')}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Create a new team →
                </button>
              </div>
            ) : (
              joinableTeams.map(team => (
                <div
                  key={team.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/30"
                >
                  <div>
                    <p className="font-medium text-foreground">{team.name}</p>
                    {team.slack_channel && (
                      <p className="text-xs text-muted-foreground">
                        <Hash className="mr-0.5 inline h-3 w-3" />
                        {team.slack_channel}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleJoin(team.id)}
                    disabled={joiningId === team.id}
                    className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-40"
                  >
                    {joiningId === team.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5" />
                    )}
                    Join
                  </button>
                </div>
              ))
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
