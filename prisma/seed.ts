import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { initialBots } from "../src/data/bots";

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
    console.log(`  ✓ ${bot.icon} ${bot.name}`);
  }

  console.log(`\n${initialBots.length} ta bot kiritildi!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
