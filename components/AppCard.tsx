import React from 'react';
import { Link } from 'react-router-dom';
import { AppDetails } from '../types.ts';

interface AppCardProps {
  app: AppDetails;
}

const AppCard: React.FC<AppCardProps> = ({ app }) => {
  const htmlFile = app.files.find(f => f.name === 'index.html');
  
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-blue-500/50 transition-shadow duration-300">
      <div className="h-48 bg-gray-700 flex items-center justify-center overflow-hidden">
         <iframe
            srcDoc={htmlFile?.content || '<p>No Preview Available</p>'}
            title={`Preview of ${app.prompt}`}
            className="w-full h-full transform scale-50 origin-top-left border-0"
            sandbox="allow-scripts"
        />
      </div>
      <div className="p-6">
        <p className="text-sm text-gray-400 truncate" title={app.prompt}>
          {app.prompt}
        </p>
        <h3 className="text-xl font-bold text-white mt-1 mb-3 truncate">{app.id}</h3>
        <div className="flex justify-between items-center">
          <Link
            to={`/_/app/${app.id}`}
            className="text-blue-400 hover:text-blue-300 font-semibold"
          >
            View Details
          </Link>
          {app.publicUrl && (
            <a
              href={app.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppCard;
