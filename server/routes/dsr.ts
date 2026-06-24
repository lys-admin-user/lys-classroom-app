import type { Express } from "express";
import { z } from "zod";
import { isAuthenticated } from "../replit_integrations/auth";
import { requireFreshMfa } from "./mfa";
import { storage } from "../storage";
import { logAuditEvent, getClientIP } from "../services/auditLog";
import {
  canActOnSubject,
  exportUserData,
  processDeletion,
  createDataSubjectRequest,
  completeDataSubjectRequest,
  listDataSubjectRequests,
  getActorDsrScope,
  getUserIdsInOrgs,
} from "../services/dataSubjectService";

const deleteSchema = z.object({
  subjectUserId: z.string().optional(),
  reason: z.string().max(1000).optional(),
});

export function registerDsrRoutes(app: Express): void {
  // Export a subject's data (GDPR/CCPA right of access). Defaults to the caller;
  // a parent/guardian or admin may export another subject's data.
  app.get("/api/dsr/export", isAuthenticated, requireFreshMfa, async (req: any, res) => {
    try {
      const actorId = req.user?.claims?.sub;
      const actor = await storage.getUser(actorId);
      const actorRole = (actor?.role || "student") as string;
      const subjectUserId = (req.query.subjectUserId as string) || actorId;

      const allowed = await canActOnSubject(actorId, actorRole, subjectUserId);
      if (!allowed) {
        await logAuditEvent({
          userId: actorId,
          action: "dsr.export_denied",
          category: "security",
          severity: "warning",
          resourceType: "user",
          resourceId: subjectUserId,
          ipAddress: getClientIP(req),
          userAgent: req.get("user-agent"),
        });
        return res.status(403).json({ error: "Not permitted to export this subject's data" });
      }

      const request = await createDataSubjectRequest({
        type: "export",
        subjectUserId,
        requestedBy: actorId,
        requestedByRole: actorRole,
        scope: subjectUserId === actorId ? "self" : "school",
      });

      const data = await exportUserData(subjectUserId);
      await completeDataSubjectRequest(request.id, "completed", { exported: true });
      await logAuditEvent({
        userId: actorId,
        action: "dsr.export",
        category: "data_access",
        severity: "info",
        resourceType: "user",
        resourceId: subjectUserId,
        details: { requestId: request.id },
        ipAddress: getClientIP(req),
        userAgent: req.get("user-agent"),
      });

      res.setHeader("Content-Disposition", `attachment; filename="data-export-${subjectUserId}.json"`);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Delete a subject's data (GDPR/CCPA right to erasure). Self-serve accounts are
  // hard-deleted; school-owned student records are anonymized. When the subject
  // is a student, the school admin(s) and parent(s) are alerted.
  app.post("/api/dsr/delete", isAuthenticated, requireFreshMfa, async (req: any, res) => {
    try {
      const actorId = req.user?.claims?.sub;
      const actor = await storage.getUser(actorId);
      const actorRole = (actor?.role || "student") as string;
      const { subjectUserId: bodySubject, reason } = deleteSchema.parse(req.body);
      const subjectUserId = bodySubject || actorId;

      const allowed = await canActOnSubject(actorId, actorRole, subjectUserId);
      if (!allowed) {
        await logAuditEvent({
          userId: actorId,
          action: "dsr.delete_denied",
          category: "security",
          severity: "warning",
          resourceType: "user",
          resourceId: subjectUserId,
          ipAddress: getClientIP(req),
          userAgent: req.get("user-agent"),
        });
        return res.status(403).json({ error: "Not permitted to delete this subject's data" });
      }

      const request = await createDataSubjectRequest({
        type: "delete",
        subjectUserId,
        requestedBy: actorId,
        requestedByRole: actorRole,
        scope: subjectUserId === actorId ? "self" : "school",
        reason,
      });

      const result = await processDeletion({ subjectUserId, actorId });
      await completeDataSubjectRequest(request.id, "completed", { ...result });
      await logAuditEvent({
        userId: actorId,
        action: "dsr.delete",
        category: "data_modify",
        severity: "critical",
        resourceType: "user",
        resourceId: subjectUserId,
        details: { requestId: request.id, strategy: result.strategy },
        ipAddress: getClientIP(req),
        userAgent: req.get("user-agent"),
      });

      res.json({ success: true, strategy: result.strategy, alerted: { parents: result.alertedParents, admins: result.alertedAdmins } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request", details: error.errors });
      }
      res.status(500).json({ error: "Failed to process deletion" });
    }
  });

  // Admin view of all data subject requests for compliance reporting.
  app.get("/api/dsr/requests", isAuthenticated, async (req: any, res) => {
    try {
      const actorId = req.user?.claims?.sub;
      const actor = await storage.getUser(actorId);
      const role = (actor?.role || "student") as string;
      const adminRoles = new Set(["campus_admin", "district_admin", "site_admin", "system_admin"]);
      if (!adminRoles.has(role)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const requests = await listDataSubjectRequests({
        subjectUserId: req.query.subjectUserId as string | undefined,
        status: req.query.status as string | undefined,
      });

      // Platform admins (site/system) see everything. Campus/district admins are
      // scoped to subjects within their managed organization sub-tree so one
      // tenant's compliance officer can't enumerate another tenant's requests.
      const scope = await getActorDsrScope(actorId, role);
      if (scope.isPlatformAdmin) {
        return res.json(requests);
      }
      const visibleUserIds = await getUserIdsInOrgs(scope.managedOrgIds);
      const scoped = requests.filter(
        (r) => r.subjectUserId === actorId || visibleUserIds.has(r.subjectUserId),
      );
      res.json(scoped);
    } catch (error) {
      res.status(500).json({ error: "Failed to list requests" });
    }
  });
}
