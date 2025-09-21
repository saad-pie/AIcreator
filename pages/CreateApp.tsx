import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApps } from '../context/AppContext.tsx';
import { generateWebsite, generateWebsitePlan } from '../services/geminiService.ts';
import { createGithubRepo, uploadFilesToRepo, enableGithubPages } from '../services/githubService.ts';
import { AppDetails } from '../types.ts';
import LoadingSpinner from '../components/LoadingSpinner.tsx';
import { marked } from "https://esm.run/marked@13.0.0";


const getDevHtmlContent = () => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Dev Assistant</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white font-sans">
    <div class="flex h-screen">
        <!-- Sidebar -->
        <div class="w-1/3 bg-gray-800 p-6 flex flex-col h-screen max-h-screen">
            <h1 class="text-2xl font-bold mb-4">AI Dev Assistant</h1>
            <p class="text-gray-400 mb-6 text-sm">Modify your website with AI. Your site preview is on the right. Changes may take a few minutes to reflect after a successful update.</p>
            
            <!-- Config -->
            <div class="mb-6">
                <h2 class="text-lg font-semibold mb-2">Configuration</h2>
                <label for="githubToken" class="block text-sm font-medium text-gray-300">GitHub Token</label>
                <input type="password" id="githubToken" class="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="ghp_..." autocomplete="off">
                
                <label for="geminiApiKey" class="block text-sm font-medium text-gray-300 mt-4">Gemini API Key</label>
                <input type="password" id="geminiApiKey" class="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Your Gemini API Key" autocomplete="off">
                <p class="text-xs text-gray-500 mt-2">Your keys are stored in your browser's local storage and are only sent to GitHub and Google APIs directly from your browser.</p>
            </div>

            <!-- Chat -->
            <div class="flex-grow flex flex-col bg-gray-900 rounded-lg p-4 min-h-0">
                <div id="chat-history" class="flex-grow overflow-y-auto mb-4 space-y-4 pr-2">
                    <!-- Chat messages will be appended here -->
                </div>
                <div class="flex">
                    <input type="text" id="chat-input" class="flex-grow bg-gray-700 text-white rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Change the background to dark blue">
                    <button id="send-btn" class="bg-blue-600 text-white font-bold py-2 px-4 rounded-r-lg hover:bg-blue-700 disabled:bg-gray-500" aria-label="Send Message">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clip-rule="evenodd" /></svg>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Preview -->
        <div class="w-2/3">
            <iframe id="preview-frame" src="./index.html" class="w-full h-full border-l-2 border-gray-700"></iframe>
        </div>
    </div>
    <script type="module" src="./dev.js"></script>
</body>
</html>`;


const getDevJsContent = (owner, repoName) => `import { GoogleGenAI, Type } from "https://esm.run/@google/genai";

const GITHUB_API_URL = "https://api.github.com";
const REPO_OWNER = "${owner}";
const REPO_NAME = "${repoName}";

// DOM elements
const githubTokenInput = document.getElementById('githubToken');
const geminiApiKeyInput = document.getElementById('geminiApiKey');
const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const previewFrame = document.getElementById('preview-frame');

let ai;
let isWorking = false;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    files: {
      type: Type.ARRAY,
      description: "An array of files to update, including index.html, style.css, and script.js. Only include files that have changed.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "The filename, e.g., index.html" },
          content: { type: Type.STRING, description: "The complete new code content for the file." },
        },
        required: ["name", "content"],
      },
    },
  },
  required: ["files"],
};

function encodeUnicodeToBase64(str) {
    return btoa(
        encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) =>
            String.fromCharCode(parseInt(p1, 16))
        )
    );
}

function updateWorkingState(working) {
    isWorking = working;
    sendBtn.disabled = isWorking;
    chatInput.disabled = isWorking;
    chatInput.placeholder = isWorking ? "AI is working..." : "e.g., Change the background to dark blue";
}

// Load keys from localStorage
githubTokenInput.value = localStorage.getItem('githubToken') || '';
geminiApiKeyInput.value = localStorage.getItem('geminiApiKey') || '';

// Save keys to localStorage on change
githubTokenInput.addEventListener('input', () => localStorage.setItem('githubToken', githubTokenInput.value));
geminiApiKeyInput.addEventListener('input', () => {
    localStorage.setItem('geminiApiKey', geminiApiKeyInput.value);
    try {
        if (geminiApiKeyInput.value) {
            ai = new GoogleGenAI({ apiKey: geminiApiKeyInput.value });
        }
    } catch (e) {
        console.error("Failed to initialize Gemini AI:", e);
        addMessage('system', 'Error: Invalid Gemini API Key format.');
        ai = null;
    }
});

