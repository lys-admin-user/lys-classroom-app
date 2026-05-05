import type { Express } from "express";
import { storage } from "../storage";
import { type User, selfDiscoveryResults, assignments } from "@shared/schema";
import { z } from "zod";
import { isAuthenticated } from "../replit_integrations/auth";
import multer from "multer";
import { db } from "../db";
import { eq, and, inArray } from "drizzle-orm";
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const saveLessonSchema = z.object({
  title: z.string().min(1),
  topic: z.string().min(1),
  gradeLevel: z.string().min(1),
  bkdFocus: z.string().min(1),
  standards: z.string().optional(),
  duration: z.string().min(1),
  objectives: z.array(z.string()),
  activities: z.array(z.object({
    title: z.string(),
    description: z.string(),
    duration: z.string(),
    type: z.string(),
  })),
  materials: z.array(z.string()),
  assessment: z.string(),
  reflection: z.string().optional(),
});

const createGoalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1),
  bkdPillar: z.enum(["be", "know", "do"]).optional().default("do"),
  linkedCareerId: z.string().optional(),
  targetDate: z.string().min(1, "Target date is required"),
  status: z.string().optional().default("not_started"),
  progress: z.number().optional().default(0),
  milestones: z.array(z.object({
    id: z.string().optional(),
    title: z.string(),
    completed: z.boolean(),
    dueDate: z.string().optional(),
    reflection: z.string().optional(),
  })).optional().default([]),
});

const manualSnapshotSchema = z.object({
  notes: z.string().max(500).optional(),
});

const updateGoalSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  bkdPillar: z.enum(["be", "know", "do"]).optional(),
  linkedCareerId: z.string().optional(),
  targetDate: z.string().optional(),
  status: z.string().optional(),
  progress: z.number().optional(),
  milestones: z.array(z.object({
    id: z.string().optional(),
    title: z.string(),
    completed: z.boolean(),
    dueDate: z.string().optional(),
    reflection: z.string().optional(),
  })).optional(),
});

const updatePreferencesSchema = z.object({
  language: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  jurisdictionId: z.string().optional(),
  standardSetId: z.string().optional(),
  needsAnalysis: z.object({
    primaryGoal: z.string().optional(),
    interests: z.array(z.string()).optional(),
    experienceLevel: z.string().optional(),
    recommendedFeatures: z.array(z.string()).optional(),
  }).optional(),
});

const completeOnboardingSchema = z.object({
  role: z.enum(["student", "educator", "staff", "campus_admin", "district_admin", "site_admin", "system_admin", "homeschool_parent"]).optional(),
  preferences: z.object({
    language: z.string().optional(),
    country: z.string().optional(),
    state: z.string().optional(),
    jurisdictionId: z.string().optional(),
    standardSetId: z.string().optional(),
    gradeLevels: z.array(z.string()).optional(),
    gradeBands: z.array(z.string()).optional(),
  }).optional(),
  needsAnalysis: z.object({
    primaryGoal: z.string(),
    interests: z.array(z.string()),
    experienceLevel: z.string().default("beginner"),
    recommendedFeatures: z.array(z.string()),
  }),
});

const updateRoleSchema = z.object({
  role: z.enum(["student", "educator", "staff", "homeschool_parent", "campus_admin", "district_admin", "site_admin", "system_admin"]),
});

async function syncScopeStandardsToProfile(scopeId: string, userId: string) {
  const units = await storage.getSequenceUnits(scopeId);
  const standardsMap = new Map<string, { code: string; description: string }>();
  for (const unit of units) {
    const codes = (unit.standardCodes as { code: string; description: string }[]) || [];
    for (const std of codes) {
      if (std.code && !standardsMap.has(std.code)) {
        standardsMap.set(std.code, { code: std.code, description: std.description || "" });
      }
    }
  }
  if (standardsMap.size > 0) {
    await storage.updateEducatorProfile(userId, {
      preferredStandardCodes: Array.from(standardsMap.values()),
    });
  }
}

function requireRole(...allowedRoles: string[]) {
  return async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }
      const dbUser = await storage.getUser(userId);
      const userRole = dbUser?.role || "student";
      if (!allowedRoles.includes(userRole)) {
        res.status(403).json({ error: "Insufficient permissions for this action" });
        return;
      }
      next();
    } catch {
      res.status(500).json({ error: "Failed to verify permissions" });
    }
  };
}

