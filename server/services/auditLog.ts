import { db } from "../db";
import { auditLogs } from "@shared/schema";
import { desc, eq, and, gte, lte } from "drizzle-orm";

export type AuditCategory =
  | "auth"
  | "data_access"
  | "data_modify"
  | "admin_action"
  | "security"
  | "ai_usage"
  | "content_moderation"
  | "system";

export type AuditSeverity = "info" | "warning" | "critical";

interface AuditEntry {
  userId?: string;
  action: string;
  category: AuditCategory;
  severity?: AuditSeverity;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  organizationId?: string;
}

export async function logAuditEvent(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: entry.userId || null,
      action: entry.action,
      category: entry.category,
      severity: entry.severity || "info",
      resourceType: entry.resourceType || null,
      resourceId: entry.resourceId || null,
      details: entry.details || null,
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
      organizationId: entry.organizationId || null,
    });
  } catch (error) {
    console.error("[AuditLog] Failed to write audit log:", error);
  }
}

export async function getAuditLogs(filters?: {
  userId?: string;
  category?: string;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const conditions = [];

  if (filters?.userId) {
    conditions.push(eq(auditLogs.userId, filters.userId));
  }
  if (filters?.category) {
    conditions.push(eq(auditLogs.category, filters.category));
  }
  if (filters?.severity) {
    conditions.push(eq(auditLogs.severity, filters.severity));
  }
  if (filters?.startDate) {
    conditions.push(gte(auditLogs.createdAt, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(auditLogs.createdAt, filters.endDate));
  }

  return db
    .select()
    .from(auditLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(filters?.limit || 100)
    .offset(filters?.offset || 0);
}

export function getClientIP(req: any): string {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}
