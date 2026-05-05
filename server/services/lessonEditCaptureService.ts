// Captures the diff between an AI-generated lesson and what the teacher
// actually saved. Per-section breakdown lets us learn which parts get
// rewritten most often. Default-on for individuals; opt-out per organization
// via lesson_ai_org_settings.

import { storage } from "../storage";

type LessonShape = {
  title?: string;
  objectives?: string[];
  essentialQuestions?: string[];
  activities?: Array<{ title?: string; description?: string }>;
  materials?: string[];
  assessment?: string;
  reflection?: string;
};

export async function captureEdit(args: {
  lessonId: string;
  userId: string;
  generatedPlan: any;
  savedPlan: any;
  orgId?: string | null;
}): Promise<void> {
  try {
    if (args.orgId) {
      const settings = await storage.getLessonAiOrgSettings(args.orgId);
      if (settings && !settings.editCaptureEnabled) return; // org opted out
    }

    const before = normalize(args.generatedPlan);
    const after = normalize(args.savedPlan);
    const sectionEdits: Record<string, { before: string; after: string; charsChanged: number }> = {};
    let total = 0;

    for (const key of Object.keys(after) as Array<keyof typeof after>) {
      const b = (before as any)[key] ?? "";
      const a = (after as any)[key] ?? "";
      if (b !== a) {
        const charsChanged = Math.abs(a.length - b.length) + countDiffChars(b, a);
        sectionEdits[key] = { before: b, after: a, charsChanged };
        total += charsChanged;
      }
    }

    if (total === 0) return; // no meaningful change

    await storage.createLessonEditSignal({
      lessonId: args.lessonId,
      userId: args.userId,
      orgId: args.orgId ?? null,
      sectionEdits,
      totalCharsChanged: total,
    });
  } catch (err) {
    console.warn("[lessonEditCaptureService] capture failed (non-fatal):", (err as Error).message);
  }
}

function normalize(plan: any): Record<string, string> {
  if (!plan || typeof plan !== "object") return {};
  const p = plan as LessonShape;
  return {
    title: p.title ?? "",
    objectives: (p.objectives ?? []).join("\n"),
    essentialQuestions: (p.essentialQuestions ?? []).join("\n"),
    activities: (p.activities ?? []).map((a) => `${a.title ?? ""}: ${a.description ?? ""}`).join("\n"),
    materials: (p.materials ?? []).join("\n"),
    assessment: p.assessment ?? "",
    reflection: p.reflection ?? "",
  };
}

function countDiffChars(a: string, b: string): number {
  // Cheap proxy: length of common-prefix mismatch + suffix mismatch.
  // Not a true Levenshtein, but sufficient signal for "how much changed."
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  let j = 0;
  while (j < a.length - i && j < b.length - i && a[a.length - 1 - j] === b[b.length - 1 - j]) j++;
  return Math.max(a.length - i - j, b.length - i - j);
}
