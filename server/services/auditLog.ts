import { randomUUID, createHash } from "crypto";
import { db } from "../db";
import { auditLogs } from "@shared/schema";
import { desc, eq, and, gte, lte, isNotNull, asc } from "drizzle-orm";
import { sql } from "drizzle-orm";

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

// Genesis marker for the very first chained record.
const GENESIS = "GENESIS";
// Fixed advisory-lock key so concurrent audit writes serialize into a single
// linear chain (no two writers can read the same head and fork the chain).
const AUDIT_LOCK_KEY = 918273645;

// Deterministic JSON: sort object keys recursively so the hash is stable
// regardless of property insertion order.
export function stableStringify(value: any): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value ?? null);
  }
  if (Array.isArray(value)) {
    return "[" + value.map(stableStringify).join(",") + "]";
  }
  const keys = Object.keys(value).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + stableStringify(value[k])).join(",") + "}";
}

// The exact fields that the hash commits to. Changing any of these in the DB
// after the fact will make the recomputed hash differ from the stored one.
export function computeHash(row: {
  id: string;
  userId: string | null;
  action: string;
  category: string;
  severity: string;
  resourceType: string | null;
  resourceId: string | null;
  details: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  organizationId: string | null;
  createdAt: Date;
  prevHash: string;
}): string {
  const payload = {
    id: row.id,
    userId: row.userId ?? null,
    action: row.action,
    category: row.category,
    severity: row.severity,
    resourceType: row.resourceType ?? null,
    resourceId: row.resourceId ?? null,
    details: row.details ?? null,
    ipAddress: row.ipAddress ?? null,
    userAgent: row.userAgent ?? null,
    organizationId: row.organizationId ?? null,
    createdAt: row.createdAt.toISOString(),
    prevHash: row.prevHash,
  };
  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}

export async function logAuditEvent(entry: AuditEntry): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      // Serialize audit writes so the hash chain stays linear.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${AUDIT_LOCK_KEY})`);

      const [head] = await tx
        .select({ hash: auditLogs.hash })
        .from(auditLogs)
        .where(isNotNull(auditLogs.hash))
        .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
        .limit(1);

      const prevHash = head?.hash || GENESIS;
      const id = randomUUID();
      const createdAt = new Date();

      const base = {
        id,
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
        createdAt,
        prevHash,
      };

      const hash = computeHash(base);

      await tx.insert(auditLogs).values({ ...base, hash });
    });
  } catch (error) {
    console.error("[AuditLog] Failed to write audit log:", error);
  }
}

export interface AuditChainVerification {
  ok: boolean;
  totalChained: number;
  verified: number;
  brokenAt: string | null;
  reason: string | null;
}

// Walks the prevHash -> hash linked list from genesis, recomputing each row's
// hash. Detects edits (hash mismatch), deletions (a referenced link missing),
// and out-of-band insertions (orphan rows not reachable from genesis).
export async function verifyAuditChain(): Promise<AuditChainVerification> {
  const rows = await db
    .select()
    .from(auditLogs)
    .where(isNotNull(auditLogs.hash))
    .orderBy(asc(auditLogs.createdAt), asc(auditLogs.id));

  const total = rows.length;
  if (total === 0) {
    return { ok: true, totalChained: 0, verified: 0, brokenAt: null, reason: null };
  }

  // Index rows by prevHash so we can follow the chain forward.
  const byPrev = new Map<string, typeof rows[number]>();
  for (const r of rows) {
    const key = r.prevHash || GENESIS;
    if (byPrev.has(key)) {
      return {
        ok: false,
        totalChained: total,
        verified: 0,
        brokenAt: r.id,
        reason: `Fork detected: two records share prevHash ${key}`,
      };
    }
    byPrev.set(key, r);
  }

  let verified = 0;
  let cursor: string = GENESIS;
  const seen = new Set<string>();

  while (byPrev.has(cursor)) {
    const row = byPrev.get(cursor)!;
    if (seen.has(row.id)) {
      return { ok: false, totalChained: total, verified, brokenAt: row.id, reason: "Cycle detected in chain" };
    }
    seen.add(row.id);

    const recomputed = computeHash({
      id: row.id,
      userId: row.userId,
      action: row.action,
      category: row.category,
      severity: row.severity,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      details: row.details,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      organizationId: row.organizationId,
      createdAt: row.createdAt as Date,
      prevHash: row.prevHash || GENESIS,
    });

    if (recomputed !== row.hash) {
      return {
        ok: false,
        totalChained: total,
        verified,
        brokenAt: row.id,
        reason: "Record was altered after it was written (hash mismatch)",
      };
    }

    verified++;
    cursor = row.hash!;
  }

  if (verified !== total) {
    return {
      ok: false,
      totalChained: total,
      verified,
      brokenAt: null,
      reason: `Chain length mismatch: ${verified} reachable of ${total} (a record was deleted or inserted out of band)`,
    };
  }

  return { ok: true, totalChained: total, verified, brokenAt: null, reason: null };
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
