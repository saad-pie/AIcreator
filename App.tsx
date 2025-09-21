import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header.tsx';
import Dashboard from './pages/Dashboard.tsx';
import CreateApp from './pages/CreateApp.tsx';
import Settings from './pages/Settings.tsx';
import AppView from './pages/AppView.tsx';
import PublicAppHost from './pages/PublicAppHost.tsx';

function InternalLayout() {
    return (
        <>
            <Header />
            <main className="container mx-auto px-4">
                <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="create" element={<CreateApp />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="app/:appId" element={<AppView />} />
                    <Route index element={<Navigate to="/_/dashboard" replace />} />
                </Routes>
            </main>
        </>
    )
}

const App: React.FC = () => {
  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans">
        <Routes>
            {/* Publicly hosted app view. Does not include the Header/Layout. */}
            <Route path="/:owner/:repoName" element={<PublicAppHost />} />

            {/* Internal app management UI */}
            <Route path="/_/*" element={<InternalLayout />} />

            {/* Redirect root to the dashboard */}
            <Route path="/" element={<Navigate to="/_/dashboard" replace />} />

            {/* Catch-all for any other path */}
            <Route path="*" element={<Navigate to="/_/dashboard" replace />} />
        </Routes>
    </div>
  );
};

export default App;
