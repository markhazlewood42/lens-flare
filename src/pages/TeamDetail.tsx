import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTeam } from '@/context/TeamContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft, Hash, Users, Plus, Mail, X, Loader2, UserPlus, Crown, Trash2, ShieldCheck, ShieldOff,
} from 'lucide-react';
import { toast } from 'sonner';

interface MemberWithProfile {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  name: string;
  avatar_url: string;
}

interface Invite {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

interface ProfileOption {
  id: string;
  name: string;
  avatar_url: string | null;
}

export default function TeamDetail() {
  const { teamId } = useParams<{ teamId: string }>();
  const { user } = useAuth();
  const { userTeams, refetchTeams } = useTeam();

  const team = userTeams.find(t => t.id === teamId);
  const [isAdmin, setIsAdmin] = useState(false);
  const [togglingRole, setTogglingRole] = useState<string | null>(null);

  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [acceptedInvites, setAcceptedInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  // Add member state
  const [showAddMember, setShowAddMember] = useState(false);
  const [allProfiles, setAllProfiles] = useState<ProfileOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);

  // Invite state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const [membersRes, pendingRes, acceptedRes] = await Promise.all([
        supabase.from('team_members').select('*').eq('team_id', teamId),
        supabase.from('team_invites').select('*').eq('team_id', teamId).eq('status', 'pending'),
        supabase.from('team_invites').select('*').eq('team_id', teamId).eq('status', 'accepted').order('created_at', { ascending: false }),
      ]);

      const memberRows = membersRes.data || [];
      const userIds = memberRows.map(m => m.user_id);

      let profiles: ProfileOption[] = [];
      if (userIds.length > 0) {
        const { data } = await supabase.from('profiles').select('id, name, avatar_url').in('id', userIds);
        profiles = (data || []) as ProfileOption[];
      }

      const profileMap = new Map(profiles.map(p => [p.id, p]));
      const enriched: MemberWithProfile[] = memberRows.map(m => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        joined_at: m.joined_at,
        name: profileMap.get(m.user_id)?.name || 'Unknown',
        avatar_url: profileMap.get(m.user_id)?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user_id}`,
      }));

      setMembers(enriched);
      setIsAdmin(enriched.some(m => m.user_id === user?.id && m.role === 'admin'));
      setInvites((pendingRes.data || []) as Invite[]);
      setAcceptedInvites((acceptedRes.data || []) as Invite[]);
    } finally {
      setLoading(false);
    }
  }, [teamId, user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('id, name, avatar_url');
    setAllProfiles((data || []) as ProfileOption[]);
  };

  const handleShowAdd = () => {
    setShowAddMember(true);
    fetchProfiles();
  };

  const addableProfiles = allProfiles
    .filter(p => !members.some(m => m.user_id === p.id))
    .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleAddMember = async (profileId: string) => {
    if (!teamId) return;
    setAddingId(profileId);
    try {
      const { error } = await supabase.from('team_members').insert({
        team_id: teamId,
        user_id: profileId,
        role: 'member',
      });
      if (error) {
        toast.error('Failed to add member');
        return;
      }
      toast.success('Member added');
      await fetchData();
      setSearchQuery('');
    } finally {
      setAddingId(null);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from this team?`)) return;
    const { error } = await supabase.from('team_members').delete().eq('id', memberId);
    if (error) {
      toast.error('Failed to remove member');
      return;
    }
    toast.success(`${memberName} removed`);
    await fetchData();
    refetchTeams();
  };

  const handleInvite = async () => {
    if (!teamId || !user || !inviteEmail.trim()) return;
    const email = inviteEmail.trim().toLowerCase();
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setInviting(true);
    try {
      const { error } = await supabase.from('team_invites').insert({
        team_id: teamId,
        email,
        invited_by: user.id,
      });
      if (error) {
        if (error.code === '23505') {
          toast.error('This email has already been invited');
        } else {
          toast.error('Failed to send invite');
        }
        return;
      }
      toast.success(`Invite sent to ${email}`);
      setInviteEmail('');
      setShowInvite(false);
      await fetchData();
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    const { error } = await supabase.from('team_invites').delete().eq('id', inviteId);
    if (error) {
      toast.error('Failed to cancel invite');
      return;
    }
    toast.success('Invite cancelled');
    await fetchData();
  };

  const handleToggleRole = async (member: MemberWithProfile) => {
    const newRole = member.role === 'admin' ? 'member' : 'admin';
    setTogglingRole(member.id);
    try {
      const { error } = await supabase.from('team_members').update({ role: newRole }).eq('id', member.id);
      if (error) {
        toast.error('Failed to update role');
        return;
      }
      toast.success(`${member.name} is now ${newRole === 'admin' ? 'an admin' : 'a member'}`);
      await fetchData();
    } finally {
      setTogglingRole(null);
    }
  };

  if (!team) {
    return (
      <div className="container max-w-2xl py-10">
        <p className="text-muted-foreground">Team not found.</p>
        <Link to="/settings" className="text-sm text-primary hover:underline">← Back to Settings</Link>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-10 space-y-8">
      {/* Back + Header */}
      <div>
        <Link to="/settings" className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Settings
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{team.name}</h1>
            {team.slack_channel && (
              <p className="mt-1 text-sm text-muted-foreground">
                <Hash className="mr-0.5 inline h-3.5 w-3.5" />
                {team.slack_channel}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {members.length} member{members.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Members */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Members</h2>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowInvite(!showInvite); setShowAddMember(false); }}
                className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                Invite
              </button>
              <button
                onClick={() => { handleShowAdd(); setShowInvite(false); }}
                className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          )}
        </div>

        {/* Invite by email */}
        {showInvite && isAdmin && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-sm text-muted-foreground">Send an email invite to join this team.</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                autoFocus
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                onKeyDown={e => e.key === 'Enter' && handleInvite()}
              />
              <button
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || inviting}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
              >
                {inviting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                Send
              </button>
            </div>
          </div>
        )}

        {/* Add existing user */}
        {showAddMember && isAdmin && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search users by name…"
              autoFocus
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {addableProfiles.length === 0 ? (
                <p className="py-3 text-center text-sm text-muted-foreground">
                  {searchQuery ? 'No matching users' : 'All users are already members'}
                </p>
              ) : (
                addableProfiles.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleAddMember(p.id)}
                    disabled={addingId === p.id}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-secondary/50 transition-colors disabled:opacity-40"
                  >
                    <img
                      src={p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`}
                      alt={p.name}
                      className="h-7 w-7 rounded-full"
                    />
                    <span className="flex-1 text-left text-foreground">{p.name}</span>
                    {addingId === p.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    ) : (
                      <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => { setShowAddMember(false); setSearchQuery(''); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* Member list */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-1">
            {members.map(member => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-secondary/30 transition-colors"
              >
                <img
                  src={member.avatar_url}
                  alt={member.name}
                  className="h-9 w-9 rounded-full ring-2 ring-border"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                </div>
                {member.user_id === team.created_by && (
                  <Crown className="h-3.5 w-3.5 text-primary" />
                )}
                {isAdmin && member.user_id !== user?.id && member.user_id !== team.created_by && (
                  <button
                    onClick={() => handleToggleRole(member)}
                    disabled={togglingRole === member.id}
                    className={`rounded-lg p-1.5 transition-colors ${
                      member.role === 'admin'
                        ? 'text-primary hover:bg-primary/10'
                        : 'text-muted-foreground hover:bg-secondary'
                    }`}
                    title={member.role === 'admin' ? 'Demote to member' : 'Promote to admin'}
                  >
                    {togglingRole === member.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : member.role === 'admin' ? (
                      <ShieldOff className="h-3.5 w-3.5" />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
                {isAdmin && member.user_id !== user?.id && (
                  <button
                    onClick={() => handleRemoveMember(member.id, member.name)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Remove member"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pending Invites */}
      {isAdmin && invites.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Pending Invites</h2>
          <div className="space-y-1">
            {invites.map(invite => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary ring-2 ring-border">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Invited {new Date(invite.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleCancelInvite(invite.id)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title="Cancel invite"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Accepted Invites */}
      {isAdmin && acceptedInvites.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Accepted Invites</h2>
          <div className="space-y-1">
            {acceptedInvites.map(invite => (
              <div
                key={invite.id}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 ring-2 ring-border">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Invited {new Date(invite.created_at).toLocaleDateString()} · Joined
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
