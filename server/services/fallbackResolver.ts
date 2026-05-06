// Fallback resolver — when OpenAI is unreachable (no key, network error, rate
// limit, etc.) we serve the closest available real content instead of the
// typo-laden mock template that previously echoed user input verbatim.
//
// Cascade:
//   1. Cache: prior successful generation matching topic + grade (+ assignment
//      type for assignments). Marked as fallbackSource='cache'.
//   2. Exemplar: top cosine-similar `exemplar_full` canon entry, adapted into
//      the expected output shape. Marked as fallbackSource='exemplar'.
//   3. Throw GenerationFallbackError so the route returns a clear actionable
//      error to the client (never serve fake content).

import crypto from "crypto";
import { db } from "../db";
import { lessonPlanCache, assignmentGenerationAttribution, type GenerateLessonRequest } from "@shared/schema";
import { and, eq, ilike, isNotNull, desc } from "drizzle-orm";
import { storage } from "../storage";
import { embedText, rankByEmbedding } from "./embeddingService";

export type FallbackSource = "cache" | "exemplar";

export interface FallbackResult<T> {
  content: T & { fallbackSource: FallbackSource; warning: string };
  fallbackSource: FallbackSource;
  warning: string;
}

export class GenerationFallbackError extends Error {
  constructor(message: string, public readonly hint?: string) {
    super(message);
    this.name = "GenerationFallbackError";
  }
}

const CACHE_WARNING =
  "Live AI was unavailable, so we served the closest match from your prior generations. Try regenerating in a moment for a fresh, personalized version.";
const EXEMPLAR_WARNING =
  "Live AI was unavailable, so we're showing a Master Teacher reference example on a related topic — not a personalized lesson. Try again shortly for a generation tailored to your exact request.";

// ---------- Lesson fallback ----------

export async function resolveFallbackLesson(
  request: GenerateLessonRequest,
): Promise<FallbackResult<any>> {
  // 1. Cache lookup — most-recent matching topic + grade (loose match by ilike).
  try {
    const topicLike = `%${request.topic.slice(0, 40)}%`;
    const [hit] = await db
      .select()
      .from(lessonPlanCache)
      .where(
        and(
          ilike(lessonPlanCache.topic, topicLike),
          eq(lessonPlanCache.gradeLevel, request.gradeLevel),
        ),
      )
      .orderBy(desc(lessonPlanCache.createdAt))
      .limit(1);
    if (hit?.generatedPlan) {
      const plan: any = { ...(hit.generatedPlan as any), id: crypto.randomUUID() };
      return {
        content: { ...plan, fallbackSource: "cache", warning: CACHE_WARNING },
        fallbackSource: "cache",
        warning: CACHE_WARNING,
      };
    }
  } catch (err) {
    console.warn("[fallbackResolver] lesson cache lookup failed:", (err as Error).message);
  }

  // 2. Exemplar adaptation
  const exemplarBody = await getTopExemplarBody(`${request.topic} grade ${request.gradeLevel}`);
  if (exemplarBody) {
    const adapted = adaptExemplarToLessonShape(request, exemplarBody);
    return {
      content: { ...adapted, fallbackSource: "exemplar", warning: EXEMPLAR_WARNING },
      fallbackSource: "exemplar",
      warning: EXEMPLAR_WARNING,
    };
  }

  // 3. Hard error
  throw new GenerationFallbackError(
    "We can't reach the AI right now and don't have a cached lesson for this topic to fall back on. Please try again in a moment.",
    "openai_unreachable_no_cache",
  );
}

// ---------- Assignment fallback ----------

