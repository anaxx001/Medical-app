const domain = process.env.EXPO_PUBLIC_DOMAIN;

function apiUrl(path: string): string {
  return domain ? `https://${domain}/api${path}` : `http://localhost:8080/api${path}`;
}

function authHeaders(authToken?: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
}

export async function sendChatMessage(
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const res = await fetch(apiUrl("/chat"), {
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

export async function registerPushToken({
  userId,
  token,
  platform,
  authToken,
}: {
  userId: string;
  token: string;
  platform: string;
  authToken: string;
}): Promise<void> {
  const res = await fetch(apiUrl("/push/register"), {
    method: "POST",
    headers: authHeaders(authToken),
    body: JSON.stringify({ userId, token, platform }),
  });

  if (!res.ok) {
    throw new Error(`Push register API error: ${res.status}`);
  }
}

export async function notifyReply({
  commentId,
  commenterName,
  postTitle,
  postId,
  authToken,
}: {
  commentId: string;
  commenterName?: string;
  postTitle?: string;
  postId: string;
  authToken: string;
}): Promise<void> {
  await fetch(apiUrl("/push/notify/reply"), {
    method: "POST",
    headers: authHeaders(authToken),
    body: JSON.stringify({ commentId, commenterName, postTitle, postId }),
  }).catch((err) => console.warn("Reply notify failed:", err));
}

export async function notifyAnnouncement({
  communitySlug,
  communityName,
  communityId,
  postId,
  postTitle,
  posterUserId,
  authToken,
}: {
  communitySlug?: string;
  communityName?: string;
  communityId: string;
  postId: string;
  postTitle?: string;
  posterUserId?: string;
  authToken: string;
}): Promise<void> {
  await fetch(apiUrl("/push/notify/announcement"), {
    method: "POST",
    headers: authHeaders(authToken),
    body: JSON.stringify({
      communitySlug,
      communityName,
      communityId,
      postId,
      postTitle,
      posterUserId,
    }),
  }).catch((err) => console.warn("Announcement notify failed:", err));
}
