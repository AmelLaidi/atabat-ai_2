import { GoogleGenAI, Type } from "@google/genai";
import { NovelAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const analyzeNovel = async (text: string): Promise<NovelAnalysis> => {
  const model = "gemini-3.1-pro-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: `You are an expert in Arabic literature and digital humanities. 
    Analyze the provided text from an Arabic novel and extract its visual and narrative essence.
    
    Guidelines:
    1. Identify the central theme and its weight (0-100).
    2. Extract main characters with their psychological traits.
    3. Determine the dominant emotions and assign a representative hex color code to each.
    4. Atmosphere: Describe the overall mood of the writing.
    5. Symbol Engine: Convert abstract literary concepts found in the text into concrete symbolic imagery (e.g., loneliness -> empty desert path, rebellion -> rising flame).
    6. Narrative Structure: Identify the core conflict, the turning point (climax), and the resolution.
    
    Text snippet:
    ${text.substring(0, 15000)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "The title of the novel in Arabic" },
          author: { type: Type.STRING, description: "The author's name in Arabic" },
          summary: { type: Type.STRING, description: "A brief 2-3 sentence summary in Arabic" },
          themes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Theme name in Arabic" },
                weight: { type: Type.NUMBER, description: "Importance from 0-100" }
              }
            }
          },
          characters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Character name in Arabic" },
                description: { type: Type.STRING, description: "Role in the story in Arabic" },
                traits: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Adjectives in Arabic" }
              }
            }
          },
          emotions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sentiment: { type: Type.STRING, description: "Emotion name in Arabic" },
                score: { type: Type.NUMBER, description: "Intensity 0-1" },
                color: { type: Type.STRING, description: "Hex color code representing this emotion" }
              }
            }
          },
          atmosphere: { type: Type.STRING, description: "Description of the mood in Arabic" },
          symbols: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                concept: { type: Type.STRING, description: "Abstract concept (e.g., Freedom) in Arabic" },
                symbol: { type: Type.STRING, description: "Visual symbol (e.g., Broken Cage) in Arabic" },
                description: { type: Type.STRING, description: "Why this symbol represents the concept in Arabic" }
              }
            }
          },
          narrativeStructure: {
            type: Type.OBJECT,
            properties: {
              conflict: { type: Type.STRING, description: "Core conflict in Arabic" },
              climax: { type: Type.STRING, description: "Turning point in Arabic" },
              resolution: { type: Type.STRING, description: "Ending in Arabic" }
            }
          }
        },
        required: ["title", "author", "summary", "themes", "characters", "emotions", "symbols", "atmosphere", "narrativeStructure"]
      }
    }
  });

  const parsed = JSON.parse(response.text || "{}");
  return parsed;
};

export const generateCoverImage = async (analysis: NovelAnalysis): Promise<string> => {
  const prompt = `A modern Arabic literary book cover for a novel titled "${analysis.title}" by ${analysis.author}. 
  The atmosphere is ${analysis.atmosphere}. 
  Themes: ${analysis.themes.map(t => t.name).join(", ")}. 
  Visual style: Minimalist, symbolic, contemporary publishing design, inspired by Arabic calligraphy and abstract motifs. 
  Color palette: ${analysis.emotions.map(e => e.color).join(", ")}. 
  High quality, professional book design.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: "3:4",
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  return "";
};
