import { describe, it, expect } from "vitest";
import {
  evaluateAsyncPaymentEvent,
  canApplyAsyncPaymentToUser,
  evaluateVerifyCheckout,
  CHECKOUT_TIERS,
} from "../services/achPaymentPolicy";

// These policies drive the ACH Direct Debit billing lifecycle:
// - server/webhookHandlers.ts applies evaluateAsyncPaymentEvent decisions with
//   a WHERE clause mirroring canApplyAsyncPaymentToUser (activate on success,
//   revert to free on failure — only for the EXACT pending payment).
// - POST /api/subscription/verify-checkout uses evaluateVerifyCheckout to
//   decide whether a Stripe checkout session may provision a plan.
// Breaking them could give customers plans they didn't pay for, or strip
// paying customers back to the free tier.

function achEvent(
  type: string,
  overrides: { metadata?: any; subscription?: any; id?: string } = {},
) {
  return {
    type,
    data: {
      object: {
        id: overrides.id ?? "cs_test_123",
        metadata: "metadata" in overrides ? overrides.metadata : { userId: "user-1", tier: "pro" },
        subscription: "subscription" in overrides ? overrides.subscription : "sub_abc",
      },
    },
  };
}

describe("Webhook event evaluation (evaluateAsyncPaymentEvent)", () => {
  it("activates on async_payment_succeeded with full metadata", () => {
    const d = evaluateAsyncPaymentEvent(achEvent("checkout.session.async_payment_succeeded"));
    expect(d).toEqual({
      kind: "activate",
      userId: "user-1",
      tier: "pro",
      subscriptionId: "sub_abc",
      checkoutSessionId: "cs_test_123",
    });
  });

  it("reverts on async_payment_failed with full metadata", () => {
    const d = evaluateAsyncPaymentEvent(achEvent("checkout.session.async_payment_failed"));
    expect(d.kind).toBe("revert");
  });

  it("ignores every other Stripe event type", () => {
    for (const type of [
      "checkout.session.completed",
      "invoice.paid",
      "customer.subscription.deleted",
      "payment_intent.succeeded",
      "",
    ]) {
      expect(evaluateAsyncPaymentEvent(achEvent(type))).toEqual({
        kind: "ignore",
        reason: "irrelevant_event",
      });
    }
    expect(evaluateAsyncPaymentEvent(null)).toEqual({ kind: "ignore", reason: "irrelevant_event" });
    expect(evaluateAsyncPaymentEvent(undefined)).toEqual({ kind: "ignore", reason: "irrelevant_event" });
  });

  it("ignores lifecycle events without a metadata.userId (nothing to correlate)", () => {
    for (const metadata of [undefined, null, {}, { tier: "pro" }, { userId: "" }, { userId: 42 }]) {
      const d = evaluateAsyncPaymentEvent(
        achEvent("checkout.session.async_payment_succeeded", { metadata }),
      );
      expect(d).toEqual({ kind: "ignore", reason: "missing_user" });
    }
  });

  it("ignores lifecycle events without a subscription id", () => {
    for (const subscription of [undefined, null, "", {}]) {
      const d = evaluateAsyncPaymentEvent(
        achEvent("checkout.session.async_payment_failed", { subscription }),
      );
      expect(d).toEqual({ kind: "ignore", reason: "missing_subscription" });
    }
  });

  it("accepts the subscription as either a string id or an expanded object", () => {
    const asString = evaluateAsyncPaymentEvent(
      achEvent("checkout.session.async_payment_succeeded", { subscription: "sub_x" }),
    );
    const asObject = evaluateAsyncPaymentEvent(
      achEvent("checkout.session.async_payment_succeeded", { subscription: { id: "sub_x" } }),
    );
    expect(asString.kind).toBe("activate");
    expect(asObject.kind).toBe("activate");
    expect((asString as any).subscriptionId).toBe("sub_x");
    expect((asObject as any).subscriptionId).toBe("sub_x");
  });
});

