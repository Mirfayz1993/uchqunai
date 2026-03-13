import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { chat, type AIMessage } from "@/lib/ai";
import { getRagContext } from "@/lib/rag";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Tizimga kiring", { status: 401 });
  }

  const { message, botSlug, conversationId } = await req.json();

  // Find bot
  const bot = await prisma.bot.findUnique({ where: { slug: botSlug } });
  if (!bot) {
    return new Response("Bot topilmadi", { status: 404 });
  }

  // Get or create conversation
  let convId = conversationId;
  if (!convId) {
    const conv = await prisma.conversation.create({
      data: {
        userId: session.user.id,
        botId: bot.id,
        title: message.slice(0, 100),
      },
    });
    convId = conv.id;
  }

  // Save user message
  await prisma.message.create({
    data: {
      conversationId: convId,
      role: "user",
      content: message,
    },
  });

  // Get conversation history (last 20 messages)
  const history = await prisma.message.findMany({
    where: { conversationId: convId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const messages: AIMessage[] = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Get RAG context (don't fail if RAG errors)
  let ragContext = "";
  try {
    ragContext = await getRagContext(bot.id, message);
  } catch (ragError) {
    console.error("RAG xatosi (davom etilmoqda):", ragError);
  }

  // Aniqlashtiruvchi savollar bosqichi — etarli ma'lumot to'planguncha
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  let systemPrompt = bot.systemPrompt;
  if (userMessageCount <= 2) {
    systemPrompt += `\n\n⚠️ HOZIRGI HOLAT: Suhbatda hali faqat ${userMessageCount} ta foydalanuvchi xabari bor. Bu YETARLI EMAS to'liq javob berish uchun.
Sen hali aniqlashtirish bosqichidasan. QOIDALAR:
1. Agar foydalanuvchi hali barcha kerakli ma'lumotni bermagan bo'lsa — FAQAT 3-4 ta aniqlashtiruvchi savol ber, HECH QANDAY yechim yoki maslahat BERMA.
2. Har bir javobda 3-4 ta savol bo'lishi SHART.
3. Savollardan oldin qisqa "Tushundim, yana bir necha savol:" deb yoz.
4. FAQAT foydalanuvchi barcha muhim tafsilotlarni (turi, modeli, joylashuvi, muammo tafsiloti) batafsil aytgandan keyingina to'liq javob ber.
5. Agar foydalanuvchi qisqa javob bergan bo'lsa (1-2 so'z) — bu YETARLI EMAS, yana savollar ber.`;
  }

  // Get AI response (streaming)
  const stream = await chat("gemini", systemPrompt, messages, ragContext);

  // Collect full response for saving
  let fullResponse = "";

  const encoder = new TextEncoder();
  const transformStream = new TransformStream({
    async transform(chunk, controller) {
      fullResponse += chunk;
      controller.enqueue(encoder.encode(chunk));
    },
    async flush() {
      // Save assistant message after stream completes
      try {
        await prisma.message.create({
          data: {
            conversationId: convId,
            role: "assistant",
            content: fullResponse,
          },
        });
      } catch (saveError) {
        console.error("Javob saqlash xatosi:", saveError);
      }
    },
  });

  const readable = stream.pipeThrough(transformStream);

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Conversation-Id": convId,
    },
  });
}
