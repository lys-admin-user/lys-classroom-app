import type { Express } from "express";
import { storage } from "../storage";
import { users, type Lesson, type Goal, lessons, goals } from "@shared/schema";
import { z } from "zod";
import { isAuthenticated } from "../replit_integrations/auth";
import multer from "multer";
import { db } from "../db";
import { and, count } from "drizzle-orm";
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

// AUTO-SPLIT from server/routes.ts -- domain: analytics (4 routes)
export function registerAnalyticsRoutes(app: Express): void {


  // ================================
  // Public Community Stats
  // ================================

  app.get("/api/stats/community", async (req: any, res) => {
    try {
      const { db } = await import("../db");
      const { users } = await import("@shared/schema");
      const { sql: sqlFn } = await import("drizzle-orm");
      const [result] = await db.select({
        educators: sqlFn<number>`count(*) filter (where role in ('educator','campus_admin','district_admin','site_admin'))`,
        students: sqlFn<number>`count(*) filter (where role = 'student')`,
      }).from(users);
      res.json({ educators: Number(result?.educators || 0), students: Number(result?.students || 0) });
    } catch (error) {
      res.json({ educators: 0, students: 0 });
    }
  });


  // School drill-down analytics - detailed stats for a single school
  app.get("/api/analytics/school/:schoolId", isAuthenticated, async (req: any, res) => {
    try {
      const { schoolId } = req.params;
      const userId = req.user?.claims?.sub;
      if (!userId) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      
      const user = await storage.getUser(userId);
      if (user?.role !== "campus_admin") {
        res.status(403).json({ error: "Campus admin access required" });
        return;
      }
      
      // Verify user has access to this school or its parent district
      const school = await storage.getOrganization(schoolId);
      if (!school) {
        res.status(404).json({ error: "School not found" });
        return;
      }
      
      // Check for admin/owner access to the school
      const membership = await storage.getOrgMembership(schoolId, userId);
      let hasAccess = membership?.role === "admin" || membership?.role === "owner";
      
      // Check if user is admin/owner of parent district
      if (!hasAccess && school.parentOrganizationId) {
        const districtMembership = await storage.getOrgMembership(school.parentOrganizationId, userId);
        hasAccess = districtMembership?.role === "admin" || districtMembership?.role === "owner";
      }
      
      if (!hasAccess) {
        res.status(403).json({ error: "Admin access required for this school" });
        return;
      }
      
      // Get school members
      const members = await storage.getOrganizationMembers(schoolId);
      // Filter out any null/undefined userIds
      const memberUserIds = members.map(m => m.userId).filter((uid): uid is string => !!uid);
      
      // Get member details with lessons and goals
      const teacherStats: Array<{
        id: string;
        name: string;
        email: string | null;
        role: string;
        lessonCount: number;
        goalCount: number;
        lessonsThisWeek: number;
      }> = [];
      
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      let allLessons: Lesson[] = [];
      let allGoals: Goal[] = [];
      
      for (const uid of memberUserIds) {
        try {
          const memberUser = await storage.getUser(uid);
          const lessons = await storage.getLessons(uid);
          const goals = await storage.getGoals(uid);
          
          allLessons = allLessons.concat(lessons);
          allGoals = allGoals.concat(goals);
          
          const lessonsThisWeek = lessons.filter((l: Lesson) => 
            l.createdAt && new Date(l.createdAt) >= oneWeekAgo
          ).length;
          
          teacherStats.push({
            id: uid,
            name: memberUser ? `${memberUser.firstName || ""} ${memberUser.lastName || ""}`.trim() || "Unknown" : "Unknown",
            email: memberUser?.email || null,
            role: memberUser?.role || "unknown",
            lessonCount: lessons.length,
            goalCount: goals.length,
            lessonsThisWeek,
          });
        } catch (err) {
          console.error(`Error fetching data for user ${uid}:`, err);
        }
      }
      
      // Sort teachers by lesson count
      teacherStats.sort((a, b) => b.lessonCount - a.lessonCount);
      
      // Calculate BKD distribution
      const bkdDistribution = { be: 0, know: 0, do: 0 };
      allLessons.forEach((l: Lesson) => {
        const focus = l.bkdFocus as "be" | "know" | "do";
        if (focus && bkdDistribution[focus] !== undefined) {
          bkdDistribution[focus]++;
        }
      });
      
      // Standards coverage
      const standardsCoverage: Record<string, number> = {};
      allLessons.forEach((l: Lesson) => {
        const stds = (l.standards || "").split(",").map((s: string) => s.trim()).filter(Boolean);
        stds.forEach((s: string) => {
          const prefix = s.split(".")[0] || s.substring(0, 4);
          standardsCoverage[prefix] = (standardsCoverage[prefix] || 0) + 1;
        });
      });
      
      res.json({
        school: {
          id: school.id,
          name: school.name,
          type: school.type,
        },
        totalMembers: members.length,
        totalEducators: teacherStats.filter(t => t.role === "educator").length,
        totalStudents: teacherStats.filter(t => t.role === "student").length,
        totalLessons: allLessons.length,
        totalGoals: allGoals.length,
        goalsCompleted: allGoals.filter((g: Goal) => g.status === "completed").length,
        goalsInProgress: allGoals.filter((g: Goal) => g.status === "in_progress").length,
        teachers: teacherStats.filter(t => t.role === "educator"),
        bkdDistribution,
        standardsCoverage,
      });
    } catch (error) {
      console.error("School analytics error:", error);
      res.status(500).json({ error: "Failed to fetch school analytics" });
    }
  });


  // Teacher drill-down analytics - detailed stats for a single teacher
  app.get("/api/analytics/teacher/:teacherId", isAuthenticated, async (req: any, res) => {
    try {
      const { teacherId } = req.params;
      const userId = req.user?.claims?.sub;
      if (!userId) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      
      const user = await storage.getUser(userId);
      if (user?.role !== "campus_admin") {
        res.status(403).json({ error: "Campus admin access required" });
        return;
      }
      
      // Get teacher info
      const teacher = await storage.getUser(teacherId);
      if (!teacher) {
        res.status(404).json({ error: "Teacher not found" });
        return;
      }
      
      // Verify user has admin/owner access to teacher's organization or parent district
      const userOrgs = await storage.getUserOrganizations(userId);
      const teacherOrgs = await storage.getUserOrganizations(teacherId);
      
      let hasAccess = false;
      for (const userOrg of userOrgs) {
        // Only admin/owner of org can view teacher analytics
        if (userOrg.role !== "admin" && userOrg.role !== "owner") continue;
        
        for (const teacherOrg of teacherOrgs) {
          // Direct org membership match
          if (userOrg.organizationId === teacherOrg.organizationId) {
            hasAccess = true;
            break;
          }
          // Check if user's org is parent district of teacher's school
          const tOrg = await storage.getOrganization(teacherOrg.organizationId);
          if (tOrg?.parentOrganizationId === userOrg.organizationId) {
            hasAccess = true;
            break;
          }
        }
        if (hasAccess) break;
      }
      
      if (!hasAccess) {
        res.status(403).json({ error: "Admin access required to view this teacher" });
        return;
      }
      
      // Get teacher's data
      const lessons = await storage.getLessons(teacherId);
      const goals = await storage.getGoals(teacherId);
      
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      const lessonsThisWeek = lessons.filter((l: Lesson) => 
        l.createdAt && new Date(l.createdAt) >= oneWeekAgo
      ).length;
      const lessonsLastWeek = lessons.filter((l: Lesson) => 
        l.createdAt && new Date(l.createdAt) >= twoWeeksAgo && new Date(l.createdAt) < oneWeekAgo
      ).length;
      
      // BKD distribution for lessons
      const lessonBkdDistribution = { be: 0, know: 0, do: 0 };
      lessons.forEach((l: Lesson) => {
        const focus = l.bkdFocus as "be" | "know" | "do";
        if (focus && lessonBkdDistribution[focus] !== undefined) {
          lessonBkdDistribution[focus]++;
        }
      });
      
      // Standards coverage
      const standardsCoverage: Record<string, number> = {};
      lessons.forEach((l: Lesson) => {
        const stds = (l.standards || "").split(",").map((s: string) => s.trim()).filter(Boolean);
        stds.forEach((s: string) => {
          const prefix = s.split(".")[0] || s.substring(0, 4);
          standardsCoverage[prefix] = (standardsCoverage[prefix] || 0) + 1;
        });
      });
      
      // Recent lessons
      const recentLessons = lessons
        .sort((a: Lesson, b: Lesson) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 10)
        .map((l: Lesson) => ({
          id: l.id,
          title: l.title,
          topic: l.topic,
          gradeLevel: l.gradeLevel,
          bkdFocus: l.bkdFocus,
          createdAt: l.createdAt,
        }));
      
      res.json({
        teacher: {
          id: teacher.id,
          name: `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() || "Unknown",
          email: teacher.email,
          role: teacher.role,
        },
        totalLessons: lessons.length,
        totalGoals: goals.length,
        lessonsThisWeek,
        lessonsLastWeek,
        goalsCompleted: goals.filter((g: Goal) => g.status === "completed").length,
        goalsInProgress: goals.filter((g: Goal) => g.status === "in_progress").length,
        lessonBkdDistribution,
        standardsCoverage,
        recentLessons,
      });
    } catch (error) {
      console.error("Teacher analytics error:", error);
      res.status(500).json({ error: "Failed to fetch teacher analytics" });
    }
  });


  // ================================
  // Workforce Trends
  // ================================

  // Get workforce trends (optionally filtered by country)
  app.get("/api/workforce-trends", async (req, res) => {
    try {
      const { country } = req.query;
      const trends = await storage.getWorkforceTrends(country as string | undefined);
      res.json(trends);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workforce trends" });
    }
  });
}
