import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface Team {
  id: string;
  name: string;
  slack_channel: string | null;
  created_by: string;
  created_at: string;
}

export interface TeamMembership {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

interface TeamContextType {
  userTeams: Team[];
  currentTeam: Team | null;
  setCurrentTeam: (team: Team) => void;
  createTeam: (name: string, slackChannel?: string) => Promise<Team | null>;
  joinTeam: (teamId: string) => Promise<boolean>;
  leaveTeam: (teamId: string) => Promise<void>;
  allTeams: Team[];
  loading: boolean;
  refetchTeams: () => void;
}

export const TeamContext = createContext<TeamContextType | null>(null);

const ACTIVE_TEAM_KEY = 'lensflare-active-team';

export function TeamProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeamState] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTeams = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [teamsRes, membershipsRes] = await Promise.all([
        supabase.from('teams').select('*').order('created_at', { ascending: true }),
        supabase.from('team_members').select('*').eq('user_id', user.id),
      ]);

      const teams = (teamsRes.data || []) as Team[];
      const memberships = (membershipsRes.data || []) as TeamMembership[];
      const memberTeamIds = new Set(memberships.map(m => m.team_id));
      const myTeams = teams.filter(t => memberTeamIds.has(t.id));

      setAllTeams(teams);
      setUserTeams(myTeams);

      // Restore active team from localStorage
      const savedId = localStorage.getItem(ACTIVE_TEAM_KEY);
      const savedTeam = myTeams.find(t => t.id === savedId);
      if (savedTeam) {
        setCurrentTeamState(savedTeam);
      } else if (myTeams.length > 0) {
        setCurrentTeamState(myTeams[0]);
        localStorage.setItem(ACTIVE_TEAM_KEY, myTeams[0].id);
      } else {
        setCurrentTeamState(null);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchTeams();
  }, [user, fetchTeams]);

  const setCurrentTeam = (team: Team) => {
    setCurrentTeamState(team);
    localStorage.setItem(ACTIVE_TEAM_KEY, team.id);
  };

  const createTeam = async (name: string, slackChannel?: string): Promise<Team | null> => {
    if (!user) return null;
    const { data, error } = await supabase.from('teams').insert({
      name,
      slack_channel: slackChannel || null,
      created_by: user.id,
    }).select().single();
    if (error || !data) return null;
    const team = data as Team;

    // Auto-join the team as creator
    await supabase.from('team_members').insert({
      team_id: team.id,
      user_id: user.id,
      role: 'admin',
    });

    await fetchTeams();
    setCurrentTeam(team);
    return team;
  };

  const joinTeam = async (teamId: string): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabase.from('team_members').insert({
      team_id: teamId,
      user_id: user.id,
    });
    if (error) return false;
    await fetchTeams();
    const team = allTeams.find(t => t.id === teamId);
    if (team) setCurrentTeam(team);
    return true;
  };

  const leaveTeam = async (teamId: string) => {
    if (!user) return;
    await supabase.from('team_members').delete().eq('team_id', teamId).eq('user_id', user.id);
    await fetchTeams();
  };

  return (
    <TeamContext.Provider value={{ userTeams, currentTeam, setCurrentTeam, createTeam, joinTeam, leaveTeam, allTeams, loading, refetchTeams: fetchTeams }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within TeamProvider');
  return ctx;
}
