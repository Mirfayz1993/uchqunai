import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = getAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bots = await prisma.bot.findMany({
      where: auth.type === "bot-admin" ? { slug: auth.botSlug } : undefined,
      include: {
        _count: { select: { documents: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      bots.map((bot) => ({
        id: bot.id,
        name: bot.name,
        slug: bot.slug,
        icon: bot.icon,
        category: bot.category,
        description: bot.description,
        documentCount: bot._count.documents,
      }))
    );
  } catch (error) {
    console.error("Bots API error:", error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
