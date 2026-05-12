import OpenAI from "openai";

const directKey = process.env.OPENAI_DIRECT_API_KEY;
const embeddingsClient: OpenAI | null = directKey
  ? new OpenAI({ apiKey: directKey })
  : process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;
const usingProxiedClient = !directKey && !!process.env.OPENAI_BASE_URL;

const MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMS = 1536;

let embeddingsDisabled = false;
let warnedDisabled = false;

export async function embedText(text: string): Promise<number[] | null> {
  if (embeddingsDisabled) return null;
  if (!embeddingsClient || !text || text.trim().length === 0) return null;
  try {
    const trimmed = text.length > 8000 ? text.slice(0, 8000) : text;
    const res = await embeddingsClient.embeddings.create({ model: MODEL, input: trimmed });
    return res.data[0]?.embedding ?? null;
  } catch (err) {
    const msg = (err as Error).message || "";
    if (msg.includes("not supported") || msg.includes("404")) {
      embeddingsDisabled = true;
      if (!warnedDisabled) {
        warnedDisabled = true;
        console.warn(
          "[embeddingService] Embeddings endpoint not supported by current OpenAI base URL" +
          (usingProxiedClient ? " (Replit AI integration)." : ".") +
          " Semantic retrieval will be skipped." +
          " Set OPENAI_DIRECT_API_KEY (a direct OpenAI key) to enable.",
        );
      }
      return null;
    }
    console.warn("[embeddingService] embedText failed:", msg);
    return null;
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export function rankByEmbedding<T extends { embedding?: number[] | null }>(
  query: number[],
  items: T[],
  limit: number = 5,
): Array<T & { _score: number }> {
  const scored = items
    .filter((i) => Array.isArray(i.embedding) && i.embedding.length === query.length)
    .map((i) => ({ ...i, _score: cosineSimilarity(query, i.embedding as number[]) }));
  scored.sort((a, b) => b._score - a._score);
  return scored.slice(0, limit);
}
