import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { chat, type AIMessage } from "@/lib/ai";
import { getRagContext } from "@/lib/rag";
import { chatSchema } from "@/lib/validation";
import { saveReminderFromResponse, buildSystemPrompt, getConversationMessages } from "@/lib/chat-service";

// In-memory rate limiter (IP-based)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

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
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (!checkRateLimit(ip)) {
    return new Response("Juda ko'p so'rov. Biroz kuting.", { status: 429 });
  }

  const session = await auth();

  const body = await req.json().catch(() => null);
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Noto'g'ri ma'lumot";
    return new Response(msg, { status: 400 });
  }
  const { message, botSlug, conversationId, clientMessages } = parsed.data;

  const isGuest = !session?.user?.id;
  const isUmumiy = botSlug === "umumiy";

  const bot = await prisma.bot.findUnique({ where: { slug: botSlug } });
  if (!bot) {
    return new Response("Bot topilmadi", { status: 404 });
  }

  if (!isUmumiy && isGuest) {
    return new Response("Tizimga kiring", { status: 401 });
  }

  let messages: AIMessage[] = [];
  let convId: string | null = conversationId || null;

  if (!isGuest) {
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

    messages = await getConversationMessages(convId);
  } else {
    const history: AIMessage[] = Array.isArray(clientMessages) ? clientMessages : [];
    messages = [...history, { role: "user", content: message }];
  }

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const lastUserMessage = messages.filter((m) => m.role === "user").pop()?.content || "";
  const isDetailedMessage = lastUserMessage.split(/\s+/).length >= 15;

  const [ragContext, systemPrompt] = await Promise.all([
    getRagContext(bot.id, message).catch((ragError) => {
      console.error("RAG xatosi (davom etilmoqda):", ragError);
      return "";
    }),
    buildSystemPrompt({
      basePrompt: bot.systemPrompt,
      isUmumiy,
      isGuest,
      userId: session?.user?.id as string | undefined,
      userMessageCount,
      isDetailedMessage,
    }),
  ]);

  const stream = await chat("gemini", systemPrompt, messages, ragContext);

  let fullResponse = "";
  const encoder = new TextEncoder();
  const userId = session?.user?.id as string | undefined;

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

        if (isUmumiy && userId) {
          await saveReminderFromResponse(fullResponse, userId);
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
