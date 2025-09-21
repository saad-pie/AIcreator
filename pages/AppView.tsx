import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApps } from '../context/AppContext.tsx';

const AppView: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const { getAppById } = useApps();
  const app = getAppById(appId!);

  const [activeTab, setActiveTab] = useState('preview'); // 'preview' or 'files'

  if (!app) {
    return (
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">App not found</h1>
        <Link to="/_/dashboard" className="text-blue-400 hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const htmlContent = app.files.find(f => f.name === 'index.html')?.content || '';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-white mb-2 truncate">{app.id}</h1>
        <p className="text-lg text-gray-400">"{app.prompt}"</p>
        <div className="mt-4 flex space-x-4">
             {app.publicUrl && (
                <a href={app.publicUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">
                    View Live Site
                </a>
            )}
            {app.githubRepoUrl && (
                 <a href={app.githubRepoUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600">
                    View on GitHub
                </a>
            )}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg">
        <div className="border-b border-gray-700">
            <nav className="flex space-x-4 p-4">
                <button onClick={() => setActiveTab('preview')} className={`px-3 py-2 font-medium text-sm rounded-md ${activeTab === 'preview' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                    Preview
                </button>
                <button onClick={() => setActiveTab('files')} className={`px-3 py-2 font-medium text-sm rounded-md ${activeTab === 'files' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                    Files ({app.files.length})
                </button>
            </nav>
        </div>
        
        <div className="p-4">
            {activeTab === 'preview' && (
                <div className="w-full h-[60vh] bg-white rounded-md">
                     <iframe
                        srcDoc={htmlContent}
                        title="App Preview"
                        className="w-full h-full border-0 rounded-md"
                        sandbox="allow-scripts allow-same-origin"
                    />
                </div>
            )}
            {activeTab === 'files' && (
                <div className="space-y-4">
                    {app.files.map(file => (
                        <div key={file.name} className="bg-gray-900 rounded-lg">
                            <h3 className="font-mono text-lg text-white p-3 bg-gray-700 rounded-t-lg">{file.name}</h3>
                            <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
                                <code>
                                    {file.content}
                                </code>
                            </pre>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AppView;
