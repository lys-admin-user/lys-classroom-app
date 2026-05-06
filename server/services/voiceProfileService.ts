// Voice profile service — infuses LYS Master Teacher tone/intent/style into
// AI lesson and assignment generation.
//
// Two layers:
//   (1) STATIC_VOICE_RUBRIC — distilled rules from voice_master_teacher.txt
//       that always go into the prompt (anti-AI tells + master-teacher traits).
//   (2) Dynamic snippets — top-K cosine-similar canon entries of kind=voice or
//       exemplar_full, lazily embedded on first retrieval.
//
// Gated by the `new_lesson_retrieval` feature flag at the call sites
// (server/openai.ts and server/assignmentGenerator.ts). Always returns the
// static block even when retrieval fails so the voice always reaches the model.

import { storage } from "../storage";
import { embedText, rankByEmbedding } from "./embeddingService";
import type { LysCanonEntry } from "@shared/schema";

const VOICE_KINDS = ["voice", "exemplar_full"] as const;
const TOP_K = 3;

const STATIC_VOICE_RUBRIC = `

=== LYS MASTER TEACHER VOICE (mandatory tone) ===

AVOID these AI-writing tells:
- The Hedge: do not stay neutral with "It is important to remember…" / "On the other hand…" filler. Take a position.
- Uniform sentence length: do not produce a rhythmic drone. Vary cadence.
- Predictable transitions: avoid leaning on "Furthermore," "In addition," "Moreover," "In conclusion."
- Hallucinated authority: when unsure of a standards code or fact, omit it rather than fabricate.
- Generic corporate-speak: replace clichés with in-the-trenches classroom specifics.

DO write like a Master Teacher:
- Vulnerability hook: open with a real, sometimes failed, classroom moment ("I tried teaching this last year and bombed — here's what I changed").
- Spiky POV: lessons reflect a defensible point of view; do not neuter to seem balanced.
- Tactical specificity: replace "engage students" with sensory, executable directions ("have students stand up and find someone wearing the same color shoes to start the discussion").
- Rhythmic variance: short. Short. Then a 20-word sentence that earns its length. Use fragments for emphasis.
- Recursive callbacks: refer back to an earlier image, joke, or detail so the lesson feels like a story, not a list.

EMOTIONAL INTENT: warm, direct, a little contrarian. The goal is to make the student more alive, more curious, more capable — not just compliant. The lesson should make a teacher feel recognition or aspiration when they read it.
=== END VOICE RUBRIC ===`;

const ASSIGNMENT_OVERLAY = `

ASSIGNMENT-SPECIFIC VOICE NOTES:
- Stems are tighter than lesson prose. Keep the spiky POV in the stimulus, not in the question stem itself.
- Distractor feedback should sound like a real teacher leaning over the student's shoulder ("you went for B because of X — here's what to notice instead"), not like an answer key.
- Reflection prompts should invite a stance, not just a summary. "What would you defend, and why?" beats "Summarize what you learned."
- Maintain rhythmic variance across questions — mix short tactical items with one or two longer scenario items.`;

let _staticCorpusCache: { snippets: LysCanonEntry[]; at: number } | null = null;
const CACHE_TTL_MS = 60_000;

async function getCandidateSnippets(): Promise<LysCanonEntry[]> {
  if (_staticCorpusCache && Date.now() - _staticCorpusCache.at < CACHE_TTL_MS) {
    return _staticCorpusCache.snippets;
  }
  try {
    const all = await Promise.all(
      VOICE_KINDS.map((k) => storage.listLysCanonEntries({ kind: k, isActive: true })),
    );
    const flat = all.flat();
    _staticCorpusCache = { snippets: flat, at: Date.now() };
    return flat;
  } catch (err) {
    console.warn("[voiceProfileService] candidate fetch failed:", (err as Error).message);
    return [];
  }
}

export interface VoiceBlockResult {
  block: string;
  snippetIds: string[];
}

export async function buildVoiceBlock(args: {
  topic: string;
  subject: string;
  gradeLevel: string;
  mode: "lesson" | "assignment";
}): Promise<VoiceBlockResult> {
  const overlay = args.mode === "assignment" ? ASSIGNMENT_OVERLAY : "";
  let snippetBlock = "";
  let snippetIds: string[] = [];

  try {
    const candidates = await getCandidateSnippets();
    if (candidates.length === 0) {
      return { block: STATIC_VOICE_RUBRIC + overlay, snippetIds: [] };
    }

    const queryText = `${args.topic} ${args.subject} grade ${args.gradeLevel}`.trim();
    const queryEmb = await embedText(queryText);
    if (!queryEmb) {
      // Embedding failed — fall back to first N entries by sortOrder (deterministic)
      const fallback = [...candidates]
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .slice(0, TOP_K);
      snippetBlock = renderSnippets(fallback);
      snippetIds = fallback.map((s) => s.id);
      return { block: STATIC_VOICE_RUBRIC + snippetBlock + overlay, snippetIds };
    }

    // Lazy-embed any candidates missing embeddings.
    await Promise.all(
      candidates.map(async (c) => {
        if (!c.embedding || (Array.isArray(c.embedding) && c.embedding.length === 0)) {
          const emb = await embedText(c.body);
          if (emb) {
            try {
              await storage.setLysCanonEntryEmbedding(c.id, emb);
            } catch {
              /* non-fatal */
            }
            c.embedding = emb;
          }
        }
      }),
    );

    const ranked = rankByEmbedding(queryEmb, candidates, TOP_K);
    if (ranked.length === 0) {
      return { block: STATIC_VOICE_RUBRIC + overlay, snippetIds: [] };
    }

    snippetBlock = renderSnippets(ranked);
    snippetIds = ranked.map((s) => s.id);
    return { block: STATIC_VOICE_RUBRIC + snippetBlock + overlay, snippetIds };
  } catch (err) {
    console.warn("[voiceProfileService] buildVoiceBlock error, returning static rubric only:", (err as Error).message);
    return { block: STATIC_VOICE_RUBRIC + overlay, snippetIds };
  }
}

function renderSnippets(snippets: LysCanonEntry[]): string {
  const trimmed = snippets.map((s) => {
    const body = s.body.length > 1200 ? s.body.slice(0, 1200) + "…" : s.body;
    return `--- ${s.title} (${s.kind}${s.subject ? `, ${s.subject}` : ""}) ---\n${body}`;
  }).join("\n\n");
  return `\n\nLYS VOICE EXEMPLARS (semantically retrieved — emulate the cadence, vulnerability, and tactical specificity, do not copy verbatim):\n${trimmed}`;
}

export function clearVoiceCorpusCache(): void {
  _staticCorpusCache = null;
}
