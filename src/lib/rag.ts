import { GoogleGenAI } from "@google/genai";
import { prisma } from "./db";

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Generate embedding for text using Gemini
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await gemini.models.embedContent({
    model: "text-embedding-004",
    contents: text,
  });
  return response.embeddings?.[0]?.values ?? [];
}

// Add document to bot's knowledge base
export async function addDocument(
  botId: string,
  title: string,
  content: string,
  sourceUrl?: string
) {
  const embedding = await generateEmbedding(content);

  // Use raw SQL for vector insert since Prisma doesn't support vector type natively
  await prisma.$executeRawUnsafe(
    `INSERT INTO documents (id, bot_id, title, content, embedding, source_url, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4::vector, $5, NOW())`,
    botId,
    title,
    content,
    `[${embedding.join(",")}]`,
    sourceUrl || null
  );
}

// Search relevant documents for a query
export async function searchDocuments(
  botId: string,
  query: string,
  limit: number = 3
): Promise<{ title: string; content: string; similarity: number }[]> {
  const queryEmbedding = await generateEmbedding(query);

  const results = await prisma.$queryRawUnsafe<
    { title: string; content: string; similarity: number }[]
  >(
    `SELECT title, content,
            1 - (embedding <=> $1::vector) as similarity
     FROM documents
     WHERE bot_id = $2
       AND embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $3`,
    `[${queryEmbedding.join(",")}]`,
    botId,
    limit
  );

  return results;
}

// Build RAG context from search results
export async function getRagContext(
  botId: string,
  query: string
): Promise<string | undefined> {
  try {
    const docs = await searchDocuments(botId, query);

    if (docs.length === 0) return undefined;

    // Only use documents with decent similarity
    const relevant = docs.filter((d) => d.similarity > 0.5);
    if (relevant.length === 0) return undefined;

    return relevant
      .map((d) => `[${d.title}]\n${d.content}`)
      .join("\n\n---\n\n");
  } catch {
    // If pgvector not set up yet or no documents, gracefully return undefined
    return undefined;
  }
}
