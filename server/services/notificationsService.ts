// Task #8 — Standards observability: in-app notifications.
//
// Centralises (1) creation of admin-targeted notifications fanned out across
// every system_admin user, (2) per-user read/list operations, and (3) the
// four trigger helpers the rest of the codebase calls when standards-pipeline
// events occur. Trigger helpers are intentionally fire-and-forget: they
// swallow their own errors so that operational paths (sync runs, request
// submission) never fail because notifications had a hiccup.
import { db } from "../db";
import {
  adminNotifications,
  userPreferences,
  users,
  type AdminNotification,
  type NotificationKind,
  type DigestCadence,
} from "@shared/schema";
import { and, desc, eq, inArray, count } from "drizzle-orm";

const SYSTEM_ADMIN_ROLE = "system_admin";

// In-app notification recipients for a specific event kind. An admin is
// excluded if they disabled in-app notifications entirely OR muted this
// particular kind (Task #17). Missing preferences rows default to receiving
// everything.
async function getOptInSystemAdmins(
  kind: NotificationKind,
): Promise<{ id: string; email: string | null }[]> {
  const admins = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.role, SYSTEM_ADMIN_ROLE));
  if (admins.length === 0) return [];
  const prefs = await db
    .select({
      userId: userPreferences.userId,
      optOut: userPreferences.inAppNotificationsOptOut,
      muted: userPreferences.mutedNotificationKinds,
    })
    .from(userPreferences)
    .where(inArray(userPreferences.userId, admins.map((a) => a.id)));
  const excluded = new Set(
    prefs
      .filter((p) => p.optOut === true || (p.muted ?? []).includes(kind))
      .map((p) => p.userId),
  );
  return admins.filter((a) => !excluded.has(a.id));
}

// Email digest recipients. `digestCadence` is the source of truth (Task #17):
// admins on the "off" cadence never receive digests. By default (no `cadences`
// filter) we exclude only "off" admins; when `cadences` is provided we
// additionally restrict to admins whose chosen cadence is in that set, which is
// how the scheduler distinguishes daily vs. weekly recipients.
//
// Safety fallback for un-migrated rows: if a row has no valid cadence yet, we
// honor the deprecated `emailDigestOptOut` boolean (true -> treat as "off") so
// a pre-existing opt-out can never be accidentally re-enrolled. Rows with
// neither signal default to "weekly".
export async function getEmailDigestRecipients(
  opts: { cadences?: DigestCadence[] } = {},
): Promise<{ id: string; email: string | null }[]> {
  const admins = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.role, SYSTEM_ADMIN_ROLE));
  if (admins.length === 0) return [];
  const prefs = await db
    .select({
      userId: userPreferences.userId,
      cadence: userPreferences.digestCadence,
      optOut: userPreferences.emailDigestOptOut,
    })
    .from(userPreferences)
    .where(inArray(userPreferences.userId, admins.map((a) => a.id)));
  const prefByUser = new Map(prefs.map((p) => [p.userId, p]));
  const validCadences = new Set<DigestCadence>(["off", "daily", "weekly"]);
  const allowed = opts.cadences ? new Set(opts.cadences) : null;
  return admins.filter((a) => {
    const p = prefByUser.get(a.id);
    const raw = p?.cadence as DigestCadence | null | undefined;
    // Resolve effective cadence: valid stored cadence wins; otherwise fall back
    // to the legacy opt-out flag for rows that predate the cadence column.
    const cadence: DigestCadence =
      raw && validCadences.has(raw) ? raw : p?.optOut === true ? "off" : "weekly";
    if (cadence === "off") return false;
    if (allowed && !allowed.has(cadence)) return false;
    return true;
  });
}

interface CreatePayload {
  kind: NotificationKind;
  title: string;
  body: string;
  link?: string;
  relatedEntityId?: string;
}

async function fanOutToAdmins(payload: CreatePayload): Promise<void> {
  try {
    const admins = await getOptInSystemAdmins(payload.kind);
    if (admins.length === 0) return;
    await db.insert(adminNotifications).values(
      admins.map((a) => ({
        userId: a.id,
        kind: payload.kind,
        title: payload.title,
        body: payload.body,
        link: payload.link ?? null,
        relatedEntityId: payload.relatedEntityId ?? null,
      })),
    );
  } catch (err) {
    console.error("[notifications] fan-out failed:", err);
  }
}

