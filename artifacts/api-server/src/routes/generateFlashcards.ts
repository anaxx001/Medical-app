import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyAuth } from "../lib/auth";

const router = Router();

router.post("/generate-flashcards", verifyAuth, async (req, res) => {
  const { topic } = req.body as { topic?: string };

  if (!topic || typeof topic !== "string" || topic.trim().length < 3) {
    return res.status(400).json({ error: "A topic of at least 3 characters is required." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "AI service not configured" });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are MedAI, an expert medical educator for Nigerian MBBS and health science students.
Generate exactly 6 flashcards on this medical topic: "${topic.trim()}".

Rules:
- Each card must be clinically accurate and exam-relevant for Nigerian medical students.
- "front" should be a concise question, key term, or concept (max 20 words).
- "back" should be a clear, detailed explanation including mnemonics, mechanisms, or clinical relevance where useful (max 80 words).
- Return ONLY a raw JSON array — no markdown, no code fences, no explanation outside the JSON.

Format (return EXACTLY this structure):
[
  {"front": "...", "back": "..."},
  {"front": "...", "back": "..."}
]`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    // Strip markdown code fences if present
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let cards: { front: string; back: string }[];
    try {
      cards = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({ error: "AI returned malformed data. Please try again." });
    }

    if (!Array.isArray(cards) || cards.length === 0) {
      return res.status(500).json({ error: "AI returned no cards. Please try a different topic." });
    }

    const valid = cards.filter(
      (c) => typeof c.front === "string" && typeof c.back === "string" && c.front.trim() && c.back.trim()
    );

    if (valid.length === 0) {
      return res.status(500).json({ error: "AI returned invalid card format. Please try again." });
    }

    return res.json({ cards: valid, topic: topic.trim() });
  } catch (err: any) {
    console.error("Flashcard generation error:", err);
    return res.status(500).json({ error: "Flashcard generation failed" });
  }
});

export default router;
