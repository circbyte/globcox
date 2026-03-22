import { GoogleGenAI } from "@google/genai";
import fs from "fs";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found");
    return;
  }
  const ai = new GoogleGenAI({ apiKey });
  
  console.log("Generating Icon...");
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

  const iconData = iconResponse.candidates?.[0]?.content?.parts.find(p => p.inlineData)?.inlineData?.data;
  if (iconData) {
    if (!fs.existsSync('public')) fs.mkdirSync('public');
    fs.writeFileSync("public/icon-512.png", iconData, { encoding: 'base64' });
    fs.writeFileSync("public/icon-192.png", iconData, { encoding: 'base64' });
    console.log("Icons saved.");
  }

  console.log("Generating OG Image...");
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

  const ogData = ogResponse.candidates?.[0]?.content?.parts.find(p => p.inlineData)?.inlineData?.data;
  if (ogData) {
    fs.writeFileSync("public/og-image.png", ogData, { encoding: 'base64' });
    console.log("OG Image saved.");
  }
}

main().catch(console.error);
