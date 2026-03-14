import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json([]);
  }

  const botSlug = req.nextUrl.searchParams.get("botSlug");

  const where: Record<string, unknown> = {
    userId: session.user.id,
  };

  if (botSlug) {
    where.bot = { slug: botSlug };
  }

  const conversations = await prisma.conversation.findMany({
    where,
    include: { bot: { select: { slug: true } } },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });

  return NextResponse.json(
    conversations.map((c) => ({
      id: c.id,
      title: c.title,
      updatedAt: c.updatedAt.toISOString(),
      botSlug: c.bot.slug,
    }))
  );
}
