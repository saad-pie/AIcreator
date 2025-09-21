import React from 'react';
import { Link } from 'react-router-dom';
// Fix: Added .tsx file extension to fix module resolution error.
import { useApps } from '../context/AppContext.tsx';
// Fix: Added .tsx file extension to fix module resolution error.
import AppCard from '../components/AppCard.tsx';

const Dashboard: React.FC = () => {
  const { apps } = useApps();
  const sortedApps = [...apps].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="container mx-auto">
      <h1 className="text-4xl font-extrabold text-white mb-2">Your Dashboard</h1>
      <p className="text-lg text-gray-400 mb-8">Oversee and manage all your AI-generated websites.</p>

      {sortedApps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedApps.map(app => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-6 bg-gray-800 rounded-lg">
          <h2 className="text-2xl font-semibold text-white mb-3">No Websites Yet!</h2>
          <p className="text-gray-400 mb-6">It looks like your digital canvas is empty. Let's create something amazing.</p>
          <Link
            to="/_/create"
            className="inline-block bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300"
          >
            Create Your First App
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
