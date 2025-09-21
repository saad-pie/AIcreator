import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApps } from '../context/AppContext.tsx';
import { generateWebsite } from '../services/geminiService.ts';
import { createGithubRepo, uploadFilesToRepo, enableGithubPages } from '../services/githubService.ts';
import { AppDetails } from '../types.ts';
import LoadingSpinner from '../components/LoadingSpinner.tsx';

const CreateApp: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const { addApp, settings } = useApps();
  const navigate = useNavigate();

  const handleCreateApp = async () => {
    if (!prompt) {
      setError("Please enter a prompt for your website.");
      return;
    }
    if (!settings.githubToken) {
      setError("GitHub token is not set. Please go to settings to add it.");
      navigate('/_/settings');
      return;
    }
  
    setIsLoading(true);
    setError(null);
  
    try {
      setLoadingMessage("Building your vision with AI... this may take a moment.");
      const files = await generateWebsite(prompt);
  
      const repoName = `ai-site-${prompt.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 20)}-${Date.now() % 10000}`;
      setLoadingMessage(`Creating GitHub repository: ${repoName}...`);
      const repo = await createGithubRepo(repoName, settings.githubToken);
  
      setLoadingMessage("Deploying files to your new repository...");
      await uploadFilesToRepo(repo.owner.login, repo.name, files, settings.githubToken);
      
      setLoadingMessage("Activating deployment via GitHub Pages...");
      // Add a small delay to allow GitHub to process the new branch/files.
      await new Promise(resolve => setTimeout(resolve, 3000));
      const pagesInfo = await enableGithubPages(repo.owner.login, repo.name, settings.githubToken);
      
      const newApp: AppDetails = {
        id: repo.name,
        prompt,
        files,
        createdAt: new Date().toISOString(),
        githubRepoUrl: repo.html_url,
        publicUrl: pagesInfo.html_url,
      };
  
      addApp(newApp);
      setIsLoading(false);
      navigate(`/_/app/${newApp.id}`, { state: { justCreated: true } });
  
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message={loadingMessage} />;
  }

  return (
    <div>
      <h1 className="text-4xl font-extrabold text-white mb-2">Create New App</h1>
      <p className="text-lg text-gray-400 mb-8">Describe the website you want to build in plain English.</p>

      <div className="bg-gray-800 p-8 rounded-lg">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full h-40 p-4 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          placeholder="e.g., A modern portfolio website for a photographer named John Doe, with a gallery and contact page."
        />
        <button
          onClick={handleCreateApp}
          className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300 disabled:bg-gray-500"
          disabled={isLoading || !prompt}
        >
          {isLoading ? 'Creating...' : 'Generate Website'}
        </button>
        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default CreateApp;