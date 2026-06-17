import { describe, it, expect } from "vitest";
import { computeHash, stableStringify } from "../services/auditLog";

const GENESIS = "GENESIS";

type Row = Parameters<typeof computeHash>[0];

function makeRow(overrides: Partial<Row>): Row {
  return {
    id: "id-1",
    userId: "user-1",
    action: "grades.export",
    category: "data_access",
    severity: "info",
    resourceType: "class",
    resourceId: "class-1",
    details: { rows: 12 },
    ipAddress: "127.0.0.1",
    userAgent: "vitest",
    organizationId: "org-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    prevHash: GENESIS,
    ...overrides,
  };
}

// Build a forward-linked hash chain the same way logAuditEvent does.
function buildChain(rows: Array<Partial<Row>>): Array<Row & { hash: string }> {
  const out: Array<Row & { hash: string }> = [];
  let prev = GENESIS;
  for (let i = 0; i < rows.length; i++) {
    const row = makeRow({ ...rows[i], id: rows[i].id ?? `id-${i}`, prevHash: prev });
    const hash = computeHash(row);
    out.push({ ...row, hash });
    prev = hash;
  }
  return out;
}

function verify(chain: Array<Row & { hash: string }>): { ok: boolean; brokenAt: string | null } {
  let prev = GENESIS;
  for (const row of chain) {
    if (row.prevHash !== prev) return { ok: false, brokenAt: row.id };
    const recomputed = computeHash(row);
    if (recomputed !== row.hash) return { ok: false, brokenAt: row.id };
    prev = row.hash;
  }
  return { ok: true, brokenAt: null };
}

describe("audit hash chain", () => {
  it("stableStringify is order-independent", () => {
    expect(stableStringify({ a: 1, b: 2 })).toEqual(stableStringify({ b: 2, a: 1 }));
    expect(stableStringify({ a: 1, b: 2 })).not.toEqual(stableStringify({ a: 1, b: 3 }));
  });

  it("a clean chain verifies", () => {
    const chain = buildChain([{ id: "a" }, { id: "b" }, { id: "c" }]);
    expect(verify(chain).ok).toBe(true);
  });

  it("detects an in-place edit to a committed field", () => {
    const chain = buildChain([{ id: "a" }, { id: "b" }, { id: "c" }]);
    // Tamper: change the action of the middle row without recomputing its hash.
    chain[1] = { ...chain[1], action: "grades.export_tampered" };
    const result = verify(chain);
    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe("b");
  });

  it("detects a deleted row (broken prevHash link)", () => {
    const chain = buildChain([{ id: "a" }, { id: "b" }, { id: "c" }]);
    // Remove the middle row; c.prevHash now points at a missing link.
    const tampered = [chain[0], chain[2]];
    const result = verify(tampered);
    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe("c");
  });

  it("changing details payload changes the hash", () => {
    const a = computeHash(makeRow({ details: { rows: 1 } }));
    const b = computeHash(makeRow({ details: { rows: 2 } }));
    expect(a).not.toEqual(b);
  });
});
