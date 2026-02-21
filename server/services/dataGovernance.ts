import { db } from "../db";
import { eq, and, sql, count, desc, lt } from "drizzle-orm";
import {
  successMarks,
  safetyVault,
  fraudStrikes,
  userDataRegions,
} from "@shared/schema";
import { logAuditEvent } from "./auditLog";

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function submitSuccessMark(data: {
  studentId: string;
  classId?: string;
  assignmentId?: string;
  educatorId: string;
  organizationId?: string;
  standardCode?: string;
  mark: "success" | "not_yet";
  metadata?: Record<string, any>;
}) {
  const now = new Date();
  const [record] = await db.insert(successMarks).values({
    ...data,
    isMutable: true,
    submittedAt: now,
  }).returning();

  await logAuditEvent({
    userId: data.educatorId,
    action: "success_mark_submitted",
    category: "data_modify",
    severity: "info",
    resourceType: "success_mark",
    resourceId: record.id,
    details: { studentId: data.studentId, mark: data.mark },
  });

  return record;
}

export async function editSuccessMark(
  markId: string,
  educatorId: string,
  newMark: "success" | "not_yet",
  auditReason?: string
) {
  const [existing] = await db.select().from(successMarks).where(eq(successMarks.id, markId));

  if (!existing) {
    throw new Error("Success mark not found");
  }

  if (existing.educatorId !== educatorId) {
    throw new Error("Only the submitting educator can edit this mark");
  }

  const elapsed = Date.now() - new Date(existing.submittedAt!).getTime();
  const withinWindow = elapsed <= EDIT_WINDOW_MS;

  if (!existing.isMutable && !withinWindow) {
    if (!auditReason || auditReason.trim().length < 10) {
      throw new Error("Mark is finalized. A signed audit reason (minimum 10 characters) is required for any change.");
    }
  }

  const updateData: any = {
    mark: newMark,
    auditEditedBy: educatorId,
    auditEditedAt: new Date(),
  };

  if (!withinWindow) {
    updateData.auditReason = auditReason;
  }

  const [updated] = await db.update(successMarks)
    .set(updateData)
    .where(eq(successMarks.id, markId))
    .returning();

  await logAuditEvent({
    userId: educatorId,
    action: withinWindow ? "success_mark_edited_within_window" : "success_mark_edited_post_window",
    category: "data_modify",
    severity: withinWindow ? "info" : "warning",
    resourceType: "success_mark",
    resourceId: markId,
    details: { oldMark: existing.mark, newMark, auditReason, elapsedMinutes: Math.floor(elapsed / 60000) },
  });

  return updated;
}

export async function finalizeExpiredMarks() {
  const cutoff = new Date(Date.now() - EDIT_WINDOW_MS);
  const result = await db.update(successMarks)
    .set({ isMutable: false, finalizedAt: new Date() })
    .where(
      and(
        eq(successMarks.isMutable, true),
        lt(successMarks.submittedAt, cutoff)
      )
    );
  return result;
}

export async function archiveSuccessMark(markId: string, userId: string) {
  const [updated] = await db.update(successMarks)
    .set({ isArchived: true })
    .where(eq(successMarks.id, markId))
    .returning();

  await logAuditEvent({
    userId,
    action: "success_mark_archived",
    category: "data_modify",
    severity: "info",
    resourceType: "success_mark",
    resourceId: markId,
    details: { note: "Data hidden from UI only, underlying record preserved" },
  });

  return updated;
}

