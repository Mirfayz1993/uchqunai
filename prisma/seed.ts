import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { initialBots } from "../src/data/bots";
import crypto from "crypto";

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
    } catch {
      // fallback
    }
  }
  return url;
}

const adapter = new PrismaPg({ connectionString: getDirectDbUrl() });
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  const secret = process.env.AUTH_SECRET || "fallback-secret";
  return crypto.createHmac("sha256", secret).update(password).digest("hex");
}

async function main() {
  console.log("Botlar kiritilmoqda...");

  for (const bot of initialBots) {
    await prisma.bot.upsert({
      where: { slug: bot.slug },
      update: {
        name: bot.name,
        description: bot.description,
        icon: bot.icon,
        systemPrompt: bot.systemPrompt,
        category: bot.category,
      },
      create: {
        name: bot.name,
        slug: bot.slug,
        description: bot.description,
        icon: bot.icon,
        systemPrompt: bot.systemPrompt,
        category: bot.category,
      },
    });
    console.log(`  OK: ${bot.name}`);
  }

  console.log(`\n${initialBots.length} ta bot kiritildi!`);

  // Eski (o'chirilgan) botlarni deactivate qilish
  const activeSlugs = initialBots.map((b) => b.slug);
  await prisma.bot.updateMany({
    where: { slug: { notIn: activeSlugs } },
    data: { isActive: false },
  });

  // Bot adminlarni yaratish (faqat mavjud bo'lmaganlar uchun)
  console.log("\nBot adminlar tekshirilmoqda...");
  const defaultPassword = process.env.BOT_ADMIN_DEFAULT_PASSWORD || "admin123";

  for (const bot of initialBots) {
    if (bot.slug === "umumiy") continue; // umumiy bot uchun alohida admin kerak emas

    const existing = await prisma.botAdmin.findUnique({ where: { botSlug: bot.slug } });
    if (!existing) {
      const username = bot.slug;
      const passwordHash = hashPassword(defaultPassword);
      await prisma.botAdmin.create({
        data: { botSlug: bot.slug, username, passwordHash },
      });
      console.log(`  Yaratildi: ${bot.name} — login: ${username} / parol: ${defaultPassword}`);
    } else {
      console.log(`  Mavjud: ${bot.name} — login: ${existing.username}`);
    }
  }

  console.log("\nSeed muvaffaqiyatli yakunlandi!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
