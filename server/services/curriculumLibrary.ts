// Data access + business logic for the customer-uploaded curriculum library
// (Campus / Enterprise feature). Kept outside the giant IStorage interface
// because this is a self-contained feature surface and the interface is
// already 4,200+ lines.

import { db } from "../db";
import { eq, and, desc, inArray, or, isNull, isNotNull, sql } from "drizzle-orm";
import {
  curriculumDocuments,
  orgCurriculumSettings,
  userCurriculumOptOuts,
  orgExtractedStandards,
  organizationMemberships,
  type CurriculumDocument,
  type InsertCurriculumDocument,
  type OrgCurriculumSettings,
  type OrgExtractedStandard,
} from "@shared/schema";

export type DocType = "scope_sequence" | "yag" | "lesson";
export type UploaderRole = "admin" | "teacher";

// ----- Org settings -----

export async function getOrgCurriculumSettings(
  organizationId: string,
): Promise<OrgCurriculumSettings> {
  const [row] = await db
    .select()
    .from(orgCurriculumSettings)
    .where(eq(orgCurriculumSettings.organizationId, organizationId));
  if (row) return row;
  // Default-on if no row
  return {
    organizationId,
    allowTeacherUploads: true,
    updatedAt: null,
    updatedByUserId: null,
  } as OrgCurriculumSettings;
}

export async function setOrgAllowTeacherUploads(
  organizationId: string,
  allow: boolean,
  updatedByUserId: string,
): Promise<OrgCurriculumSettings> {
  const existing = await getOrgCurriculumSettings(organizationId);
  if (existing.updatedAt === null) {
    const [created] = await db
      .insert(orgCurriculumSettings)
      .values({
        organizationId,
        allowTeacherUploads: allow,
        updatedByUserId,
        updatedAt: new Date(),
      })
      .returning();
    return created;
  }
  const [updated] = await db
    .update(orgCurriculumSettings)
    .set({
      allowTeacherUploads: allow,
      updatedByUserId,
      updatedAt: new Date(),
    })
    .where(eq(orgCurriculumSettings.organizationId, organizationId))
    .returning();
  return updated;
}

// ----- Permission gates -----

export type CurriculumPermission = {
  canUpload: boolean;
  canUploadAsAdmin: boolean;
  reason?: string;
};

export async function getUploadPermission(
  userId: string,
  userRole: string,
  organizationId: string | null,
): Promise<CurriculumPermission> {
  // System / site admins can always upload
  if (userRole === "system_admin" || userRole === "site_admin") {
    return { canUpload: true, canUploadAsAdmin: true };
  }
  // District / campus admins can always upload
  if (userRole === "district_admin" || userRole === "campus_admin") {
    return { canUpload: true, canUploadAsAdmin: true };
  }
  // Locked product decision (May 2026): curriculum-document uploads are
  // an admin-only operation. Educators (and homeschool / staff) can still
  // *request* new public standards via the RequestStandardsCard, but they
  // cannot push docs into the library themselves — that prevents low-quality
  // or untagged uploads from polluting AI alignment. The previous per-org
  // `allowTeacherUploads` flag is now ignored at the permission layer (kept
  // on the org settings record for backward-compat with old admin UIs).
  if (
    userRole === "educator" ||
    userRole === "homeschool_parent" ||
    userRole === "staff"
  ) {
    return {
      canUpload: false,
      canUploadAsAdmin: false,
      reason:
        "Curriculum uploads are managed by your school administrator. Use the 'Request public standards' form below to ask for a new curriculum.",
    };
  }
  return {
    canUpload: false,
    canUploadAsAdmin: false,
    reason: "Your role does not have curriculum upload permission.",
  };
}

// ----- Document CRUD -----

export async function createCurriculumDocument(
  data: InsertCurriculumDocument,
  extractedText: string,
  originalFileBytes?: Buffer,
): Promise<CurriculumDocument> {
  const [doc] = await db
    .insert(curriculumDocuments)
    .values({
      ...data,
      extractedText,
      originalFileBytes: originalFileBytes ?? null,
      extractionStatus: data.docType === "lesson" ? "skipped" : "pending",
    })
    .returning();
  // Task #6: record the creation event in the moderation audit trail so the
  // sys-admin viewer can show the original upload alongside later transitions.
  try {
    const { writeAuditLog } = await import("./ingestionModeration");
    await writeAuditLog({
      entityType: "curriculum_doc",
      entityId: doc.id,
      action: "created",
      actorUserId: data.uploadedByUserId,
      details: {
        docType: doc.docType,
        title: doc.title,
        uploaderRole: doc.uploaderRole,
        organizationId: doc.organizationId,
      },
    });
  } catch (err) {
    console.error("[curriculumLibrary] audit-log create failed:", err);
  }
  // Never return the raw bytes to upload clients — moderation viewer uses
  // a separate authenticated endpoint to fetch them.
  return stripBytes(doc);
}

