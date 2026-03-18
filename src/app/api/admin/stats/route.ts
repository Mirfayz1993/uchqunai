import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = getAdminAuth(req);
  if (!auth || auth.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [totalUsers, totalConversations, totalMessages] = await Promise.all([
      prisma.user.count(),
      prisma.conversation.count(),
      prisma.message.count(),
    ]);

    // ── New analytics ──────────────────────────────────────────────────────

    const [
      newUsersTodayResult,
      activeUsersTodayResult,
      convsTodayResult,
      avgMessagesResult,
      avgSessionResult,
      last7DaysResult,
    ] = await Promise.all([
      // New users registered today
      prisma.$queryRawUnsafe<{ count: string }[]>(
        `SELECT COUNT(*)::text as count FROM users
         WHERE created_at >= NOW() - INTERVAL '1 day'`
      ),
      // Active users today (sent at least 1 message)
      prisma.$queryRawUnsafe<{ count: string }[]>(
        `SELECT COUNT(DISTINCT c.user_id)::text as count
         FROM messages m
         JOIN conversations c ON c.id = m.conversation_id
         WHERE m.role = 'user' AND m.created_at >= NOW() - INTERVAL '1 day'`
      ),
      // Conversations started today
      prisma.$queryRawUnsafe<{ count: string }[]>(
        `SELECT COUNT(*)::text as count FROM conversations
         WHERE created_at >= NOW() - INTERVAL '1 day'`
      ),
      // Average user messages per conversation
      prisma.$queryRawUnsafe<{ avg: string }[]>(
        `SELECT ROUND(AVG(msg_count), 1)::text as avg FROM (
           SELECT conversation_id, COUNT(*) as msg_count
           FROM messages WHERE role = 'user'
           GROUP BY conversation_id
         ) t`
      ),
      // Average session duration in minutes
      prisma.$queryRawUnsafe<{ avg: string }[]>(
        `SELECT ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60), 1)::text as avg
         FROM conversations
         WHERE updated_at > created_at + INTERVAL '10 seconds'`
      ),
      // Last 7 days: user messages per day
      prisma.$queryRawUnsafe<{ day: string; count: string }[]>(
        `SELECT TO_CHAR(DATE(created_at), 'MM-DD') as day, COUNT(*)::text as count
         FROM messages
         WHERE role = 'user' AND created_at >= NOW() - INTERVAL '7 days'
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at)`
      ),
    ]);

    // ── Bot stats ──────────────────────────────────────────────────────────
    const bots = await prisma.bot.findMany({
      where: { isActive: true },
      include: { _count: { select: { documents: true, conversations: true } } },
      orderBy: { name: "asc" },
    });

    const messageCounts = await prisma.$queryRawUnsafe<
      { bot_id: string; count: string }[]
    >(
      `SELECT b.id as bot_id, COUNT(m.id)::text as count
       FROM bots b
       LEFT JOIN conversations c ON c.bot_id = b.id
       LEFT JOIN messages m ON m.conversation_id = c.id
       GROUP BY b.id`
    );
    const messageMap = new Map(messageCounts.map((mc) => [mc.bot_id, parseInt(mc.count) || 0]));

    const totalDocuments = bots.reduce((sum, bot) => sum + bot._count.documents, 0);

    return NextResponse.json({
      totalUsers,
      totalConversations,
      totalMessages,
      totalDocuments,
      // New fields
      newUsersToday: parseInt(newUsersTodayResult[0]?.count || "0"),
      activeUsersToday: parseInt(activeUsersTodayResult[0]?.count || "0"),
      convsToday: parseInt(convsTodayResult[0]?.count || "0"),
      avgMessagesPerConv: parseFloat(avgMessagesResult[0]?.avg || "0"),
      avgSessionMinutes: parseFloat(avgSessionResult[0]?.avg || "0"),
      last7Days: last7DaysResult.map((r) => ({ day: r.day, count: parseInt(r.count) })),
      botStats: bots.map((bot) => ({
        id: bot.id,
        name: bot.name,
        slug: bot.slug,
        icon: bot.icon,
        category: bot.category,
        description: bot.description,
        documentCount: bot._count.documents,
        conversationCount: bot._count.conversations,
        messageCount: messageMap.get(bot.id) || 0,
      })),
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