export async function resolveFallbackAssignment(
  request: { lesson: { topic?: string | null; gradeLevel?: string | null; title?: string }; assignmentType: string },
): Promise<FallbackResult<any>> {
  // 1. Cache lookup against assignment_generation_attribution.generatedContent
  try {
    const topic = request.lesson.topic || request.lesson.title || "";
    const grade = request.lesson.gradeLevel || "";
    if (topic && grade) {
      const [hit] = await db
        .select()
        .from(assignmentGenerationAttribution)
        .where(
          and(
            ilike(assignmentGenerationAttribution.topic, `%${topic.slice(0, 40)}%`),
            eq(assignmentGenerationAttribution.gradeLevel, grade),
            eq(assignmentGenerationAttribution.assignmentType, request.assignmentType),
            isNotNull(assignmentGenerationAttribution.generatedContent),
          ),
        )
        .orderBy(desc(assignmentGenerationAttribution.createdAt))
        .limit(1);
      if (hit?.generatedContent) {
        return {
          content: { ...(hit.generatedContent as any), fallbackSource: "cache", warning: CACHE_WARNING },
          fallbackSource: "cache",
          warning: CACHE_WARNING,
        };
      }
    }
  } catch (err) {
    console.warn("[fallbackResolver] assignment cache lookup failed:", (err as Error).message);
  }

  // 2. Exemplar
  const exemplarBody = await getTopExemplarBody(`${request.lesson.topic ?? ""} ${request.assignmentType}`);
  if (exemplarBody) {
    const adapted = adaptExemplarToAssignmentShape(request, exemplarBody);
    return {
      content: { ...adapted, fallbackSource: "exemplar", warning: EXEMPLAR_WARNING },
      fallbackSource: "exemplar",
      warning: EXEMPLAR_WARNING,
    };
  }

  throw new GenerationFallbackError(
    "We can't reach the AI right now and don't have a cached assignment to fall back on. Please try again in a moment.",
    "openai_unreachable_no_cache",
  );
}

// ---------- Helpers ----------

async function getTopExemplarBody(query: string): Promise<string | null> {
  try {
    const candidates = await storage.listLysCanonEntries({ kind: "exemplar_full", isActive: true });
    if (candidates.length === 0) return null;
    const queryEmb = await embedText(query);
    if (queryEmb) {
      const ranked = rankByEmbedding(queryEmb, candidates as any, 1) as any[];
      if (ranked[0]?.body) return ranked[0].body as string;
    }
    // Embedding unavailable — deterministic fallback by sortOrder
    const sorted = [...candidates].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return sorted[0]?.body ?? null;
  } catch (err) {
    console.warn("[fallbackResolver] exemplar lookup failed:", (err as Error).message);
    return null;
  }
}

function adaptExemplarToLessonShape(request: GenerateLessonRequest, exemplarBody: string): any {
  const trimmed = exemplarBody.length > 4000 ? exemplarBody.slice(0, 4000) + "…" : exemplarBody;
  return {
    id: crypto.randomUUID(),
    title: `Reference Example: ${request.topic}`,
    topic: request.topic,
    course: request.course,
    unit: request.unit,
    gradeLevel: request.gradeLevel,
    bkdFocus: request.bkdFocus,
    standards: request.standards,
    duration: request.duration ?? "45 minutes",
    lessonPart: request.lessonPart,
    objectives: [
      "This is a Master Teacher reference example, not a personalized generation.",
      "Adapt the framing and rhythm below to your topic and class.",
    ],
    essentialQuestions: ["What does this exemplar teach you about LYS lesson craft?"],
    lysMethodology: {
      be: { focus: "Reference", description: "See exemplar text below." },
      know: { focus: "Reference", description: "See exemplar text below." },
      do: { focus: "Reference", description: "See exemplar text below." },
    },
    resources: [],
    synchronousInstruction: {
      anticipatorySet: "See exemplar text below.",
      modeling: "See exemplar text below.",
      guidedPractice: "See exemplar text below.",
      independentPractice: "See exemplar text below.",
    },
    activities: [],
    materials: [],
    assessment: trimmed,
    lessonClose: {
      educational: "Reference example — regenerate when AI is available for a personalized close.",
    },
    reflection: "Try regenerating in a moment for a lesson tailored to your exact topic.",
  };
}

function adaptExemplarToAssignmentShape(
  request: { lesson: { topic?: string | null; title?: string }; assignmentType: string },
  exemplarBody: string,
): any {
  const trimmed = exemplarBody.length > 3000 ? exemplarBody.slice(0, 3000) + "…" : exemplarBody;
  return {
    title: `Reference Example: ${request.lesson.topic ?? request.lesson.title ?? "Assignment"}`,
    description:
      "This is a Master Teacher reference example, not a personalized assignment. Use the rhythm and stance below as inspiration.",
    instructions: trimmed,
    questions: [],
    totalPoints: 0,
    accommodationModified: false,
    accommodationTypes: [],
    accommodationNotes: "",
    worksheet: null,
    accommodationChecklist: [],
  };
}
