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
import { db } from "../db";
import { eq } from "drizzle-orm";
import { standardsSourceRegistry } from "@shared/schema";

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
      // Per product decision: admins-only trigger (system_admin can act for unaffiliated users)
      if (!ADMIN_ROLES.has(user.role)) {
        return res.status(403).json({
          error: "Only campus / district / system admins can request standards ingestion",
        });
      }
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
      const { ids } = z.object({ ids: z.array(z.string()).min(1) }).parse(req.body);
      const result = await approvePendingStandards(ids, user.id);
      res.json(result);
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
      const { ids } = z.object({ ids: z.array(z.string()).min(1) }).parse(req.body);
      const result = await rejectPendingStandards(ids, user.id);
      res.json(result);
    },
  );
}
