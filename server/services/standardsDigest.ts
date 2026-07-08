// Task #8 — Weekly standards observability digest.
//
// Aggregates the past 7 days of activity into a per-admin email payload:
//   * new standards-ingestion requests
//   * top 5 coverage gaps (most-hit fallback rows)
//   * sync runs that failed OR had verbatim_rejected > 0
//   * one-click link to the moderation queue
//
// Transport: tries `process.env.DIGEST_EMAIL_TRANSPORT === "console"` by
// default (logs the rendered email) and persists every send attempt to
// `standards_digest_log` so admins have a paper trail even when no SMTP
// provider is wired up in this environment. To plug in a real provider,
// implement `sendViaTransport` below — the rest of the pipeline already
// resolves recipients, respects opt-outs, and dedupes by week.
import { db } from "../db";
import {
  standardsIngestionRequests,
  standardsFallbackMisses,
  publicStandardsSyncRuns,
  standardsDigestLog,
  type DigestCadence,
} from "@shared/schema";
import { and, desc, eq, gte, gt, or, sql as drizzleSql } from "drizzle-orm";
import { getEmailDigestRecipients } from "./notificationsService";
import { getBaseUrl, sendEmail } from "./emailTransport";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface DigestPayload {
  newRequests: Array<{ country: string; state: string | null; createdAt: Date | null; status: string }>;
  topGaps: Array<{ country: string; state: string | null; subject: string | null; hits: number }>;
  badSyncRuns: Array<{
    id: string;
    country: string | null;
    state: string | null;
    status: string;
    verbatimRejected: number;
    errorMessage: string | null;
    startedAt: Date | null;
  }>;
  periodStart: Date;
  periodEnd: Date;
}

// Normalize an arbitrary "now" into a stable (periodStart, periodEnd) tuple
// for the week containing it — anchored to UTC midnight on the firing day so
// every tick within the same day produces identical timestamps and the
// idempotency lookup in `standards_digest_log` works across restarts.
export function getDigestPeriod(now: Date = new Date()): { periodStart: Date; periodEnd: Date } {
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const periodStart = new Date(periodEnd.getTime() - ONE_WEEK_MS);
  return { periodStart, periodEnd };
}

export async function buildDigestPayload(now: Date = new Date()): Promise<DigestPayload> {
  const { periodStart, periodEnd } = getDigestPeriod(now);

  const newRequestsRows = await db
    .select({
      country: standardsIngestionRequests.country,
      state: standardsIngestionRequests.state,
      createdAt: standardsIngestionRequests.createdAt,
      status: standardsIngestionRequests.status,
    })
    .from(standardsIngestionRequests)
    .where(gte(standardsIngestionRequests.createdAt, periodStart))
    .orderBy(desc(standardsIngestionRequests.createdAt))
    .limit(50);

  const topGapsRows = await db
    .select({
      country: standardsFallbackMisses.country,
      state: standardsFallbackMisses.state,
      subject: standardsFallbackMisses.subject,
      hits: drizzleSql<number>`count(*)::int`,
    })
    .from(standardsFallbackMisses)
    .where(gte(standardsFallbackMisses.createdAt, periodStart))
    .groupBy(
      standardsFallbackMisses.country,
      standardsFallbackMisses.state,
      standardsFallbackMisses.subject,
    )
    .orderBy(desc(drizzleSql`count(*)`))
    .limit(5);

  const badSyncRuns = await db
    .select({
      id: publicStandardsSyncRuns.id,
      country: publicStandardsSyncRuns.country,
      state: publicStandardsSyncRuns.state,
      status: publicStandardsSyncRuns.status,
      verbatimRejected: publicStandardsSyncRuns.verbatimRejected,
      errorMessage: publicStandardsSyncRuns.errorMessage,
      startedAt: publicStandardsSyncRuns.startedAt,
    })
    .from(publicStandardsSyncRuns)
    .where(
      and(
        gte(publicStandardsSyncRuns.startedAt, periodStart),
        or(
          eq(publicStandardsSyncRuns.status, "failed"),
          gt(publicStandardsSyncRuns.verbatimRejected, 0),
        ),
      ),
    )
    .orderBy(desc(publicStandardsSyncRuns.startedAt))
    .limit(50);

  return {
    newRequests: newRequestsRows,
    topGaps: topGapsRows.map((g) => ({ ...g, hits: Number(g.hits) })),
    badSyncRuns: badSyncRuns.map((r) => ({
      ...r,
      verbatimRejected: Number(r.verbatimRejected ?? 0),
    })),
    periodStart,
    periodEnd,
  };
}

