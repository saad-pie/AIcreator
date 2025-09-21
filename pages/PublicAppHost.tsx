import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner.tsx';

const PublicAppHost: React.FC = () => {
  const { owner, repoName } = useParams<{ owner: string, repoName: string }>();
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!owner || !repoName) return;

    const fetchHtml = async () => {
      try {
        const url = `https://raw.githubusercontent.com/${owner}/${repoName}/main/index.html`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Could not fetch website content. Status: ${response.status}`);
        }

        let text = await response.text();

        // Rewrite relative paths for CSS/JS to absolute paths to raw GitHub content
        const baseUrl = `https://raw.githubusercontent.com/${owner}/${repoName}/main/`;
        text = text.replace(/(href|src)="(?!https?:\/\/)([^"]+)"/g, `$1="${baseUrl}$2"`);

        setHtmlContent(text);
      } catch (err: any) {
        setError(err.message || "Failed to load website.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHtml();
  }, [owner, repoName]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <LoadingSpinner message={`Loading ${repoName}...`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-red-400">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={htmlContent || ''}
      title={`${owner}/${repoName}`}
      className="w-full h-screen border-0"
      sandbox="allow-scripts allow-same-origin"
    />
  );
};

export default PublicAppHost;
