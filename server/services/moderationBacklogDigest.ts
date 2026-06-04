// Task #12 — daily moderation-queue backlog alert.
//
// Once a day we snapshot the moderation queue depth (pending public standards +
// pending curriculum docs, bucketed by age) and email every opted-in
// system_admin so a backlog never silently piles up between manual checks —
// especially after an annual sweep drops hundreds of pending standards at once.
//
// Sending is gated by a configurable threshold (`MODERATION_BACKLOG_THRESHOLD`,
// default 1): we only fan out when the total pending count is GREATER than the
// threshold. A manual "run now" can force a send regardless. Every attempt is
// persisted to `moderation_backlog_digest_log` for a paper trail + per-day
// idempotency, mirroring the weekly standards digest (Task #8).
import { db } from "../db";
import { moderationBacklogDigestLog } from "@shared/schema";
import { and, eq } from "drizzle-orm";
import { getEmailDigestRecipients } from "./notificationsService";
import { getBaseUrl, sendEmail } from "./emailTransport";
import {
  getModerationBacklogStats,
  type ModerationBacklogStats,
} from "./ingestionModeration";

const DEFAULT_THRESHOLD = 1;

// Threshold below/at which we stay quiet. "Notify only if backlog > N" — so a
// value of 0 alerts on any backlog, while a large value suppresses routine
// noise. Negative / non-numeric env values fall back to the default.
export function getBacklogThreshold(): number {
  const raw = process.env.MODERATION_BACKLOG_THRESHOLD;
  if (raw === undefined || raw === "") return DEFAULT_THRESHOLD;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : DEFAULT_THRESHOLD;
}

// UTC calendar day, used as the per-day idempotency key in the log table.
export function getBacklogPeriodDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function renderBacklogEmail(
  stats: ModerationBacklogStats,
  recipient: { email: string | null },
): { subject: string; body: string } {
  const queueUrl = `${getBaseUrl()}/admin/standards-ingestion`;
  const subject = `LYS moderation queue: ${stats.total} item(s) awaiting review`;

  const lines: string[] = [];
  lines.push(`Hello${recipient.email ? ` ${recipient.email}` : ""},`);
  lines.push("");
  lines.push(
    `The LYS moderation queue currently has ${stats.total} item(s) awaiting review.`,
  );
  lines.push("");
  lines.push(`Open the Moderation queue: ${queueUrl}`);
  lines.push("");
  lines.push(`--- Pending public standards (${stats.pendingStandards.total}) ---`);
  lines.push(`  • older than 24h: ${stats.pendingStandards.over24h}`);
  lines.push(`  • older than 7d:  ${stats.pendingStandards.over7d}`);
  lines.push("");
  lines.push(`--- Pending curriculum docs (${stats.pendingDocs.total}) ---`);
  lines.push(`  • older than 24h: ${stats.pendingDocs.over24h}`);
  lines.push(`  • older than 7d:  ${stats.pendingDocs.over7d}`);
  lines.push("");
  lines.push("You can opt out of these emails in Settings → Notifications.");
  return { subject, body: lines.join("\n") };
}

export interface BacklogDigestResult {
  total: number;
  threshold: number;
  recipients: number;
  sent: number;
  skipped: number;
  failed: number;
  skippedBelowThreshold: boolean;
}

// `force` (manual run) ignores both the threshold gate and the per-day
// idempotency check so an admin can always preview / re-send on demand.
export async function sendBacklogDigest(
  now: Date = new Date(),
  opts: { force?: boolean } = {},
): Promise<BacklogDigestResult> {
  const stats = await getModerationBacklogStats(now);
  const threshold = getBacklogThreshold();
  const base: BacklogDigestResult = {
    total: stats.total,
    threshold,
    recipients: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    skippedBelowThreshold: false,
  };

  if (!opts.force && stats.total <= threshold) {
    return { ...base, skippedBelowThreshold: true };
  }

  const recipients = await getEmailDigestRecipients();
  const periodDate = getBacklogPeriodDate(now);

  // Per-day idempotency: skip recipients who already have a non-failed log row
  // for today (unless forced). Survives restarts + multi-tick scheduler races.
  const priorRows = recipients.length
    ? await db
        .select({
          userId: moderationBacklogDigestLog.userId,
          status: moderationBacklogDigestLog.status,
        })
        .from(moderationBacklogDigestLog)
        .where(eq(moderationBacklogDigestLog.periodDate, periodDate))
    : [];
  const alreadySent = new Set(
    priorRows.filter((r) => r.status !== "failed").map((r) => r.userId),
  );

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const r of recipients) {
    if (!opts.force && alreadySent.has(r.id)) {
      skipped += 1;
      continue;
    }
    if (!r.email) {
      await db.insert(moderationBacklogDigestLog).values({
        userId: r.id,
        email: null,
        subject: "(no email on file)",
        body: "",
        status: "failed",
        errorMessage: "User has no email address",
        totalPending: stats.total,
        periodDate,
      });
      failed += 1;
      continue;
    }
    const { subject, body } = renderBacklogEmail(stats, r);
    const result = await sendEmail(r, subject, body, {
      logPrefix: "moderation-backlog",
    });
    await db.insert(moderationBacklogDigestLog).values({
      userId: r.id,
      email: r.email,
      subject,
      body,
      status: result.status,
      errorMessage: result.errorMessage ?? null,
      totalPending: stats.total,
      periodDate,
    });
    if (result.status === "sent" || result.status === "logged_no_transport") sent += 1;
    else failed += 1;
  }

  return { ...base, recipients: recipients.length, sent, skipped, failed };
}
