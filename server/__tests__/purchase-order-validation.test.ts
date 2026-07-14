import { describe, it, expect } from "vitest";
import { purchaseOrderSubmitSchema } from "@shared/schema";

const valid = {
  tier: "pro",
  poNumber: "PO-12345",
  organizationName: "Springfield ISD",
  contactName: "Jane Doe",
  contactEmail: "billing@springfield.example.com",
  notes: "Net 30 terms",
};

describe("purchaseOrderSubmitSchema", () => {
  it("accepts a fully valid submission", () => {
    const r = purchaseOrderSubmitSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it("accepts a minimal submission without optional fields", () => {
    const r = purchaseOrderSubmitSchema.safeParse({
      tier: "campus",
      poNumber: "1",
      organizationName: "A",
      contactEmail: "a@b.co",
    });
    expect(r.success).toBe(true);
  });

  it("trims whitespace on string fields", () => {
    const r = purchaseOrderSubmitSchema.safeParse({
      ...valid,
      poNumber: "  PO-1  ",
      contactEmail: "  billing@springfield.example.com  ",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.poNumber).toBe("PO-1");
      expect(r.data.contactEmail).toBe("billing@springfield.example.com");
    }
  });

  it("rejects an invalid billing email", () => {
    const r = purchaseOrderSubmitSchema.safeParse({ ...valid, contactEmail: "not-an-email" });
    expect(r.success).toBe(false);
  });

  it("rejects an unknown tier", () => {
    const r = purchaseOrderSubmitSchema.safeParse({ ...valid, tier: "enterprise" });
    expect(r.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    for (const key of ["tier", "poNumber", "organizationName", "contactEmail"] as const) {
      const body: Record<string, unknown> = { ...valid };
      delete body[key];
      const r = purchaseOrderSubmitSchema.safeParse(body);
      expect(r.success, `expected failure when ${key} is missing`).toBe(false);
    }
  });

  it("rejects blank-after-trim required fields", () => {
    expect(purchaseOrderSubmitSchema.safeParse({ ...valid, poNumber: "   " }).success).toBe(false);
    expect(purchaseOrderSubmitSchema.safeParse({ ...valid, organizationName: "   " }).success).toBe(false);
  });

  it("rejects oversized fields", () => {
    expect(purchaseOrderSubmitSchema.safeParse({ ...valid, poNumber: "x".repeat(65) }).success).toBe(false);
    expect(purchaseOrderSubmitSchema.safeParse({ ...valid, organizationName: "x".repeat(201) }).success).toBe(false);
    expect(purchaseOrderSubmitSchema.safeParse({ ...valid, contactName: "x".repeat(121) }).success).toBe(false);
    expect(purchaseOrderSubmitSchema.safeParse({ ...valid, notes: "x".repeat(2001) }).success).toBe(false);
  });

  it("tolerates explicit null for optional fields (legacy clients)", () => {
    const r = purchaseOrderSubmitSchema.safeParse({ ...valid, contactName: null, notes: null });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.contactName).toBeUndefined();
      expect(r.data.notes).toBeUndefined();
    }
  });

  it("normalizes empty-string optional fields to undefined", () => {
    const r = purchaseOrderSubmitSchema.safeParse({ ...valid, contactName: "  ", notes: "" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.contactName).toBeUndefined();
      expect(r.data.notes).toBeUndefined();
    }
  });

  it("rejects non-string junk types", () => {
    expect(purchaseOrderSubmitSchema.safeParse({ ...valid, poNumber: 12345 }).success).toBe(false);
    expect(purchaseOrderSubmitSchema.safeParse({ ...valid, notes: { a: 1 } }).success).toBe(false);
  });
});
