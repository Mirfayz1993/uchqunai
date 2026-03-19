import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

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

  const groqMessages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: fullSystemPrompt },
    ...messages.map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    })),
  ];

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: groqMessages,
      max_tokens: 2048,
      stream: true,
    });

    return new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) controller.enqueue(text);
        }
        controller.close();
      },
    });
  } catch (error) {
    console.error("Groq xatosi:", error);
    return new ReadableStream({
      start(controller) {
        controller.enqueue("⚠️ AI xizmati hozir ishlamayapti. Iltimos, keyinroq urinib ko'ring.");
        controller.close();
      },
    });
  }
}
