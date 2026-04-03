import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTeam } from '@/context/TeamContext';
import { useCR } from '@/context/CRContext';
import { Hash, Pencil, Check, X, Plus, Users, Loader2, LogOut, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface EditingTeam {
  id: string;
  name: string;
  slack_channel: string;
}

export default function Settings() {
  const { userTeams, allTeams, currentTeam, createTeam, joinTeam, leaveTeam, refetchTeams } = useTeam();
  const { currentUser } = useCR();
  const [editing, setEditing] = useState<EditingTeam | null>(null);
  const [saving, setSaving] = useState(false);

  // Create team state
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlack, setNewSlack] = useState('');
  const [creating, setCreating] = useState(false);

  const joinableTeams = allTeams.filter(t => !userTeams.some(ut => ut.id === t.id));

  const startEditing = (team: typeof userTeams[0]) => {
    setEditing({ id: team.id, name: team.name, slack_channel: team.slack_channel || '' });
  };

  const cancelEditing = () => setEditing(null);

  const saveEditing = async () => {
    if (!editing || !editing.name.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('teams').update({
        name: editing.name.trim(),
        slack_channel: editing.slack_channel.trim() || null,
      }).eq('id', editing.id);

      if (error) {
        toast.error('Failed to update team');
        return;
      }
      toast.success('Team updated');
      setEditing(null);
      refetchTeams();
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const team = await createTeam(newName.trim(), newSlack.trim() || undefined);
      if (team) {
        toast.success(`Team "${team.name}" created!`);
        setNewName('');
        setNewSlack('');
        setShowCreate(false);
      } else {
        toast.error('Failed to create team');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleLeave = async (teamId: string, teamName: string) => {
    if (!confirm(`Leave "${teamName}"? You can rejoin later.`)) return;
    await leaveTeam(teamId);
    toast.success(`Left "${teamName}"`);
  };

  const handleJoin = async (teamId: string) => {
    const ok = await joinTeam(teamId);
    if (ok) toast.success('Joined team!');
    else toast.error('Failed to join team');
  };

  return (
    <div className="container max-w-2xl py-10 space-y-10">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your teams and preferences.</p>
      </div>

      {/* Your Teams */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Your Teams</h2>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New Team
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Team name"
              autoFocus
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex items-center gap-2">
              <Hash className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={newSlack}
                onChange={e => setNewSlack(e.target.value)}
                placeholder="Slack channel (optional)"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowCreate(false); setNewName(''); setNewSlack(''); }}
                className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="gradient-warm flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-40"
              >
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Create
              </button>
            </div>
          </div>
        )}

        {/* Team list */}
        <div className="space-y-2">
          {userTeams.map(team => (
            <div key={team.id} className="rounded-xl border border-border bg-card p-4">
              {editing?.id === team.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editing.name}
                    onChange={e => setEditing({ ...editing, name: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={editing.slack_channel}
                      onChange={e => setEditing({ ...editing, slack_channel: e.target.value })}
                      placeholder="Slack channel"
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={cancelEditing}
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                    <button
                      onClick={saveEditing}
                      disabled={!editing.name.trim() || saving}
                      className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
                    >
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <Link to={`/settings/team/${team.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{team.name}</p>
                      {currentTeam?.id === team.id && (
                        <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">Active</span>
                      )}
                    </div>
                    {team.slack_channel && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <Hash className="mr-0.5 inline h-3 w-3" />
                        {team.slack_channel}
                      </p>
                    )}
                  </Link>
                  <div className="flex items-center gap-1">
                    {team.created_by === currentUser.id && (
                      <button
                        onClick={() => startEditing(team)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        title="Edit team"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleLeave(team.id, team.name)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Leave team"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                    <Link to={`/settings/team/${team.id}`} className="rounded-lg p-2 text-muted-foreground hover:text-foreground transition-colors">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Join a team */}
      {joinableTeams.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Join a Team</h2>
          <div className="space-y-2">
            {joinableTeams.map(team => (
              <div
                key={team.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <p className="font-medium text-foreground">{team.name}</p>
                  {team.slack_channel && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <Hash className="mr-0.5 inline h-3 w-3" />
                      {team.slack_channel}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleJoin(team.id)}
                  className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  <Users className="h-3.5 w-3.5" />
                  Join
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
