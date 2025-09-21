
import { AppFile, GithubRepo } from "../types.ts";

const GITHUB_API_URL = "https://api.github.com";

/**
 * A robust function to encode a UTF-8 string to Base64, avoiding deprecated 'unescape'.
 * This is necessary because btoa() on its own does not support Unicode characters.
 * @param str The Unicode string to encode.
 * @returns The Base64-encoded string.
 */
function encodeUnicodeToBase64(str: string): string {
    return btoa(
        encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) =>
            String.fromCharCode(parseInt(p1, 16))
        )
    );
}

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
    const content = encodeUnicodeToBase64(file.content);
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

export async function enableGithubPages(
  owner: string,
  repoName: string,
  token: string
): Promise<{ html_url: string }> {
  const url = `${GITHUB_API_URL}/repos/${owner}/${repoName}/pages`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify({
      source: {
        branch: "main",
        path: "/",
      },
    }),
  });

  if (response.status !== 201) { // 201 Created is the expected success status
    const error = await response.json();
    throw new Error(`Failed to enable GitHub Pages: ${error.message || response.statusText}`);
  }

  return response.json();
}