import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApps } from '../context/AppContext';
import { chatForImprovements } from '../services/geminiService';
import type { ChatMessage, GeneratedApp } from '../types';

const AppView: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const { apps, setApps, findAppById } = useApps();
  const [app, setApp] = useState<GeneratedApp | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!appId) return;
    const currentApp = findAppById(appId);
    if (currentApp) {
      setApp(currentApp);
    } else {
      // Handle case where app is not found
      navigate('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, apps]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [app?.chatHistory]);
  
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !app) return;

    const userMessage: ChatMessage = {
      sender: 'user',
      text: userInput,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...app.chatHistory, userMessage];
    setApp({ ...app, chatHistory: updatedHistory });
    setUserInput('');
    setIsAiThinking(true);

    try {
      const aiResponseText = await chatForImprovements(app.plan, app.html, updatedHistory);
      
      const isHtml = aiResponseText.trim().startsWith('<!DOCTYPE html>');
      let finalResponseText = aiResponseText;
      let updatedHtml = app.html;

      if(isHtml){
        finalResponseText = "I've updated the website preview with your requested changes.";
        updatedHtml = aiResponseText;
      }
      
      const aiMessage: ChatMessage = {
        sender: 'ai',
        text: finalResponseText,
        timestamp: new Date().toISOString(),
      };

      setApps(prevApps =>
        prevApps.map(a =>
          a.id === appId
            ? { ...a, chatHistory: [...updatedHistory, aiMessage], html: updatedHtml }
            : a
        )
      );
    } catch (error) {
       const errorMessage: ChatMessage = {
        sender: 'ai',
        text: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      };
       setApps(prevApps =>
        prevApps.map(a =>
          a.id === appId
            ? { ...a, chatHistory: [...updatedHistory, errorMessage] }
            : a
        )
      );
    } finally {
      setIsAiThinking(false);
    }
  };

  if (!app) {
    return (
      <div className="text-center p-10">
        <h2 className="text-2xl">App not found</h2>
        <Link to="/" className="text-blue-400 hover:underline mt-4 inline-block">Go to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-10rem)] gap-6">
      {/* Website Preview */}
      <div className="flex-grow lg:w-2/3 flex flex-col bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        <div className="p-3 bg-gray-700 flex items-center justify-between">
           <div className="flex items-center space-x-1.5">
             <span className="w-3 h-3 bg-red-500 rounded-full"></span>
             <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
             <span className="w-3 h-3 bg-green-500 rounded-full"></span>
           </div>
           <div className="bg-gray-800 text-gray-300 text-sm rounded-md px-4 py-1 flex-grow mx-4 text-center truncate">
              /{app.slug}
           </div>
        </div>
        <iframe
          srcDoc={app.html}
          title={app.name}
          className="w-full h-full border-0"
          sandbox="allow-scripts"
        />
      </div>

      {/* Control Panel */}
      <div className="lg:w-1/3 flex flex-col gap-6">
        {/* Analytics */}
        <div className="bg-gray-800 p-5 rounded-lg shadow-xl">
          <h2 className="text-xl font-bold mb-3">{app.name}</h2>
          <div className="flex items-center text-gray-300">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
             <span className="font-semibold">{app.views}</span>
             <span className="ml-1">Total Views</span>
          </div>
        </div>

        {/* Chat */}
        <div className="bg-gray-800 rounded-lg shadow-xl flex-grow flex flex-col">
          <h3 className="text-lg font-semibold p-4 border-b border-gray-700">Improve with AI</h3>
          <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
            {app.chatHistory.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-sm lg:max-w-xs p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
            {isAiThinking && (
                 <div className="flex justify-start">
                    <div className="max-w-xs md:max-w-sm lg:max-w-xs p-3 rounded-lg bg-gray-700 text-gray-200">
                        <div className="flex items-center space-x-2">
                           <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                           <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                           <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></div>
                        </div>
                    </div>
                 </div>
            )}
          </div>
          <form onSubmit={handleChatSubmit} className="p-4 border-t border-gray-700">
            <div className="flex items-center bg-gray-700 rounded-lg">
              <input
                type="text"
                value={userInput}
                // FIX: Corrected typo `e.e.target.value` to `e.target.value`.
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="e.g., 'Make the hero button green.'"
                className="w-full bg-transparent p-3 text-white focus:outline-none"
                disabled={isAiThinking}
              />
              <button type="submit" className="p-3 text-gray-400 hover:text-white disabled:text-gray-600" disabled={!userInput.trim() || isAiThinking}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppView;