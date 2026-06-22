import { describe, it, expect } from "vitest";
import { computeEnterpriseQuote, PLAN_PRICES, SEAT_PRICES, SEAT_MINIMUMS, ENTERPRISE_PER_CAMPUS_PRICE } from "./pricing";

// Locks in the Enterprise pricing formula:
//   total = base($599) + max(seats,30) x $10/seat + campusCount x $299/campus
describe("computeEnterpriseQuote", () => {
  it("uses the documented Enterprise constants", () => {
    expect(PLAN_PRICES.enterprise).toBe(599);
    expect(SEAT_PRICES.enterprise).toBe(10);
    expect(SEAT_MINIMUMS.enterprise).toBe(30);
    expect(ENTERPRISE_PER_CAMPUS_PRICE).toBe(PLAN_PRICES.campus);
    expect(ENTERPRISE_PER_CAMPUS_PRICE).toBe(299);
  });

  it("defaults to the seat minimum when no seat count is given", () => {
    const q = computeEnterpriseQuote({ campusCount: 0 });
    expect(q.billableSeats).toBe(30);
    expect(q.seatSubtotal).toBe(300);
    expect(q.campusSubtotal).toBe(0);
    expect(q.total).toBe(599 + 300);
  });

  it("enforces the seat minimum even when fewer seats are requested", () => {
    const q = computeEnterpriseQuote({ campusCount: 0, seatCount: 5 });
    expect(q.billableSeats).toBe(30);
    expect(q.total).toBe(599 + 300);
  });

  it("bills each campus at the campus price on top of base + seats", () => {
    const q = computeEnterpriseQuote({ campusCount: 4, seatCount: 50 });
    expect(q.campusCount).toBe(4);
    expect(q.billableSeats).toBe(50);
    expect(q.seatSubtotal).toBe(500);
    expect(q.campusSubtotal).toBe(4 * 299);
    expect(q.total).toBe(599 + 500 + 4 * 299);
  });

  it("floors and clamps negative or fractional inputs", () => {
    const q = computeEnterpriseQuote({ campusCount: -3, seatCount: -10 });
    expect(q.campusCount).toBe(0);
    expect(q.billableSeats).toBe(30);
    const frac = computeEnterpriseQuote({ campusCount: 2.9, seatCount: 31.7 });
    expect(frac.campusCount).toBe(2);
    expect(frac.billableSeats).toBe(31);
  });
});
