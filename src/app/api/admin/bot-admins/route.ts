import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

// GET: list all bot admins
export async function GET() {
  try {
    const botAdmins = await prisma.botAdmin.findMany({
      select: { id: true, botSlug: true, username: true, createdAt: true, updatedAt: true },
      orderBy: { botSlug: "asc" },
    });
    return NextResponse.json(botAdmins);
  } catch {
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// POST: create bot admin
export async function POST(req: NextRequest) {
  try {
    const { botSlug, username, password } = await req.json();

    if (!botSlug || !username || !password) {
      return NextResponse.json({ error: "Barcha maydonlar to'ldirilishi kerak" }, { status: 400 });
    }
    if (username.length > 64 || password.length < 4 || password.length > 128) {
      return NextResponse.json({ error: "Username max 64, parol 4-128 belgi" }, { status: 400 });
    }
    if (username === "admin") {
      return NextResponse.json({ error: "'admin' nomini ishlatib bo'lmaydi" }, { status: 400 });
    }

    const passwordHash = hashPassword(password);
    const botAdmin = await prisma.botAdmin.upsert({
      where: { botSlug },
      update: { username, passwordHash },
      create: { botSlug, username, passwordHash },
      select: { id: true, botSlug: true, username: true, createdAt: true },
    });

    return NextResponse.json(botAdmin);
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Bu username band" }, { status: 409 });
    }
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
