import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { initialBots } from "@/data/bots";

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const botList = initialBots
  .map((b) => `${b.slug} — ${b.name}: ${b.description}`)
  .join("\n");

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string" || message.trim().length < 2 || message.length > 2000) {
      return NextResponse.json(
        { error: message?.length > 2000 ? "Savol juda uzun (max 2000 belgi)" : "Savol juda qisqa" },
        { status: 400 }
      );
    }

    const prompt = `Sen foydalanuvchi savoliga eng mos AI ukani tanlash uchun yordamchisan.

Mavjud ukalar:
${botList}

VAZIFA: Foydalanuvchining savoliga eng mos ukaning slug ni qaytar.
FAQAT slug yoz, boshqa hech narsa yozma.

QOIDALAR:
- Agar savol aniq bir sohaga tegishli bo'lsa — o'sha ukaning slug ini yoz.
- Agar savol umumiy bo'lsa yoki noaniq bo'lsa — "umumiy" deb yoz.

Foydalanuvchi savoli: ${message.trim()}`;

    const response = await gemini.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 20 },
    });

    const slug = response.text?.trim().toLowerCase() || "umumiy";
    const bot = initialBots.find((b) => b.slug === slug);

    if (bot) {
      return NextResponse.json({
        found: true,
        slug: bot.slug,
        name: bot.name,
        icon: bot.icon,
        image: bot.image,
        description: bot.description,
        category: bot.category,
      });
    }

    return NextResponse.json({
      found: false,
      slug: "umumiy",
      name: "Umumiy savol",
      icon: "💬",
      description: "Savolingiz umumiy ko'rinadi. Quyidagi ukalardan birini tanlang yoki umumiy suhbat boshlang.",
    });
  } catch (error) {
    console.error("Recommend API error:", error);
    return NextResponse.json(
      { error: "AI xizmati vaqtinchalik ishlamayapti" },
      { status: 500 }
    );
  }
}
