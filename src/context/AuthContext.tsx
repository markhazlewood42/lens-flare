import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User as SupaUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/cr';

interface AuthContextType {
  session: Session | null;
  user: SupaUser | null;
  profile: User | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          // Fetch profile (defer to avoid deadlock)
          setTimeout(async () => {
            // Sync Google avatar to profile if available
            const meta = session.user.user_metadata;
            const googleAvatar = meta?.avatar_url || meta?.picture;
            if (googleAvatar) {
              await supabase
                .from('profiles')
                .update({ avatar_url: googleAvatar, name: meta?.name || meta?.full_name || undefined })
                .eq('id', session.user.id);
            }

            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            if (profileData) {
              setProfile({
                id: profileData.id,
                name: profileData.name,
                email: session.user.email || '',
                avatar_url: profileData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.id}`,
                onboarding_dismissed: (profileData as any).onboarding_dismissed ?? false,
              });
            }
            // Check admin role
            const { data: roleData } = await supabase.rpc('has_role', {
              _user_id: session.user.id,
              _role: 'admin',
            });
            setIsAdmin(!!roleData);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
