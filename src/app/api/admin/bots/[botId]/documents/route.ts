import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { addDocumentWithChunking } from "@/lib/rag";

async function checkBotAccess(auth: NonNullable<ReturnType<typeof getAdminAuth>>, botId: string): Promise<boolean> {
  if (auth.type === "admin") return true;
  // Bot admin: verify this botId belongs to their slug
  const bot = await prisma.bot.findUnique({ where: { id: botId }, select: { slug: true } });
  return bot?.slug === auth.botSlug;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const auth = getAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { botId } = await params;

  if (!(await checkBotAccess(auth, botId))) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  try {
    const documents = await prisma.$queryRawUnsafe<
      { id: string; title: string; content: string; source_url: string | null; created_at: Date }[]
    >(
      `SELECT id, title, content, source_url, created_at
       FROM documents
       WHERE bot_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      botId, limit, skip
    );

    const totalResult = await prisma.$queryRawUnsafe<{ count: string }[]>(
      `SELECT COUNT(*)::text as count FROM documents WHERE bot_id = $1`,
      botId
    );
    const total = parseInt(totalResult[0]?.count || "0");

    return NextResponse.json({
      documents: documents.map((d) => ({
        id: d.id,
        title: d.title,
        content: d.content,
        sourceUrl: d.source_url,
        createdAt: d.created_at,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Documents GET error:", error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const auth = getAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { botId } = await params;

  if (!(await checkBotAccess(auth, botId))) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  try {
    const { title, content, sourceUrl } = await req.json();

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Sarlavha va mazmun majburiy" }, { status: 400 });
    }

    const chunks = await addDocumentWithChunking(botId, title.trim(), content.trim(), sourceUrl?.trim() || undefined);

    return NextResponse.json({ success: true, chunks }, { status: 201 });
  } catch (error) {
    console.error("Documents POST error:", error);
    return NextResponse.json({ error: "Hujjat qo'shishda xatolik" }, { status: 500 });
  }
}
