// Wiring-parity tests (Task: webhook/checkout wiring can't silently drift).
//
// The pure decision rules in achPaymentPolicy.ts are unit tested, but the SQL
// WHERE filters in webhookHandlers.ts and the HTTP status/message mapping in
// verify-checkout are separate code. These tests exercise the REAL wiring
// hermetically (mocked db/stripe/audit — no live DB):
// - the webhook's UPDATE ... WHERE clauses are rendered to SQL and compared
//   against reference twins built from the policy semantics
//   (canApplyAsyncPaymentToUser / canActivateFromAsyncSuccess /
//   canProvisionFromCompletedCheckout);
// - the real verify-checkout handler maps owner_mismatch→403 and
//   not_completed/invalid_tier→400, and provisions pending-vs-active correctly.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { and, or, eq, ne, isNull, type SQL } from "drizzle-orm";
import { users } from "@shared/schema";

// --- hermetic module mocks (must be declared before importing the handlers) ---

type CapturedUpdate = { values: Record<string, unknown>; where: SQL };
const capturedUpdates: CapturedUpdate[] = [];
// How many rows the next mocked UPDATE reports as matched (node-postgres
// rowCount). 1 = a real change; 0 = a correctly-skipped replay.
let nextRowCount = 1;

vi.mock("../db", () => ({
  db: {
    update: (_table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: (condition: SQL) => {
          capturedUpdates.push({ values, where: condition });
          return Promise.resolve({ rowCount: nextRowCount });
        },
      }),
    }),
  },
}));

const auditEvents: Array<Record<string, unknown>> = [];
vi.mock("../services/auditLog", () => ({
  logAuditEvent: vi.fn(async (entry: Record<string, unknown>) => {
    auditEvents.push(entry);
  }),
}));

// Outcome emails (Task: notify customers when an ACH payment clears/fails).
// Mocked so the wiring tests stay hermetic; assertions below pin down that a
// notice is sent exactly when the DB row actually changed.
const emailNotices: Array<{ userId: string; outcome: string; tier: string | null }> = [];
vi.mock("../services/achPaymentEmails", () => ({
  notifyAchPaymentOutcome: vi.fn(async (userId: string, outcome: string, tier: string | null) => {
    emailNotices.push({ userId, outcome, tier });
  }),
}));

vi.mock("../stripeClient", () => ({
  getStripeSync: vi.fn(),
  getUncachableStripeClient: vi.fn(),
}));

import { WebhookHandlers } from "../webhookHandlers";
import { createVerifyCheckoutHandler } from "../routes/verifyCheckoutHandler";

const dialect = new PgDialect();
const render = (condition: SQL) => {
  const q = dialect.sqlToQuery(condition);
  return { sql: q.sql, params: q.params };
};

const runLifecycle = (event: unknown) =>
  (WebhookHandlers as any).handleSubscriptionLifecycle(event);

beforeEach(() => {
  capturedUpdates.length = 0;
  auditEvents.length = 0;
  emailNotices.length = 0;
  nextRowCount = 1;
});

// Reference WHERE twins, built here directly from the policy-function
// semantics. If the handler's SQL ever drifts from these, the rendered
// SQL/params comparison fails.
const refPendingMatch = (userId: string, subscriptionId: string) =>
  and(
    eq(users.id, userId),
    eq(users.subscriptionStatus, "payment_pending"),
    eq(users.stripeSubscriptionId, subscriptionId),
  )!;

const refActivateFromAsyncSuccess = (userId: string, subscriptionId: string) =>
  and(
    eq(users.id, userId),
    or(
      and(
        eq(users.subscriptionStatus, "payment_pending"),
        eq(users.stripeSubscriptionId, subscriptionId),
      ),
      isNull(users.stripeSubscriptionId),
    ),
  )!;

const refProvisionFromCompleted = (userId: string, subscriptionId: string) =>
  and(
    eq(users.id, userId),
    or(
      isNull(users.stripeSubscriptionId),
      and(
        ne(users.stripeSubscriptionId, subscriptionId),
        or(isNull(users.subscriptionStatus), ne(users.subscriptionStatus, "active")),
      ),
    ),
  )!;

const asyncEvent = (
  type: string,
  overrides: Record<string, unknown> = {},
) => ({
  type,
  data: {
    object: {
      id: "cs_test_1",
      subscription: "sub_123",
      metadata: { userId: "user-1", tier: "pro" },
      ...overrides,
    },
  },
});

