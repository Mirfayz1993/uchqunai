/**
 * RAG bilim bazasiga hujjat qo'shish skripti
 *
 * Ishlatish:
 *   npx tsx prisma/add-knowledge.ts
 *
 * Yangi hujjat qo'shish uchun — quyidagi `documents` arrayga qo'shing.
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { GoogleGenAI } from "@google/genai";

function getDirectDbUrl(): string {
  const url = process.env.DATABASE_URL!;
  if (url.startsWith("prisma+postgres://")) {
    try {
      const parsed = new URL(url);
      const apiKey = parsed.searchParams.get("api_key");
      if (apiKey) {
        const decoded = JSON.parse(Buffer.from(apiKey, "base64").toString());
        return decoded.databaseUrl;
      }
    } catch { /* fallback */ }
  }
  return url;
}

const adapter = new PrismaPg({ connectionString: getDirectDbUrl() });
const prisma = new PrismaClient({ adapter });
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await gemini.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
  });
  return response.embeddings?.[0]?.values ?? [];
}

// ============================================================
// SHU YERGA O'Z HUJJATLARINGIZNI QO'SHING
// Format: { botSlug, title, content }
// ============================================================
const documents = [
  // ---- SANTEXNIK UKA ----
  {
    botSlug: "santexnik",
    title: "Kondensatsion kotyol nima va qanday ishlaydi",
    content: `Kondensatsion kotyol (condensing boiler) — bu suv bug'ini qayta isitish orqali yuqori samaradorlikka erishadigan isitish qurilmasi.

Oddiy kotyoldan farqi:
- Oddiy kotyol: 85-90% samaradorlik, chiqindi gazlar issiq chiqadi
- Kondensatsion kotyol: 95-109% samaradorlik, chiqindi gazlardan issiqlik qayta olinadi

Kondensatsion kotyol turlari:
1. Gazli kondensatsion kotyol — eng ko'p tarqalgan, gaz bilan ishlaydi
2. Elektr kondensatsion kotyol — elektr bilan, kondensat chiqarmaydi
3. Kombi kotyol — ham isitish, ham issiq suv ta'minlaydi

O'rnatish talablari:
- Kondensat chiqarish uchun maxsus quvur kerak (kanalizatsiyaga)
- Koaksial truba (ikki quvurli) orqali havo olish va chiqindi gaz chiqarish
- Ideal bo'lsa past temperatura isitish tizimi (yerosti isitish, panel radiatorlar)

Quvvat tanlash: uyning maydoni × 0.1 kW (masalan, 100 m² uy → 10 kW kotyol)`,
  },

  // ---- AVTOMEXANIK UKA ----
  // {
  //   botSlug: "avtomexanik",
  //   title: "...",
  //   content: `...`,
  // },

  // Ko'proq qo'shish uchun yuqoridagi formatda davom eting
];
// ============================================================

async function main() {
  console.log("RAG bilim bazasiga hujjatlar qo'shilmoqda...\n");

  for (const doc of documents) {
    // Bot ID ni topish
    const bot = await prisma.bot.findUnique({ where: { slug: doc.botSlug } });
    if (!bot) {
      console.log(`  ✗ Bot topilmadi: ${doc.botSlug}`);
      continue;
    }

    // Embedding generatsiya
    console.log(`  ⏳ "${doc.title}" uchun embedding yasalmoqda...`);
    const embedding = await generateEmbedding(doc.content);

    // DB ga saqlash
    await prisma.$executeRawUnsafe(
      `INSERT INTO documents (id, bot_id, title, content, embedding, source_url, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4::vector, $5, NOW())
       ON CONFLICT DO NOTHING`,
      bot.id,
      doc.title,
      doc.content,
      `[${embedding.join(",")}]`,
      null
    );

    console.log(`  ✓ [${doc.botSlug}] ${doc.title}`);
  }

  console.log("\nTayyor!");
  await prisma.$disconnect();
}

main().catch(console.error);
