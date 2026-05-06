// Storage methods for the Bricks/BKD lesson AI improvements:
// - master_lessons.embedding (added column)
// - master_lesson_sections
// - lys_canon_entries
// - subject_canon_versions
// - lesson_generation_attribution
// - lesson_edit_signals
// - lesson_ai_org_settings

import { db } from "../db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import {
  masterLessons,
  masterLessonSections,
  lysCanonEntries,
  subjectCanonVersions,
  lessonGenerationAttribution,
  lessonEditSignals,
  lessonAiOrgSettings,
  assignmentGenerationAttribution,
  type MasterLesson,
  type MasterLessonSection,
  type InsertMasterLessonSection,
  type LysCanonEntry,
  type InsertLysCanonEntry,
  type LessonGenerationAttribution,
  type AssignmentGenerationAttribution,
  type LessonEditSignal,
  type LessonAiOrgSettings,
} from "@shared/schema";
import { DatabaseStorage } from "./_base";

const lessonAiMethods: ThisType<DatabaseStorage> = {
  // ----- master_lessons embedding -----
  async setMasterLessonEmbedding(id: string, embedding: number[]): Promise<void> {
    await db.update(masterLessons)
      .set({ embedding, embeddedAt: new Date() })
      .where(eq(masterLessons.id, id));
  },

  async getMasterLessonsForRetrieval(filters: { subject?: string; minScore?: number; limit?: number }): Promise<MasterLesson[]> {
    const conds = [eq(masterLessons.status, "approved")];
    if (filters.subject) conds.push(eq(masterLessons.subject, filters.subject));
    if (typeof filters.minScore === "number") {
      conds.push(sql`${masterLessons.qualityScore} >= ${filters.minScore}`);
    }
    return db.select().from(masterLessons)
      .where(and(...conds))
      .orderBy(desc(masterLessons.qualityScore))
      .limit(filters.limit ?? 50);
  },

  // ----- master_lesson_sections -----
  async createMasterLessonSection(section: InsertMasterLessonSection): Promise<MasterLessonSection> {
    const [row] = await db.insert(masterLessonSections).values(section).returning();
    return row;
  },

  async getMasterLessonSections(masterLessonId: string): Promise<MasterLessonSection[]> {
    return db.select().from(masterLessonSections).where(eq(masterLessonSections.masterLessonId, masterLessonId));
  },

  async setMasterLessonSectionEmbedding(id: string, embedding: number[]): Promise<void> {
    await db.update(masterLessonSections)
      .set({ embedding, embeddedAt: new Date() })
      .where(eq(masterLessonSections.id, id));
  },

  async getMasterLessonSectionsByType(sectionType: string, masterLessonIds: string[]): Promise<MasterLessonSection[]> {
    if (masterLessonIds.length === 0) return [];
    return db.select().from(masterLessonSections)
      .where(and(
        eq(masterLessonSections.sectionType, sectionType),
        inArray(masterLessonSections.masterLessonId, masterLessonIds),
      ));
  },

  // ----- lys_canon_entries -----
  async listLysCanonEntries(filters?: { subject?: string; kind?: string; isActive?: boolean }): Promise<LysCanonEntry[]> {
    const conds = [];
    if (filters?.kind) conds.push(eq(lysCanonEntries.kind, filters.kind));
    if (filters?.subject) {
      conds.push(sql`(${lysCanonEntries.subject} = ${filters.subject} OR ${lysCanonEntries.subject} IS NULL)`);
    }
    if (typeof filters?.isActive === "boolean") conds.push(eq(lysCanonEntries.isActive, filters.isActive));
    const q = conds.length > 0
      ? db.select().from(lysCanonEntries).where(and(...conds)).orderBy(lysCanonEntries.sortOrder)
      : db.select().from(lysCanonEntries).orderBy(lysCanonEntries.sortOrder);
    return q;
  },

  async createLysCanonEntry(entry: InsertLysCanonEntry): Promise<LysCanonEntry> {
    const [row] = await db.insert(lysCanonEntries).values(entry).returning();
    return row;
  },

  async updateLysCanonEntry(id: string, updates: Partial<InsertLysCanonEntry>): Promise<LysCanonEntry | undefined> {
    const [row] = await db.update(lysCanonEntries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(lysCanonEntries.id, id))
      .returning();
    return row;
  },

  async deleteLysCanonEntry(id: string): Promise<boolean> {
    const res = await db.delete(lysCanonEntries).where(eq(lysCanonEntries.id, id)).returning();
    return res.length > 0;
  },

  async setLysCanonEntryEmbedding(id: string, embedding: number[]): Promise<void> {
    await db.update(lysCanonEntries)
      .set({ embedding, embeddedAt: new Date() })
      .where(eq(lysCanonEntries.id, id));
  },

  // ----- assignment_generation_attribution -----
  async createAssignmentAttribution(attr: Omit<AssignmentGenerationAttribution, "id" | "createdAt">): Promise<AssignmentGenerationAttribution> {
    const [row] = await db.insert(assignmentGenerationAttribution).values(attr).returning();
    return row;
  },

  async listTopAssignmentExemplars(limit: number = 20): Promise<Array<{ canonEntryId: string; uses: number; avgVoiceScore: number }>> {
    const rows = await db.execute(sql`
      SELECT entry_id AS "canonEntryId",
             COUNT(*)::int AS uses,
             COALESCE(AVG(voice_score), 0)::int AS "avgVoiceScore"
      FROM assignment_generation_attribution,
           jsonb_array_elements_text(canon_entry_ids) AS entry_id
      WHERE voice_score IS NOT NULL
      GROUP BY entry_id
      ORDER BY "avgVoiceScore" DESC, uses DESC
      LIMIT ${limit}
    `);
    return (rows as any).rows ?? [];
  },

  // ----- subject_canon_versions -----
  async getSubjectCanonVersion(subject: string): Promise<number> {
    const [row] = await db.select().from(subjectCanonVersions).where(eq(subjectCanonVersions.subject, subject));
    return row?.version ?? 1;
  },

  async bumpSubjectCanonVersion(subject: string): Promise<number> {
    const current = await this.getSubjectCanonVersion(subject);
    const next = current + 1;
    await db.insert(subjectCanonVersions)
      .values({ subject, version: next })
      .onConflictDoUpdate({ target: subjectCanonVersions.subject, set: { version: next, updatedAt: new Date() } });
    return next;
  },

  // ----- lesson_generation_attribution -----
  async createLessonAttribution(attr: Omit<LessonGenerationAttribution, "id" | "createdAt">): Promise<LessonGenerationAttribution> {
    const [row] = await db.insert(lessonGenerationAttribution).values(attr).returning();
    return row;
  },

  async updateLessonAttributionScore(cacheKey: string, finalScore: number): Promise<void> {
    await db.update(lessonGenerationAttribution)
      .set({ finalScore })
      .where(eq(lessonGenerationAttribution.cacheKey, cacheKey));
  },

  async listTopExemplars(limit: number = 20): Promise<Array<{ masterLessonId: string; uses: number; avgScore: number; avgVoiceScore: number | null; rewriteRate: number }>> {
    const rows = await db.execute(sql`
      SELECT exemplar_id AS "masterLessonId",
             COUNT(*)::int AS uses,
             COALESCE(AVG(final_score), 0)::int AS "avgScore",
             CASE WHEN COUNT(voice_score) > 0 THEN ROUND(AVG(voice_score))::int ELSE NULL END AS "avgVoiceScore",
             COALESCE(SUM(CASE WHEN rewritten THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0), 0)::float AS "rewriteRate"
      FROM lesson_generation_attribution,
           jsonb_array_elements_text(master_lesson_ids) AS exemplar_id
      WHERE final_score IS NOT NULL
      GROUP BY exemplar_id
      ORDER BY "avgScore" DESC, uses DESC
      LIMIT ${limit}
    `);
    return (rows as any).rows ?? [];
  },

  // ----- lesson_edit_signals -----
  async createLessonEditSignal(signal: Omit<LessonEditSignal, "id" | "createdAt">): Promise<LessonEditSignal> {
    const [row] = await db.insert(lessonEditSignals).values(signal).returning();
    return row;
  },

  async listLessonEditSignals(lessonId: string): Promise<LessonEditSignal[]> {
    return db.select().from(lessonEditSignals).where(eq(lessonEditSignals.lessonId, lessonId));
  },

  // ----- lesson_ai_org_settings -----
  async getLessonAiOrgSettings(orgId: string): Promise<LessonAiOrgSettings | undefined> {
    const [row] = await db.select().from(lessonAiOrgSettings).where(eq(lessonAiOrgSettings.orgId, orgId));
    return row;
  },

  async upsertLessonAiOrgSettings(orgId: string, editCaptureEnabled: boolean): Promise<LessonAiOrgSettings> {
    const [row] = await db.insert(lessonAiOrgSettings)
      .values({ orgId, editCaptureEnabled })
      .onConflictDoUpdate({
        target: lessonAiOrgSettings.orgId,
        set: { editCaptureEnabled, updatedAt: new Date() },
      })
      .returning();
    return row;
  },
};

Object.assign(DatabaseStorage.prototype, lessonAiMethods);
