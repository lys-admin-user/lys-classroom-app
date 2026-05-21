// Routes for the customer-uploaded Curriculum Library and the Public
// Standards Ingestion pipeline.
//
// Endpoints (all under /api):
//   - /curriculum-library/permissions          GET   — what can the user do?
//   - /curriculum-library/documents            GET   — list user's + org's docs
//   - /curriculum-library/documents            POST  — upload (multipart)
//   - /curriculum-library/documents/:id        GET   — fetch one doc
//   - /curriculum-library/documents/:id        DELETE
//   - /curriculum-library/documents/:id/opt-out POST
//   - /curriculum-library/org-settings         GET / PATCH (admin only)
//   - /curriculum-library/extracted-standards  GET   — list org-private standards
//   - /standards-ingestion/requests            GET / POST
//   - /standards-ingestion/requests/:id        PATCH (system_admin)
//   - /standards-ingestion/sources             GET / POST  (system_admin)
//   - /standards-ingestion/sources/:id/sync    POST  (system_admin)
//   - /standards-ingestion/sweep               POST  (system_admin)
//   - /standards-ingestion/pending             GET   (system_admin)
//   - /standards-ingestion/pending/approve     POST  (system_admin)
//   - /standards-ingestion/pending/reject      POST  (system_admin)

import type { Express } from "express";
import multer from "multer";
import { z } from "zod";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";
import { parseDocument } from "../documentParser";
import {
  getUploadPermission,
  getOrgCurriculumSettings,
  setOrgAllowTeacherUploads,
  createCurriculumDocument,
  getCurriculumDocument,
  listUserCurriculumDocuments,
  listOrgCurriculumDocuments,
  deleteCurriculumDocument,
  setUserOptOut,
  listUserOptOuts,
  listOrgExtractedStandards,
  getUserOrgIds,
  attachLinkedLesson,
  updateExtractionStatus,
  getActiveAlignmentDocsForUser,
  type DocType,
} from "../services/curriculumLibrary";
import { extractStandardsInBackground } from "../services/curriculumExtraction";
import {
  createIngestionRequest,
  listIngestionRequests,
  updateRequestStatus,
  listSourceRegistry,
  addSource,
  runSyncForSource,
  runAnnualSweep,
  listPendingStandards,
  approvePendingStandards,
  rejectPendingStandards,
  seedSourceRegistryIfEmpty,
  startAnnualSweepScheduler,
} from "../services/publicStandardsIngestion";
import {
  listModerationQueue,
  listAuditLog,
  approveCurriculumDocs,
  rejectCurriculumDocs,
  type ModerationEntityType,
} from "../services/ingestionModeration";
import { db } from "../db";
import { eq, sql, desc, and, gte, inArray } from "drizzle-orm";
import {
  standardsSourceRegistry,
  standardsFallbackMisses,
  publicStandardsSyncRuns,
  pendingPublicStandards,
  curriculumDocuments,
  ingestionAuditLog,
} from "@shared/schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

const ADMIN_ROLES = new Set([
  "system_admin",
  "site_admin",
  "district_admin",
  "campus_admin",
]);
const SYS_ADMIN_ROLES = new Set(["system_admin", "site_admin"]);

async function requireUser(req: any, res: any): Promise<{ id: string; role: string } | null> {
  const userId = req.user?.claims?.sub;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  const user = await storage.getUser(userId);
  if (!user || !user.id) {
    res.status(401).json({ error: "User not found" });
    return null;
  }
  return { id: user.id, role: (user.role as string) || "educator" };
}

const uploadDocSchema = z.object({
  docType: z.enum(["scope_sequence", "yag", "lesson"]),
  title: z.string().min(1).max(500),
  subject: z.string().optional(),
  gradeLevels: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .transform((v) => (typeof v === "string" ? (v ? v.split(",") : []) : v || [])),
  country: z.string().optional(),
  state: z.string().optional(),
  schoolYear: z.string().optional(),
  organizationId: z.string().optional(),
});

