import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET: foydalanuvchining barcha eslatmalari
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const todayOnly = searchParams.get("today") === "1";

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const reminders = await prisma.reminder.findMany({
    where: {
      userId: session.user.id as string,
      ...(todayOnly ? { remindAt: { gte: startOfDay, lte: endOfDay } } : {}),
    },
    orderBy: { remindAt: "asc" },
  });

  return NextResponse.json(reminders);
}

// POST: yangi eslatma qo'shish
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, type, remindAt, isRecurring, recurType } = await req.json();

  if (!title || !type || !remindAt) {
    return NextResponse.json({ error: "title, type, remindAt majburiy" }, { status: 400 });
  }
  if (title.length > 200) {
    return NextResponse.json({ error: "Sarlavha juda uzun" }, { status: 400 });
  }

  const validTypes = ["wake_up", "meeting", "birthday", "task", "general"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Noto'g'ri tur" }, { status: 400 });
  }

  const reminder = await prisma.reminder.create({
    data: {
      userId: session.user.id as string,
      title,
      type,
      remindAt: new Date(remindAt),
      isRecurring: Boolean(isRecurring),
      recurType: recurType || null,
      notified: false,
    },
  });

  return NextResponse.json(reminder);
}
