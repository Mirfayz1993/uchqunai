import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { prisma } from "@/lib/db";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const TYPE_LABELS: Record<string, string> = {
  wake_up: "⏰ Uyg'onish vaqti",
  meeting: "🤝 Uchrashuv",
  birthday: "🎂 Tug'ilgan kun",
  task: "✅ Vazifa",
  general: "🔔 Eslatma",
};

export async function POST(req: NextRequest) {
  // Cron secret tekshirish
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // ± 2 daqiqa oynada eslatmalar
  const from = new Date(now.getTime() - 2 * 60 * 1000);
  const to = new Date(now.getTime() + 2 * 60 * 1000);

  // Yuborilmagan eslatmalarni topish
  const reminders = await prisma.reminder.findMany({
    where: {
      notified: false,
      remindAt: { gte: from, lte: to },
    },
    include: {
      user: {
        include: { pushSubscriptions: true },
      },
    },
  });

  let sent = 0;
  const errors: string[] = [];

  for (const reminder of reminders) {
    const subs = reminder.user.pushSubscriptions;
    if (subs.length === 0) continue;

    const typeLabel = TYPE_LABELS[reminder.type] || "🔔 Eslatma";
    const payload = JSON.stringify({
      title: typeLabel,
      body: reminder.title,
      icon: "/icon-192.png",
      tag: `reminder-${reminder.id}`,
      url: "/chat/umumiy",
    });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (err: unknown) {
        const error = err as { statusCode?: number };
        // 410 = subscription expired — o'chirish
        if (error.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => null);
        } else {
          errors.push(`sub ${sub.id}: ${String(err)}`);
        }
      }
    }

    // Takrorlanmaydigan eslatmalarni notified = true qilish
    if (!reminder.isRecurring) {
      await prisma.reminder.update({ where: { id: reminder.id }, data: { notified: true } });
    } else {
      // Keyingi vaqtni hisoblash
      const next = new Date(reminder.remindAt);
      if (reminder.recurType === "daily") next.setDate(next.getDate() + 1);
      else if (reminder.recurType === "weekly") next.setDate(next.getDate() + 7);
      else if (reminder.recurType === "yearly") next.setFullYear(next.getFullYear() + 1);
      else next.setDate(next.getDate() + 1); // default: daily

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { remindAt: next, notified: false },
      });
    }
  }

  return NextResponse.json({ processed: reminders.length, sent, errors });
}
