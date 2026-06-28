import { db } from "../db";
import {
  hrRoles,
  employees,
  hrOnboardingTasks,
  type HrRole,
  type InsertHrRole,
  type Employee,
  type InsertEmployee,
  type HrOnboardingTask,
  type InsertHrOnboardingTask,
} from "@shared/schema";
import { and, asc, eq } from "drizzle-orm";
import { DatabaseStorage } from "./_base";
import { deriveOnboardingTasks } from "../hr/onboarding";

const teamHubMethods: ThisType<DatabaseStorage> & Record<string, any> = {
  // ----- Roles -----
  async getHrRoles(this: DatabaseStorage, filters?: { status?: string; horizon?: string; department?: string }): Promise<HrRole[]> {
    const conds = [] as any[];
    if (filters?.status) conds.push(eq(hrRoles.status, filters.status));
    if (filters?.horizon) conds.push(eq(hrRoles.horizon, filters.horizon));
    if (filters?.department) conds.push(eq(hrRoles.department, filters.department));
    const q = db.select().from(hrRoles);
    const rows = conds.length ? await q.where(and(...conds)) : await q;
    return rows.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  },

  async getHrRole(this: DatabaseStorage, id: string): Promise<HrRole | undefined> {
    const [row] = await db.select().from(hrRoles).where(eq(hrRoles.id, id));
    return row;
  },

  async createHrRole(this: DatabaseStorage, data: InsertHrRole & { id?: string }): Promise<HrRole> {
    const [row] = await db.insert(hrRoles).values(data as any).returning();
    return row;
  },

  async updateHrRole(this: DatabaseStorage, id: string, updates: Partial<InsertHrRole>): Promise<HrRole | undefined> {
    const [row] = await db
      .update(hrRoles)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(hrRoles.id, id))
      .returning();
    return row;
  },

  // ----- Employees -----
  async getEmployees(this: DatabaseStorage, filters?: { status?: string; roleId?: string; managerId?: string }): Promise<Employee[]> {
    const conds = [] as any[];
    if (filters?.status) conds.push(eq(employees.status, filters.status));
    if (filters?.roleId) conds.push(eq(employees.roleId, filters.roleId));
    if (filters?.managerId) conds.push(eq(employees.managerId, filters.managerId));
    const q = db.select().from(employees);
    const rows = conds.length ? await q.where(and(...conds)) : await q;
    return rows.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getEmployee(this: DatabaseStorage, id: string): Promise<Employee | undefined> {
    const [row] = await db.select().from(employees).where(eq(employees.id, id));
    return row;
  },

  async getEmployeeByUserId(this: DatabaseStorage, userId: string): Promise<Employee | undefined> {
    const [row] = await db.select().from(employees).where(eq(employees.userId, userId));
    return row;
  },

  async getDirectReports(this: DatabaseStorage, managerId: string): Promise<Employee[]> {
    return db.select().from(employees).where(eq(employees.managerId, managerId));
  },

  async createEmployee(this: DatabaseStorage, data: InsertEmployee): Promise<Employee> {
    const [row] = await db.insert(employees).values(data as any).returning();
    return row;
  },

  async updateEmployee(this: DatabaseStorage, id: string, updates: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [row] = await db
      .update(employees)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(employees.id, id))
      .returning();
    return row;
  },

  async deleteEmployee(this: DatabaseStorage, id: string): Promise<boolean> {
    await db.delete(hrOnboardingTasks).where(eq(hrOnboardingTasks.employeeId, id));
    const res = await db.delete(employees).where(eq(employees.id, id)).returning();
    return res.length > 0;
  },

  // ----- Onboarding tasks -----
  async getOnboardingTasks(this: DatabaseStorage, employeeId: string): Promise<HrOnboardingTask[]> {
    return db
      .select()
      .from(hrOnboardingTasks)
      .where(eq(hrOnboardingTasks.employeeId, employeeId))
      .orderBy(asc(hrOnboardingTasks.sortOrder));
  },

  async getOnboardingTask(this: DatabaseStorage, id: string): Promise<HrOnboardingTask | undefined> {
    const [row] = await db.select().from(hrOnboardingTasks).where(eq(hrOnboardingTasks.id, id));
    return row;
  },

  async createOnboardingTask(this: DatabaseStorage, data: InsertHrOnboardingTask): Promise<HrOnboardingTask> {
    const [row] = await db.insert(hrOnboardingTasks).values(data as any).returning();
    return row;
  },

  async updateOnboardingTask(
    this: DatabaseStorage,
    id: string,
    updates: Partial<InsertHrOnboardingTask> & { status?: string },
  ): Promise<HrOnboardingTask | undefined> {
    const patch: any = { ...updates };
    if (updates.status === "done") patch.completedAt = new Date();
    if (updates.status && updates.status !== "done") patch.completedAt = null;
    const [row] = await db.update(hrOnboardingTasks).set(patch).where(eq(hrOnboardingTasks.id, id)).returning();
    return row;
  },

  async deleteOnboardingTask(this: DatabaseStorage, id: string): Promise<boolean> {
    const res = await db.delete(hrOnboardingTasks).where(eq(hrOnboardingTasks.id, id)).returning();
    return res.length > 0;
  },

  async generateOnboardingForEmployee(this: DatabaseStorage, employeeId: string): Promise<HrOnboardingTask[]> {
    const emp = await this.getEmployee(employeeId);
    if (!emp) return [];
    const role = await this.getHrRole(emp.roleId);
    if (!role) return [];
    // Replace any existing generated tasks so re-running is idempotent.
    await db.delete(hrOnboardingTasks).where(eq(hrOnboardingTasks.employeeId, employeeId));
    const derived = deriveOnboardingTasks(role);
    if (derived.length === 0) return [];
    const rows = await db
      .insert(hrOnboardingTasks)
      .values(derived.map((t) => ({ ...t, employeeId })) as any)
      .returning();
    return rows.sort((a, b) => a.sortOrder - b.sortOrder);
  },
};

Object.assign(DatabaseStorage.prototype, teamHubMethods);