// Strip the raw file blob from general API responses — Task #6 stores
// originalFileBytes for the moderation viewer but it must NEVER leak
// through list/detail endpoints (could be up to 20MB per row).
function stripBytes<T extends { originalFileBytes?: unknown }>(doc: T): T {
  if (doc && "originalFileBytes" in doc) {
    const { originalFileBytes: _omit, ...rest } = doc as any;
    return rest as T;
  }
  return doc;
}

export async function getCurriculumDocument(
  id: string,
): Promise<CurriculumDocument | undefined> {
  const [doc] = await db
    .select()
    .from(curriculumDocuments)
    .where(eq(curriculumDocuments.id, id));
  return doc ? stripBytes(doc) : doc;
}

export async function listUserCurriculumDocuments(
  userId: string,
): Promise<CurriculumDocument[]> {
  const rows = await db
    .select()
    .from(curriculumDocuments)
    .where(
      and(
        eq(curriculumDocuments.uploadedByUserId, userId),
        eq(curriculumDocuments.isActive, true),
      ),
    )
    .orderBy(desc(curriculumDocuments.createdAt));
  return rows.map(stripBytes);
}

export async function listOrgCurriculumDocuments(
  organizationIds: string[],
): Promise<CurriculumDocument[]> {
  if (organizationIds.length === 0) return [];
  const rows = await db
    .select()
    .from(curriculumDocuments)
    .where(
      and(
        inArray(curriculumDocuments.organizationId, organizationIds),
        eq(curriculumDocuments.isActive, true),
      ),
    )
    .orderBy(desc(curriculumDocuments.createdAt));
  return rows.map(stripBytes);
}

export async function deleteCurriculumDocument(
  id: string,
  userId: string,
  isAdmin: boolean,
): Promise<boolean> {
  const doc = await getCurriculumDocument(id);
  if (!doc) return false;
  // Uploader can always delete their own. Admins must additionally be a
  // member of the document's organization to prevent cross-org deletion.
  if (doc.uploadedByUserId !== userId) {
    if (!isAdmin) return false;
    if (doc.organizationId) {
      const memberOrgIds = await getUserOrganizationIds(userId);
      if (!memberOrgIds.includes(doc.organizationId)) return false;
    }
  }
  // Soft-delete the row but hard-clear the stored file blob. The original
  // PDF/HTML bytes (up to 20MB each) are only needed for the moderation
  // side-by-side viewer of ACTIVE documents; keeping them on archived rows
  // silently bloats the database. Metadata stays for audit/recovery, and the
  // viewer's existing hasOriginal === false path handles the missing file.
  await db
    .update(curriculumDocuments)
    .set({ isActive: false, originalFileBytes: null, updatedAt: new Date() })
    .where(eq(curriculumDocuments.id, id));
  try {
    const { writeAuditLog } = await import("./ingestionModeration");
    await writeAuditLog({
      entityType: "curriculum_doc",
      entityId: id,
      action: "edited",
      actorUserId: userId,
      details: { archived: true, originalFileCleared: true },
    });
  } catch (err) {
    console.error("[curriculumLibrary] audit-log delete failed:", err);
  }
  return true;
}

// Maintenance sweep: null out stored file blobs on documents that were
// archived before clear-on-delete existed (or by any path that bypasses
// deleteCurriculumDocument). Data-only UPDATE — safe to run repeatedly.
// Returns the number of rows whose bytes were reclaimed.
export async function sweepArchivedCurriculumFileBytes(): Promise<number> {
  const cleared = await db
    .update(curriculumDocuments)
    .set({ originalFileBytes: null, updatedAt: new Date() })
    .where(
      and(
        eq(curriculumDocuments.isActive, false),
        isNotNull(curriculumDocuments.originalFileBytes),
      ),
    )
    .returning({ id: curriculumDocuments.id });
  return cleared.length;
}

async function getUserOrganizationIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ organizationId: organizationMemberships.organizationId })
    .from(organizationMemberships)
    .where(eq(organizationMemberships.userId, userId));
  return rows.map((r) => r.organizationId);
}

