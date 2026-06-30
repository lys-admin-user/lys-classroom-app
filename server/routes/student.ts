import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "../storage";
import { generateLessonPlan } from "../openai";
import { detectAfricanCountryFromText } from "@shared/africaContext";
import { calculateLessonQualityScore, getQualityLevel } from "../lessonQualityScorer";
import { parseDocument } from "../documentParser";
import { 
  generateLessonRequestSchema, 
  insertScopeSequenceSchema, 
  insertSequenceUnitSchema, 
  insertScopeChangeRequestSchema, 
  insertKnowResourceSchema,
  users,
  sessions,
  lessonPlanCache,
  insertFeatureFlagSchema, 
  insertEmailTemplateSchema, 
  insertStudentJourneyEntrySchema,
  type Lesson, 
  type Goal,
  type User,
  type UserRole,
  lessons,
  goals,
  educatorProfiles,
  userPreferences,
  educatorAffiliates,
  referralEvents,
  standardsJurisdictions,
  authorities as authoritiesTable,
  pricingTiers,
  lessonGenerations,
  selfDiscoveryResults,
  studentJourneyEntries,
  studentJourneyProgress,
  savedCareers,
  scopeSequences,
  assignments,
  contentReviewQueue as contentReviewQueueTable,
  parentalConsents as parentalConsentsTable,
  auditLogs as auditLogsTable,
  successMarks as successMarksTable,
  safetyVault as safetyVaultTable,
  fraudStrikes as fraudStrikesTable,
  userDataRegions as userDataRegionsTable,
  organizationMemberships as orgMembershipsTable,
  freeTrials,
  guestLessonGenerations,
  needsAnalyzerResponses,
  hasRolePrivilege,
  scholarshipApplications,
  knowResources,
  scholarshipSyncLog,
  savedScholarships,
} from "@shared/schema";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "../replit_integrations/auth";
import { randomUUID } from "crypto";
import multer from "multer";
import { syncJurisdictionsFromCSP, syncStandardSetFromCSP, getSyncStatus, fetchCSPJurisdictions, syncAllStandardsFromCSP, getImportProgress } from "../services/cspService";
import { extractStandardsFromText, processPdfImport, checkSourceForChanges } from "../services/llmExtractionService";
import { syncBlsData, getLastSyncStatus, getSyncHistory, startBlsScheduler, getSchedulerStatus } from "../services/blsService";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault, isPayPalConfigured } from "../paypal";
import { getUncachableStripeClient } from "../stripeClient";
import * as hubspotService from "../services/hubspotService";
import * as wordpressService from "../services/wordpressService";
import { fetchAndProcessFeed, fetchAllActiveFeeds, startRssFeedScheduler } from "../services/rssFeedService";
import { startScholarshipScheduler, runScholarshipSync, detectSeasonFromDeadline } from "../services/scholarshipService";
import { insertRssFeedSchema } from "@shared/schema";
import type { Student } from "@shared/schema";
import { db } from "../db";
import { logAuditEvent, getAuditLogs, getClientIP } from "../services/auditLog";
import { filterChatMessage } from "../services/contentFilter";
import { eq, desc, and, sql as drizzleSql, count, inArray, lte, gte } from "drizzle-orm";

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
const requireTeacher = requireRole("homeschool_parent", "educator", "staff", "campus_admin", "district_admin", "site_admin", "system_admin");

// Authorize access to a single student's sensitive records (grades, matriculation).
// A logged-in user may only read a student record if they are: the record owner
// (the student's own login or the educator who owns it), an admin/owner over the
// student's organization sub-tree, or a platform (site/system) admin. Any other
// authenticated user is denied and the denial is audited. Returns the student on
// success, or null after writing the appropriate 401/403/404 response.
async function ensureStudentRecordAccess(
  req: any,
  res: any,
  studentId: string,
): Promise<Student | null> {
  const userId = req.user?.claims?.sub;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  const student = await storage.getStudent(studentId);
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return null;
  }
  const isPlatformAdmin = await storage.isSiteAdmin(userId);
  const allowed =
    isPlatformAdmin ||
    student.userId === userId ||
    (!!student.organizationId && (await verifyOrgAdminAccess(userId, student.organizationId)));
  if (!allowed) {
    await logAuditEvent({
      userId,
      action: "student_record.access_denied",
      category: "security",
      severity: "warning",
      resourceType: "student",
      resourceId: studentId,
      ipAddress: getClientIP(req),
      userAgent: req.get("user-agent"),
    });
    res.status(403).json({ error: "You are not authorized to view this student's records" });
    return null;
  }
  return student;
}

