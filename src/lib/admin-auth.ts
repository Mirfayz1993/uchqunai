import crypto from "crypto";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";

// ─── Auth Helper (for API routes) ─────────────────────────────────────────

export type AdminAuthResult =
  | { type: "admin" }
  | { type: "bot-admin"; botSlug: string }
  | null;

export function getAdminAuth(req: NextRequest): AdminAuthResult {
  const adminToken = req.cookies.get("admin-token")?.value;
  if (adminToken && verifyAdminToken(adminToken)) {
    return { type: "admin" };
  }
  const botAdminToken = req.cookies.get("bot-admin-token")?.value;
  if (botAdminToken) {
    const result = verifyBotAdminToken(botAdminToken);
    if (result.valid && result.botSlug) {
      return { type: "bot-admin", botSlug: result.botSlug };
    }
  }
  return null;
}

const SECRET = process.env.AUTH_SECRET || "fallback-secret";
const TOKEN_TTL = 24 * 60 * 60 * 1000; // 24 hours

// ─── Main Admin Token ──────────────────────────────────────────────────────

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

  try {
    return crypto.timingSafeEqual(
      Buffer.from(hmac, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

// ─── Bot Admin Token ───────────────────────────────────────────────────────
// Format: {botSlug}:{timestamp}:{hmac}
// HMAC covers: {botSlug}:{timestamp}

export function createBotAdminToken(botSlug: string): string {
  const timestamp = Date.now().toString();
  const payload = `${botSlug}:${timestamp}`;
  const hmac = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");
  return `${botSlug}:${timestamp}:${hmac}`;
}

export function verifyBotAdminToken(token: string): { valid: boolean; botSlug?: string } {
  const parts = token.split(":");
  if (parts.length < 3) return { valid: false };

  // botSlug may contain "-" so rejoin all parts except last two
  const hmac = parts[parts.length - 1];
  const timestamp = parts[parts.length - 2];
  const botSlug = parts.slice(0, parts.length - 2).join(":");

  if (!botSlug || !timestamp || !hmac) return { valid: false };

  const age = Date.now() - parseInt(timestamp);
  if (isNaN(age) || age > TOKEN_TTL || age < 0) return { valid: false };

  const payload = `${botSlug}:${timestamp}`;
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");

  try {
    const valid = crypto.timingSafeEqual(
      Buffer.from(hmac, "hex"),
      Buffer.from(expected, "hex")
    );
    return valid ? { valid: true, botSlug } : { valid: false };
  } catch {
    return { valid: false };
  }
}

// ─── Password Hashing ─────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}
