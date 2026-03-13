import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

// Format phone: ensure +998 prefix
function formatPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("998")) {
    return "+" + cleaned;
  }
  if (cleaned.startsWith("8") || cleaned.startsWith("9")) {
    // Local format: 90 123 45 67 or 901234567
    if (cleaned.length === 9) {
      return "+998" + cleaned;
    }
  }
  return "+998" + cleaned;
}

export async function POST(req: Request) {
  try {
    const { name, phone, password } = await req.json();

    if (!phone || !password) {
      return NextResponse.json(
        { error: "Telefon raqam va parol kiritilishi shart" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Parol kamida 6 belgidan iborat bo'lishi kerak" },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhone(phone);

    // Validate UZ phone number
    if (!/^\+998\d{9}$/.test(formattedPhone)) {
      return NextResponse.json(
        { error: "Noto'g'ri telefon raqam formati. Masalan: +998901234567" },
        { status: 400 }
      );
    }

    const exists = await prisma.user.findUnique({
      where: { phone: formattedPhone },
    });
    if (exists) {
      return NextResponse.json(
        { error: "Bu raqam allaqachon ro'yxatdan o'tgan" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, phone: formattedPhone, passwordHash },
    });

    return NextResponse.json({ id: user.id, phone: user.phone });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
