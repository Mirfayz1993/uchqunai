import { PrismaClient } from "../src/generated/prisma/client";
import { initialBots } from "../src/data/bots";

const prisma = new PrismaClient();

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
