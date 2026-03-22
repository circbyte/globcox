import { GoogleGenAI } from "@google/genai";

async function generatePWAImages() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  // Generate Icon
  const iconResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: 'A professional, modern, minimalist logo for a marketplace app named "globcox". The logo should feature a stylized "G" or an abstract symbol representing connection and trade. Use a deep indigo and vibrant violet color palette. White background, high resolution, vector style.',
        },
      ],
    },
  });

  // Generate OG Image
  const ogResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: 'A professional marketing banner for "globcox", Malawi\'s premier marketplace. Show a clean, modern interface with agricultural products (maize, livestock) and digital icons (eBooks) floating in a sophisticated indigo and violet environment. High quality, 16:9 aspect ratio.',
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      }
    }
  });

  return {
    icon: iconResponse.candidates?.[0]?.content?.parts.find(p => p.inlineData)?.inlineData?.data,
    og: ogResponse.candidates?.[0]?.content?.parts.find(p => p.inlineData)?.inlineData?.data
  };
}
