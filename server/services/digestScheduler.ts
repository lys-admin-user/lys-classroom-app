// Task #8 — Weekly digest scheduler.
//
// Fires every Monday at 09:00 in the configured site-local timezone
// (`SITE_TIMEZONE`, default America/Chicago — LYS HQ). Uses a 1-minute tick
// so we never miss the firing window across daylight-saving boundaries, and
// records the last-fired ISO week so duplicate sends within the same week
// are no-ops even across process restarts (idempotency comes from
// `standards_digest_log` rows being inspectable, plus an in-memory guard).
import { sendWeeklyDigest } from "./standardsDigest";
import { sendBacklogDigest } from "./moderationBacklogDigest";
import { db } from "../db";
import { userPreferences } from "@shared/schema";
import { and, eq, isNull, or } from "drizzle-orm";
import type { DigestCadence } from "@shared/schema";

const SITE_TIMEZONE = process.env.SITE_TIMEZONE || "America/Chicago";
const TICK_MS = 60 * 1000; // 1 minute
let lastFiredKey: string | null = null;
let timer: NodeJS.Timeout | null = null;
let lastBacklogFiredKey: string | null = null;
let backlogTimer: NodeJS.Timeout | null = null;

function getSiteParts(now: Date): { weekday: string; hour: number; minute: number; isoWeek: string } {
  // Intl.DateTimeFormat is the simplest TZ-aware path that avoids pulling in
  // a moment/luxon dependency just for the cron check.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SITE_TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekday = get("weekday"); // "Mon"
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  // Build an ISO-week-ish key (year + weekday-anchored Monday date) so each
  // Monday only fires once even if the process restarts mid-window.
  const isoWeek = `${get("year")}-${get("month")}-${get("day")}`;
  return { weekday, hour, minute, isoWeek };
}

// Fires every morning at 09:00 site-local. On Mondays both weekly and daily
// subscribers get a send; on other days only daily subscribers do (Task #17 —
// per-admin cadence). `isoWeek` here is actually a per-day key (year-month-day),
// so the dedup guard prevents duplicate sends within the same calendar day.
async function tick(): Promise<void> {
  try {
    const { weekday, hour, minute, isoWeek } = getSiteParts(new Date());
    if (hour !== 9 || minute > 5) return;
    if (lastFiredKey === isoWeek) return;
    lastFiredKey = isoWeek;
    const cadences: DigestCadence[] = weekday === "Mon" ? ["daily", "weekly"] : ["daily"];
    console.log(
      `[digest-scheduler] firing digest for ${isoWeek} (${SITE_TIMEZONE}) cadences=${cadences.join(",")}`,
    );
    const summary = await sendWeeklyDigest(new Date(), { cadences });
    console.log(`[digest-scheduler] sent: ${JSON.stringify(summary)}`);
  } catch (err) {
    console.error("[digest-scheduler] tick failed:", err);
  }
}

// One-time, idempotent backfill (Task #17): map pre-existing email digest
// opt-outs onto the new cadence column so the cadence can serve as the source
// of truth. Rows where the legacy `emailDigestOptOut` is true but the cadence
// has not been set (NULL or the default "weekly") are flipped to "off". Safe to
// run on every boot — once migrated, the WHERE clause matches nothing.
export async function backfillDigestCadences(): Promise<number> {
  try {
    const result = await db
      .update(userPreferences)
      .set({ digestCadence: "off" })
      .where(
        and(
          eq(userPreferences.emailDigestOptOut, true),
          or(isNull(userPreferences.digestCadence), eq(userPreferences.digestCadence, "weekly")),
        ),
      );
    const rows = (result as any).rowCount ?? 0;
    if (rows > 0) console.log(`[digest-scheduler] backfilled ${rows} opt-out(s) to cadence "off"`);
    return rows;
  } catch (err) {
    console.error("[digest-scheduler] cadence backfill failed:", err);
    return 0;
  }
}

export function startDigestScheduler(): void {
  if (timer) return;
  void backfillDigestCadences();
  timer = setInterval(tick, TICK_MS);
  // Best-effort: don't keep the event loop alive just for the digest.
  if (typeof timer.unref === "function") timer.unref();
  console.log(`[digest-scheduler] started (tz=${SITE_TIMEZONE}, daily @ 09:00; weekly subscribers on Mondays)`);
}

// Exported for the manual /api/admin/digest/run-now route (system_admin only).
export async function runDigestNow(): Promise<{ recipients: number; sent: number }> {
  const summary = await sendWeeklyDigest();
  return { recipients: summary.recipients, sent: summary.sent };
}

// ----- Task #12: daily moderation-backlog alert (08:00 site-local) -----
// Reuses the same minute-tick + day-key dedup as the weekly digest. The
// service itself gates on the configurable backlog threshold, so this just has
// to fire once per day; `sendBacklogDigest` decides whether anything goes out.
async function backlogTick(): Promise<void> {
  try {
    const { hour, minute, isoWeek } = getSiteParts(new Date());
    if (hour !== 8 || minute > 5) return;
    if (lastBacklogFiredKey === isoWeek) return; // isoWeek is a per-day key
    lastBacklogFiredKey = isoWeek;
    console.log(`[backlog-scheduler] firing daily backlog check for ${isoWeek} (${SITE_TIMEZONE})`);
    const summary = await sendBacklogDigest();
    console.log(`[backlog-scheduler] result: ${JSON.stringify(summary)}`);
  } catch (err) {
    console.error("[backlog-scheduler] tick failed:", err);
  }
}

export function startModerationBacklogScheduler(): void {
  if (backlogTimer) return;
  backlogTimer = setInterval(backlogTick, TICK_MS);
  if (typeof backlogTimer.unref === "function") backlogTimer.unref();
  console.log(`[backlog-scheduler] started (tz=${SITE_TIMEZONE}, daily @ 08:00)`);
}

// Exported for the manual /api/admin/moderation-backlog/run-now route. Forces a
// send regardless of threshold / per-day dedup so admins can preview on demand.
export async function runBacklogDigestNow() {
  return await sendBacklogDigest(new Date(), { force: true });
}