describe("webhook wiring: async payment events", () => {
  it("success with a valid tier uses the canActivateFromAsyncSuccess WHERE twin", async () => {
    await runLifecycle(asyncEvent("checkout.session.async_payment_succeeded"));

    expect(capturedUpdates).toHaveLength(1);
    const upd = capturedUpdates[0];
    expect(upd.values).toMatchObject({
      tier: "pro",
      subscriptionStatus: "active",
      stripeSubscriptionId: "sub_123",
    });
    expect(render(upd.where)).toEqual(
      render(refActivateFromAsyncSuccess("user-1", "sub_123")),
    );
    expect(auditEvents.map((e) => e.action)).toContain("billing.ach_payment_succeeded");
    expect(emailNotices).toEqual([{ userId: "user-1", outcome: "succeeded", tier: "pro" }]);
  });

  it("success WITHOUT a trustworthy tier falls back to the canApplyAsyncPaymentToUser WHERE twin (pending-match only)", async () => {
    await runLifecycle(
      asyncEvent("checkout.session.async_payment_succeeded", {
        metadata: { userId: "user-1", tier: "enterprise-typo" },
      }),
    );

    expect(capturedUpdates).toHaveLength(1);
    const upd = capturedUpdates[0];
    expect(upd.values).toMatchObject({ subscriptionStatus: "active" });
    expect(upd.values).not.toHaveProperty("tier");
    expect(render(upd.where)).toEqual(render(refPendingMatch("user-1", "sub_123")));
  });

  it("failure reverts to free using the canApplyAsyncPaymentToUser WHERE twin", async () => {
    await runLifecycle(asyncEvent("checkout.session.async_payment_failed"));

    expect(capturedUpdates).toHaveLength(1);
    const upd = capturedUpdates[0];
    expect(upd.values).toMatchObject({
      tier: "free",
      subscriptionStatus: null,
      stripeSubscriptionId: null,
    });
    expect(render(upd.where)).toEqual(render(refPendingMatch("user-1", "sub_123")));
    expect(auditEvents.map((e) => e.action)).toContain("billing.ach_payment_failed");
    expect(emailNotices).toEqual([{ userId: "user-1", outcome: "failed", tier: "pro" }]);
  });

  it("success matching ZERO rows logs a skip, not a state change", async () => {
    nextRowCount = 0;
    await runLifecycle(asyncEvent("checkout.session.async_payment_succeeded"));

    const actions = auditEvents.map((e) => e.action);
    expect(actions).toContain("billing.webhook_skipped_idempotent");
    expect(actions).not.toContain("billing.ach_payment_succeeded");
    const skip = auditEvents.find((e) => e.action === "billing.webhook_skipped_idempotent")!;
    expect(skip.details).toMatchObject({ intendedAction: "ach_payment_succeeded" });
    expect(emailNotices).toHaveLength(0);
  });

  it("failure matching ZERO rows logs a skip, not a state change", async () => {
    nextRowCount = 0;
    await runLifecycle(asyncEvent("checkout.session.async_payment_failed"));

    const actions = auditEvents.map((e) => e.action);
    expect(actions).toContain("billing.webhook_skipped_idempotent");
    expect(actions).not.toContain("billing.ach_payment_failed");
    const skip = auditEvents.find((e) => e.action === "billing.webhook_skipped_idempotent")!;
    expect(skip.details).toMatchObject({ intendedAction: "ach_payment_failed" });
    expect(emailNotices).toHaveLength(0);
  });

  it("irrelevant events and uncorrelatable events touch nothing", async () => {
    await runLifecycle({ type: "invoice.paid", data: { object: {} } });
    await runLifecycle(
      asyncEvent("checkout.session.async_payment_succeeded", { metadata: {} }),
    );
    await runLifecycle(
      asyncEvent("checkout.session.async_payment_succeeded", { subscription: null }),
    );

    expect(capturedUpdates).toHaveLength(0);
    expect(auditEvents).toHaveLength(0);
    expect(emailNotices).toHaveLength(0);
  });
});

