// Pure, DB-agnostic logic for turning a jurisdiction's raw "standard sets"
// (rows of the standard_sets table) into the COURSES a teacher actually thinks
// in. This is the layer that sits between "Subject" and "Standard codes" in the
// picker cascade.
//
// The problem this solves: a single subject label (e.g. Texas "Social Studies
// (2020-)") hides many genuinely different courses (World Geography, US History,
// Government, Economics, Psychology, Ethnic Studies...). The old cascade
// collapsed the subject to ONE alphabetical winner, so Social Studies always
// showed Economics regardless of grade. Meanwhile Common-Core-style subjects
// split ONE course into per-grade pieces (sets literally titled "Grade 1",
// "Grades 9-10") and those must NOT explode into a dozen fake courses.
//
// The rule (agreed with the product owner):
//   - A set whose title is ONLY a grade label ("Grade 5", "Grades 9-10") is a
//     grade PIECE of the generic subject course -> all such pieces MERGE into a
//     single generic course (this is the Common Core / elementary case).
//   - A set whose title carries a real course name ("World Geography Studies")
//     is its OWN course.
//   - When the same named course appears in several versions (a clean DOE set +
//     a mis-tagged "crosswalk" copy, or an empty duplicate), keep the BEST
//     version and drop the rest.
//
// Kept framework-free so it can be unit-tested without a DB (see
// server/__tests__/course-grouping.test.ts) and reused server-side.

export interface CourseSetInput {
  id: string;
  title: string;
  educationLevels?: string[] | null;
  documentYear?: string | null;
  /** Higher = more trusted (official DOE > CSP backup > curated > fallback). */
  tierRank?: number;
  /** How many standard rows this set has. Empty sets are de-preferred. */
  standardsCount?: number;
}

export interface GroupedCourse {
  courseId: string;
  label: string;
  /** True for the merged grade-piece course (Common Core / elementary). */
  isGeneric: boolean;
  /** Member set ids. Generic = every grade piece; named = the single best set. */
  setIds: string[];
  /** Union of member sets' education levels (used for grade-aware filtering). */
  educationLevels: string[];
}

// --------------------------------------------------------------
// Title cleaning
// --------------------------------------------------------------

// Strips a leading legal section code such as "§113.42." or "113.42.".
function stripSectionCode(title: string): string {
  return title
    .replace(/^\s*§\s*[0-9]+(?:\.[0-9]+)*\.?\s*/, "")
    .replace(/^\s*[0-9]{2,4}(?:\.[0-9]+)+\.?\s+/, "");
}

// True when a parenthetical's inner text is only a year / year range, e.g.
// "2022", "2020-", "2010-2018".
function isYearParen(inner: string): boolean {
  return /^\s*(?:19|20)\d{2}\s*(?:[-–—]\s*(?:(?:19|20)\d{2})?\s*)?$/.test(inner);
}

/** Teacher-facing course name: no section code, no trailing year/grade noise. */
export function cleanCourseName(title: string): string {
  let t = stripSectionCode(String(title ?? "")).trim();
  // Repeatedly peel trailing parentheticals that are pure noise — a year range
  // ("(2022)", "(2010-2018)") or a grade span ("(Grades 9, 10, 11)").
  let prev: string;
  do {
    prev = t;
    // Trailing noise parenthetical: "(2022)", "(Grades 9, 10, 11)".
    t = t
      .replace(/\s*\(([^()]*)\)\s*$/, (m, inner: string) =>
        isYearParen(inner) || gradeTokensOnly(inner) ? "" : m,
      )
      .trim();
    // Trailing colon/semicolon grade tail: "...Economics (2022): Grades 11, 12".
    // Only stripped when the tail is purely grade indicators, so meaningful
    // sub-titles ("Ethnic Studies: African-American Studies") are preserved.
    t = t
      .replace(/\s*[:;]\s*([^:;]*)$/, (m, seg: string) =>
        gradeTokensOnly(seg) ? "" : m,
      )
      .trim();
  } while (t !== prev);
  return t.replace(/\s+/g, " ").trim();
}

/** Teacher-facing subject label: strips the trailing "(2020-)" style suffix. */
export function cleanSubjectLabel(subject: string): string {
  return cleanCourseName(subject) || String(subject ?? "").trim();
}

const GRADE_WORDS = new Set([
  "grade",
  "grades",
  "gr",
  "k",
  "kg",
  "kindergarten",
  "pre",
  "prek",
  "pre-k",
  "prekindergarten",
  "and",
  "to",
  "through",
  "thru",
]);

const GRADE_CONNECTORS = new Set(["and", "to", "through", "thru"]);

