import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// DELETE: eslatmani o'chirish
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const reminder = await prisma.reminder.findUnique({ where: { id } });
  if (!reminder || reminder.userId !== session.user.id) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }

  await prisma.reminder.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// PATCH: eslatmani yangilash
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const reminder = await prisma.reminder.findUnique({ where: { id } });
  if (!reminder || reminder.userId !== session.user.id) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }

  const { title, type, remindAt, isRecurring, recurType } = await req.json();
  const updated = await prisma.reminder.update({
    where: { id },
    data: {
      ...(title ? { title } : {}),
      ...(type ? { type } : {}),
      ...(remindAt ? { remindAt: new Date(remindAt), notified: false } : {}),
      ...(isRecurring !== undefined ? { isRecurring } : {}),
      ...(recurType !== undefined ? { recurType } : {}),
    },
  });

  return NextResponse.json(updated);
}
