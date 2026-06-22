import { describe, it, expect } from "vitest";
import {
  mapOneRosterUser,
  mapOneRosterTeacher,
  mapOneRosterClass,
  mapOneRosterOrg,
} from "../services/sisService";

describe("OneRoster / ClassLink mappers", () => {
  describe("mapOneRosterUser", () => {
    it("maps a fully-populated student", () => {
      const result = mapOneRosterUser({
        sourcedId: "stu-1",
        givenName: "Ada",
        familyName: "Lovelace",
        email: "ada@example.edu",
        grades: ["09"],
        orgs: [{ sourcedId: "school-1" }],
        status: "active",
      });
      expect(result).toMatchObject({
        sisId: "stu-1",
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.edu",
        gradeLevel: "09",
        schoolId: "school-1",
        enrollmentStatus: "active",
      });
      expect(result.rawData).toBeDefined();
    });

    it("defaults missing names and status, tolerates missing grades/orgs", () => {
      const result = mapOneRosterUser({ sourcedId: "stu-2" });
      expect(result.sisId).toBe("stu-2");
      expect(result.firstName).toBe("");
      expect(result.lastName).toBe("");
      expect(result.gradeLevel).toBeUndefined();
      expect(result.schoolId).toBeUndefined();
      expect(result.enrollmentStatus).toBe("active");
    });
  });

  describe("mapOneRosterTeacher", () => {
    it("maps all org sourcedIds into schoolIds", () => {
      const result = mapOneRosterTeacher({
        sourcedId: "tea-1",
        givenName: "Alan",
        familyName: "Turing",
        email: "alan@example.edu",
        orgs: [{ sourcedId: "school-1" }, { sourcedId: "school-2" }],
      });
      expect(result.schoolIds).toEqual(["school-1", "school-2"]);
      expect(result.firstName).toBe("Alan");
    });

    it("returns an empty schoolIds array when orgs are missing", () => {
      const result = mapOneRosterTeacher({ sourcedId: "tea-2" });
      expect(result.schoolIds).toEqual([]);
    });
  });

  describe("mapOneRosterClass", () => {
    it("maps class fields and first subject/grade/term", () => {
      const result = mapOneRosterClass({
        sourcedId: "cls-1",
        title: "Algebra I",
        classCode: "ALG-1",
        subjects: ["Math"],
        grades: ["09"],
        school: { sourcedId: "school-1" },
        terms: [{ sourcedId: "term-1" }],
        status: "active",
      });
      expect(result).toMatchObject({
        sisId: "cls-1",
        name: "Algebra I",
        courseCode: "ALG-1",
        subject: "Math",
        gradeLevel: "09",
        schoolId: "school-1",
        term: "term-1",
        status: "active",
      });
    });

    it("defaults the name when title is missing", () => {
      const result = mapOneRosterClass({ sourcedId: "cls-2" });
      expect(result.name).toBe("Unnamed Class");
      expect(result.status).toBe("active");
    });
  });

  describe("mapOneRosterOrg", () => {
    it("maps org name and parent district id", () => {
      const result = mapOneRosterOrg({
        sourcedId: "school-1",
        name: "Lincoln High",
        parent: { sourcedId: "district-1" },
      });
      expect(result).toMatchObject({
        sisId: "school-1",
        name: "Lincoln High",
        districtId: "district-1",
      });
    });

    it("tolerates a missing parent", () => {
      const result = mapOneRosterOrg({ sourcedId: "school-2", name: "Solo School" });
      expect(result.districtId).toBeUndefined();
    });
  });
});
