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

  // Get RAG context
  const ragContext = await getRagContext(bot.id, message);

  // Get AI response (streaming)
  const stream = await chat("gemini", bot.systemPrompt, messages, ragContext);

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
      await prisma.message.create({
        data: {
          conversationId: convId,
          role: "assistant",
          content: fullResponse,
        },
      });
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
