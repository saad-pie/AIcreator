export interface AppFile {
  name: string;
  content: string;
}

export interface AppDetails {
  id: string;
  prompt: string;
  files: AppFile[];
  createdAt: string;
  githubRepoUrl?: string;
  publicUrl?: string;
}

export interface UserSettings {
  githubToken: string;
}

export interface GithubRepo {
  name: string;
  html_url: string;
  owner: {
    login: string;
  };
}
