// artifacts/medical-app/api/chat.ts
//
// Vercel serverless function for /api/chat
// Tries Gemini first, falls back to Groq, then Grok (xAI) if a provider fails.
//
// REQUIRED Vercel Environment Variables (set in Vercel dashboard, not just .env):
//   GEMINI_API_KEY
//   GROQ_API_KEY
//   XAI_API_KEY
//   CLIENT_ORIGIN  (comma-separated list of allowed origins)

import type { VercelRequest, VercelResponse } from "@vercel/node";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

function setCors(req: VercelRequest, res: VercelResponse) {
  const allowed = (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const origin = req.headers.origin as string | undefined;
  if (origin && allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function callGemini(messages: ChatMessage[]): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY");

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const systemMsg = messages.find((m) => m.role === "system")?.content;

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        ...(systemMsg
          ? { systemInstruction: { parts: [{ text: systemMsg }] } }
          : {}),
      }),
    }
  );

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini error ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no text");
  return text;
}

async function callOpenAICompatible(
  url: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[]
): Promise<string> {
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`${url} error ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error(`${url} returned no text`);
  return text;
}

async function callGroq(messages: ChatMessage[]): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("Missing GROQ_API_KEY");
  return callOpenAICompatible(
    "https://api.groq.com/openai/v1/chat/completions",
    key,
    "llama-3.3-70b-versatile",
    messages
  );
}

async function callGrok(messages: ChatMessage[]): Promise<string> {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("Missing XAI_API_KEY");
  return callOpenAICompatible(
    "https://api.x.ai/v1/chat/completions",
    key,
    "grok-3",
    messages
  );
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

  try {
    const body = req.body || {};
    const messages: ChatMessage[] = body.messages;
    const requestedModel: string | undefined = body.model;
    const requestedBot: string | undefined = body.bot; // "docu" | "pulse" | "scrub"

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Request must include a non-empty 'messages' array." });
      return;
    }

    // Bot identity -> model mapping (server-side source of truth).
    // Docu-Bot = Gemini, Pulse-Bot = Grok, Scrub-Bot = Groq
    const BOT_MODEL_MAP: Record<string, string> = {
      docu: "gemini",
      pulse: "grok",
      scrub: "groq",
    };

    const resolvedModel = requestedModel || (requestedBot && BOT_MODEL_MAP[requestedBot]);

    if (!resolvedModel) {
      res.status(400).json({
        error:
          "Request must include either a 'bot' field ('docu' | 'pulse' | 'scrub') or a 'model' field ('gemini' | 'grok' | 'groq').",
      });
      return;
    }

    // Each bot/model is locked to its own provider — no cross-provider fallback,
    // since each bot has a distinct identity tied to a specific model.
    const providerMap: Record<string, { name: string; fn: (m: ChatMessage[]) => Promise<string> }> = {
      gemini: { name: "gemini", fn: callGemini },
      groq: { name: "groq", fn: callGroq },
      grok: { name: "grok", fn: callGrok },
    };

    const provider = providerMap[resolvedModel];
    if (!provider) {
      res.status(400).json({ error: `Unknown model '${resolvedModel}'.` });
      return;
    }

    const providers = [provider];

    const errors: string[] = [];

    for (const provider of providers) {
      try {
        const reply = await provider.fn(messages);
        res.status(200).json({ reply, model: provider.name });
        return;
      } catch (err: any) {
        errors.push(`${provider.name}: ${err.message}`);
        // try next provider
      }
    }

    // All providers failed
    res.status(502).json({
      error: "All AI providers failed to respond.",
      details: errors,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
}
