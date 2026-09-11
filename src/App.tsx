import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { CRProvider } from "@/context/CRContext";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { TeamProvider } from "@/context/TeamContext";
import Header from "@/components/Header";
import OnboardingTour from "@/components/OnboardingTour";
import Feed from "@/pages/Feed";
import CRDetail from "@/pages/CRDetail";
import Dashboard from "@/pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Public, read-only demo: there's no session/team gating anymore. Every
// visitor lands straight in the app, browsing seeded data from Supabase.
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TeamProvider>
            <OnboardingProvider>
              <CRProvider>
                <Header />
                <OnboardingTour />
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/cr/:id" element={<CRDetail />} />
                  <Route path="/dashboard" element={<Feed />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </CRProvider>
            </OnboardingProvider>
          </TeamProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
