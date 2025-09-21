
import React, { createContext, useContext, ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { GeneratedApp } from '../types';

interface AppContextType {
  apps: GeneratedApp[];
  setApps: React.Dispatch<React.SetStateAction<GeneratedApp[]>>;
  findAppById: (id: string) => GeneratedApp | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apps, setApps] = useLocalStorage<GeneratedApp[]>('generated-apps', []);

  const findAppById = (id: string) => apps.find(app => app.id === id);

  return (
    <AppContext.Provider value={{ apps, setApps, findAppById }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApps = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApps must be used within an AppProvider');
  }
  return context;
};
