import { NextRequest, NextResponse } from "next/server";
import { createAdminToken, createBotAdminToken, verifyPassword } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    // CSRF protection
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host && !origin.includes(host)) {
      return NextResponse.json({ error: "CSRF xatosi" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Login yoki parol noto'g'ri" }, { status: 401 });
    }
    const { username, password } = parsed.data;

    // ── Main admin login ──────────────────────────────────────────────────
    if (username === "admin") {
      // Check DB password hash first, fallback to env var
      const setting = await prisma.siteSetting.findUnique({ where: { key: "admin_password_hash" } }).catch(() => null);

      let valid = false;
      if (setting) {
        valid = await verifyPassword(password, setting.value);
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
    if (!botAdmin || !await verifyPassword(password, botAdmin.passwordHash)) {
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
