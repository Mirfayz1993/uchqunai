import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

const GEMINI_API_KEY = "AIzaSyDCCtvSv4ZwvcKqwPbL8XaSXK8ULCrDmEc";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const bots = [
  { slug: "umumiy", name: "Umumiy yordamchi", keyword: "chat bubble with lightning bolt, AI assistant" },
  { slug: "huquqshunos", name: "Huquqshunos uka", keyword: "scales of justice, law book, gavel" },
  { slug: "soliq-maslahatchisi", name: "Soliqchi uka", keyword: "tax document, calculator, receipt" },
  { slug: "shifokor", name: "Shifokor uka", keyword: "stethoscope, medical cross, heartbeat" },
  { slug: "dasturchi", name: "Dasturchi uka", keyword: "code brackets, terminal, laptop with code" },
  { slug: "biznes-maslahatchisi", name: "Bizneschi uka", keyword: "chart growth, briefcase, business graph" },
  { slug: "talim-mentori", name: "Ustoz uka", keyword: "graduation cap, open book, knowledge" },
  { slug: "psixolog", name: "Psixolog uka", keyword: "brain, mind, psychology, mental wellness" },
  { slug: "oshpaz", name: "Oshpaz uka", keyword: "chef hat, cooking pot, spatula" },
  { slug: "tarjimon", name: "Tarjimon uka", keyword: "globe with languages, translation, speech bubbles" },
  { slug: "rieltor", name: "Rieltor uka", keyword: "house, key, real estate building" },
  { slug: "avtomexanik", name: "Avtomexanik uka", keyword: "wrench, car engine, gear" },
  { slug: "dehqon-maslahatchisi", name: "Dehqon uka", keyword: "wheat, plant sprout, farm field" },
  { slug: "moliyachi", name: "Moliyachi uka", keyword: "coins stack, piggy bank, money growth" },
  { slug: "hr-mutaxassisi", name: "HR uka", keyword: "person with tie, resume, handshake" },
  { slug: "startupchi", name: "Startupchi uka", keyword: "rocket launch, startup, innovation lightbulb" },
  { slug: "santexnik", name: "Santexnik uka", keyword: "pipe wrench, water drop, plumbing valve" },
];

const outputDir = path.join(process.cwd(), "public", "bot-logos");

async function generateLogo(bot: typeof bots[0], index: number) {
  const prompt = `Create a modern, minimalist logo icon for "${bot.name}" AI assistant.
Visual elements: ${bot.keyword}.
Style requirements:
- 3D glossy style similar to app icons
- Primary color: deep purple (#7c3aed) with golden yellow (#eab308) accents
- Clean, simple icon design - just the symbol, NO text
- Dark purple gradient background or transparent
- Professional, modern look
- Single centered icon/symbol
- Suitable for a web app avatar/profile picture
- Square format, high quality
The design should match a brand that uses purple and gold/yellow colors with a 3D glossy aesthetic.`;

  console.log(`[${index + 1}/${bots.length}] Generating: ${bot.name} (${bot.slug})...`);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseModalities: ["image", "text"],
      },
    });

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || "image/png";
          const ext = mimeType.includes("png") ? "png" : "jpg";
          const filePath = path.join(outputDir, `${bot.slug}.${ext}`);

          fs.writeFileSync(filePath, Buffer.from(imageData!, "base64"));
          console.log(`  ✅ Saved: ${filePath}`);
          return true;
        }
      }
    }
    console.log(`  ❌ No image in response for ${bot.name}`);
    return false;
  } catch (error: any) {
    console.error(`  ❌ Error for ${bot.name}:`, error.message);
    return false;
  }
}

async function main() {
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`\n🎨 Generating ${bots.length} bot logos...\n`);
  console.log(`Output directory: ${outputDir}\n`);

  let success = 0;
  let failed = 0;

  // Generate one at a time to avoid rate limits
  for (let i = 0; i < bots.length; i++) {
    const result = await generateLogo(bots[i], i);
    if (result) success++;
    else failed++;

    // Small delay between requests
    if (i < bots.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n📊 Results: ${success} generated, ${failed} failed`);
  console.log(`📁 Logos saved to: ${outputDir}`);
}

main().catch(console.error);
