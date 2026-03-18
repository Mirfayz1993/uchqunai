import { NextRequest, NextResponse } from "next/server";
import { createAdminToken, createBotAdminToken, verifyPassword, hashPassword } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // CSRF protection
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host && !origin.includes(host)) {
      return NextResponse.json({ error: "CSRF xatosi" }, { status: 403 });
    }

    const { username, password } = await req.json();

    if (!username || typeof username !== "string" || username.length > 64) {
      return NextResponse.json({ error: "Login noto'g'ri" }, { status: 401 });
    }
    if (!password || typeof password !== "string" || password.length > 128) {
      return NextResponse.json({ error: "Parol noto'g'ri" }, { status: 401 });
    }

    // ── Main admin login ──────────────────────────────────────────────────
    if (username === "admin") {
      // Check DB password hash first, fallback to env var
      const setting = await prisma.siteSetting.findUnique({ where: { key: "admin_password_hash" } }).catch(() => null);

      let valid = false;
      if (setting) {
        valid = verifyPassword(password, setting.value);
      } else {
        valid = password === process.env.ADMIN_PASSWORD;
      }

      if (!valid) {
        return NextResponse.json({ error: "Login yoki parol noto'g'ri" }, { status: 401 });
      }

      const token = createAdminToken();
      const response = NextResponse.json({ success: true });
      response.cookies.set("admin-token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60,
        path: "/",
      });
      return response;
    }

    // ── Bot admin login ───────────────────────────────────────────────────
    const botAdmin = await prisma.botAdmin.findUnique({ where: { username } }).catch(() => null);
    if (!botAdmin || !verifyPassword(password, botAdmin.passwordHash)) {
      return NextResponse.json({ error: "Login yoki parol noto'g'ri" }, { status: 401 });
    }

    const token = createBotAdminToken(botAdmin.botSlug);
    const response = NextResponse.json({ success: true, botSlug: botAdmin.botSlug });
    response.cookies.set("bot-admin-token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
