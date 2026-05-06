// DB-backed LYS Canon service. Auto-migrates the hardcoded entries from
// server/lysReference.ts on first boot, and falls back to the hardcoded file
// on any DB error so prompts always include canon.

import { storage } from "../storage";
import {
  buildLysCanonPromptBlock as buildHardcodedBlock,
  LYS_BKD_VOCAB,
  LYS_DOMAINS,
  LYS_ACCOMMODATIONS,
} from "../lysReference";
import type { LysCanonEntry, InsertLysCanonEntry } from "@shared/schema";

let seedAttempted = false;

export async function seedCanonFromHardcodedIfEmpty(): Promise<void> {
  if (seedAttempted) return;
  seedAttempted = true;
  try {
    const existing = await storage.listLysCanonEntries();
    if (existing.length > 0) return;

    const seeds: InsertLysCanonEntry[] = [];

    // Vocab entries — one per BKD axis
    seeds.push({
      kind: "vocab",
      subject: null,
      gradeBand: null,
      topicHint: null,
      title: "BE vocabulary",
      body: LYS_BKD_VOCAB.being.join(", "),
      sortOrder: 1,
      isActive: true,
      source: "hardcoded_migration",
    });
    seeds.push({
      kind: "vocab",
      subject: null,
      gradeBand: null,
      topicHint: null,
      title: "KNOW vocabulary",
      body: LYS_BKD_VOCAB.knowing.join(", "),
      sortOrder: 2,
      isActive: true,
      source: "hardcoded_migration",
    });
    seeds.push({
      kind: "vocab",
      subject: null,
      gradeBand: null,
      topicHint: null,
      title: "DO vocabulary",
      body: LYS_BKD_VOCAB.doing.join(", "),
      sortOrder: 3,
      isActive: true,
      source: "hardcoded_migration",
    });

    seeds.push({
      kind: "domain",
      subject: null,
      gradeBand: null,
      topicHint: null,
      title: "Life domains",
      body: LYS_DOMAINS.join(", "),
      sortOrder: 1,
      isActive: true,
      source: "hardcoded_migration",
    });

    seeds.push({
      kind: "accommodation",
      subject: null,
      gradeBand: null,
      topicHint: null,
      title: "Standard accommodations",
      body: LYS_ACCOMMODATIONS.join(", "),
      sortOrder: 1,
      isActive: true,
      source: "hardcoded_migration",
    });

    // Exemplars — store a placeholder rendered from the hardcoded picker for
    // each subject/grade pair. The full hardcoded text remains the fallback;
    // admins can edit these DB rows to override per-subject canon without a
    // code deploy.
    const subjects = ["math", "ela", "science", "social_studies"];
    const grades = ["6", "7", "8"];
    for (const sub of subjects) {
      for (const gr of grades) {
        const block = buildHardcodedBlock(sub, gr);
        seeds.push({
          kind: "exemplar",
          subject: sub,
          gradeBand: gr,
          topicHint: null,
          title: `${sub} grade ${gr} exemplar`,
          body: block,
          sortOrder: 0,
          isActive: true,
          source: "hardcoded_migration",
        });
      }
    }

    for (const s of seeds) {
      await storage.createLysCanonEntry(s);
    }
    console.log(`[lysCanonService] seeded ${seeds.length} canon entries from hardcoded reference`);
  } catch (err) {
    console.warn("[lysCanonService] seed failed (non-fatal):", (err as Error).message);
  }
}

