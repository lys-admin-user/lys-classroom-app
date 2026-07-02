import { describe, it, expect } from "vitest";
import {
  US_GRADE_OPTIONS,
  US_GRADE_VALUES,
  normalizeGradeToken,
  expandGradeSelectionToTokens,
  gradesCoveredByStandard,
  standardMatchesGrades,
  educationLevelsCoverGrades,
} from "./gradeLevels";

describe("US_GRADE_OPTIONS", () => {
  it("spans Pre-K through Grade 12 plus a disabled Post-secondary", () => {
    expect(US_GRADE_OPTIONS[0].value).toBe("Pre-K");
    const last = US_GRADE_OPTIONS[US_GRADE_OPTIONS.length - 1];
    expect(last.band).toBe("post_secondary");
    expect(last.disabled).toBe(true);
    // 15 entries: Pre-K, K, 1-12, Post-secondary
    expect(US_GRADE_OPTIONS).toHaveLength(15);
  });

  it("US_GRADE_VALUES excludes disabled placeholders", () => {
    expect(US_GRADE_VALUES).not.toContain("Post-secondary");
    expect(US_GRADE_VALUES).toContain("Grade 3");
    expect(US_GRADE_VALUES).toHaveLength(14);
  });

  it("every option carries a band-prefixed label", () => {
    for (const opt of US_GRADE_OPTIONS) {
      expect(opt.label).toMatch(/—|\//);
    }
  });
});

describe("normalizeGradeToken", () => {
  it("maps Pre-K variants to PK (incl. the onboarding pre_k id)", () => {
    for (const v of ["Pre-K", "pre k", "pre_k", "Preschool", "Nursery", "pre-kindergarten"]) {
      expect(normalizeGradeToken(v)).toBe("PK");
    }
  });

  it("maps kindergarten variants to K", () => {
    for (const v of ["Kindergarten", "K", "KG", "Grade R", "PP1"]) {
      expect(normalizeGradeToken(v)).toBe("K");
    }
  });

  it("extracts numeric grades from many formats", () => {
    expect(normalizeGradeToken("Grade 3")).toBe("3");
    expect(normalizeGradeToken("3rd Grade")).toBe("3");
    expect(normalizeGradeToken("03")).toBe("3");
    expect(normalizeGradeToken("Primary 5")).toBe("5");
    expect(normalizeGradeToken("12")).toBe("12");
  });

  it("returns null for unmappable / empty input", () => {
    expect(normalizeGradeToken("")).toBeNull();
    expect(normalizeGradeToken(null)).toBeNull();
    expect(normalizeGradeToken("JSS 99")).toBeNull();
  });
});

describe("gradesCoveredByStandard", () => {
  it("parses single grades", () => {
    expect(Array.from(gradesCoveredByStandard("3"))).toEqual(["3"]);
  });

  it("expands numeric ranges", () => {
    expect(Array.from(gradesCoveredByStandard("9-12"))).toEqual(["9", "10", "11", "12"]);
  });

  it("expands K-anchored ranges", () => {
    expect(Array.from(gradesCoveredByStandard("K-2"))).toEqual(["K", "1", "2"]);
  });

  it("parses comma / slash lists", () => {
    expect(Array.from(gradesCoveredByStandard("9,10")).sort()).toEqual(["10", "9"].sort());
  });

  it("returns empty set for missing info", () => {
    expect(gradesCoveredByStandard(null).size).toBe(0);
    expect(gradesCoveredByStandard("").size).toBe(0);
  });
});

describe("standardMatchesGrades", () => {
  it("does not let grade 1 match a 10-12 range (the original band bug)", () => {
    const selected = expandGradeSelectionToTokens(["Grade 1"]);
    expect(standardMatchesGrades("10-12", selected)).toBe(false);
    expect(standardMatchesGrades("1", selected)).toBe(true);
  });

  it("matches K inside a range", () => {
    const selected = expandGradeSelectionToTokens(["Kindergarten"]);
    expect(standardMatchesGrades("K-5", selected)).toBe(true);
    expect(standardMatchesGrades("6-8", selected)).toBe(false);
  });

  it("treats empty selection as match-all", () => {
    expect(standardMatchesGrades("9-12", new Set())).toBe(true);
  });

  it("treats ungraded standards as match-all", () => {
    const selected = expandGradeSelectionToTokens(["Grade 3"]);
    expect(standardMatchesGrades(null, selected)).toBe(true);
    expect(standardMatchesGrades("", selected)).toBe(true);
  });

  it("supports band keys in the selection (onboarding prefs)", () => {
    const selected = expandGradeSelectionToTokens(["elementary"]);
    expect(standardMatchesGrades("3", selected)).toBe(true);
    expect(standardMatchesGrades("9", selected)).toBe(false);
  });

  it("aligns onboarding pre_k selection to Pre-K (not match-all)", () => {
    const selected = expandGradeSelectionToTokens(["pre_k"]);
    expect(selected.size).toBe(1);
    expect(standardMatchesGrades("PK", selected)).toBe(true);
    expect(standardMatchesGrades("3", selected)).toBe(false);
  });

  it("early_childhood band key resolves to Pre-K", () => {
    const selected = expandGradeSelectionToTokens(["early_childhood"]);
    expect(standardMatchesGrades("PK", selected)).toBe(true);
    expect(standardMatchesGrades("K", selected)).toBe(false);
  });
});

describe("educationLevelsCoverGrades (set-level grade data)", () => {
  it("matches zero-padded CSP levels like 09/10", () => {
    const g9 = expandGradeSelectionToTokens(["Grade 9"]);
    expect(educationLevelsCoverGrades(["09", "10", "11", "12"], g9)).toBe(true);
    const g3 = expandGradeSelectionToTokens(["Grade 3"]);
    expect(educationLevelsCoverGrades(["09", "10", "11", "12"], g3)).toBe(false);
  });

  it("handles Pre-K / K tokens in the levels array", () => {
    const pk = expandGradeSelectionToTokens(["Pre-K"]);
    expect(educationLevelsCoverGrades(["Pre-K", "K", "01"], pk)).toBe(true);
    const g5 = expandGradeSelectionToTokens(["Grade 5"]);
    expect(educationLevelsCoverGrades(["Pre-K", "K", "01"], g5)).toBe(false);
  });

  it("ignores non-grade tokens like VocationalTraining", () => {
    const g10 = expandGradeSelectionToTokens(["Grade 10"]);
    expect(educationLevelsCoverGrades(["10", "11", "VocationalTraining"], g10)).toBe(true);
    const g8 = expandGradeSelectionToTokens(["Grade 8"]);
    expect(educationLevelsCoverGrades(["10", "11", "VocationalTraining"], g8)).toBe(false);
  });

  it("treats all-unparseable / empty / no-selection levels as cover-all", () => {
    const g8 = expandGradeSelectionToTokens(["Grade 8"]);
    expect(educationLevelsCoverGrades(["VocationalTraining"], g8)).toBe(true);
    expect(educationLevelsCoverGrades([], g8)).toBe(true);
    expect(educationLevelsCoverGrades(null, g8)).toBe(true);
    expect(educationLevelsCoverGrades(["09"], new Set())).toBe(true);
  });
});
