import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, hashPassword } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { botAdminCreateSchema } from "@/lib/validation";

// GET: list all bot admins (main admin only)
export async function GET(req: NextRequest) {
  const auth = getAdminAuth(req);
  if (!auth || auth.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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

// POST: create bot admin (main admin only)
export async function POST(req: NextRequest) {
  const auth = getAdminAuth(req);
  if (!auth || auth.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => null);
    const parsed = botAdminCreateSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Barcha maydonlar to'ldirilishi kerak";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const { botSlug, username, password } = parsed.data;

    if (username === "admin") {
      return NextResponse.json({ error: "'admin' nomini ishlatib bo'lmaydi" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
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