describe("webhook wiring: checkout.session.completed provisioning", () => {
  const completedEvent = (overrides: Record<string, unknown> = {}) => ({
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_2",
        subscription: { id: "sub_456" },
        status: "complete",
        payment_status: "paid",
        metadata: { userId: "user-2", tier: "campus" },
        ...overrides,
      },
    },
  });

  it("paid card checkout provisions ACTIVE using the canProvisionFromCompletedCheckout WHERE twin", async () => {
    await runLifecycle(completedEvent());

    expect(capturedUpdates).toHaveLength(1);
    const upd = capturedUpdates[0];
    expect(upd.values).toMatchObject({
      tier: "campus",
      subscriptionStatus: "active",
      stripeSubscriptionId: "sub_456",
    });
    expect(render(upd.where)).toEqual(
      render(refProvisionFromCompleted("user-2", "sub_456")),
    );
    expect(auditEvents.map((e) => e.action)).toContain(
      "billing.checkout_completed_provisioned",
    );
    // Card payments are instant — no "processing" notice.
    expect(emailNotices).toHaveLength(0);
  });

  it("complete-but-unpaid (ACH clearing) provisions PAYMENT_PENDING with the same WHERE twin", async () => {
    await runLifecycle(completedEvent({ payment_status: "unpaid" }));

    expect(capturedUpdates).toHaveLength(1);
    const upd = capturedUpdates[0];
    expect(upd.values).toMatchObject({
      tier: "campus",
      subscriptionStatus: "payment_pending",
      stripeSubscriptionId: "sub_456",
    });
    expect(render(upd.where)).toEqual(
      render(refProvisionFromCompleted("user-2", "sub_456")),
    );
    // ACH is still clearing: the customer gets a "payment is processing"
    // heads-up exactly once, tied to the real row change.
    expect(emailNotices).toEqual([
      { userId: "user-2", outcome: "processing", tier: "campus" },
    ]);
  });

  it("completed provisioning matching ZERO rows logs a skip, not a state change", async () => {
    nextRowCount = 0;
    await runLifecycle(completedEvent());

    const actions = auditEvents.map((e) => e.action);
    expect(actions).toContain("billing.webhook_skipped_idempotent");
    expect(actions).not.toContain("billing.checkout_completed_provisioned");
    const skip = auditEvents.find((e) => e.action === "billing.webhook_skipped_idempotent")!;
    expect(skip.details).toMatchObject({
      intendedAction: "checkout_completed_provisioned",
      tier: "campus",
    });
  });

  it("pending provisioning matching ZERO rows (replay) sends NO processing email", async () => {
    nextRowCount = 0;
    await runLifecycle(completedEvent({ payment_status: "unpaid" }));

    expect(auditEvents.map((e) => e.action)).toContain("billing.webhook_skipped_idempotent");
    expect(emailNotices).toHaveLength(0);
  });

  it("not-completed or invalid-tier completed events touch nothing", async () => {
    await runLifecycle(
      completedEvent({ status: "open", payment_status: "unpaid" }),
    );
    await runLifecycle(
      completedEvent({ metadata: { userId: "user-2", tier: "bogus" } }),
    );

    expect(capturedUpdates).toHaveLength(0);
    expect(auditEvents).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// verify-checkout handler-level mapping (real handler, injected fakes)
// ---------------------------------------------------------------------------

type FakeRes = {
  statusCode: number;
  body: any;
  status: (code: number) => FakeRes;
  json: (body: any) => FakeRes;
};

const makeRes = (): FakeRes => {
  const res: FakeRes = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: any) {
      res.body = body;
      return res;
    },
  };
  return res;
};

const makeHandlerHarness = (session: any, opts: { rowCount?: number } = {}) => {
  const updates: CapturedUpdate[] = [];
  const audits: Array<Record<string, unknown>> = [];
  const notices: Array<{ userId: string; outcome: string; tier: string | null }> = [];
  const handler = createVerifyCheckoutHandler({
    getStripeClient: async () =>
      ({
        checkout: { sessions: { retrieve: async () => session } },
      }) as any,
    db: {
      update: (_table: typeof users) => ({
        set: (values: Record<string, unknown>) => ({
          where: (condition: unknown) => {
            updates.push({ values, where: condition as SQL });
            return Promise.resolve({ rowCount: opts.rowCount ?? 1 });
          },
        }),
      }),
    },
    logAuditEvent: async (entry) => {
      audits.push(entry);
    },
    notifyAchPaymentOutcome: async (userId, outcome, tier) => {
      notices.push({ userId, outcome, tier: tier ?? null });
    },
  });
  const req = {
    user: { claims: { sub: "user-9" } },
    body: { sessionId: "cs_verify_1" },
  };
  return { handler, req, updates, audits, notices };
};

