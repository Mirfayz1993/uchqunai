import { NextRequest, NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword || typeof newPassword !== "string") {
      return NextResponse.json({ error: "Ma'lumotlar to'liq emas" }, { status: 400 });
    }
    if (newPassword.length < 6 || newPassword.length > 128) {
      return NextResponse.json({ error: "Parol 6-128 belgi bo'lishi kerak" }, { status: 400 });
    }

    // Verify current password
    const setting = await prisma.siteSetting.findUnique({ where: { key: "admin_password_hash" } }).catch(() => null);
    let valid = false;
    if (setting) {
      valid = verifyPassword(currentPassword, setting.value);
    } else {
      valid = currentPassword === process.env.ADMIN_PASSWORD;
    }

    if (!valid) {
      return NextResponse.json({ error: "Joriy parol noto'g'ri" }, { status: 401 });
    }

    // Save new password hash
    const newHash = hashPassword(newPassword);
    await prisma.siteSetting.upsert({
      where: { key: "admin_password_hash" },
      update: { value: newHash },
      create: { key: "admin_password_hash", value: newHash },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
