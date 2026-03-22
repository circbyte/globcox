import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

async function generateImages() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not found in environment. Skipping image generation.");
    return;
  }

  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  const iconPath = path.join(publicDir, "icon-512.png");
  const ogPath = path.join(publicDir, "og-image.png");

  if (fs.existsSync(iconPath) && fs.existsSync(ogPath)) {
    console.log("Images already exist. Skipping generation.");
    return;
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    console.log("Generating PWA Icon...");
    const iconResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            text: 'A professional, modern, minimalist logo for a marketplace app named "globcox". The logo should feature a stylized "G" or an abstract symbol representing connection and trade. Use a deep indigo and vibrant violet color palette. White background, high resolution, vector style.',
          },
        ],
      },
    });

    const iconData = iconResponse.candidates?.[0]?.content?.parts.find((p) => p.inlineData)?.inlineData?.data;
    if (iconData) {
      fs.writeFileSync(iconPath, iconData, { encoding: "base64" });
      fs.writeFileSync(path.join(publicDir, "icon-192.png"), iconData, { encoding: "base64" });
      console.log("Icons saved.");
    }

    console.log("Generating OG Image...");
    const ogResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            text: 'A professional marketing banner for "globcox", Malawi\'s premier marketplace. Show a clean, modern interface with agricultural products (maize, livestock) and digital icons (eBooks) floating in a sophisticated indigo and violet environment. High quality, 16:9 aspect ratio.',
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    const ogData = ogResponse.candidates?.[0]?.content?.parts.find((p) => p.inlineData)?.inlineData?.data;
    if (ogData) {
      fs.writeFileSync(ogPath, ogData, { encoding: "base64" });
      console.log("OG Image saved.");
    }
  } catch (error) {
    console.error("Error generating images:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Generate images on startup
  await generateImages();

  // API routes go here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
