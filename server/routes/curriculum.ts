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

import { ANALYZER_CTAS, ANALYZER_IDENTITIES, ANALYZER_SESSION_REGEX, ANALYZER_URGENCIES, APPROVED_VIDEO_HOSTS, MAX_TRIALS_PER_IP, TRIAL_DURATION_DAYS, TRIAL_RESET_MONTHS, US_STATES, analyzerBindSchema, analyzerCtaClickSchema, analyzerSubmitSchema, autoMatchSchema, createJourneyEntrySchema, createSisConnectionSchema, educatorProfileSchema, entityShareBodySchema, entriesQuerySchema, foundationModuleUpdateSchema, foundationProgressBodySchema, foundationQuizQuestionSchema, generateInviteCode, getAdminManagedOrgIds, getAdminOrgIds, getStateNameFromAbbr, getTrialSinceDate, isApprovedVideoUrl, isSiteAdmin, pillarParamSchema, requireFoundationAdmin, requirePaidTier, requireRssAdmin, requireSiteAdminForStandards, requireStaffOrAdmin, validOrgTypes, verifyOrgAdminAccess, videoUrlSchema } from "./_helpers";

// AUTO-SPLIT from server/routes.ts -- domain: curriculum (39 routes)
export function registerCurriculumRoutes(app: Express): void {


  // Goals - works for all users, but data is session-based for non-auth
  app.get("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });


  app.post("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || null;
      const validated = createGoalSchema.parse(req.body);
      const sanitizedMilestones = (validated.milestones || []).map((m) => ({
        ...m,
        id: randomUUID(),
      }));
      const goal = await storage.createGoal({
        ...validated,
        userId,
        milestones: sanitizedMilestones,
      });
      res.json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid goal data", details: error.errors });
      } else {
        console.error("Create goal error:", error);
        res.status(500).json({ error: "Failed to create goal" });
      }
    }
  });


  app.patch("/api/goals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub || null;
      const validated = updateGoalSchema.parse(req.body);
      
      let updates: any = { ...validated };
      if (validated.milestones) {
        updates.milestones = validated.milestones.map((m) => ({
          title: m.title,
          completed: m.completed,
          dueDate: m.dueDate,
          reflection: m.reflection,
          id: randomUUID(),
        }));
      }
      
      // Check if status is being set to completed for journey entry creation
      const isCompletingGoal = validated.status === "completed";
      
      // updateGoal returns null if not found or not authorized (includes user check)
      const updated = await storage.updateGoal(id, updates, userId);
      if (!updated) {
        res.status(404).json({ error: "Goal not found or not authorized" });
        return;
      }
      
      // If goal was just marked completed via this update, create a journey entry
      // We check isCompletingGoal from the request rather than comparing with beforeGoal
      // to avoid pre-authorization data access
      if (userId && isCompletingGoal && updated.status === "completed") {
        const bkdPillar = (updated.bkdPillar as "be" | "know" | "do") || "do";
        // Get user role for journey entry context
        const user = await storage.getUser(userId);
        await storage.createStudentJourneyEntry({
          userId,
          userRole: user?.role || "student",
          entryType: "goal_completed",
          bkdPillar,
          title: `Completed Goal: ${updated.title}`,
          description: updated.description || `Achieved a ${bkdPillar.toUpperCase()} goal`,
          pointsEarned: 10,
          metadata: {
            goalId: updated.id,
          },
        });
      }
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid goal data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update goal" });
      }
    }
  });


  app.delete("/api/goals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub || null;
      const deleted = await storage.deleteGoal(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Goal not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });


  app.patch("/api/goals/:goalId/milestones/:milestoneId", isAuthenticated, async (req: any, res) => {
    try {
      const { goalId, milestoneId } = req.params;
      const { completed } = req.body;
      const userId = req.user?.claims?.sub || null;
      const updated = await storage.updateMilestone(goalId, milestoneId, completed, userId);
      if (!updated) {
        res.status(404).json({ error: "Goal or milestone not found or not authorized" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update milestone" });
    }
  });


  // Resources - public
  app.get("/api/resources", async (req, res) => {
    try {
      const resources = await storage.getResources();
      res.json(resources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resources" });
    }
  });


  app.get("/api/resources/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const resource = await storage.getResource(id);
      if (!resource) {
        res.status(404).json({ error: "Resource not found" });
        return;
      }
      res.json(resource);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resource" });
    }
  });


  // Scope and Sequence - requires auth
  app.get("/api/scopes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const scopes = await storage.getScopeSequences(userId);
      res.json(scopes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scope sequences" });
    }
  });


  app.get("/api/scopes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      const scope = await storage.getScopeSequence(id);
      if (!scope) {
        res.status(404).json({ error: "Scope sequence not found" });
        return;
      }
      if (!(await storage.canViewScope(userId, scope))) {
        res.status(404).json({ error: "Scope sequence not found" });
        return;
      }
      // Get units for this scope
      const units = await storage.getSequenceUnits(id);
      const canEdit = await storage.canEditScope(userId, scope);
      const canManage = await storage.canManageScope(userId, scope);
      res.json({ scope, units, canEdit, canManage, isOwner: scope.userId === userId });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scope sequence" });
    }
  });


  app.post("/api/scopes", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const validated = insertScopeSequenceSchema.parse(req.body);
      const scope = await storage.createScopeSequence({
        ...validated,
        userId,
      });
      res.json(scope);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid scope data", details: error.errors });
      } else {
        console.error("Create scope error:", error);
        res.status(500).json({ error: "Failed to create scope sequence" });
      }
    }
  });


  app.patch("/api/scopes/:id", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      const updates = req.body;
      
      const updated = await storage.updateScopeSequence(id, updates, userId);
      if (!updated) {
        res.status(404).json({ error: "Scope not found or not authorized" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update scope sequence" });
    }
  });


  app.delete("/api/scopes/:id", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      const deleted = await storage.deleteScopeSequence(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Scope not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete scope sequence" });
    }
  });


  // Import Scope from Document with file parsing
  app.post("/api/scopes/import", isAuthenticated, requireTeacher, upload.single("file"), async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const file = req.file;
      
      // Get country and state from query params or use defaults
      const country = req.query.country as string || "United States";
      const state = req.query.state as string || "Texas";
      
      // Determine standards name based on state
      let standardsName = "TEKS";
      if (state === "California") standardsName = "California CCSS";
      else if (state === "Florida") standardsName = "Florida B.E.S.T.";
      else if (state === "New York") standardsName = "NYSLS";
      else if (state === "Common Core") standardsName = "CCSS";
      
      let parsedDoc = null;
      if (file) {
        try {
          parsedDoc = await parseDocument(file.buffer, file.originalname, file.mimetype);
        } catch (parseError) {
          console.error("Document parsing error:", parseError);
        }
      }
      
      const scope = await storage.createScopeSequence({
        userId,
        title: parsedDoc?.title || "Imported Scope & Sequence",
        subject: parsedDoc?.subject || "General",
        gradeLevel: parsedDoc?.gradeLevel || "7",
        country,
        state,
        standardsName,
        schoolYear: "2024-2025",
        totalWeeks: 36,
        status: "draft",
      });
      
      // Create units from parsed document
      if (parsedDoc?.units && parsedDoc.units.length > 0) {
        const unitsPerNineWeeks = Math.ceil(parsedDoc.units.length / 4);
        for (let i = 0; i < parsedDoc.units.length; i++) {
          const parsedUnit = parsedDoc.units[i];
          const startWeek = Math.floor((i * 36) / parsedDoc.units.length) + 1;
          const endWeek = Math.floor(((i + 1) * 36) / parsedDoc.units.length);
          const nineWeeksPeriod = Math.min(4, Math.floor(i / unitsPerNineWeeks) + 1);
          
          await storage.createSequenceUnit({
            scopeId: scope.id,
            unitNumber: i + 1,
            title: parsedUnit.title,
            summary: parsedUnit.description || null,
            transferGoal: null,
            startWeek,
            endWeek,
            nineWeeksPeriod,
            studentsWillKnow: [],
            studentsWillBeSkilled: [],
            standardCodes: [],
          });
        }
      }
      
      res.json({ 
        success: true, 
        message: parsedDoc?.units?.length 
          ? `Imported ${parsedDoc.units.length} units from your document. Review and edit as needed.`
          : "Document imported. Add units to complete your scope.",
        scope,
        unitsCreated: parsedDoc?.units?.length || 0,
      });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ error: "Failed to import document" });
    }
  });


  // Sequence Units
  app.post("/api/scopes/:scopeId/units", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const { scopeId } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Verify user can edit the scope (owner, edit-collaborator, or platform admin)
      const scope = await storage.getScopeSequence(scopeId);
      if (!scope || !(await storage.canEditScope(userId, scope))) {
        res.status(403).json({ error: "Not authorized to add units to this scope" });
        return;
      }
      
      const validated = insertSequenceUnitSchema.parse({ ...req.body, scopeId });
      const unit = await storage.createSequenceUnit(validated);

      syncScopeStandardsToProfile(scopeId, userId).catch(err =>
        console.error("Auto-sync standards failed:", err)
      );

      res.json(unit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid unit data", details: error.errors });
      } else {
        console.error("Create unit error:", error);
        res.status(500).json({ error: "Failed to create unit" });
      }
    }
  });


  app.patch("/api/units/:id", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      const updates = req.body;
      
      const updated = await storage.updateSequenceUnit(id, updates, userId);
      if (!updated) {
        res.status(404).json({ error: "Unit not found or not authorized" });
        return;
      }

      if (updated.scopeId) {
        syncScopeStandardsToProfile(updated.scopeId, userId).catch(err =>
          console.error("Auto-sync standards failed:", err)
        );
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update unit" });
    }
  });


  app.delete("/api/units/:id", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      const deleted = await storage.deleteSequenceUnit(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Unit not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete unit" });
    }
  });


  app.post("/api/scopes/:scopeId/sync-standards", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const { scopeId } = req.params;
      const userId = req.user?.claims?.sub;

      const scope = await storage.getScopeSequence(scopeId);
      if (!scope || !(await storage.canEditScope(userId, scope))) {
        res.status(403).json({ error: "Not authorized" });
        return;
      }

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

      const allStandards = Array.from(standardsMap.values());
      if (allStandards.length > 0) {
        await storage.updateEducatorProfile(userId, { preferredStandardCodes: allStandards });
      }

      res.json({ success: true, count: allStandards.length, standards: allStandards });
    } catch (error) {
      console.error("Sync standards error:", error);
      res.status(500).json({ error: "Failed to sync standards" });
    }
  });


  // Scope Change Requests (for teacher suggestions on admin-set scopes)
  app.get("/api/scopes/:scopeId/requests", isAuthenticated, async (req: any, res) => {
    try {
      const { scopeId } = req.params;
      const userId = req.user?.claims?.sub;
      const scope = await storage.getScopeSequence(scopeId);
      if (!scope || !(await storage.canViewScope(userId, scope))) {
        res.status(404).json({ error: "Scope sequence not found" });
        return;
      }
      const requests = await storage.getScopeChangeRequests(scopeId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch change requests" });
    }
  });


  app.post("/api/scopes/:scopeId/requests", isAuthenticated, async (req: any, res) => {
    try {
      const { scopeId } = req.params;
      const userId = req.user?.claims?.sub;

      const scope = await storage.getScopeSequence(scopeId);
      if (!scope || !(await storage.canViewScope(userId, scope))) {
        res.status(404).json({ error: "Scope sequence not found" });
        return;
      }

      const validated = insertScopeChangeRequestSchema.parse({
        ...req.body,
        scopeId,
        userId,
      });
      const request = await storage.createScopeChangeRequest(validated);
      res.json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Create change request error:", error);
        res.status(500).json({ error: "Failed to create change request" });
      }
    }
  });


  // ================================
  // Curriculum Sharing (peer share + edit-access requests)
  // ================================

  // List who a scope is shared with (owner / edit-collaborator / platform admin)
  app.get("/api/scopes/:scopeId/shares", isAuthenticated, async (req: any, res) => {
    try {
      const { scopeId } = req.params;
      const userId = req.user?.claims?.sub;
      const scope = await storage.getScopeSequence(scopeId);
      if (!scope || !(await storage.canManageScope(userId, scope))) {
        res.status(403).json({ error: "Not authorized to manage sharing for this scope" });
        return;
      }
      const shares = await storage.getCurriculumShares(scopeId);
      const enriched = await Promise.all(shares.map(async (s) => {
        const u = await storage.getUser(s.sharedWithUserId);
        return {
          ...s,
          sharedWithName: u ? [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email : undefined,
          sharedWithEmail: u?.email,
        };
      }));
      res.json(enriched);
    } catch (error) {
      console.error("List shares error:", error);
      res.status(500).json({ error: "Failed to fetch shares" });
    }
  });

  // Share a scope with a specific teacher (by userId or email). View-only by default.
  app.post("/api/scopes/:scopeId/shares", isAuthenticated, async (req: any, res) => {
    try {
      const { scopeId } = req.params;
      const userId = req.user?.claims?.sub;
      const scope = await storage.getScopeSequence(scopeId);
      if (!scope || !(await storage.canManageScope(userId, scope))) {
        res.status(403).json({ error: "Not authorized to share this scope" });
        return;
      }

      const { sharedWithUserId, email } = req.body || {};
      const permission = req.body?.permission === "edit" ? "edit" : "view";

      let targetUserId: string | undefined = sharedWithUserId;
      if (!targetUserId && email) {
        const target = await storage.getUserByEmail(String(email).trim().toLowerCase());
        if (!target) {
          res.status(404).json({ error: "No user found with that email" });
          return;
        }
        targetUserId = target.id;
      }
      if (!targetUserId) {
        res.status(400).json({ error: "Provide sharedWithUserId or email" });
        return;
      }
      if (targetUserId === scope.userId) {
        res.status(400).json({ error: "Owner already has full access" });
        return;
      }

      const share = await storage.createCurriculumShare({
        scopeId,
        sharedWithUserId: targetUserId,
        permission,
        sharedBy: userId,
      });
      res.json(share);
    } catch (error) {
      console.error("Create share error:", error);
      res.status(500).json({ error: "Failed to share scope" });
    }
  });

  // Remove a share
  app.delete("/api/scopes/:scopeId/shares/:sharedWithUserId", isAuthenticated, async (req: any, res) => {
    try {
      const { scopeId, sharedWithUserId } = req.params;
      const userId = req.user?.claims?.sub;
      const scope = await storage.getScopeSequence(scopeId);
      if (!scope || !(await storage.canManageScope(userId, scope))) {
        res.status(403).json({ error: "Not authorized to manage sharing for this scope" });
        return;
      }
      await storage.deleteCurriculumShare(scopeId, sharedWithUserId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete share error:", error);
      res.status(500).json({ error: "Failed to remove share" });
    }
  });

  // List edit-access requests for a scope (owner / edit-collaborator / platform admin)
  app.get("/api/scopes/:scopeId/access-requests", isAuthenticated, async (req: any, res) => {
    try {
      const { scopeId } = req.params;
      const userId = req.user?.claims?.sub;
      const scope = await storage.getScopeSequence(scopeId);
      if (!scope || !(await storage.canManageScope(userId, scope))) {
        res.status(403).json({ error: "Not authorized to view access requests for this scope" });
        return;
      }
      const requests = await storage.getCurriculumAccessRequests(scopeId);
      const enriched = await Promise.all(requests.map(async (r) => {
        const u = await storage.getUser(r.requesterId);
        return {
          ...r,
          requesterName: u ? [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email : undefined,
          requesterEmail: u?.email,
        };
      }));
      res.json(enriched);
    } catch (error) {
      console.error("List access requests error:", error);
      res.status(500).json({ error: "Failed to fetch access requests" });
    }
  });

  // Request edit access to a scope you can view but not edit
  app.post("/api/scopes/:scopeId/access-requests", isAuthenticated, async (req: any, res) => {
    try {
      const { scopeId } = req.params;
      const userId = req.user?.claims?.sub;
      const scope = await storage.getScopeSequence(scopeId);
      if (!scope || !(await storage.canViewScope(userId, scope))) {
        res.status(404).json({ error: "Scope sequence not found" });
        return;
      }
      if (await storage.canEditScope(userId, scope)) {
        res.status(400).json({ error: "You already have edit access" });
        return;
      }
      const reason = typeof req.body?.reason === "string" ? req.body.reason : null;
      const request = await storage.createCurriculumAccessRequest({
        scopeId,
        requesterId: userId,
        requestedPermission: "edit",
        reason,
      } as any);
      res.json(request);
    } catch (error) {
      console.error("Create access request error:", error);
      res.status(500).json({ error: "Failed to request access" });
    }
  });

  // Approve or deny an edit-access request (owner / edit-collaborator / platform admin)
  app.patch("/api/scopes/:scopeId/access-requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { scopeId, id } = req.params;
      const userId = req.user?.claims?.sub;
      const scope = await storage.getScopeSequence(scopeId);
      if (!scope || !(await storage.canManageScope(userId, scope))) {
        res.status(403).json({ error: "Not authorized to review access requests for this scope" });
        return;
      }
      const accessRequest = await storage.getCurriculumAccessRequest(id);
      if (!accessRequest || accessRequest.scopeId !== scopeId) {
        res.status(404).json({ error: "Access request not found" });
        return;
      }
      const decision = req.body?.status === "approved" ? "approved" : req.body?.status === "denied" ? "denied" : null;
      if (!decision) {
        res.status(400).json({ error: "status must be 'approved' or 'denied'" });
        return;
      }

      const updated = await storage.updateCurriculumAccessRequest(id, {
        status: decision,
        reviewedBy: userId,
        reviewedAt: new Date(),
      });

      // On approval, grant the requested permission as a share
      if (decision === "approved") {
        await storage.createCurriculumShare({
          scopeId,
          sharedWithUserId: accessRequest.requesterId,
          permission: accessRequest.requestedPermission,
          sharedBy: userId,
        });
      }
      res.json(updated);
    } catch (error) {
      console.error("Review access request error:", error);
      res.status(500).json({ error: "Failed to review access request" });
    }
  });


  // ================================
  // KNOW Resources Routes (Admin-managed educational resources)
  // ================================

  // Get all KNOW resources (public - for students/educators)
  app.get("/api/know-resources", async (req: any, res) => {
    try {
      const { type, category, featured } = req.query;
      const resources = await storage.getKnowResources({
        resourceType: type as string,
        category: category as string,
        isActive: true,
        featured: featured === "true" ? true : undefined,
      });

      // Personalize scholarships if the user is authenticated
      const userId = req.user?.id || req.user?.claims?.sub;
      const isRequestingScholarships = !type || type === "scholarship";
      if (userId && isRequestingScholarships) {
        // Gather user profile signals in parallel
        const [prefRows, careerRows, savedRows] = await Promise.all([
          db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1),
          db.select().from(savedCareers).where(eq(savedCareers.userId, userId)),
          db.select({ resourceId: savedScholarships.resourceId })
            .from(savedScholarships)
            .where(eq(savedScholarships.userId, userId)),
        ]);
        const userState: string = prefRows[0]?.state || "";
        const userCareerCategories = new Set(careerRows.map((c: any) => c.careerCategory?.toLowerCase()).filter(Boolean));
        const savedResourceIds = new Set(savedRows.map((s: any) => s.resourceId));

        const enriched = resources.map((r: any) => {
          if (r.resourceType !== "scholarship") return { ...r, matchScore: null, matchReasons: [], isSaved: savedResourceIds.has(`know-${r.id}`) || savedResourceIds.has(r.id) };

          let score = 20; // base
          const reasons: string[] = [];

          // Career field match
          const scholarshipFields: string[] = (r.careerFields || []).map((f: string) => f.toLowerCase());
          if (scholarshipFields.length > 0 && userCareerCategories.size > 0) {
            const hasFieldMatch = scholarshipFields.some((f: string) =>
              Array.from(userCareerCategories).some((uc) => f.includes(uc) || uc.includes(f))
            );
            if (hasFieldMatch) { score += 30; reasons.push("Matches your career interests"); }
          } else if (scholarshipFields.length === 0) {
            score += 10; // general scholarship, open to all
          }

          // State match
          const restrictions: string[] = r.stateRestrictions || [];
          if (restrictions.length === 0) {
            score += 10; reasons.push("Available in all states");
          } else if (userState && restrictions.includes(userState)) {
            score += 25; reasons.push(`Available in ${userState}`);
          } else if (userState && restrictions.length > 0) {
            score -= 20; // wrong state — lower priority
          }

          // First-gen friendly bonus
          if (r.firstGenFriendly) { score += 10; reasons.push("First-gen friendly"); }

          // Clamp
          score = Math.max(0, Math.min(100, score));
          const isSaved = savedResourceIds.has(`know-${r.id}`) || savedResourceIds.has(r.id);
          return { ...r, matchScore: score, matchReasons: reasons, isSaved };
        });

        // Sort scholarships by match score desc, non-scholarships stay at original position
        const scholarships = enriched.filter((r: any) => r.resourceType === "scholarship").sort((a: any, b: any) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
        const others = enriched.filter((r: any) => r.resourceType !== "scholarship");
        return res.json([...others, ...scholarships]);
      }

      res.json(resources);
    } catch (error) {
      console.error("Failed to fetch KNOW resources:", error);
      res.status(500).json({ error: "Failed to fetch resources" });
    }
  });


  // Get single KNOW resource (public - only returns active resources)
  app.get("/api/know-resources/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const resource = await storage.getKnowResource(id);
      if (!resource || !resource.isActive) {
        res.status(404).json({ error: "Resource not found" });
        return;
      }
      res.json(resource);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resource" });
    }
  });


  // ================================
  // LYS Milestones (Being, Knowing, Doing)
  // ================================

  // Get user's milestones
  app.get("/api/lyse-milestones", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { category } = req.query;
      
      let milestones;
      if (category) {
        milestones = await storage.getLyseMilestonesByCategory(userId, category as string);
      } else {
        milestones = await storage.getLyseMilestones(userId);
      }
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch milestones" });
    }
  });


  // Get gatekeeper milestones
  app.get("/api/lyse-milestones/gatekeepers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const milestones = await storage.getGatekeeperMilestones(userId);
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch gatekeeper milestones" });
    }
  });


  // Get single milestone
  app.get("/api/lyse-milestones/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const milestone = await storage.getLyseMilestone(req.params.id);
      if (!milestone) {
        res.status(404).json({ error: "Milestone not found" });
        return;
      }
      if (milestone.userId !== userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      res.json(milestone);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch milestone" });
    }
  });


  // Create milestone
  app.post("/api/lyse-milestones", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const milestone = await storage.createLyseMilestone({
        ...req.body,
        userId,
      });
      res.status(201).json(milestone);
    } catch (error) {
      res.status(500).json({ error: "Failed to create milestone" });
    }
  });


  // Update milestone
  app.patch("/api/lyse-milestones/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const existing = await storage.getLyseMilestone(req.params.id);
      if (!existing) {
        res.status(404).json({ error: "Milestone not found" });
        return;
      }
      if (existing.userId !== userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      const milestone = await storage.updateLyseMilestone(req.params.id, req.body);
      res.json(milestone);
    } catch (error) {
      res.status(500).json({ error: "Failed to update milestone" });
    }
  });


  // Delete milestone
  app.delete("/api/lyse-milestones/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      await storage.deleteLyseMilestone(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete milestone" });
    }
  });


  // ===========================================
  // RESOURCE RATINGS
  // ===========================================
  
  // Get ratings for a resource
  app.get("/api/resources/:resourceId/ratings", async (req: any, res) => {
    try {
      const ratings = await storage.getResourceRatings(req.params.resourceId);
      const avgData = await storage.getAverageRating(req.params.resourceId);
      res.json({ ratings, average: avgData.average, count: avgData.count });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch ratings" });
    }
  });


  // Create/update rating (authenticated)
  app.post("/api/resources/:resourceId/ratings", isAuthenticated, async (req: any, res) => {
    try {
      const existing = await storage.getUserResourceRating(req.params.resourceId, req.user?.claims?.sub);
      if (existing) {
        res.status(400).json({ error: "You have already rated this resource" });
        return;
      }
      const rating = await storage.createResourceRating({
        resourceId: req.params.resourceId,
        userId: req.user?.claims?.sub,
        rating: req.body.rating,
        review: req.body.review,
        helpful: req.body.helpful ?? true,
      });
      res.json(rating);
    } catch (e) {
      res.status(500).json({ error: "Failed to create rating" });
    }
  });


  // ===========================================
  // CAMPUS ACTIVITIES (DO Pillar)
  // ===========================================
  
  app.get("/api/campus-activities", isAuthenticated, async (req: any, res) => {
    try {
      const activities = await storage.getCampusActivities(req.user?.claims?.sub);
      res.json(activities);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });


  app.post("/api/campus-activities", isAuthenticated, async (req: any, res) => {
    try {
      const activity = await storage.createCampusActivity({
        ...req.body,
        userId: req.user?.claims?.sub,
      });
      res.json(activity);
    } catch (e) {
      res.status(500).json({ error: "Failed to create activity" });
    }
  });


  app.patch("/api/campus-activities/:id", isAuthenticated, async (req: any, res) => {
    try {
      const activity = await storage.updateCampusActivity(req.params.id, req.body, req.user?.claims?.sub);
      if (!activity) {
        res.status(404).json({ error: "Activity not found" });
        return;
      }
      res.json(activity);
    } catch (e) {
      res.status(500).json({ error: "Failed to update activity" });
    }
  });


  app.delete("/api/campus-activities/:id", isAuthenticated, async (req: any, res) => {
    try {
      const success = await storage.deleteCampusActivity(req.params.id, req.user?.claims?.sub);
      if (!success) {
        res.status(404).json({ error: "Activity not found" });
        return;
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete activity" });
    }
  });


  app.get("/api/org-safety/review-queue", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const orgIds = await getAdminOrgIds(userId);
      const { status, limit: lim } = req.query;
      const conditions = [];
      if (orgIds.length > 0) {
        conditions.push(inArray(contentReviewQueueTable.organizationId, orgIds));
      }
      if (status) conditions.push(eq(contentReviewQueueTable.status, status as string));
      const items = await db.select().from(contentReviewQueueTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(contentReviewQueueTable.createdAt))
        .limit(parseInt(lim as string) || 50);

      const total = await db.select({ count: drizzleSql<number>`count(*)` })
        .from(contentReviewQueueTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      res.json({ items, total: total[0]?.count || 0 });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch review queue" });
    }
  });


  app.get("/api/org-safety/review-queue/stats", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const orgIds = await getAdminOrgIds(userId);
      const orgFilter = orgIds.length > 0 ? inArray(contentReviewQueueTable.organizationId, orgIds) : undefined;

      const pending = await db.select({ count: drizzleSql<number>`count(*)` })
        .from(contentReviewQueueTable).where(and(eq(contentReviewQueueTable.status, "pending_review"), orgFilter));
      const approved = await db.select({ count: drizzleSql<number>`count(*)` })
        .from(contentReviewQueueTable).where(and(eq(contentReviewQueueTable.status, "approved"), orgFilter));
      const rejected = await db.select({ count: drizzleSql<number>`count(*)` })
        .from(contentReviewQueueTable).where(and(eq(contentReviewQueueTable.status, "rejected"), orgFilter));
      const high = await db.select({ count: drizzleSql<number>`count(*)` })
        .from(contentReviewQueueTable)
        .where(and(eq(contentReviewQueueTable.severity, "high"), eq(contentReviewQueueTable.status, "pending_review"), orgFilter));

      res.json({
        pending: pending[0]?.count || 0,
        approved: approved[0]?.count || 0,
        rejected: rejected[0]?.count || 0,
        highSeverityPending: high[0]?.count || 0,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch review stats" });
    }
  });


  app.patch("/api/org-safety/review-queue/:id", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      const { action, notes } = req.body;

      if (!["approved", "rejected", "archived"].includes(action)) {
        res.status(400).json({ error: "Invalid action" });
        return;
      }

      const orgIds = await getAdminOrgIds(userId);
      const [item] = await db.select().from(contentReviewQueueTable).where(eq(contentReviewQueueTable.id, id));
      if (!item) { res.status(404).json({ error: "Review item not found" }); return; }
      if (item.organizationId && orgIds.length > 0 && !orgIds.includes(item.organizationId)) {
        res.status(403).json({ error: "Not authorized for this organization's content" });
        return;
      }

      const [updated] = await db.update(contentReviewQueueTable)
        .set({ status: action, reviewedBy: userId, reviewedAt: new Date(), reviewAction: action, reviewNotes: notes || null })
        .where(eq(contentReviewQueueTable.id, id))
        .returning();

      await logAuditEvent({
        userId, action: `content_review_${action}`, category: "content_moderation",
        severity: action === "rejected" ? "warning" : "info",
        resourceType: "content_review", resourceId: id,
        details: { reviewAction: action, notes }, ipAddress: getClientIP(req),
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update review item" });
    }
  });


  app.post("/api/org-safety/review-queue/bulk", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { ids, action, notes } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) { res.status(400).json({ error: "No items selected" }); return; }
      if (!["approved", "rejected", "archived"].includes(action)) { res.status(400).json({ error: "Invalid action" }); return; }

      const orgIds = await getAdminOrgIds(userId);
      let updated = 0;
      for (const id of ids) {
        const [item] = await db.select().from(contentReviewQueueTable).where(eq(contentReviewQueueTable.id, id));
        if (item && (!item.organizationId || orgIds.includes(item.organizationId || ""))) {
          const [result] = await db.update(contentReviewQueueTable)
            .set({ status: action, reviewedBy: userId, reviewedAt: new Date(), reviewAction: action, reviewNotes: notes || null })
            .where(eq(contentReviewQueueTable.id, id))
            .returning();
          if (result) updated++;
        }
      }

      await logAuditEvent({
        userId, action: `bulk_content_review_${action}`, category: "content_moderation",
        severity: "info", details: { count: updated, action, ids }, ipAddress: getClientIP(req),
      });

      res.json({ updated, total: ids.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to bulk update review items" });
    }
  });


  app.get("/api/org-safety/audit-logs", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const orgIds = await getAdminOrgIds(userId);
      const { category, limit: lim } = req.query;

      const conditions = [];
      if (orgIds.length > 0) {
        conditions.push(inArray(auditLogsTable.organizationId, orgIds));
      }
      if (category && category !== "all") {
        conditions.push(eq(auditLogsTable.category, category as string));
      }

      const logs = await db.select().from(auditLogsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(auditLogsTable.createdAt))
        .limit(parseInt(lim as string) || 50);

      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });


  app.get("/api/org-safety/governance-status", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const orgIds = await getAdminOrgIds(userId);
      const orgFilter = orgIds.length > 0 ? inArray(successMarksTable.organizationId, orgIds) : undefined;

      const [totalMarks] = await db.select({ count: count() }).from(successMarksTable).where(orgFilter);
      const [finalizedMarks] = await db.select({ count: count() }).from(successMarksTable)
        .where(and(eq(successMarksTable.isMutable, false), orgFilter));

      const vaultOrgFilter = orgIds.length > 0 ? inArray(safetyVaultTable.senderTenantId, orgIds) : undefined;
      const [totalVault] = await db.select({ count: count() }).from(safetyVaultTable).where(vaultOrgFilter);
      const [blockedMessages] = await db.select({ count: count() }).from(safetyVaultTable)
        .where(and(eq(safetyVaultTable.isPiiBlocked, true), vaultOrgFilter));

      res.json({
        successLedger: { totalMarks: totalMarks.count, finalizedMarks: finalizedMarks.count, editWindowHours: 24 },
        safetyVault: { totalArchived: totalVault.count, piiBlocked: blockedMessages.count },
        coppaStatus: "enforced",
        piiProtection: "active",
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch governance status" });
    }
  });
}