try {
    if (geminiApiKeyInput.value) {
        ai = new GoogleGenAI({ apiKey: geminiApiKeyInput.value });
    }
} catch (e) {
    console.error("Failed to initialize Gemini AI from stored key:", e);
    ai = null;
}


// Chat logic
sendBtn.addEventListener('click', handleSend);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !isWorking) handleSend();
});

async function handleSend() {
    const prompt = chatInput.value.trim();
    if (!prompt || isWorking) return;

    const githubToken = githubTokenInput.value;
    const geminiApiKey = geminiApiKeyInput.value;

    if (!githubToken || !geminiApiKey) {
        addMessage('system', 'Error: Please provide both GitHub Token and Gemini API Key.');
        return;
    }
    if (!ai) {
        addMessage('system', 'Error: Gemini AI not initialized. Check your API Key.');
        return;
    }

    addMessage('user', prompt);
    chatInput.value = '';
    updateWorkingState(true);
    
    try {
        addMessage('system', 'Fetching current website files from GitHub...');
        const files = await getRepoFiles();
        
        const filesContentString = files.map(f => \`
--- File: \${f.name} ---
\${f.content}
\`).join('\\n\\n');

        const fullPrompt = \`
You are an expert web developer. The user wants to modify their website.
Based on the user's request, update the provided website files.
The website files are: index.html, style.css, and script.js.
You MUST return ONLY the updated files in a JSON object format with a 'files' property, which is an array of file objects. Each file object must have 'name' and 'content' properties. Do not return files that are not changed.

Current files:
\${filesContentString}

User Request: "\${prompt}"
\`;

        addMessage('system', 'Thinking... this may take a moment.');
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);

        if (!result.files || !Array.isArray(result.files) || result.files.length === 0) {
            addMessage('system', 'AI did not suggest any changes.');
            updateWorkingState(false);
            return;
        }

        addMessage('system', \`AI generated updates for \${result.files.length} file(s). Pushing to GitHub...\`);
        
        for (const file of result.files) {
            const originalFile = files.find(f => f.name === file.name);
            if (!originalFile) {
                console.warn(\`AI returned a new file '\${file.name}', which is not supported. Skipping.\`);
                continue;
            }
            await updateRepoFile(file.name, file.content, originalFile.sha);
            addMessage('system', \`Updated \${file.name}\`);
        }

        addMessage('system', 'Updates pushed successfully! Refreshing preview...');
        previewFrame.src = './index.html?t=' + new Date().getTime(); // bust cache

    } catch (error) {
        console.error(error);
        addMessage('system', \`Error: \${error.message}\`);
    } finally {
        updateWorkingState(false);
    }
}

function addMessage(sender, text) {
    const messageEl = document.createElement('div');
    messageEl.className = \`p-3 rounded-lg max-w-full \${sender === 'user' ? 'bg-blue-600 self-end' : 'bg-gray-700 self-start'}\`;
    messageEl.textContent = text;
    chatHistory.appendChild(messageEl);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// GitHub API functions
async function githubApiRequest(endpoint, options = {}) {
    const token = githubTokenInput.value;
    const response = await fetch(\`\${GITHUB_API_URL}/repos/\${REPO_OWNER}/\${REPO_NAME}/\${endpoint}\`, {
        ...options,
        headers: {
            'Authorization': \`token \${token}\`,
            'Accept': 'application/vnd.github.v3+json',
            ...options.headers,
        }
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(\`GitHub API Error (\${response.status}): \${err.message}\`);
    }
    return response.json();
}

async function getRepoFiles() {
    const contents = await githubApiRequest('contents/');
    const filesToFetch = contents.filter(f => ['index.html', 'style.css', 'script.js'].includes(f.name));

    const files = [];
    for (const file of filesToFetch) {
        // Use API to get content to avoid CORS issues with download_url in some environments
        const fileData = await githubApiRequest(\`contents/\${file.path}\`);
        // content is base64 encoded
        const content = decodeURIComponent(escape(atob(fileData.content)));
        files.push({ name: file.name, content, sha: file.sha });
    }
    return files;
}

async function updateRepoFile(path, content, sha) {
    return githubApiRequest(\`contents/\${path}\`, {
        method: 'PUT',
        body: JSON.stringify({
            message: \`feat: update \${path} via AI dev assistant\`,
            content: encodeUnicodeToBase64(content),
            sha: sha,
            branch: 'main'
        })
    });
}

// Initial message
addMessage('system', 'Welcome! Enter your API keys, then describe the changes you want to make to your website.');
`;

const CreateApp: React.FC = () => {
  const [step, setStep] = useState<'prompt' | 'review' | 'loading'>('prompt');
  const [prompt, setPrompt] = useState('');
  const [repoName, setRepoName] = useState('');
  const [description, setDescription] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const { addApp, settings } = useApps();
  const navigate = useNavigate();

  const handleGeneratePlan = async () => {
    if (!prompt) {
      setError("Please enter a prompt for your website.");
      return;
    }
    setIsLoading(true);
    setLoadingMessage("Generating a plan for your website...");
    setError(null);

    try {
        const plan = await generateWebsitePlan(prompt);
        setRepoName(plan.name.slice(0, 40)); // Keep repo name reasonable
        setDescription(plan.description);
        setStep('review');
    } catch (err: any) {
        setError(err.message || "Failed to generate plan.");
    } finally {
        setIsLoading(false);
    }
  }


  const handleCreateApp = async () => {
    if (!repoName || !description) {
      setError("Project name and description cannot be empty.");
      return;
    }
    if (!settings.githubToken) {
      setError("GitHub token is not set. Please go to settings to add it.");
      navigate('/_/settings');
      return;
    }
  
    setStep('loading');
    setError(null);
  
    try {
      setLoadingMessage("Building your vision with AI... this may take a moment.");
      // Use the (potentially edited) description as the prompt for generation
      const files = await generateWebsite(description);
  
      const finalRepoName = `${repoName.replace(/[^a-z0-9-]/g, '')}-${Date.now() % 10000}`;
      setLoadingMessage(`Creating GitHub repository: ${finalRepoName}...`);
      const repo = await createGithubRepo(finalRepoName, settings.githubToken);
  
      setLoadingMessage("Preparing deployment files...");
      const readmeFile = { name: 'README.md', content: description };
      const devHtmlFile = { name: 'dev.html', content: getDevHtmlContent() };
      const devJsFile = { name: 'dev.js', content: getDevJsContent(repo.owner.login, repo.name) };
      const allFiles = [...files, readmeFile, devHtmlFile, devJsFile];

      setLoadingMessage("Deploying files to your new repository...");
      await uploadFilesToRepo(repo.owner.login, repo.name, allFiles, settings.githubToken);
      
      setLoadingMessage("Activating deployment via GitHub Pages...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      const pagesInfo = await enableGithubPages(repo.owner.login, repo.name, settings.githubToken);
      
      const newApp: AppDetails = {
        id: repo.name,
        prompt: prompt, // Store original prompt
        files: allFiles,
        createdAt: new Date().toISOString(),
        githubRepoUrl: repo.html_url,
        publicUrl: pagesInfo.html_url,
      };
  
      addApp(newApp);
      navigate(`/_/app/${newApp.id}`, { state: { justCreated: true } });
  
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
      setStep('review'); // Go back to review step on error
    } finally {
        setIsLoading(false);
    }
  };

  const descriptionPreview = useMemo(() => {
    return { __html: marked.parse(description) };
  }, [description]);

  if (step === 'loading' || isLoading) {
    return <LoadingSpinner message={loadingMessage} />;
  }
  
  if (step === 'review') {
    return (
    <div>
      <h1 className="text-4xl font-extrabold text-white mb-2">Review Your Plan</h1>
      <p className="text-lg text-gray-400 mb-8">Here's the plan generated by AI. Feel free to edit it before we build your site.</p>
        <div className="bg-gray-800 p-8 rounded-lg space-y-6">
            <div>
                <label htmlFor="repoName" className="block text-gray-300 font-bold mb-2">Project Name</label>
                <input id="repoName" value={repoName} onChange={e => setRepoName(e.target.value)} className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label htmlFor="description" className="block text-gray-300 font-bold mb-2">Description (Markdown)</label>
                    <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="w-full h-96 p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" />
                </div>
                <div>
                    <label className="block text-gray-300 font-bold mb-2">Description Preview</label>
                    <div className="w-full h-96 p-3 bg-gray-900 border border-gray-600 rounded-lg overflow-y-auto prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={descriptionPreview} />
                </div>
            </div>
            <div className="flex justify-between items-center">
                 <button onClick={() => setStep('prompt')} className="text-gray-400 hover:text-white">Back</button>
                 <button onClick={handleCreateApp} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors duration-300">
                    Create Website
                </button>
            </div>
            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
        </div>
    </div>
    )
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
          onClick={handleGeneratePlan}
          className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300 disabled:bg-gray-500"
          disabled={!prompt}
        >
          Generate Plan
        </button>
        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default CreateApp;