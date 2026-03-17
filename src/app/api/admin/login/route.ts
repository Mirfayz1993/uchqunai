import { NextRequest, NextResponse } from "next/server";
import { createAdminToken } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    // CSRF protection: check Origin header
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host && !origin.includes(host)) {
      return NextResponse.json({ error: "CSRF xatosi" }, { status: 403 });
    }

    const { password } = await req.json();

    if (!password || typeof password !== "string" || password.length > 128 || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Parol noto'g'ri" },
        { status: 401 }
      );
    }

    const token = createAdminToken();
    const response = NextResponse.json({ success: true });

    response.cookies.set("admin-token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Server xatosi" },
      { status: 500 }
    );
  }
}
