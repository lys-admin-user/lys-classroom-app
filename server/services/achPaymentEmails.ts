// Customer-facing emails for asynchronous (ACH bank debit) payment outcomes.
//
// ACH payments clear ~4 business days after checkout. The webhook silently
// activates the plan (success) or reverts to free (failure); these emails tell
// the customer what happened so they don't find out only by logging in.
//
// Sending is best-effort: the webhook must NEVER fail or retry because an
// email couldn't be sent, so notifyAchPaymentOutcome swallows all errors after
// logging them. Delivery goes through the shared transport in emailTransport.ts.
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { sendEmail, getBaseUrl } from "./emailTransport";

const TIER_LABELS: Record<string, string> = {
  pro: "Pro",
  campus: "Campus",
  enterprise: "Enterprise",
};

// Only ever surface KNOWN plan names in customer-facing copy — tier comes from
// Stripe metadata, so an unexpected string degrades to a generic label instead
// of being echoed into the email.
export function tierLabel(tier: string | null | undefined): string {
  if (!tier) return "your plan";
  return TIER_LABELS[tier] ?? "your plan";
}

export type AchEmailOutcome = "succeeded" | "failed" | "processing";

export function buildAchOutcomeEmail(
  outcome: AchEmailOutcome,
  opts: { firstName?: string | null; tier?: string | null; baseUrl: string },
): { subject: string; body: string } {
  const greeting = opts.firstName ? `Hi ${opts.firstName},` : "Hi,";
  const label = tierLabel(opts.tier);
  // "Pro plan" for a known tier, plain "your plan" when the tier is unknown.
  const plan = label === "your plan" ? label : `${label} plan`;

  if (outcome === "processing") {
    return {
      subject: "We received your order — your bank payment is processing",
      body: [
        greeting,
        "",
        `Thanks for your order! Your bank (ACH) payment is now processing — this usually takes about 4 business days to clear.`,
        "",
        `In the meantime, your ${plan} is already active, so you can start using it right away: ${opts.baseUrl}`,
        "",
        "We'll email you as soon as the payment clears (or if anything goes wrong).",
        "",
        "— The LYS team",
      ].join("\n"),
    };
  }

  if (outcome === "succeeded") {
    return {
      subject: `Your bank payment cleared — ${label} is now active`,
      body: [
        greeting,
        "",
        `Good news: your bank payment has cleared and your ${plan} is now fully active.`,
        "",
        `You can pick up right where you left off: ${opts.baseUrl}`,
        "",
        "Thanks for being with Laddering Your Success!",
        "",
        "— The LYS team",
      ].join("\n"),
    };
  }

  return {
    subject: "Your bank payment didn't go through — your plan was reverted",
    body: [
      greeting,
      "",
      `Unfortunately, your bank (ACH) payment for the ${plan} didn't go through, so your account has been moved back to the free plan. No money was taken.`,
      "",
      "This can happen when a bank rejects the debit (for example, insufficient funds or a closed account).",
      "",
      `To try again — or pay with a card instead, which activates instantly — visit: ${opts.baseUrl}/pricing`,
      "",
      "If you think this is a mistake, just reply to this email and we'll help.",
      "",
      "— The LYS team",
    ].join("\n"),
  };
}

// Look up the user's email and send the outcome notice. Best-effort by design.
export async function notifyAchPaymentOutcome(
  userId: string,
  outcome: AchEmailOutcome,
  tier: string | null | undefined,
): Promise<void> {
  try {
    const [user] = await db
      .select({ email: users.email, firstName: users.firstName })
      .from(users)
      .where(eq(users.id, userId));

    if (!user?.email) {
      console.warn(`[ach-email] no email on file for user ${userId} — skipping ${outcome} notice`);
      return;
    }

    const { subject, body } = buildAchOutcomeEmail(outcome, {
      firstName: user.firstName,
      tier,
      baseUrl: getBaseUrl(),
    });

    const result = await sendEmail({ email: user.email }, subject, body, {
      logPrefix: "ach-email",
    });
    if (result.status === "failed") {
      console.error(`[ach-email] ${outcome} notice failed for user ${userId}: ${result.errorMessage}`);
    }
  } catch (err) {
    console.error(`[ach-email] ${outcome} notice errored for user ${userId}:`, err);
  }
}
