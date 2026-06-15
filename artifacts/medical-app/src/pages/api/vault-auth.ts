import type { NextApiRequest, NextApiResponse } from "next";

/**
 * POST /api/vault-auth
 *
 * Validates the master vault password server-side against
 * the SUPER_ADMIN_MASTER_PASSWORD environment variable.
 *
 * Never exposes the password to the client — the React layer
 * only receives a success/failure boolean.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed." });
  }

  const { password } = req.body as { password?: string };

  if (!password || typeof password !== "string") {
    return res.status(400).json({ success: false, message: "Password is required." });
  }

  const masterPassword = process.env.SUPER_ADMIN_MASTER_PASSWORD;

  if (!masterPassword) {
    // Misconfigured server — fail safe
    console.error("[vault-auth] SUPER_ADMIN_MASTER_PASSWORD is not set.");
    return res
      .status(500)
      .json({ success: false, message: "Vault is not configured. Contact the system administrator." });
  }

  // Constant-time comparison to prevent timing attacks
  const inputBuffer = Buffer.from(password);
  const masterBuffer = Buffer.from(masterPassword);

  const lengthMatch = inputBuffer.length === masterBuffer.length;
  // Run the XOR even if lengths differ so timing stays consistent
  const paddedInput = Buffer.alloc(masterBuffer.length, 0);
  inputBuffer.copy(paddedInput);
  let diff = 0;
  for (let i = 0; i < masterBuffer.length; i++) {
    diff |= paddedInput[i] ^ masterBuffer[i];
  }

  if (!lengthMatch || diff !== 0) {
    return res.status(401).json({ success: false, message: "Incorrect password." });
  }

  return res.status(200).json({ success: true });
}