export function checkMessagePII(content: string): { blocked: boolean; patterns: string[] } {
  const piiPatterns: { name: string; regex: RegExp }[] = [
    { name: "phone_number", regex: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g },
    { name: "home_address", regex: /\d{1,5}\s\w+\s(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct|place|pl)\b/gi },
    { name: "email_address", regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
    { name: "ssn", regex: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g },
    { name: "social_media_handle", regex: /@[a-zA-Z0-9_]{3,30}/g },
    { name: "instagram_url", regex: /instagram\.com\/[a-zA-Z0-9_.]+/gi },
    { name: "snapchat_url", regex: /snapchat\.com\/add\/[a-zA-Z0-9_.]+/gi },
    { name: "tiktok_url", regex: /tiktok\.com\/@[a-zA-Z0-9_.]+/gi },
  ];

  const matchedPatterns: string[] = [];
  for (const { name, regex } of piiPatterns) {
    if (regex.test(content)) {
      matchedPatterns.push(name);
    }
  }

  return {
    blocked: matchedPatterns.length > 0,
    patterns: matchedPatterns,
  };
}

export async function interceptStudentMessage(
  senderId: string,
  senderRole: string,
  senderTenantId: string | null,
  recipientId: string | null,
  recipientTenantId: string | null,
  content: string,
  ipAddress?: string,
  userAgent?: string,
) {
  const isStudent = senderRole === "student";

  if (isStudent) {
    const piiCheck = checkMessagePII(content);
    if (piiCheck.blocked) {
      await db.insert(safetyVault).values({
        senderId,
        senderRole,
        senderTenantId,
        recipientId,
        recipientTenantId,
        content,
        isPiiBlocked: true,
        blockedPatterns: piiCheck.patterns,
        ipAddress,
        userAgent,
      });

      await logAuditEvent({
        userId: senderId,
        action: "message_pii_blocked",
        category: "security",
        severity: "warning",
        details: { patterns: piiCheck.patterns },
        ipAddress,
      });

      return {
        allowed: false,
        reason: "safety_warning",
        message: "Your message was blocked because it contains personal information (phone number, address, or social media handle). Please remove this information and try again.",
      };
    }

    if (senderTenantId && recipientTenantId && senderTenantId !== recipientTenantId) {
      await logAuditEvent({
        userId: senderId,
        action: "cross_tenant_message_blocked",
        category: "security",
        severity: "warning",
        details: { senderTenantId, recipientTenantId },
        ipAddress,
      });

      return {
        allowed: false,
        reason: "cross_tenant_lockdown",
        message: "You cannot send messages to users outside your school or district.",
      };
    }
  }

  await db.insert(safetyVault).values({
    senderId,
    senderRole,
    senderTenantId,
    recipientId,
    recipientTenantId,
    content,
    isPiiBlocked: false,
    ipAddress,
    userAgent,
  });

  return { allowed: true };
}

export async function softDeleteMessage(messageId: string, userId: string) {
  await db.update(safetyVault)
    .set({ isDeletedFromUI: true })
    .where(eq(safetyVault.id, messageId));

  await logAuditEvent({
    userId,
    action: "message_soft_deleted",
    category: "data_modify",
    severity: "info",
    resourceType: "safety_vault",
    resourceId: messageId,
    details: { note: "Message hidden from UI, archived in Safety Vault" },
  });
}

export async function checkFraudStrikes(userId: string): Promise<{ blocked: boolean; strikeCount: number }> {
  const [result] = await db.select({ count: count() })
    .from(fraudStrikes)
    .where(and(eq(fraudStrikes.userId, userId), eq(fraudStrikes.isResolved, false)));

  const strikeCount = result?.count || 0;
  return { blocked: strikeCount >= 3, strikeCount };
}

export async function recordFraudStrike(data: {
  userId: string;
  geoIpCountry?: string;
  geoIpRegion?: string;
  paymentRegion?: string;
  sessionIp?: string;
}) {
  const existing = await db.select({ count: count() })
    .from(fraudStrikes)
    .where(and(eq(fraudStrikes.userId, data.userId), eq(fraudStrikes.isResolved, false)));

  const currentCount = existing[0]?.count || 0;
  const strikeNumber = currentCount + 1;

  const [record] = await db.insert(fraudStrikes).values({
    ...data,
    strikeNumber,
  }).returning();

  await logAuditEvent({
    userId: data.userId,
    action: "fraud_strike_recorded",
    category: "security",
    severity: strikeNumber >= 3 ? "critical" : "warning",
    details: { strikeNumber, geoIpCountry: data.geoIpCountry, paymentRegion: data.paymentRegion },
    ipAddress: data.sessionIp,
  });

  return { record, blocked: strikeNumber >= 3 };
}

export async function resolveFraudStrikes(userId: string, resolvedBy: string) {
  await db.update(fraudStrikes)
    .set({ isResolved: true, resolvedAt: new Date(), resolvedBy })
    .where(and(eq(fraudStrikes.userId, userId), eq(fraudStrikes.isResolved, false)));

  await logAuditEvent({
    userId: resolvedBy,
    action: "fraud_strikes_resolved",
    category: "admin_action",
    severity: "info",
    details: { targetUserId: userId },
  });
}

export async function setUserDataRegion(userId: string, detectedCountry: string, detectedIp: string) {
  let dataRegion: "us" | "eu" | "ng" | "global" = "global";

  const euCountries = ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE"];
  if (detectedCountry === "US") dataRegion = "us";
  else if (detectedCountry === "NG") dataRegion = "ng";
  else if (euCountries.includes(detectedCountry)) dataRegion = "eu";

  const [existing] = await db.select().from(userDataRegions).where(eq(userDataRegions.userId, userId));
  if (existing) {
    await db.update(userDataRegions)
      .set({ detectedCountry, detectedIp, updatedAt: new Date() })
      .where(eq(userDataRegions.userId, userId));
    return existing;
  }

  const [record] = await db.insert(userDataRegions).values({
    userId,
    dataRegion,
    detectedCountry,
    detectedIp,
  }).returning();

  return record;
}

export function isCoppaRestricted(birthdate: Date | null | undefined): boolean {
  if (!birthdate) return false;
  const ageMs = Date.now() - new Date(birthdate).getTime();
  const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
  return ageYears < 13;
}

export function getTenantIdForUser(organizationMemberships: { organizationId: string }[]): string | null {
  if (!organizationMemberships || organizationMemberships.length === 0) return null;
  return organizationMemberships[0].organizationId;
}