export async function updateExtractionStatus(
  id: string,
  status: "pending" | "processing" | "extracted" | "failed" | "skipped",
  opts: { extractionError?: string; standardsExtractedCount?: number } = {},
): Promise<void> {
  await db
    .update(curriculumDocuments)
    .set({
      extractionStatus: status,
      extractionError: opts.extractionError ?? null,
      standardsExtractedCount: opts.standardsExtractedCount ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(curriculumDocuments.id, id));
}

export async function attachLinkedLesson(
  id: string,
  lessonId: string,
  actorUserId?: string,
): Promise<void> {
  await db
    .update(curriculumDocuments)
    .set({ linkedLessonId: lessonId, updatedAt: new Date() })
    .where(eq(curriculumDocuments.id, id));
  try {
    const { writeAuditLog } = await import("./ingestionModeration");
    await writeAuditLog({
      entityType: "curriculum_doc",
      entityId: id,
      action: "edited",
      actorUserId: actorUserId ?? null,
      details: { linkedLessonId: lessonId },
    });
  } catch (err) {
    console.error("[curriculumLibrary] audit-log attach failed:", err);
  }
}

// ----- Org-private extracted standards -----

export async function insertOrgExtractedStandards(
  organizationId: string,
  curriculumDocumentId: string,
  standards: Array<{
    code: string;
    description: string;
    subject?: string | null;
    gradeLevel?: string | null;
    strand?: string | null;
  }>,
): Promise<number> {
  if (standards.length === 0) return 0;
  await db.insert(orgExtractedStandards).values(
    standards.map((s) => ({
      organizationId,
      curriculumDocumentId,
      code: s.code,
      description: s.description,
      subject: s.subject ?? null,
      gradeLevel: s.gradeLevel ?? null,
      strand: s.strand ?? null,
    })),
  );
  return standards.length;
}

export async function listOrgExtractedStandards(
  organizationIds: string[],
  filter: { subject?: string; gradeLevel?: string } = {},
): Promise<OrgExtractedStandard[]> {
  if (organizationIds.length === 0) return [];
  const conditions = [inArray(orgExtractedStandards.organizationId, organizationIds)];
  if (filter.subject) {
    conditions.push(eq(orgExtractedStandards.subject, filter.subject));
  }
  if (filter.gradeLevel) {
    conditions.push(eq(orgExtractedStandards.gradeLevel, filter.gradeLevel));
  }
  return await db
    .select()
    .from(orgExtractedStandards)
    .where(and(...conditions));
}

// ----- User org membership helper -----

export async function getUserOrgIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ organizationId: organizationMemberships.organizationId })
    .from(organizationMemberships)
    .where(eq(organizationMemberships.userId, userId));
  return rows.map((r) => r.organizationId);
}

// ----- Active alignment docs for a teacher's lesson generation -----
//
// Returns admin-uploaded YAG / scope-sequence docs scoped to the teacher's
// organizations that the teacher has NOT opted out of. These are the docs
// that will be auto-attached to a lesson generation request.
export async function getActiveAlignmentDocsForUser(
  userId: string,
  filter: { subject?: string; gradeLevel?: string } = {},
): Promise<CurriculumDocument[]> {
  const orgIds = await getUserOrgIds(userId);
  if (orgIds.length === 0) return [];

  // Get docs uploaded by admins to those orgs
  const conditions = [
    inArray(curriculumDocuments.organizationId, orgIds),
    eq(curriculumDocuments.uploaderRole, "admin"),
    eq(curriculumDocuments.isActive, true),
    inArray(curriculumDocuments.docType, ["yag", "scope_sequence"]),
    eq(curriculumDocuments.extractionStatus, "extracted"),
  ];
  if (filter.subject) {
    conditions.push(
      or(
        eq(curriculumDocuments.subject, filter.subject),
        isNull(curriculumDocuments.subject),
      )!,
    );
  }
  const docsRaw = await db
    .select()
    .from(curriculumDocuments)
    .where(and(...conditions));
  const docs = docsRaw.map(stripBytes);

  if (docs.length === 0) return [];

  // Filter out opt-outs
  const optOuts = await db
    .select({ docId: userCurriculumOptOuts.curriculumDocumentId })
    .from(userCurriculumOptOuts)
    .where(eq(userCurriculumOptOuts.userId, userId));
  const optOutSet = new Set(optOuts.map((o) => o.docId));

  let result = docs.filter((d) => !optOutSet.has(d.id));

  // Filter by grade if requested (gradeLevels is a JSON array)
  if (filter.gradeLevel) {
    result = result.filter((d) => {
      const grades = (d.gradeLevels as string[] | null) || [];
      return grades.length === 0 || grades.includes(filter.gradeLevel!);
    });
  }
  return result;
}

export async function setUserOptOut(
  userId: string,
  curriculumDocumentId: string,
  optOut: boolean,
): Promise<void> {
  if (optOut) {
    // Insert if not present
    const existing = await db
      .select()
      .from(userCurriculumOptOuts)
      .where(
        and(
          eq(userCurriculumOptOuts.userId, userId),
          eq(userCurriculumOptOuts.curriculumDocumentId, curriculumDocumentId),
        ),
      );
    if (existing.length === 0) {
      await db.insert(userCurriculumOptOuts).values({
        userId,
        curriculumDocumentId,
      });
    }
  } else {
    await db
      .delete(userCurriculumOptOuts)
      .where(
        and(
          eq(userCurriculumOptOuts.userId, userId),
          eq(userCurriculumOptOuts.curriculumDocumentId, curriculumDocumentId),
        ),
      );
  }
}

export async function listUserOptOuts(userId: string): Promise<string[]> {
  const rows = await db
    .select({ docId: userCurriculumOptOuts.curriculumDocumentId })
    .from(userCurriculumOptOuts)
    .where(eq(userCurriculumOptOuts.userId, userId));
  return rows.map((r) => r.docId);
}
