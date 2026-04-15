export const PLAN_PRICES = {
  free: 0,
  pro: 19,
  campus: 299,
  enterprise: 299,
} as const;

export const SEAT_PRICES = {
  campus: 15,
  enterprise: 15,
} as const;

export const FREE_LESSON_LIMIT = 5;

export type PlanId = keyof typeof PLAN_PRICES;

export function planPrice(plan: PlanId): number {
  return PLAN_PRICES[plan];
}

export function formatPlanPrice(plan: PlanId): string {
  const price = PLAN_PRICES[plan];
  return price === 0 ? "Free" : `$${price}`;
}
