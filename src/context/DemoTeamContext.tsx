import { useState, ReactNode } from 'react';
import { TeamContext, Team } from '@/context/TeamContext';
import { MOCK_TEAMS } from '@/data/mockData';

export function DemoTeamProvider({ children }: { children: ReactNode }) {
  const [currentTeam, setCurrentTeam] = useState<Team>(MOCK_TEAMS[0]);

  const value = {
    userTeams: MOCK_TEAMS,
    allTeams: MOCK_TEAMS,
    currentTeam,
    setCurrentTeam,
    createTeam: async () => null,
    joinTeam: async () => false,
    leaveTeam: async () => {},
    loading: false,
    refetchTeams: () => {},
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}
