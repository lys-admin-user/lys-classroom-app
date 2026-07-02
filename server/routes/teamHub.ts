import type { Express, RequestHandler } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";
import { requireStaffOrAdmin, requireFoundationAdmin } from "./_helpers";
import { requireFreshMfa } from "./mfa";
import { logAuditEvent } from "../services/auditLog";
import {
  canAccessTeamHub,
  isFoundationAdmin,
  shouldElevateRoleOnApproval,
  shouldRestoreRoleOnRevoke,
} from "../services/teamAccessPolicy";
import { insertHrRoleSchema, insertEmployeeSchema, insertHrOnboardingTaskSchema } from "@shared/schema";

// Writes to the directory/roster are admin-managed (site_admin/system_admin).
const requireManage = requireFoundationAdmin;

// Team Hub membership gate: holding the `staff` role is not enough — the user
// must also be an APPROVED member (staff_access_requests.status = "approved").
// Site/system admins pass implicitly (they are the approvers). Runs after
// requireStaffOrAdmin, so this only ever tightens access.
const requireApprovedStaff: RequestHandler = async (req: any, res, next) => {
  try {
    const userId = req.user?.claims?.sub;
    const user = userId ? await storage.getUser(userId) : undefined;
    const access = userId ? await storage.getStaffAccessRequestByUser(userId) : undefined;
    if (canAccessTeamHub(user?.role, access?.status)) return next();
    return res.status(403).json({
      error: "Team Hub membership requires approval by a site or system admin",
      accessStatus: access?.status ?? "none",
    });
  } catch (e) {
    console.error("requireApprovedStaff error:", e);
    return res.status(500).json({ error: "Access check failed" });
  }
};

const createEmployeeBody = insertEmployeeSchema.extend({
  startDate: z.coerce.date().optional().nullable(),
});

const updateTaskBody = insertHrOnboardingTaskSchema.partial();
// A regular staffer may only move their own task between statuses — nothing else.
const staffTaskUpdateBody = z.object({
  status: z.enum(["todo", "in_progress", "done"]),
});

// Resolves who is asking: managers (site_admin/system_admin) see the whole
// roster; everyone else is scoped to their own linked employee record.
async function getScope(userId: string) {
  const user = await storage.getUser(userId);
  const isManager = Boolean(user && (user.role === "site_admin" || user.role === "system_admin"));
  const me = await storage.getEmployeeByUserId(userId);
  return { user, isManager, me };
}

