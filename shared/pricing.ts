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

export interface EnterpriseQuote {
  basePrice: number;
  seatPrice: number;
  seatMinimum: number;
  perCampusPrice: number;
  campusCount: number;
  billableSeats: number;
  seatSubtotal: number;
  campusSubtotal: number;
  total: number;
}

// Computes the full monthly Enterprise price for a network given its campus and
// seat counts. Seats are billed at the seat minimum even if fewer are requested.
export function computeEnterpriseQuote(input: { campusCount: number; seatCount?: number }): EnterpriseQuote {
  const basePrice = PLAN_PRICES.enterprise;
  const seatPrice = SEAT_PRICES.enterprise;
  const seatMinimum = SEAT_MINIMUMS.enterprise;
  const perCampusPrice = ENTERPRISE_PER_CAMPUS_PRICE;

  const campusCount = Math.max(0, Math.floor(input.campusCount || 0));
  const requestedSeats = Math.max(0, Math.floor(input.seatCount ?? seatMinimum));
  const billableSeats = Math.max(seatMinimum, requestedSeats);

  const seatSubtotal = billableSeats * seatPrice;
  const campusSubtotal = campusCount * perCampusPrice;
  const total = basePrice + seatSubtotal + campusSubtotal;

  return {
    basePrice,
    seatPrice,
    seatMinimum,
    perCampusPrice,
    campusCount,
    billableSeats,
    seatSubtotal,
    campusSubtotal,
    total,
  };
}
