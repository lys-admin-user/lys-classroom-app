// LYS canonical reference module.
//
// Reference texts (cheat sheet, rubric, template, assignment form, and
// Distinguished-rated teacher exemplars across Science, Math, ELA, and
// Social Studies — grades 6–8) are embedded at build time via
// server/reference/lys/embedded.ts (auto-generated from the .txt files in the
// same directory). Embedding sidesteps any production-bundling concern about
// fs paths and guarantees the AI prompts always include the canon.
//
// Sources are documented in server/reference/lys/README.md.
// To regenerate embedded.ts after editing any .txt: node scripts/regen_lys_embedded.mjs

import {
  LYS_REF_VERSION,
  EXEMPLAR_SCIENCE_7,
  EXEMPLAR_MATH_6,
  EXEMPLAR_ELA_8,
  EXEMPLAR_ELA_8_LITERATURE,
  EXEMPLAR_ELA_6,
  EXEMPLAR_SOCIAL_STUDIES_7,
} from "./reference/lys/embedded";

export { LYS_REF_VERSION };

// Subject + grade band → exemplar text. ELA-8 has TWO variants chosen by
// topic; see pickExemplar below.
const EXEMPLARS: Record<string, string> = {
  science_6: EXEMPLAR_SCIENCE_7,
  science_7: EXEMPLAR_SCIENCE_7,
  science_8: EXEMPLAR_SCIENCE_7,
  math_6: EXEMPLAR_MATH_6,
  math_7: EXEMPLAR_MATH_6,
  math_8: EXEMPLAR_MATH_6,
  ela_6: EXEMPLAR_ELA_6,
  ela_7: EXEMPLAR_ELA_6,
  ela_8: EXEMPLAR_ELA_8, // default — overridden by topic match in pickExemplar
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
  if (s.includes("math") || s.includes("algebra") || s.includes("geometry") || s.includes("arithmetic") || s.includes("pre-calc") || s.includes("precalc")) return "math";
  if (s.includes("ela") || s.includes("english") || s.includes("language arts") || s.includes("reading") || s.includes("writing") || s.includes("literature")) return "ela";
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

// Heuristic: does the requested topic look like literature/fiction/poetry
// (Shannon's Unit 05) versus argumentation/persuasion (Shannon's Unit 04)?
// Used to switch the Grade-8 ELA exemplar.
function isLiteratureTopic(topic: string | undefined): boolean {
  if (!topic) return false;
  const t = topic.toLowerCase();
  const litWords = [
    "literature", "literary", "fiction", "novel", "short story", "story",
    "poem", "poetry", "poet", "verse", "stanza", "rhyme", "meter",
    "play", "drama", "scene", "act ", "playwright",
    "character", "plot", "theme", "setting", "narrator", "narrative",
    "imagery", "symbolism", "metaphor", "simile", "figurative",
    "hughes", "o'henry", "ohenry", "shakespeare",
  ];
  return litWords.some((w) => t.includes(w));
}

function isArgumentTopic(topic: string | undefined): boolean {
  if (!topic) return false;
  const t = topic.toLowerCase();
  const argWords = [
    "argument", "argumentative", "persuasive", "persuasion", "claim",
    "counterargument", "rhetoric", "rhetorical", "evidence", "essay",
    "opinion", "debate", "thesis", "informational",
  ];
  return argWords.some((w) => t.includes(w));
}

function pickExemplar(
  subject: string | undefined,
  gradeLevel: string | undefined,
  topic: string | undefined,
): string {
  const sub = normalizeSubject(subject);
  const gr = normalizeGrade(gradeLevel);
  if (!sub) return "";

  // Topic-aware override for Grade 8 ELA: literature → Langston Hughes
  // exemplar (Shannon Unit 05); explicit argument → Arguments in Writing
  // exemplar (Shannon Unit 04). Default falls back to argumentation.
  if (sub === "ela" && gr === "8") {
    if (isLiteratureTopic(topic)) return EXEMPLAR_ELA_8_LITERATURE;
    if (isArgumentTopic(topic)) return EXEMPLAR_ELA_8;
    return EXEMPLAR_ELA_8;
  }

  return EXEMPLARS[`${sub}_${gr}`] ?? "";
}

// Trim long exemplars to ~4500 chars so a real teacher lesson fits in the
// prompt without dominating it. Bumped from 3500 to preserve the full
// Lesson-Close section in Math + Literature exemplars.
function trimExemplar(text: string, maxChars = 4500): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars).trimEnd() + "\n[…trimmed for prompt brevity…]";
}

/**
 * Builds an LYS canonical-reference block to inject into the lesson
 * generator's user prompt. Includes (when available) a real Distinguished-
 * rated teacher exemplar matched on subject + grade band (and, for ELA-8,
 * topic), plus a structural recap drawn from the LYS Lesson Plan Template
 * and Cheat Sheet.
 *
 * Kept tight (~1 page) and de-duplicated against the existing system prompt
 * so it reinforces rather than competes with AI_LESSON_RUBRIC_PROMPT and the
 * 6-question quality check.
 */
export function buildLysCanonPromptBlock(
  subject: string | undefined,
  gradeLevel: string | undefined,
  topic?: string | undefined,
): string {
  const exemplar = trimExemplar(pickExemplar(subject, gradeLevel, topic));
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

LESSON CLOSE — answer the essential question, then connect it to the life domains that genuinely fit the topic, drawn from: ${LYS_DOMAINS.join(", ")}. You do NOT need to cover all seven — choose the dimensions where the connection is real, and skip the ones that would feel forced. Aim for 2–3 strong domains; one alone usually feels thin.
Each included reflection should be 2–4 sentences with REAL DEPTH (not a one-liner) — addressed to the student in SECOND PERSON ("you", "your"), and ask at least one open question when natural ("Have you considered…?", "Can you think of a time when…?").

VOICE & DEPTH RULES (from real LYS exemplars — Jennifer Pluma's Math Lesson Closes are the gold standard for depth):
- Warm, conversational, second-person.
- When a domain reflection naturally fits, OPEN with a short relevant quote attributed to a real person ("Financial freedom is available for those who learn about it and work for it." — Robert T. Kiyosaki), then tell a brief real-life story or scenario that ties the lesson's content to the student's actual life.
- Tie abstract content back to the student's life ("Just as scientists aspire to learn more about the world, you too need something to aspire to.").
- Avoid jargon-only definitions and generic platitudes.
- Be specific: name the trait, name the action, name the next step.
=== END LYS REFERENCE ===`;
}
