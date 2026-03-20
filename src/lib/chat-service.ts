import { prisma } from "./db";
import type { AIMessage } from "./ai";

const TYPE_NAMES: Record<string, string> = {
  wake_up: "Uyg'onish",
  meeting: "Uchrashuv",
  birthday: "Tug'ilgan kun",
  task: "Vazifa",
  general: "Eslatma",
};

const VALID_REMINDER_TYPES = ["wake_up", "meeting", "birthday", "task", "general"] as const;
const VALID_RECUR_TYPES = ["daily", "weekly", "yearly", null, undefined] as const;

// ─── Today's reminders context for system prompt ──────────────────────────

export async function getTodayRemindersContext(userId: string): Promise<string> {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

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

// ─── Build system prompt ──────────────────────────────────────────────────

export async function buildSystemPrompt(options: {
  basePrompt: string;
  isUmumiy: boolean;
  isGuest: boolean;
  userId?: string;
  userMessageCount: number;
  isDetailedMessage: boolean;
}): Promise<string> {
  const { basePrompt, isUmumiy, isGuest, userId, userMessageCount, isDetailedMessage } = options;

  let systemPrompt =
    basePrompt +
    `\n\n📏 JAVOB UZUNLIGI QOIDASI: Javobingni QISQA va ANIQ qil. Maksimal 150-200 so'z. Ro'yxat bo'lsa maksimal 4-5 ta band. Foydalanuvchi ko'proq so'rasa — keyin qo'sha olasan.`;

  if (isUmumiy && !isGuest && userId) {
    const todayReminders = await getTodayRemindersContext(userId);
    systemPrompt += todayReminders;

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

  return systemPrompt;
}

// ─── Load conversation history from DB ───────────────────────────────────

export async function getConversationMessages(convId: string): Promise<AIMessage[]> {
  const history = await prisma.message.findMany({
    where: { conversationId: convId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });
  return history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
}

// ─── Parse and save reminder from AI response ─────────────────────────────

export async function saveReminderFromResponse(
  fullResponse: string,
  userId: string
): Promise<void> {
  const tagStart = fullResponse.indexOf("[ESLATMA:");
  if (tagStart === -1) return;

  const jsonStart = tagStart + "[ESLATMA:".length;
  let depth = 0;
  let jsonEnd = -1;

  for (let i = jsonStart; i < fullResponse.length; i++) {
    if (fullResponse[i] === "{") depth++;
    else if (fullResponse[i] === "}") {
      depth--;
      if (depth === 0) {
        jsonEnd = i;
        break;
      }
    }
  }

  if (jsonEnd === -1) return;

  try {
    const jsonStr = fullResponse.slice(jsonStart, jsonEnd + 1);
    const data = JSON.parse(jsonStr);

    if (
      data.title &&
      typeof data.title === "string" &&
      VALID_REMINDER_TYPES.includes(data.type) &&
      data.remindAt &&
      !isNaN(new Date(data.remindAt).getTime()) &&
      VALID_RECUR_TYPES.includes(data.recurType)
    ) {
      await prisma.reminder.create({
        data: {
          userId,
          title: String(data.title).slice(0, 200),
          type: data.type,
          remindAt: new Date(data.remindAt),
          isRecurring: Boolean(data.isRecurring),
          recurType: data.recurType || null,
          notified: false,
        },
      });
    }
  } catch (err) {
    console.error("Eslatma saqlash xatosi:", err);
  }
}
