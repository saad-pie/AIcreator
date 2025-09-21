import React from 'react';
// FIX: Import `Link` from `react-router-dom` to be used in the 404 fallback page.
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { useApps } from './context/AppContext';

import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import CreateApp from './pages/CreateApp';
import AppView from './pages/AppView';
import PublicAppHost from './pages/PublicAppHost';

const App: React.FC = () => {
  const location = useLocation();
  const { apps } = useApps();

  const path = location.pathname;

  // Render the admin interface for the root URL or any path under the `/_/` namespace
  if (path === '/' || path.startsWith('/_/')) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
        <Header />
        <main className="p-4 sm:p-6 md:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/_/create" element={<CreateApp />} />
            <Route path="/_/app/:appId" element={<AppView />} />
          </Routes>
        </main>
      </div>
    );
  }

  // Check if the path corresponds to a generated public website
  const slug = path.substring(1).split('/')[0]; // Get the first path segment as the slug
  if (slug) {
      const matchedApp = apps.find(app => app.slug === slug);
      if (matchedApp) {
        return <PublicAppHost app={matchedApp} />;
      }
  }
  
  // Fallback 404 page for any route that doesn't match the admin or a public app
  return (
     <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex items-center justify-center text-center p-4">
        <div>
           <h1 className="text-6xl font-extrabold text-blue-500">404</h1>
           <h2 className="text-3xl font-bold text-white mt-2">Page Not Found</h2>
           <p className="text-gray-400 mt-4">The page or website you were looking for does not exist.</p>
           <Link to="/" className="mt-8 inline-block bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300">
            Go to Dashboard
          </Link>
        </div>
     </div>
  );
};

export default App;
