// Pure decision logic for the purchase-order admin flow, extracted so it can
// be unit-tested hermetically (no DB) and shared by the routes.
// Wired into server/routes/admin.ts (GET /api/admin/purchase-orders and
// POST /api/admin/purchase-orders/:id/mark-paid).

/**
 * Roles allowed to list purchase orders and mark them paid.
 * Must stay in lockstep with the requireSiteAdmin gate semantics.
 */
export const PO_ADMIN_ROLES = ["site_admin", "system_admin"] as const;

export function canManagePurchaseOrders(role: string | null | undefined): boolean {
  return (PO_ADMIN_ROLES as readonly string[]).includes(role ?? "");
}

export type MarkPaidDecision = "ok" | "not_found" | "already_paid";

/**
 * Decide whether a mark-paid request may proceed for the given PO record
 * (or lack thereof).
 */
export function evaluateMarkPaid(
  po: { status: string } | null | undefined,
): MarkPaidDecision {
  if (!po) return "not_found";
  if (po.status === "paid") return "already_paid";
  return "ok";
}

/** HTTP status code for a rejected mark-paid decision. */
export function markPaidRejectionStatus(decision: Exclude<MarkPaidDecision, "ok">): number {
  return decision === "not_found" ? 404 : 400;
}

/**
 * After a PO is marked paid, what should the submitting account's
 * subscriptionStatus become? Returns the new status, or null when the account
 * must be left untouched (never override a status set by another billing flow).
 */
export function subscriptionStatusAfterPoPaid(
  current: string | null | undefined,
): "active" | null {
  return current === "po_pending" ? "active" : null;
}
