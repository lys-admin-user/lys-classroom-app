// Storage helpers for Task #7 (teacher standards quality-of-life): per-user
// favorites, recents (derived from the usage log), and the dashboard history
// view aggregated from `teacher_standards_usage`.
import { db } from "../db";
import { and, eq, desc, sql } from "drizzle-orm";
import {
  teacherStandardsFavorites,
  teacherStandardsUsage,
  type InsertTeacherStandardFavorite,
  type InsertTeacherStandardsUsage,
  type TeacherStandardFavorite,
  type TeacherStandardsUsage,
} from "@shared/schema";
import { DatabaseStorage } from "./_base";

interface RecentFilter {
  country?: string;
  state?: string;
  subject?: string;
  limit?: number;
}

export interface TeacherStandardsHistoryRow {
  country: string;
  state: string;
  subject: string;
  code: string;
  description: string;
  gradeLevel: string | null;
  standardsName: string | null;
  source: string | null;
  sourceUrl: string | null;
  useCount: number;
  lastUsedAt: string | null;
  lessonIds: string[];
  assignmentIds: string[];
}

export interface RecentStandardRow {
  country: string;
  state: string;
  subject: string;
  code: string;
  description: string;
  gradeLevel: string | null;
  standardsName: string | null;
  source: string | null;
  sourceUrl: string | null;
  lastUsedAt: string | null;
}

