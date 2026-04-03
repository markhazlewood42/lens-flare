import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CRProvider } from "@/context/CRContext";
import { DemoCRProvider } from "@/context/DemoCRContext";
import { DemoTeamProvider } from "@/context/DemoTeamContext";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { TeamProvider, useTeam } from "@/context/TeamContext";
import { DemoModeProvider, useDemoMode } from "@/context/DemoModeContext";
import Header from "@/components/Header";
import OnboardingTour from "@/components/OnboardingTour";
import Feed from "@/pages/Feed";
import CRDetail from "@/pages/CRDetail";
import CreateCR from "@/pages/CreateCR";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import TeamDetail from "@/pages/TeamDetail";
import Auth from "@/pages/Auth";
import TeamSetup from "@/pages/TeamSetup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function TeamGate({ children }: { children: React.ReactNode }) {
  const { userTeams, loading } = useTeam();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="gradient-warm rounded-xl p-3 animate-pulse">
          <span className="text-2xl">🔥</span>
        </div>
      </div>
    );
  }

  if (userTeams.length === 0) {
    return <TeamSetup />;
  }

  return <>{children}</>;
}

function CRProviderSwitch({ children }: { children: React.ReactNode }) {
  const { isDemoMode } = useDemoMode();

  if (isDemoMode) {
    return (
      <DemoTeamProvider>
        <DemoCRProvider>{children}</DemoCRProvider>
      </DemoTeamProvider>
    );
  }

  return <CRProvider>{children}</CRProvider>;
}

function ProtectedRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="gradient-warm rounded-xl p-3 animate-pulse">
          <span className="text-2xl">🔥</span>
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;

  return (
    <TeamProvider>
      <DemoModeProvider>
        <Routes>
          <Route path="/team-setup" element={<TeamSetup />} />
          <Route path="/*" element={
            <TeamGate>
              <OnboardingProvider>
                <CRProviderSwitch>
                  <Header />
                  <OnboardingTour />
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/cr/new" element={<CreateCR />} />
                    <Route path="/cr/:id/edit" element={<CreateCR />} />
                    <Route path="/cr/:id" element={<CRDetail />} />
                    <Route path="/dashboard" element={<Feed />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/settings/team/:teamId" element={<TeamDetail />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </CRProviderSwitch>
              </OnboardingProvider>
            </TeamGate>
          } />
        </Routes>
      </DemoModeProvider>
    </TeamProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