const requireCampusAdmin = requireRole("campus_admin", "district_admin", "site_admin", "system_admin");
const requireDistrictAdmin = requireRole("district_admin", "site_admin", "system_admin");
const requireSiteAdmin = requireRole("site_admin", "system_admin");
const requireSystemAdmin = requireRole("system_admin");

import { ANALYZER_CTAS, ANALYZER_IDENTITIES, ANALYZER_SESSION_REGEX, ANALYZER_URGENCIES, APPROVED_VIDEO_HOSTS, MAX_TRIALS_PER_IP, TRIAL_DURATION_DAYS, TRIAL_RESET_MONTHS, US_STATES, analyzerBindSchema, analyzerCtaClickSchema, analyzerSubmitSchema, autoMatchSchema, createJourneyEntrySchema, createSisConnectionSchema, educatorProfileSchema, entityShareBodySchema, entriesQuerySchema, foundationModuleUpdateSchema, foundationProgressBodySchema, foundationQuizQuestionSchema, generateInviteCode, getAdminManagedOrgIds, getAdminOrgIds, getStateNameFromAbbr, getTrialSinceDate, isApprovedVideoUrl, isSiteAdmin, pillarParamSchema, requireFoundationAdmin, requirePaidTier, requireRssAdmin, requireSiteAdminForStandards, requireStaffOrAdmin, validOrgTypes, verifyOrgAdminAccess, videoUrlSchema } from "./_helpers";

