import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { chat, type AIMessage } from "@/lib/ai";
import { getRagContext } from "@/lib/rag";

export async function POST(req: NextRequest) {
  const session = await auth();

  const { message, botSlug, conversationId, clientMessages } = await req.json();

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

  let systemPrompt = bot.systemPrompt + `\n\n📏 JAVOB UZUNLIGI QOIDASI: Javobingni QISQA va ANIQ qil. Maksimal 150-200 so'z. Ro'yxat bo'lsa maksimal 4-5 ta band. Foydalanuvchi ko'proq so'rasa — keyin qo'sha olasan.`;

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