import { ANALYZER_CTAS, ANALYZER_IDENTITIES, ANALYZER_SESSION_REGEX, ANALYZER_URGENCIES, APPROVED_VIDEO_HOSTS, MAX_TRIALS_PER_IP, TRIAL_DURATION_DAYS, TRIAL_RESET_MONTHS, US_STATES, analyzerBindSchema, analyzerCtaClickSchema, analyzerSubmitSchema, autoMatchSchema, createJourneyEntrySchema, createSisConnectionSchema, educatorProfileSchema, entityShareBodySchema, entriesQuerySchema, foundationModuleUpdateSchema, foundationProgressBodySchema, foundationQuizQuestionSchema, generateInviteCode, getAdminManagedOrgIds, getAdminOrgIds, getStateNameFromAbbr, getTrialSinceDate, isApprovedVideoUrl, isSiteAdmin, pillarParamSchema, requireFoundationAdmin, requirePaidTier, requireRssAdmin, requireSiteAdminForStandards, requireStaffOrAdmin, validOrgTypes, verifyOrgAdminAccess, videoUrlSchema } from "./_helpers";

// AUTO-SPLIT from server/routes.ts -- domain: student (46 routes)
export function registerStudentRoutes(app: Express): void {


  // Get assignments assigned TO the current logged-in student
  app.get("/api/my-assignments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const assigned = await storage.getAssignmentsForStudent(userId);
      res.json(assigned);
    } catch (error) {
      console.error("Failed to fetch student assigned assignments:", error);
      res.status(500).json({ error: "Failed to fetch your assignments" });
    }
  });


  // Get students with specific accommodation types (for accommodation group targeting)
  app.post("/api/students/by-accommodations", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const { accommodationTypes, classId } = req.body;
      if (!accommodationTypes || !Array.isArray(accommodationTypes) || accommodationTypes.length === 0) {
        res.status(400).json({ error: "Accommodation types are required" });
        return;
      }
      const studentsList = await storage.getStudentsByAccommodations(accommodationTypes, classId);
      res.json(studentsList);
    } catch (error) {
      console.error("Error fetching students by accommodations:", error);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });


  // Get grades for a specific student
  app.get("/api/students/:studentId/grades", isAuthenticated, async (req: any, res) => {
    try {
      const { studentId } = req.params;
      const student = await ensureStudentRecordAccess(req, res, studentId);
      if (!student) return;
      const gradesList = await storage.getStudentGradesByStudent(studentId);
      res.json(gradesList);
    } catch (error) {
      console.error("Error fetching student grades:", error);
      res.status(500).json({ error: "Failed to fetch student grades" });
    }
  });


  // Students management
  app.get("/api/students", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const studentsList = await storage.getStudents(userId);
      res.json(studentsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });


  app.post("/api/students", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const student = await storage.createStudent({
        ...req.body,
        userId,
      });
      res.json(student);
    } catch (error) {
      res.status(500).json({ error: "Failed to create student" });
    }
  });


  app.get("/api/students/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const student = await storage.getStudent(id);
      if (!student) {
        res.status(404).json({ error: "Student not found" });
        return;
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student" });
    }
  });


  app.patch("/api/students/:id", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const updated = await storage.updateStudent(id, req.body, userId);
      if (!updated) {
        res.status(404).json({ error: "Student not found or not authorized" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update student" });
    }
  });


  app.delete("/api/students/:id", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const deleted = await storage.deleteStudent(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Student not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete student" });
    }
  });


  // Student Notes
  app.get("/api/students/:studentId/notes", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { studentId } = req.params;
      const notes = await storage.getStudentNotes(studentId, userId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student notes" });
    }
  });


  app.post("/api/students/:studentId/notes", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { studentId } = req.params;
      const note = await storage.createStudentNote({
        ...req.body,
        studentId,
        educatorId: userId,
      });
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to create student note" });
    }
  });


  app.patch("/api/student-notes/:id", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const note = await storage.updateStudentNote(id, req.body, userId);
      if (!note) {
        res.status(404).json({ error: "Note not found or not authorized" });
        return;
      }
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to update student note" });
    }
  });


  app.delete("/api/student-notes/:id", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const deleted = await storage.deleteStudentNote(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Note not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete student note" });
    }
  });


  app.get("/api/students/:studentId/attendance", isAuthenticated, async (req: any, res) => {
    try {
      const { studentId } = req.params;
      const student = await ensureStudentRecordAccess(req, res, studentId);
      if (!student) return;
      const { startDate, endDate } = req.query;
      const records = await storage.getAttendanceByStudent(
        studentId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student attendance" });
    }
  });


  // Student groups
  app.get("/api/student-groups", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const groups = await storage.getStudentGroups(userId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student groups" });
    }
  });


  app.post("/api/student-groups", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const group = await storage.createStudentGroup({
        ...req.body,
        userId,
      });
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: "Failed to create student group" });
    }
  });


  app.patch("/api/student-groups/:id", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const updated = await storage.updateStudentGroup(id, req.body, userId);
      if (!updated) {
        res.status(404).json({ error: "Group not found or not authorized" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update student group" });
    }
  });


  app.delete("/api/student-groups/:id", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const deleted = await storage.deleteStudentGroup(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Group not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete student group" });
    }
  });


  // ================================
  // Student Matriculation & Achievement Tracking (System-Level)
  // ================================

  // Get matriculation history for a student
  app.get("/api/students/:studentId/matriculation", isAuthenticated, async (req: any, res) => {
    try {
      const { studentId } = req.params;
      const student = await ensureStudentRecordAccess(req, res, studentId);
      if (!student) return;
      const history = await storage.getStudentMatriculationHistory(studentId);
      res.json(history);
    } catch (error) {
      console.error("Get matriculation history error:", error);
      res.status(500).json({ error: "Failed to get matriculation history" });
    }
  });


  // Get student achievements
  app.get("/api/students/:studentId/achievements", isAuthenticated, async (req: any, res) => {
    try {
      const { studentId } = req.params;
      const student = await ensureStudentRecordAccess(req, res, studentId);
      if (!student) return;
      const achievements = await storage.getStudentAchievements(studentId);
      res.json(achievements);
    } catch (error) {
      console.error("Get student achievements error:", error);
      res.status(500).json({ error: "Failed to get student achievements" });
    }
  });


  // Award achievement to student (educator/admin)
  app.post("/api/students/:studentId/achievements", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const user = req.user;
      const role = user?.role || user?.claims?.role;
      const userId = user?.claims?.sub || user?.id;
      
      if (!["site_admin", "system_admin", "campus_admin", "educator"].includes(role)) {
        res.status(403).json({ error: "Educator or admin access required" });
        return;
      }
      
      const { studentId } = req.params;
      const { insertStudentAchievementSchema } = await import("@shared/schema");
      const parseResult = insertStudentAchievementSchema.safeParse({
        ...req.body,
        studentId,
        awardedBy: userId,
      });
      
      if (!parseResult.success) {
        res.status(400).json({ error: "Invalid data", details: parseResult.error.format() });
        return;
      }
      
      const achievement = await storage.awardAchievement(parseResult.data);
      res.status(201).json(achievement);
    } catch (error) {
      console.error("Award achievement error:", error);
      res.status(500).json({ error: "Failed to award achievement" });
    }
  });


  // ================================
  // Student Journey Progress (Be-Know-Do Tracking)
  // ================================

  // Get or create current user's journey (for students viewing their own progress)
  app.get("/api/my-journey", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      // Try to get existing journey where user is the student
      let progress = await storage.getStudentJourneyProgressByUserId(userId);
      
      // Auto-create journey if it doesn't exist (self-service for students)
      if (!progress) {
        progress = await storage.createStudentJourneyProgress({
          studentId: userId,
          educatorUserId: userId, // Student is their own "educator" for self-tracking
          organizationId: null,
          beScore: 0,
          knowScore: 0,
          doScore: 0,
          overallScore: 0,
          totalAssessmentsCompleted: 0,
          totalMilestonesAchieved: 0,
          currentFocus: "be",
          savedCareerIds: [],
          latestAssessmentResults: null,
        });
      }
      
      // Get milestones and recent activities
      const milestones = await storage.getStudentJourneyMilestones(progress.id);
      const activities = await storage.getStudentJourneyActivities(progress.id, 20);
      
      res.json({
        progress,
        milestones,
        activities,
      });
    } catch (error) {
      console.error("Failed to fetch my journey:", error);
      res.status(500).json({ error: "Failed to fetch journey" });
    }
  });


  // Update current user's journey
  app.patch("/api/my-journey", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const body = req.body;
      
      // Get user's journey
      const progress = await storage.getStudentJourneyProgressByUserId(userId);
      if (!progress) {
        res.status(404).json({ error: "Journey not found" });
        return;
      }
      
      // Whitelist allowed fields - prevent overwriting protected fields
      const allowedFields = ["currentFocus", "savedCareerIds"];
      const updates: any = { lastActivityDate: new Date() };
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updates[field] = body[field];
        }
      }
      
      const updated = await storage.updateStudentJourneyProgress(progress.id, updates);
      res.json(updated);
    } catch (error) {
      console.error("Failed to update my journey:", error);
      res.status(500).json({ error: "Failed to update journey" });
    }
  });


  // Add milestone to current user's journey
  app.post("/api/my-journey/milestones", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { title, description, category } = req.body;
      
      // Get or create journey
      let progress = await storage.getStudentJourneyProgressByUserId(userId);
      if (!progress) {
        progress = await storage.createStudentJourneyProgress({
          studentId: userId,
          educatorUserId: userId,
          organizationId: null,
          beScore: 0,
          knowScore: 0,
          doScore: 0,
          overallScore: 0,
          totalAssessmentsCompleted: 0,
          totalMilestonesAchieved: 0,
          currentFocus: "be",
          savedCareerIds: [],
          latestAssessmentResults: null,
        });
      }
      
      const milestone = await storage.createStudentJourneyMilestone({
        studentId: userId,
        journeyProgressId: progress.id,
        title,
        description: description || null,
        category: category || "do",
        status: "not_started",
        targetValue: 100,
        currentValue: 0,
        pointsEarned: 0,
        evidence: [],
      });
      
      res.status(201).json(milestone);
    } catch (error) {
      console.error("Failed to add milestone:", error);
      res.status(500).json({ error: "Failed to add milestone" });
    }
  });


  // Record assessment result for current user's journey
  app.post("/api/my-journey/assessment", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { beScore, knowScore, doScore, assessmentResult } = req.body;
      
      // Get or create journey
      let progress = await storage.getStudentJourneyProgressByUserId(userId);
      if (!progress) {
        progress = await storage.createStudentJourneyProgress({
          studentId: userId,
          educatorUserId: userId,
          organizationId: null,
          beScore: 0,
          knowScore: 0,
          doScore: 0,
          overallScore: 0,
          totalAssessmentsCompleted: 0,
          totalMilestonesAchieved: 0,
          currentFocus: "be",
          savedCareerIds: [],
          latestAssessmentResults: null,
        });
      }
      
      // Update journey with new scores
      const overallScore = Math.round((beScore + knowScore + doScore) / 3);
      
      const updated = await storage.updateStudentJourneyProgress(progress.id, {
        beScore,
        knowScore,
        doScore,
        overallScore,
        latestAssessmentResults: assessmentResult || null,
        totalAssessmentsCompleted: (progress.totalAssessmentsCompleted || 0) + 1,
        lastActivityDate: new Date(),
      });
      
      // Log the assessment activity
      await storage.createStudentJourneyActivity({
        journeyProgressId: progress.id,
        studentId: userId,
        activityType: "assessment",
        title: "Self-Discovery Assessment Completed",
        description: `Be: ${beScore}, Know: ${knowScore}, Do: ${doScore}`,
        category: "be",
        pointsEarned: overallScore,
        metadata: assessmentResult,
      });
      
      // Create a progress history snapshot for tracking over time
      const milestones = await storage.getStudentJourneyMilestones(progress.id);
      const activities = await storage.getStudentJourneyActivities(progress.id, 1000);
      await storage.createStudentJourneyProgressHistory({
        studentId: userId,
        journeyProgressId: progress.id,
        beScore,
        knowScore,
        doScore,
        overallScore,
        snapshotType: "assessment",
        triggerEvent: "completed_assessment",
        notes: `Self-Discovery Assessment: BE ${beScore}%, KNOW ${knowScore}%, DO ${doScore}%`,
        totalMilestonesCompleted: milestones.filter(m => m.status === "completed" || m.status === "mastered").length,
        totalActivitiesLogged: activities.length,
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to record assessment:", error);
      res.status(500).json({ error: "Failed to record assessment" });
    }
  });


  // Add activity to current user's journey (for reflections, etc.)
  app.post("/api/my-journey/activities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { activityType, title, description, category, pointsEarned } = req.body;
      
      if (!activityType || !title) {
        res.status(400).json({ error: "Activity type and title are required" });
        return;
      }
      
      // Get or create journey
      let progress = await storage.getStudentJourneyProgressByUserId(userId);
      if (!progress) {
        progress = await storage.createStudentJourneyProgress({
          studentId: userId,
          educatorUserId: userId,
          organizationId: null,
          beScore: 0,
          knowScore: 0,
          doScore: 0,
          overallScore: 0,
          totalAssessmentsCompleted: 0,
          totalMilestonesAchieved: 0,
          currentFocus: "be",
          savedCareerIds: [],
          latestAssessmentResults: null,
        });
      }
      
      const activity = await storage.createStudentJourneyActivity({
        journeyProgressId: progress.id,
        studentId: userId,
        activityType,
        title,
        description: description || null,
        category: category || "be",
        pointsEarned: pointsEarned || 0,
        metadata: null,
      });
      
      // Update last activity date
      await storage.updateStudentJourneyProgress(progress.id, {
        lastActivityDate: new Date(),
      });
      
      res.status(201).json(activity);
    } catch (error) {
      console.error("Failed to add activity:", error);
      res.status(500).json({ error: "Failed to add activity" });
    }
  });


  // Get student journey progress for a specific student
  app.get("/api/student-journey/:studentId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { studentId } = req.params;
      
      const progress = await storage.getStudentJourneyProgress(studentId);
      if (!progress) {
        res.status(404).json({ error: "Student journey not found" });
        return;
      }
      
      // Verify the requesting user has access (is the educator or student)
      if (progress.educatorUserId !== userId && progress.studentId !== studentId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      
      // Get milestones and recent activities
      const milestones = await storage.getStudentJourneyMilestones(progress.id);
      const activities = await storage.getStudentJourneyActivities(progress.id, 20);
      
      res.json({
        progress,
        milestones,
        activities,
      });
    } catch (error) {
      console.error("Failed to fetch student journey:", error);
      res.status(500).json({ error: "Failed to fetch student journey" });
    }
  });


  // Get all student journeys for an educator
  app.get("/api/student-journeys", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const journeys = await storage.getStudentJourneyProgressByEducator(userId);
      res.json(journeys);
    } catch (error) {
      console.error("Failed to fetch student journeys:", error);
      res.status(500).json({ error: "Failed to fetch student journeys" });
    }
  });


  // Create or initialize student journey progress
  app.post("/api/student-journey", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { studentId, studentName, classId, grade } = req.body;
      
      if (!studentId) {
        res.status(400).json({ error: "Student ID is required" });
        return;
      }
      
      // Check if journey already exists
      const existing = await storage.getStudentJourneyProgress(studentId);
      if (existing) {
        res.status(409).json({ error: "Journey already exists for this student", existing });
        return;
      }
      
      const journey = await storage.createStudentJourneyProgress({
        studentId,
        educatorUserId: userId,
        organizationId: null,
        beScore: 0,
        knowScore: 0,
        doScore: 0,
        overallScore: 0,
        totalAssessmentsCompleted: 0,
        totalMilestonesAchieved: 0,
        currentFocus: "be",
        savedCareerIds: [],
        latestAssessmentResults: null,
      });
      
      // Log the activity
      await storage.createStudentJourneyActivity({
        journeyProgressId: journey.id,
        studentId,
        activityType: "assessment",
        title: "Journey Started",
        description: "Student began their Be-Know-Do journey",
        category: "be",
        pointsEarned: 0,
      });
      
      res.status(201).json(journey);
    } catch (error) {
      console.error("Failed to create student journey:", error);
      res.status(500).json({ error: "Failed to create student journey" });
    }
  });


  // Update student journey progress (scores, etc.)
  app.patch("/api/student-journey/:id", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const updates = req.body;
      
      // Get journey to verify access
      const progress = await storage.getStudentJourneyProgress(updates.studentId || "");
      if (progress && progress.educatorUserId !== userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      
      // Update last activity date
      updates.lastActivityDate = new Date();
      
      const updated = await storage.updateStudentJourneyProgress(id, updates);
      if (!updated) {
        res.status(404).json({ error: "Journey not found" });
        return;
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to update student journey:", error);
      res.status(500).json({ error: "Failed to update student journey" });
    }
  });


  // Record a student journey activity (assessment, assignment, reflection, etc.)
  app.post("/api/student-journey/:id/activity", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id: journeyProgressId } = req.params;
      const { activityType, title, description, beImpact, knowImpact, doImpact, relatedEntityType, relatedEntityId, metadata } = req.body;
      
      // Create the activity
      const activity = await storage.createStudentJourneyActivity({
        journeyProgressId,
        studentId: req.body.studentId || "",
        activityType,
        title,
        description,
        category: req.body.category || "be",
        pointsEarned: req.body.pointsEarned || 0,
        relatedEntityType: relatedEntityType || null,
        relatedEntityId: relatedEntityId || null,
        metadata: metadata || null,
      });
      
      // Update journey scores based on category
      if (req.body.pointsEarned) {
        // Get current progress to update scores
        const journeys = await storage.getStudentJourneyProgressByEducator(userId);
        const journey = journeys.find(j => j.id === journeyProgressId);
        
        if (journey) {
          const category = req.body.category || "be";
          const points = req.body.pointsEarned || 0;
          const updates: any = {};
          
          if (category === "be") updates.beScore = Math.min(100, (journey.beScore || 0) + points);
          if (category === "know") updates.knowScore = Math.min(100, (journey.knowScore || 0) + points);
          if (category === "do") updates.doScore = Math.min(100, (journey.doScore || 0) + points);
          
          updates.overallScore = Math.round(((updates.beScore || journey.beScore) + (updates.knowScore || journey.knowScore) + (updates.doScore || journey.doScore)) / 3);
          
          await storage.updateStudentJourneyProgress(journeyProgressId, updates);
        }
      }
      
      res.status(201).json(activity);
    } catch (error) {
      console.error("Failed to record student activity:", error);
      res.status(500).json({ error: "Failed to record activity" });
    }
  });


  // Add a milestone to student journey
  app.post("/api/student-journey/:id/milestone", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const { id: journeyProgressId } = req.params;
      const { category, title, description, targetDate } = req.body;
      
      const userId = req.user?.claims?.sub;
      const milestone = await storage.createStudentJourneyMilestone({
        journeyProgressId,
        studentId: userId,
        category: category || "do",
        title,
        description: description || null,
        status: "not_started",
        evidence: [],
      });
      
      // Update milestone count
      const milestones = await storage.getStudentJourneyMilestones(journeyProgressId);
      await storage.updateStudentJourneyProgress(journeyProgressId, {
        totalMilestonesAchieved: milestones.filter((m: any) => m.status === "completed").length,
      });
      
      res.status(201).json(milestone);
    } catch (error) {
      console.error("Failed to add milestone:", error);
      res.status(500).json({ error: "Failed to add milestone" });
    }
  });


  // Update milestone status (with ownership check)
  app.patch("/api/student-journey/milestones/:id", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const body = req.body;
      
      // Get the milestone first to check ownership
      const existingMilestone = await storage.getStudentJourneyMilestone(id);
      if (!existingMilestone) {
        res.status(404).json({ error: "Milestone not found" });
        return;
      }
      
      // Verify ownership - the milestone's studentId must match the authenticated user
      if (existingMilestone.studentId !== userId) {
        res.status(403).json({ error: "Access denied - you can only update your own milestones" });
        return;
      }
      
      // Whitelist allowed update fields
      const allowedFields = ["status", "currentValue", "description", "pointsEarned", "startedAt", "completedAt"];
      const updates: any = {};
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updates[field] = body[field];
        }
      }
      
      // If completing milestone, set completedAt
      if (updates.status === "completed" && !updates.completedAt) {
        updates.completedAt = new Date();
      }
      
      const milestone = await storage.updateStudentJourneyMilestone(id, updates);
      if (!milestone) {
        res.status(404).json({ error: "Milestone not found" });
        return;
      }
      
      res.json(milestone);
    } catch (error) {
      console.error("Failed to update milestone:", error);
      res.status(500).json({ error: "Failed to update milestone" });
    }
  });


  // Record self-discovery assessment result for a student
  app.post("/api/student-journey/:id/assessment", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const { id: journeyProgressId } = req.params;
      const { beScore, knowScore, doScore, assessmentResult, studentId } = req.body;
      
      // Update journey with new scores
      const overallScore = Math.round((beScore + knowScore + doScore) / 3);
      
      const updated = await storage.updateStudentJourneyProgress(journeyProgressId, {
        beScore,
        knowScore,
        doScore,
        overallScore,
        latestAssessmentResults: assessmentResult || null,
      });
      
      // Log the assessment activity
      await storage.createStudentJourneyActivity({
        journeyProgressId,
        studentId: studentId || "",
        activityType: "assessment",
        title: "Self-Discovery Assessment Completed",
        description: `Be: ${beScore}, Know: ${knowScore}, Do: ${doScore}`,
        category: "be",
        pointsEarned: overallScore,
        metadata: assessmentResult,
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to record assessment:", error);
      res.status(500).json({ error: "Failed to record assessment" });
    }
  });


  // Get current user's journey entries (timeline)
  app.get("/api/my-journey/entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const queryResult = entriesQuerySchema.safeParse(req.query);
      const limit = queryResult.success ? queryResult.data.limit : 50;
      const entries = await storage.getStudentJourneyEntries(userId, limit);
      res.json(entries);
    } catch (error) {
      console.error("Failed to fetch journey entries:", error);
      res.status(500).json({ error: "Failed to fetch journey entries" });
    }
  });


  // Get current user's journey entries by pillar
  app.get("/api/my-journey/entries/:pillar", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const pillarResult = pillarParamSchema.safeParse(req.params.pillar);
      
      if (!pillarResult.success) {
        res.status(400).json({ error: "Invalid pillar. Must be 'be', 'know', or 'do'" });
        return;
      }
      
      const entries = await storage.getStudentJourneyEntriesByPillar(userId, pillarResult.data);
      res.json(entries);
    } catch (error) {
      console.error("Failed to fetch journey entries by pillar:", error);
      res.status(500).json({ error: "Failed to fetch journey entries" });
    }
  });


  // Add a journey entry for the current user
  app.post("/api/my-journey/entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      // Validate request body using Zod schema
      const parseResult = createJourneyEntrySchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: "Validation failed", details: parseResult.error.flatten() });
        return;
      }
      
      const { entryType, bkdPillar, title, description, pointsEarned, metadata } = parseResult.data;
      
      // Get user role for journey entry context
      const user = await storage.getUser(userId);
      
      const entry = await storage.createStudentJourneyEntry({
        userId,
        userRole: user?.role || "student",
        entryType,
        bkdPillar,
        title,
        description: description || null,
        pointsEarned: pointsEarned || 0,
        metadata: metadata || null,
      });
      
      // Update the user's journey progress scores
      const progress = await storage.getStudentJourneyProgressByUserId(userId);
      if (progress && pointsEarned) {
        const updates: any = { lastActivityDate: new Date() };
        
        // Add points to the appropriate pillar
        if (bkdPillar === "be") updates.beScore = Math.min(100, (progress.beScore || 0) + pointsEarned);
        if (bkdPillar === "know") updates.knowScore = Math.min(100, (progress.knowScore || 0) + pointsEarned);
        if (bkdPillar === "do") updates.doScore = Math.min(100, (progress.doScore || 0) + pointsEarned);
        
        // Recalculate overall score
        const be = updates.beScore ?? progress.beScore ?? 0;
        const know = updates.knowScore ?? progress.knowScore ?? 0;
        const doScore = updates.doScore ?? progress.doScore ?? 0;
        updates.overallScore = Math.round((be + know + doScore) / 3);
        
        await storage.updateStudentJourneyProgress(progress.id, updates);
      }
      
      res.status(201).json(entry);
    } catch (error) {
      console.error("Failed to create journey entry:", error);
      res.status(500).json({ error: "Failed to create journey entry" });
    }
  });


  // Delete a journey entry
  app.delete("/api/my-journey/entries/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      
      // Verify ownership by checking the entry belongs to user
      const entries = await storage.getStudentJourneyEntries(userId, 1000);
      const entry = entries.find(e => e.id === id);
      
      if (!entry) {
        res.status(404).json({ error: "Entry not found or access denied" });
        return;
      }
      
      const deleted = await storage.deleteStudentJourneyEntry(id);
      res.json({ deleted });
    } catch (error) {
      console.error("Failed to delete journey entry:", error);
      res.status(500).json({ error: "Failed to delete journey entry" });
    }
  });


  // Get comprehensive journey summary for dashboard
  app.get("/api/my-journey/summary", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      // Get journey progress
      let progress = await storage.getStudentJourneyProgressByUserId(userId);
      
      // Auto-create if doesn't exist
      if (!progress) {
        progress = await storage.createStudentJourneyProgress({
          studentId: userId,
          educatorUserId: userId,
          organizationId: null,
          beScore: 0,
          knowScore: 0,
          doScore: 0,
          overallScore: 0,
          totalAssessmentsCompleted: 0,
          totalMilestonesAchieved: 0,
          currentFocus: "be",
          savedCareerIds: [],
          latestAssessmentResults: null,
        });
      }
      
      // Get entries count by pillar
      const beEntries = await storage.getStudentJourneyEntriesByPillar(userId, "be");
      const knowEntries = await storage.getStudentJourneyEntriesByPillar(userId, "know");
      const doEntries = await storage.getStudentJourneyEntriesByPillar(userId, "do");
      
      // Get recent entries
      const recentEntries = await storage.getStudentJourneyEntries(userId, 10);
      
      // Get milestones
      const milestones = await storage.getStudentJourneyMilestones(progress.id);
      
      // Get saved careers
      const savedCareers = await storage.getSavedCareers(userId);
      
      // Get self-discovery results
      const assessments = await storage.getSelfDiscoveryResults(userId);
      
      res.json({
        progress,
        entryCounts: {
          be: beEntries.length,
          know: knowEntries.length,
          do: doEntries.length,
          total: beEntries.length + knowEntries.length + doEntries.length,
        },
        recentEntries,
        milestones,
        savedCareers,
        assessmentCount: assessments.length,
        latestAssessment: assessments[0] || null,
      });
    } catch (error) {
      console.error("Failed to fetch journey summary:", error);
      res.status(500).json({ error: "Failed to fetch journey summary" });
    }
  });


  // Get progress history for current user's journey (for tracking over time)
  app.get("/api/my-journey/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const limit = parseInt(req.query.limit as string) || 100;
      
      const progress = await storage.getStudentJourneyProgressByUserId(userId);
      if (!progress) {
        res.json([]);
        return;
      }
      
      const history = await storage.getStudentJourneyProgressHistory(progress.id, limit);
      res.json(history);
    } catch (error) {
      console.error("Failed to fetch progress history:", error);
      res.status(500).json({ error: "Failed to fetch progress history" });
    }
  });


  // Create a manual progress history snapshot
  app.post("/api/my-journey/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      const parseResult = manualSnapshotSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: "Invalid request body", details: parseResult.error.errors });
        return;
      }
      const { notes } = parseResult.data;
      
      const progress = await storage.getStudentJourneyProgressByUserId(userId);
      if (!progress) {
        res.status(404).json({ error: "Journey not found" });
        return;
      }
      
      const milestones = await storage.getStudentJourneyMilestones(progress.id);
      const activities = await storage.getStudentJourneyActivities(progress.id, 1000);
      
      const snapshot = await storage.createStudentJourneyProgressHistory({
        studentId: userId,
        journeyProgressId: progress.id,
        beScore: progress.beScore,
        knowScore: progress.knowScore,
        doScore: progress.doScore,
        overallScore: progress.overallScore,
        snapshotType: "manual",
        triggerEvent: "manual_snapshot",
        notes: notes || "Manual progress snapshot",
        totalMilestonesCompleted: milestones.filter(m => m.status === "completed" || m.status === "mastered").length,
        totalActivitiesLogged: activities.length,
      });
      
      res.status(201).json(snapshot);
    } catch (error) {
      console.error("Failed to create progress snapshot:", error);
      res.status(500).json({ error: "Failed to create progress snapshot" });
    }
  });


  // Get progress history for a specific student (for educators/admins)
  app.get("/api/student-journey/:studentId/history", isAuthenticated, async (req: any, res) => {
    try {
      const { studentId } = req.params;
      const userId = req.user?.claims?.sub;
      const limit = parseInt(req.query.limit as string) || 100;
      
      // Authorization: user can only access their own history, or must be educator/admin
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
      }
      
      const isOwnHistory = userId === studentId;
      const isEducatorOrAdmin = ["educator", "campus_admin", "district_admin", "site_admin", "system_admin"].includes(user.role || "");
      
      if (!isOwnHistory && !isEducatorOrAdmin) {
        res.status(403).json({ error: "Unauthorized to access this student's history" });
        return;
      }
      
      // If educator, verify they have access to this student (through their organization/class)
      if (!isOwnHistory && user.role === "educator") {
        const educatorProfile = await storage.getEducatorProfile(userId);
        if (educatorProfile) {
          const studentProgress = await storage.getStudentJourneyProgress(studentId);
          if (studentProgress && studentProgress.educatorUserId !== userId) {
            // Check if student is in educator's organization
            const studentJourney = await storage.getStudentJourneyProgressByUserId(studentId);
            const educatorOrgMembership = await storage.getUserOrganizations(userId);
            const educatorOrgId = educatorOrgMembership.length > 0 ? educatorOrgMembership[0].organizationId : null;
            if (studentJourney && educatorOrgId && 
                studentJourney.organizationId !== educatorOrgId) {
              res.status(403).json({ error: "Student not in your organization" });
              return;
            }
          }
        }
      }
      
      const history = await storage.getStudentJourneyProgressHistoryByStudent(studentId, limit);
      res.json(history);
    } catch (error) {
      console.error("Failed to fetch student progress history:", error);
      res.status(500).json({ error: "Failed to fetch student progress history" });
    }
  });


  // Get assignments for a specific student (for student dashboard)
  app.get("/api/student-assignments/:studentId", isAuthenticated, async (req: any, res) => {
    try {
      const { studentId } = req.params;
      const assignments = await storage.getAssignmentsForStudent(studentId);
      res.json(assignments);
    } catch (error) {
      console.error("Failed to fetch student assignments:", error);
      res.status(500).json({ error: "Failed to fetch student assignments" });
    }
  });


  // ============ Zero-Trust Data Governance Routes ============

  // Rule 1: Success Ledger
  app.post("/api/success-marks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user || !hasRolePrivilege(user.role as any, "educator")) {
        res.status(403).json({ error: "Only educators can submit success marks" });
        return;
      }
      const { studentId, classId, assignmentId, organizationId, standardCode, mark } = req.body;
      if (!studentId || !mark || !["success", "not_yet"].includes(mark)) {
        res.status(400).json({ error: "studentId and mark (success/not_yet) are required" });
        return;
      }
      const { submitSuccessMark } = await import("../services/dataGovernance");
      const record = await submitSuccessMark({
        studentId, classId, assignmentId, educatorId: userId, organizationId, standardCode, mark,
      });
      res.json(record);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit success mark" });
    }
  });


  app.patch("/api/success-marks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { mark, auditReason } = req.body;
      if (!mark || !["success", "not_yet"].includes(mark)) {
        res.status(400).json({ error: "Valid mark (success/not_yet) is required" });
        return;
      }
      const { editSuccessMark } = await import("../services/dataGovernance");
      const updated = await editSuccessMark(req.params.id, userId, mark, auditReason);
      res.json(updated);
    } catch (error: any) {
      if (error.message?.includes("finalized") || error.message?.includes("Only the submitting")) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to edit success mark" });
      }
    }
  });


  app.post("/api/success-marks/:id/archive", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user || !hasRolePrivilege(user.role as any, "educator")) {
        res.status(403).json({ error: "Only educators can archive success marks" });
        return;
      }

      const mark = await db.select().from(successMarksTable).where(eq(successMarksTable.id, req.params.id)).limit(1);
      if (mark.length === 0) { res.status(404).json({ error: "Success mark not found" }); return; }

      if (!hasRolePrivilege(user.role as any, "system_admin")) {
        const userMemberships = await db.select().from(orgMembershipsTable).where(eq(orgMembershipsTable.userId, userId));
        const userOrgIds = userMemberships.map(m => String(m.organizationId));
        if (mark[0].organizationId && !userOrgIds.includes(String(mark[0].organizationId))) {
          res.status(403).json({ error: "Cannot archive success marks outside your organization" });
          return;
        }
      }

      const { archiveSuccessMark } = await import("../services/dataGovernance");
      const updated = await archiveSuccessMark(req.params.id, userId);
      res.json({ ...updated, note: "Mark archived (hidden from UI). Underlying data preserved per retention policy." });
    } catch (error) {
      res.status(500).json({ error: "Failed to archive success mark" });
    }
  });


  app.get("/api/success-marks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user) { res.status(401).json({ error: "User not found" }); return; }

      const userMemberships = await db.select().from(orgMembershipsTable)
        .where(eq(orgMembershipsTable.userId, userId));
      const userOrgIds = userMemberships.map(m => m.organizationId);

      const { studentId, classId } = req.query;
      const conditions = [];
      if (studentId) conditions.push(eq(successMarksTable.studentId, studentId as string));
      if (classId) conditions.push(eq(successMarksTable.classId, classId as string));
      conditions.push(eq(successMarksTable.isArchived, false));

      if (!hasRolePrivilege(user.role as any, "system_admin") && userOrgIds.length > 0) {
        conditions.push(inArray(successMarksTable.organizationId, userOrgIds.map(String)));
      } else if (!hasRolePrivilege(user.role as any, "system_admin") && userOrgIds.length === 0) {
        conditions.push(eq(successMarksTable.educatorId, userId));
      }

      const marks = await db.select().from(successMarksTable)
        .where(and(...conditions))
        .orderBy(desc(successMarksTable.createdAt));
      res.json(marks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch success marks" });
    }
  });
}
