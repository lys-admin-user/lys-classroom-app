// New semantic-retrieval service for the Bricks/BKD lesson generator.
// Replaces the old SQL-filter-based getMasterLessonExamples with:
//   1. semantic similarity over OpenAI embeddings,
//   2. score-weighted candidate filtering (qualityScore >= 85),
//   3. per-section "highlight reel" assembly (best objectives + best BKD blocks
//      from across multiple master lessons, not 3 full transcripts),
//   4. attribution data so we can learn which exemplars actually move the score.
//
// Lazy-embeds candidates on first use — no upfront batch cost.

import { storage } from "../storage";
import { embedText, rankByEmbedding } from "./embeddingService";
import type { MasterLesson, MasterLessonSection } from "@shared/schema";

export interface RetrievalResult {
  block: string; // text to inject into the AI prompt
  attribution: {
    masterLessonIds: string[];
    sectionIds: string[];
    mode: "semantic" | "legacy_fallback";
  };
}

const MIN_QUALITY_SCORE = 85;
const TOP_K_LESSONS = 3;
const SECTION_TYPES_TO_HIGHLIGHT = ["objectives", "bkd_be", "bkd_know", "bkd_do", "essential_questions", "close"];

export async function retrieveExamples(args: {
  topic: string;
  subject: string;
  gradeLevel: string;
  bkdFocus?: string;
}): Promise<RetrievalResult> {
  try {
    const queryText = `${args.topic} ${args.subject} grade ${args.gradeLevel} ${args.bkdFocus ?? ""}`.trim();
    const queryEmb = await embedText(queryText);

    if (!queryEmb) {
      return await legacyFallback(args);
    }

    const candidates = await storage.getMasterLessonsForRetrieval({
      subject: normalizeSubject(args.subject),
      minScore: MIN_QUALITY_SCORE,
      limit: 50,
    });

    if (candidates.length === 0) {
      return await legacyFallback(args);
    }

    // Lazy-embed candidates that don't have an embedding yet.
    await Promise.all(
      candidates.map(async (c) => {
        if (!c.embedding || (Array.isArray(c.embedding) && c.embedding.length === 0)) {
          const text = lessonToEmbedText(c);
          const emb = await embedText(text);
          if (emb) {
            await storage.setMasterLessonEmbedding(c.id, emb);
            c.embedding = emb;
          }
        }
      }),
    );

    const ranked = rankByEmbedding(queryEmb, candidates, TOP_K_LESSONS);
    if (ranked.length === 0) {
      return await legacyFallback(args);
    }

    // Try a per-section highlight reel: for each tracked section type, pull
    // the highest-similarity section from the top candidates. Falls back to
    // emitting a compact lesson summary when no per-section data exists.
    const lessonIds = ranked.map((l) => l.id);
    const allSections: MasterLessonSection[] = [];
    for (const type of SECTION_TYPES_TO_HIGHLIGHT) {
      const sections = await storage.getMasterLessonSectionsByType(type, lessonIds);
      if (sections.length === 0) continue;
      // Lazy-embed missing sections
      await Promise.all(
        sections.map(async (s) => {
          if (!s.embedding || (Array.isArray(s.embedding) && s.embedding.length === 0)) {
            const emb = await embedText(s.content);
            if (emb) {
              await storage.setMasterLessonSectionEmbedding(s.id, emb);
              s.embedding = emb;
            }
          }
        }),
      );
      const top = rankByEmbedding(queryEmb, sections, 1);
      if (top.length > 0) allSections.push(top[0]);
    }

    const block = assembleBlock(ranked, allSections);
    return {
      block,
      attribution: {
        masterLessonIds: ranked.map((l) => l.id),
        sectionIds: allSections.map((s) => s.id),
        mode: "semantic",
      },
    };
  } catch (err) {
    console.warn("[lessonRetrievalService] error, falling back to legacy:", (err as Error).message);
    return await legacyFallback(args);
  }
}

async function legacyFallback(args: { subject: string; gradeLevel: string }): Promise<RetrievalResult> {
  try {
    const lessons = await storage.getMasterLessons({
      status: "approved",
      subject: normalizeSubject(args.subject),
      limit: 3,
    });
    if (lessons.length === 0) return { block: "", attribution: { masterLessonIds: [], sectionIds: [], mode: "legacy_fallback" } };
    const block = `

REFERENCE EXAMPLES (Distinguished-level lessons to emulate):
${lessons.map((lesson, i) => `
Example ${i + 1}: "${lesson.title}"
- Objectives: ${(lesson.objectives as string[]).slice(0, 2).join("; ")}
- BKD Focus: ${lesson.bkdFocus}
- Quality Score: ${lesson.qualityScore || 90}%
`).join("")}
Emulate the quality and structure of these approved lessons.`;
    return {
      block,
      attribution: { masterLessonIds: lessons.map((l) => l.id), sectionIds: [], mode: "legacy_fallback" },
    };
  } catch {
    return { block: "", attribution: { masterLessonIds: [], sectionIds: [], mode: "legacy_fallback" } };
  }
}

function lessonToEmbedText(lesson: MasterLesson): string {
  const objectives = Array.isArray(lesson.objectives) ? (lesson.objectives as string[]).join("; ") : "";
  const activities = Array.isArray(lesson.activities)
    ? (lesson.activities as Array<{ title: string; description: string }>).map((a) => `${a.title}: ${a.description}`).join("\n")
    : "";
  return [
    lesson.title,
    lesson.description ?? "",
    `Topic: ${lesson.topic}`,
    `Subject: ${lesson.subject}`,
    `Grade: ${lesson.gradeLevel}`,
    `BKD Focus: ${lesson.bkdFocus}`,
    `Objectives: ${objectives}`,
    `Activities: ${activities}`,
    `Assessment: ${lesson.assessment}`,
  ].filter(Boolean).join("\n");
}

function assembleBlock(lessons: Array<MasterLesson & { _score: number }>, sections: MasterLessonSection[]): string {
  const lessonSummary = lessons.map((l, i) => {
    const objs = Array.isArray(l.objectives) ? (l.objectives as string[]).slice(0, 2).join("; ") : "";
    return `Example ${i + 1}: "${l.title}" (similarity ${(l._score * 100).toFixed(0)}%, quality ${l.qualityScore ?? 0}%)
  Objectives: ${objs}
  BKD Focus: ${l.bkdFocus}`;
  }).join("\n\n");

  const sectionHighlights = sections.length > 0
    ? `\n\nSECTION HIGHLIGHTS (best of class for each part of the lesson):\n${sections.map((s) => `[${s.sectionType}] ${s.content.slice(0, 600)}`).join("\n\n")}`
    : "";

  return `

REFERENCE EXAMPLES (semantically retrieved, Distinguished-level lessons to emulate):
${lessonSummary}${sectionHighlights}

Emulate the quality, structure, and depth of these approved lessons. Do not copy content verbatim.`;
}

function normalizeSubject(subject: string): string {
  const s = (subject || "").toLowerCase();
  if (s.includes("math")) return "math";
  if (s.includes("ela") || s.includes("english")) return "ela";
  if (s.includes("science")) return "science";
  if (s.includes("social") || s.includes("history")) return "social_studies";
  return subject;
}
