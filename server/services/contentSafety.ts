import { openai } from "../openai";

// AI content-safety layer for student/teacher free-text that feeds AI generation.
// Two jobs:
//   1. CIPA-style filtering — block obscene / sexual / threatening / graphically
//      violent input from reaching the model or coming back to a student.
//   2. Self-harm / crisis detection — when a user's input signals self-harm or
//      suicidal intent, we do NOT generate; instead we surface crisis resources.
//
// Primary signal is OpenAI's moderation endpoint (omni-moderation-latest). When
// that call is unavailable we fall back to a conservative local keyword/profanity
// scan so the guardrail still catches the most obvious cases. Normal academic
// content (history of war, literature themes, etc.) is intentionally NOT blocked —
// we only act on the severe categories.

export type SafetyAction = "allow" | "block" | "crisis";

export interface SafetyVerdict {
  action: SafetyAction;
  categories: string[];
  message?: string;
}

// US crisis resources surfaced to a user whose input signals self-harm.
export const CRISIS_RESOURCES = {
  headline: "You're not alone, and help is available right now.",
  lines: [
    "Call or text 988 — the Suicide & Crisis Lifeline (24/7, free, confidential).",
    "Text HOME to 741741 — the Crisis Text Line.",
    "If you are in immediate danger, call 911 or go to the nearest emergency room.",
  ],
  note: "Please reach out to a trusted adult, counselor, or one of the resources above. We're not able to generate this, but we want you to be safe.",
};

const CRISIS_MESSAGE =
  "It sounds like you may be going through something really hard. " +
  CRISIS_RESOURCES.lines.join(" ");

const BLOCK_MESSAGE =
  "That request contains content we can't process on a platform used by students. " +
  "Please rephrase it as an academic topic.";

// OpenAI moderation categories that map to a self-harm crisis response.
const CRISIS_CATEGORIES = new Set([
  "self-harm",
  "self-harm/intent",
  "self-harm/instructions",
]);

// Severe categories we block outright. Deliberately excludes the broad
// "violence" and non-threatening "hate" buckets, which fire on legitimate
// history/literature topics; we only block the graphic/threatening/sexual ones.
const BLOCK_CATEGORIES = new Set([
  "sexual",
  "sexual/minors",
  "harassment/threatening",
  "hate/threatening",
  "violence/graphic",
  "illicit/violent",
]);

// Conservative local fallbacks (only used when the moderation API is unreachable).
const SELF_HARM_PATTERNS = [
  /\bkill myself\b/i,
  /\bkilling myself\b/i,
  /\bend my life\b/i,
  /\bwant to die\b/i,
  /\bsuicid/i,
  /\bself[\s-]?harm\b/i,
  /\bcut myself\b/i,
  /\bcutting myself\b/i,
  /\bharm myself\b/i,
  /\bhurt myself\b/i,
];

const PROFANITY_PATTERNS = [
  /\bf+u+c+k+/i,
  /\bs+h+i+t+/i,
  /\bb+i+t+c+h+/i,
  /\bc+u+n+t+/i,
  /\ba+s+s+h+o+l+e+/i,
  /\bn+i+g+g+/i,
  /\bf+a+g+/i,
];

/**
 * Pure mapping from a set of flagged moderation categories to a verdict.
 * Self-harm wins over block wins over allow. Exported for unit testing.
 */
export function classifyFlaggedCategories(flagged: string[]): SafetyVerdict {
  if (flagged.some((c) => CRISIS_CATEGORIES.has(c))) {
    return { action: "crisis", categories: flagged, message: CRISIS_MESSAGE };
  }
  if (flagged.some((c) => BLOCK_CATEGORIES.has(c))) {
    return { action: "block", categories: flagged, message: BLOCK_MESSAGE };
  }
  return { action: "allow", categories: flagged };
}

function localScan(text: string): SafetyVerdict {
  for (const p of SELF_HARM_PATTERNS) {
    if (p.test(text)) {
      return { action: "crisis", categories: ["self-harm"], message: CRISIS_MESSAGE };
    }
  }
  for (const p of PROFANITY_PATTERNS) {
    if (p.test(text)) {
      return { action: "block", categories: ["profanity"], message: BLOCK_MESSAGE };
    }
  }
  return { action: "allow", categories: [] };
}

const SEVERITY: Record<SafetyAction, number> = { allow: 0, block: 1, crisis: 2 };

// Returns whichever verdict is more severe (crisis > block > allow), merging
// the flagged categories so callers can see every signal that fired.
function mostSevere(a: SafetyVerdict, b: SafetyVerdict): SafetyVerdict {
  const winner = SEVERITY[b.action] > SEVERITY[a.action] ? b : a;
  const categories = Array.from(new Set([...a.categories, ...b.categories]));
  return { ...winner, categories };
}

/**
 * Moderate a single piece of user-supplied text. Never throws — on any failure
 * it returns the local-scan verdict so generation can proceed safely.
 *
 * The local profanity/self-harm scan ALWAYS runs (CIPA-style filtering), since
 * OpenAI's moderation has no "profanity" category and would let plain profanity
 * through. When the moderation API is reachable, its verdict is combined with
 * the local scan and the most severe of the two wins.
 */
export async function moderateText(text: string | undefined | null): Promise<SafetyVerdict> {
  const input = (text ?? "").trim();
  if (!input) return { action: "allow", categories: [] };

  const local = localScan(input);

  if (!openai) {
    return local;
  }

  try {
    const result = await openai.moderations.create({
      model: "omni-moderation-latest",
      input,
    });
    const r = result.results?.[0];
    const remote: SafetyVerdict =
      !r || !r.flagged
        ? { action: "allow", categories: [] }
        : classifyFlaggedCategories(
            Object.entries(r.categories || {})
              .filter(([, v]) => v === true)
              .map(([k]) => k),
          );

    return mostSevere(local, remote);
  } catch {
    // Moderation API unreachable — degrade to the conservative local scan rather
    // than hard-failing the user's request.
    return local;
  }
}

/**
 * Moderate several free-text fields together. Returns the most severe verdict
 * (crisis > block > allow). Empty/blank entries are ignored.
 */
export async function moderateUserInput(
  parts: Array<string | undefined | null>,
): Promise<SafetyVerdict> {
  const combined = parts
    .map((p) => (p ?? "").trim())
    .filter((p) => p.length > 0)
    .join("\n");
  return moderateText(combined);
}

/**
 * Map a verdict to an HTTP response, or null when the input is allowed.
 * - crisis -> 200 with crisis resources (treated as a normal payload, not an
 *   error, so the client can render supportive resources instead of failing).
 * - block  -> 422 with a short, student-safe message.
 */
export function safetyHttpResponse(
  verdict: SafetyVerdict,
): { status: number; body: Record<string, unknown> } | null {
  if (verdict.action === "crisis") {
    return {
      status: 200,
      body: {
        blocked: true,
        crisis: true,
        message: verdict.message,
        resources: CRISIS_RESOURCES,
      },
    };
  }
  if (verdict.action === "block") {
    return { status: 422, body: { blocked: true, message: verdict.message } };
  }
  return null;
}
