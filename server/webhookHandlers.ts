import { getStripeSync } from './stripeClient';
import { db } from './db';
import { users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { logAuditEvent } from './services/auditLog';

export class WebhookHandlers {
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
    const type = event?.type;
    if (
      type !== 'checkout.session.async_payment_succeeded' &&
      type !== 'checkout.session.async_payment_failed'
    ) {
      return;
    }

    const session = event.data?.object;
    const userId = session?.metadata?.userId;
    const tier = session?.metadata?.tier;
    if (!userId) {
      console.warn(`[stripe-webhook] ${type} without metadata.userId — skipping`);
      return;
    }

    // Correlate to the EXACT pending payment: only touch the row if the stored
    // subscription id matches this session's subscription. Otherwise a stale
    // event from an abandoned earlier checkout could flip/revert a NEWER
    // pending payment.
    const sessionSubscriptionId: string | null =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id || null;
    if (!sessionSubscriptionId) {
      console.warn(`[stripe-webhook] ${type} without a subscription id — skipping`);
      return;
    }
    const pendingMatch = and(
      eq(users.id, userId),
      eq(users.subscriptionStatus, 'payment_pending'),
      eq(users.stripeSubscriptionId, sessionSubscriptionId),
    );

    if (type === 'checkout.session.async_payment_succeeded') {
      // Activate only the account still waiting on THIS payment; don't stomp a
      // status that changed in the meantime (e.g. user already canceled).
      await db.update(users)
        .set({
          subscriptionStatus: 'active',
          updatedAt: new Date(),
        })
        .where(pendingMatch);

      await logAuditEvent({
        userId,
        action: 'billing.ach_payment_succeeded',
        category: 'data_modify',
        severity: 'info',
        resourceType: 'subscription',
        details: { tier: tier ?? null, checkoutSessionId: session?.id ?? null },
      }).catch(() => {});
      console.log(`[stripe-webhook] ACH payment succeeded — activated ${tier ?? 'plan'} for user ${userId}`);
      return;
    }

    // Failed ACH debit (insufficient funds, closed account, disputed…):
    // revert the provisional upgrade back to the free tier.
    await db.update(users)
      .set({
        tier: 'free',
        subscriptionStatus: null,
        stripeSubscriptionId: null,
        updatedAt: new Date(),
      })
      .where(pendingMatch);

    await logAuditEvent({
      userId,
      action: 'billing.ach_payment_failed',
      category: 'data_modify',
      severity: 'warning',
      resourceType: 'subscription',
      details: { tier: tier ?? null, checkoutSessionId: session?.id ?? null },
    }).catch(() => {});
    console.warn(`[stripe-webhook] ACH payment FAILED — reverted user ${userId} to free tier`);
  }
}
