import { getStripeSync } from './stripeClient';
import { db } from './db';
import { users } from '@shared/schema';
import { eq, and, or, ne, isNull } from 'drizzle-orm';
import { logAuditEvent } from './services/auditLog';
import {
  evaluateAsyncPaymentEvent,
  evaluateCheckoutCompletedEvent,
  isCheckoutTier,
  type CheckoutTier,
} from './services/achPaymentPolicy';
import { notifyAchPaymentOutcome } from './services/achPaymentEmails';

// node-postgres reports how many rows an UPDATE actually matched via rowCount.
// A guarded webhook UPDATE that matches zero rows means the event was a
// replay / out-of-order delivery that was correctly skipped — the audit trail
// must record a skip, not a state change.
function rowsChanged(result: unknown): boolean {
  const rowCount = (result as { rowCount?: number | null } | null | undefined)?.rowCount;
  return typeof rowCount === 'number' && rowCount > 0;
}

export class WebhookHandlers {
  // Distinct audit action for correctly-skipped replays/out-of-order events so
  // real-world delivery anomalies stay visible without overstating changes.
  private static async auditSkipped(
    userId: string,
    intendedAction: string,
    details: Record<string, unknown>,
  ): Promise<void> {
    await logAuditEvent({
      userId,
      action: 'billing.webhook_skipped_idempotent',
      category: 'data_modify',
      severity: 'info',
      resourceType: 'subscription',
      details: { intendedAction, ...details },
    }).catch(() => {});
  }

  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    // StripeSync verifies the webhook signature (rejects tampered payloads) and
    // mirrors Stripe data into Postgres. Only after it succeeds do we act on
    // the event for our own subscription lifecycle below.
    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    try {
      const event = JSON.parse(payload.toString('utf8'));
      await WebhookHandlers.handleSubscriptionLifecycle(event);
    } catch (err) {
      // Never fail the webhook response for our side-processing; Stripe would
      // retry and StripeSync has already recorded the event.
      console.error('[stripe-webhook] lifecycle handling error:', err);
    }
  }

  // ACH Direct Debit payments clear asynchronously (~4 business days). The
  // checkout redirect provisions the plan as "payment_pending"; these events
  // finalize it: activate on success, revert to free on failure.
  private static async handleSubscriptionLifecycle(event: any): Promise<void> {
    // Safety net: provision on checkout.session.completed so a paid checkout
    // still activates even if the customer never returns to the site (and
    // verify-checkout is never called).
    const completed = evaluateCheckoutCompletedEvent(event);
    if (completed.kind === 'provision') {
      await WebhookHandlers.provisionFromCompletedCheckout(completed);
      return;
    }

    // All decisions (which events count, missing metadata, stale-event
    // correlation) live in achPaymentPolicy.ts so they are unit tested.
    const decision = evaluateAsyncPaymentEvent(event);
    if (decision.kind === 'ignore') {
      if (decision.reason !== 'irrelevant_event') {
        console.warn(`[stripe-webhook] ${event?.type} skipped: ${decision.reason}`);
      }
      return;
    }

    const { userId, tier, subscriptionId, checkoutSessionId } = decision;

    // Correlate to the EXACT pending payment: only touch the row if the stored
    // subscription id matches this session's subscription. Otherwise a stale
    // event from an abandoned earlier checkout could flip/revert a NEWER
    // pending payment. (SQL twin of canApplyAsyncPaymentToUser.)
    const pendingMatch = and(
      eq(users.id, userId),
      eq(users.subscriptionStatus, 'payment_pending'),
      eq(users.stripeSubscriptionId, subscriptionId),
    );

    if (decision.kind === 'activate') {
      let result: unknown;
      // Activate the account waiting on THIS payment. Stripe does not
      // guarantee event ordering, so success may arrive BEFORE the completed
      // event / verify-checkout provisioned anything — in that case (row has
      // no subscription id at all, and the event carries a valid tier) do a
      // full provision-and-activate. Never touch a row carrying a DIFFERENT
      // subscription id. (SQL twin of canActivateFromAsyncSuccess.)
      if (isCheckoutTier(tier)) {
        result = await db.update(users)
          .set({
            tier,
            subscriptionStatus: 'active',
            stripeSubscriptionId: subscriptionId,
            updatedAt: new Date(),
          })
          .where(and(
            eq(users.id, userId),
            or(
              and(
                eq(users.subscriptionStatus, 'payment_pending'),
                eq(users.stripeSubscriptionId, subscriptionId),
              ),
              isNull(users.stripeSubscriptionId),
            ),
          ));
      } else {
        // No trustworthy tier on the event: only flip an existing matching
        // pending payment to active (legacy-safe path).
        result = await db.update(users)
          .set({
            subscriptionStatus: 'active',
            updatedAt: new Date(),
          })
          .where(pendingMatch);
      }

      if (!rowsChanged(result)) {
        await WebhookHandlers.auditSkipped(userId, 'ach_payment_succeeded', {
          tier: tier ?? null,
          checkoutSessionId,
        });
        console.warn(`[stripe-webhook] ACH success matched no row for user ${userId} — skipped (replay/out-of-order?)`);
        return;
      }

      await logAuditEvent({
        userId,
        action: 'billing.ach_payment_succeeded',
        category: 'data_modify',
        severity: 'info',
        resourceType: 'subscription',
        details: { tier: tier ?? null, checkoutSessionId },
      }).catch(() => {});
      console.log(`[stripe-webhook] ACH payment succeeded — activated ${tier ?? 'plan'} for user ${userId}`);
      // Tell the customer their bank payment cleared. Best-effort — never
      // fail the webhook over email delivery.
      await notifyAchPaymentOutcome(userId, 'succeeded', tier ?? null).catch(() => {});
      return;
    }

    // Failed ACH debit (insufficient funds, closed account, disputed…):
    // revert the provisional upgrade back to the free tier.
    const revertResult = await db.update(users)
      .set({
        tier: 'free',
        subscriptionStatus: null,
        stripeSubscriptionId: null,
        updatedAt: new Date(),
      })
      .where(pendingMatch);

    if (!rowsChanged(revertResult)) {
      await WebhookHandlers.auditSkipped(userId, 'ach_payment_failed', {
        tier: tier ?? null,
        checkoutSessionId,
      });
      console.warn(`[stripe-webhook] ACH failure matched no row for user ${userId} — skipped (replay/stale?)`);
      return;
    }

    await logAuditEvent({
      userId,
      action: 'billing.ach_payment_failed',
      category: 'data_modify',
      severity: 'warning',
      resourceType: 'subscription',
      details: { tier: tier ?? null, checkoutSessionId },
    }).catch(() => {});
    console.warn(`[stripe-webhook] ACH payment FAILED — reverted user ${userId} to free tier`);
    // Tell the customer their bank payment failed and how to retry.
    await notifyAchPaymentOutcome(userId, 'failed', tier ?? null).catch(() => {});
  }

  // Mirrors verify-checkout provisioning, driven by the webhook instead of the
  // browser redirect. Idempotency (SQL twin of canProvisionFromCompletedCheckout):
  // skip rows that already carry THIS subscription id — re-applying could
  // regress an already-activated ACH payment back to payment_pending.
  private static async provisionFromCompletedCheckout(decision: {
    userId: string;
    tier: CheckoutTier;
    pending: boolean;
    subscriptionId: string;
    checkoutSessionId: string | null;
  }): Promise<void> {
    const { userId, tier, pending, subscriptionId, checkoutSessionId } = decision;

    const result = await db.update(users)
      .set({
        tier,
        subscriptionStatus: pending ? 'payment_pending' : 'active',
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date(),
      })
      .where(and(
        eq(users.id, userId),
        or(
          // No subscription yet — the normal no-return case.
          isNull(users.stripeSubscriptionId),
          // A different subscription that is NOT active may be replaced
          // (e.g. an abandoned pending checkout). An ACTIVE different
          // subscription is never overwritten by a webhook replay.
          and(
            ne(users.stripeSubscriptionId, subscriptionId),
            or(
              isNull(users.subscriptionStatus),
              ne(users.subscriptionStatus, 'active'),
            ),
          ),
        ),
      ));

    if (!rowsChanged(result)) {
      await WebhookHandlers.auditSkipped(userId, 'checkout_completed_provisioned', {
        tier,
        pending,
        checkoutSessionId,
      });
      console.warn(`[stripe-webhook] checkout completed matched no row for user ${userId} — skipped (already provisioned or active on another subscription)`);
      return;
    }

    await logAuditEvent({
      userId,
      action: 'billing.checkout_completed_provisioned',
      category: 'data_modify',
      severity: 'info',
      resourceType: 'subscription',
      details: { tier, pending, checkoutSessionId },
    }).catch(() => {});
    console.log(
      `[stripe-webhook] checkout completed — provisioned ${tier} (${pending ? 'payment_pending' : 'active'}) for user ${userId}`,
    );
  }
}
