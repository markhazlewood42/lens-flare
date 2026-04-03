import { createContext, useContext, useState, ReactNode } from 'react';

interface DemoModeContextType {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextType>({ isDemoMode: false, toggleDemoMode: () => {} });

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const toggleDemoMode = () => setIsDemoMode(prev => !prev);
  return (
    <DemoModeContext.Provider value={{ isDemoMode, toggleDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}
