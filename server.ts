import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests (up to 20MB for image data base64)
  app.use(express.json({ limit: '20mb' }));

  // Helper to lazily get Gemini Client
  function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Admin AI: Auto identify creature metadata from image or prompt description
  app.post('/api/gemini/identify', async (req, res) => {
    try {
      const { imageBase64, mimeType, descriptionPrompt } = req.body;

      if (!imageBase64 && !descriptionPrompt) {
        return res.status(400).json({ error: 'Please provide either an image or a description prompt.' });
      }

      const ai = getGeminiClient();

      const parts: any[] = [];
      
      if (imageBase64) {
        parts.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
          },
        });
      }

      const promptText = `Analyze this underwater photo or description and extract structured biological & photography metadata.
Context / Input Prompt: "${descriptionPrompt || 'Identify the underwater creature in this photo.'}"

Return JSON matching the schema strictly.`;

      parts.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: { parts },
        config: {
          systemInstruction: 'You are an expert Marine Biologist and Underwater Photographer. Identify underwater sea creatures with scientific precision and suggest appropriate camera/depth/conservation details.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Common name of the creature (e.g. Green Sea Turtle)' },
              scientificName: { type: Type.STRING, description: 'Binomial scientific name (e.g. Chelonia mydas)' },
              category: { 
                type: Type.STRING, 
                description: 'Must be one of: Coral Reef, Deep Sea, Macro, Pelagic & Predators, Nudibranchs & Mollusks, Crustaceans' 
              },
              depthRange: { type: Type.STRING, description: 'Estimated depth range in meters (e.g. "5 - 25 meters")' },
              location: { type: Type.STRING, description: 'Typical location or dive site (e.g. "Great Barrier Reef, Australia")' },
              conservationStatus: { 
                type: Type.STRING, 
                description: 'Must be one of: Least Concern, Near Threatened, Vulnerable, Endangered, Critically Endangered, Data Deficient' 
              },
              description: { type: Type.STRING, description: 'Brief interesting biological summary' },
              habitat: { type: Type.STRING, description: 'Natural underwater habitat' },
              diet: { type: Type.STRING, description: 'Primary diet' },
              behaviorNotes: { type: Type.STRING, description: 'Key behavioral notes or defense mechanisms' },
              cameraEquipment: {
                type: Type.OBJECT,
                properties: {
                  camera: { type: Type.STRING },
                  lens: { type: Type.STRING },
                  lighting: { type: Type.STRING },
                  aperture: { type: Type.STRING },
                  shutterSpeed: { type: Type.STRING },
                  iso: { type: Type.STRING },
                },
              },
              suggestedTags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3-5 descriptive tags for search'
              }
            },
            required: ['title', 'scientificName', 'category', 'depthRange', 'location', 'conservationStatus', 'description', 'habitat', 'diet'],
          },
        },
      });

      const text = response.text || '{}';
      const resultData = JSON.parse(text);
      res.json({ success: true, data: resultData });
    } catch (err: any) {
      console.error('Error in /api/gemini/identify:', err);
      res.status(500).json({ error: err.message || 'Failed to identify creature metadata with AI' });
    }
  });

  // Visitor AI: Ask Marine Biologist questions about a specific creature
  app.post('/api/gemini/ask-biologist', async (req, res) => {
    try {
      const { creature, userQuestion } = req.body;

      if (!creature || !userQuestion) {
        return res.status(400).json({ error: 'Missing creature data or user question.' });
      }

      const ai = getGeminiClient();

      const systemInstruction = `You are "Dr. Nautilus", an enthusiastic, expert Marine Biologist & Underwater Explorer. 
You are answering a visitor's question about the following underwater creature:
- Common Name: ${creature.title}
- Scientific Name: ${creature.scientificName}
- Category: ${creature.category}
- Depth Range: ${creature.depthRange}
- Location: ${creature.location}
- Conservation Status: ${creature.conservationStatus}
- Description: ${creature.description}
- Habitat: ${creature.habitat}
- Diet: ${creature.diet}

Give a clear, engaging, educational, and friendly response (2-4 paragraphs). Highlight fascinating facts, ecological importance, or dive tips if applicable.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: userQuestion,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ success: true, answer: response.text });
    } catch (err: any) {
      console.error('Error in /api/gemini/ask-biologist:', err);
      res.status(500).json({ error: err.message || 'Failed to query Marine Biologist AI' });
    }
  });

  // Vite development vs production static handling
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Subsea Gallery Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
