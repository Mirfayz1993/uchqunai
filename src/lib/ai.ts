import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export type AIMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export async function chatWithGemini(
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
        if (text) {
          controller.enqueue(text);
        }
      }
      controller.close();
    },
  });
}

export async function chatWithGroq(
  systemPrompt: string,
  messages: AIMessage[],
  ragContext?: string
): Promise<ReadableStream<string>> {
  const fullSystemPrompt = ragContext
    ? `${systemPrompt}\n\nQo'shimcha ma'lumot (bilimlar bazasidan):\n${ragContext}`
    : systemPrompt;

  const groqMessages = [
    { role: "system" as const, content: fullSystemPrompt },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: groqMessages,
    max_tokens: 2048,
    stream: true,
  });

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) {
          controller.enqueue(text);
        }
      }
      controller.close();
    },
  });
}

export async function chat(
  provider: "gemini" | "groq",
  systemPrompt: string,
  messages: AIMessage[],
  ragContext?: string
): Promise<ReadableStream<string>> {
  if (provider === "groq") {
    return chatWithGroq(systemPrompt, messages, ragContext);
  }
  return chatWithGemini(systemPrompt, messages, ragContext);
}
