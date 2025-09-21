import React, { useState } from 'react';
import { useApps } from '../context/AppContext.tsx';

const Settings: React.FC = () => {
  const { settings, setSettings } = useApps();
  const [githubToken, setGithubToken] = useState(settings.githubToken);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSettings({ ...settings, githubToken });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-4xl font-extrabold text-white mb-2">Settings</h1>
      <p className="text-lg text-gray-400 mb-8">Manage your application settings and integrations.</p>

      <div className="bg-gray-800 p-8 rounded-lg max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-4">GitHub Integration</h2>
        <p className="text-gray-400 mb-6">
          A GitHub personal access token is required to create repositories and deploy your websites. 
          You can generate a token in your GitHub settings under "Developer settings" {'>'} "Personal access tokens".
          Ensure the token has `public_repo` scope.
        </p>

        <div className="mb-4">
          <label htmlFor="githubToken" className="block text-gray-300 font-bold mb-2">
            GitHub Personal Access Token
          </label>
          <input
            type="password"
            id="githubToken"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ghp_..."
          />
        </div>

        <button
          onClick={handleSave}
          className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300 disabled:bg-gray-500"
          disabled={!githubToken}
        >
          Save Token
        </button>

        {saved && (
          <p className="text-green-400 mt-4">Settings saved successfully!</p>
        )}
      </div>
    </div>
  );
};

export default Settings;