export function renderDigestEmail(
  payload: DigestPayload,
  recipient: { email: string | null; firstName?: string | null },
): {
  subject: string;
  body: string;
} {
  const fmt = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "—");
  const where = (country: string | null, state: string | null) =>
    [state, country].filter(Boolean).join(", ") || "—";
  const queueUrl = `${getBaseUrl()}/admin/standards-ingestion`;

  const subject = `LYS Standards Weekly Digest — ${fmt(payload.periodStart)} → ${fmt(payload.periodEnd)}`;
  const lines: string[] = [];
  const greetingName = recipient.firstName?.trim() || recipient.email || "there";
  lines.push(`Hello ${greetingName},`);
  lines.push("");
  lines.push(`Here is your weekly summary of the LYS standards pipeline.`);
  lines.push("");
  lines.push(`Moderation queue: ${queueUrl}`);
  lines.push("");
  lines.push(`--- New ingestion requests (${payload.newRequests.length}) ---`);
  if (payload.newRequests.length === 0) {
    lines.push("No new requests this week.");
  } else {
    for (const r of payload.newRequests.slice(0, 25)) {
      lines.push(`  • ${fmt(r.createdAt)}  ${where(r.country, r.state)}  [${r.status}]`);
    }
  }
  lines.push("");
  lines.push(`--- Top 5 coverage gaps (fallback hits) ---`);
  if (payload.topGaps.length === 0) {
    lines.push("No fallback misses this week — every request resolved against the catalog.");
  } else {
    for (const g of payload.topGaps) {
      lines.push(`  • ${g.hits.toString().padStart(4, " ")} hits  ${where(g.country, g.state)}  ${g.subject ?? "(any subject)"}`);
    }
  }
  lines.push("");
  lines.push(`--- Sync runs that need attention (${payload.badSyncRuns.length}) ---`);
  if (payload.badSyncRuns.length === 0) {
    lines.push("All sync runs completed cleanly with zero verbatim rejections.");
  } else {
    for (const r of payload.badSyncRuns.slice(0, 25)) {
      const reason: string[] = [];
      if (r.status === "failed") reason.push(`FAILED: ${r.errorMessage || "no message"}`);
      if (r.verbatimRejected > 0) reason.push(`${r.verbatimRejected} verbatim-rejected`);
      lines.push(`  • ${fmt(r.startedAt)}  ${where(r.country, r.state)}  ${reason.join(" | ")}`);
    }
  }
  lines.push("");
  lines.push("You can opt out of this digest in Settings → Notifications.");
  return { subject, body: lines.join("\n") };
}

export async function sendWeeklyDigest(
  now: Date = new Date(),
  opts: { cadences?: DigestCadence[] } = {},
): Promise<{
  recipients: number;
  sent: number;
  skipped: number;
  failed: number;
}> {
  const payload = await buildDigestPayload(now);
  const recipients = await getEmailDigestRecipients({ cadences: opts.cadences });
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  // Persistent weekly idempotency: skip any recipient who already has a log
  // row covering this same period (any non-failed status counts as
  // "already attempted this week"). This survives process restarts and
  // multi-tick races in the scheduler.
  const alreadySentRows = recipients.length
    ? await db
        .select({ userId: standardsDigestLog.userId, status: standardsDigestLog.status })
        .from(standardsDigestLog)
        .where(
          and(
            eq(standardsDigestLog.periodStart, payload.periodStart),
            eq(standardsDigestLog.periodEnd, payload.periodEnd),
          ),
        )
    : [];
  const alreadySent = new Set(
    alreadySentRows.filter((r) => r.status !== "failed").map((r) => r.userId),
  );

  for (const r of recipients) {
    if (alreadySent.has(r.id)) {
      skipped += 1;
      continue;
    }
    if (!r.email) {
      // No email on file — still log so admins know we skipped them.
      await db.insert(standardsDigestLog).values({
        userId: r.id,
        email: null,
        subject: "(no email on file)",
        body: "",
        status: "failed",
        errorMessage: "User has no email address",
        periodStart: payload.periodStart,
        periodEnd: payload.periodEnd,
      });
      continue;
    }
    const { subject, body } = renderDigestEmail(payload, r);
    const result = await sendEmail(r, subject, body, { logPrefix: "standards-digest" });
    await db.insert(standardsDigestLog).values({
      userId: r.id,
      email: r.email,
      subject,
      body,
      status: result.status,
      errorMessage: result.errorMessage ?? null,
      periodStart: payload.periodStart,
      periodEnd: payload.periodEnd,
    });
    if (result.status === "sent" || result.status === "logged_no_transport") sent += 1;
    else if (result.status === "failed") failed += 1;
  }

  return { recipients: recipients.length, sent, skipped, failed };
}
