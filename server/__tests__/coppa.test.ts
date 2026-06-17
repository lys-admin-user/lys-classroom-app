import { describe, it, expect } from "vitest";
import { isUnderCoppaAge } from "../services/dataSubjectService";

function yearsAgo(years: number, extraDays = 0): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setDate(d.getDate() - extraDays);
  return d;
}

describe("COPPA age gate (isUnderCoppaAge)", () => {
  it("treats a 10-year-old as under-13", () => {
    expect(isUnderCoppaAge(yearsAgo(10))).toBe(true);
  });

  it("treats a child just shy of 13 as under-13", () => {
    expect(isUnderCoppaAge(yearsAgo(12, 300))).toBe(true);
  });

  it("treats a 13-year-old as allowed", () => {
    expect(isUnderCoppaAge(yearsAgo(13, 1))).toBe(false);
  });

  it("treats an adult as allowed", () => {
    expect(isUnderCoppaAge(yearsAgo(40))).toBe(false);
  });

  it("returns false for missing birthdate (cannot assert under-13)", () => {
    expect(isUnderCoppaAge(null)).toBe(false);
    expect(isUnderCoppaAge(undefined)).toBe(false);
  });
});
