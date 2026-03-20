import { GoogleGenAI } from "@google/genai";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "./db";

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Generate embedding for text using Gemini
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await gemini.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
  });
  return response.embeddings?.[0]?.values ?? [];
}

// Split text into chunks of ~maxWords words with overlap
export function chunkText(text: string, maxWords: number = 800, overlapWords: number = 50): string[] {
  const words = text.split(/\s+/).filter(Boolean);

  // If text is small enough, no chunking needed
  if (words.length <= maxWords) {
    return [text.trim()];
  }

  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;

  for (const paragraph of paragraphs) {
    const paragraphWords = paragraph.split(/\s+/).filter(Boolean);
    const paragraphWordCount = paragraphWords.length;

    // If single paragraph exceeds max, split by sentences
    if (paragraphWordCount > maxWords) {
      // Flush current chunk first
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join("\n\n").trim());
        // Keep overlap from end of current chunk
        const overlapText = currentChunk.join("\n\n").split(/\s+/).slice(-overlapWords).join(" ");
        currentChunk = overlapText ? [overlapText] : [];
        currentWordCount = overlapText ? overlapWords : 0;
      }

      // Split large paragraph by sentences
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      let sentenceChunk: string[] = [];
      let sentenceWordCount = 0;

      for (const sentence of sentences) {
        const sWords = sentence.split(/\s+/).filter(Boolean).length;
        if (sentenceWordCount + sWords > maxWords && sentenceChunk.length > 0) {
          chunks.push(sentenceChunk.join(" ").trim());
          // Overlap
          const overlap = sentenceChunk.join(" ").split(/\s+/).slice(-overlapWords).join(" ");
          sentenceChunk = overlap ? [overlap, sentence] : [sentence];
          sentenceWordCount = (overlap ? overlapWords : 0) + sWords;
        } else {
          sentenceChunk.push(sentence);
          sentenceWordCount += sWords;
        }
      }
      if (sentenceChunk.length > 0) {
        currentChunk.push(sentenceChunk.join(" ").trim());
        currentWordCount = sentenceWordCount;
      }
      continue;
    }

    // Normal paragraph — add to current chunk
    if (currentWordCount + paragraphWordCount > maxWords && currentChunk.length > 0) {
      chunks.push(currentChunk.join("\n\n").trim());
      // Keep overlap
      const overlapText = currentChunk.join("\n\n").split(/\s+/).slice(-overlapWords).join(" ");
      currentChunk = overlapText ? [overlapText, paragraph] : [paragraph];
      currentWordCount = (overlapText ? overlapWords : 0) + paragraphWordCount;
    } else {
      currentChunk.push(paragraph);
      currentWordCount += paragraphWordCount;
    }
  }

  // Flush remaining
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join("\n\n").trim());
  }

  return chunks.filter((c) => c.trim().length > 0);
}

// Add document with automatic chunking for large texts
export async function addDocumentWithChunking(
  botId: string,
  title: string,
  content: string,
  sourceUrl?: string
): Promise<number> {
  const chunks = chunkText(content);

  if (chunks.length === 1) {
    // Small text — no chunking, add as single document
    await addDocument(botId, title, chunks[0], sourceUrl);
    return 1;
  }

  // Multiple chunks — generate all embeddings first, then batch insert
  const insertedIds: string[] = [];
  try {
    for (let i = 0; i < chunks.length; i++) {
      const chunkTitle = `${title} [${i + 1}/${chunks.length}]`;
      const embedding = await generateEmbedding(chunks[i]);
      const vectorStr = `[${embedding.join(",")}]`;
      const result = await prisma.$queryRaw<{ id: string }[]>(
        Prisma.sql`INSERT INTO documents (id, bot_id, title, content, embedding, source_url, created_at)
         VALUES (gen_random_uuid(), ${botId}, ${chunkTitle}, ${chunks[i]}, ${vectorStr}::vector, ${sourceUrl ?? null}, NOW())
         RETURNING id`
      );
      if (result[0]?.id) insertedIds.push(result[0].id);
    }
  } catch (error) {
    // Rollback: delete any chunks that were already inserted
    if (insertedIds.length > 0) {
      try {
        await prisma.$executeRaw(
          Prisma.sql`DELETE FROM documents WHERE id = ANY(${insertedIds}::text[])`
        );
      } catch (cleanupError) {
        console.error("Chunk cleanup xatosi:", cleanupError);
      }
    }
    throw error;
  }

  return chunks.length;
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
  const vectorStr = `[${embedding.join(",")}]`;
  await prisma.$executeRaw(
    Prisma.sql`INSERT INTO documents (id, bot_id, title, content, embedding, source_url, created_at)
     VALUES (gen_random_uuid(), ${botId}, ${title}, ${content}, ${vectorStr}::vector, ${sourceUrl ?? null}, NOW())`
  );
}

// Search relevant documents for a query
export async function searchDocuments(
  botId: string,
  query: string,
  limit: number = 3
): Promise<{ title: string; content: string; similarity: number }[]> {
  const queryEmbedding = await generateEmbedding(query);

  const vectorStr = `[${queryEmbedding.join(",")}]`;
  const results = await prisma.$queryRaw<
    { title: string; content: string; similarity: number }[]
  >(
    Prisma.sql`SELECT title, content,
            1 - (embedding <=> ${vectorStr}::vector) as similarity
     FROM documents
     WHERE bot_id = ${botId}
       AND embedding IS NOT NULL
     ORDER BY embedding <=> ${vectorStr}::vector
     LIMIT ${limit}`
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
