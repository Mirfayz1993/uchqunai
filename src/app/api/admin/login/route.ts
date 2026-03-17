import { NextRequest, NextResponse } from "next/server";
import { createAdminToken } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password || password !== process.env.ADMIN_PASSWORD) {
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