// Low-level: is this raw string made up ONLY of grade indicators? Splits on
// every non-alphanumeric char (so "9-10", "9, 10" and "Pre-K" all break into
// their pieces). Does NOT call cleanCourseName, so cleanCourseName can use it.
function gradeTokensOnly(str: string): boolean {
  const tokens = String(str ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  if (tokens.length === 0) return false;
  let sawGradeIndicator = false;
  for (const tok of tokens) {
    if (/^\d{1,2}$/.test(tok)) {
      const n = Number(tok);
      if (n > 12) return false;
      sawGradeIndicator = true;
      continue;
    }
    if (GRADE_WORDS.has(tok)) {
      if (!GRADE_CONNECTORS.has(tok)) sawGradeIndicator = true;
      continue;
    }
    return false; // any other word => names a real course
  }
  return sawGradeIndicator;
}

/**
 * True when, after removing section/year noise, the title is nothing but grade
 * indicators — e.g. "Grade 5", "Grades 9, 10", "Grades 9-10", "Grade Pre-K",
 * "Kindergarten". These are grade PIECES of one generic course, not distinct
 * courses. A title like "Grade 8 Science" is NOT grade-only (it names Science).
 */
export function isGradeOnlyTitle(title: string): boolean {
  const cleaned = cleanCourseName(title);
  if (!cleaned) return true;
  return gradeTokensOnly(cleaned);
}

/** URL/identifier-safe slug for a course label. */
export function courseSlug(name: string): string {
  return (
    String(name ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "course"
  );
}

// Normalized key for detecting "the same named course" across versions.
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function yearNum(y?: string | null): number {
  if (!y) return 0;
  const m = String(y).match(/(19|20)\d{2}/);
  return m ? Number(m[0]) : 0;
}

// Returns the better of two candidate sets for the SAME named course.
// Order: higher trust tier -> has standards -> newer year -> tighter grade
// span (de-prefers a K-12 "crosswalk" copy of a single-grade course) -> more
// standards -> stable id.
function preferSet(a: CourseSetInput, b: CourseSetInput): CourseSetInput {
  const at = a.tierRank ?? 0;
  const bt = b.tierRank ?? 0;
  if (at !== bt) return at > bt ? a : b;

  const aHas = (a.standardsCount ?? 0) > 0 ? 1 : 0;
  const bHas = (b.standardsCount ?? 0) > 0 ? 1 : 0;
  if (aHas !== bHas) return aHas > bHas ? a : b;

  const ay = yearNum(a.documentYear);
  const by = yearNum(b.documentYear);
  if (ay !== by) return ay > by ? a : b;

  const al = a.educationLevels?.length ?? 0;
  const bl = b.educationLevels?.length ?? 0;
  if (al !== bl && al > 0 && bl > 0) return al < bl ? a : b;

  const ac = a.standardsCount ?? 0;
  const bc = b.standardsCount ?? 0;
  if (ac !== bc) return ac > bc ? a : b;

  return a.id <= b.id ? a : b;
}

function unionLevels(sets: CourseSetInput[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of sets) {
    for (const lvl of s.educationLevels ?? []) {
      if (!seen.has(lvl)) {
        seen.add(lvl);
        out.push(lvl);
      }
    }
  }
  return out;
}

/**
 * Group a subject's standard sets into teacher-facing courses.
 *
 * @param sets         all standard sets belonging to ONE (jurisdiction, subject)
 * @param subjectLabel the raw subject string (e.g. "Social Studies (2020-)")
 */
export function groupSetsIntoCourses(
  sets: CourseSetInput[],
  subjectLabel: string,
): GroupedCourse[] {
  const genericSets: CourseSetInput[] = [];
  const namedGroups = new Map<string, { name: string; sets: CourseSetInput[] }>();

  for (const set of sets) {
    if (isGradeOnlyTitle(set.title)) {
      genericSets.push(set);
      continue;
    }
    const name = cleanCourseName(set.title);
    const key = normalizeName(name);
    if (!key) {
      genericSets.push(set);
      continue;
    }
    const group = namedGroups.get(key);
    if (group) group.sets.push(set);
    else namedGroups.set(key, { name, sets: [set] });
  }

  const hasNamed = namedGroups.size > 0;
  const courses: GroupedCourse[] = [];
  const usedSlugs = new Set<string>();
  const uniqueSlug = (base: string): string => {
    let slug = base;
    let i = 2;
    while (usedSlugs.has(slug)) slug = `${base}-${i++}`;
    usedSlugs.add(slug);
    return slug;
  };

  // Generic (merged grade-piece) course. If it is the ONLY course, label it
  // plainly as the subject; if named courses also exist, mark it "General" so a
  // teacher can tell the catch-all apart from the specific courses.
  if (genericSets.length > 0) {
    const base = cleanSubjectLabel(subjectLabel);
    const label = hasNamed ? `${base} (General)` : base;
    courses.push({
      courseId: uniqueSlug(courseSlug(hasNamed ? `${base}-general` : base)),
      label,
      isGeneric: true,
      setIds: genericSets.map((s) => s.id),
      educationLevels: unionLevels(genericSets),
    });
  }

  // Named courses: keep the single best version of each.
  const named = Array.from(namedGroups.values()).map(({ name, sets: grp }) => {
    const best = grp.reduce((acc, cur) => preferSet(acc, cur));
    return {
      courseId: uniqueSlug(courseSlug(name)),
      label: name,
      isGeneric: false,
      setIds: [best.id],
      educationLevels: [...(best.educationLevels ?? [])],
    } as GroupedCourse;
  });
  named.sort((a, b) => a.label.localeCompare(b.label));
  courses.push(...named);

  return courses;
}
