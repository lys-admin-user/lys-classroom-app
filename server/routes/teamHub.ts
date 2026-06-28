import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";
import { requireStaffOrAdmin, requireFoundationAdmin } from "./_helpers";
import { insertHrRoleSchema, insertEmployeeSchema, insertHrOnboardingTaskSchema } from "@shared/schema";

// Writes to the directory/roster are admin-managed (site_admin/system_admin).
const requireManage = requireFoundationAdmin;

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
  // ---------- Roles ----------
  app.get("/api/team/roles", isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      const { status, horizon, department } = req.query;
      const roles = await storage.getHrRoles({ status, horizon, department });
      res.json(roles);
    } catch (e) {
      res.status(500).json({ error: "Failed to load roles" });
    }
  });

  app.get("/api/team/roles/:id", isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
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
  app.get("/api/team/employees", isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    const { status, roleId, managerId } = req.query;
    const { isManager, me } = await getScope(req.user.claims.sub);
    if (!isManager) {
      // Staff see only their own record — no roster-wide PII leakage.
      return res.json(me ? [me] : []);
    }
    const list = await storage.getEmployees({ status, roleId, managerId });
    res.json(list);
  });

  app.get("/api/team/employees/:id", isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
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
  app.get("/api/team/employees/:id/onboarding", isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
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

  app.patch("/api/team/onboarding/:taskId", isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
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
  app.get("/api/team/me", isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
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
  app.get("/api/team/aggregate", isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
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
  app.get("/api/team/integrations/status", isAuthenticated, requireStaffOrAdmin, async (_req: any, res) => {
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
