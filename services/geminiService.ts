
import { GoogleGenAI, Type } from "@google/genai";
import type { AppPlan, ChatMessage } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const planSchema = {
  type: Type.OBJECT,
  properties: {
    detailedDescription: {
      type: Type.STRING,
      description: "A detailed, engaging description of the website, expanded from the user's initial idea. This should be a few sentences long.",
    },
    colorPalette: {
      type: Type.OBJECT,
      properties: {
        primary: { type: Type.STRING, description: "A hex color code for the primary site color (e.g., for backgrounds)." },
        secondary: { type: Type.STRING, description: "A hex color code for the secondary site color (e.g., for cards/containers)." },
        accent: { type: Type.STRING, description: "A hex color code for the accent color (e.g., for buttons, links)." },
        neutral: { type: Type.STRING, description: "A hex color code for text and neutral elements." },
      },
    },
    features: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "A list of 3-5 key features the website should have.",
    },
  },
};


export const createAppPlan = async (appName: string, appDescription: string): Promise<AppPlan> => {
  try {
    const prompt = `
      You are a Product Manager and UI/UX Designer. A user wants to create a website with the following details:
      App Name: "${appName}"
      App Description: "${appDescription}"

      Your task is to generate a structured plan for this website. Create a detailed description that fleshes out the user's idea, design a modern and aesthetically pleasing color palette, and list the key features.
      Provide the output in a structured JSON format.
    `;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: planSchema,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error creating app plan:", error);
    throw new Error("Failed to generate an app plan from the description.");
  }
};

export const generateAppHtml = async (plan: AppPlan, appName: string): Promise<string> => {
  const prompt = `
    You are a senior frontend developer specializing in Tailwind CSS.
    Generate a complete, single HTML file for a landing page for an app called "${appName}".
    The app is described as: "${plan.detailedDescription}".
    It should have the following features: ${plan.features.join(", ")}.
    
    You MUST use the following color palette:
    - Primary: ${plan.colorPalette.primary}
    - Secondary: ${plan.colorPalette.secondary}
    - Accent: ${plan.colorPalette.accent}
    - Text/Neutral: ${plan.colorPalette.neutral}

    Instructions:
    1.  Use Tailwind CSS for all styling. Do NOT use any inline style attributes or <style> tags.
    2.  The HTML should be modern, visually appealing, and responsive.
    3.  Include a hero section, a features section, and a simple footer.
    4.  Create placeholder content that looks realistic.
    5.  The final output should be ONLY the raw HTML code, starting with <!DOCTYPE html> and ending with </html>. Do not include any markdown formatting like \`\`\`html.
  `;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating app HTML:", error);
    throw new Error("Failed to generate the website's HTML.");
  }
};

export const chatForImprovements = async (plan: AppPlan, currentHtml: string, chatHistory: ChatMessage[]): Promise<string> => {
  const historyText = chatHistory.map(msg => `${msg.sender}: ${msg.text}`).join('\n');

  const prompt = `
    You are an AI assistant helping a user improve their website.
    
    Original App Plan:
    - Description: ${plan.detailedDescription}
    - Features: ${plan.features.join(", ")}
    - Colors: Primary-${plan.colorPalette.primary}, Secondary-${plan.colorPalette.secondary}, Accent-${plan.colorPalette.accent}

    Chat History:
    ${historyText}

    The last message from the user is a request for an improvement. Based on the entire context (plan, history), provide a helpful response.
    
    If the user is asking for a visual change that can be implemented with HTML/Tailwind, generate the FULL, NEW HTML code for the website that incorporates the change. 
    If you generate HTML, ONLY output the raw HTML code and nothing else.
    
    If the user is asking a question or for an idea, provide a concise text-based answer.
  `;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error in chat for improvements:", error);
    throw new Error("Failed to get a response from the AI assistant.");
  }
};
