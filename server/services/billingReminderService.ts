// Pre-billing reminder notices.
//
// Two flows, both run daily by the scheduler in `server/index.ts`:
//   * trial_ending — fires when a free trial (`free_trials.trialEndDate`) is
//     within the next 7 days, so users get a heads-up before the trial expires.
//   * renewal      — fires when an active *annual* Stripe subscription will
//     auto-renew in 14-30 days. Subscription period data is not mirrored
//     locally, so we read it live from Stripe.
//
// Every attempt is recorded in `billing_reminder_log`, which also provides
// idempotency: a (kind, refId, periodKey) tuple is sent at most once, surviving
// process restarts and multi-tick races. Delivery degrades gracefully — when no
// email transport is configured the body is logged (status
// `logged_no_transport`) and still recorded.
import { db } from "../db";
import { freeTrials, billingReminderLog } from "@shared/schema";
import { and, eq, gt, lte } from "drizzle-orm";
import { COMPANY } from "@shared/legal";
import { getBaseUrl, sendEmail, type EmailSendStatus } from "./emailTransport";
import { storage } from "../storage";
import { getUncachableStripeClient } from "../stripeClient";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ReminderRunResult {
  considered: number;
  sent: number;
  skipped: number;
  failed: number;
  note?: string;
}

function periodKeyOf(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

async function alreadyReminded(kind: string, refId: string, periodKey: string): Promise<boolean> {
  const rows = await db
    .select({ status: billingReminderLog.status })
    .from(billingReminderLog)
    .where(
      and(
        eq(billingReminderLog.kind, kind),
        eq(billingReminderLog.refId, refId),
        eq(billingReminderLog.periodKey, periodKey),
      ),
    );
  // Any non-failed prior attempt counts as "already handled this period".
  return rows.some((r) => r.status !== "failed");
}

async function logReminder(
  kind: string,
  refId: string,
  periodKey: string,
  userId: string | null,
  email: string | null,
  subject: string,
  result: { status: EmailSendStatus; errorMessage?: string },
): Promise<void> {
  // Upsert on the (kind, refId, periodKey) unique index. A plain insert would
  // throw when retrying a previously-`failed` reminder (the row already exists),
  // aborting the whole run; updating instead lets a failed attempt be retried
  // on a later day and converges to a single row per reminder.
  await db
    .insert(billingReminderLog)
    .values({
      kind,
      refId,
      periodKey,
      userId: userId ?? null,
      email: email ?? null,
      subject,
      status: result.status,
      errorMessage: result.errorMessage ?? null,
    })
    .onConflictDoUpdate({
      target: [billingReminderLog.kind, billingReminderLog.refId, billingReminderLog.periodKey],
      set: {
        userId: userId ?? null,
        email: email ?? null,
        subject,
        status: result.status,
        errorMessage: result.errorMessage ?? null,
        createdAt: new Date(),
      },
    });
}

function renderTrialEmail(
  user: { firstName?: string | null; email?: string | null } | undefined,
  trialEndDate: Date,
): { subject: string; body: string } {
  const name = user?.firstName || user?.email || "there";
  const when = formatDate(trialEndDate);
  const subject = `Your ${COMPANY.platformName} free trial ends ${when}`;
  const body = [
    `Hi ${name},`,
    ``,
    `This is a friendly reminder that your ${COMPANY.platformLongName} free trial ends on ${when}.`,
    `To keep uninterrupted access to lesson, assignment, and practice generation, choose a plan before then:`,
    `${getBaseUrl()}/pricing`,
    ``,
    `If you do nothing, your trial simply expires and you won't be charged.`,
    ``,
    `Questions? Reach us at ${COMPANY.contactEmail}.`,
    ``,
    `— The ${COMPANY.platformLongName} team`,
  ].join("\n");
  return { subject, body };
}

function renderRenewalEmail(
  name: string | null,
  renewalDate: Date,
  amountCents: number | null,
  currency: string,
): { subject: string; body: string } {
  const who = name || "there";
  const when = formatDate(renewalDate);
  const price =
    amountCents != null
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency.toUpperCase(),
        }).format(amountCents / 100)
      : null;
  const subject = `Your ${COMPANY.platformName} annual plan renews ${when}`;
  const body = [
    `Hi ${who},`,
    ``,
    `Your annual ${COMPANY.platformLongName} subscription will automatically renew on ${when}${
      price ? ` for ${price}` : ""
    }.`,
    `No action is needed if you'd like to continue.`,
    `To review or change your plan, visit ${getBaseUrl()}/settings.`,
    ``,
    `Questions? Reach us at ${COMPANY.contactEmail}.`,
    ``,
    `— The ${COMPANY.platformLongName} team`,
  ].join("\n");
  return { subject, body };
}

