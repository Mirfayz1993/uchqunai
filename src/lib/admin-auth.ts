import crypto from "crypto";

const SECRET = process.env.AUTH_SECRET || "fallback-secret";
const TOKEN_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Node.js crypto for API routes (server-side)
export function createAdminToken(): string {
  const timestamp = Date.now().toString();
  const hmac = crypto
    .createHmac("sha256", SECRET)
    .update(timestamp)
    .digest("hex");
  return `${timestamp}:${hmac}`;
}

export function verifyAdminToken(token: string): boolean {
  const parts = token.split(":");
  if (parts.length !== 2) return false;
  const [timestamp, hmac] = parts;
  if (!timestamp || !hmac) return false;

  const age = Date.now() - parseInt(timestamp);
  if (isNaN(age) || age > TOKEN_TTL || age < 0) return false;

  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(timestamp)
    .digest("hex");

  // Timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hmac, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}
