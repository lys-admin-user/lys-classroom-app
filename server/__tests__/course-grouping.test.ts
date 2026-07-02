import { describe, it, expect } from "vitest";
import {
  cleanCourseName,
  cleanSubjectLabel,
  isGradeOnlyTitle,
  courseSlug,
  groupSetsIntoCourses,
  type CourseSetInput,
} from "@shared/courseGrouping";

describe("cleanCourseName", () => {
  it("strips leading legal section codes", () => {
    expect(cleanCourseName("§113.42. World History Studies")).toBe("World History Studies");
    expect(cleanCourseName("113.42. World History Studies")).toBe("World History Studies");
  });
  it("strips trailing year / year-range suffixes", () => {
    expect(cleanCourseName("World Geography Studies (2022)")).toBe("World Geography Studies");
    expect(cleanCourseName("Economics (2010-2018)")).toBe("Economics");
    expect(cleanCourseName("Social Studies (2020-)")).toBe("Social Studies");
  });
  it("collapses the § code AND the year together", () => {
    expect(cleanCourseName("§118.3. Personal Financial Literacy (2024)")).toBe(
      "Personal Financial Literacy",
    );
  });
  it("strips a trailing colon-delimited grade tail but keeps real sub-titles", () => {
    expect(
      cleanCourseName("Personal Financial Literacy & Economics (2022): Grades 11, 12"),
    ).toBe("Personal Financial Literacy & Economics");
    expect(cleanCourseName("Ethnic Studies (2020): African-American Studies")).toBe(
      "Ethnic Studies (2020): African-American Studies",
    );
  });
});

describe("cleanSubjectLabel", () => {
  it("drops the year suffix but keeps CTE-style labels intact", () => {
    expect(cleanSubjectLabel("Social Studies (2020-)")).toBe("Social Studies");
    expect(cleanSubjectLabel("CTE: Agriculture, Food & Natural Resources")).toBe(
      "CTE: Agriculture, Food & Natural Resources",
    );
  });
});

describe("isGradeOnlyTitle", () => {
  it("treats pure grade labels as grade pieces", () => {
    for (const t of ["Grade 1", "Grade K", "Grade Pre-K", "Grades 9-10", "Grades 9, 10", "Grades 11, 12", "Kindergarten"]) {
      expect(isGradeOnlyTitle(t)).toBe(true);
    }
  });
  it("treats real course names as NOT grade-only", () => {
    for (const t of ["World Geography Studies (2022)", "§113.42. World History Studies", "Economics", "Grade 8 Science"]) {
      expect(isGradeOnlyTitle(t)).toBe(false);
    }
  });
});

describe("courseSlug", () => {
  it("produces a stable url-safe slug", () => {
    expect(courseSlug("United States History Studies Since 1877")).toBe(
      "united-states-history-studies-since-1877",
    );
    expect(courseSlug("")).toBe("course");
  });
});

describe("groupSetsIntoCourses", () => {
  it("splits a Texas-style Social Studies umbrella into real courses + a general bucket", () => {
    const sets: CourseSetInput[] = [
      { id: "k", title: "Grade K (2022)", educationLevels: ["K"], tierRank: 3, standardsCount: 20 },
      { id: "g1", title: "Grade 1 (2022)", educationLevels: ["01"], tierRank: 3, standardsCount: 20 },
      { id: "wg", title: "World Geography Studies (2022)", educationLevels: ["09", "10", "11", "12"], tierRank: 3, standardsCount: 50 },
      { id: "ush", title: "United States History Studies Since 1877 (2022)", educationLevels: ["09", "10", "11", "12"], tierRank: 3, standardsCount: 60 },
      { id: "econ", title: "§113.31. Economics (2022)", educationLevels: ["12"], tierRank: 3, standardsCount: 40 },
    ];
    const courses = groupSetsIntoCourses(sets, "Social Studies (2020-)");
    const generic = courses.find((c) => c.isGeneric)!;
    expect(generic).toBeTruthy();
    expect(generic.label).toBe("Social Studies (General)");
    expect(generic.setIds.sort()).toEqual(["g1", "k"]);
    expect(new Set(generic.educationLevels)).toEqual(new Set(["K", "01"]));

    const named = courses.filter((c) => !c.isGeneric).map((c) => c.label);
    expect(named).toEqual([
      "Economics",
      "United States History Studies Since 1877",
      "World Geography Studies",
    ]);
  });

  it("MERGES a Common-Core-style subject (per-grade pieces) into ONE course", () => {
    const sets: CourseSetInput[] = [
      { id: "g1", title: "Grade 1", educationLevels: ["01"], tierRank: 2, standardsCount: 100 },
      { id: "g2", title: "Grade 2", educationLevels: ["02"], tierRank: 2, standardsCount: 100 },
      { id: "g910", title: "Grades 9-10", educationLevels: ["09", "10"], tierRank: 2, standardsCount: 80 },
      { id: "g1112", title: "Grades 11, 12", educationLevels: ["11", "12"], tierRank: 2, standardsCount: 80 },
    ];
    const courses = groupSetsIntoCourses(sets, "English/Language Arts - Common Core (2010-2017)");
    expect(courses).toHaveLength(1);
    expect(courses[0].isGeneric).toBe(true);
    // Only one course => plain subject label, no "(General)" suffix.
    expect(courses[0].label).toBe("English/Language Arts - Common Core");
    expect(courses[0].setIds).toHaveLength(4);
  });

  it("keeps the BEST version of a duplicated named course (drops a mis-tagged crosswalk)", () => {
    const sets: CourseSetInput[] = [
      // Clean 2022 grade-12 set.
      { id: "clean", title: "§113.31. Economics with Emphasis on the Free Enterprise System and Its Benefits (2022)", educationLevels: ["12"], documentYear: "2022", tierRank: 3, standardsCount: 93 },
      // Mis-tagged crosswalk copy claiming all of K-12, no year.
      { id: "crosswalk", title: "Economics with Emphasis on the Free Enterprise System and it's Benefits", educationLevels: ["K", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"], documentYear: null, tierRank: 3, standardsCount: 96 },
    ];
    const courses = groupSetsIntoCourses(sets, "Social Studies (2020-)");
    expect(courses).toHaveLength(1);
    expect(courses[0].isGeneric).toBe(false);
    expect(courses[0].setIds).toEqual(["clean"]);
    expect(courses[0].educationLevels).toEqual(["12"]);
  });

  it("de-prefers an empty duplicate set", () => {
    const sets: CourseSetInput[] = [
      { id: "empty", title: "Economics (Grades 9, 10, 11)", educationLevels: ["09", "10", "11"], tierRank: 3, standardsCount: 0 },
      { id: "full", title: "Economics", educationLevels: ["12"], tierRank: 3, standardsCount: 40 },
    ];
    const courses = groupSetsIntoCourses(sets, "Social Studies (2020-)");
    expect(courses).toHaveLength(1);
    expect(courses[0].setIds).toEqual(["full"]);
  });

  it("gives every course a unique id even when labels collide", () => {
    const sets: CourseSetInput[] = [
      { id: "a", title: "Art", educationLevels: ["09"], tierRank: 1, standardsCount: 5 },
      { id: "b", title: "Art!", educationLevels: ["10"], tierRank: 1, standardsCount: 5 },
    ];
    const courses = groupSetsIntoCourses(sets, "Fine Arts");
    const ids = courses.map((c) => c.courseId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
