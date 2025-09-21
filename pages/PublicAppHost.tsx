import React, { useEffect } from 'react';
import type { GeneratedApp } from '../types';
import { useApps } from '../context/AppContext';

interface PublicAppHostProps {
  app: GeneratedApp;
}

const PublicAppHost: React.FC<PublicAppHostProps> = ({ app }) => {
  const { setApps } = useApps();

  useEffect(() => {
    // Use sessionStorage to count a view only once per browser session.
    const viewedFlag = `viewed-${app.id}`;
    if (!sessionStorage.getItem(viewedFlag)) {
      setApps(prevApps =>
        prevApps.map(a =>
          a.id === app.id ? { ...a, views: (a.views || 0) + 1 } : a
        )
      );
      sessionStorage.setItem(viewedFlag, 'true');
    }

    // Replace the entire document with the generated app's HTML.
    document.documentElement.innerHTML = app.html;
    document.title = app.name;
    
  }, [app, setApps]);

  // This component's primary job is the side-effect above. It doesn't render any visible React content.
  return null;
};

export default PublicAppHost;
