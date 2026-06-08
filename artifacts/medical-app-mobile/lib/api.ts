const domain = process.env.EXPO_PUBLIC_DOMAIN;

export async function sendChatMessage(
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const url = domain
    ? `https://${domain}/api/chat`
    : "http://localhost:8080/api/chat";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    throw new Error(`Chat API error: ${res.status}`);
  }

  const data = await res.json();
  return data.message || data.content || "";
}
