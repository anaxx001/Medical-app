import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import cors from "cors";
import rateLimit from "express-rate-limit";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Restrict CORS to known origins instead of allowing any site to call these APIs.
  // CLIENT_ORIGIN can be a comma-separated list (e.g. your prod domain + localhost for dev).
  const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim());
  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json());

  // Server-side client used only to verify the access token a logged-in user sends us.
  // The anon key is fine here — auth.getUser(token) just validates the JWT against Supabase Auth.
  const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string;
  const authClient =
    supabaseUrl && supabaseAnonKey ? createSupabaseClient(supabaseUrl, supabaseAnonKey) : null;

  // Require a logged-in Supabase user for any AI endpoint — these call paid, metered APIs.
  async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
      const authHeader = req.headers.authorization || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
      if (!token || !authClient) {
        return res.status(401).json({ error: "Authentication required." });
      }
      const { data, error } = await authClient.auth.getUser(token);
      if (error || !data?.user) {
        return res.status(401).json({ error: "Invalid or expired session." });
      }
      (req as any).userId = data.user.id;
      next();
    } catch (err) {
      res.status(401).json({ error: "Authentication failed." });
    }
  }

  // Cap how often any one signed-in user (or IP, if auth somehow isn't set yet) can hit
  // the AI endpoints, since each call costs real money against Gemini/xAI/Groq quota.
  const aiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => (req as any).userId || req.ip,
    message: { error: "Too many AI requests. Please wait a few minutes and try again." },
  });

  app.post("/api/suggest-reply", requireAuth, aiRateLimiter, async (req, res) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const { postTitle, postContent, currentComment } = req.body;

      const prompt = `You are a helpful AI assistant in a medical student community forum.
Your task is to suggest a supportive, highly constructive, and knowledgeable peer review or reply to a post.
The user might have started writing their reply, or it might be blank. Help them complete it or rewrite it gracefully.

Original Post Title: "${postTitle || ""}"
Original Post Content: "${postContent || ""}"
Current User Input: "${currentComment || ""}"

Please provide ONLY the suggested reply text, directly ready to be pasted. Do not add any conversational filler. Keep it concise, professional, and empathetic.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      res.json({ suggestion: response.text });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/chat", requireAuth, aiRateLimiter, async (req, res) => {
    try {
      const { message, model } = req.body;

      let systemPrompt = "";
      if (model === "docu") {
        systemPrompt = "You are Docu-Bot, an AI designed to break down complex medical publications & policy guidelines into simple 1st-year or 2nd-year clinical levels. Answer the user's query clearly and concisely.";
      } else if (model === "pulse") {
        systemPrompt = "You are Pulse-Bot, an AI that provides quick clinical case breakdowns. Focus on diagnostic pathways and differential mapping, keeping local African/Nigerian contexts in mind. Add a safety notice that this is for educational purposes.";
      } else if (model === "scrub") {
        systemPrompt = "You are Scrub-Bot, an AI for interactive revision prep and quick quizzes on medical exam topics. Generate study flashcards or active recall questions.";
      } else {
        systemPrompt = "You are a helpful medical assistant AI.";
      }

      let replyText = "";

      if (model === "docu" || !model) {
        // Gemini
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `${systemPrompt}\n\nUser Query: ${message}`;
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
        replyText = response.text || "";
      } else if (model === "pulse") {
        // xAI (Grok)
        const xaiKey = process.env.XAI_API_KEY;
        if (!xaiKey) throw new Error("XAI_API_KEY is missing. Please add it to AI Studio settings.");
        
        const response = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${xaiKey}`
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: message }
            ],
            model: "grok-2-latest"
          })
        });
        
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`xAI API error: ${errText}`);
        }
        const data = await response.json();
        replyText = data.choices?.[0]?.message?.content || "";
      } else if (model === "scrub") {
        // Groq
        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) throw new Error("GROQ_API_KEY is missing. Please add it to AI Studio settings.");
        
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: message }
            ],
            model: "llama-3.3-70b-versatile"
          })
        });
        
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Groq API error: ${errText}`);
        }
        const data = await response.json();
        replyText = data.choices?.[0]?.message?.content || "";
      }

      res.json({ reply: replyText });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
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
