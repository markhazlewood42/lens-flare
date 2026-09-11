import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  allTeams: Team[];
  loading: boolean;
  refetchTeams: () => void;
}

export const TeamContext = createContext<TeamContextType | null>(null);

const ACTIVE_TEAM_KEY = 'lensflare-active-team';

// Public read-only demo: there's no logged-in user, so "my teams" doesn't
// mean anything anymore. Every visitor just browses all seeded teams.
export function TeamProvider({ children }: { children: ReactNode }) {
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeamState] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLoaded = useRef(false);

  const fetchTeams = useCallback(async () => {
    if (!hasLoaded.current) setLoading(true);
    try {
      const { data } = await supabase.from('teams').select('*').order('created_at', { ascending: true });
      const teams = (data || []) as Team[];
      setAllTeams(teams);

      // Restore the last-viewed team from localStorage (per-visitor UI convenience only)
      const savedId = localStorage.getItem(ACTIVE_TEAM_KEY);
      const savedTeam = teams.find(t => t.id === savedId);
      if (savedTeam) {
        setCurrentTeamState(savedTeam);
      } else if (teams.length > 0) {
        setCurrentTeamState(teams[0]);
        localStorage.setItem(ACTIVE_TEAM_KEY, teams[0].id);
      } else {
        setCurrentTeamState(null);
      }
    } finally {
      setLoading(false);
      hasLoaded.current = true;
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const setCurrentTeam = (team: Team) => {
    setCurrentTeamState(team);
    localStorage.setItem(ACTIVE_TEAM_KEY, team.id);
  };

  return (
    <TeamContext.Provider value={{ userTeams: allTeams, currentTeam, setCurrentTeam, allTeams, loading, refetchTeams: fetchTeams }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within TeamProvider');
  return ctx;
}
