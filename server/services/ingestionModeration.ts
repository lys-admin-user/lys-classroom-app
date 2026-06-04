// Moderation tooling for system admins (Task #6).
//
// Provides:
//   - audit log helper (writeAuditLog) used by approve/reject paths for both
//     pending public standards and curriculum docs
//   - merged moderation-queue feed (pending standards + pending curriculum docs)
//   - curriculum-doc bulk approve / reject with atomic semantics
//   - audit-log fetch per (entityType, entityId)

import { db } from "../db";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  ingestionAuditLog,
  pendingPublicStandards,
  curriculumDocuments,
  type IngestionAuditLog,
  type PendingPublicStandard,
  type CurriculumDocument,
} from "@shared/schema";

export type ModerationEntityType = "pending_standard" | "curriculum_doc";
export type ModerationAction =
  | "created"
  | "edited"
  | "approved"
  | "rejected"
  | "reactivated";

export async function writeAuditLog(args: {
  entityType: ModerationEntityType;
  entityId: string;
  action: ModerationAction;
  actorUserId: string | null;
  reason?: string | null;
  details?: Record<string, unknown> | null;
}): Promise<void> {
  await db.insert(ingestionAuditLog).values({
    entityType: args.entityType,
    entityId: args.entityId,
    action: args.action,
    actorUserId: args.actorUserId,
    reason: args.reason ?? null,
    details: args.details ?? null,
  });
}

export async function listAuditLog(
  entityType: ModerationEntityType,
  entityId: string,
): Promise<IngestionAuditLog[]> {
  return await db
    .select()
    .from(ingestionAuditLog)
    .where(
      and(
        eq(ingestionAuditLog.entityType, entityType),
        eq(ingestionAuditLog.entityId, entityId),
      ),
    )
    .orderBy(desc(ingestionAuditLog.createdAt));
}

// -------------------- Moderation queue --------------------

export type ModerationQueueItem =
  | (PendingPublicStandard & { kind: "pending_standard" })
  | (CurriculumDocument & { kind: "curriculum_doc" });

export async function listModerationQueue(opts: {
  limit?: number;
  offset?: number;
  kind?: "all" | "pending_standard" | "curriculum_doc";
} = {}): Promise<{ items: ModerationQueueItem[]; total: number }> {
  const limit = Math.min(opts.limit ?? 50, 200);
  const offset = Math.max(opts.offset ?? 0, 0);
  const kind = opts.kind ?? "all";

  const wantStd = kind === "all" || kind === "pending_standard";
  const wantDoc = kind === "all" || kind === "curriculum_doc";

  // Bound each per-source fetch by (offset + limit) so memory doesn't grow
  // with queue size. We still merge + slice in-memory because the two
  // sources have different schemas; SQL UNION ALL would force a lossy
  // common projection. Total counts are computed via cheap count(*) so the
  // UI can still show "selected of total".
  const cap = offset + limit;
  // We need bytea-free curriculum doc rows; project only what the UI uses.
  const [stds, docs, stdCount, docCount] = await Promise.all([
    wantStd
      ? db
          .select()
          .from(pendingPublicStandards)
          .where(eq(pendingPublicStandards.status, "pending_review"))
          .orderBy(desc(pendingPublicStandards.createdAt))
          .limit(cap)
      : Promise.resolve([] as PendingPublicStandard[]),
    wantDoc
      ? db
          .select({
            id: curriculumDocuments.id,
            createdAt: curriculumDocuments.createdAt,
            updatedAt: curriculumDocuments.updatedAt,
            uploadedByUserId: curriculumDocuments.uploadedByUserId,
            uploaderRole: curriculumDocuments.uploaderRole,
            organizationId: curriculumDocuments.organizationId,
            docType: curriculumDocuments.docType,
            title: curriculumDocuments.title,
            subject: curriculumDocuments.subject,
            gradeLevels: curriculumDocuments.gradeLevels,
            country: curriculumDocuments.country,
            state: curriculumDocuments.state,
            schoolYear: curriculumDocuments.schoolYear,
            originalFilename: curriculumDocuments.originalFilename,
            mimeType: curriculumDocuments.mimeType,
            fileSizeBytes: curriculumDocuments.fileSizeBytes,
            extractionStatus: curriculumDocuments.extractionStatus,
            extractionError: curriculumDocuments.extractionError,
            standardsExtractedCount: curriculumDocuments.standardsExtractedCount,
            isActive: curriculumDocuments.isActive,
            moderationStatus: curriculumDocuments.moderationStatus,
            moderationReason: curriculumDocuments.moderationReason,
            moderationReviewedByUserId: curriculumDocuments.moderationReviewedByUserId,
            moderationReviewedAt: curriculumDocuments.moderationReviewedAt,
          })
          .from(curriculumDocuments)
          .where(
            and(
              eq(curriculumDocuments.isActive, true),
              eq(curriculumDocuments.moderationStatus, "pending"),
            ),
          )
          .orderBy(desc(curriculumDocuments.createdAt))
          .limit(cap)
      : Promise.resolve([] as any[]),
    wantStd
      ? db
          .select({ c: sql<number>`count(*)::int` })
          .from(pendingPublicStandards)
          .where(eq(pendingPublicStandards.status, "pending_review"))
          .then((r) => r[0]?.c ?? 0)
      : Promise.resolve(0),
    wantDoc
      ? db
          .select({ c: sql<number>`count(*)::int` })
          .from(curriculumDocuments)
          .where(
            and(
              eq(curriculumDocuments.isActive, true),
              eq(curriculumDocuments.moderationStatus, "pending"),
            ),
          )
          .then((r) => r[0]?.c ?? 0)
      : Promise.resolve(0),
  ]);

  const merged: ModerationQueueItem[] = [
    ...stds.map((s) => ({ ...s, kind: "pending_standard" as const })),
    ...docs.map((d: any) => ({ ...d, kind: "curriculum_doc" as const })),
  ];
  merged.sort((a, b) => {
    const at = (a.createdAt ?? new Date(0)).getTime();
    const bt = (b.createdAt ?? new Date(0)).getTime();
    return bt - at;
  });

  return {
    items: merged.slice(offset, offset + limit),
    total: stdCount + docCount,
  };
}

