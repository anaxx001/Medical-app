import { Router } from "express";
import { db, pool, pushTokensTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { verifyAuth } from "../lib/auth";

const router = Router();

router.post("/push/register", verifyAuth, async (req, res) => {
  const { userId, token, platform } = req.body as {
    userId?: string;
    token?: string;
    platform?: string;
  };

  if (!userId || !token || !platform) {
    return res.status(400).json({ error: "userId, token, and platform are required" });
  }

  if ((req as any).authUserId !== userId) {
    return res.status(403).json({ error: "userId does not match authenticated user" });
  }

  try {
    await db
      .insert(pushTokensTable)
      .values({ userId, token, platform })
      .onConflictDoUpdate({
        target: pushTokensTable.token,
        set: { userId, platform },
      });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to register token" });
  }
});

router.post("/push/notify/reply", verifyAuth, async (req, res) => {
  const { commentId, postId, commenterName, postTitle } = req.body as {
    commentId?: string;
    postId?: string;
    commenterName?: string;
    postTitle?: string;
  };

  if (!commentId || !postId) {
    return res.status(400).json({ error: "commentId and postId are required" });
  }

  const callerId: string = (req as any).authUserId;

  const { rows: commentRows } = await pool.query<{ found: number }>(
    "SELECT 1 FROM comments WHERE id = $1 AND author_id = $2 AND post_id = $3 LIMIT 1",
    [commentId, callerId, postId]
  );
  if (commentRows.length === 0) {
    return res.status(403).json({ error: "Comment not found or not authored by caller" });
  }

  const { rows: postRows } = await pool.query<{ author_id: string }>(
    "SELECT author_id FROM posts WHERE id = $1 LIMIT 1",
    [postId]
  );
  if (postRows.length === 0) {
    return res.status(404).json({ error: "Post not found" });
  }

  const postAuthorId = postRows[0].author_id;

  if (postAuthorId === callerId) {
    return res.json({ sent: 0 });
  }

  try {
    const tokens = await db
      .select()
      .from(pushTokensTable)
      .where(eq(pushTokensTable.userId, postAuthorId));

    if (tokens.length === 0) return res.json({ sent: 0 });

    const messages = tokens.map((t) => ({
      to: t.token,
      title: "New Reply",
      body: `${commenterName ?? "Someone"} replied to "${postTitle ?? "your post"}"`,
      data: { url: `/post/${postId}` },
      sound: "default",
    }));

    await sendExpoPushNotifications(messages);
    return res.json({ sent: messages.length });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to send notifications" });
  }
});

router.post("/push/notify/announcement", verifyAuth, async (req, res) => {
  const {
    communitySlug,
    communityName,
    communityId,
    postId,
    postTitle,
    posterUserId,
  } = req.body as {
    communitySlug?: string;
    communityName?: string;
    communityId?: string;
    postId?: string;
    postTitle?: string;
    posterUserId?: string;
  };

  if (!postId || !communityId) {
    return res.status(400).json({ error: "postId and communityId are required" });
  }

  const callerId: string = (req as any).authUserId;

  if (posterUserId && posterUserId !== callerId) {
    return res.status(403).json({ error: "posterUserId does not match authenticated user" });
  }

  const { rows: postRows } = await pool.query<{ found: number }>(
    "SELECT 1 FROM posts WHERE id = $1 AND author_id = $2 AND is_announcement = true LIMIT 1",
    [postId, callerId]
  );
  if (postRows.length === 0) {
    return res.status(403).json({
      error: "Caller is not the author of this announcement post",
    });
  }

  try {
    const { rows: memberRows } = await pool.query<{ author_id: string }>(
      `SELECT DISTINCT author_id FROM posts WHERE community_id = $1
       UNION
       SELECT DISTINCT c.author_id
       FROM comments c
       JOIN posts p ON c.post_id = p.id
       WHERE p.community_id = $1`,
      [communityId]
    );

    const memberIds = memberRows
      .map((r) => r.author_id)
      .filter((id) => id !== callerId);

    if (memberIds.length === 0) return res.json({ sent: 0 });

    const tokens = await db
      .select()
      .from(pushTokensTable)
      .where(inArray(pushTokensTable.userId, memberIds));

    if (tokens.length === 0) return res.json({ sent: 0 });

    const messages = tokens.map((t) => ({
      to: t.token,
      title: `📢 ${communityName ?? "Community"} Announcement`,
      body: postTitle ?? "New announcement posted",
      data: {
        url: communitySlug ? `/c/${communitySlug}` : `/post/${postId}`,
      },
      sound: "default",
    }));

    await sendExpoPushNotifications(messages);
    return res.json({ sent: messages.length });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to send notifications" });
  }
});

async function sendExpoPushNotifications(messages: object[]): Promise<void> {
  const chunks = chunkArray(messages, 100);
  for (const chunk of chunks) {
    try {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
        },
        body: JSON.stringify(chunk),
      });
    } catch (err) {
      console.error("Expo push send error:", err);
    }
  }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export default router;
