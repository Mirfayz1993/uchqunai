import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, hashPassword } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

// PUT: update password (main admin only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAdminAuth(req);
  if (!auth || auth.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const { password } = await req.json();

    if (!password || password.length < 4 || password.length > 128) {
      return NextResponse.json({ error: "Parol 4-128 belgi bo'lishi kerak" }, { status: 400 });
    }

    const passwordHash = hashPassword(password);
    await prisma.botAdmin.update({ where: { id }, data: { passwordHash } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// DELETE: remove bot admin (main admin only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAdminAuth(req);
  if (!auth || auth.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    await prisma.botAdmin.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