export function registerCurriculumLibraryRoutes(app: Express): void {
  // Kick off background scheduler + seed registry once per process
  seedSourceRegistryIfEmpty().catch((err) =>
    console.error("[curriculumLibrary] seed registry failed:", err),
  );
  startAnnualSweepScheduler();

  // ---------- Permissions ----------
  app.get(
    "/api/curriculum-library/permissions",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      const orgIds = await getUserOrgIds(user.id);
      const primaryOrgId = orgIds[0] || null;
      const perm = await getUploadPermission(user.id, user.role, primaryOrgId);
      res.json({
        ...perm,
        orgIds,
        userRole: user.role,
        isAdmin: ADMIN_ROLES.has(user.role),
        isSystemAdmin: SYS_ADMIN_ROLES.has(user.role),
      });
    },
  );

  // ---------- Org settings ----------
  app.get(
    "/api/curriculum-library/org-settings/:orgId",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      if (!ADMIN_ROLES.has(user.role)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const settings = await getOrgCurriculumSettings(req.params.orgId);
      res.json(settings);
    },
  );

  app.patch(
    "/api/curriculum-library/org-settings/:orgId",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      if (!ADMIN_ROLES.has(user.role)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const allow = z.object({ allowTeacherUploads: z.boolean() }).parse(req.body);
      const settings = await setOrgAllowTeacherUploads(
        req.params.orgId,
        allow.allowTeacherUploads,
        user.id,
      );
      res.json(settings);
    },
  );

  // ---------- Documents ----------
  app.get(
    "/api/curriculum-library/documents",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      const orgIds = await getUserOrgIds(user.id);
      const [mine, orgDocs, optOuts] = await Promise.all([
        listUserCurriculumDocuments(user.id),
        listOrgCurriculumDocuments(orgIds),
        listUserOptOuts(user.id),
      ]);
      // Merge unique
      const seen = new Set<string>();
      const merged = [...mine, ...orgDocs].filter((d) => {
        if (seen.has(d.id)) return false;
        seen.add(d.id);
        return true;
      });
      const optOutSet = new Set(optOuts);
      res.json(
        merged.map((d) => ({
          ...d,
          // Strip extracted text from the list view to keep payload light
          extractedText: undefined,
          isOptedOut: optOutSet.has(d.id),
        })),
      );
    },
  );

  app.get(
    "/api/curriculum-library/documents/:id",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      const doc = await getCurriculumDocument(req.params.id);
      if (!doc || !doc.isActive) return res.status(404).json({ error: "Not found" });
      // Permission: uploader, same org member, or admin
      if (doc.uploadedByUserId !== user.id) {
        const orgIds = await getUserOrgIds(user.id);
        if (!doc.organizationId || !orgIds.includes(doc.organizationId)) {
          if (!ADMIN_ROLES.has(user.role)) {
            return res.status(403).json({ error: "Forbidden" });
          }
        }
      }
      res.json(doc);
    },
  );

  app.post(
    "/api/curriculum-library/documents",
    isAuthenticated,
    upload.single("file"),
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      if (!req.file) return res.status(400).json({ error: "File required" });

      let body: z.infer<typeof uploadDocSchema>;
      try {
        body = uploadDocSchema.parse(req.body);
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }

      const orgIds = await getUserOrgIds(user.id);
      const targetOrgId =
        body.organizationId && orgIds.includes(body.organizationId)
          ? body.organizationId
          : ADMIN_ROLES.has(user.role)
            ? body.organizationId || orgIds[0] || null
            : orgIds[0] || null;

      const perm = await getUploadPermission(user.id, user.role, targetOrgId);
      if (!perm.canUpload) {
        return res.status(403).json({ error: perm.reason || "Upload forbidden" });
      }

      // Parse the file to text
      let extractedText = "";
      try {
        const parsed = await parseDocument(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
        );
        extractedText = parsed.rawText || "";
      } catch (err: any) {
        return res
          .status(400)
          .json({ error: `Failed to parse file: ${err.message}` });
      }

      const uploaderRole: "admin" | "teacher" = perm.canUploadAsAdmin
        ? "admin"
        : "teacher";

      const doc = await createCurriculumDocument(
        {
          uploadedByUserId: user.id,
          uploaderRole,
          organizationId: targetOrgId,
          docType: body.docType as DocType,
          title: body.title,
          subject: body.subject ?? null,
          gradeLevels: body.gradeLevels,
          country: body.country ?? null,
          state: body.state ?? null,
          schoolYear: body.schoolYear ?? null,
          originalFilename: req.file.originalname,
          mimeType: req.file.mimetype,
          fileSizeBytes: req.file.size,
          isActive: true,
        } as any,
        extractedText,
        req.file.buffer,
      );

      // For pre-written lessons, route to the user's My Lessons by creating a
      // companion lesson row so they can edit / share / push to a class.
      if (body.docType === "lesson") {
        try {
          const lesson = await storage.createLesson({
            userId: user.id,
            title: body.title,
            topic: body.subject || "Curriculum",
            gradeLevel: (body.gradeLevels?.[0] as string) || "",
            objectives: ["Imported from curriculum library"],
            content: extractedText.slice(0, 50_000),
          } as any);
          if (lesson?.id) await attachLinkedLesson(doc.id, lesson.id);
        } catch (err) {
          console.error("[curriculumLibrary] failed to mirror to lessons:", err);
        }
        await updateExtractionStatus(doc.id, "skipped");
      } else if (targetOrgId) {
        // Fire-and-forget: extract structured standards in background
        extractStandardsInBackground(doc.id);
      } else {
        await updateExtractionStatus(doc.id, "skipped");
      }

      res.status(201).json({ ...doc, extractedText: undefined });
    },
  );

  app.delete(
    "/api/curriculum-library/documents/:id",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      const ok = await deleteCurriculumDocument(
        req.params.id,
        user.id,
        ADMIN_ROLES.has(user.role),
      );
      if (!ok) return res.status(404).json({ error: "Not found or forbidden" });
      res.json({ ok: true });
    },
  );

  app.post(
    "/api/curriculum-library/documents/:id/opt-out",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      const { optOut } = z.object({ optOut: z.boolean() }).parse(req.body);
      await setUserOptOut(user.id, req.params.id, optOut);
      res.json({ ok: true });
    },
  );

  // ---------- Active alignment docs (for LessonGenerator banner / injection) ----------
  app.get(
    "/api/curriculum-library/active-alignment-docs",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      const docs = await getActiveAlignmentDocsForUser(user.id, {
        subject: (req.query.subject as string) || undefined,
        gradeLevel: (req.query.gradeLevel as string) || undefined,
      });
      // Return summary + truncated excerpt for prompt injection
      res.json(
        docs.map((d) => ({
          id: d.id,
          title: d.title,
          subject: d.subject,
          gradeLevels: d.gradeLevels,
          docType: d.docType,
          excerpt: (d.extractedText || "").slice(0, 6000),
        })),
      );
    },
  );

  // ---------- Org-private extracted standards ----------
  app.get(
    "/api/curriculum-library/extracted-standards",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      const orgIds = await getUserOrgIds(user.id);
      const standards = await listOrgExtractedStandards(orgIds, {
        subject: (req.query.subject as string) || undefined,
        gradeLevel: (req.query.gradeLevel as string) || undefined,
      });
      res.json(standards);
    },
  );

  // ============== Public Standards Ingestion ==============

  // Ingestion requests
  app.get(
    "/api/standards-ingestion/requests",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      // Admins see all; everyone else sees their own
      if (SYS_ADMIN_ROLES.has(user.role)) {
        const status = (req.query.status as string) || undefined;
        const list = await listIngestionRequests({ status });
        return res.json(list);
      }
      const all = await listIngestionRequests();
      res.json(all.filter((r) => r.requestedByUserId === user.id));
    },
  );

  app.post(
    "/api/standards-ingestion/requests",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      // Updated product decision (May 2026): any authenticated user can
      // submit a standards-ingestion REQUEST (admins still process them on
      // the ingestion dashboard). This is what backs the RequestStandardsCard
      // in CurriculumLibrary and the "Request this curriculum" empty-state
      // CTA in LessonGenerator — without it educators would hit 403.
      const body = z
        .object({
          country: z.string().min(1),
          state: z.string().optional(),
          notes: z.string().optional(),
        })
        .parse(req.body);
      const orgIds = await getUserOrgIds(user.id);
      const request = await createIngestionRequest({
        country: body.country,
        state: body.state,
        requestedByUserId: user.id,
        requesterRole: user.role,
        requesterOrgId: orgIds[0],
        notes: body.notes,
      });
      res.status(201).json(request);
    },
  );

  app.patch(
    "/api/standards-ingestion/requests/:id",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      if (!SYS_ADMIN_ROLES.has(user.role)) {
        return res.status(403).json({ error: "System admin required" });
      }
      const body = z
        .object({
          status: z.enum(["pending", "approved", "in_progress", "completed", "rejected"]),
          reviewNotes: z.string().optional(),
        })
        .parse(req.body);
      await updateRequestStatus(req.params.id, body.status, user.id, body.reviewNotes);
      res.json({ ok: true });
    },
  );

  // Source registry
  app.get(
    "/api/standards-ingestion/sources",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      if (!SYS_ADMIN_ROLES.has(user.role)) {
        return res.status(403).json({ error: "System admin required" });
      }
      res.json(await listSourceRegistry());
    },
  );

  app.post(
    "/api/standards-ingestion/sources",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      if (!SYS_ADMIN_ROLES.has(user.role)) {
        return res.status(403).json({ error: "System admin required" });
      }
      const body = z
        .object({
          country: z.string().min(1),
          state: z.string().optional(),
          sourceName: z.string().min(1),
          sourceUrl: z.string().url(),
          notes: z.string().optional(),
        })
        .parse(req.body);
      const row = await addSource(body);
      res.status(201).json(row);
    },
  );

  app.post(
    "/api/standards-ingestion/sources/:id/sync",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      if (!SYS_ADMIN_ROLES.has(user.role)) {
        return res.status(403).json({ error: "System admin required" });
      }
      const ingestionRequestId = (req.body?.ingestionRequestId as string) || undefined;
      const [source] = await db
        .select()
        .from(standardsSourceRegistry)
        .where(eq(standardsSourceRegistry.id, req.params.id));
      if (!source) return res.status(404).json({ error: "Source not found" });
      // Run sync (sync — could be slow but we want the result for the UI)
      const run = await runSyncForSource(source, user.id, "manual", ingestionRequestId);
      res.json(run);
    },
  );

  app.post(
    "/api/standards-ingestion/sweep",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      if (!SYS_ADMIN_ROLES.has(user.role)) {
        return res.status(403).json({ error: "System admin required" });
      }
      // Run async — don't make the user wait. Route to the new
      // `runAnnualCleanup` so manual admin sweeps get the same coverage-mode
      // backfill + fallback-miss aggregation as the July-1 cron, instead of
      // the bare per-source loop from the old `runAnnualSweep` path.
      const { runAnnualCleanup } = await import(
        "../services/publicStandardsIngestion"
      );
      runAnnualCleanup(user.id).catch((err) =>
        console.error("[publicStandardsIngestion] manual cleanup failed:", err),
      );
      res.json({ ok: true, message: "Annual cleanup started in background" });
    },
  );

  // Pending review
  app.get(
    "/api/standards-ingestion/pending",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      if (!SYS_ADMIN_ROLES.has(user.role)) {
        return res.status(403).json({ error: "System admin required" });
      }
      const list = await listPendingStandards({
        country: (req.query.country as string) || undefined,
        status: (req.query.status as string) || "pending_review",
      });
      res.json(list);
    },
  );

  app.post(
    "/api/standards-ingestion/pending/approve",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      if (!SYS_ADMIN_ROLES.has(user.role)) {
        return res.status(403).json({ error: "System admin required" });
      }
      const body = z
        .object({ ids: z.array(z.string()).min(1), reason: z.string().optional() })
        .parse(req.body);
      try {
        const result = await approvePendingStandards(body.ids, user.id, body.reason);
        res.json(result);
      } catch (err: any) {
        res.status(409).json({ error: err.message || "Bulk approve failed" });
      }
    },
  );

  app.post(
    "/api/standards-ingestion/pending/reject",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      if (!SYS_ADMIN_ROLES.has(user.role)) {
        return res.status(403).json({ error: "System admin required" });
      }
      const body = z
        .object({ ids: z.array(z.string()).min(1), reason: z.string().optional() })
        .parse(req.body);
      try {
        const result = await rejectPendingStandards(body.ids, user.id, body.reason);
        res.json(result);
      } catch (err: any) {
        res.status(409).json({ error: err.message || "Bulk reject failed" });
      }
    },
  );

  // ---------- Moderation queue (Task #6) ----------
  // Merged feed of pending public standards + pending curriculum docs.
  app.get(
    "/api/standards-ingestion/moderation-queue",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      if (!SYS_ADMIN_ROLES.has(user.role)) {
        return res.status(403).json({ error: "System admin required" });
      }
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const offset = Math.max(Number(req.query.offset) || 0, 0);
      const kind = (req.query.kind as string) || "all";
      if (!["all", "pending_standard", "curriculum_doc"].includes(kind)) {
        return res.status(400).json({ error: "Invalid kind filter" });
      }
      const result = await listModerationQueue({
        limit,
        offset,
        kind: kind as "all" | "pending_standard" | "curriculum_doc",
      });
      res.json(result);
    },
  );

  // Audit trail for a single queue item.
  app.get(
    "/api/standards-ingestion/audit-log/:entityType/:entityId",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      if (!SYS_ADMIN_ROLES.has(user.role)) {
        return res.status(403).json({ error: "System admin required" });
      }
      const entityType = req.params.entityType as ModerationEntityType;
      if (!["pending_standard", "curriculum_doc"].includes(entityType)) {
        return res.status(400).json({ error: "Invalid entityType" });
      }
      const log = await listAuditLog(entityType, req.params.entityId);
      res.json(log);
    },
  );

  // Side-by-side viewer source for a queue item. Returns the extracted text
  // (left pane) and a hint for rendering the source on the right pane.
  app.get(
    "/api/standards-ingestion/moderation-source/:entityType/:entityId",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      if (!SYS_ADMIN_ROLES.has(user.role)) {
        return res.status(403).json({ error: "System admin required" });
      }
      const entityType = req.params.entityType as ModerationEntityType;
      const id = req.params.entityId;
      if (entityType === "pending_standard") {
        const [row] = await db
          .select()
          .from(pendingPublicStandards)
          .where(eq(pendingPublicStandards.id, id));
        if (!row) return res.status(404).json({ error: "Not found" });
        return res.json({
          kind: "pending_standard",
          extracted: {
            code: row.code,
            description: row.description,
            subject: row.subject,
            gradeLevel: row.gradeLevel,
            strand: row.strand,
            confidenceScore: row.confidenceScore,
          },
          source: {
            type: "url",
            url: row.sourceUrl,
          },
          item: row,
        });
      }
      if (entityType === "curriculum_doc") {
        const doc = await getCurriculumDocument(id);
        if (!doc) return res.status(404).json({ error: "Not found" });
        // getCurriculumDocument strips originalFileBytes for general callers,
        // so we re-check existence here without loading the blob.
        const [presence] = await db
          .select({
            hasOriginal: sql<boolean>`${curriculumDocuments.originalFileBytes} IS NOT NULL`,
          })
          .from(curriculumDocuments)
          .where(eq(curriculumDocuments.id, id));
        const hasOriginal = !!presence?.hasOriginal;
        const sourceType: "pdf" | "html" =
          doc.mimeType === "application/pdf" ? "pdf" : "html";
        return res.json({
          kind: "curriculum_doc",
          extracted: {
            text: doc.extractedText || "",
            standardsExtractedCount: doc.standardsExtractedCount ?? 0,
            extractionStatus: doc.extractionStatus,
          },
          source: {
            type: sourceType,
            filename: doc.originalFilename,
            mimeType: doc.mimeType,
            sizeBytes: doc.fileSizeBytes,
            hasOriginal,
            fileUrl: hasOriginal
              ? `/api/standards-ingestion/moderation-file/${doc.id}`
              : null,
          },
          item: doc,
        });
      }
      return res.status(400).json({ error: "Invalid entityType" });
    },
  );

  // Serve the original uploaded file bytes for the side-by-side viewer.
  // The browser natively renders PDFs in an iframe and HTML in a sandboxed
  // iframe (we set the Content-Type from the stored mimeType).
  app.get(
    "/api/standards-ingestion/moderation-file/:id",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      if (!SYS_ADMIN_ROLES.has(user.role)) {
        return res.status(403).json({ error: "System admin required" });
      }
      const [row] = await db
        .select({
          bytes: curriculumDocuments.originalFileBytes,
          mimeType: curriculumDocuments.mimeType,
          filename: curriculumDocuments.originalFilename,
        })
        .from(curriculumDocuments)
        .where(eq(curriculumDocuments.id, req.params.id));
      if (!row || !row.bytes) {
        return res.status(404).json({ error: "Original file not stored" });
      }
      res.setHeader("Content-Type", row.mimeType || "application/octet-stream");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(row.filename || "document")}"`,
      );
      // HTML must be sandboxed by the iframe consumer; we also set CSP so
      // an injected HTML upload can't reach back into the admin origin.
      if ((row.mimeType || "").startsWith("text/html")) {
        res.setHeader(
          "Content-Security-Policy",
          "default-src 'none'; img-src data:; style-src 'unsafe-inline'",
        );
      }
      res.send(Buffer.isBuffer(row.bytes) ? row.bytes : Buffer.from(row.bytes as any));
    },
  );

  // Unified atomic bulk moderation endpoint (Task #6 atomicity requirement).
  // Accepts a mixed list of {kind,id} items and processes them in a single
  // DB transaction so a partial failure rolls back EVERY change across both
  // pending standards and curriculum docs.
  app.post(
    "/api/standards-ingestion/moderation/bulk",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      if (!SYS_ADMIN_ROLES.has(user.role)) {
        return res.status(403).json({ error: "System admin required" });
      }
      const body = z
        .object({
          action: z.enum(["approve", "reject"]),
          reason: z.string().optional(),
          items: z
            .array(
              z.object({
                kind: z.enum(["pending_standard", "curriculum_doc"]),
                id: z.string().min(1),
              }),
            )
            .min(1),
        })
        .parse(req.body);
      if (body.action === "reject" && !body.reason?.trim()) {
        return res.status(400).json({ error: "Reason required for rejection" });
      }
      const stdIds = body.items.filter((i) => i.kind === "pending_standard").map((i) => i.id);
      const docIds = body.items.filter((i) => i.kind === "curriculum_doc").map((i) => i.id);
      try {
        const result = await db.transaction(async (tx) => {
          let approvedStds = 0;
          let approvedDocs = 0;
          let rejectedStds = 0;
          let rejectedDocs = 0;
          if (body.action === "approve") {
            if (stdIds.length > 0) {
              const r = await approvePendingStandards(stdIds, user.id, body.reason, tx);
              approvedStds = r.approved;
            }
            if (docIds.length > 0) {
              // Inline atomic doc approve using the same tx so failures roll
              // back across both entity types.
              const targets = await tx
                .select({ id: curriculumDocuments.id })
                .from(curriculumDocuments)
                .where(
                  and(
                    inArray(curriculumDocuments.id, docIds),
                    eq(curriculumDocuments.isActive, true),
                    eq(curriculumDocuments.moderationStatus, "pending"),
                  ),
                );
              if (targets.length !== docIds.length) {
                throw new Error(
                  `Bulk approve aborted: ${docIds.length - targets.length} of ${docIds.length} doc(s) not found, inactive, or already reviewed`,
                );
              }
              await tx
                .update(curriculumDocuments)
                .set({
                  moderationStatus: "approved",
                  moderationReason: body.reason ?? null,
                  moderationReviewedByUserId: user.id,
                  moderationReviewedAt: new Date(),
                  updatedAt: new Date(),
                })
                .where(inArray(curriculumDocuments.id, docIds));
              await tx.insert(ingestionAuditLog).values(
                docIds.map((id) => ({
                  entityType: "curriculum_doc" as const,
                  entityId: id,
                  action: "approved" as const,
                  actorUserId: user.id,
                  reason: body.reason ?? null,
                })),
              );
              approvedDocs = docIds.length;
            }
          } else {
            if (stdIds.length > 0) {
              const r = await rejectPendingStandards(stdIds, user.id, body.reason, tx);
              rejectedStds = r.rejected;
            }
            if (docIds.length > 0) {
              const targets = await tx
                .select({ id: curriculumDocuments.id })
                .from(curriculumDocuments)
                .where(
                  and(
                    inArray(curriculumDocuments.id, docIds),
                    eq(curriculumDocuments.isActive, true),
                    eq(curriculumDocuments.moderationStatus, "pending"),
                  ),
                );
              if (targets.length !== docIds.length) {
                throw new Error(
                  `Bulk reject aborted: ${docIds.length - targets.length} of ${docIds.length} doc(s) not found, inactive, or already reviewed`,
                );
              }
              await tx
                .update(curriculumDocuments)
                .set({
                  moderationStatus: "rejected",
                  moderationReason: body.reason!,
                  moderationReviewedByUserId: user.id,
                  moderationReviewedAt: new Date(),
                  updatedAt: new Date(),
                })
                .where(inArray(curriculumDocuments.id, docIds));
              await tx.insert(ingestionAuditLog).values(
                docIds.map((id) => ({
                  entityType: "curriculum_doc" as const,
                  entityId: id,
                  action: "rejected" as const,
                  actorUserId: user.id,
                  reason: body.reason!,
                })),
              );
              rejectedDocs = docIds.length;
            }
          }
          return { approvedStds, approvedDocs, rejectedStds, rejectedDocs };
        });
        res.json(result);
      } catch (err: any) {
        res.status(409).json({ error: err.message || "Bulk moderation failed" });
      }
    },
  );

  // Bulk approve curriculum docs.
  app.post(
    "/api/standards-ingestion/curriculum-docs/approve",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      if (!SYS_ADMIN_ROLES.has(user.role)) {
        return res.status(403).json({ error: "System admin required" });
      }
      const body = z
        .object({ ids: z.array(z.string()).min(1), reason: z.string().optional() })
        .parse(req.body);
      try {
        const result = await approveCurriculumDocs(body.ids, user.id, body.reason);
        res.json(result);
      } catch (err: any) {
        res.status(409).json({ error: err.message || "Bulk approve failed" });
      }
    },
  );

  // Bulk reject curriculum docs — reason required.
  app.post(
    "/api/standards-ingestion/curriculum-docs/reject",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      if (!SYS_ADMIN_ROLES.has(user.role)) {
        return res.status(403).json({ error: "System admin required" });
      }
      const body = z
        .object({ ids: z.array(z.string()).min(1), reason: z.string().min(1) })
        .parse(req.body);
      try {
        const result = await rejectCurriculumDocs(body.ids, user.id, body.reason);
        res.json(result);
      } catch (err: any) {
        res.status(409).json({ error: err.message || "Bulk reject failed" });
      }
    },
  );

  // Track B #2 — Coverage gaps. Returns the top (country, state, subject)
  // groupings from the trailing 12 months of fallback misses, so admins
  // can prioritize ingestion effort by actual teacher demand. Limit 50.
  app.get(
    "/api/standards-ingestion/coverage-gaps",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      if (!SYS_ADMIN_ROLES.has(user.role)) {
        return res.status(403).json({ error: "System admin required" });
      }
      const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      const rows = await db
        .select({
          country: standardsFallbackMisses.country,
          state: standardsFallbackMisses.state,
          subject: standardsFallbackMisses.subject,
          fallbackKind: standardsFallbackMisses.fallbackKind,
          missCount: sql<number>`count(*)::int`,
          lastSeen: sql<Date>`max(${standardsFallbackMisses.createdAt})`,
        })
        .from(standardsFallbackMisses)
        .where(gte(standardsFallbackMisses.createdAt, since))
        .groupBy(
          standardsFallbackMisses.country,
          standardsFallbackMisses.state,
          standardsFallbackMisses.subject,
          standardsFallbackMisses.fallbackKind,
        )
        .orderBy(desc(sql`count(*)`))
        .limit(50);
      res.json(rows);
    },
  );

  // Track B #3 — Sync run history with verbatim-rejected counts so admins
  // can spot sources whose AI suggestions get filtered out a lot (= the
  // source HTML is hard to parse or the model is hallucinating against it).
  app.get(
    "/api/standards-ingestion/runs",
    isAuthenticated,
    async (req: any, res) => {
      const user = await requireUser(req, res);
      if (!user) return;
      if (!SYS_ADMIN_ROLES.has(user.role)) {
        return res.status(403).json({ error: "System admin required" });
      }
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const rows = await db
        .select()
        .from(publicStandardsSyncRuns)
        .where(
          // Hide the marker rows the year-lock writes — admins don't care.
          sql`${publicStandardsSyncRuns.triggerType} <> 'annual_cleanup_marker'`,
        )
        .orderBy(desc(publicStandardsSyncRuns.startedAt))
        .limit(limit);
      res.json(rows);
    },
  );
}
