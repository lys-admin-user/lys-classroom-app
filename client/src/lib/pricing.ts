export const PLAN_PRICES = {
  free: 0,
  pro: 7.99,
  campus: 299,
  enterprise: 599,
} as const;

export const PRO_REGULAR_PRICE = 19;
export const PRO_PROMO_END_DATE = "2026-06-30";

export const SEAT_PRICES = {
  campus: 12,
  enterprise: 10,
} as const;

export const SEAT_MINIMUMS = {
  campus: 10,
  enterprise: 30,
} as const;

// Enterprise networks (ISDs, charter networks) are charged the Campus tier price
// for each campus in their network, since each location typically has its own
// campus administrator. This is added on top of the Enterprise base + seat pricing.
export const ENTERPRISE_PER_CAMPUS_PRICE = PLAN_PRICES.campus;

export const FREE_LESSON_LIMIT = 5;

export type PlanId = keyof typeof PLAN_PRICES;

export function planPrice(plan: PlanId): number {
  return PLAN_PRICES[plan];
}

export function formatPlanPrice(plan: PlanId): string {
  const price = PLAN_PRICES[plan];
  return price === 0 ? "Free" : `$${price}`;
}
