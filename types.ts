export interface AppPlan {
  detailedDescription: string;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
  };
  features: string[];
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface GeneratedApp {
  id: string;
  name: string;
  slug: string;
  plan: AppPlan;
  html: string;
  views: number;
  chatHistory: ChatMessage[];
  createdAt: string;
}
