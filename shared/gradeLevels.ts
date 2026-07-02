// ---------------------------------------------------------------------------
// Grade-level taxonomy (single source of truth)
//
// The app used to offer coarse grade BANDS ("Elementary (3-5)") in every grade
// picker. That both (a) mixed multiple grades' standards together and (b) broke
// backend matching (a band string never matches a DB grade like "3" or "9-12").
//
// This module defines INDIVIDUAL grades (Pre-K → 12, plus a coming-soon
// Post-secondary placeholder) with band-prefixed labels, and the normalization
// helpers used to align a chosen grade to standards whose grade field can be
// written many different ways ("3", "03", "K", "9-12", "Grade 3", "KG", ...).
// ---------------------------------------------------------------------------

export type GradeBand =
  | "early_childhood"
  | "elementary"
  | "middle_school"
  | "high_school"
  | "post_secondary";

export interface GradeOption {
  /** Sent to the backend as `gradeLevel`; human-readable and grade-specific. */
  value: string;
  /** Band-prefixed label shown in the menu. */
  label: string;
  band: GradeBand;
  /** Rendered but not selectable (e.g. Post-secondary "coming soon"). */
  disabled?: boolean;
}

export const US_GRADE_OPTIONS: GradeOption[] = [
  { value: "Pre-K", label: "Early Childhood — Pre-K", band: "early_childhood" },
  { value: "Kindergarten", label: "Elementary — Kindergarten", band: "elementary" },
  { value: "Grade 1", label: "Elementary — Grade 1", band: "elementary" },
  { value: "Grade 2", label: "Elementary — Grade 2", band: "elementary" },
  { value: "Grade 3", label: "Elementary — Grade 3", band: "elementary" },
  { value: "Grade 4", label: "Elementary — Grade 4", band: "elementary" },
  { value: "Grade 5", label: "Elementary — Grade 5", band: "elementary" },
  { value: "Grade 6", label: "Middle School — Grade 6", band: "middle_school" },
  { value: "Grade 7", label: "Middle School — Grade 7", band: "middle_school" },
  { value: "Grade 8", label: "Middle School — Grade 8", band: "middle_school" },
  { value: "Grade 9", label: "High School — Grade 9", band: "high_school" },
  { value: "Grade 10", label: "High School — Grade 10", band: "high_school" },
  { value: "Grade 11", label: "High School — Grade 11", band: "high_school" },
  { value: "Grade 12", label: "High School — Grade 12", band: "high_school" },
  {
    value: "Post-secondary",
    label: "Post-secondary / College (coming soon)",
    band: "post_secondary",
    disabled: true,
  },
];

/** Just the selectable grade values (excludes disabled placeholders). */
export const US_GRADE_VALUES: string[] = US_GRADE_OPTIONS.filter((o) => !o.disabled).map(
  (o) => o.value,
);

// Normalized internal tokens used for matching against standards' grade fields.
// PK = Pre-K, K = Kindergarten, "1".."12" = grades.
export type GradeToken = "PK" | "K" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12";

const BAND_TOKENS: Record<GradeBand, GradeToken[]> = {
  early_childhood: ["PK"],
  elementary: ["K", "1", "2", "3", "4", "5"],
  middle_school: ["6", "7", "8"],
  high_school: ["9", "10", "11", "12"],
  post_secondary: [],
};

