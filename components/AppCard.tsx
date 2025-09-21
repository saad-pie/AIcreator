import React from 'react';
import { Link } from 'react-router-dom';
import type { GeneratedApp } from '../types';

interface AppCardProps {
  app: GeneratedApp;
}

const AppCard: React.FC<AppCardProps> = ({ app }) => {
  const { primary, secondary, accent, neutral } = app.plan.colorPalette;

  return (
    <Link to={`/_/app/${app.id}`} className="block group">
      <div className="h-full bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-blue-500/30 group-hover:-translate-y-1">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white truncate">{app.name}</h3>
            <div className="flex items-center text-xs text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                {app.views}
            </div>
          </div>
          <p className="text-gray-400 mt-2 text-sm leading-relaxed truncate">{app.plan.detailedDescription}</p>
          <div className="flex space-x-2 mt-4">
            <div className="w-1/4 h-2 rounded" style={{ backgroundColor: primary }}></div>
            <div className="w-1/4 h-2 rounded" style={{ backgroundColor: secondary }}></div>
            <div className="w-1/4 h-2 rounded" style={{ backgroundColor: accent }}></div>
            <div className="w-1/4 h-2 rounded" style={{ backgroundColor: neutral }}></div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AppCard;
