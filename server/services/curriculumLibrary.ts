// Data access + business logic for the customer-uploaded curriculum library
// (Campus / Enterprise feature). Kept outside the giant IStorage interface
// because this is a self-contained feature surface and the interface is
// already 4,200+ lines.

import { db } from "../db";
import { eq, and, desc, inArray, or, isNull, sql } from "drizzle-orm";
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
  // Teachers / homeschool / staff can upload as personal docs
  // when they have no org context, or when org settings allow
  if (
    userRole === "educator" ||
    userRole === "homeschool_parent" ||
    userRole === "staff"
  ) {
    if (!organizationId) {
      return { canUpload: true, canUploadAsAdmin: false };
    }
    const settings = await getOrgCurriculumSettings(organizationId);
    if (settings.allowTeacherUploads) {
      return { canUpload: true, canUploadAsAdmin: false };
    }
    return {
      canUpload: false,
      canUploadAsAdmin: false,
      reason:
        "Your school admin has disabled teacher uploads. Contact them if you need access.",
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
): Promise<CurriculumDocument> {
  const [doc] = await db
    .insert(curriculumDocuments)
    .values({
      ...data,
      extractedText,
      extractionStatus: data.docType === "lesson" ? "skipped" : "pending",
    })
    .returning();
  return doc;
}

export async function getCurriculumDocument(
  id: string,
): Promise<CurriculumDocument | undefined> {
  const [doc] = await db
    .select()
    .from(curriculumDocuments)
    .where(eq(curriculumDocuments.id, id));
  return doc;
}

export async function listUserCurriculumDocuments(
  userId: string,
): Promise<CurriculumDocument[]> {
  return await db
    .select()
    .from(curriculumDocuments)
    .where(
      and(
        eq(curriculumDocuments.uploadedByUserId, userId),
        eq(curriculumDocuments.isActive, true),
      ),
    )
    .orderBy(desc(curriculumDocuments.createdAt));
}

export async function listOrgCurriculumDocuments(
  organizationIds: string[],
): Promise<CurriculumDocument[]> {
  if (organizationIds.length === 0) return [];
  return await db
    .select()
    .from(curriculumDocuments)
    .where(
      and(
        inArray(curriculumDocuments.organizationId, organizationIds),
        eq(curriculumDocuments.isActive, true),
      ),
    )
    .orderBy(desc(curriculumDocuments.createdAt));
}

export async function deleteCurriculumDocument(
  id: string,
  userId: string,
  isAdmin: boolean,
): Promise<boolean> {
  const doc = await getCurriculumDocument(id);
  if (!doc) return false;
  // Only the uploader, or any admin with rights to that org, can delete.
  if (doc.uploadedByUserId !== userId && !isAdmin) return false;
  await db
    .update(curriculumDocuments)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(curriculumDocuments.id, id));
  return true;
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
): Promise<void> {
  await db
    .update(curriculumDocuments)
    .set({ linkedLessonId: lessonId, updatedAt: new Date() })
    .where(eq(curriculumDocuments.id, id));
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
  const docs = await db
    .select()
    .from(curriculumDocuments)
    .where(and(...conditions));

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
