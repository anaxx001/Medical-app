import type { Request, Response, NextFunction } from "express";

export async function verifyAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authorization required" });
    return;
  }

  const token = authHeader.slice(7);
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anonKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  try {
    const resp = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(anonKey ? { apikey: anonKey } : {}),
      },
    });

    if (!resp.ok) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    const userData = (await resp.json()) as { id: string };
    (req as any).authUserId = userData.id;
    next();
  } catch {
    res.status(401).json({ error: "Token verification failed" });
  }
}
