import React, { createContext, useContext, ReactNode } from 'react';
import { AppDetails, UserSettings } from '../types.ts';
import useLocalStorage from '../hooks/useLocalStorage.ts';

interface AppContextType {
  apps: AppDetails[];
  setApps: React.Dispatch<React.SetStateAction<AppDetails[]>>;
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  addApp: (app: AppDetails) => void;
  getAppById: (id: string) => AppDetails | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apps, setApps] = useLocalStorage<AppDetails[]>('ai-apps', []);
  const [settings, setSettings] = useLocalStorage<UserSettings>('ai-settings', {
    githubToken: '',
  });

  const addApp = (app: AppDetails) => {
    setApps(prevApps => [app, ...prevApps]);
  };

  const getAppById = (id: string) => {
    return apps.find(app => app.id === id);
  };

  const value = { apps, setApps, settings, setSettings, addApp, getAppById };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApps = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApps must be used within an AppProvider');
  }
  return context;
};
