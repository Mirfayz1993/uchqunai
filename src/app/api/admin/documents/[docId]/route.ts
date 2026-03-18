import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { generateEmbedding } from "@/lib/rag";

async function checkDocAccess(auth: NonNullable<ReturnType<typeof getAdminAuth>>, docId: string): Promise<boolean> {
  if (auth.type === "admin") return true;
  // Bot admin: verify this document belongs to their bot
  const result = await prisma.$queryRawUnsafe<{ bot_slug: string }[]>(
    `SELECT b.slug as bot_slug FROM documents d JOIN bots b ON b.id = d.bot_id WHERE d.id = $1`,
    docId
  );
  return result[0]?.bot_slug === auth.botSlug;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const auth = getAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { docId } = await params;

  if (!(await checkDocAccess(auth, docId))) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  try {
    const { title, content, sourceUrl } = await req.json();

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Sarlavha va mazmun majburiy" }, { status: 400 });
    }

    const existing = await prisma.$queryRawUnsafe<{ content: string }[]>(
      `SELECT content FROM documents WHERE id = $1`,
      docId
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: "Hujjat topilmadi" }, { status: 404 });
    }

    if (content.trim() !== existing[0].content) {
      const embedding = await generateEmbedding(content.trim());
      await prisma.$executeRawUnsafe(
        `UPDATE documents SET title = $1, content = $2, embedding = $3::vector, source_url = $4 WHERE id = $5`,
        title.trim(), content.trim(), `[${embedding.join(",")}]`, sourceUrl?.trim() || null, docId
      );
    } else {
      await prisma.$executeRawUnsafe(
        `UPDATE documents SET title = $1, source_url = $2 WHERE id = $3`,
        title.trim(), sourceUrl?.trim() || null, docId
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Document PUT error:", error);
    return NextResponse.json({ error: "Hujjat yangilashda xatolik" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const auth = getAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { docId } = await params;

  if (!(await checkDocAccess(auth, docId))) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  try {
    await prisma.$executeRawUnsafe(`DELETE FROM documents WHERE id = $1`, docId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Document DELETE error:", error);
    return NextResponse.json({ error: "Hujjat o'chirishda xatolik" }, { status: 500 });
  }
}