const TOKEN_ORDER: GradeToken[] = ["PK", "K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

function tokenToNum(t: GradeToken): number {
  if (t === "PK") return -1;
  if (t === "K") return 0;
  return parseInt(t, 10);
}

function numToToken(n: number): GradeToken | null {
  if (n === -1) return "PK";
  if (n === 0) return "K";
  if (n >= 1 && n <= 12) return String(n) as GradeToken;
  return null;
}

/**
 * Normalize a single grade label (US, international, or a band key) to one
 * canonical token, or null when it can't be mapped to the US numeric scale
 * (e.g. Nigerian "JSS 1", Senegalese "CE2" — those jurisdictions rely on the
 * static curriculum fallback which has no per-outcome codes anyway).
 */
export function normalizeGradeToken(raw: string | null | undefined): GradeToken | null {
  if (!raw) return null;
  const s = String(raw).toLowerCase().trim();
  if (!s) return null;

  // Pre-K / preschool / pre-kindergarten / nursery ("pre-k", "pre k", "pre_k")
  if (/pre[\s_-]?k(\b|$)/.test(s) || s.includes("preschool") || s.includes("pre-kindergarten") || s.includes("nursery")) {
    return "PK";
  }
  // Kindergarten variants (incl. pre-primary "grade r", "pp1/pp2", "kg")
  if (s === "k" || s === "kg" || s.includes("kinder") || s === "grade r" || s === "kg 1" || s === "kg 2" || s === "pp1" || s === "pp2") {
    return "K";
  }

  // Extract a 1-2 digit grade number (handles "grade 3", "3rd grade", "03",
  // "primary 3", "basic 3", "standard 3", plain "3").
  const m = s.match(/(\d{1,2})/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= 12) return String(n) as GradeToken;
    if (n === 0) return "K";
  }
  return null;
}

/**
 * Expand a set of chosen grade values (individual grades, band keys, or a mix —
 * as stored in user preferences) into the set of normalized tokens they cover.
 */
export function expandGradeSelectionToTokens(values: (string | null | undefined)[]): Set<GradeToken> {
  const out = new Set<GradeToken>();
  for (const v of values) {
    if (!v) continue;
    const key = String(v).toLowerCase().trim();
    if (key in BAND_TOKENS) {
      for (const t of BAND_TOKENS[key as GradeBand]) out.add(t);
      continue;
    }
    const tok = normalizeGradeToken(v);
    if (tok) out.add(tok);
  }
  return out;
}

/**
 * Parse a standard's grade field (which may be a single grade, a list, or a
 * range) into the full set of grades it covers.
 * Examples: "3" → {3}; "9-12" → {9,10,11,12}; "K-2" → {K,1,2}; "9,10" → {9,10}.
 * Returns an empty set when nothing parseable is found (caller treats empty as
 * "no grade info" and includes the standard).
 */
export function gradesCoveredByStandard(gradeLevelStr: string | null | undefined): Set<GradeToken> {
  const out = new Set<GradeToken>();
  if (!gradeLevelStr) return out;
  const raw = String(gradeLevelStr).trim();
  if (!raw) return out;

  // Split on list separators first (comma / semicolon / slash / "and").
  const parts = raw.split(/[,;/]|\band\b/i).map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    // Range like "9-12" or "K-2" (also "K–2" en-dash).
    const rangeMatch = part.match(/^(pre[\s-]?k|k|kg|\d{1,2})\s*[-–]\s*(pre[\s-]?k|k|kg|\d{1,2})$/i);
    if (rangeMatch) {
      const a = normalizeGradeToken(rangeMatch[1]);
      const b = normalizeGradeToken(rangeMatch[2]);
      if (a && b) {
        const lo = Math.min(tokenToNum(a), tokenToNum(b));
        const hi = Math.max(tokenToNum(a), tokenToNum(b));
        for (let n = lo; n <= hi; n++) {
          const t = numToToken(n);
          if (t) out.add(t);
        }
        continue;
      }
    }
    const tok = normalizeGradeToken(part);
    if (tok) out.add(tok);
  }
  return out;
}

/**
 * Does a standard (by its grade field) apply to any of the selected grade
 * tokens? Standards with no parseable grade info are treated as applying to all
 * grades (so legitimate ungraded standards are never hidden).
 */
export function standardMatchesGrades(
  standardGradeStr: string | null | undefined,
  selected: Set<GradeToken>,
): boolean {
  if (selected.size === 0) return true;
  const covered = gradesCoveredByStandard(standardGradeStr);
  if (covered.size === 0) return true;
  for (const t of Array.from(covered)) {
    if (selected.has(t)) return true;
  }
  return false;
}

export { TOKEN_ORDER };