const teacherStandardsMethods = {
  async getTeacherStandardFavorites(
    userId: string,
  ): Promise<TeacherStandardFavorite[]> {
    return db
      .select()
      .from(teacherStandardsFavorites)
      .where(eq(teacherStandardsFavorites.userId, userId))
      .orderBy(desc(teacherStandardsFavorites.createdAt));
  },

  async addTeacherStandardFavorite(
    fav: InsertTeacherStandardFavorite,
  ): Promise<TeacherStandardFavorite> {
    // Upsert on the composite uniqueness key — re-favoriting the same code
    // refreshes the snapshot rather than failing.
    const [row] = await db
      .insert(teacherStandardsFavorites)
      .values(fav as any)
      .onConflictDoUpdate({
        target: [
          teacherStandardsFavorites.userId,
          teacherStandardsFavorites.country,
          teacherStandardsFavorites.state,
          teacherStandardsFavorites.subject,
          teacherStandardsFavorites.code,
        ],
        set: {
          description: fav.description,
          gradeLevel: fav.gradeLevel ?? null,
          standardsName: fav.standardsName ?? null,
          jurisdictionName: fav.jurisdictionName ?? null,
          source: fav.source ?? null,
          sourceUrl: fav.sourceUrl ?? null,
        },
      })
      .returning();
    return row;
  },

  async removeTeacherStandardFavorite(
    userId: string,
    key: { country: string; state: string; subject: string; code: string },
  ): Promise<boolean> {
    const result = await db
      .delete(teacherStandardsFavorites)
      .where(
        and(
          eq(teacherStandardsFavorites.userId, userId),
          eq(teacherStandardsFavorites.country, key.country),
          eq(teacherStandardsFavorites.state, key.state),
          eq(teacherStandardsFavorites.subject, key.subject),
          eq(teacherStandardsFavorites.code, key.code),
        ),
      );
    return (result.rowCount ?? 0) > 0;
  },

  async recordTeacherStandardsUsage(
    rows: InsertTeacherStandardsUsage[],
  ): Promise<void> {
    if (rows.length === 0) return;
    await db.insert(teacherStandardsUsage).values(rows as any[]);
  },

  /**
   * Top N most recent distinct codes for this teacher, optionally scoped by
   * the current cascade selection. Deduped on (country, state, subject, code)
   * — we keep the freshest row per code so the picker shows each code once.
   */
  async getTeacherRecentStandards(
    userId: string,
    filter: RecentFilter = {},
  ): Promise<RecentStandardRow[]> {
    const limit = Math.min(Math.max(filter.limit ?? 10, 1), 50);
    const whereParts: any[] = [eq(teacherStandardsUsage.userId, userId)];
    if (filter.country) whereParts.push(eq(teacherStandardsUsage.country, filter.country));
    if (filter.state) whereParts.push(eq(teacherStandardsUsage.state, filter.state));
    if (filter.subject) whereParts.push(eq(teacherStandardsUsage.subject, filter.subject));

    const rows = await db
      .select({
        country: teacherStandardsUsage.country,
        state: teacherStandardsUsage.state,
        subject: teacherStandardsUsage.subject,
        code: teacherStandardsUsage.code,
        description: sql<string>`max(${teacherStandardsUsage.description})`,
        gradeLevel: sql<string | null>`max(${teacherStandardsUsage.gradeLevel})`,
        standardsName: sql<string | null>`max(${teacherStandardsUsage.standardsName})`,
        source: sql<string | null>`max(${teacherStandardsUsage.source})`,
        sourceUrl: sql<string | null>`max(${teacherStandardsUsage.sourceUrl})`,
        lastUsedAt: sql<Date>`max(${teacherStandardsUsage.usedAt})`,
      })
      .from(teacherStandardsUsage)
      .where(and(...whereParts))
      .groupBy(
        teacherStandardsUsage.country,
        teacherStandardsUsage.state,
        teacherStandardsUsage.subject,
        teacherStandardsUsage.code,
      )
      .orderBy(sql`max(${teacherStandardsUsage.usedAt}) desc`)
      .limit(limit);

    return rows.map((r) => ({
      ...r,
      lastUsedAt: r.lastUsedAt ? new Date(r.lastUsedAt as any).toISOString() : null,
    }));
  },

  /**
   * Full "Standards I've used" history aggregation backing the dashboard
   * widget. One row per distinct code with count + last used + the list of
   * lesson/assignment ids the teacher attached it to.
   */
  async getTeacherStandardsHistory(
    userId: string,
  ): Promise<TeacherStandardsHistoryRow[]> {
    const rows = await db
      .select({
        country: teacherStandardsUsage.country,
        state: teacherStandardsUsage.state,
        subject: teacherStandardsUsage.subject,
        code: teacherStandardsUsage.code,
        description: sql<string>`max(${teacherStandardsUsage.description})`,
        gradeLevel: sql<string | null>`max(${teacherStandardsUsage.gradeLevel})`,
        standardsName: sql<string | null>`max(${teacherStandardsUsage.standardsName})`,
        source: sql<string | null>`max(${teacherStandardsUsage.source})`,
        sourceUrl: sql<string | null>`max(${teacherStandardsUsage.sourceUrl})`,
        useCount: sql<number>`count(*)::int`,
        lastUsedAt: sql<Date>`max(${teacherStandardsUsage.usedAt})`,
        lessonIds: sql<string[]>`coalesce(array_agg(distinct ${teacherStandardsUsage.lessonId}) filter (where ${teacherStandardsUsage.lessonId} is not null), '{}')`,
        assignmentIds: sql<string[]>`coalesce(array_agg(distinct ${teacherStandardsUsage.assignmentId}) filter (where ${teacherStandardsUsage.assignmentId} is not null), '{}')`,
      })
      .from(teacherStandardsUsage)
      .where(eq(teacherStandardsUsage.userId, userId))
      .groupBy(
        teacherStandardsUsage.country,
        teacherStandardsUsage.state,
        teacherStandardsUsage.subject,
        teacherStandardsUsage.code,
      )
      .orderBy(sql`max(${teacherStandardsUsage.usedAt}) desc`);

    return rows.map((r) => ({
      ...r,
      lastUsedAt: r.lastUsedAt ? new Date(r.lastUsedAt as any).toISOString() : null,
      lessonIds: (r.lessonIds as any) ?? [],
      assignmentIds: (r.assignmentIds as any) ?? [],
    }));
  },
};

Object.assign(DatabaseStorage.prototype, teacherStandardsMethods);

declare module "./_base" {
  interface DatabaseStorage {
    getTeacherStandardFavorites(userId: string): Promise<TeacherStandardFavorite[]>;
    addTeacherStandardFavorite(
      fav: InsertTeacherStandardFavorite,
    ): Promise<TeacherStandardFavorite>;
    removeTeacherStandardFavorite(
      userId: string,
      key: { country: string; state: string; subject: string; code: string },
    ): Promise<boolean>;
    recordTeacherStandardsUsage(rows: InsertTeacherStandardsUsage[]): Promise<void>;
    getTeacherRecentStandards(
      userId: string,
      filter?: RecentFilter,
    ): Promise<RecentStandardRow[]>;
    getTeacherStandardsHistory(
      userId: string,
    ): Promise<TeacherStandardsHistoryRow[]>;
  }
}

export {};