export async function listNotifications(
  userId: string,
  opts: { onlyUnread?: boolean; limit?: number } = {},
): Promise<AdminNotification[]> {
  const limit = Math.min(opts.limit ?? 25, 100);
  const conds = [eq(adminNotifications.userId, userId)];
  if (opts.onlyUnread) conds.push(eq(adminNotifications.isRead, false));
  return await db
    .select()
    .from(adminNotifications)
    .where(and(...conds))
    .orderBy(desc(adminNotifications.createdAt))
    .limit(limit);
}

export async function countUnread(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(adminNotifications)
    .where(and(eq(adminNotifications.userId, userId), eq(adminNotifications.isRead, false)));
  return Number(row?.n ?? 0);
}

export async function markAllRead(userId: string): Promise<{ updated: number }> {
  const result = await db
    .update(adminNotifications)
    .set({ isRead: true })
    .where(and(eq(adminNotifications.userId, userId), eq(adminNotifications.isRead, false)));
  return { updated: (result as any).rowCount ?? 0 };
}

// -------------------- Trigger helpers --------------------
// Verbatim rejection threshold: a single rejection is "noise"; we only ping
// admins when a run drops at least this many candidate standards as suspect.
export const VERBATIM_REJECTION_SPIKE_THRESHOLD = 5;

export async function notifyIngestionRequestSubmitted(input: {
  requestId: string;
  country: string;
  state?: string | null;
  requesterEmail?: string | null;
}): Promise<void> {
  const where = input.state ? `${input.state}, ${input.country}` : input.country;
  await fanOutToAdmins({
    kind: "ingestion_request_submitted",
    title: `New standards request: ${where}`,
    body: input.requesterEmail
      ? `Submitted by ${input.requesterEmail}. Review in the ingestion queue.`
      : `Review in the ingestion queue.`,
    link: "/admin/standards-ingestion",
    relatedEntityId: input.requestId,
  });
}

export async function notifySyncRunFailed(input: {
  syncRunId: string;
  country?: string | null;
  state?: string | null;
  errorMessage?: string | null;
}): Promise<void> {
  const where = input.country
    ? input.state
      ? `${input.state}, ${input.country}`
      : input.country
    : "unknown source";
  await fanOutToAdmins({
    kind: "sync_run_failed",
    title: `Standards sync failed: ${where}`,
    body: (input.errorMessage || "Sync run failed without an error message.").slice(0, 300),
    link: "/admin/standards-ingestion",
    relatedEntityId: input.syncRunId,
  });
}

export async function notifyVerbatimRejectionSpike(input: {
  syncRunId: string;
  country?: string | null;
  state?: string | null;
  rejectedCount: number;
}): Promise<void> {
  if (input.rejectedCount < VERBATIM_REJECTION_SPIKE_THRESHOLD) return;
  const where = input.country
    ? input.state
      ? `${input.state}, ${input.country}`
      : input.country
    : "a source";
  await fanOutToAdmins({
    kind: "verbatim_rejection_spike",
    title: `Verbatim rejections spike on ${where}`,
    body: `${input.rejectedCount} AI-suggested standards failed the verbatim-in-source check on this run. The source may have drifted.`,
    link: "/admin/standards-ingestion",
    relatedEntityId: input.syncRunId,
  });
}

export async function notifyPendingStandardsReady(input: {
  syncRunId: string;
  country?: string | null;
  state?: string | null;
  pendingCount: number;
}): Promise<void> {
  if (input.pendingCount <= 0) return;
  const where = input.country
    ? input.state
      ? `${input.state}, ${input.country}`
      : input.country
    : "a source";
  await fanOutToAdmins({
    kind: "pending_standards_ready",
    title: `${input.pendingCount} standards ready for review`,
    body: `New extractions from ${where} are waiting in the moderation queue.`,
    link: "/admin/standards-ingestion",
    relatedEntityId: input.syncRunId,
  });
}
