import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyAuth } from "../lib/auth";

const router = Router();

router.post("/chat", verifyAuth, async (req, res) => {
  const { messages } = req.body as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  };

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "AI service not configured" });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: `You are MedAI, an expert AI assistant for Nigerian medical and health science students. 
You help students studying Medicine, Radiography, Nursing, Anatomy, Pharmacology, Physiotherapy, Dentistry and related disciplines.
You provide clear, accurate, educational medical content. 
Format your responses with markdown: use **bold** for key terms, numbered lists for steps, bullet points for concepts, and ### headers for sections.
Always recommend verifying information with textbooks and qualified lecturers.
Be friendly, encouraging, and culturally aware of the Nigerian medical education context.`,
    });

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    const text = result.response.text();

    return res.json({ content: text });
  } catch (err: any) {
    console.error("Gemini error:", err);
    return res.status(500).json({ error: "AI request failed" });
  }
});

export default router;
