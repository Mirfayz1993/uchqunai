import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { chat, type AIMessage } from "@/lib/ai";
import { getRagContext } from "@/lib/rag";

const TYPE_NAMES: Record<string, string> = {
  wake_up: "Uyg'onish",
  meeting: "Uchrashuv",
  birthday: "Tug'ilgan kun",
  task: "Vazifa",
  general: "Eslatma",
};

async function getTodayRemindersContext(userId: string): Promise<string> {
  try {
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);

    const reminders = await prisma.reminder.findMany({
      where: { userId, remindAt: { gte: startOfDay, lte: endOfDay } },
      orderBy: { remindAt: "asc" },
    });

    if (reminders.length === 0) return "";

    const lines = reminders.map((r) => {
      const time = r.remindAt.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
      const typeName = TYPE_NAMES[r.type] || "Eslatma";
      return `- ${time}: [${typeName}] ${r.title}`;
    });

    return `\n\n📅 FOYDALANUVCHINING BUGUNGI KUN TARTIBI:\n${lines.join("\n")}\nSuhbat boshida yoki so'ralganda bugungi kun tartibini eslatib o'ting.`;
  } catch {
    return "";
  }
}

// In-memory rate limiter (IP-based)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 20; // max requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_MESSAGE_LENGTH = 5000; // max 5000 characters

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetTime) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000);

export async function POST(req: NextRequest) {
  // Rate limit check
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(ip)) {
    return new Response("Juda ko'p so'rov. Biroz kuting.", { status: 429 });
  }

  const session = await auth();

  const { message, botSlug, conversationId, clientMessages } = await req.json();

  // Input validation
  if (!message || typeof message !== "string" || message.length > MAX_MESSAGE_LENGTH) {
    return new Response(
      message?.length > MAX_MESSAGE_LENGTH
        ? `Xabar juda uzun (max ${MAX_MESSAGE_LENGTH} belgi)`
        : "Xabar kiritilishi shart",
      { status: 400 }
    );
  }

  // Find bot
  const bot = await prisma.bot.findUnique({ where: { slug: botSlug } });
  if (!bot) {
    return new Response("Bot topilmadi", { status: 404 });
  }

  const isGuest = !session?.user?.id;
  const isUmumiy = botSlug === "umumiy";

  // Authenticated users only for non-umumiy bots
  if (!isUmumiy && isGuest) {
    return new Response("Tizimga kiring", { status: 401 });
  }

  let messages: AIMessage[] = [];
  let convId: string | null = conversationId || null;

  if (!isGuest) {
    // Authenticated: use DB
    if (!convId) {
      const conv = await prisma.conversation.create({
        data: {
          userId: session!.user!.id as string,
          botId: bot.id,
          title: message.slice(0, 100),
        },
      });
      convId = conv.id;
    }

    await prisma.message.create({
      data: { conversationId: convId, role: "user", content: message },
    });

    const history = await prisma.message.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    messages = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
  } else {
    // Guest (umumiy only): use client-side history
    const history: AIMessage[] = Array.isArray(clientMessages) ? clientMessages : [];
    messages = [...history, { role: "user", content: message }];
  }

  // Get RAG context (don't fail if RAG errors)
  let ragContext: string = "";
  try {
    ragContext = (await getRagContext(bot.id, message)) ?? "";
  } catch (ragError) {
    console.error("RAG xatosi (davom etilmoqda):", ragError);
  }

  // Aniqlashtiruvchi savollar — faqat ixtisoslashgan ukalar uchun (umumiy emas)
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const lastUserMessage = messages.filter((m) => m.role === "user").pop()?.content || "";
  const isDetailedMessage = lastUserMessage.split(/\s+/).length >= 15;

  // Umumiy bot: bugungi eslatmalarni inject qilish
  let todayReminders = "";
  if (isUmumiy && !isGuest) {
    todayReminders = await getTodayRemindersContext(session!.user!.id as string);
  }

  let systemPrompt = bot.systemPrompt + `\n\n📏 JAVOB UZUNLIGI QOIDASI: Javobingni QISQA va ANIQ qil. Maksimal 150-200 so'z. Ro'yxat bo'lsa maksimal 4-5 ta band. Foydalanuvchi ko'proq so'rasa — keyin qo'sha olasan.` + todayReminders;

  if (isUmumiy && !isGuest) {
    systemPrompt += `

🔔 ESLATMA SAQLASH QOIDASI:
Foydalanuvchi eslatma qo'shmoqchi bo'lsa (uyg'onish vaqti, uchrashuv, tug'ilgan kun, vazifa va h.k.), javobingni oxiriga quyidagi formatda qo'sh:

[ESLATMA:{"title":"sarlavha","type":"wake_up|meeting|birthday|task|general","remindAt":"YYYY-MM-DDTHH:MM:00","isRecurring":false,"recurType":null}]

Misol: "Ertaga soat 9 da uyg'onish" → type: "wake_up", isRecurring: true, recurType: "daily"
Misol: "Juma kuni Jasur bilan uchrashuv" → type: "meeting", isRecurring: false
Misol: "Har kuni soat 7 da sport" → isRecurring: true, recurType: "daily"
Tarix noaniq bo'lsa, bugundan eng yaqin vaqtni tanlang. Faqat foydalanuvchi eslatma so'raganda qo'shing.`;
  }

  if (!isUmumiy && userMessageCount <= 2 && !isDetailedMessage) {
    systemPrompt += `\n\n⚠️ ANIQLASHTIRISH BOSQICHI (${userMessageCount}-xabar):
QOIDA: Foydalanuvchi hali yetarli ma'lumot bermagan. Sen FAQAT 1-2 ta eng muhim savolni ber.
- HECH QANDAY javob, maslahat, formula yoki ro'yxat BERMA
- Faqat 1-2 ta qisqa savol ber, boshqa hech narsa yozma
- Savol berish shakli: "Tushundim! Bitta savol: [savol]?" yoki "Ikkita savol: 1) ... 2) ..."
- Foydalanuvchi javob bergandan keyin to'liq yordam berasan`;
  }

  // Get AI response (streaming)
  const stream = await chat("gemini", systemPrompt, messages, ragContext);

  let fullResponse = "";
  const encoder = new TextEncoder();
  const transformStream = new TransformStream({
    async transform(chunk, controller) {
      fullResponse += chunk;
      controller.enqueue(encoder.encode(chunk));
    },
    async flush() {
      if (!isGuest && convId) {
        try {
          await prisma.message.create({
            data: { conversationId: convId, role: "assistant", content: fullResponse },
          });
        } catch (saveError) {
          console.error("Javob saqlash xatosi:", saveError);
        }

        // Eslatma saqlash: [ESLATMA:{...}] ni topish
        if (isUmumiy) {
          const match = fullResponse.match(/\[ESLATMA:(\{[^}]+\})\]/);
          if (match) {
            try {
              const data = JSON.parse(match[1]);
              if (data.title && data.type && data.remindAt) {
                await prisma.reminder.create({
                  data: {
                    userId: session!.user!.id as string,
                    title: data.title,
                    type: data.type,
                    remindAt: new Date(data.remindAt),
                    isRecurring: Boolean(data.isRecurring),
                    recurType: data.recurType || null,
                    notified: false,
                  },
                });
              }
            } catch (parseErr) {
              console.error("Eslatma saqlash xatosi:", parseErr);
            }
          }
        }
      }
    },
  });

  const readable = stream.pipeThrough(transformStream);

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ...(convId ? { "X-Conversation-Id": convId } : {}),
    },
  });
}
