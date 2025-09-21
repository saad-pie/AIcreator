import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApps } from '../context/AppContext';
import { createAppPlan, generateAppHtml } from '../services/geminiService';
import LoadingSpinner from '../components/LoadingSpinner';
import type { AppPlan } from '../types';

enum Stage {
  IDEA,
  PLANNING,
  REVIEW,
  BUILDING,
}

const CreateApp: React.FC = () => {
  const [stage, setStage] = useState<Stage>(Stage.IDEA);
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [plan, setPlan] = useState<AppPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setApps } = useApps();
  const navigate = useNavigate();

  const handlePlanCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStage(Stage.PLANNING);
    try {
      const newPlan = await createAppPlan(appName, appDescription);
      setPlan(newPlan);
      setStage(Stage.REVIEW);
    } catch (err) {
      setError((err as Error).message);
      setStage(Stage.IDEA);
    }
  };

  const handleBuild = async () => {
    if (!plan) return;
    setError(null);
    setStage(Stage.BUILDING);
    try {
      const html = await generateAppHtml(plan, appName);
      const slug = appName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const newApp = {
        id: self.crypto.randomUUID(),
        name: appName,
        slug,
        plan,
        html,
        views: 0,
        chatHistory: [],
        createdAt: new Date().toISOString(),
      };
      setApps(prevApps => [newApp, ...prevApps]);
      navigate(`/_/app/${newApp.id}`);
    } catch (err) {
      setError((err as Error).message);
      setStage(Stage.REVIEW);
    }
  };

  const renderContent = () => {
    switch (stage) {
      case Stage.IDEA:
        return (
          <form onSubmit={handlePlanCreation} className="space-y-6">
            <div>
              <label htmlFor="appName" className="block text-sm font-medium text-gray-300">App Name</label>
              <input
                type="text"
                id="appName"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                required
                className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-white p-3"
                placeholder="e.g., 'SteveAI'"
              />
            </div>
            <div>
              <label htmlFor="appDescription" className="block text-sm font-medium text-gray-300">Describe Your Website</label>
              <textarea
                id="appDescription"
                rows={4}
                value={appDescription}
                onChange={(e) => setAppDescription(e.target.value)}
                required
                className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-white p-3"
                placeholder="e.g., 'A personal portfolio site for a cat who is a software engineer.'"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition duration-300 disabled:bg-blue-800 disabled:cursor-not-allowed"
              disabled={!appName || !appDescription}
            >
              Generate Plan
            </button>
            {error && <p className="text-red-400 mt-2">{error}</p>}
          </form>
        );
      case Stage.PLANNING:
        return <LoadingSpinner message="AI is drafting your website plan..." />;
      case Stage.REVIEW:
        if (!plan) return null;
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold">Plan Review</h2>
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Detailed Description</h3>
              <p className="text-gray-300">{plan.detailedDescription}</p>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Color Palette</h3>
              <div className="flex space-x-4">
                {Object.entries(plan.colorPalette).map(([name, color]) => (
                  <div key={name} className="flex-1 text-center">
                    <div className="h-16 w-full rounded" style={{ backgroundColor: color }}></div>
                    <p className="text-xs mt-1 capitalize text-gray-400">{name}</p>
                    <p className="text-xs font-mono">{color}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Key Features</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                {plan.features.map((feature, i) => <li key={i}>{feature}</li>)}
              </ul>
            </div>
            {error && <p className="text-red-400 mt-2">{error}</p>}
            <div className="flex justify-between items-center pt-4">
              <button onClick={() => setStage(Stage.IDEA)} className="text-gray-400 hover:text-white transition">Back</button>
              <button onClick={handleBuild} className="bg-green-600 text-white font-bold py-3 px-6 rounded-md hover:bg-green-700 transition">Approve & Build</button>
            </div>
          </div>
        );
      case Stage.BUILDING:
        return <LoadingSpinner message="Building your website. This might take a moment..." />;
    }
  };

  return (
    <div className="container mx-auto max-w-2xl">
      <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-lg shadow-2xl">
        <h1 className="text-3xl font-extrabold text-white mb-6 text-center">Create a New Website</h1>
        {renderContent()}
      </div>
    </div>
  );
};

export default CreateApp;
