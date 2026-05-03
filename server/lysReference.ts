// LYS canonical reference module.
//
// Reference texts (cheat sheet, rubric, template, assignment form, and four
// Distinguished-rated teacher exemplars) are embedded at build time via
// server/reference/lys/embedded.ts (auto-generated from the .txt files in the
// same directory). Embedding sidesteps any production-bundling concern about
// fs paths and guarantees the AI prompts always include the canon.
//
// Sources are documented in server/reference/lys/README.md.

import {
  LYS_REF_VERSION,
  EXEMPLAR_SCIENCE_7,
  EXEMPLAR_ELA_8,
  EXEMPLAR_ELA_6,
  EXEMPLAR_SOCIAL_STUDIES_7,
} from "./reference/lys/embedded";

export { LYS_REF_VERSION };

const EXEMPLARS: Record<string, string> = {
  science_6: EXEMPLAR_SCIENCE_7,
  science_7: EXEMPLAR_SCIENCE_7,
  science_8: EXEMPLAR_SCIENCE_7,
  ela_6: EXEMPLAR_ELA_6,
  ela_7: EXEMPLAR_ELA_6,
  ela_8: EXEMPLAR_ELA_8,
  social_studies_6: EXEMPLAR_SOCIAL_STUDIES_7,
  social_studies_7: EXEMPLAR_SOCIAL_STUDIES_7,
  social_studies_8: EXEMPLAR_SOCIAL_STUDIES_7,
};

export const LYS_DOMAINS = [
  "Educational",
  "Social",
  "Cultural",
  "Financial",
  "Health",
  "Vocational",
  "Spiritual",
] as const;

// Trait/value vocabulary distilled from the LYS Cheat Sheet across the 7
// life domains. The lesson-generator prompt uses these as the well of words
// to draw from when writing the BE/KNOW/DO triplet.
export const LYS_BKD_VOCAB = {
  being: [
    "Curiosity", "Resilience", "Humility", "Creativity", "Reflective",
    "Realistic", "Empathy", "Openness", "Discipline", "Integrity",
    "Responsibility", "Aspiration", "Identity", "Hope", "Trust",
    "Connectedness", "Wisdom", "Purpose", "Self-care",
  ],
  knowing: [
    "Asking for help", "Self-advocacy", "Learning style", "Setting boundaries",
    "Personal mission", "Money management", "Negotiation", "Coping strategies",
    "Interview skills", "Saying no", "Skill sets", "Market forces",
    "Living by values", "Self-esteem",
  ],
  doing: [
    "Skill development", "Independence", "Competency", "Ethical action",
    "Productivity", "Cooperation", "Adaptability", "Helpfulness",
    "Resourcefulness", "Reliability", "Dedication", "Professionalism",
    "Self-care practice",
  ],
} as const;

// Pulled directly from the "Assignment Form For Updated LYS Lesson Template"
// (Skylar Hurst) — the canonical accommodation matrix LYS teachers select
// from. Keep wording stable so it round-trips between AI output and UI.
export const LYS_ACCOMMODATIONS = [
  "Extra Time",
  "Notes/Presentation Copy Provided",
  "Study Sheet Provided",
  "Graphic Organizer",
  "Mnemonic Devices",
  "Larger Size Font",
  "Shortened Text",
  "Peer Support",
  "Preferential Seating",
  "Frequent On-Task Reminders",
  "Provided a Completed Example",
  "Visual Organizer",
] as const;

function normalizeSubject(subject: string | undefined): string {
  if (!subject) return "";
  const s = subject.toLowerCase();
  if (s.includes("ela") || s.includes("english") || s.includes("language arts") || s.includes("reading") || s.includes("writing")) return "ela";
  if (s.includes("science") || s.includes("biology") || s.includes("chem") || s.includes("physics")) return "science";
  if (s.includes("social") || s.includes("history") || s.includes("geograph") || s.includes("civics")) return "social_studies";
  return "";
}

function normalizeGrade(grade: string | undefined): string {
  if (!grade) return "7";
  const m = grade.match(/(\d+)/);
  if (!m) return "7";
  const n = parseInt(m[1], 10);
  if (n <= 6) return "6";
  if (n === 7) return "7";
  return "8";
}

function pickExemplar(subject: string | undefined, gradeLevel: string | undefined): string {
  const sub = normalizeSubject(subject);
  const gr = normalizeGrade(gradeLevel);
  if (!sub) return "";
  return EXEMPLARS[`${sub}_${gr}`] ?? "";
}

// Trim long exemplars to ~3.5KB so a real teacher lesson fits in the prompt
// without dominating it.
function trimExemplar(text: string, maxChars = 3500): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars).trimEnd() + "\n[…trimmed for prompt brevity…]";
}

/**
 * Builds an LYS canonical-reference block to inject into the lesson
 * generator's user prompt. Includes (when available) a real Distinguished-
 * rated teacher exemplar matched on subject + grade band, plus a structural
 * recap drawn from the LYS Lesson Plan Template and Cheat Sheet.
 *
 * Kept tight (~1 page) and de-duplicated against the existing system prompt
 * so it reinforces rather than competes with AI_LESSON_RUBRIC_PROMPT and the
 * 6-question quality check.
 */
export function buildLysCanonPromptBlock(subject: string | undefined, gradeLevel: string | undefined): string {
  const exemplar = trimExemplar(pickExemplar(subject, gradeLevel));
  const exemplarSection = exemplar
    ? `REAL LYS TEACHER EXEMPLAR (subject/grade-matched, Distinguished-rated). Mirror its STRUCTURE, VOICE, and DEPTH — do NOT copy its content:\n---\n${exemplar}\n---\n\n`
    : "";

  return `=== LYS CANONICAL REFERENCE (distilled from real teacher artifacts) ===
${exemplarSection}LYS METHODOLOGY — three SHORT statements (one sentence each), NOT paragraphs:
  • Be: a single character/value the lesson cultivates. Drawn from: ${LYS_BKD_VOCAB.being.slice(0, 8).join(", ")}…
  • Know: a resource or strategy phrased as a question or capability. Drawn from: ${LYS_BKD_VOCAB.knowing.slice(0, 6).join(", ")}…
  • Do: an action that pairs the trait with the strategy. Drawn from: ${LYS_BKD_VOCAB.doing.slice(0, 6).join(", ")}…

INSTRUCTIONAL INPUT — must be split into Asynchronous and Synchronous, each containing AS / M / GP:
  AS = Anticipatory Set (introduction)
  M  = Modeling — "I do"
  GP = Guided Practice — "We do"

LESSON CLOSE — answer the essential question, then connect it to ALL 7 life domains (none are optional): ${LYS_DOMAINS.join(", ")}.
Each domain reflection MUST be 1–3 sentences, addressed to the student in SECOND PERSON ("you", "your"), and ask at least one open question per domain when natural ("Have you considered…?", "Can you think of a time when…?").

VOICE RULES (from real LYS exemplars):
- Warm, conversational, second-person.
- Tie abstract content back to the student's life ("Just as scientists aspire to learn more about the world, you too need something to aspire to.").
- Avoid jargon-only definitions and generic platitudes.
- Be specific: name the trait, name the action, name the next step.
=== END LYS REFERENCE ===`;
}
