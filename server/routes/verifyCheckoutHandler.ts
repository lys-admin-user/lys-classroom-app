import { users } from "@shared/schema";
import { eq, type SQL } from "drizzle-orm";
import { evaluateVerifyCheckout } from "../services/achPaymentPolicy";

// Dependencies are injected so the REAL handler (not a copy) can be exercised
// hermetically in tests — locking the HTTP status/message mapping and the
// provisioning side effect to the unit-tested policy decisions.
export interface VerifyCheckoutDeps {
  getStripeClient: () => Promise<{
    checkout: { sessions: { retrieve: (id: string, opts: any) => Promise<any> } };
  }>;
  db: {
    update: (table: typeof users) => {
      set: (values: Record<string, unknown>) => {
        where: (condition: SQL) => Promise<unknown> | unknown;
      };
    };
  };
  logAuditEvent: (entry: any) => Promise<unknown>;
}

export function createVerifyCheckoutHandler(deps: VerifyCheckoutDeps) {
  return async (req: any, res: any): Promise<void> => {
    try {
      const userId = req.user?.claims?.sub;
      const { sessionId } = req.body;

      if (!sessionId) {
        res.status(400).json({ error: "Missing sessionId" });
        return;
      }

      const stripe = await deps.getStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription"],
      });

      // Decision logic (ownership, completion, tier validity, pending-vs-paid)
      // lives in achPaymentPolicy.ts so it is unit tested.
      const decision = evaluateVerifyCheckout(session as any, userId);
      if (decision.kind === "reject") {
        if (decision.reason === "owner_mismatch") {
          await deps.logAuditEvent({
            userId,
            action: "billing.verify_checkout_denied",
            category: "security",
            severity: "warning",
            resourceType: "subscription",
            details: { reason: "session_owner_mismatch", sessionId },
          }).catch(() => {});
        }
        const message =
          decision.reason === "owner_mismatch"
            ? "This checkout session does not belong to your account"
            : decision.reason === "not_completed"
              ? "Payment not completed"
              : "Invalid checkout session tier";
        res.status(decision.httpStatus).json({ error: message });
        return;
      }

      const tier = decision.tier;
      const subscription = session.subscription as any;

      // ACH Direct Debit clears in ~4 business days: the session completes with
      // payment_status "unpaid" while the debit is processing. Provision the
      // plan immediately (same trust model as PO submissions) but mark it
      // payment-pending; the Stripe webhook flips it to active on
      // checkout.session.async_payment_succeeded or reverts it on failure.
      const isPendingAch = decision.pending;

      await deps.db.update(users)
        .set({
          tier,
          subscriptionStatus: isPendingAch ? "payment_pending" : "active",
          stripeSubscriptionId: subscription?.id || null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      if (isPendingAch) {
        res.json({
          success: true,
          pending: true,
          tier,
          message: `Your bank payment is processing (usually about 4 business days). Your ${tier} plan is active while it clears.`,
        });
        return;
      }

      res.json({ success: true, tier, message: `Successfully upgraded to ${tier}` });
    } catch (error: any) {
      console.error("Checkout verification error:", error);
      res.status(500).json({ error: "Failed to verify checkout session" });
    }
  };
}
