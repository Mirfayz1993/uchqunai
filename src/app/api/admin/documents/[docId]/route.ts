import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { generateEmbedding } from "@/lib/rag";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const adminToken = req.cookies.get("admin-token")?.value;
  if (!adminToken || !verifyAdminToken(adminToken)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { docId } = await params;

  try {
    const { title, content, sourceUrl } = await req.json();

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "Sarlavha va mazmun majburiy" },
        { status: 400 }
      );
    }

    // Check if content changed — if so, regenerate embedding
    const existing = await prisma.$queryRawUnsafe<{ content: string }[]>(
      `SELECT content FROM documents WHERE id = $1`,
      docId
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Hujjat topilmadi" },
        { status: 404 }
      );
    }

    if (content.trim() !== existing[0].content) {
      // Content changed — regenerate embedding
      const embedding = await generateEmbedding(content.trim());
      await prisma.$executeRawUnsafe(
        `UPDATE documents SET title = $1, content = $2, embedding = $3::vector, source_url = $4 WHERE id = $5`,
        title.trim(),
        content.trim(),
        `[${embedding.join(",")}]`,
        sourceUrl?.trim() || null,
        docId
      );
    } else {
      // Only title/sourceUrl changed
      await prisma.$executeRawUnsafe(
        `UPDATE documents SET title = $1, source_url = $2 WHERE id = $3`,
        title.trim(),
        sourceUrl?.trim() || null,
        docId
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Document PUT error:", error);
    return NextResponse.json(
      { error: "Hujjat yangilashda xatolik" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const adminToken = req.cookies.get("admin-token")?.value;
  if (!adminToken || !verifyAdminToken(adminToken)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { docId } = await params;

  try {
    await prisma.$executeRawUnsafe(
      `DELETE FROM documents WHERE id = $1`,
      docId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Document DELETE error:", error);
    return NextResponse.json(
      { error: "Hujjat o'chirishda xatolik" },
      { status: 500 }
    );
  }
}