// AUTO-SPLIT from server/routes.ts -- domain: classroom (35 routes)
export function registerClassroomRoutes(app: Express): void {


  // Class BKD Insights for educators — aggregate + per-student breakdown
  app.get("/api/class/bkd-insights", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const userRole = req.user?.claims?.role || "";
      const educatorRoles = ["educator", "campus_admin", "district_admin", "site_admin", "system_admin"];
      if (!educatorRoles.includes(userRole)) {
        return res.status(403).json({ error: "Only educators can view class BKD insights" });
      }

      // Collect all students linked to this educator's classes
      const educatorClasses = await storage.getClasses(userId);
      if (educatorClasses.length === 0) return res.json({ classes: [], aggregate: null });

      const { classStudents, students, selfDiscoveryResults } = await import("@shared/schema");
      const { eq, inArray } = await import("drizzle-orm");
      const { db } = await import("../db");

      const classIds = educatorClasses.map(c => c.id);

      // Get all enrolled student records
      const enrollments = await db.select().from(classStudents)
        .where(inArray(classStudents.classId, classIds));
      const studentIds = Array.from(new Set(enrollments.map(e => e.studentId)));

      if (studentIds.length === 0) return res.json({ classes: educatorClasses, students: [], aggregate: null });

      // Get student profiles
      const studentProfiles = studentIds.length > 0
        ? await db.select().from(students).where(inArray(students.id, studentIds))
        : [];

      // Get self-discovery results for students (use userId on students table)
      const studentUserIds = studentProfiles.map(s => s.userId);
      const assessments = studentUserIds.length > 0
        ? await db.select().from(selfDiscoveryResults)
            .where(inArray(selfDiscoveryResults.userId, studentUserIds))
        : [];

      // Build per-student data — latest assessment only per student
      const latestByUser: Record<string, any> = {};
      for (const a of assessments) {
        if (!latestByUser[a.userId] || new Date(a.createdAt!) > new Date(latestByUser[a.userId].createdAt)) {
          latestByUser[a.userId] = a;
        }
      }

      const studentData = studentProfiles.map(s => {
        const assessment = latestByUser[s.userId] || null;
        return {
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          gradeLevel: s.gradeLevel,
          classIds: enrollments.filter(e => e.studentId === s.id).map(e => e.classId),
          hasAssessment: !!assessment,
          beScore: assessment?.beScore ?? null,
          knowScore: assessment?.knowScore ?? null,
          doScore: assessment?.doScore ?? null,
          totalScore: assessment?.totalScore ?? null,
          strengths: assessment?.strengths ?? [],
          growthAreas: assessment?.growthAreas ?? [],
          assessedAt: assessment?.createdAt ?? null,
        };
      });

      // Build class-level aggregate
      const assessed = studentData.filter(s => s.hasAssessment);
      const aggregate = assessed.length > 0 ? {
        totalStudents: studentData.length,
        studentsAssessed: assessed.length,
        avgBe: Math.round(assessed.reduce((sum, s) => sum + (s.beScore ?? 0), 0) / assessed.length),
        avgKnow: Math.round(assessed.reduce((sum, s) => sum + (s.knowScore ?? 0), 0) / assessed.length),
        avgDo: Math.round(assessed.reduce((sum, s) => sum + (s.doScore ?? 0), 0) / assessed.length),
        lowBe: assessed.filter(s => (s.beScore ?? 0) < 50).length,
        lowKnow: assessed.filter(s => (s.knowScore ?? 0) < 50).length,
        lowDo: assessed.filter(s => (s.doScore ?? 0) < 50).length,
      } : null;

      // Per-class breakdown
      const classSummaries = educatorClasses.map(cls => {
        const classStudentIds = enrollments.filter(e => e.classId === cls.id).map(e => e.studentId);
        const classStudentData = studentData.filter(s => classStudentIds.includes(s.id));
        const classAssessed = classStudentData.filter(s => s.hasAssessment);
        return {
          classId: cls.id,
          className: cls.name,
          period: cls.period,
          totalStudents: classStudentData.length,
          studentsAssessed: classAssessed.length,
          avgBe: classAssessed.length ? Math.round(classAssessed.reduce((sum, s) => sum + (s.beScore ?? 0), 0) / classAssessed.length) : null,
          avgKnow: classAssessed.length ? Math.round(classAssessed.reduce((sum, s) => sum + (s.knowScore ?? 0), 0) / classAssessed.length) : null,
          avgDo: classAssessed.length ? Math.round(classAssessed.reduce((sum, s) => sum + (s.doScore ?? 0), 0) / classAssessed.length) : null,
        };
      });

      res.json({ classes: classSummaries, students: studentData, aggregate });
    } catch (error) {
      console.error("Class BKD insights error:", error);
      res.status(500).json({ error: "Failed to fetch class BKD insights" });
    }
  });


  // Get assignments for a specific class
  app.get("/api/classes/:classId/assignments", isAuthenticated, async (req: any, res) => {
    try {
      const { classId } = req.params;
      const assignmentsList = await storage.getAssignmentsByClass(classId);
      res.json(assignmentsList);
    } catch (error) {
      console.error("Error fetching class assignments:", error);
      res.status(500).json({ error: "Failed to fetch class assignments" });
    }
  });


  // ================================
  // Gradebook Routes
  // ================================

  // Get grade categories for a class
  app.get("/api/classes/:classId/grade-categories", isAuthenticated, async (req: any, res) => {
    try {
      const { classId } = req.params;
      const categoriesList = await storage.getGradeCategories(classId);
      res.json(categoriesList);
    } catch (error) {
      console.error("Error fetching grade categories:", error);
      res.status(500).json({ error: "Failed to fetch grade categories" });
    }
  });


  // Create grade category
  app.post("/api/grade-categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const category = await storage.createGradeCategory({ ...req.body, userId });
      res.json(category);
    } catch (error) {
      console.error("Error creating grade category:", error);
      res.status(500).json({ error: "Failed to create grade category" });
    }
  });


  // Update grade category
  app.patch("/api/grade-categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const updated = await storage.updateGradeCategory(id, req.body, userId);
      if (!updated) {
        res.status(404).json({ error: "Category not found or not authorized" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update category" });
    }
  });


  // Delete grade category
  app.delete("/api/grade-categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const deleted = await storage.deleteGradeCategory(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Category not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });


  // Get grades for a class
  app.get("/api/classes/:classId/grades", isAuthenticated, async (req: any, res) => {
    try {
      const { classId } = req.params;
      const gradesList = await storage.getStudentGrades(classId);
      res.json(gradesList);
    } catch (error) {
      console.error("Error fetching grades:", error);
      res.status(500).json({ error: "Failed to fetch grades" });
    }
  });


  // Create grade entry
  app.post("/api/grades", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const grade = await storage.createStudentGrade({ ...req.body, userId });
      res.json(grade);
    } catch (error) {
      console.error("Error creating grade:", error);
      res.status(500).json({ error: "Failed to create grade" });
    }
  });


  // Update grade entry
  app.patch("/api/grades/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const updated = await storage.updateStudentGrade(id, req.body, userId);
      if (!updated) {
        res.status(404).json({ error: "Grade not found or not authorized" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update grade" });
    }
  });


  // Bulk update grades
  app.post("/api/grades/bulk-update", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { grades } = req.body;
      if (!grades || !Array.isArray(grades)) {
        res.status(400).json({ error: "Grades array is required" });
        return;
      }
      const updated = await storage.bulkUpdateStudentGrades(grades, userId);
      res.json(updated);
    } catch (error) {
      console.error("Error bulk updating grades:", error);
      res.status(500).json({ error: "Failed to bulk update grades" });
    }
  });


  // Delete grade entry
  app.delete("/api/grades/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const deleted = await storage.deleteStudentGrade(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Grade not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete grade" });
    }
  });


  // Export grades as CSV
  app.get("/api/classes/:classId/grades/export", isAuthenticated, async (req: any, res) => {
    try {
      const { classId } = req.params;
      const classData = await storage.getClass(classId);
      if (!classData) {
        res.status(404).json({ error: "Class not found" });
        return;
      }

      const gradesList = await storage.getStudentGrades(classId);
      const classStudentsList = await storage.getClassStudents(classId);
      const studentIds = classStudentsList.map(cs => cs.studentId);
      const studentsList = await storage.getStudents(classData.userId);
      const studentsInClass = studentsList.filter(s => studentIds.includes(s.id));

      // Build CSV
      let csv = "Student ID,First Name,Last Name,Assignment,Points Earned,Points Possible,Percentage,Letter Grade,Comments,Graded Date\n";
      for (const grade of gradesList) {
        const student = studentsInClass.find(s => s.id === grade.studentId);
        if (student) {
          csv += `"${student.studentId || ""}","${student.firstName}","${student.lastName}","${grade.title}",${grade.pointsEarned ?? ""},${grade.pointsPossible},${grade.percentage ?? ""},${grade.letterGrade ?? ""},"${grade.comments || ""}","${grade.gradedAt?.toISOString() || ""}"\n`;
        }
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${classData.name}_grades.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("Error exporting grades:", error);
      res.status(500).json({ error: "Failed to export grades" });
    }
  });


  // Get grading periods
  app.get("/api/grading-periods", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const periods = await storage.getGradingPeriods(userId);
      res.json(periods);
    } catch (error) {
      console.error("Error fetching grading periods:", error);
      res.status(500).json({ error: "Failed to fetch grading periods" });
    }
  });


  // Create grading period
  app.post("/api/grading-periods", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const period = await storage.createGradingPeriod({ ...req.body, userId });
      res.json(period);
    } catch (error) {
      console.error("Error creating grading period:", error);
      res.status(500).json({ error: "Failed to create grading period" });
    }
  });


  // Update grading period
  app.patch("/api/grading-periods/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const updated = await storage.updateGradingPeriod(id, req.body, userId);
      if (!updated) {
        res.status(404).json({ error: "Period not found or not authorized" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update period" });
    }
  });


  // Delete grading period
  app.delete("/api/grading-periods/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const deleted = await storage.deleteGradingPeriod(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Period not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete period" });
    }
  });


  // ================================
  // Student Transfer Request Routes
  // ================================

  // Create a new transfer request
  app.post("/api/transfers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { studentId, transferType, targetEducatorId, targetOrganizationId, reason, notes } = req.body;

      if (!studentId || !transferType) {
        res.status(400).json({ error: "Student ID and transfer type are required" });
        return;
      }

      // Get the student to find current organization
      const student = await storage.getStudent(studentId);
      if (!student) {
        res.status(404).json({ error: "Student not found" });
        return;
      }

      const request = await storage.createTransferRequest({
        studentId,
        transferType,
        sourceEducatorId: userId,
        sourceOrganizationId: student.organizationId || undefined,
        targetEducatorId,
        targetOrganizationId,
        requestedBy: userId,
        reason,
        notes,
        status: "pending_campus"
      });

      res.json(request);
    } catch (error) {
      console.error("Error creating transfer request:", error);
      res.status(500).json({ error: "Failed to create transfer request" });
    }
  });


  // Get transfer requests for a student
  app.get("/api/transfers/student/:studentId", isAuthenticated, async (req: any, res) => {
    try {
      const { studentId } = req.params;
      const requests = await storage.getTransferRequestsByStudent(studentId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching transfer requests:", error);
      res.status(500).json({ error: "Failed to fetch transfer requests" });
    }
  });


  // Get pending transfer requests for a specific approval level
  app.get("/api/transfers/pending/:level", isAuthenticated, async (req: any, res) => {
    try {
      const { level } = req.params;
      const user = req.user?.claims;
      
      // Verify user has appropriate role for this level
      const dbUser = await storage.getUser(user.sub);
      if (!dbUser) {
        res.status(401).json({ error: "User not found" });
        return;
      }

      const validLevels = ["campus", "district", "system_admin"];
      if (!validLevels.includes(level)) {
        res.status(400).json({ error: "Invalid approval level" });
        return;
      }

      // Check role permissions
      if (level === "system_admin" && dbUser.role !== "site_admin") {
        res.status(403).json({ error: "Only system admins can view system admin pending transfers" });
        return;
      }
      if (level === "district" && !["district_admin", "site_admin"].includes(dbUser.role || "")) {
        res.status(403).json({ error: "Only district admins can view district pending transfers" });
        return;
      }
      if (level === "campus" && !["campus_admin", "district_admin", "site_admin"].includes(dbUser.role || "")) {
        res.status(403).json({ error: "Only campus admins can view campus pending transfers" });
        return;
      }

      const requests = await storage.getPendingTransferRequests(level as any);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending transfers:", error);
      res.status(500).json({ error: "Failed to fetch pending transfers" });
    }
  });


  // Approve a transfer request at a specific level
  app.post("/api/transfers/:id/approve", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      const dbUser = await storage.getUser(userId);
      
      if (!dbUser) {
        res.status(401).json({ error: "User not found" });
        return;
      }

      const request = await storage.getTransferRequest(id);
      if (!request) {
        res.status(404).json({ error: "Transfer request not found" });
        return;
      }

      // Determine required level based on current status
      let requiredRole: string[] = [];
      let approvalLevel: "campus" | "district" | "system_admin" | null = null;
      
      if (request.status === "pending_campus") {
        requiredRole = ["campus_admin", "district_admin", "site_admin"];
        approvalLevel = "campus";
      } else if (request.status === "pending_district") {
        requiredRole = ["district_admin", "site_admin"];
        approvalLevel = "district";
      } else if (request.status === "pending_system_admin") {
        requiredRole = ["site_admin"];
        approvalLevel = "system_admin";
      } else {
        res.status(400).json({ error: "Transfer request is not pending approval" });
        return;
      }

      if (!requiredRole.includes(dbUser.role || "")) {
        res.status(403).json({ error: `Only ${requiredRole.join(" or ")} can approve at this level` });
        return;
      }

      const updated = await storage.approveTransferAtLevel(id, approvalLevel, userId);
      
      // If fully approved, execute the transfer
      if (updated?.status === "approved") {
        await storage.executeTransfer(id);
      }

      res.json(updated);
    } catch (error) {
      console.error("Error approving transfer:", error);
      res.status(500).json({ error: "Failed to approve transfer" });
    }
  });


  // Reject a transfer request
  app.post("/api/transfers/:id/reject", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user?.claims?.sub;
      const dbUser = await storage.getUser(userId);
      
      if (!dbUser) {
        res.status(401).json({ error: "User not found" });
        return;
      }

      const request = await storage.getTransferRequest(id);
      if (!request) {
        res.status(404).json({ error: "Transfer request not found" });
        return;
      }

      // Determine level based on current status
      let level: "campus" | "district" | "system_admin" | null = null;
      let requiredRole: string[] = [];
      
      if (request.status === "pending_campus") {
        level = "campus";
        requiredRole = ["campus_admin", "district_admin", "site_admin"];
      } else if (request.status === "pending_district") {
        level = "district";
        requiredRole = ["district_admin", "site_admin"];
      } else if (request.status === "pending_system_admin") {
        level = "system_admin";
        requiredRole = ["site_admin"];
      } else {
        res.status(400).json({ error: "Transfer request cannot be rejected" });
        return;
      }

      if (!requiredRole.includes(dbUser.role || "")) {
        res.status(403).json({ error: `Only ${requiredRole.join(" or ")} can reject at this level` });
        return;
      }

      const updated = await storage.rejectTransfer(id, level, userId, reason || "No reason provided");
      res.json(updated);
    } catch (error) {
      console.error("Error rejecting transfer:", error);
      res.status(500).json({ error: "Failed to reject transfer" });
    }
  });


  // Cancel a transfer request (by the original requester)
  app.post("/api/transfers/:id/cancel", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;

      const request = await storage.getTransferRequest(id);
      if (!request) {
        res.status(404).json({ error: "Transfer request not found" });
        return;
      }

      // Only the original requester can cancel
      if (request.requestedBy !== userId) {
        res.status(403).json({ error: "Only the original requester can cancel this transfer" });
        return;
      }

      // Can only cancel if not yet approved or rejected
      if (["approved", "rejected", "cancelled"].includes(request.status)) {
        res.status(400).json({ error: "Transfer request cannot be cancelled" });
        return;
      }

      const updated = await storage.cancelTransferRequest(id);
      res.json(updated);
    } catch (error) {
      console.error("Error cancelling transfer:", error);
      res.status(500).json({ error: "Failed to cancel transfer" });
    }
  });


  // Classes management
  app.get("/api/classes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const classesList = await storage.getClasses(userId);
      res.json(classesList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch classes" });
    }
  });


  app.post("/api/classes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const newClass = await storage.createClass({
        ...req.body,
        userId,
      });
      res.json(newClass);
    } catch (error) {
      res.status(500).json({ error: "Failed to create class" });
    }
  });


  app.patch("/api/classes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const updated = await storage.updateClass(id, req.body, userId);
      if (!updated) {
        res.status(404).json({ error: "Class not found or not authorized" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update class" });
    }
  });


  app.delete("/api/classes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const deleted = await storage.deleteClass(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Class not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete class" });
    }
  });


  // Class-student enrollment
  app.get("/api/classes/:id/students", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const studentsList = await storage.getClassStudents(id);
      res.json(studentsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch class students" });
    }
  });


  app.post("/api/classes/:id/students", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { studentId } = req.body;
      const enrollment = await storage.addStudentToClass(id, studentId);
      res.json(enrollment);
    } catch (error: any) {
      if (error.message?.includes("maximum capacity")) {
        res.status(400).json({ error: error.message, code: "CLASS_FULL" });
      } else {
        res.status(500).json({ error: "Failed to add student to class" });
      }
    }
  });


  app.delete("/api/classes/:classId/students/:studentId", isAuthenticated, async (req: any, res) => {
    try {
      const { classId, studentId } = req.params;
      await storage.removeStudentFromClass(classId, studentId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove student from class" });
    }
  });


  app.get("/api/classes/:classId/notes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { classId } = req.params;
      const notes = await storage.getStudentNotesByClass(classId, userId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch class notes" });
    }
  });


  // Attendance Records
  app.get("/api/classes/:classId/attendance", isAuthenticated, async (req: any, res) => {
    try {
      const { classId } = req.params;
      const { date } = req.query;
      const attendanceDate = date ? new Date(date as string) : new Date();
      const records = await storage.getAttendanceByClass(classId, attendanceDate);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attendance" });
    }
  });


  app.post("/api/classes/:classId/attendance", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { classId } = req.params;
      const record = await storage.createAttendanceRecord({
        ...req.body,
        classId,
        recordedBy: userId,
      });
      res.json(record);
    } catch (error) {
      res.status(500).json({ error: "Failed to create attendance record" });
    }
  });


  app.post("/api/classes/:classId/attendance/bulk", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { classId } = req.params;
      const { records } = req.body;
      const attendanceRecords = records.map((r: any) => ({
        ...r,
        classId,
        recordedBy: userId,
      }));
      const created = await storage.bulkCreateAttendance(attendanceRecords);
      res.json(created);
    } catch (error) {
      res.status(500).json({ error: "Failed to create bulk attendance" });
    }
  });


  app.patch("/api/attendance/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const record = await storage.updateAttendanceRecord(id, req.body);
      if (!record) {
        res.status(404).json({ error: "Attendance record not found" });
        return;
      }
      res.json(record);
    } catch (error) {
      res.status(500).json({ error: "Failed to update attendance record" });
    }
  });


  // Enroll a student in a class with validation
  app.post("/api/classes/:classId/enroll", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { classId } = req.params;
      const { studentId } = req.body;
      
      if (!studentId) {
        res.status(400).json({ error: "studentId is required" });
        return;
      }

      // Validate enrollment
      const validation = await storage.validateEnrollment(studentId, classId);
      if (!validation.valid) {
        res.status(400).json({ error: validation.reason });
        return;
      }

      // Check if already enrolled
      const existing = await storage.getClassStudent(classId, studentId);
      if (existing) {
        res.status(400).json({ error: "Student is already enrolled in this class" });
        return;
      }

      // Enroll the student
      const enrollment = await storage.enrollStudent({
        classId,
        studentId,
        enrolledBy: userId,
        status: "enrolled"
      });

      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Error enrolling student:", error);
      res.status(500).json({ error: "Failed to enroll student" });
    }
  });
}
