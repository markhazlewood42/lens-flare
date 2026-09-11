import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Flame, Lightbulb, ChevronDown } from 'lucide-react';
import { useCR } from '@/context/CRContext';
import { useOnboarding } from '@/context/OnboardingContext';

export default function Header() {
  const location = useLocation();
  const { crs, currentUser } = useCR();
  const { startTour } = useOnboarding();
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
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="gradient-warm rounded-lg p-1.5 transition-transform group-hover:scale-110">
              <Flame className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">LensFlare</span>
            <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary ring-1 ring-primary/30">Demo</span>
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
          {/* Viewer menu — this is a public read-only demo, so there's no sign-out or settings here */}
          <div ref={menuRef} className="relative" data-tour="profile-area">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1.5 rounded-lg p-1 hover:bg-secondary transition-colors"
            >
              <img
                src={currentUser.avatar_url}
                alt={currentUser.name}
                className="h-8 w-8 rounded-full ring-2 ring-border"
              />
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border border-border bg-card p-1 shadow-lg">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-sm font-medium text-foreground truncate">{currentUser.name}</p>
                </div>
                <button
                  onClick={() => { startTour('main'); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  Show Tour
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
