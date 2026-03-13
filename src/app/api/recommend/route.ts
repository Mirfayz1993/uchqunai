import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { initialBots } from "@/data/bots";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const botList = initialBots
  .map((b) => `${b.slug} — ${b.name}: ${b.description}`)
  .join("\n");

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string" || message.trim().length < 2) {
      return NextResponse.json(
        { error: "Savol juda qisqa" },
        { status: 400 }
      );
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Sen foydalanuvchi savoliga eng mos AI ukani tanlash uchun yordamchisan.

Mavjud ukalar:
${botList}

VAZIFA: Foydalanuvchining savoliga eng mos ukaning slug ni qaytar.
FAQAT slug yoz, boshqa hech narsa yozma.

QOIDALAR:
- Agar savol aniq bir sohaga tegishli bo'lsa (huquq, soliq, tibbiyot, dasturlash va h.k.) — o'sha ukaning slug ini yoz.
- Agar savol umumiy bo'lsa, salomlashish bo'lsa, yoki qaysi uka mos kelishi noaniq bo'lsa — "umumiy" deb yoz.

Misol:
- "salom" → umumiy
- "kran oqyapti" → santexnik
- "mehnat shartnomasi" → huquqshunos
- "qanday ishlataman" → umumiy
- "palov retsepti" → oshpaz`,
        },
        {
          role: "user",
          content: message.trim(),
        },
      ],
      max_tokens: 50,
      temperature: 0,
    });

    const slug = completion.choices[0]?.message?.content?.trim().toLowerCase() || "umumiy";

    // Find matching bot
    const bot = initialBots.find((b) => b.slug === slug);

    if (bot) {
      return NextResponse.json({
        found: true,
        slug: bot.slug,
        name: bot.name,
        icon: bot.icon,
        description: bot.description,
        category: bot.category,
      });
    }

    // Umumiy savol — general chat ga yo'naltirish
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
