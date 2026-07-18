// Voice critic post-pass — runs after generation to detect AI-ish tells and
// optionally rewrite the output in LYS Master Teacher voice.
//
// One additional OpenAI call per generation (gpt-5-mini for cost). Returns
// the original content if scoring is acceptable or the rewrite fails — never
// breaks the generation pipeline.

import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const THRESHOLD = (() => {
  const env = parseInt(process.env.VOICE_CRITIC_THRESHOLD || "", 10);
  return Number.isFinite(env) && env >= 0 && env <= 100 ? env : 80;
})();

export interface VoiceCriticResult<T = any> {
  voiceScore: number | null; // 0-100; null = critic skipped (no API key, error)
  tellsDetected: string[];
  rewritten: boolean;
  finalContent: T;
  notes?: string;
  // OpenAI token usage for this critic call (null when skipped/errored) so the
  // caller can fold it into per-generation cost tracking.
  usage?: { model: string; prompt_tokens: number; completion_tokens: number } | null;
}

const CRITIC_MODEL = "gpt-5-mini";

const RUBRIC_PROMPT = `You are the LYS Voice Auditor. You evaluate generated educational content against the LYS Master Teacher voice rubric.

SCORE 0-100 across these dimensions (equal weight):
1. Stance & spiky POV (vs hedging/neutrality)
2. Vulnerability hook / real classroom moment present
3. Tactical specificity (sensory, executable detail) vs generic corporate-speak
4. Rhythmic variance (mix of short and long sentences) vs uniform drone
5. Absence of AI tells: "Furthermore," "In addition," "Moreover," "In conclusion," "It is important to remember," hallucinated standards codes, perfect-but-hollow grammar

Return ONLY a JSON object with this exact shape:
{
  "voiceScore": 0-100 integer,
  "tellsDetected": ["short label per tell found"],
  "notes": "one-sentence summary",
  "rewrite": null  // OR if voiceScore < 80, the rewritten content matching the EXACT same JSON schema as the input, preserving all factual content, standards alignment, and structure — only the prose voice changes
}`;

export async function critiqueAndMaybeRewrite<T>(
  content: T,
  ctx: { topic: string; subject: string; gradeLevel: string; mode: "lesson" | "assignment" },
): Promise<VoiceCriticResult<T>> {
  if (!openai) {
    return { voiceScore: null, tellsDetected: [], rewritten: false, finalContent: content };
  }

  try {
    const userPayload = {
      mode: ctx.mode,
      topic: ctx.topic,
      subject: ctx.subject,
      gradeLevel: ctx.gradeLevel,
      content,
    };

    const res = await openai.chat.completions.create({
      model: CRITIC_MODEL,
      messages: [
        { role: "system", content: RUBRIC_PROMPT },
        { role: "user", content: JSON.stringify(userPayload).slice(0, 30000) },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 4000,
      reasoning_effort: "minimal",
    });

    const usage = {
      model: CRITIC_MODEL,
      prompt_tokens: res.usage?.prompt_tokens ?? 0,
      completion_tokens: res.usage?.completion_tokens ?? 0,
    };

    const raw = res.choices[0]?.message?.content;
    if (!raw) {
      return { voiceScore: null, tellsDetected: [], rewritten: false, finalContent: content, usage };
    }

    const parsed = JSON.parse(raw) as {
      voiceScore?: number;
      tellsDetected?: string[];
      notes?: string;
      rewrite?: T | null;
    };
    const voiceScore = typeof parsed.voiceScore === "number" ? Math.max(0, Math.min(100, Math.round(parsed.voiceScore))) : null;
    const tellsDetected = Array.isArray(parsed.tellsDetected) ? parsed.tellsDetected.slice(0, 8) : [];
    const notes = typeof parsed.notes === "string" ? parsed.notes.slice(0, 280) : undefined;

    // Only accept the rewrite if the model actually returned one AND score is below threshold
    if (
      voiceScore !== null &&
      voiceScore < THRESHOLD &&
      parsed.rewrite &&
      typeof parsed.rewrite === "object"
    ) {
      // Defensive: preserve the original id field if present so callers' downstream
      // logic (cache keys, attribution) doesn't change identity.
      const merged = mergePreservingIds(content, parsed.rewrite);
      return {
        voiceScore,
        tellsDetected,
        rewritten: true,
        finalContent: merged as T,
        notes,
        usage,
      };
    }

    return {
      voiceScore,
      tellsDetected,
      rewritten: false,
      finalContent: content,
      notes,
      usage,
    };
  } catch (err) {
    console.warn("[voiceCriticService] error (non-fatal):", (err as Error).message);
    return { voiceScore: null, tellsDetected: [], rewritten: false, finalContent: content };
  }
}

function mergePreservingIds<T>(original: T, rewrite: any): any {
  if (!original || typeof original !== "object" || !rewrite || typeof rewrite !== "object") {
    return rewrite;
  }
  const out: any = { ...rewrite };
  // Preserve top-level id, standards, and any other non-prose keys explicitly.
  const preserve = ["id", "standards", "cacheHit"];
  for (const k of preserve) {
    if ((original as any)[k] !== undefined) out[k] = (original as any)[k];
  }
  return out;
}

export const VOICE_CRITIC_THRESHOLD = THRESHOLD;
