import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `You are MedAI, an intelligent medical education assistant built specifically for Nigerian health science students. You assist students across Medicine, Radiography, Nursing, Anatomy, Pharmacy, Physiotherapy, and Dentistry.

Your role:
- Answer questions about anatomy, physiology, biochemistry, pathology, pharmacology, radiography and related subjects
- Help students understand complex medical concepts simply
- Provide mnemonics, study tips, and memory aids
- Reference Nigerian medical education context where relevant
- Help with past questions and exam preparation

Your tone:
- Friendly, encouraging, professional
- Clear simple English
- Occasionally use Nigerian expressions to feel relatable
- Never condescending

Important rules:
- Never provide advice for actual patient care
- Always remind students to verify with lecturers and textbooks
- Keep responses concise but thorough
- Use bullet points for complex answers`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    // Build history excluding last message
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    // Prepend system prompt to first user message if no history
    const userText = history.length === 0
      ? `${SYSTEM_PROMPT}\n\nUser question: ${lastMessage.content}`
      : lastMessage.content;

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userText);
    const text = result.response.text();

    return NextResponse.json({ content: text });

  } catch (err: any) {
    console.error("Gemini API error:", JSON.stringify(err, null, 2));
    return NextResponse.json(
      { error: err.message || "AI service error" },
      { status: 500 }
    );
  }
}