export async function runTrialEndingReminders(now: Date = new Date()): Promise<ReminderRunResult> {
  const horizon = new Date(now.getTime() + 7 * DAY_MS);
  const trials = await db
    .select()
    .from(freeTrials)
    .where(
      and(
        eq(freeTrials.isActive, true),
        gt(freeTrials.trialEndDate, now),
        lte(freeTrials.trialEndDate, horizon),
      ),
    );

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const t of trials) {
    if (!t.userId) {
      skipped += 1;
      continue;
    }
    const periodKey = periodKeyOf(t.trialEndDate);
    if (await alreadyReminded("trial_ending", t.id, periodKey)) {
      skipped += 1;
      continue;
    }
    const user = await storage.getUser(t.userId);
    const email = user?.email ?? null;
    const { subject, body } = renderTrialEmail(user, t.trialEndDate);
    const result = await sendEmail({ email }, subject, body, { logPrefix: "billing-reminder" });
    await logReminder("trial_ending", t.id, periodKey, t.userId, email, subject, result);
    if (result.status === "failed") failed += 1;
    else sent += 1;
  }

  return { considered: trials.length, sent, skipped, failed };
}

export async function runRenewalReminders(now: Date = new Date()): Promise<ReminderRunResult> {
  let stripe: Awaited<ReturnType<typeof getUncachableStripeClient>>;
  try {
    stripe = await getUncachableStripeClient();
  } catch {
    return { considered: 0, sent: 0, skipped: 0, failed: 0, note: "stripe_unconfigured" };
  }

  const windowStartTs = Math.floor((now.getTime() + 14 * DAY_MS) / 1000);
  const windowEndTs = Math.floor((now.getTime() + 30 * DAY_MS) / 1000);

  let considered = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for await (const sub of stripe.subscriptions.list({
    status: "active",
    limit: 100,
    expand: ["data.customer"],
  })) {
    const item = sub.items?.data?.[0];
    const interval = item?.price?.recurring?.interval;
    if (interval !== "year") continue; // only annual plans need long-lead notice
    if ((sub as any).cancel_at_period_end) continue;

    // current_period_end moved to the subscription item in newer API versions.
    const rawTs =
      typeof (sub as any).current_period_end === "number"
        ? (sub as any).current_period_end
        : (item as any)?.current_period_end;
    if (!rawTs || rawTs < windowStartTs || rawTs > windowEndTs) continue;

    considered += 1;
    const renewalDate = new Date(rawTs * 1000);
    const periodKey = periodKeyOf(renewalDate);
    if (await alreadyReminded("renewal", sub.id, periodKey)) {
      skipped += 1;
      continue;
    }

    const customer: any = sub.customer;
    const email =
      customer && typeof customer === "object" && !customer.deleted ? customer.email ?? null : null;
    const name =
      customer && typeof customer === "object" && !customer.deleted ? customer.name ?? null : null;
    const amount = item?.price?.unit_amount ?? null;
    const currency = item?.price?.currency ?? "usd";

    const { subject, body } = renderRenewalEmail(name, renewalDate, amount, currency);
    const result = await sendEmail({ email }, subject, body, { logPrefix: "billing-reminder" });
    await logReminder("renewal", sub.id, periodKey, null, email, subject, result);
    if (result.status === "failed") failed += 1;
    else sent += 1;
  }

  return { considered, sent, skipped, failed };
}

export async function runBillingReminders(now: Date = new Date()): Promise<{
  trial: ReminderRunResult;
  renewal: ReminderRunResult;
}> {
  const trial = await runTrialEndingReminders(now);
  let renewal: ReminderRunResult;
  try {
    renewal = await runRenewalReminders(now);
  } catch (err: any) {
    renewal = { considered: 0, sent: 0, skipped: 0, failed: 0, note: err?.message || String(err) };
  }
  return { trial, renewal };
}
