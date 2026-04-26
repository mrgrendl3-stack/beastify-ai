import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/generate-image-openai", async (req, res) => {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(401).json({ error: "OPENAI_API_KEY not set" });
      }

      const { prompt, n = 1, response_format = "b64_json", quality = "standard", size = "1024x1024" } = req.body;

      const openai = new OpenAI({ apiKey });
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1, // DALL-E 3 only supports n=1 currently
        quality,
        response_format,
        size,
      });

      res.json({ data: response.data });
    } catch (error: any) {
      console.error(error);
      const msg = error.message || "Failed to generate image with OpenAI";
      const isBillingError = msg.toLowerCase().includes("billing");
      if (isBillingError) {
         return res.status(402).json({ error: "OpenAI Billing Error: " + msg + ". Please check your OpenAI account balance." });
      }
      res.status(500).json({ error: msg });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
