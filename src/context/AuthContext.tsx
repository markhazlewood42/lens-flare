import { createContext, useContext, ReactNode } from 'react';
import { User } from '@/types/cr';

// This app is deployed as a public, read-only demo: there is no login, and no
// Supabase auth session. Every visitor sees the same fixed "viewer" identity
// below, which only exists to satisfy components that expect a `currentUser`
// shape (e.g. to label "you" in reviewer lists). It doesn't correspond to a
// real seeded user, and `isAdmin` is always false so no write-only UI shows.
const VIEWER_PROFILE: User = {
  id: 'public-viewer',
  name: 'Guest Viewer',
  email: '',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
  onboarding_dismissed: true,
};

interface AuthContextType {
  session: null;
  user: null;
  profile: User | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const value: AuthContextType = {
    session: null,
    user: null,
    profile: VIEWER_PROFILE,
    isAdmin: false,
    loading: false,
    signOut: async () => {},
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
