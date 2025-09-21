import { AppFile, GithubRepo } from "../types.ts";

const GITHUB_API_URL = "https://api.github.com";

export async function createGithubRepo(repoName: string, token: string): Promise<GithubRepo> {
  const response = await fetch(`${GITHUB_API_URL}/user/repos`, {
    method: "POST",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify({
      name: repoName,
      description: "AI-generated website",
      private: false,
      auto_init: false, // Create an empty repo
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`GitHub repo creation failed: ${error.message}`);
  }

  return response.json();
}

export async function uploadFilesToRepo(
  owner: string,
  repoName: string,
  files: AppFile[],
  token: string
): Promise<void> {
  for (const file of files) {
    // Correctly encode file content to Base64 for the GitHub API
    const content = btoa(unescape(encodeURIComponent(file.content)));
    const url = `${GITHUB_API_URL}/repos/${owner}/${repoName}/contents/${file.name}`;
    
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        message: `feat: add ${file.name}`,
        content: content,
        branch: 'main'
      }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    }
  }
}
