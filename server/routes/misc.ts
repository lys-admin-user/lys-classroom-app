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

import { ANALYZER_CTAS, ANALYZER_IDENTITIES, ANALYZER_SESSION_REGEX, ANALYZER_URGENCIES, APPROVED_VIDEO_HOSTS, MAX_TRIALS_PER_IP, TRIAL_DURATION_DAYS, TRIAL_RESET_MONTHS, US_STATES, analyzerBindSchema, analyzerCtaClickSchema, analyzerSubmitSchema, autoMatchSchema, createJourneyEntrySchema, createSisConnectionSchema, educatorProfileSchema, entityShareBodySchema, entriesQuerySchema, foundationModuleUpdateSchema, foundationProgressBodySchema, foundationQuizQuestionSchema, generateInviteCode, getAdminManagedOrgIds, getAdminOrgIds, getStateNameFromAbbr, getTrialSinceDate, isApprovedVideoUrl, isSiteAdmin, pillarParamSchema, requireFoundationAdmin, requirePaidTier, requireRssAdmin, requireSiteAdminForStandards, requireStaffOrAdmin, validOrgTypes, verifyOrgAdminAccess, videoUrlSchema } from "./_helpers";

// AUTO-SPLIT from server/routes.ts -- domain: misc (15 routes)
export function registerMiscRoutes(app: Express): void {


  app.patch("/api/requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      const updates = req.body;
      
      // Add reviewer info if status is being updated
      if (updates.status === "approved" || updates.status === "rejected") {
        updates.reviewedBy = userId;
        updates.reviewedAt = new Date();
      }
      
      const updated = await storage.updateScopeChangeRequest(id, updates);
      if (!updated) {
        res.status(404).json({ error: "Change request not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update change request" });
    }
  });


  // Get accommodation suggestions
  app.get("/api/accommodations/suggestions", isAuthenticated, async (req: any, res) => {
    try {
      const { type } = req.query;
      const { accommodationSuggestions } = await import("@shared/schema");
      const suggestions = type 
        ? accommodationSuggestions.filter(s => s.type === type)
        : accommodationSuggestions;
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get accommodation suggestions" });
    }
  });


  // Submit a resource report (any authenticated user)
  app.post("/api/resource-reports", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const { resourceId, reason, details } = req.body || {};
      const allowedReasons = ["broken_link", "expired", "scam_or_fee", "misleading", "privacy_concern", "other"];
      if (!resourceId || !reason || !allowedReasons.includes(reason)) {
        return res.status(400).json({ error: "resourceId and a valid reason are required" });
      }
      // Strip "know-" prefix if present
      const normalizedId = resourceId.startsWith("know-") ? resourceId.slice(5) : resourceId;
      const report = await storage.createResourceReport({ resourceId: normalizedId, userId, reason, details: details || null } as any);
      res.status(201).json(report);
    } catch (error) {
      console.error("Resource report error:", error);
      res.status(500).json({ error: "Failed to submit report" });
    }
  });


  app.get("/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });


  app.post("/paypal/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });


  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });


  // Get BLS sync status
  app.get("/api/bls-sync/status", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      if (user.role !== "system_admin" && user.role !== "campus_admin") {
        res.status(403).json({ error: "Admin access required" });
        return;
      }

      const lastSync = await getLastSyncStatus();
      const schedulerStatus = getSchedulerStatus();

      res.json({
        lastSync,
        scheduler: schedulerStatus,
      });
    } catch (error) {
      console.error("Failed to get BLS sync status:", error);
      res.status(500).json({ error: "Failed to get sync status" });
    }
  });


  // Get BLS sync history
  app.get("/api/bls-sync/history", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      if (user.role !== "system_admin" && user.role !== "campus_admin") {
        res.status(403).json({ error: "Admin access required" });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const history = await getSyncHistory(limit);

      res.json(history);
    } catch (error) {
      console.error("Failed to get BLS sync history:", error);
      res.status(500).json({ error: "Failed to get sync history" });
    }
  });


  // Trigger manual BLS sync (admin only)
  app.post("/api/bls-sync/trigger", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      if (user.role !== "system_admin") {
        res.status(403).json({ error: "System admin access required" });
        return;
      }

      const syncLog = await syncBlsData(user.id);
      res.json(syncLog);
    } catch (error) {
      console.error("Failed to trigger BLS sync:", error);
      res.status(500).json({ error: "Failed to trigger sync" });
    }
  });


  // ============ Content Filter Check (used internally) ============

  app.post("/api/content/check", isAuthenticated, async (req: any, res) => {
    try {
      const { content, contentType } = req.body;
      const userId = req.user?.claims?.sub;
      
      if (!content) {
        res.status(400).json({ error: "Content is required" });
        return;
      }
      
      const user = await storage.getUser(userId);
      const result = filterChatMessage(content, user?.role || "student");
      
      if (result.requiresReview) {
        await db.insert(contentReviewQueueTable).values({
          contentType: contentType || "message",
          sourceUserId: userId,
          sourceUserRole: user?.role || "unknown",
          content: content.substring(0, 5000),
          flaggedKeywords: result.matchedKeywords,
          severity: result.severity,
          status: result.autoBlock ? "auto_blocked" : "pending_review",
        });
        
        await logAuditEvent({
          userId,
          action: "content_flagged",
          category: "content_moderation",
          severity: result.severity === "high" ? "warning" : "info",
          details: { contentType, keywords: result.matchedKeywords, severity: result.severity },
          ipAddress: getClientIP(req),
        });
      }
      
      res.json({
        allowed: !result.autoBlock,
        flagged: result.flagged,
        severity: result.severity,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to check content" });
    }
  });


  // Rule 4: Data Residency Check
  app.get("/api/data-region", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const region = await db.select().from(userDataRegionsTable).where(eq(userDataRegionsTable.userId, userId));
      res.json(region[0] || { dataRegion: "global", note: "Region not yet determined" });
    } catch (error) {
      res.status(500).json({ error: "Failed to check data region" });
    }
  });


  app.get("/api/content-recommendations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bkdPillar = req.query.pillar as string | undefined;
      const limit = parseInt(req.query.limit as string) || 10;

      const journeyProgress = await storage.getStudentJourneyProgressByUserId(userId);
      const savedCareersData = await storage.getSavedCareers(userId);

      let targetPillar = bkdPillar;
      if (!targetPillar && journeyProgress) {
        const scores = {
          be: journeyProgress.beScore || 0,
          know: journeyProgress.knowScore || 0,
          do: journeyProgress.doScore || 0,
        };
        targetPillar = scores.be <= scores.know && scores.be <= scores.do ? "be"
          : scores.know <= scores.do ? "know" : "do";
      }

      const careerFields = savedCareersData.map((sc: any) => sc.careerField).filter(Boolean);

      const featured = await storage.getApprovedRssContentByPlacement("featured", {
        bkdPillar: targetPillar,
        careerFields: careerFields.length > 0 ? careerFields : undefined,
      });

      const know = await storage.getApprovedRssContentByPlacement("know_resource", {
        careerFields: careerFields.length > 0 ? careerFields : undefined,
      });

      const combined = [...featured, ...know]
        .filter((item, idx, arr) => arr.findIndex(i => i.id === item.id) === idx)
        .slice(0, limit);

      res.json(combined);
    } catch (error) {
      res.status(500).json({ error: "Failed to get content recommendations" });
    }
  });


  app.get("/api/foundation/modules", isAuthenticated, requireStaffOrAdmin, async (_req: any, res) => {
    try {
      const modules = await storage.getFoundationModules();
      res.json(modules);
    } catch (error) {
      res.status(500).json({ error: "Failed to load foundation modules" });
    }
  });


  app.get("/api/foundation/progress", isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const rows = await storage.getFoundationProgressForUser(userId);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to load foundation progress" });
    }
  });


  app.post("/api/foundation/progress", isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const parsed = foundationProgressBodySchema.parse(req.body);
      const row = await storage.recordFoundationProgress(
        userId,
        parsed.moduleSlug,
        parsed.action,
        parsed.quizScore
      );
      res.json(row);
    } catch (error: any) {
      if (error?.issues) return res.status(400).json({ error: "Invalid body", issues: error.issues });
      res.status(500).json({ error: "Failed to record progress" });
    }
  });
}
