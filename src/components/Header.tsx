import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Flame, Plus, LogOut, Beaker, Lightbulb, Settings, ChevronDown } from 'lucide-react';
import { useCR } from '@/context/CRContext';
import { useAuth } from '@/context/AuthContext';
import { useOnboarding } from '@/context/OnboardingContext';
import { useDemoMode } from '@/context/DemoModeContext';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { crs, currentUser } = useCR();
  const { signOut, isAdmin } = useAuth();
  const { startTour } = useOnboarding();
  const { isDemoMode, toggleDemoMode } = useDemoMode();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const myPendingReviews = crs.filter(cr =>
    cr.reviewers.some(r => r.user_id === currentUser.id && r.status === 'pending') && cr.status !== 'draft'
  ).length;

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
      isDemoMode
        ? 'border-accent bg-accent/5'
        : 'border-border bg-background/80'
    }`}>
      {isDemoMode && (
        <div className="bg-accent/15 px-4 py-1 text-center text-xs font-semibold text-accent-foreground">
          <Beaker className="mr-1 inline h-3 w-3" />
          Demo Mode — viewing mock data
        </div>
      )}
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className={`rounded-lg p-1.5 transition-transform group-hover:scale-110 ${isDemoMode ? 'bg-accent' : 'gradient-warm'}`}>
              <Flame className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">LensFlare</span>
            {!isDemoMode && (
              <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary ring-1 ring-primary/30">Alpha</span>
            )}
            {isDemoMode && (
              <span className="rounded-md bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground ring-1 ring-accent/40">Demo</span>
            )}
          </Link>

          
          <nav className="flex items-center gap-1">
            <Link
              to="/"
              data-tour="nav-dashboard"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/') ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/dashboard"
              data-tour="nav-feed"
              className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/dashboard') ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              Feed
              {myPendingReviews > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {myPendingReviews}
                </span>
              )}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {!isDemoMode && (
            <Link
              to="/cr/new"
              data-tour="new-cr"
              className="gradient-warm flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              New CR
            </Link>
          )}

          {/* User menu */}
          <div ref={menuRef} className="relative" data-tour="profile-area">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1.5 rounded-lg p-1 hover:bg-secondary transition-colors"
            >
              <img
                src={currentUser.avatar_url}
                alt={currentUser.name}
                className={`h-8 w-8 rounded-full ring-2 ${isDemoMode ? 'ring-accent' : 'ring-border'}`}
              />
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border border-border bg-card p-1 shadow-lg">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-sm font-medium text-foreground truncate">{currentUser.name}</p>
                </div>
                <button
                  onClick={() => { navigate('/settings'); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </button>
                <button
                  onClick={() => { startTour('main'); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  Show Tour
                </button>
                {isAdmin && (
                  <>
                    <div className="my-1 border-t border-border" />
                    <button
                      onClick={() => { toggleDemoMode(); navigate('/'); setMenuOpen(false); }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                        isDemoMode
                          ? 'text-accent-foreground bg-accent/10 hover:bg-accent/20'
                          : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Beaker className="h-3.5 w-3.5" />
                        Demo Mode
                      </span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        isDemoMode ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'
                      }`}>
                        {isDemoMode ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  </>
                )}
                <div className="my-1 border-t border-border" />
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
