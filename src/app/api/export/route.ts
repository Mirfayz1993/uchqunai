import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { generateDocx, generateXlsx, generatePdf } from "@/lib/document-generator";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Tizimga kiring", { status: 401 });
  }

  const { content, title, format } = await req.json();

  if (!content || !title || !format) {
    return new Response("content, title va format majburiy", { status: 400 });
  }

  if (!["docx", "xlsx", "pdf"].includes(format)) {
    return new Response("Format docx, xlsx yoki pdf bo'lishi kerak", {
      status: 400,
    });
  }

  try {
    let buffer: Buffer;
    let contentType: string;
    let extension: string;

    switch (format) {
      case "docx":
        buffer = await generateDocx(title, content);
        contentType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        extension = "docx";
        break;
      case "xlsx":
        buffer = await generateXlsx(title, content);
        contentType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        extension = "xlsx";
        break;
      case "pdf":
        buffer = await generatePdf(title, content);
        contentType = "application/pdf";
        extension = "pdf";
        break;
      default:
        return new Response("Noma'lum format", { status: 400 });
    }

    const filename = `${title.replace(/[^a-zA-Z0-9\u0400-\u04FF\s]/g, "").replace(/\s+/g, "_")}.${extension}`;

    return new Response(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Hujjat yaratish xatosi:", error);
    return new Response("Hujjat yaratishda xatolik yuz berdi", { status: 500 });
  }
}
