// Pure decision logic for the ACH Direct Debit billing lifecycle.
// Used by server/webhookHandlers.ts (Stripe async-payment webhooks) and
// server/routes/payments.ts (verify-checkout). Kept side-effect free so the
// safety-critical branches can be unit tested hermetically.

export const CHECKOUT_TIERS = ["pro", "campus"] as const;
export type CheckoutTier = (typeof CHECKOUT_TIERS)[number];

// ---------------------------------------------------------------------------
// Webhook side: checkout.session.async_payment_succeeded / _failed
// ---------------------------------------------------------------------------

export type AsyncPaymentDecision =
  | { kind: "ignore"; reason: "irrelevant_event" | "missing_user" | "missing_subscription" }
  | {
      kind: "activate" | "revert";
      userId: string;
      tier: string | null;
      subscriptionId: string;
      checkoutSessionId: string | null;
    };

/**
 * Decide what an async-payment webhook event should do.
 * - Only the two ACH lifecycle events are acted on.
 * - Events without a metadata.userId or a subscription id are ignored
 *   (nothing safe to correlate against).
 */
export function evaluateAsyncPaymentEvent(event: any): AsyncPaymentDecision {
  const type = event?.type;
  if (
    type !== "checkout.session.async_payment_succeeded" &&
    type !== "checkout.session.async_payment_failed"
  ) {
    return { kind: "ignore", reason: "irrelevant_event" };
  }

  const session = event?.data?.object;
  const userId = session?.metadata?.userId;
  if (!userId || typeof userId !== "string") {
    return { kind: "ignore", reason: "missing_user" };
  }

  const subscriptionId =
    typeof session?.subscription === "string"
      ? session.subscription
      : session?.subscription?.id || null;
  if (!subscriptionId) {
    return { kind: "ignore", reason: "missing_subscription" };
  }

  return {
    kind: type === "checkout.session.async_payment_succeeded" ? "activate" : "revert",
    userId,
    tier: session?.metadata?.tier ?? null,
    subscriptionId,
    checkoutSessionId: session?.id ?? null,
  };
}

/**
 * Whether a webhook decision may be applied to a given user row.
 * The row must still be waiting on THIS payment: status payment_pending AND
 * the stored subscription id matches the event's subscription. A stale event
 * from an abandoned earlier checkout must never touch a newer pending payment.
 */
export function canApplyAsyncPaymentToUser(
  decision: { userId: string; subscriptionId: string },
  user: {
    id: string;
    subscriptionStatus?: string | null;
    stripeSubscriptionId?: string | null;
  },
): boolean {
  return (
    user.id === decision.userId &&
    user.subscriptionStatus === "payment_pending" &&
    !!user.stripeSubscriptionId &&
    user.stripeSubscriptionId === decision.subscriptionId
  );
}

// ---------------------------------------------------------------------------
// Verify-checkout side: POST /api/subscription/verify-checkout
// ---------------------------------------------------------------------------

export type VerifyCheckoutDecision =
  | { kind: "reject"; reason: "owner_mismatch" | "not_completed" | "invalid_tier"; httpStatus: number }
  | { kind: "provision"; tier: CheckoutTier; pending: boolean };

/**
 * Decide whether a retrieved Stripe checkout session may provision a plan for
 * the requesting user, and in what state.
 * - The session must have been created FOR this user (metadata.userId match) —
 *   possession of someone else's session id must never upgrade the caller.
 * - The session must be paid or complete.
 * - The tier must be one of the self-serve checkout tiers.
 * - Complete-but-unpaid means ACH is still clearing → provision as pending.
 */
export function evaluateVerifyCheckout(
  session: {
    metadata?: Record<string, string | undefined> | null;
    payment_status?: string | null;
    status?: string | null;
  },
  requestingUserId: string,
): VerifyCheckoutDecision {
  if (!session.metadata?.userId || session.metadata.userId !== requestingUserId) {
    return { kind: "reject", reason: "owner_mismatch", httpStatus: 403 };
  }

  if (session.payment_status !== "paid" && session.status !== "complete") {
    return { kind: "reject", reason: "not_completed", httpStatus: 400 };
  }

  const tier = session.metadata?.tier;
  if (!tier || !(CHECKOUT_TIERS as readonly string[]).includes(tier)) {
    return { kind: "reject", reason: "invalid_tier", httpStatus: 400 };
  }

  return {
    kind: "provision",
    tier: tier as CheckoutTier,
    pending: session.payment_status !== "paid",
  };
}