// WHERE twin for verify-checkout's pending-provision dedupe: match the user
// UNLESS the webhook already provisioned payment_pending for this exact
// subscription (in which case verify-checkout must not re-write or re-email).
const refVerifyPendingProvision = (userId: string, subscriptionId: string) =>
  and(
    eq(users.id, userId),
    or(
      isNull(users.subscriptionStatus),
      ne(users.subscriptionStatus, "payment_pending"),
      isNull(users.stripeSubscriptionId),
      ne(users.stripeSubscriptionId, subscriptionId),
    ),
  )!;

describe("verify-checkout handler wiring", () => {
  it("owner_mismatch maps to 403 with the ownership message, audits the denial, and writes nothing", async () => {
    const { handler, req, updates, audits } = makeHandlerHarness({
      metadata: { userId: "someone-else", tier: "pro" },
      payment_status: "paid",
      status: "complete",
    });
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({
      error: "This checkout session does not belong to your account",
    });
    expect(updates).toHaveLength(0);
    expect(audits.map((a) => a.action)).toContain("billing.verify_checkout_denied");
  });

  it("not_completed maps to 400 with 'Payment not completed'", async () => {
    const { handler, req, updates } = makeHandlerHarness({
      metadata: { userId: "user-9", tier: "pro" },
      payment_status: "unpaid",
      status: "open",
    });
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Payment not completed" });
    expect(updates).toHaveLength(0);
  });

  it("invalid_tier maps to 400 with 'Invalid checkout session tier'", async () => {
    const { handler, req, updates } = makeHandlerHarness({
      metadata: { userId: "user-9", tier: "not-a-tier" },
      payment_status: "paid",
      status: "complete",
    });
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Invalid checkout session tier" });
    expect(updates).toHaveLength(0);
  });

  it("missing sessionId maps to 400 before calling Stripe", async () => {
    const { handler, updates } = makeHandlerHarness({});
    const res = makeRes();
    await handler({ user: { claims: { sub: "user-9" } }, body: {} }, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Missing sessionId" });
    expect(updates).toHaveLength(0);
  });

  it("paid card checkout provisions ACTIVE for the requesting user only", async () => {
    const { handler, req, updates } = makeHandlerHarness({
      metadata: { userId: "user-9", tier: "pro" },
      payment_status: "paid",
      status: "complete",
      subscription: { id: "sub_789" },
    });
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true, tier: "pro" });
    expect(res.body.pending).toBeUndefined();
    expect(updates).toHaveLength(1);
    expect(updates[0].values).toMatchObject({
      tier: "pro",
      subscriptionStatus: "active",
      stripeSubscriptionId: "sub_789",
    });
    expect(render(updates[0].where)).toEqual(render(eq(users.id, "user-9")));
  });

  it("complete-but-unpaid ACH checkout provisions PAYMENT_PENDING (webhook-dedupe WHERE twin), reports pending, and sends ONE processing email", async () => {
    const { handler, req, updates, notices } = makeHandlerHarness({
      metadata: { userId: "user-9", tier: "campus" },
      payment_status: "unpaid",
      status: "complete",
      subscription: { id: "sub_ach_1" },
    });
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true, pending: true, tier: "campus" });
    expect(updates).toHaveLength(1);
    expect(updates[0].values).toMatchObject({
      tier: "campus",
      subscriptionStatus: "payment_pending",
      stripeSubscriptionId: "sub_ach_1",
    });
    expect(render(updates[0].where)).toEqual(
      render(refVerifyPendingProvision("user-9", "sub_ach_1")),
    );
    expect(notices).toEqual([
      { userId: "user-9", outcome: "processing", tier: "campus" },
    ]);
  });

  it("verify-first race: when the webhook already provisioned (zero rows) NO second processing email is sent, but the response still reports pending", async () => {
    const { handler, req, updates, notices } = makeHandlerHarness(
      {
        metadata: { userId: "user-9", tier: "campus" },
        payment_status: "unpaid",
        status: "complete",
        subscription: { id: "sub_ach_1" },
      },
      { rowCount: 0 },
    );
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true, pending: true, tier: "campus" });
    expect(updates).toHaveLength(1);
    expect(notices).toHaveLength(0);
  });

  it("paid card checkout sends NO processing email", async () => {
    const { handler, req, notices } = makeHandlerHarness({
      metadata: { userId: "user-9", tier: "pro" },
      payment_status: "paid",
      status: "complete",
      subscription: { id: "sub_789" },
    });
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(notices).toHaveLength(0);
  });
});
