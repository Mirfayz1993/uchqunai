import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, hashPassword, verifyPassword } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { changePasswordSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const auth = getAdminAuth(req);
  if (!auth || auth.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => null);
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Ma'lumotlar to'liq emas";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const { currentPassword, newPassword } = parsed.data;

    // Verify current password
    const setting = await prisma.siteSetting.findUnique({ where: { key: "admin_password_hash" } }).catch(() => null);
    let valid = false;
    if (setting) {
      valid = await verifyPassword(currentPassword, setting.value);
    } else {
      valid = currentPassword === process.env.ADMIN_PASSWORD;
    }

    if (!valid) {
      return NextResponse.json({ error: "Joriy parol noto'g'ri" }, { status: 401 });
    }

    // Save new password hash
    const newHash = await hashPassword(newPassword);
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
