// Pure decision logic for the ACH Direct Debit billing lifecycle.
// Used by server/webhookHandlers.ts (Stripe async-payment webhooks) and
// server/routes/payments.ts (verify-checkout). Kept side-effect free so the
// safety-critical branches can be unit tested hermetically.

export const CHECKOUT_TIERS = ["pro", "campus"] as const;
export type CheckoutTier = (typeof CHECKOUT_TIERS)[number];

export function isCheckoutTier(tier: unknown): tier is CheckoutTier {
  return typeof tier === "string" && (CHECKOUT_TIERS as readonly string[]).includes(tier);
}

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

/**
 * Whether an async-payment SUCCESS may fully activate a user row even though
 * the row is not (yet) payment_pending for this subscription. Stripe does not
 * guarantee event ordering: async_payment_succeeded can arrive BEFORE
 * checkout.session.completed / verify-checkout has provisioned anything. In
 * that case the row has no stripeSubscriptionId at all, and it is safe to
 * activate directly (the event carries a validated tier). A row that already
 * carries a DIFFERENT subscription id is never touched — that would let a
 * stale success from an abandoned checkout stomp a newer purchase.
 */
export function canActivateFromAsyncSuccess(
  decision: { userId: string; subscriptionId: string; tier: string | null },
  user: {
    id: string;
    subscriptionStatus?: string | null;
    stripeSubscriptionId?: string | null;
  },
): boolean {
  if (canApplyAsyncPaymentToUser(decision, user)) return true;
  return (
    user.id === decision.userId &&
    isCheckoutTier(decision.tier) &&
    !user.stripeSubscriptionId
  );
}

// ---------------------------------------------------------------------------
// Webhook side: checkout.session.completed (no-browser-return safety net)
// ---------------------------------------------------------------------------

export type CheckoutCompletedDecision =
  | {
      kind: "ignore";
      reason:
        | "irrelevant_event"
        | "missing_user"
        | "missing_subscription"
        | "not_completed"
        | "invalid_tier";
    }
  | {
      kind: "provision";
      userId: string;
      tier: CheckoutTier;
      pending: boolean;
      subscriptionId: string;
      checkoutSessionId: string | null;
    };

/**
 * Decide whether a checkout.session.completed webhook event should provision
 * a plan. This is the safety net for customers who complete Stripe checkout
 * but never return to the site (so verify-checkout is never called).
 * Ownership is implied — the webhook is signature-verified and the session's
 * own metadata.userId identifies the buyer. The same completion/tier rules as
 * verify-checkout apply (via evaluateVerifyCheckout).
 */
export function evaluateCheckoutCompletedEvent(event: any): CheckoutCompletedDecision {
  if (event?.type !== "checkout.session.completed") {
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

  const decision = evaluateVerifyCheckout(session, userId);
  if (decision.kind === "reject") {
    // owner_mismatch is impossible here (we passed the session's own userId).
    return {
      kind: "ignore",
      reason: decision.reason === "not_completed" ? "not_completed" : "invalid_tier",
    };
  }

  return {
    kind: "provision",
    userId,
    tier: decision.tier,
    pending: decision.pending,
    subscriptionId,
    checkoutSessionId: session?.id ?? null,
  };
}

/**
 * Whether a completed-checkout provisioning may be applied to a user row.
 * Two guards:
 * - Idempotency: if the row already carries THIS subscription id, the plan
 *   was already provisioned (by verify-checkout, an out-of-order success
 *   event, or an earlier delivery of this event) — re-applying could regress
 *   an already-activated ACH payment back to payment_pending.
 * - Monotonicity: a row that is ACTIVE on a different subscription is never
 *   overwritten — a stale replayed completed event from an old checkout must
 *   not downgrade a newer active subscription. (Legitimate plan changes go
 *   through verify-checkout on return, which handles them explicitly.)
 * Rows with no subscription, or in a transitional/inactive state, may be
 * provisioned.
 */
export function canProvisionFromCompletedCheckout(
  decision: { userId: string; subscriptionId: string },
  user: {
    id: string;
    subscriptionStatus?: string | null;
    stripeSubscriptionId?: string | null;
  },
): boolean {
  if (user.id !== decision.userId) return false;
  if (!user.stripeSubscriptionId) return true;
  if (user.stripeSubscriptionId === decision.subscriptionId) return false;
  return user.subscriptionStatus !== "active";
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