describe("Stale-event correlation (canApplyAsyncPaymentToUser)", () => {
  const decision = { userId: "user-1", subscriptionId: "sub_new" };

  it("applies only to the matching pending subscription", () => {
    expect(
      canApplyAsyncPaymentToUser(decision, {
        id: "user-1",
        subscriptionStatus: "payment_pending",
        stripeSubscriptionId: "sub_new",
      }),
    ).toBe(true);
  });

  it("ignores a stale event from an earlier abandoned checkout (different subscription id)", () => {
    // User started ACH payment A (sub_old), abandoned it, then started B
    // (sub_new). A's late failure event must NOT revert B's pending payment.
    expect(
      canApplyAsyncPaymentToUser(
        { userId: "user-1", subscriptionId: "sub_old" },
        { id: "user-1", subscriptionStatus: "payment_pending", stripeSubscriptionId: "sub_new" },
      ),
    ).toBe(false);
  });

  it("never touches an account that is no longer payment_pending", () => {
    for (const subscriptionStatus of ["active", "cancelled", "po_pending", null, undefined, ""]) {
      expect(
        canApplyAsyncPaymentToUser(decision, {
          id: "user-1",
          subscriptionStatus,
          stripeSubscriptionId: "sub_new",
        }),
      ).toBe(false);
    }
  });

  it("never touches a different user's account", () => {
    expect(
      canApplyAsyncPaymentToUser(decision, {
        id: "user-2",
        subscriptionStatus: "payment_pending",
        stripeSubscriptionId: "sub_new",
      }),
    ).toBe(false);
  });

  it("never matches when the stored subscription id is missing", () => {
    for (const stripeSubscriptionId of [null, undefined, ""]) {
      expect(
        canApplyAsyncPaymentToUser(decision, {
          id: "user-1",
          subscriptionStatus: "payment_pending",
          stripeSubscriptionId,
        }),
      ).toBe(false);
    }
  });
});

describe("Checkout verification (evaluateVerifyCheckout)", () => {
  const ownSession = (overrides: any = {}) => ({
    metadata: { userId: "user-1", tier: "pro" },
    payment_status: "paid",
    status: "complete",
    ...overrides,
  });

  it("rejects a session owned by another user with 403 (IDOR guard)", () => {
    const d = evaluateVerifyCheckout(
      ownSession({ metadata: { userId: "attacker-victim", tier: "pro" } }),
      "user-1",
    );
    expect(d).toEqual({ kind: "reject", reason: "owner_mismatch", httpStatus: 403 });
  });

  it("rejects a session with no owner metadata at all (default deny)", () => {
    for (const metadata of [undefined, null, {}, { tier: "pro" }]) {
      const d = evaluateVerifyCheckout(ownSession({ metadata }), "user-1");
      expect(d).toEqual({ kind: "reject", reason: "owner_mismatch", httpStatus: 403 });
    }
  });

  it("checks ownership BEFORE completion — a foreign incomplete session still gets 403, not 400", () => {
    const d = evaluateVerifyCheckout(
      ownSession({ metadata: { userId: "someone-else", tier: "pro" }, payment_status: "unpaid", status: "open" }),
      "user-1",
    );
    expect(d).toEqual({ kind: "reject", reason: "owner_mismatch", httpStatus: 403 });
  });

  it("rejects an incomplete/unpaid session with 400", () => {
    const d = evaluateVerifyCheckout(
      ownSession({ payment_status: "unpaid", status: "open" }),
      "user-1",
    );
    expect(d).toEqual({ kind: "reject", reason: "not_completed", httpStatus: 400 });
  });

  it("rejects missing or non-self-serve tiers with 400 (no default-to-pro upgrade)", () => {
    for (const tier of [undefined, "", "enterprise", "free", "system_admin", "PRO"]) {
      const d = evaluateVerifyCheckout(
        ownSession({ metadata: { userId: "user-1", tier } }),
        "user-1",
      );
      expect(d).toEqual({ kind: "reject", reason: "invalid_tier", httpStatus: 400 });
    }
  });

  it("provisions a fully paid card session as active (pending=false)", () => {
    const d = evaluateVerifyCheckout(ownSession(), "user-1");
    expect(d).toEqual({ kind: "provision", tier: "pro", pending: false });
  });

  it("provisions a complete-but-unpaid ACH session as payment-pending", () => {
    const d = evaluateVerifyCheckout(
      ownSession({ payment_status: "unpaid", status: "complete" }),
      "user-1",
    );
    expect(d).toEqual({ kind: "provision", tier: "pro", pending: true });
  });

  it("only pro and campus are self-serve checkout tiers", () => {
    expect([...CHECKOUT_TIERS].sort()).toEqual(["campus", "pro"]);
    for (const tier of CHECKOUT_TIERS) {
      const d = evaluateVerifyCheckout(
        ownSession({ metadata: { userId: "user-1", tier } }),
        "user-1",
      );
      expect(d.kind).toBe("provision");
    }
  });
});