export function registerTeamHubRoutes(app: Express) {
  // ---------- Membership access (request + approval) ----------
  // Own status — used by the sidebar/command palette to hide Team Hub until
  // approved, and by the Team Hub page to show a pending/request state.
  app.get("/api/team/access/me", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (isFoundationAdmin(user?.role)) {
        return res.json({ status: "approved", canManage: true });
      }
      const access = await storage.getStaffAccessRequestByUser(userId);
      res.json({ status: access?.status ?? "none", canManage: false });
    } catch (e) {
      res.status(500).json({ error: "Failed to load access status" });
    }
  });

  // Ask to become a Team Hub staff member. Creates a pending request (or
  // re-opens a denied one); approved rows are never downgraded.
  app.post("/api/team/access/request", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (isFoundationAdmin(user?.role)) {
        return res.status(400).json({ error: "Admins already have Team Hub access" });
      }
      const parsed = z.object({ message: z.string().max(1000).optional() }).safeParse(req.body ?? {});
      if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
      const row = await storage.upsertStaffAccessRequest(userId, parsed.data.message ?? null);
      await logAuditEvent({
        userId,
        action: "team_hub.access_requested",
        category: "admin_action",
        severity: "info",
        resourceType: "staff_access_request",
        resourceId: row.id,
        details: { status: row.status },
        ipAddress: req.ip || "",
      });
      res.status(201).json(row);
    } catch (e) {
      console.error("Staff access request error:", e);
      res.status(500).json({ error: "Failed to submit request" });
    }
  });

  // Approval queue — strictly site_admin/system_admin.
  app.get("/api/team/access/requests", isAuthenticated, requireManage, async (req: any, res) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const rows = await storage.getStaffAccessRequests(status);
      const enriched = await Promise.all(
        rows.map(async (r) => {
          const u = await storage.getUser(r.userId);
          return {
            ...r,
            user: u
              ? { id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role }
              : null,
          };
        }),
      );
      res.json(enriched);
    } catch (e) {
      res.status(500).json({ error: "Failed to load access requests" });
    }
  });

  // Approving grants Team Hub membership (an access grant — fresh MFA
  // required, like other sensitive admin actions) and elevates basic roles
  // to `staff`. Admin-level roles are never downgraded.
  app.post(
    "/api/team/access/requests/:id/approve",
    isAuthenticated,
    requireManage,
    requireFreshMfa,
    async (req: any, res) => {
      try {
        const adminId = req.user.claims.sub;
        const existing = await storage.getStaffAccessRequest(req.params.id);
        if (!existing) return res.status(404).json({ error: "Request not found" });
        const subject = await storage.getUser(existing.userId);
        const willElevate = !!subject && shouldElevateRoleOnApproval(subject.role);
        // Record the pre-approval role so a later revoke can restore it.
        const row = await storage.decideStaffAccessRequest(existing.id, "approved", adminId, {
          priorRole: willElevate ? subject!.role : null,
        });
        let roleElevated = false;
        if (willElevate) {
          try {
            await storage.updateUserRole(subject!.id, "staff");
            roleElevated = true;
          } catch (roleErr) {
            // Compensate: don't leave an approved row whose role grant failed.
            await storage.decideStaffAccessRequest(existing.id, "denied", adminId, { priorRole: null });
            console.error("Staff access approve role-elevation failed, approval rolled back:", roleErr);
            return res.status(500).json({ error: "Failed to grant staff role — approval rolled back" });
          }
        }
        await logAuditEvent({
          userId: adminId,
          action: "team_hub.access_approved",
          category: "admin_action",
          severity: "warning",
          resourceType: "staff_access_request",
          resourceId: existing.id,
          details: { subjectUserId: existing.userId, roleElevated },
          ipAddress: req.ip || "",
        });
        res.json({ ...row, roleElevated });
      } catch (e) {
        console.error("Staff access approve error:", e);
        res.status(500).json({ error: "Failed to approve request" });
      }
    },
  );

  app.post(
    "/api/team/access/requests/:id/deny",
    isAuthenticated,
    requireManage,
    async (req: any, res) => {
      try {
        const adminId = req.user.claims.sub;
        const existing = await storage.getStaffAccessRequest(req.params.id);
        if (!existing) return res.status(404).json({ error: "Request not found" });
        if (existing.status === "approved") {
          // Revoking an approved membership: if approval elevated this user to
          // `staff`, restore their previous role so no privilege lingers.
          const subject = await storage.getUser(existing.userId);
          let roleRestored = false;
          if (shouldRestoreRoleOnRevoke(existing.priorRole, subject?.role)) {
            await storage.updateUserRole(existing.userId, existing.priorRole as any);
            roleRestored = true;
          }
          const row = await storage.decideStaffAccessRequest(existing.id, "denied", adminId, {
            priorRole: null,
          });
          await logAuditEvent({
            userId: adminId,
            action: "team_hub.access_revoked",
            category: "admin_action",
            severity: "warning",
            resourceType: "staff_access_request",
            resourceId: existing.id,
            details: { subjectUserId: existing.userId, roleRestored, restoredRole: roleRestored ? existing.priorRole : null },
            ipAddress: req.ip || "",
          });
          return res.json({ ...row, roleRestored });
        }
        const row = await storage.decideStaffAccessRequest(existing.id, "denied", adminId);
        await logAuditEvent({
          userId: adminId,
          action: "team_hub.access_denied",
          category: "admin_action",
          severity: "info",
          resourceType: "staff_access_request",
          resourceId: existing.id,
          details: { subjectUserId: existing.userId },
          ipAddress: req.ip || "",
        });
        res.json(row);
      } catch (e) {
        console.error("Staff access deny error:", e);
        res.status(500).json({ error: "Failed to deny request" });
      }
    },
  );

  // ---------- Roles ----------
  app.get("/api/team/roles", isAuthenticated, requireStaffOrAdmin, requireApprovedStaff, async (req: any, res) => {
    try {
      const { status, horizon, department } = req.query;
      const roles = await storage.getHrRoles({ status, horizon, department });
      res.json(roles);
    } catch (e) {
      res.status(500).json({ error: "Failed to load roles" });
    }
  });

  app.get("/api/team/roles/:id", isAuthenticated, requireStaffOrAdmin, requireApprovedStaff, async (req: any, res) => {
    const role = await storage.getHrRole(req.params.id);
    if (!role) return res.status(404).json({ error: "Role not found" });
    res.json(role);
  });

  app.post("/api/team/roles", isAuthenticated, requireManage, async (req: any, res) => {
    const parsed = insertHrRoleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid role", details: parsed.error.flatten() });
    const role = await storage.createHrRole(parsed.data);
    res.status(201).json(role);
  });

  app.patch("/api/team/roles/:id", isAuthenticated, requireManage, async (req: any, res) => {
    const parsed = insertHrRoleSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid role", details: parsed.error.flatten() });
    const role = await storage.updateHrRole(req.params.id, parsed.data);
    if (!role) return res.status(404).json({ error: "Role not found" });
    res.json(role);
  });

  app.post("/api/team/roles/:id/archive", isAuthenticated, requireManage, async (req: any, res) => {
    const role = await storage.updateHrRole(req.params.id, { status: "archived" });
    if (!role) return res.status(404).json({ error: "Role not found" });
    res.json(role);
  });

  // ---------- Employees ----------
  app.get("/api/team/employees", isAuthenticated, requireStaffOrAdmin, requireApprovedStaff, async (req: any, res) => {
    const { status, roleId, managerId } = req.query;
    const { isManager, me } = await getScope(req.user.claims.sub);
    if (!isManager) {
      // Staff see only their own record — no roster-wide PII leakage.
      return res.json(me ? [me] : []);
    }
    const list = await storage.getEmployees({ status, roleId, managerId });
    res.json(list);
  });

  app.get("/api/team/employees/:id", isAuthenticated, requireStaffOrAdmin, requireApprovedStaff, async (req: any, res) => {
    const { isManager, me } = await getScope(req.user.claims.sub);
    if (!isManager && (!me || me.id !== req.params.id)) {
      return res.status(403).json({ error: "Not allowed" });
    }
    const emp = await storage.getEmployee(req.params.id);
    if (!emp) return res.status(404).json({ error: "Employee not found" });
    res.json(emp);
  });

  app.post("/api/team/employees", isAuthenticated, requireManage, async (req: any, res) => {
    const parsed = createEmployeeBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid employee", details: parsed.error.flatten() });
    const role = await storage.getHrRole(parsed.data.roleId);
    if (!role) return res.status(400).json({ error: "roleId does not match a known role" });
    const emp = await storage.createEmployee(parsed.data);
    const onboarding = await storage.generateOnboardingForEmployee(emp.id);
    res.status(201).json({ ...emp, onboarding });
  });

  app.patch("/api/team/employees/:id", isAuthenticated, requireManage, async (req: any, res) => {
    const parsed = createEmployeeBody.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid employee", details: parsed.error.flatten() });
    const emp = await storage.updateEmployee(req.params.id, parsed.data);
    if (!emp) return res.status(404).json({ error: "Employee not found" });
    res.json(emp);
  });

  app.delete("/api/team/employees/:id", isAuthenticated, requireManage, async (req: any, res) => {
    const ok = await storage.deleteEmployee(req.params.id);
    if (!ok) return res.status(404).json({ error: "Employee not found" });
    res.status(204).end();
  });

  // ---------- Onboarding ----------
  app.get("/api/team/employees/:id/onboarding", isAuthenticated, requireStaffOrAdmin, requireApprovedStaff, async (req: any, res) => {
    const { isManager, me } = await getScope(req.user.claims.sub);
    if (!isManager && (!me || me.id !== req.params.id)) {
      return res.status(403).json({ error: "Not allowed" });
    }
    const tasks = await storage.getOnboardingTasks(req.params.id);
    res.json(tasks);
  });

  app.post("/api/team/employees/:id/onboarding/regenerate", isAuthenticated, requireManage, async (req: any, res) => {
    const emp = await storage.getEmployee(req.params.id);
    if (!emp) return res.status(404).json({ error: "Employee not found" });
    const tasks = await storage.generateOnboardingForEmployee(req.params.id);
    res.json(tasks);
  });

  app.patch("/api/team/onboarding/:taskId", isAuthenticated, requireStaffOrAdmin, requireApprovedStaff, async (req: any, res) => {
    const task = await storage.getOnboardingTask(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    // A staffer may move their own task's status; managers/admins may edit anyone's
    // task fully. Staff are restricted to status-only so they cannot reassign or
    // rewrite tasks (e.g. change employeeId, title, dueOffsetDays).
    const userId = req.user.claims.sub;
    const { isManager, me } = await getScope(userId);
    const isOwner = Boolean(me && me.id === task.employeeId);
    if (!isOwner && !isManager) return res.status(403).json({ error: "Not allowed" });
    const schema = isManager ? updateTaskBody : staffTaskUpdateBody;
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid task", details: parsed.error.flatten() });
    const updated = await storage.updateOnboardingTask(req.params.taskId, parsed.data);
    res.json(updated);
  });

  app.post("/api/team/onboarding", isAuthenticated, requireManage, async (req: any, res) => {
    const parsed = insertHrOnboardingTaskSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid task", details: parsed.error.flatten() });
    const task = await storage.createOnboardingTask(parsed.data);
    res.status(201).json(task);
  });

  app.delete("/api/team/onboarding/:taskId", isAuthenticated, requireManage, async (req: any, res) => {
    const ok = await storage.deleteOnboardingTask(req.params.taskId);
    if (!ok) return res.status(404).json({ error: "Task not found" });
    res.status(204).end();
  });

  // ---------- Personal "my" view ----------
  app.get("/api/team/me", isAuthenticated, requireStaffOrAdmin, requireApprovedStaff, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const employee = await storage.getEmployeeByUserId(userId);
    if (!employee) return res.json({ employee: null, role: null, onboarding: [] });
    const role = await storage.getHrRole(employee.roleId);
    const onboarding = await storage.getOnboardingTasks(employee.id);
    res.json({ employee, role, onboarding });
  });

  // ---------- Aggregate (powers Journey Map, Kanban, Calendar, dashboards) ----------
  // Managers/admins get the whole roster + every onboarding task; a regular
  // staffer gets only their own record + tasks. One fetch backs every operational
  // view so the client can compute journeys, boards, calendars, and dashboards.
  app.get("/api/team/aggregate", isAuthenticated, requireStaffOrAdmin, requireApprovedStaff, async (req: any, res) => {
    try {
      const { isManager, me } = await getScope(req.user.claims.sub);
      const roles = await storage.getHrRoles({});

      let employees;
      if (isManager) {
        employees = await storage.getEmployees({});
      } else {
        employees = me ? [me] : [];
      }

      const tasks = (
        await Promise.all(employees.map((e: any) => storage.getOnboardingTasks(e.id)))
      ).flat();

      res.json({
        isManager,
        meEmployeeId: me?.id ?? null,
        roles,
        employees,
        tasks,
      });
    } catch (e) {
      res.status(500).json({ error: "Failed to load team data" });
    }
  });

  // ---------- Integration scaffolding (manual-first; ready to switch on) ----------
  app.get("/api/team/integrations/status", isAuthenticated, requireStaffOrAdmin, requireApprovedStaff, async (_req: any, res) => {
    res.json({
      hubspot: { connected: Boolean(process.env.HUBSPOT_ACCESS_TOKEN), mode: "manual" },
      google: { connected: Boolean(process.env.GOOGLE_WORKSPACE_ENABLED), mode: "manual" },
    });
  });

  // Future Google Workspace hook target: creating a Workspace account would POST
  // here to auto-create an employee + onboarding. Manual until enabled.
  app.post("/api/team/integrations/google/provision", isAuthenticated, requireManage, async (req: any, res) => {
    const parsed = createEmployeeBody.safeParse({ ...req.body, source: "google_workspace" });
    if (!parsed.success) return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    const role = await storage.getHrRole(parsed.data.roleId);
    if (!role) return res.status(400).json({ error: "roleId does not match a known role" });
    const emp = await storage.createEmployee(parsed.data);
    const onboarding = await storage.generateOnboardingForEmployee(emp.id);
    res.status(201).json({ ...emp, onboarding });
  });

  // Future HubSpot hook target: a "Closed Won" deal would trigger customer-
  // onboarding training assignment. Disabled until explicitly switched on.
  app.post("/api/team/integrations/hubspot/closed-won", isAuthenticated, requireManage, async (_req: any, res) => {
    res.json({ enabled: false, message: "HubSpot Closed-Won automation is scaffolded but not yet enabled." });
  });
}
