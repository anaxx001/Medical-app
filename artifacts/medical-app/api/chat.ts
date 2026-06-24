// artifacts/medical-app/api/chat.ts
//
// Serverless (Vercel) version of the /api/chat route from server.ts.
// Same auth check, same bot system prompts, same provider routing:
//   docu  -> Gemini
//   pulse -> Grok (xAI)
//   scrub -> Groq
//
// NOTE: the in-memory rate limiting from server.ts (express-rate-limit) does not
// carry over to serverless functions, since each request may run on a fresh
// instance with no shared memory. Auth is preserved below; rate limiting would
// need an external store (e.g. Upstash Redis) to work correctly here — flagging
// this as a follow-up rather than blocking this fix.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function setCors(req: VercelRequest, res: VercelResponse) {
  const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim());
  const origin = req.headers.origin as string | undefined;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

async function getUserIdFromAuthHeader(req: VercelRequest): Promise<string | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const authHeader = (req.headers.authorization as string) || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const authClient = createSupabaseClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  const userId = await getUserIdFromAuthHeader(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  try {
    const { message, model } = req.body || {};

    if (!message) {
      res.status(400).json({ error: "Request must include 'message'." });
      return;
    }

    let systemPrompt = "";
    if (model === "docu") {
      systemPrompt =
        "You are Docu-Bot, an AI designed to break down complex medical publications & policy guidelines into simple 1st-year or 2nd-year clinical levels. Answer the user's query clearly and concisely.";
    } else if (model === "pulse") {
      systemPrompt =
        "You are Pulse-Bot, an AI that provides quick clinical case breakdowns. Focus on diagnostic pathways and differential mapping, keeping local African/Nigerian contexts in mind. Add a safety notice that this is for educational purposes.";
    } else if (model === "scrub") {
      systemPrompt =
        "You are Scrub-Bot, an AI for interactive revision prep and quick quizzes on medical exam topics. Generate study flashcards or active recall questions.";
    } else {
      systemPrompt = "You are a helpful medical assistant AI.";
    }

    let replyText = "";

    if (model === "docu" || !model) {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `${systemPrompt}\n\nUser Query: ${message}`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      replyText = response.text || "";
    } else if (model === "pulse") {
      const xaiKey = process.env.XAI_API_KEY;
      if (!xaiKey) throw new Error("XAI_API_KEY is missing.");

      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${xaiKey}`,
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
          model: "grok-2-latest",
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`xAI API error: ${errText}`);
      }
      const data = await response.json();
      replyText = data.choices?.[0]?.message?.content || "";
    } else if (model === "scrub") {
      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey) throw new Error("GROQ_API_KEY is missing.");

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
          model: "llama-3.3-70b-versatile",
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API error: ${errText}`);
      }
      const data = await response.json();
      replyText = data.choices?.[0]?.message?.content || "";
    }

    res.status(200).json({ reply: replyText });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