// -------------------- Backlog stats (Task #12) --------------------

export interface BacklogBucket {
  total: number;
  over24h: number;
  over7d: number;
}

export interface ModerationBacklogStats {
  pendingStandards: BacklogBucket;
  pendingDocs: BacklogBucket;
  total: number;
}

// Snapshot of the moderation queue depth for the daily backlog alert. Counts
// pending public standards + pending curriculum docs, each bucketed by age so
// admins can tell a fresh spike apart from a stale backlog.
export async function getModerationBacklogStats(
  now: Date = new Date(),
): Promise<ModerationBacklogStats> {
  const t24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const t7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [stdRows, docRows] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        over24h: sql<number>`count(*) filter (where ${pendingPublicStandards.createdAt} <= ${t24})::int`,
        over7d: sql<number>`count(*) filter (where ${pendingPublicStandards.createdAt} <= ${t7})::int`,
      })
      .from(pendingPublicStandards)
      .where(eq(pendingPublicStandards.status, "pending_review")),
    db
      .select({
        total: sql<number>`count(*)::int`,
        over24h: sql<number>`count(*) filter (where ${curriculumDocuments.createdAt} <= ${t24})::int`,
        over7d: sql<number>`count(*) filter (where ${curriculumDocuments.createdAt} <= ${t7})::int`,
      })
      .from(curriculumDocuments)
      .where(
        and(
          eq(curriculumDocuments.isActive, true),
          eq(curriculumDocuments.moderationStatus, "pending"),
        ),
      ),
  ]);

  const pendingStandards: BacklogBucket = {
    total: Number(stdRows[0]?.total ?? 0),
    over24h: Number(stdRows[0]?.over24h ?? 0),
    over7d: Number(stdRows[0]?.over7d ?? 0),
  };
  const pendingDocs: BacklogBucket = {
    total: Number(docRows[0]?.total ?? 0),
    over24h: Number(docRows[0]?.over24h ?? 0),
    over7d: Number(docRows[0]?.over7d ?? 0),
  };

  return {
    pendingStandards,
    pendingDocs,
    total: pendingStandards.total + pendingDocs.total,
  };
}

// -------------------- Curriculum doc bulk approve/reject --------------------

export async function approveCurriculumDocs(
  ids: string[],
  reviewerId: string,
  reason?: string,
): Promise<{ approved: number }> {
  if (ids.length === 0) return { approved: 0 };
  // Atomic: either every targeted row flips, or none do. We use a single
  // transaction with a guard on current status so partial states roll back.
  const approved = await db.transaction(async (tx) => {
    const targets = await tx
      .select({ id: curriculumDocuments.id })
      .from(curriculumDocuments)
      .where(
        and(
          inArray(curriculumDocuments.id, ids),
          eq(curriculumDocuments.isActive, true),
          // Pending-state guard so concurrent reviewers can't double-act.
          eq(curriculumDocuments.moderationStatus, "pending"),
        ),
      );
    if (targets.length !== ids.length) {
      throw new Error(
        `Bulk approve aborted: ${ids.length - targets.length} of ${ids.length} doc(s) not found, inactive, or already reviewed`,
      );
    }
    await tx
      .update(curriculumDocuments)
      .set({
        moderationStatus: "approved",
        moderationReason: reason ?? null,
        moderationReviewedByUserId: reviewerId,
        moderationReviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(inArray(curriculumDocuments.id, ids));

    await tx.insert(ingestionAuditLog).values(
      ids.map((id) => ({
        entityType: "curriculum_doc",
        entityId: id,
        action: "approved",
        actorUserId: reviewerId,
        reason: reason ?? null,
      })),
    );
    return targets.length;
  });
  return { approved };
}

export async function rejectCurriculumDocs(
  ids: string[],
  reviewerId: string,
  reason: string,
): Promise<{ rejected: number }> {
  if (ids.length === 0) return { rejected: 0 };
  const rejected = await db.transaction(async (tx) => {
    const targets = await tx
      .select({ id: curriculumDocuments.id })
      .from(curriculumDocuments)
      .where(
        and(
          inArray(curriculumDocuments.id, ids),
          eq(curriculumDocuments.isActive, true),
          eq(curriculumDocuments.moderationStatus, "pending"),
        ),
      );
    if (targets.length !== ids.length) {
      throw new Error(
        `Bulk reject aborted: ${ids.length - targets.length} of ${ids.length} doc(s) not found, inactive, or already reviewed`,
      );
    }
    await tx
      .update(curriculumDocuments)
      .set({
        moderationStatus: "rejected",
        moderationReason: reason,
        moderationReviewedByUserId: reviewerId,
        moderationReviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(inArray(curriculumDocuments.id, ids));

    await tx.insert(ingestionAuditLog).values(
      ids.map((id) => ({
        entityType: "curriculum_doc",
        entityId: id,
        action: "rejected",
        actorUserId: reviewerId,
        reason,
      })),
    );
    return targets.length;
  });
  return { rejected };
}
