import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { chat, type AIMessage } from "@/lib/ai";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

const BOT_LIST = [
  { slug: "umumiy", name: "Umumiy Yordamchi", emoji: "🤖" },
  { slug: "huquqshunos", name: "Huquqshunos", emoji: "⚖️" },
  { slug: "soliq-maslahatchisi", name: "Soliq Maslahatchisi", emoji: "💰" },
  { slug: "tibbiy-maslahatchi", name: "Tibbiy Maslahatchi", emoji: "🏥" },
  { slug: "dasturlash-mentori", name: "Dasturlash Mentori", emoji: "💻" },
  { slug: "biznes-maslahatchisi", name: "Biznes Maslahatchisi", emoji: "📊" },
  { slug: "talim-mentori", name: "Ta'lim Mentori", emoji: "📚" },
  { slug: "startupchi", name: "Startupchi", emoji: "🚀" },
  { slug: "psixolog", name: "Psixolog", emoji: "🧠" },
  { slug: "muhandis", name: "Muhandis", emoji: "🔧" },
  { slug: "moliyachi", name: "Moliyachi", emoji: "📈" },
  { slug: "hr-mutaxassisi", name: "HR Mutaxassisi", emoji: "👥" },
];

async function sendMessage(chatId: number, text: string, options: Record<string, unknown> = {}) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...options }),
  });
}

async function sendChatAction(chatId: number, action = "typing") {
  await fetch(`${TELEGRAM_API}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action }),
  });
}

// TG user uchun bot context olish (hangi uka tanlangan)
const userBotMap = new Map<number, string>(); // tgUserId → botSlug

export async function POST(req: NextRequest) {
  // Telegram secret token tekshirish
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const message = body.message || body.edited_message;
  if (!message) return NextResponse.json({ ok: true });

  const chatId: number = message.chat.id;
  const tgUserId: number = message.from?.id;
  const text: string = message.text || "";
  const firstName: string = message.from?.first_name || "Do'stim";

  try {
    // /start
    if (text === "/start") {
      await sendMessage(
        chatId,
        `Salom, <b>${firstName}</b>! 👋\n\nMen <b>Uchqun.ai</b> — O'zbekiston uchun AI yordamchi.\n\n` +
        `Menga savol bering yoki quyidagi buyruqlardan foydalaning:\n\n` +
        `/ukalar — barcha ixtisoslashgan ukalar\n` +
        `/uka — hozirgi uka\n` +
        `/yordam — qo'llanma\n\n` +
        `Boshlang! 🚀`
      );
      userBotMap.set(tgUserId, "umumiy");
      return NextResponse.json({ ok: true });
    }

    // /ukalar — ro'yxat
    if (text === "/ukalar") {
      const list = BOT_LIST.map((b) => `${b.emoji} /uka_${b.slug.replace(/-/g, "_")} — ${b.name}`).join("\n");
      await sendMessage(chatId, `<b>Ixtisoslashgan ukalar:</b>\n\n${list}\n\nYoki shunchaki savol yozing — Umumiy uka javob beradi.`);
      return NextResponse.json({ ok: true });
    }

    // /uka — hozirgi uka
    if (text === "/uka") {
      const currentSlug = userBotMap.get(tgUserId) || "umumiy";
      const current = BOT_LIST.find((b) => b.slug === currentSlug);
      await sendMessage(chatId, `Hozir <b>${current?.name || "Umumiy Yordamchi"}</b> bilan suhbat qilyapsiz.\nO'zgartirish uchun /ukalar`);
      return NextResponse.json({ ok: true });
    }

    // /uka_{slug} — uka tanlash
    if (text.startsWith("/uka_")) {
      const slugRaw = text.slice(5).replace(/_/g, "-");
      const found = BOT_LIST.find((b) => b.slug === slugRaw);
      if (found) {
        userBotMap.set(tgUserId, found.slug);
        await sendMessage(chatId, `${found.emoji} <b>${found.name}</b> tanlandi!\nSavolingizni yozing.`);
      } else {
        await sendMessage(chatId, "Bunday uka topilmadi. /ukalar — ro'yxatni ko'ring.");
      }
      return NextResponse.json({ ok: true });
    }

    // /yordam
    if (text === "/yordam") {
      await sendMessage(
        chatId,
        `<b>Qo'llanma:</b>\n\n` +
        `• Shunchaki savol yozing — AI javob beradi\n` +
        `• /ukalar — ixtisoslashgan ukalar ro'yxati\n` +
        `• /uka — hozirgi tanlangan uka\n` +
        `• /uka_huquqshunos — Huquqshunos ukani tanlash\n` +
        `• /uka_dasturlash_mentori — Dasturlash Mentori\n\n` +
        `Saytda to'liq versiya: https://uchqun.ai`
      );
      return NextResponse.json({ ok: true });
    }

    // Oddiy xabar — AI ga yuborish
    if (!text || text.startsWith("/")) return NextResponse.json({ ok: true });

    await sendChatAction(chatId);

    // Bot topish
    const botSlug = userBotMap.get(tgUserId) || "umumiy";
    const bot = await prisma.bot.findUnique({ where: { slug: botSlug } });
    if (!bot) {
      await sendMessage(chatId, "Xatolik yuz berdi. Qaytadan urinib ko'ring.");
      return NextResponse.json({ ok: true });
    }

    // Conversation history (in-memory, oddiy)
    const messages: AIMessage[] = [{ role: "user", content: text }];

    const systemPrompt =
      bot.systemPrompt +
      `\n\n📱 TELEGRAM QOIDASI: Telegram uchun javob ber. Markdown o'rniga oddiy matn yoz, <b>bold</b> uchun HTML ishlatish mumkin. Maksimal 500 belgi.`;

    // Stream emas, to'liq javob
    const stream = await chat("gemini", systemPrompt, messages, "");
    let fullResponse = "";
    const reader = stream.getReader ? stream.getReader() : null;

    if (reader) {
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullResponse += typeof value === "string" ? value : decoder.decode(value);
      }
    }

    // [UKA:...] va [ESLATMA:...] taglarini olib tashlash
    fullResponse = fullResponse.replace(/\[UKA:[^\]]+\]/g, "").replace(/\[ESLATMA:\{[^}]*\}\]/g, "").trim();

    if (!fullResponse) {
      await sendMessage(chatId, "Javob olishda xatolik. Qaytadan urinib ko'ring.");
      return NextResponse.json({ ok: true });
    }

    // Telegram 4096 belgi limiti
    if (fullResponse.length > 4000) {
      fullResponse = fullResponse.slice(0, 4000) + "...\n\n<i>To'liq javob uchun: https://uchqun.ai</i>";
    }

    const current = BOT_LIST.find((b) => b.slug === botSlug);
    const prefix = botSlug !== "umumiy" ? `${current?.emoji || ""} <b>${current?.name}</b>:\n\n` : "";

    await sendMessage(chatId, prefix + fullResponse);
  } catch (err) {
    console.error("Telegram webhook xatosi:", err);
    await sendMessage(chatId, "Texnik xatolik yuz berdi. Biroz kutib qayta urinib ko'ring.").catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