// Idempotently seeds the LYS reference text files (voice_master_teacher.txt
// + exemplar_*.txt) as canon entries with kind=voice / exemplar_full so the
// voiceProfileService can semantically retrieve from them. Skips files
// already present (matched by title).
export async function seedVoiceCorpusFromFiles(): Promise<void> {
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const dir = path.resolve(process.cwd(), "server/reference/lys");
    let files: string[] = [];
    try {
      files = await fs.readdir(dir);
    } catch {
      console.warn("[lysCanonService] voice corpus dir not found, skipping seed");
      return;
    }

    const existing = await storage.listLysCanonEntries();
    const existingTitles = new Set(existing.map((e) => e.title));
    let added = 0;

    for (const file of files) {
      if (!file.endsWith(".txt")) continue;
      const isVoice = file === "voice_master_teacher.txt";
      const isExemplar = file.startsWith("exemplar_");
      if (!isVoice && !isExemplar) continue;

      const title = file.replace(/\.txt$/, "");
      if (existingTitles.has(title)) continue;

      let body = "";
      try {
        body = await fs.readFile(path.join(dir, file), "utf-8");
      } catch {
        continue;
      }
      if (!body.trim()) continue;

      // Parse subject + grade from exemplar filename: exemplar_<subject>_<grade>[_<topic>].txt
      let subject: string | null = null;
      let gradeBand: string | null = null;
      if (isExemplar) {
        const m = file.match(/^exemplar_([a-z_]+?)_(\d+)(?:_.*)?\.txt$/);
        if (m) {
          subject = m[1].includes("social") ? "social_studies" : m[1];
          gradeBand = m[2];
        }
      }

      await storage.createLysCanonEntry({
        kind: isVoice ? "voice" : "exemplar_full",
        subject,
        gradeBand,
        topicHint: null,
        title,
        body,
        sortOrder: isVoice ? 0 : 10,
        isActive: true,
        source: "lys_voice_corpus",
      });
      added++;
    }

    if (added > 0) {
      console.log(`[lysCanonService] seeded ${added} voice/exemplar entries from server/reference/lys/`);
    }
  } catch (err) {
    console.warn("[lysCanonService] voice corpus seed failed (non-fatal):", (err as Error).message);
  }
}

/**
 * Builds the LYS canon prompt block. Tries DB first; falls back to the
 * hardcoded file on any error so generation never fails because of canon.
 * Returns the prompt block plus the entry IDs used (for attribution) and
 * the per-subject canon version for cache-key composition.
 */
export async function buildCanonBlock(
  subject: string | undefined,
  gradeLevel: string | undefined,
  topic?: string,
): Promise<{ block: string; entryIds: string[]; subjectVersion: number }> {
  const subjectKey = normalizeSubject(subject);
  let subjectVersion = 1;
  try {
    subjectVersion = await storage.getSubjectCanonVersion(subjectKey || "_global");
  } catch {
    /* ignore */
  }

  try {
    const entries = await storage.listLysCanonEntries({ subject: subjectKey || undefined, isActive: true });
    if (entries.length === 0) {
      return { block: buildHardcodedBlock(subject, gradeLevel, topic), entryIds: [], subjectVersion };
    }
    const exemplar = entries.find(
      (e) => e.kind === "exemplar" && e.subject === subjectKey && (!gradeLevel || matchesGrade(e.gradeBand, gradeLevel)),
    );
    if (exemplar) {
      return { block: exemplar.body, entryIds: [exemplar.id], subjectVersion };
    }
    // No exact match — fall back to hardcoded
    return { block: buildHardcodedBlock(subject, gradeLevel, topic), entryIds: [], subjectVersion };
  } catch (err) {
    console.warn("[lysCanonService] buildCanonBlock DB error, using hardcoded fallback:", (err as Error).message);
    return { block: buildHardcodedBlock(subject, gradeLevel, topic), entryIds: [], subjectVersion };
  }
}

export async function bumpSubjectVersion(subject: string): Promise<number> {
  const key = normalizeSubject(subject) || "_global";
  return storage.bumpSubjectCanonVersion(key);
}

export function normalizeSubject(subject: string | undefined): string {
  if (!subject) return "";
  const s = subject.toLowerCase();
  if (s.includes("math")) return "math";
  if (s.includes("ela") || s.includes("english") || s.includes("language arts")) return "ela";
  if (s.includes("science") || s.includes("biology") || s.includes("chem") || s.includes("physics")) return "science";
  if (s.includes("social") || s.includes("history") || s.includes("civics")) return "social_studies";
  return "";
}

function matchesGrade(band: string | null | undefined, grade: string): boolean {
  if (!band) return true;
  const g = grade.match(/\d+/)?.[0];
  return !!g && band.includes(g);
}
