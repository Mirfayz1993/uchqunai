import { GoogleGenAI } from "@google/genai";

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export type AIMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export async function chat(
  _provider: string,
  systemPrompt: string,
  messages: AIMessage[],
  ragContext?: string
): Promise<ReadableStream<string>> {
  const fullSystemPrompt = ragContext
    ? `${systemPrompt}\n\nQo'shimcha ma'lumot (bilimlar bazasidan):\n${ragContext}`
    : systemPrompt;

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }));

  try {
    const response = await gemini.models.generateContentStream({
      model: "gemini-2.0-flash",
      config: {
        systemInstruction: fullSystemPrompt,
        maxOutputTokens: 2048,
      },
      contents,
    });

    return new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const text = chunk.text;
          if (text) controller.enqueue(text);
        }
        controller.close();
      },
    });
  } catch (error) {
    console.error("Gemini xatosi:", error);
    return new ReadableStream({
      start(controller) {
        controller.enqueue("⚠️ AI xizmati hozir ishlamayapti. Iltimos, keyinroq urinib ko'ring.");
        controller.close();
      },
    });
  }
}
