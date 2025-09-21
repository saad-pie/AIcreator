import { GoogleGenAI, Type } from "@google/genai";
import { AppFile } from "../types.ts";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

// Fix: Initialize GoogleGenAI with a named apiKey parameter as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    files: {
      type: Type.ARRAY,
      description: "An array of files for the website, including index.html, style.css, and script.js.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "The filename, e.g., index.html, style.css, or script.js.",
          },
          content: {
            type: Type.STRING,
            description: "The complete code content for the file.",
          },
        },
        required: ["name", "content"],
      },
    },
  },
  required: ["files"],
};


export async function generateWebsite(prompt: string): Promise<AppFile[]> {
  try {
    const fullPrompt = `
      Based on the user's prompt, create a complete, single-page website.
      The website should be visually appealing, responsive, and functional.
      Generate the necessary HTML, CSS, and JavaScript files.
      - index.html: Should be a complete HTML5 document with a <head> and <body>. Link to style.css and script.js using relative paths if they are generated.
      - style.css: Should contain all the CSS for styling the page. Use modern CSS practices like flexbox or grid.
      - script.js: Should contain any JavaScript for interactivity. It can be empty if not needed.

      User Prompt: "${prompt}"

      Return the result as a JSON object with a 'files' property, which is an array of file objects. Each file object must have 'name' and 'content' properties.
    `;

    // Fix: Use ai.models.generateContent and provide the model name with each call.
    const response = await ai.models.generateContent({
      // Fix: Use the 'gemini-2.5-flash' model for general text tasks.
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      },
    });

    // Fix: Access the generated text directly via the .text property.
    const jsonText = response.text.trim();
    const parsedResult = JSON.parse(jsonText);

    if (parsedResult.files && Array.isArray(parsedResult.files)) {
       if (!parsedResult.files.some((file: AppFile) => file.name === 'index.html')) {
         throw new Error("Generated code does not contain index.html.");
       }
       return parsedResult.files;
    } else {
        console.error("Invalid JSON structure from Gemini API:", parsedResult);
        throw new Error("Failed to generate website: Invalid response structure.");
    }

  } catch (error) {
    console.error("Error generating website with Gemini:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate website: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the website.");
  }
}
