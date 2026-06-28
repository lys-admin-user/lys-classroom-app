import { describe, it, expect } from "vitest";
import { GENERATED_HR_ROLES } from "../hr/rolesGenerated";
import { SEED_HR_ROLES } from "../hr/roleSeed";

// Guards the quality of the auto-generated role directory (transcribed from the
// LYS Comprehensive Roles & Operational Directory). These are hermetic checks on
// the generated data — no DB required.
describe("LYS role ingestion", () => {
  it("generates all 38 roles from the source document", () => {
    expect(GENERATED_HR_ROLES.length).toBe(38);
  });

  it("does not leak section/role headers or numbered subsection markers into content", () => {
    const bleed = /Section\s+2\.\d+:|^Role\s+\d+:|^[1-6]\.\s+(Executive Summary|BE.?KNOW.?DO|Key Performance|Standard Operating|Tools|Performance Evaluation)/i;
    for (const r of GENERATED_HR_ROLES) {
      const strings: string[] = [
        r.summary ?? "",
        r.bkdBe ?? "",
        r.bkdKnow ?? "",
        r.bkdDo ?? "",
        ...(r.kpis ?? []).flatMap((k) => [k.name, k.target ?? ""]),
        ...(r.tools ?? []),
        ...(r.evaluationChecklist ?? []),
        ...Object.values(r.sops ?? {}).flat(),
      ];
      for (const s of strings) {
        expect(s, `contamination in role "${r.title}": ${s}`).not.toMatch(bleed);
      }
    }
  });

  it("gives every role complete, non-empty core fields", () => {
    for (const r of GENERATED_HR_ROLES) {
      expect(r.id, "id").toBeTruthy();
      expect(r.title.length, `title for ${r.id}`).toBeGreaterThan(0);
      expect(r.department.length, `department for ${r.id}`).toBeGreaterThan(0);
      expect(["active", "near_future", "future"]).toContain(r.horizon);
      expect(r.summary!.length, `summary for ${r.id}`).toBeGreaterThan(20);
      expect(r.kpis!.length, `kpis for ${r.id}`).toBeGreaterThan(0);
    }
  });

  it("uses unique stable ids across the full seed (no dupes after merge)", () => {
    const ids = SEED_HR_ROLES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
