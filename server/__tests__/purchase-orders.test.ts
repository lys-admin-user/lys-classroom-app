import { describe, it, expect } from "vitest";
import { ROLE_HIERARCHY } from "@shared/models/auth";
import {
  PO_ADMIN_ROLES,
  canManagePurchaseOrders,
  evaluateMarkPaid,
  markPaidRejectionStatus,
  subscriptionStatusAfterPoPaid,
} from "../services/purchaseOrderPolicy";

// These policies drive the /api/admin/purchase-orders routes: the access gate
// (requirePoAdmin is built from PO_ADMIN_ROLES), the mark-paid pre-checks, and
// the account activation side effect. Breaking any of them would let the wrong
// people manage POs or leave a paying school locked out.

describe("Purchase order admin access (canManagePurchaseOrders)", () => {
  it("allows exactly site_admin and system_admin", () => {
    expect([...PO_ADMIN_ROLES].sort()).toEqual(["site_admin", "system_admin"]);
    expect(canManagePurchaseOrders("site_admin")).toBe(true);
    expect(canManagePurchaseOrders("system_admin")).toBe(true);
  });

  it("denies every other role in the hierarchy", () => {
    const nonAdminRoles = (Object.keys(ROLE_HIERARCHY) as string[])
      .filter((r) => !(PO_ADMIN_ROLES as readonly string[]).includes(r));
    expect(nonAdminRoles.length).toBeGreaterThan(0);
    for (const role of nonAdminRoles) {
      expect(canManagePurchaseOrders(role)).toBe(false);
    }
  });

  it("denies missing, empty, or unknown roles (default deny)", () => {
    expect(canManagePurchaseOrders(undefined)).toBe(false);
    expect(canManagePurchaseOrders(null)).toBe(false);
    expect(canManagePurchaseOrders("")).toBe(false);
    expect(canManagePurchaseOrders("admin")).toBe(false);
    expect(canManagePurchaseOrders("SITE_ADMIN")).toBe(false);
  });
});

describe("Mark-paid pre-checks (evaluateMarkPaid)", () => {
  it("rejects a missing purchase order as not_found (HTTP 404)", () => {
    expect(evaluateMarkPaid(undefined)).toBe("not_found");
    expect(evaluateMarkPaid(null)).toBe("not_found");
    expect(markPaidRejectionStatus("not_found")).toBe(404);
  });

  it("rejects an already-paid purchase order (HTTP 400)", () => {
    expect(evaluateMarkPaid({ status: "paid" })).toBe("already_paid");
    expect(markPaidRejectionStatus("already_paid")).toBe(400);
  });

  it("allows a pending purchase order through", () => {
    expect(evaluateMarkPaid({ status: "pending" })).toBe("ok");
  });

  it("allows a cancelled purchase order to be marked paid (admin reversal)", () => {
    // Deliberate: an admin can revive a cancelled PO once payment arrives.
    expect(evaluateMarkPaid({ status: "cancelled" })).toBe("ok");
  });
});

describe("Account activation on paid PO (subscriptionStatusAfterPoPaid)", () => {
  it("flips a po_pending account to active", () => {
    expect(subscriptionStatusAfterPoPaid("po_pending")).toBe("active");
  });

  it("never touches an account in any other state", () => {
    // Guards against overriding a status set by another billing flow
    // (e.g. Stripe already activated or cancelled the account).
    for (const status of ["active", "cancelled", "past_due", "trialing", "", undefined, null]) {
      expect(subscriptionStatusAfterPoPaid(status)).toBeNull();
    }
  });
});
