import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type TourType = 'main' | 'create-cr';

interface OnboardingContextType {
  tourActive: boolean;
  activeTour: TourType | null;
  startTour: (type?: TourType) => void;
  stopTour: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [activeTour, setActiveTour] = useState<TourType | null>(null);

  const startTour = useCallback((type: TourType = 'main') => setActiveTour(type), []);
  const stopTour = useCallback(() => setActiveTour(null), []);

  return (
    <OnboardingContext.Provider value={{ tourActive: activeTour !== null, activeTour, startTour, stopTour }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
