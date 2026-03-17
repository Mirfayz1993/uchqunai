import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const adminToken = req.cookies.get("admin-token")?.value;
  if (!adminToken || !verifyAdminToken(adminToken)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [totalUsers, totalConversations, totalMessages] = await Promise.all([
      prisma.user.count(),
      prisma.conversation.count(),
      prisma.message.count(),
    ]);

    const bots = await prisma.bot.findMany({
      include: {
        _count: {
          select: {
            documents: true,
            conversations: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Get message counts per bot via raw query
    const messageCounts = await prisma.$queryRawUnsafe<
      { bot_id: string; count: string }[]
    >(
      `SELECT b.id as bot_id, COUNT(m.id)::text as count
       FROM bots b
       LEFT JOIN conversations c ON c.bot_id = b.id
       LEFT JOIN messages m ON m.conversation_id = c.id
       GROUP BY b.id`
    );

    const messageMap = new Map(
      messageCounts.map((mc) => [mc.bot_id, parseInt(mc.count) || 0])
    );

    // Get total documents count
    const totalDocuments = bots.reduce(
      (sum, bot) => sum + bot._count.documents,
      0
    );

    const botStats = bots.map((bot) => ({
      id: bot.id,
      name: bot.name,
      slug: bot.slug,
      icon: bot.icon,
      category: bot.category,
      description: bot.description,
      documentCount: bot._count.documents,
      conversationCount: bot._count.conversations,
      messageCount: messageMap.get(bot.id) || 0,
    }));

    return NextResponse.json({
      totalUsers,
      totalConversations,
      totalMessages,
      totalDocuments,
      botStats,
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { error: "Server xatosi" },
      { status: 500 }
    );
  }
}
