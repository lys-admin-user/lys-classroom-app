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

// AUTO-SPLIT from server/routes.ts -- domain: admin (137 routes)
export function registerAdminRoutes(app: Express): void {


  // Get all pending change requests (for campus admin)
  app.get("/api/admin/change-requests", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const requests = await storage.getAllPendingChangeRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending change requests" });
    }
  });


  // Get all KNOW resources for admin (includes inactive)
  app.get("/api/admin/know-resources", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const user = req.user;
      const role = user?.role || user?.claims?.role;
      
      if (!["site_admin", "system_admin", "campus_admin"].includes(role)) {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      
      const { type, category } = req.query;
      const resources = await storage.getKnowResources({
        resourceType: type as string,
        category: category as string,
      });
      res.json(resources);
    } catch (error) {
      console.error("Failed to fetch admin KNOW resources:", error);
      res.status(500).json({ error: "Failed to fetch resources" });
    }
  });


  // Create KNOW resource (admin only)
  app.post("/api/admin/know-resources", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const user = req.user;
      const userId = user?.claims?.sub || user?.id;
      const role = user?.role || user?.claims?.role;
      
      if (!["site_admin", "system_admin", "campus_admin"].includes(role)) {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      
      const validationResult = insertKnowResourceSchema.safeParse({
        ...req.body,
        createdBy: userId,
      });
      
      if (!validationResult.success) {
        res.status(400).json({ error: "Invalid resource data", details: validationResult.error.flatten() });
        return;
      }
      
      const resource = await storage.createKnowResource(validationResult.data);
      res.json(resource);
    } catch (error) {
      console.error("Create KNOW resource error:", error);
      res.status(500).json({ error: "Failed to create resource" });
    }
  });


  // Update KNOW resource (admin only)
  app.patch("/api/admin/know-resources/:id", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const user = req.user;
      const userId = user?.claims?.sub || user?.id;
      const role = user?.role || user?.claims?.role;
      
      if (!["site_admin", "system_admin", "campus_admin"].includes(role)) {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      
      const { id } = req.params;
      
      const updateSchema = insertKnowResourceSchema.partial().omit({ createdBy: true });
      const validationResult = updateSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json({ error: "Invalid update data", details: validationResult.error.flatten() });
        return;
      }
      
      const updated = await storage.updateKnowResource(id, validationResult.data as any, userId);
      if (!updated) {
        res.status(404).json({ error: "Resource not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update resource" });
    }
  });


  // Delete KNOW resource (admin only)
  app.delete("/api/admin/know-resources/:id", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const user = req.user;
      const role = user?.role || user?.claims?.role;
      
      if (!["site_admin", "system_admin", "campus_admin"].includes(role)) {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      
      const { id } = req.params;
      await storage.deleteKnowResource(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete resource" });
    }
  });


  // Mark a single KNOW resource as verified today (admin)
  app.post("/api/admin/know-resources/:id/verify", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const updated = await storage.verifyKnowResource(req.params.id, userId);
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to verify resource" });
    }
  });


  // Bulk verify (admin)
  app.post("/api/admin/know-resources/bulk-verify", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids : [];
      const count = await storage.bulkVerifyKnowResources(ids, userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to bulk verify" });
    }
  });


  // ==========================================================================
  // Scholarship Scraper Admin Routes (system_admin only)
  // ==========================================================================
  app.get("/api/admin/scholarship-scrape/runs", isAuthenticated, requireSystemAdmin, async (_req: any, res) => {
    try {
      const runs = await storage.listScholarshipScrapeRuns({ limit: 25 });
      res.json(runs);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Failed to list scrape runs" });
    }
  });


  app.get("/api/admin/scholarship-scrape/institutions", isAuthenticated, requireSystemAdmin, async (req: any, res) => {
    try {
      const limit = Math.min(parseInt((req.query.limit as string) || "200", 10) || 200, 500);
      const offset = parseInt((req.query.offset as string) || "0", 10) || 0;
      const list = await storage.listInstitutions({ limit, offset });
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Failed to list institutions" });
    }
  });


  app.post("/api/admin/scholarship-scrape/run", isAuthenticated, requireSystemAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const { triggerScrape, isScrapeRunning } = await import("../scholarshipScraper/scheduler");
      if (isScrapeRunning()) return res.status(409).json({ error: "A scrape is already in progress." });
      // Run async; return immediately with the run id
      const result = await triggerScrape({ trigger: "manual", triggeredBy: userId });
      if (!result.ok) return res.status(500).json({ error: result.error });
      res.json({ runId: result.runId, summary: result.summary });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Failed to trigger scrape" });
    }
  });


  app.post("/api/admin/scholarship-scrape/seed-institutions", isAuthenticated, requireSystemAdmin, async (_req: any, res) => {
    try {
      const { refreshInstitutionsFromScorecard, seedInstitutionsFromJsonIfEmpty } = await import(
        "../scholarshipScraper/seedInstitutions"
      );
      // Try Scorecard first; fall back to JSON
      const scorecardResult = await refreshInstitutionsFromScorecard();
      if (scorecardResult.upserted > 0 || !scorecardResult.error) {
        return res.json({ source: "scorecard", ...scorecardResult });
      }
      const jsonResult = await seedInstitutionsFromJsonIfEmpty();
      res.json({ source: "json_fallback", scorecardError: scorecardResult.error, ...jsonResult });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Failed to seed institutions" });
    }
  });


  app.post("/api/admin/scholarship-scrape/discover-urls", isAuthenticated, requireSystemAdmin, async (req: any, res) => {
    try {
      const { discoverScholarshipUrls } = await import("../scholarshipScraper/discoverUrls");
      const limit = Math.min(parseInt((req.body?.limit as string) || "1000", 10) || 1000, 1000);
      const result = await discoverScholarshipUrls({ limit });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Failed to discover URLs" });
    }
  });


  app.patch("/api/admin/scholarship-scrape/institutions/:id", isAuthenticated, requireSystemAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const allowed: any = {};
      const body = req.body || {};
      if (typeof body.scholarshipUrl === "string") {
        allowed.scholarshipUrl = body.scholarshipUrl.trim() || null;
        allowed.scholarshipUrlDiscoveryStatus = allowed.scholarshipUrl ? "found" : "pending";
      }
      if (typeof body.isActive === "boolean") allowed.isActive = body.isActive;
      if (typeof body.notes === "string") allowed.notes = body.notes;
      const updated = await storage.updateInstitution(id, allowed);
      if (!updated) return res.status(404).json({ error: "Institution not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Failed to update institution" });
    }
  });


  app.delete("/api/admin/scholarship-scrape/institutions/:id", isAuthenticated, requireSystemAdmin, async (req: any, res) => {
    try {
      const ok = await storage.deleteInstitution(req.params.id);
      res.json({ ok });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Failed to delete institution" });
    }
  });


  // List resource reports (admin moderation queue)
  app.get("/api/admin/resource-reports", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const status = (req.query?.status as string) || "pending";
      const reports = await storage.listResourceReports({ status });
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to load reports" });
    }
  });


  // Resolve / dismiss a report (admin)
  app.patch("/api/admin/resource-reports/:id", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const status = req.body?.status === "dismissed" ? "dismissed" : "resolved";
      const updated = await storage.resolveResourceReport(req.params.id, userId, status);
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update report" });
    }
  });


  // Admin marketplace management (system_admin only)
  app.get("/api/admin/marketplace", isAuthenticated, async (req: any, res) => {
    try {
      const role = req.user?.role || req.user?.claims?.role;
      if (!["system_admin", "site_admin"].includes(role)) return res.status(403).json({ error: "Forbidden" });
      const items = await storage.getMarketplaceItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch marketplace items" });
    }
  });


  app.post("/api/admin/marketplace", isAuthenticated, async (req: any, res) => {
    try {
      const role = req.user?.role || req.user?.claims?.role;
      if (!["system_admin", "site_admin"].includes(role)) return res.status(403).json({ error: "Forbidden" });
      const userId = req.user?.id || req.user?.claims?.sub;
      const item = await storage.createMarketplaceItem({ ...req.body, publishedBy: userId });
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create marketplace item" });
    }
  });


  app.patch("/api/admin/marketplace/:id", isAuthenticated, async (req: any, res) => {
    try {
      const role = req.user?.role || req.user?.claims?.role;
      if (!["system_admin", "site_admin"].includes(role)) return res.status(403).json({ error: "Forbidden" });
      const item = await storage.updateMarketplaceItem(req.params.id, req.body);
      if (!item) return res.status(404).json({ error: "Item not found" });
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update marketplace item" });
    }
  });


  app.delete("/api/admin/marketplace/:id", isAuthenticated, async (req: any, res) => {
    try {
      const role = req.user?.role || req.user?.claims?.role;
      if (!["system_admin", "site_admin"].includes(role)) return res.status(403).json({ error: "Forbidden" });
      await storage.deleteMarketplaceItem(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete marketplace item" });
    }
  });


  // Create matriculation event (admin only)
  app.post("/api/admin/matriculation", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const user = req.user;
      const role = user?.role || user?.claims?.role;
      const userId = user?.claims?.sub || user?.id;
      
      if (!["site_admin", "system_admin", "campus_admin"].includes(role)) {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      
      const { insertStudentMatriculationHistorySchema } = await import("@shared/schema");
      const parseResult = insertStudentMatriculationHistorySchema.safeParse({
        ...req.body,
        createdBy: userId,
      });
      
      if (!parseResult.success) {
        res.status(400).json({ error: "Invalid data", details: parseResult.error.format() });
        return;
      }
      
      const event = await storage.createMatriculationEvent(parseResult.data);
      res.status(201).json(event);
    } catch (error) {
      console.error("Create matriculation event error:", error);
      res.status(500).json({ error: "Failed to create matriculation event" });
    }
  });


  // Get matriculation events by organization (admin)
  app.get("/api/admin/matriculation/org/:orgId", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const user = req.user;
      const role = user?.role || user?.claims?.role;
      
      if (!["site_admin", "system_admin", "campus_admin"].includes(role)) {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      
      const { orgId } = req.params;
      const events = await storage.getMatriculationEventsByOrg(orgId);
      res.json(events);
    } catch (error) {
      console.error("Get org matriculation error:", error);
      res.status(500).json({ error: "Failed to get matriculation events" });
    }
  });


  // Get matriculation statistics (admin)
  app.get("/api/admin/matriculation/stats", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const user = req.user;
      const role = user?.role || user?.claims?.role;
      
      if (!["site_admin", "system_admin"].includes(role)) {
        res.status(403).json({ error: "System admin access required" });
        return;
      }
      
      const { organizationId, academicYear } = req.query;
      const stats = await storage.getMatriculationStats({
        organizationId: organizationId as string,
        academicYear: academicYear as string,
      });
      res.json(stats);
    } catch (error) {
      console.error("Get matriculation stats error:", error);
      res.status(500).json({ error: "Failed to get matriculation stats" });
    }
  });


  // Admin: Create system achievement
  app.post("/api/admin/achievements", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const user = req.user;
      const role = user?.role || user?.claims?.role;
      const userId = user?.claims?.sub || user?.id;
      
      if (!["site_admin", "system_admin"].includes(role)) {
        res.status(403).json({ error: "System admin access required" });
        return;
      }
      
      const { insertSystemAchievementSchema } = await import("@shared/schema");
      const parseResult = insertSystemAchievementSchema.safeParse({
        ...req.body,
        createdBy: userId,
      });
      
      if (!parseResult.success) {
        res.status(400).json({ error: "Invalid data", details: parseResult.error.format() });
        return;
      }
      
      const achievement = await storage.createSystemAchievement(parseResult.data);
      res.status(201).json(achievement);
    } catch (error) {
      console.error("Create achievement error:", error);
      res.status(500).json({ error: "Failed to create achievement" });
    }
  });


  // Admin: Update system achievement
  app.patch("/api/admin/achievements/:id", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const user = req.user;
      const role = user?.role || user?.claims?.role;
      
      if (!["site_admin", "system_admin"].includes(role)) {
        res.status(403).json({ error: "System admin access required" });
        return;
      }
      
      const { id } = req.params;
      const { insertSystemAchievementSchema } = await import("@shared/schema");
      const parseResult = insertSystemAchievementSchema.partial().safeParse(req.body);
      
      if (!parseResult.success) {
        res.status(400).json({ error: "Invalid data", details: parseResult.error.format() });
        return;
      }
      
      const updated = await storage.updateSystemAchievement(id, parseResult.data as any);
      if (!updated) {
        res.status(404).json({ error: "Achievement not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error("Update achievement error:", error);
      res.status(500).json({ error: "Failed to update achievement" });
    }
  });


  // Admin: Delete system achievement
  app.delete("/api/admin/achievements/:id", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const user = req.user;
      const role = user?.role || user?.claims?.role;
      
      if (!["site_admin", "system_admin"].includes(role)) {
        res.status(403).json({ error: "System admin access required" });
        return;
      }
      
      const { id } = req.params;
      await storage.deleteSystemAchievement(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete achievement error:", error);
      res.status(500).json({ error: "Failed to delete achievement" });
    }
  });


  // Verify achievement (admin only)
  app.post("/api/admin/achievements/:id/verify", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const user = req.user;
      const role = user?.role || user?.claims?.role;
      const userId = user?.claims?.sub || user?.id;
      
      if (!["site_admin", "system_admin", "campus_admin"].includes(role)) {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      
      const { id } = req.params;
      const verified = await storage.verifyAchievement(id, userId);
      if (!verified) {
        res.status(404).json({ error: "Achievement not found" });
        return;
      }
      res.json(verified);
    } catch (error) {
      console.error("Verify achievement error:", error);
      res.status(500).json({ error: "Failed to verify achievement" });
    }
  });


  // Revoke achievement (admin only)
  app.post("/api/admin/achievements/:id/revoke", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const user = req.user;
      const role = user?.role || user?.claims?.role;
      
      if (!["site_admin", "system_admin", "campus_admin"].includes(role)) {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      
      const { id } = req.params;
      const { reason } = req.body;
      
      if (!reason) {
        res.status(400).json({ error: "Reason is required for revocation" });
        return;
      }
      
      const revoked = await storage.revokeAchievement(id, reason);
      if (!revoked) {
        res.status(404).json({ error: "Achievement not found" });
        return;
      }
      res.json(revoked);
    } catch (error) {
      console.error("Revoke achievement error:", error);
      res.status(500).json({ error: "Failed to revoke achievement" });
    }
  });


  // Get achievement statistics (admin)
  app.get("/api/admin/achievements/stats", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const user = req.user;
      const role = user?.role || user?.claims?.role;
      
      if (!["site_admin", "system_admin"].includes(role)) {
        res.status(403).json({ error: "System admin access required" });
        return;
      }
      
      const { organizationId, academicYear } = req.query;
      const stats = await storage.getAchievementStats({
        organizationId: organizationId as string,
        academicYear: academicYear as string,
      });
      res.json(stats);
    } catch (error) {
      console.error("Get achievement stats error:", error);
      res.status(500).json({ error: "Failed to get achievement stats" });
    }
  });


  // Get sync status and statistics
  app.get("/api/admin/standards/status", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      if (!await requireSiteAdminForStandards(req, res)) return;
      const status = await getSyncStatus();
      res.json(status);
    } catch (error) {
      console.error("Get standards status error:", error);
      res.status(500).json({ error: "Failed to get standards status" });
    }
  });


  // Get all jurisdictions (from database) - admin version
  app.get("/api/admin/standards/jurisdictions", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      if (!await requireSiteAdminForStandards(req, res)) return;
      const country = req.query.country as string | undefined;
      const jurisdictions = await storage.getJurisdictions(country);
      res.json(jurisdictions);
    } catch (error) {
      console.error("Get jurisdictions error:", error);
      res.status(500).json({ error: "Failed to get jurisdictions" });
    }
  });


  // Get standard sets for a jurisdiction
  app.get("/api/admin/standards/jurisdictions/:id/sets", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      if (!await requireSiteAdminForStandards(req, res)) return;
      const { id } = req.params;
      const sets = await storage.getStandardSets(id);
      res.json(sets);
    } catch (error) {
      console.error("Get standard sets error:", error);
      res.status(500).json({ error: "Failed to get standard sets" });
    }
  });


  // Get individual standards for a standard set
  app.get("/api/admin/standards/sets/:id/standards", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      if (!await requireSiteAdminForStandards(req, res)) return;
      const { id } = req.params;
      const standards = await storage.getEducationalStandards(id);
      res.json(standards);
    } catch (error) {
      console.error("Get standards error:", error);
      res.status(500).json({ error: "Failed to get standards" });
    }
  });


  // Sync jurisdictions from CSP (Tier 1)
  app.post("/api/admin/standards/sync/jurisdictions", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      if (!await requireSiteAdminForStandards(req, res)) return;
      const userId = req.user?.claims?.sub;
      const result = await syncJurisdictionsFromCSP(userId);
      res.json(result);
    } catch (error) {
      console.error("Sync jurisdictions error:", error);
      res.status(500).json({ error: "Failed to sync jurisdictions" });
    }
  });


  // Sync a specific standard set from CSP
  app.post("/api/admin/standards/sync/standard-set", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      if (!await requireSiteAdminForStandards(req, res)) return;
      const userId = req.user?.claims?.sub;
      const { externalSetId, jurisdictionId } = req.body;
      
      if (!externalSetId || !jurisdictionId) {
        res.status(400).json({ error: "Missing externalSetId or jurisdictionId" });
        return;
      }
      
      const result = await syncStandardSetFromCSP(externalSetId, jurisdictionId, userId);
      res.json(result);
    } catch (error) {
      console.error("Sync standard set error:", error);
      res.status(500).json({ error: "Failed to sync standard set" });
    }
  });


  // Get available jurisdictions from CSP API (for discovery)
  app.get("/api/admin/standards/csp/jurisdictions", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      if (!await requireSiteAdminForStandards(req, res)) return;
      const jurisdictions = await fetchCSPJurisdictions();
      res.json(jurisdictions);
    } catch (error) {
      console.error("Fetch CSP jurisdictions error:", error);
      res.status(500).json({ error: "Failed to fetch CSP jurisdictions" });
    }
  });


  // Get sync logs
  app.get("/api/admin/standards/sync-logs", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      if (!await requireSiteAdminForStandards(req, res)) return;
      const limit = parseInt(req.query.limit as string) || 20;
      const logs = await storage.getLatestSyncLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Get sync logs error:", error);
      res.status(500).json({ error: "Failed to get sync logs" });
    }
  });


  // Full import of all standards from all jurisdictions
  app.post("/api/admin/standards/sync/full-import", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      if (!await requireSiteAdminForStandards(req, res)) return;
      const userId = req.user?.claims?.sub;
      // Start import in background and return immediately
      syncAllStandardsFromCSP(userId).catch(err => {
        console.error("Full import failed:", err);
      });
      res.json({ 
        message: "Full import started. Use GET /api/admin/standards/import-progress to track progress.",
        status: "started" 
      });
    } catch (error) {
      console.error("Start full import error:", error);
      res.status(500).json({ error: "Failed to start full import" });
    }
  });


  // Get import progress
  app.get("/api/admin/standards/import-progress", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      if (!await requireSiteAdminForStandards(req, res)) return;
      const progress = getImportProgress();
      res.json(progress);
    } catch (error) {
      console.error("Get import progress error:", error);
      res.status(500).json({ error: "Failed to get import progress" });
    }
  });


  // ================================
  // Standards Staging Queue (Approval Workflow)
  // ================================

  // Get staging standards (pending, approved, rejected)
  app.get("/api/admin/standards/staging", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      if (!await requireSiteAdminForStandards(req, res)) return;
      const status = req.query.status as string | undefined;
      const staging = await storage.getStagingStandards(status);
      res.json(staging);
    } catch (error) {
      console.error("Get staging standards error:", error);
      res.status(500).json({ error: "Failed to get staging standards" });
    }
  });


  // Approve a staging standard
  app.post("/api/admin/standards/staging/:id/approve", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      if (!await requireSiteAdminForStandards(req, res)) return;
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const result = await storage.approveStagingStandard(id, userId);
      if (!result) {
        res.status(404).json({ error: "Staging standard not found" });
        return;
      }
      res.json({ success: true, standard: result });
    } catch (error) {
      console.error("Approve staging error:", error);
      res.status(500).json({ error: "Failed to approve staging standard" });
    }
  });


  // Reject a staging standard
  app.post("/api/admin/standards/staging/:id/reject", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      if (!await requireSiteAdminForStandards(req, res)) return;
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const { reason } = req.body;
      const result = await storage.rejectStagingStandard(id, userId, reason || "No reason provided");
      if (!result) {
        res.status(404).json({ error: "Staging standard not found" });
        return;
      }
      res.json({ success: true, staging: result });
    } catch (error) {
      console.error("Reject staging error:", error);
      res.status(500).json({ error: "Failed to reject staging standard" });
    }
  });


  // Bulk approve staging standards
  app.post("/api/admin/standards/staging/bulk-approve", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      if (!await requireSiteAdminForStandards(req, res)) return;
      const userId = req.user?.claims?.sub;
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ error: "No IDs provided" });
        return;
      }
      let approved = 0;
      for (const id of ids) {
        const result = await storage.approveStagingStandard(id, userId);
        if (result) approved++;
      }
      res.json({ success: true, approved });
    } catch (error) {
      console.error("Bulk approve error:", error);
      res.status(500).json({ error: "Failed to bulk approve" });
    }
  });


  // ================================
  // LLM Extraction (Tier 3)
  // ================================

  // Extract standards from text using LLM
  app.post("/api/admin/standards/extract", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      if (!await requireSiteAdminForStandards(req, res)) return;
      const { rawText, jurisdictionName, subject, gradeLevel } = req.body;
      if (!rawText || !jurisdictionName) {
        res.status(400).json({ error: "Missing rawText or jurisdictionName" });
        return;
      }
      const result = await extractStandardsFromText(rawText, jurisdictionName, subject, gradeLevel);
      res.json(result);
    } catch (error) {
      console.error("LLM extraction error:", error);
      res.status(500).json({ error: "Failed to extract standards" });
    }
  });


  // Process a PDF import
  app.post("/api/admin/standards/pdf/:id/process", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      if (!await requireSiteAdminForStandards(req, res)) return;
      const { id } = req.params;
      const result = await processPdfImport(id);
      res.json(result);
    } catch (error) {
      console.error("PDF process error:", error);
      res.status(500).json({ error: "Failed to process PDF" });
    }
  });


  // ================================
  // Change Detection (Watchdog)
  // ================================

  // Check a source URL for changes
  app.post("/api/admin/standards/check-source", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      if (!await requireSiteAdminForStandards(req, res)) return;
      const { sourceUrl } = req.body;
      if (!sourceUrl) {
        res.status(400).json({ error: "Missing sourceUrl" });
        return;
      }
      const result = await checkSourceForChanges(sourceUrl);
      res.json(result);
    } catch (error) {
      console.error("Check source error:", error);
      res.status(500).json({ error: "Failed to check source" });
    }
  });


  // Get all sources with detected changes
  app.get("/api/admin/standards/changed-sources", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      if (!await requireSiteAdminForStandards(req, res)) return;
      const sources = await storage.getChangedSources();
      res.json(sources);
    } catch (error) {
      console.error("Get changed sources error:", error);
      res.status(500).json({ error: "Failed to get changed sources" });
    }
  });


  // Deprecate a standard (soft delete)
  app.post("/api/admin/standards/:id/deprecate", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      if (!await requireSiteAdminForStandards(req, res)) return;
      const { id } = req.params;
      const result = await storage.deprecateStandard(id);
      if (!result) {
        res.status(404).json({ error: "Standard not found" });
        return;
      }
      res.json({ success: true, standard: result });
    } catch (error) {
      console.error("Deprecate standard error:", error);
      res.status(500).json({ error: "Failed to deprecate standard" });
    }
  });


  // Check if current user is site admin
  app.get("/api/admin/check", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const isAdmin = await storage.isSiteAdmin(userId);
      res.json({ isSiteAdmin: isAdmin });
    } catch (error) {
      res.status(500).json({ error: "Failed to check admin status" });
    }
  });


  // Get all site admins (site admin only)
  app.get("/api/admin/site-admins", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const admins = await storage.getSiteAdmins();
      res.json(admins);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch site admins" });
    }
  });


  // Add site admin (site admin only)
  app.post("/api/admin/site-admins", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { userId, permissions } = req.body;
      const createdBy = req.user?.claims?.sub;
      const admin = await storage.createSiteAdmin({ userId, permissions, createdBy });
      res.json(admin);
    } catch (error) {
      res.status(500).json({ error: "Failed to create site admin" });
    }
  });


  // Remove site admin (site admin only)
  app.delete("/api/admin/site-admins/:userId", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      await storage.deleteSiteAdmin(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove site admin" });
    }
  });


  // Get all organizations (site admin only)
  app.get("/api/admin/organizations", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const orgs = await storage.getOrganizations();
      res.json(orgs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });


  // Create organization (site admin only)
  app.post("/api/admin/organizations", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const org = await storage.createOrganization(req.body);
      res.json(org);
    } catch (error) {
      console.error("Create org error:", error);
      res.status(500).json({ error: "Failed to create organization" });
    }
  });


  // Add new jurisdiction for standards (site admin only)
  app.post("/api/admin/jurisdictions", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { country, name, abbreviation, standardsName } = req.body;
      
      if (!country || !name || !abbreviation) {
        res.status(400).json({ error: "Country, name, and abbreviation are required" });
        return;
      }
      
      // Check if jurisdiction already exists
      const existing = await storage.getJurisdictions(country);
      if (existing.some(j => j.name === name || j.abbreviation === abbreviation)) {
        res.status(400).json({ error: "Jurisdiction with this name or abbreviation already exists" });
        return;
      }
      
      // Create new jurisdiction
      const jurisdiction = await storage.createJurisdiction({
        country,
        name,
        abbreviation,
        standardsName: standardsName || `${name} Standards`,
        source: 'manual',
        externalId: null,
        sourceUrl: null,
      });
      
      res.json(jurisdiction);
    } catch (error) {
      console.error("Create jurisdiction error:", error);
      res.status(500).json({ error: "Failed to create jurisdiction" });
    }
  });


  // Update organization (site admin only)
  app.patch("/api/admin/organizations/:id", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updated = await storage.updateOrganization(id, req.body);
      if (!updated) {
        res.status(404).json({ error: "Organization not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update organization" });
    }
  });


  // Delete organization (site admin only)
  app.delete("/api/admin/organizations/:id", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteOrganization(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete organization" });
    }
  });


  // =============== Feature Flags Routes ===============
  
  // Get all feature flags (site admin only)
  app.get("/api/admin/feature-flags", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const flags = await storage.getFeatureFlags();
      res.json(flags);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch feature flags" });
    }
  });


  // Create feature flag (site admin only)
  app.post("/api/admin/feature-flags", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const parsed = insertFeatureFlagSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid feature flag data", details: parsed.error.flatten() });
        return;
      }
      const flag = await storage.createFeatureFlag(parsed.data);
      res.json(flag);
    } catch (error) {
      res.status(500).json({ error: "Failed to create feature flag" });
    }
  });


  // Update feature flag (site admin only)
  app.patch("/api/admin/feature-flags/:id", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updateSchema = insertFeatureFlagSchema.partial();
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid feature flag data", details: parsed.error.flatten() });
        return;
      }
      const updated = await storage.updateFeatureFlag(id, parsed.data as any);
      if (!updated) {
        res.status(404).json({ error: "Feature flag not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update feature flag" });
    }
  });


  // Delete feature flag (site admin only)
  app.delete("/api/admin/feature-flags/:id", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteFeatureFlag(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete feature flag" });
    }
  });


  // =============== Email Templates Routes ===============
  
  // Get all email templates (site admin only)
  app.get("/api/admin/email-templates", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const templates = await storage.getEmailTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch email templates" });
    }
  });


  // Create email template (site admin only)
  app.post("/api/admin/email-templates", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const parsed = insertEmailTemplateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid email template data", details: parsed.error.flatten() });
        return;
      }
      const template = await storage.createEmailTemplate(parsed.data);
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to create email template" });
    }
  });


  // Update email template (site admin only)
  app.patch("/api/admin/email-templates/:id", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updateSchema = insertEmailTemplateSchema.partial();
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid email template data", details: parsed.error.flatten() });
        return;
      }
      const updated = await storage.updateEmailTemplate(id, parsed.data as any);
      if (!updated) {
        res.status(404).json({ error: "Email template not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update email template" });
    }
  });


  // Delete email template (site admin only)
  app.delete("/api/admin/email-templates/:id", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmailTemplate(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete email template" });
    }
  });


  // ===========================================
  // SYSTEM LESSON AUTHORS (Site Admin Only)
  // ===========================================
  
  app.get("/api/admin/lesson-authors", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const authors = await storage.getSystemLessonAuthors();
      // Enrich with user details
      const enrichedAuthors = await Promise.all(
        authors.map(async (author) => {
          const user = await storage.getUser(author.userId);
          return { ...author, user };
        })
      );
      res.json(enrichedAuthors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lesson authors" });
    }
  });

  
  app.post("/api/admin/lesson-authors", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const adminId = req.user?.claims?.sub;
      const { userId, specializations, bio } = req.body;
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      
      // Check if already an author
      const existing = await storage.getSystemLessonAuthor(userId);
      if (existing) {
        res.status(400).json({ error: "User is already a lesson author" });
        return;
      }
      
      const author = await storage.createSystemLessonAuthor({
        userId,
        authorizedBy: adminId,
        specializations: specializations || [],
        bio: bio || null,
        status: "active"
      });
      
      res.json(author);
    } catch (error) {
      res.status(500).json({ error: "Failed to create lesson author" });
    }
  });

  
  app.patch("/api/admin/lesson-authors/:userId", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      const updated = await storage.updateSystemLessonAuthor(userId, updates);
      if (!updated) {
        res.status(404).json({ error: "Lesson author not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update lesson author" });
    }
  });

  
  app.delete("/api/admin/lesson-authors/:userId", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      await storage.deleteSystemLessonAuthor(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove lesson author" });
    }
  });


  // ===========================================
  // MASTER LESSONS REPOSITORY
  // ===========================================
  
  // Get all master lessons (Site Admin or Lesson Author)
  app.get("/api/admin/master-lessons", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      const isAuthor = await storage.isSystemLessonAuthor(userId);
      
      if (!isSiteAdminUser && !isAuthor) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      
      const { subject, gradeLevel, status } = req.query;
      const lessons = await storage.getMasterLessons({ 
        subject: subject as string, 
        gradeLevel: gradeLevel as string, 
        status: status as string 
      });
      
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch master lessons" });
    }
  });

  
  // Get single master lesson
  app.get("/api/admin/master-lessons/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      const isAuthor = await storage.isSystemLessonAuthor(userId);
      
      if (!isSiteAdminUser && !isAuthor) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      
      const { id } = req.params;
      const lesson = await storage.getMasterLesson(id);
      
      if (!lesson) {
        res.status(404).json({ error: "Lesson not found" });
        return;
      }
      
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });

  
  // Calculate quality score for a lesson
  app.get("/api/admin/master-lessons/:id/quality-score", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      
      if (!isSiteAdminUser) {
        res.status(403).json({ error: "Site admin access required" });
        return;
      }
      
      const { id } = req.params;
      const lesson = await storage.getMasterLesson(id);
      
      if (!lesson) {
        res.status(404).json({ error: "Lesson not found" });
        return;
      }
      
      const qualityResult = calculateLessonQualityScore(lesson);
      const qualityLevel = getQualityLevel(qualityResult.percentage);
      
      res.json({
        ...qualityResult,
        qualityLevel,
        lessonId: id,
        lessonTitle: lesson.title,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate quality score" });
    }
  });

  
  // Approve master lesson (Site Admin only)
  app.post("/api/admin/master-lessons/:id/approve", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const reviewerId = req.user?.claims?.sub;
      const { id } = req.params;
      const { notes } = req.body;
      
      const existingLesson = await storage.getMasterLesson(id);
      if (!existingLesson) {
        res.status(404).json({ error: "Lesson not found" });
        return;
      }
      
      const qualityResult = calculateLessonQualityScore(existingLesson);
      const computedQualityScore = qualityResult.percentage;
      
      const lesson = await storage.approveMasterLesson(id, reviewerId, notes, computedQualityScore);
      if (!lesson) {
        res.status(404).json({ error: "Failed to approve lesson" });
        return;
      }
      
      res.json({ ...lesson, qualityBreakdown: qualityResult });
    } catch (error) {
      res.status(500).json({ error: "Failed to approve lesson" });
    }
  });

  
  // Reject master lesson (Site Admin only)
  app.post("/api/admin/master-lessons/:id/reject", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const reviewerId = req.user?.claims?.sub;
      const { id } = req.params;
      const { notes } = req.body;
      
      if (!notes) {
        res.status(400).json({ error: "Rejection notes are required" });
        return;
      }
      
      const lesson = await storage.rejectMasterLesson(id, reviewerId, notes);
      if (!lesson) {
        res.status(404).json({ error: "Lesson not found" });
        return;
      }
      
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject lesson" });
    }
  });

  
  // Delete master lesson
  app.delete("/api/admin/master-lessons/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      const lesson = await storage.getMasterLesson(id);
      
      if (!lesson) {
        res.status(404).json({ error: "Lesson not found" });
        return;
      }
      
      // Only author or site admin can delete
      if (lesson.authorId !== userId && !isSiteAdminUser) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      
      await storage.deleteMasterLesson(id, lesson.authorId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lesson" });
    }
  });


  // ===========================================
  // CONTENT LIBRARY (Site Admin Only)
  // ===========================================
  
  app.get("/api/admin/content-library", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { contentType, isActive } = req.query;
      const items = await storage.getContentLibraryItems({
        contentType: contentType as string,
        isActive: isActive === "true" ? true : isActive === "false" ? false : undefined
      });
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content library" });
    }
  });

  
  app.get("/api/admin/content-library/:id", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const item = await storage.getContentLibraryItem(id);
      if (!item) {
        res.status(404).json({ error: "Content not found" });
        return;
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  
  app.post("/api/admin/content-library", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const contentData = { ...req.body, uploadedBy: userId };
      const item = await storage.createContentLibraryItem(contentData);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create content" });
    }
  });

  
  app.patch("/api/admin/content-library/:id", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updated = await storage.updateContentLibraryItem(id, req.body);
      if (!updated) {
        res.status(404).json({ error: "Content not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update content" });
    }
  });

  
  app.delete("/api/admin/content-library/:id", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteContentLibraryItem(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete content" });
    }
  });


  // ===========================================
  // LESSON BULK IMPORTS (Site Admin Only)
  // ===========================================
  
  app.get("/api/admin/bulk-imports", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const imports = await storage.getLessonBulkImports();
      res.json(imports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bulk imports" });
    }
  });

  
  app.post("/api/admin/bulk-imports", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { fileName, fileType, lessons } = req.body;
      
      // Create import record
      const importRecord = await storage.createLessonBulkImport({
        uploadedBy: userId,
        fileName,
        fileType,
        totalRecords: lessons?.length || 0,
        status: "processing"
      });
      
      // Process lessons in background (simplified for now)
      let successCount = 0;
      let errorCount = 0;
      const errors: { row: number; field: string; message: string }[] = [];
      
      if (lessons && Array.isArray(lessons)) {
        for (let i = 0; i < lessons.length; i++) {
          try {
            const lesson = lessons[i];
            // Validate required fields
            if (!lesson.title || !lesson.topic || !lesson.subject || !lesson.gradeLevel) {
              errors.push({ row: i + 1, field: "required", message: "Missing required fields" });
              errorCount++;
              continue;
            }
            
            // Create master lesson from import
            await storage.createMasterLesson({
              authorId: userId,
              title: lesson.title,
              description: lesson.description || null,
              topic: lesson.topic,
              subject: lesson.subject,
              gradeLevel: lesson.gradeLevel,
              gradeBand: lesson.gradeBand || null,
              bkdFocus: lesson.bkdFocus || "integrated",
              standards: lesson.standards || [],
              duration: lesson.duration || "45 minutes",
              objectives: lesson.objectives || [],
              activities: lesson.activities || [],
              materials: lesson.materials || [],
              assessment: lesson.assessment || "",
              reflection: lesson.reflection || null,
              lysMethodology: lesson.lysMethodology || null,
              tags: lesson.tags || [],
              status: "pending_review"
            });
            successCount++;
          } catch (err) {
            errors.push({ row: i + 1, field: "system", message: "Failed to create lesson" });
            errorCount++;
          }
        }
      }
      
      // Update import record
      const updatedImport = await storage.updateLessonBulkImport(importRecord.id, {
        successCount,
        errorCount,
        errors,
        status: "completed",
        completedAt: new Date()
      });
      
      res.json(updatedImport);
    } catch (error) {
      res.status(500).json({ error: "Failed to process bulk import" });
    }
  });


  // Get organization members (site admin or org admin)
  app.get("/api/admin/organizations/:id/members", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      const isCampusOrHigher = user && ["campus_admin", "district_admin", "site_admin", "system_admin"].includes(user.role || "");
      const membership = await storage.getOrgMembership(id, userId);
      
      if (!isSiteAdminUser && !isCampusOrHigher && (!membership || membership.role === "member")) {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      
      const members = await storage.getOrganizationMembers(id);
      const enrichedMembers = await Promise.all(
        members.map(async (m) => {
          const memberUser = await storage.getUser(m.userId);
          return {
            ...m,
            user: memberUser ? {
              id: memberUser.id,
              email: memberUser.email,
              firstName: memberUser.firstName,
              lastName: memberUser.lastName,
              role: memberUser.role,
              profileImageUrl: memberUser.profileImageUrl,
            } : null,
          };
        })
      );
      res.json(enrichedMembers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });


  // Get organization invitations (site admin or org admin)
  app.get("/api/admin/organizations/:id/invitations", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      const isCampusOrHigher = user && ["campus_admin", "district_admin", "site_admin", "system_admin"].includes(user.role || "");
      const membership = await storage.getOrgMembership(id, userId);
      
      if (!isSiteAdminUser && !isCampusOrHigher && (!membership || membership.role === "member")) {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      
      const invitations = await storage.getOrgInvitations(id);
      const pending = invitations.filter(inv => !inv.acceptedAt && new Date(inv.expiresAt) > new Date());
      res.json(pending);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invitations" });
    }
  });


  // Platform statistics for site admin dashboard
  app.get("/api/admin/stats", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const orgs = await storage.getOrganizations();
      const admins = await storage.getSiteAdmins();
      
      res.json({
        totalOrganizations: orgs.length,
        activeOrganizations: orgs.filter(o => o.status === "active").length,
        totalSiteAdmins: admins.length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });


  // ============ Enhanced System Admin Dashboard Routes ============

  // Get comprehensive platform analytics
  app.get("/api/admin/analytics", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const allUsers = await db.select().from(users);
      const allLessons = await db.select().from(lessons);
      const allAffiliates = await db.select().from(educatorAffiliates);
      const allOrgs = await storage.getOrganizations();
      const allGoals = await db.select().from(goals);
      
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const recentUsers = allUsers.filter(u => u.createdAt && new Date(u.createdAt) > thirtyDaysAgo);
      const weeklyUsers = allUsers.filter(u => u.createdAt && new Date(u.createdAt) > sevenDaysAgo);
      
      const tierBreakdown = {
        free: allUsers.filter(u => u.tier === "free").length,
        pro: allUsers.filter(u => u.tier === "pro").length,
        campus: allUsers.filter(u => u.tier === "campus").length,
        enterprise: allUsers.filter(u => u.tier === "enterprise").length,
      };
      
      const roleBreakdown = {
        student: allUsers.filter(u => u.role === "student").length,
        educator: allUsers.filter(u => u.role === "educator").length,
        campus_admin: allUsers.filter(u => u.role === "campus_admin").length,
      };
      
      const affiliateStats = {
        total: allAffiliates.length,
        active: allAffiliates.filter(a => a.isActive).length,
        totalPoints: allAffiliates.reduce((sum, a) => sum + (a.totalPoints || 0), 0),
        totalReferrals: allAffiliates.reduce((sum, a) => sum + (a.totalReferrals || 0), 0),
        totalViews: allAffiliates.reduce((sum, a) => sum + (a.totalViews || 0), 0),
        totalShares: allAffiliates.reduce((sum, a) => sum + (a.totalShares || 0), 0),
      };
      
      res.json({
        users: {
          total: allUsers.length,
          newThisMonth: recentUsers.length,
          newThisWeek: weeklyUsers.length,
          byTier: tierBreakdown,
          byRole: roleBreakdown,
        },
        content: {
          totalLessons: allLessons.length,
          totalGoals: allGoals.length,
        },
        organizations: {
          total: allOrgs.length,
          active: allOrgs.filter(o => o.status === "active").length,
          byType: {
            school: allOrgs.filter(o => o.type === "school").length,
            district: allOrgs.filter(o => o.type === "district").length,
            university: allOrgs.filter(o => o.type === "university").length,
          },
        },
        affiliates: affiliateStats,
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });


  // Exec KPIs — additive endpoint that powers the "Exec KPIs" tab on the
  // System Admin page. Returns 12 weeks of signups + lessons, conversion and
  // churn proxies, and visibility into the top-of-funnel: anonymous guests
  // who generated lessons but never created an account, and trials that
  // started but were never bound to a signup.
  app.get("/api/admin/exec-metrics", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const now = new Date();
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      const twelveWeeksAgo = new Date(now.getTime() - 12 * msPerWeek);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [allUsers, allLessons, allTrials, allGuests] = await Promise.all([
        db.select().from(users),
        db.select().from(lessons),
        db.select().from(freeTrials),
        db.select().from(guestLessonGenerations),
      ]);

      // Weekly buckets: anchor each row at the Sunday on/before the timestamp,
      // then group counts by that ISO date string. We seed all 12 weeks first
      // so weeks with zero activity still appear in the chart.
      const weekStartOf = (d: Date) => {
        const c = new Date(d);
        c.setHours(0, 0, 0, 0);
        c.setDate(c.getDate() - c.getDay()); // Sunday
        return c.toISOString().slice(0, 10);
      };
      const seedWeeks = (): Record<string, number> => {
        const out: Record<string, number> = {};
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getTime() - i * msPerWeek);
          out[weekStartOf(d)] = 0;
        }
        return out;
      };
      const signupBuckets = seedWeeks();
      for (const u of allUsers) {
        if (!u.createdAt) continue;
        const created = new Date(u.createdAt);
        if (created < twelveWeeksAgo) continue;
        const k = weekStartOf(created);
        if (k in signupBuckets) signupBuckets[k] += 1;
      }
      const lessonBuckets = seedWeeks();
      for (const l of allLessons) {
        if (!l.createdAt) continue;
        const created = new Date(l.createdAt);
        if (created < twelveWeeksAgo) continue;
        const k = weekStartOf(created);
        if (k in lessonBuckets) lessonBuckets[k] += 1;
      }
      const signupsByWeek = Object.entries(signupBuckets).map(([weekStart, count]) => ({ weekStart, count }));
      const lessonsByWeek = Object.entries(lessonBuckets).map(([weekStart, count]) => ({ weekStart, count }));

      // Conversion = paid users / total users. Simple and stable; matches the
      // headline number an exec wants to track week-over-week.
      const paidTiers = new Set(["pro", "campus", "enterprise"]);
      const paidUsers = allUsers.filter(u => paidTiers.has(u.tier || "free")).length;
      const conversionRate = allUsers.length > 0 ? (paidUsers / allUsers.length) * 100 : 0;

      // Churn proxy: paid users older than 60 days whose most recent saved
      // lesson is more than 30 days old (or who have never saved one). We
      // don't yet emit a "subscription_canceled" event, so this approximates
      // dormant paid accounts. Update this when that event lands.
      const lessonsByUser = new Map<string, Date>();
      for (const l of allLessons) {
        if (!l.createdAt || !l.userId) continue;
        const prev = lessonsByUser.get(l.userId);
        const cur = new Date(l.createdAt);
        if (!prev || cur > prev) lessonsByUser.set(l.userId, cur);
      }
      const churnEligible = allUsers.filter(u =>
        paidTiers.has(u.tier || "free") &&
        u.createdAt && new Date(u.createdAt) < sixtyDaysAgo,
      );
      const churned = churnEligible.filter(u => {
        const last = lessonsByUser.get(u.id);
        return !last || last < thirtyDaysAgo;
      }).length;
      const churnRate = churnEligible.length > 0 ? (churned / churnEligible.length) * 100 : 0;

      // ----- Top-of-funnel: who has NOT signed up yet? --------------------
      // (1) Free trials that started but were never bound to a user account.
      // These are the warmest leads — they completed an onboarding step.
      const unboundTrials = allTrials.filter(t => t.userId == null);
      const activeUnboundTrials = unboundTrials.filter(t =>
        t.isActive && new Date(t.trialEndDate) > now,
      );
      const recentUnboundTrials = activeUnboundTrials
        .slice()
        .sort((a, b) => new Date(b.trialStartDate).getTime() - new Date(a.trialStartDate).getTime())
        .slice(0, 25)
        .map(t => {
          const msLeft = new Date(t.trialEndDate).getTime() - now.getTime();
          const hoursLeft = Math.max(0, Math.round(msLeft / (60 * 60 * 1000)));
          return {
            id: t.id,
            ipAddress: t.ipAddress,
            startedAt: t.trialStartDate,
            expiresAt: t.trialEndDate,
            hoursRemaining: hoursLeft,
          };
        });

      // (2) Anonymous guests who generated a lesson but never even started a
      // trial. Group by IP, count attempts, and surface the most engaged.
      const guestByIp = new Map<string, { ip: string; lessonCount: number; firstSeen: Date; lastSeen: Date; topics: string[] }>();
      for (const g of allGuests) {
        if (!g.ipAddress || !g.createdAt) continue;
        const created = new Date(g.createdAt);
        const cur = guestByIp.get(g.ipAddress);
        if (cur) {
          cur.lessonCount += 1;
          if (created < cur.firstSeen) cur.firstSeen = created;
          if (created > cur.lastSeen) cur.lastSeen = created;
          if (g.topic && cur.topics.length < 3 && !cur.topics.includes(g.topic)) cur.topics.push(g.topic);
        } else {
          guestByIp.set(g.ipAddress, {
            ip: g.ipAddress,
            lessonCount: 1,
            firstSeen: created,
            lastSeen: created,
            topics: g.topic ? [g.topic] : [],
          });
        }
      }
      const trialIpSet = new Set(allTrials.map(t => t.ipAddress));
      const guestsNeverStartedTrial = Array.from(guestByIp.values()).filter(g => !trialIpSet.has(g.ip));
      const recentGuests = guestsNeverStartedTrial
        .filter(g => g.lastSeen > thirtyDaysAgo)
        .sort((a, b) => b.lessonCount - a.lessonCount)
        .slice(0, 25)
        .map(g => ({
          ipAddress: g.ip,
          lessonCount: g.lessonCount,
          firstSeen: g.firstSeen,
          lastSeen: g.lastSeen,
          topics: g.topics,
        }));

      const guestActiveLast7Days = guestsNeverStartedTrial.filter(g => g.lastSeen > sevenDaysAgo).length;
      const guestActiveLast30Days = guestsNeverStartedTrial.filter(g => g.lastSeen > thirtyDaysAgo).length;

      // ----- Needs Analyzer segment funnel ---------------------------------
      // Per identity: how many took the analyzer, how many clicked the CTA,
      // and how many ultimately created an account (convertedAt is filled by
      // the bind endpoint when onboarding completes). This tells the exec
      // team which segments engage and which ones actually convert.
      const allAnalyzer = await db.select().from(needsAnalyzerResponses);
      // De-dupe by sessionId — same anonymous visitor can answer multiple
      // times; we count each unique session once and prefer the latest.
      const latestBySession = new Map<string, typeof allAnalyzer[number]>();
      for (const r of allAnalyzer) {
        const prev = latestBySession.get(r.sessionId);
        if (!prev || (r.createdAt && prev.createdAt && new Date(r.createdAt) > new Date(prev.createdAt))) {
          latestBySession.set(r.sessionId, r);
        }
      }
      const dedupedAnalyzer = Array.from(latestBySession.values());
      const identities = ["student", "educator", "homeschool_parent", "campus_admin", "district_admin"] as const;
      const segmentFunnel = identities.map(id => {
        const rows = dedupedAnalyzer.filter(r => r.identity === id);
        const ctaClicked = rows.filter(r => r.ctaClicked != null).length;
        const converted = rows.filter(r => r.convertedAt != null).length;
        return {
          identity: id,
          completed: rows.length,
          ctaClicked,
          converted,
          conversionRatePercent: rows.length > 0 ? Number(((converted / rows.length) * 100).toFixed(1)) : 0,
        };
      });

      res.json({
        signupsByWeek,
        lessonsByWeek,
        conversion: {
          paidUsers,
          totalUsers: allUsers.length,
          conversionRatePercent: Number(conversionRate.toFixed(1)),
        },
        churn: {
          dormantPaid: churned,
          eligiblePaid: churnEligible.length,
          churnRatePercent: Number(churnRate.toFixed(1)),
          windowDays: 30,
        },
        unconvertedTrials: {
          activeUnbound: activeUnboundTrials.length,
          totalUnbound: unboundTrials.length,
          recent: recentUnboundTrials,
        },
        unconvertedGuests: {
          uniqueIps: guestsNeverStartedTrial.length,
          activeLast7Days: guestActiveLast7Days,
          activeLast30Days: guestActiveLast30Days,
          top: recentGuests,
        },
        segmentFunnel: {
          totalCompleted: dedupedAnalyzer.length,
          bySegment: segmentFunnel,
        },
      });
    } catch (error) {
      console.error("Exec metrics error:", error);
      res.status(500).json({ error: "Failed to fetch exec metrics" });
    }
  });


  // Granular User Analytics - per-user metrics with churn, burn rate, usage data
  app.get("/api/admin/user-analytics", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const allUsers = await db.select().from(users);
      const allLessons = await db.select().from(lessons);
      const allGoals = await db.select().from(goals);
      const allLessonGens = await db.select().from(lessonGenerations);
      const allJourneyEntries = await db.select().from(studentJourneyEntries);
      const allJourneyProgress = await db.select().from(studentJourneyProgress);
      const allSelfDiscovery = await db.select().from(selfDiscoveryResults);
      const allSavedCareers = await db.select().from(savedCareers);
      const allScopeSequences = await db.select().from(scopeSequences);
      const allAssignments = await db.select().from(assignments);
      const allAffiliates = await db.select().from(educatorAffiliates);
      const allProfiles = await db.select().from(educatorProfiles);
      const allPrefs = await db.select().from(userPreferences);
      const allOrgs = await storage.getOrganizations();

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const userAnalytics = allUsers.map(u => {
        const userLessons = allLessons.filter(l => l.userId === u.id);
        const userGoals = allGoals.filter(g => g.userId === u.id);
        const userLessonGens = allLessonGens.filter(lg => lg.userId === u.id);
        const userJourneyEntries = allJourneyEntries.filter(je => je.userId === u.id);
        const userJourneyProg = allJourneyProgress.find(jp => jp.studentId === u.id);
        const userSelfDisc = allSelfDiscovery.filter(sd => sd.userId === u.id);
        const userCareers = allSavedCareers.filter(sc => sc.userId === u.id);
        const userScopes = allScopeSequences.filter(ss => ss.userId === u.id);
        const userAssignments = allAssignments.filter(a => a.userId === u.id);
        const userAffiliate = allAffiliates.find(a => a.userId === u.id);
        const userProfile = allProfiles.find(p => p.userId === u.id);
        const userPref = allPrefs.find(p => p.userId === u.id);
        const userOrgCount = 0;

        const joinDate = u.createdAt ? new Date(u.createdAt) : now;
        const daysSinceJoin = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
        const lastLogin = u.lastLoginAt ? new Date(u.lastLoginAt) : null;
        const daysSinceLastLogin = lastLogin ? Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)) : null;

        const allUserDates = [
          ...userLessons.map(l => l.createdAt),
          ...userGoals.map(g => g.createdAt),
          ...userLessonGens.map(lg => lg.createdAt),
          ...userJourneyEntries.map(je => je.createdAt),
          ...userAssignments.map(a => a.createdAt),
        ].filter(Boolean).map(d => new Date(d!));

        const lastActivityDate = allUserDates.length > 0 
          ? new Date(Math.max(...allUserDates.map(d => d.getTime()))) 
          : lastLogin || joinDate;
        const daysSinceLastActivity = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

        const recentLessons = userLessons.filter(l => l.createdAt && new Date(l.createdAt) > thirtyDaysAgo).length;
        const recentGoals = userGoals.filter(g => g.createdAt && new Date(g.createdAt) > thirtyDaysAgo).length;
        const recentLessonGens = userLessonGens.filter(lg => lg.createdAt && new Date(lg.createdAt) > thirtyDaysAgo).length;
        const recentAssignments = userAssignments.filter(a => a.createdAt && new Date(a.createdAt) > thirtyDaysAgo).length;

        const totalActions = userLessons.length + userGoals.length + userLessonGens.length + 
          userJourneyEntries.length + userAssignments.length + userScopes.length +
          userSelfDisc.length + userCareers.length;

        const activeDaysCount = new Set(allUserDates.map(d => d.toISOString().split('T')[0])).size;
        const engagementRate = daysSinceJoin > 0 ? Math.min(100, Math.round((activeDaysCount / daysSinceJoin) * 100)) : 0;

        let status: "active" | "at_risk" | "churned" | "new" | "inactive";
        if (daysSinceJoin <= 7) status = "new";
        else if (daysSinceLastActivity <= 7) status = "active";
        else if (daysSinceLastActivity <= 30) status = "at_risk";
        else if (daysSinceLastActivity <= 90) status = "inactive";
        else status = "churned";

        const isPaid = u.tier !== "free";
        const tierHistory = u.updatedAt && u.tier !== "free" ? u.updatedAt : null;

        return {
          id: u.id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
          tier: u.tier,
          profileImageUrl: u.profileImageUrl,
          joinDate: u.createdAt,
          lastLoginAt: u.lastLoginAt,
          loginCount: u.loginCount || 0,
          lastActivityDate,
          daysSinceJoin,
          daysSinceLastLogin,
          daysSinceLastActivity,
          status,
          isPaid,
          subscriptionStatus: u.subscriptionStatus,
          stripeCustomerId: u.stripeCustomerId,
          onboardingCompleted: u.onboardingCompleted,
          educatorType: userProfile?.educatorType || null,
          country: userPref?.country || null,
          state: userPref?.state || null,
          organizationCount: userOrgCount,
          usage: {
            totalActions,
            activeDays: activeDaysCount,
            engagementRate,
            lessonsCreated: userLessons.length,
            lessonsLast30Days: recentLessons,
            aiLessonsGenerated: userLessonGens.length,
            aiLessonsLast30Days: recentLessonGens,
            goalsCreated: userGoals.length,
            goalsLast30Days: recentGoals,
            goalsCompleted: userGoals.filter(g => g.status === "completed").length,
            assignmentsCreated: userAssignments.length,
            assignmentsLast30Days: recentAssignments,
            scopeSequencesCreated: userScopes.length,
            selfDiscoveryCompleted: userSelfDisc.length,
            careersExplored: userCareers.length,
            journeyEntries: userJourneyEntries.length,
          },
          journey: userJourneyProg ? {
            beScore: userJourneyProg.beScore,
            knowScore: userJourneyProg.knowScore,
            doScore: userJourneyProg.doScore,
            overallScore: userJourneyProg.overallScore,
          } : null,
          affiliate: userAffiliate ? {
            referralCode: userAffiliate.referralCode,
            totalPoints: userAffiliate.totalPoints,
            totalReferrals: userAffiliate.totalReferrals,
            isActive: userAffiliate.isActive,
          } : null,
        };
      });

      // Platform-level metrics
      const totalUsers = allUsers.length;
      const paidUsers = allUsers.filter(u => u.tier !== "free").length;
      const activeUsers = userAnalytics.filter(u => u.status === "active").length;
      const atRiskUsers = userAnalytics.filter(u => u.status === "at_risk").length;
      const churnedUsers = userAnalytics.filter(u => u.status === "churned").length;
      const newUsers = userAnalytics.filter(u => u.status === "new").length;
      const inactiveUsers = userAnalytics.filter(u => u.status === "inactive").length;

      // Churn rate: users who haven't been active in 90+ days / total users who joined 90+ days ago
      const usersOlderThan90 = allUsers.filter(u => u.createdAt && new Date(u.createdAt) < ninetyDaysAgo);
      const churnRate = usersOlderThan90.length > 0 
        ? Math.round((churnedUsers / usersOlderThan90.length) * 100 * 10) / 10 
        : 0;

      // Monthly churn: users who went inactive in the last 30 days
      const monthlyChurnedUsers = userAnalytics.filter(u => {
        return u.daysSinceLastActivity >= 30 && u.daysSinceLastActivity < 60 && u.daysSinceJoin > 30;
      }).length;
      const activeLastMonth = userAnalytics.filter(u => u.daysSinceJoin > 30).length;
      const monthlyChurnRate = activeLastMonth > 0 
        ? Math.round((monthlyChurnedUsers / activeLastMonth) * 100 * 10) / 10 
        : 0;

      // Burn rate calculation (estimated monthly cost based on active users)
      const estimatedInfraPerUser = 0.50; // estimated monthly infrastructure cost per active user
      const estimatedBurnRate = Math.round(activeUsers * estimatedInfraPerUser * 100) / 100;

      // Revenue metrics  
      const proUsers = allUsers.filter(u => u.tier === "pro").length;
      const campusUsers = allUsers.filter(u => u.tier === "campus").length;
      const enterpriseUsers = allUsers.filter(u => u.tier === "enterprise").length;
      const estimatedMRR = (proUsers * 7.99) + (campusUsers * 299) + (enterpriseUsers * 299);
      const runwayMonths = estimatedBurnRate > 0 ? Math.round(estimatedMRR / estimatedBurnRate * 10) / 10 : Infinity;

      // Retention by cohort (monthly)
      const cohorts: { month: string; totalJoined: number; stillActive: number; retentionRate: number }[] = [];
      for (let i = 0; i < 6; i++) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const cohortUsers = allUsers.filter(u => {
          if (!u.createdAt) return false;
          const d = new Date(u.createdAt);
          return d >= monthStart && d <= monthEnd;
        });
        const stillActive = cohortUsers.filter(cu => {
          const ua = userAnalytics.find(a => a.id === cu.id);
          return ua && (ua.status === "active" || ua.status === "at_risk" || ua.status === "new");
        }).length;
        cohorts.push({
          month: monthStart.toISOString().slice(0, 7),
          totalJoined: cohortUsers.length,
          stillActive,
          retentionRate: cohortUsers.length > 0 ? Math.round((stillActive / cohortUsers.length) * 100) : 0,
        });
      }

      // DAU/MAU approximation
      const usersActiveToday = userAnalytics.filter(u => u.daysSinceLastActivity === 0).length;
      const usersActiveLast30 = userAnalytics.filter(u => u.daysSinceLastActivity <= 30).length;
      const dauMauRatio = usersActiveLast30 > 0 
        ? Math.round((usersActiveToday / usersActiveLast30) * 100) 
        : 0;

      // Average session frequency
      const avgLoginCount = totalUsers > 0 
        ? Math.round(allUsers.reduce((sum, u) => sum + (u.loginCount || 0), 0) / totalUsers * 10) / 10 
        : 0;

      // Conversion rate (free to paid)
      const convertedUsers = allUsers.filter(u => u.tier !== "free").length;
      const conversionRate = totalUsers > 0 ? Math.round((convertedUsers / totalUsers) * 100 * 10) / 10 : 0;

      // Onboarding completion rate
      const onboardingCompleted = allUsers.filter(u => u.onboardingCompleted).length;
      const onboardingRate = totalUsers > 0 ? Math.round((onboardingCompleted / totalUsers) * 100) : 0;

      // Feature adoption rates
      const usersWithLessons = new Set(allLessons.map(l => l.userId)).size;
      const usersWithGoals = new Set(allGoals.map(g => g.userId)).size;
      const usersWithAssignments = new Set(allAssignments.map(a => a.userId)).size;
      const usersWithSelfDiscovery = new Set(allSelfDiscovery.map(sd => sd.userId)).size;
      const usersWithCareers = new Set(allSavedCareers.map(sc => sc.userId)).size;

      res.json({
        users: userAnalytics,
        platformMetrics: {
          totalUsers,
          activeUsers,
          atRiskUsers,
          churnedUsers,
          newUsers,
          inactiveUsers,
          paidUsers,
          churnRate,
          monthlyChurnRate,
          estimatedBurnRate,
          estimatedMRR,
          runwayMonths,
          conversionRate,
          onboardingRate,
          dauMauRatio,
          avgLoginCount,
          cohorts,
          featureAdoption: {
            lessonCreation: { users: usersWithLessons, rate: totalUsers > 0 ? Math.round((usersWithLessons / totalUsers) * 100) : 0 },
            goalSetting: { users: usersWithGoals, rate: totalUsers > 0 ? Math.round((usersWithGoals / totalUsers) * 100) : 0 },
            assignments: { users: usersWithAssignments, rate: totalUsers > 0 ? Math.round((usersWithAssignments / totalUsers) * 100) : 0 },
            selfDiscovery: { users: usersWithSelfDiscovery, rate: totalUsers > 0 ? Math.round((usersWithSelfDiscovery / totalUsers) * 100) : 0 },
            careerExploration: { users: usersWithCareers, rate: totalUsers > 0 ? Math.round((usersWithCareers / totalUsers) * 100) : 0 },
          },
          tierBreakdown: {
            free: allUsers.filter(u => u.tier === "free").length,
            pro: proUsers,
            campus: campusUsers,
            enterprise: enterpriseUsers,
          },
          roleBreakdown: {
            student: allUsers.filter(u => u.role === "student").length,
            educator: allUsers.filter(u => u.role === "educator").length,
            campus_admin: allUsers.filter(u => u.role === "campus_admin").length,
            district_admin: allUsers.filter(u => u.role === "district_admin").length,
            site_admin: allUsers.filter(u => u.role === "site_admin").length,
            system_admin: allUsers.filter(u => u.role === "system_admin").length,
          },
        },
      });
    } catch (error) {
      console.error("User analytics error:", error);
      res.status(500).json({ error: "Failed to fetch user analytics" });
    }
  });


  // Performance Analytics - Educator leaderboard
  app.get("/api/admin/performance/educators", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const metrics = await storage.getEducatorPerformanceMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Educator performance error:", error);
      res.status(500).json({ error: "Failed to fetch educator performance metrics" });
    }
  });


  // Performance Analytics - Campus leaderboard
  app.get("/api/admin/performance/campuses", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const metrics = await storage.getCampusPerformanceMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Campus performance error:", error);
      res.status(500).json({ error: "Failed to fetch campus performance metrics" });
    }
  });


  // Performance Analytics - Organization leaderboard
  app.get("/api/admin/performance/organizations", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const metrics = await storage.getOrganizationPerformanceMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Organization performance error:", error);
      res.status(500).json({ error: "Failed to fetch organization performance metrics" });
    }
  });


  // Performance Analytics - System-wide stats with top performers
  app.get("/api/admin/performance/system", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getSystemWideStats();
      res.json(stats);
    } catch (error) {
      console.error("System performance error:", error);
      res.status(500).json({ error: "Failed to fetch system-wide performance stats" });
    }
  });


  app.get("/api/admin/performance/educator-types", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const allEducatorUsers = await db.select({
        id: users.id,
      }).from(users).where(eq(users.role, "educator"));

      const profileRows = await db.select({
        userId: educatorProfiles.userId,
        educatorType: educatorProfiles.educatorType,
      }).from(educatorProfiles);

      const profileMap = new Map(profileRows.map(p => [p.userId, p.educatorType]));

      const allSessions = await db.select({
        sid: sessions.sid,
        sess: sessions.sess,
        expire: sessions.expire,
      }).from(sessions);

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const educatorIds = new Set(allEducatorUsers.map(u => u.id));
      const lastActivityMap = new Map<string, Date>();

      for (const session of allSessions) {
        const sessData = session.sess as any;
        const userId = sessData?.passport?.user?.claims?.sub || sessData?.passport?.user?.id;
        if (userId && educatorIds.has(userId)) {
          const sessionExpire = new Date(session.expire);
          const existing = lastActivityMap.get(userId);
          if (!existing || sessionExpire > existing) {
            lastActivityMap.set(userId, sessionExpire);
          }
        }
      }

      const typeStats: Record<string, { total: number; activeLast7Days: number; activeLast30Days: number }> = {
        teacher: { total: 0, activeLast7Days: 0, activeLast30Days: 0 },
        homeschooling_parent: { total: 0, activeLast7Days: 0, activeLast30Days: 0 },
        micro_school: { total: 0, activeLast7Days: 0, activeLast30Days: 0 },
        unspecified: { total: 0, activeLast7Days: 0, activeLast30Days: 0 },
      };

      for (const edu of allEducatorUsers) {
        const type = profileMap.get(edu.id) || "unspecified";
        if (!typeStats[type]) typeStats[type] = { total: 0, activeLast7Days: 0, activeLast30Days: 0 };
        typeStats[type].total++;

        const lastActivity = lastActivityMap.get(edu.id);
        if (lastActivity) {
          if (lastActivity >= sevenDaysAgo) typeStats[type].activeLast7Days++;
          if (lastActivity >= thirtyDaysAgo) typeStats[type].activeLast30Days++;
        }
      }

      const totalEducators = allEducatorUsers.length;
      const totalWithType = allEducatorUsers.filter(u => profileMap.has(u.id) && profileMap.get(u.id)).length;

      res.json({
        breakdown: Object.entries(typeStats).map(([type, stats]) => ({
          type,
          label: type === "teacher" ? "Teacher" : type === "homeschooling_parent" ? "Homeschooling Parent" : type === "micro_school" ? "Micro School" : "Not Set",
          ...stats,
        })),
        totalEducators,
        totalWithType,
      });
    } catch (error) {
      console.error("Educator type analytics error:", error);
      res.status(500).json({ error: "Failed to fetch educator type analytics" });
    }
  });


  app.get("/api/admin/lesson-cache", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const allCached = await db.select().from(lessonPlanCache).orderBy(drizzleSql`${lessonPlanCache.hitCount} DESC`);
      const totalEntries = allCached.length;
      const totalHits = allCached.reduce((sum, c) => sum + (c.hitCount || 0), 0);
      const expired = allCached.filter(c => c.expiresAt && new Date(c.expiresAt) < new Date()).length;
      res.json({
        entries: allCached,
        stats: { totalEntries, totalHits, expired, active: totalEntries - expired },
      });
    } catch (error) {
      console.error("Cache stats error:", error);
      res.status(500).json({ error: "Failed to fetch cache data" });
    }
  });


  app.delete("/api/admin/lesson-cache", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      await db.delete(lessonPlanCache);
      res.json({ success: true, message: "All cache entries cleared" });
    } catch (error) {
      console.error("Cache clear error:", error);
      res.status(500).json({ error: "Failed to clear cache" });
    }
  });


  app.delete("/api/admin/lesson-cache/expired", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const result = await db.delete(lessonPlanCache).where(drizzleSql`${lessonPlanCache.expiresAt} < NOW()`);
      res.json({ success: true, message: "Expired cache entries cleared" });
    } catch (error) {
      console.error("Cache expired clear error:", error);
      res.status(500).json({ error: "Failed to clear expired cache" });
    }
  });


  app.delete("/api/admin/lesson-cache/:id", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      await db.delete(lessonPlanCache).where(eq(lessonPlanCache.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete cache entry" });
    }
  });


  // Get all users (site admin only) with pagination and search
  app.get("/api/admin/users", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { search, role, tier, limit = "50", offset = "0" } = req.query;
      let query = db.select().from(users);
      
      const allUsers = await query;
      
      let filteredUsers = allUsers;
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filteredUsers = filteredUsers.filter(u => 
          u.email?.toLowerCase().includes(searchLower) ||
          u.firstName?.toLowerCase().includes(searchLower) ||
          u.lastName?.toLowerCase().includes(searchLower)
        );
      }
      if (role) {
        filteredUsers = filteredUsers.filter(u => u.role === role);
      }
      if (tier) {
        filteredUsers = filteredUsers.filter(u => u.tier === tier);
      }
      
      const total = filteredUsers.length;
      const paginatedUsers = filteredUsers.slice(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string));
      
      res.json({
        users: paginatedUsers,
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
    } catch (error) {
      console.error("Users fetch error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });


  // Get single user details (site admin only)
  app.get("/api/admin/users/:id", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const [user] = await db.select().from(users).where(eq(users.id, id));
      
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      
      const [profile] = await db.select().from(educatorProfiles).where(eq(educatorProfiles.userId, id));
      const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, id));
      const userLessons = await db.select().from(lessons).where(eq(lessons.userId, id));
      const userGoals = await db.select().from(goals).where(eq(goals.userId, id));
      
      res.json({
        user,
        profile,
        preferences: prefs,
        stats: {
          lessonsCreated: userLessons.length,
          goalsCreated: userGoals.length,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user details" });
    }
  });


  // Update user (site admin only)
  app.patch("/api/admin/users/:id", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { tier, role, email, firstName, lastName, stripeCustomerId, stripeSubscriptionId, subscriptionStatus } = req.body;
      
      const updates: Partial<User> = {};
      if (tier) updates.tier = tier;
      if (role) updates.role = role;
      if (email) updates.email = email;
      if (firstName) updates.firstName = firstName;
      if (lastName) updates.lastName = lastName;
      if (stripeCustomerId !== undefined) updates.stripeCustomerId = stripeCustomerId || null;
      if (stripeSubscriptionId !== undefined) updates.stripeSubscriptionId = stripeSubscriptionId || null;
      if (subscriptionStatus !== undefined) updates.subscriptionStatus = subscriptionStatus || null;
      updates.updatedAt = new Date();
      
      const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });


  // Delete user (site admin only)
  app.delete("/api/admin/users/:id", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user?.claims?.sub;
      
      if (id === adminId) {
        res.status(400).json({ error: "Cannot delete your own account" });
        return;
      }
      
      await db.delete(lessons).where(eq(lessons.userId, id));
      await db.delete(goals).where(eq(goals.userId, id));
      await db.delete(educatorProfiles).where(eq(educatorProfiles.userId, id));
      await db.delete(userPreferences).where(eq(userPreferences.userId, id));
      await db.delete(users).where(eq(users.id, id));
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });


  // Create user (site admin only)
  app.post("/api/admin/users", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { email, firstName, lastName, role, tier } = req.body;
      
      if (!email || !firstName || !lastName) {
        res.status(400).json({ error: "Email, first name, and last name are required" });
        return;
      }

      const validRoles = ["student", "educator", "campus_admin", "district_admin", "site_admin", "system_admin"];
      if (role && !validRoles.includes(role)) {
        res.status(400).json({ error: "Invalid role" });
        return;
      }

      const validTiers = ["free", "pro", "campus", "enterprise"];
      if (tier && !validTiers.includes(tier)) {
        res.status(400).json({ error: "Invalid tier" });
        return;
      }

      const existingUsers = await db.select().from(users).where(eq(users.email, email));
      if (existingUsers.length > 0) {
        res.status(409).json({ error: "A user with this email already exists" });
        return;
      }

      const userId = randomUUID();
      const [newUser] = await db.insert(users).values({
        id: userId,
        email,
        firstName,
        lastName,
        role: role || "student",
        tier: tier || "free",
        onboardingCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      res.json(newUser);
    } catch (error) {
      console.error("Failed to create user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });


  // Impersonate user (site admin only) - creates a session token
  app.post("/api/admin/users/:id/impersonate", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user?.claims?.sub;
      
      const [targetUser] = await db.select().from(users).where(eq(users.id, id));
      if (!targetUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      
      req.session.impersonating = {
        userId: id,
        originalAdminId: adminId,
        startedAt: new Date().toISOString(),
      };
      
      res.json({ 
        success: true, 
        message: `Now impersonating ${targetUser.firstName} ${targetUser.lastName}`,
        user: targetUser,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to impersonate user" });
    }
  });


  // Stop impersonation
  app.post("/api/admin/stop-impersonation", isAuthenticated, async (req: any, res) => {
    try {
      if (req.session.impersonating) {
        delete req.session.impersonating;
        res.json({ success: true, message: "Stopped impersonation" });
      } else {
        res.status(400).json({ error: "Not currently impersonating" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to stop impersonation" });
    }
  });


  // Get all affiliates (site admin only)
  app.get("/api/admin/affiliates", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const affiliates = await db.select().from(educatorAffiliates);
      
      const enrichedAffiliates = await Promise.all(affiliates.map(async (affiliate) => {
        const [user] = await db.select().from(users).where(eq(users.id, affiliate.userId));
        return {
          ...affiliate,
          user: user ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          } : null,
        };
      }));
      
      res.json(enrichedAffiliates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch affiliates" });
    }
  });


  // Update affiliate (site admin only)
  app.patch("/api/admin/affiliates/:id", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const [updated] = await db.update(educatorAffiliates)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(educatorAffiliates.id, id))
        .returning();
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update affiliate" });
    }
  });


  app.get("/api/admin/trial-stats", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const allTrials = await db.select().from(freeTrials).orderBy(desc(freeTrials.createdAt));
      const now = new Date();

      const totalTrials = allTrials.length;
      const activeTrials = allTrials.filter(t => t.isActive && new Date(t.trialEndDate) > now).length;
      const expiredTrials = allTrials.filter(t => !t.isActive || new Date(t.trialEndDate) <= now).length;
      const boundTrials = allTrials.filter(t => t.userId != null).length;
      const unboundTrials = allTrials.filter(t => t.userId == null).length;
      const abuseFlagged = allTrials.filter(t => (t.abuseFlags || 0) > 0).length;
      const uniqueIPs = new Set(allTrials.map(t => t.ipAddress)).size;

      const completedBoundTrials = allTrials.filter(t => t.userId && (!t.isActive || new Date(t.trialEndDate) <= now));
      const completedBoundUserIds = completedBoundTrials.map(t => t.userId!);
      let paidConversions = 0;
      if (completedBoundUserIds.length > 0) {
        const paidUsers = await db.select().from(users).where(
          and(
            inArray(users.id, completedBoundUserIds),
            inArray(users.tier as any, ["pro", "campus", "enterprise"])
          )
        );
        paidConversions = paidUsers.length;
      }
      const conversionRate = completedBoundTrials.length > 0 ? (paidConversions / completedBoundTrials.length) * 100 : 0;

      const recentTrials = allTrials.slice(0, 20).map(t => ({
        id: t.id,
        ipAddress: t.ipAddress,
        userId: t.userId,
        fingerprint: t.fingerprint,
        trialStartDate: t.trialStartDate,
        trialEndDate: t.trialEndDate,
        isActive: t.isActive,
        abuseFlags: t.abuseFlags,
        createdAt: t.createdAt,
      }));

      res.json({
        totalTrials,
        activeTrials,
        expiredTrials,
        boundTrials,
        unboundTrials,
        abuseFlagged,
        uniqueIPs,
        recentTrials,
        conversionRate,
      });
    } catch (error) {
      console.error("Trial stats error:", error);
      res.status(500).json({ error: "Failed to fetch trial stats" });
    }
  });


  // System admin: grant a fresh trial to any user (reset/extend)
  app.post("/api/admin/trial/grant", isAuthenticated, requireSystemAdmin, async (req: any, res) => {
    try {
      const adminId = req.user?.claims?.sub;
      const { userId, durationDays = TRIAL_DURATION_DAYS } = req.body;

      if (!userId) {
        res.status(400).json({ error: "userId is required" });
        return;
      }

      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Deactivate any existing trial for this user
      const existingTrial = await storage.getActiveTrialByUserId(userId);
      if (existingTrial) {
        await db.update(freeTrials).set({ isActive: false }).where(eq(freeTrials.id, existingTrial.id));
      }

      const now = new Date();
      const trialEndDate = new Date(now);
      trialEndDate.setDate(trialEndDate.getDate() + Number(durationDays));

      const trial = await storage.createFreeTrial({
        ipAddress: "admin-granted",
        fingerprint: null,
        userId,
        trialStartDate: now,
        trialEndDate,
        isActive: true,
        abuseFlags: 0,
        metadata: { grantedBy: adminId, reason: "admin_grant" } as any,
      });

      await logAuditEvent({
        userId: adminId,
        action: "trial_granted",
        resourceType: "free_trial",
        resourceId: trial.id,
        category: "admin_action",
        severity: "info",
        details: { targetUserId: userId, durationDays },
        ipAddress: req.ip || "",
      });

      res.json({
        success: true,
        trialId: trial.id,
        trialStartDate: trial.trialStartDate,
        trialEndDate: trial.trialEndDate,
        daysGranted: Number(durationDays),
      });
    } catch (error) {
      console.error("Admin trial grant error:", error);
      res.status(500).json({ error: "Failed to grant trial" });
    }
  });


  // System admin: revoke a user's active trial
  app.post("/api/admin/trial/revoke", isAuthenticated, requireSystemAdmin, async (req: any, res) => {
    try {
      const adminId = req.user?.claims?.sub;
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({ error: "userId is required" });
        return;
      }

      const existingTrial = await storage.getActiveTrialByUserId(userId);
      if (!existingTrial) {
        res.status(404).json({ error: "No active trial found for this user" });
        return;
      }

      await db.update(freeTrials).set({ isActive: false }).where(eq(freeTrials.id, existingTrial.id));

      await logAuditEvent({
        userId: adminId,
        action: "trial_revoked",
        resourceType: "free_trial",
        resourceId: existingTrial.id,
        category: "admin_action",
        severity: "info",
        details: { targetUserId: userId },
        ipAddress: req.ip || "",
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Admin trial revoke error:", error);
      res.status(500).json({ error: "Failed to revoke trial" });
    }
  });


  // Get all referral events (site admin only)
  app.get("/api/admin/referral-events", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const events = await db.select().from(referralEvents).orderBy(desc(referralEvents.createdAt)).limit(100);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch referral events" });
    }
  });


  // Get all lessons (site admin only)
  app.get("/api/admin/lessons", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { search, limit = "50", offset = "0" } = req.query;
      
      let allLessons = await db.select().from(lessons).orderBy(desc(lessons.createdAt));
      
      if (search) {
        const searchLower = (search as string).toLowerCase();
        allLessons = allLessons.filter(l => 
          l.title?.toLowerCase().includes(searchLower) ||
          l.topic?.toLowerCase().includes(searchLower)
        );
      }
      
      const total = allLessons.length;
      const paginatedLessons = allLessons.slice(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string));
      
      const enrichedLessons = await Promise.all(paginatedLessons.map(async (lesson) => {
        const [user] = await db.select().from(users).where(eq(users.id, lesson.userId));
        return {
          ...lesson,
          author: user ? `${user.firstName} ${user.lastName}` : "Unknown",
          authorEmail: user?.email,
        };
      }));
      
      res.json({ lessons: enrichedLessons, total });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });


  // Delete lesson (site admin only)
  app.delete("/api/admin/lessons/:id", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await db.delete(lessons).where(eq(lessons.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lesson" });
    }
  });


  // Get billing/subscription overview (site admin only)
  app.get("/api/admin/billing", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const allUsers = await db.select().from(users);
      
      const subscriptionStats = {
        activeSubscriptions: allUsers.filter(u => u.subscriptionStatus === "active").length,
        cancelledSubscriptions: allUsers.filter(u => u.subscriptionStatus === "cancelled").length,
        totalProUsers: allUsers.filter(u => u.tier === "pro").length,
        totalCampusUsers: allUsers.filter(u => u.tier === "campus").length,
        totalEnterpriseUsers: allUsers.filter(u => u.tier === "enterprise").length,
        usersWithStripe: allUsers.filter(u => u.stripeCustomerId).length,
      };
      
      const recentUpgrades = allUsers
        .filter(u => u.tier !== "free" && u.updatedAt)
        .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())
        .slice(0, 10)
        .map(u => ({
          id: u.id,
          email: u.email,
          name: `${u.firstName} ${u.lastName}`,
          tier: u.tier,
          updatedAt: u.updatedAt,
        }));
      
      res.json({
        stats: subscriptionStats,
        recentUpgrades,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch billing data" });
    }
  });


  // Get platform sitemap structure (site admin only)
  app.get("/api/admin/sitemap", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const orgs = await storage.getOrganizations();
      const authorities = await db.select().from(authoritiesTable);
      const jurisdictions = await db.select().from(standardsJurisdictions);
      
      const sitemap = {
        platform: {
          name: "LYS Platform",
          sections: [
            {
              name: "Users & Accounts",
              path: "/admin?tab=users",
              description: "Manage all platform users",
            },
            {
              name: "Organizations",
              path: "/admin?tab=organizations",
              description: "Schools, districts, and universities",
              count: orgs.length,
            },
            {
              name: "Affiliates & Referrals",
              path: "/admin?tab=affiliates",
              description: "Educator influence program",
            },
            {
              name: "Content Management",
              path: "/admin?tab=content",
              description: "Lessons and learning materials",
            },
            {
              name: "Content Hub (RSS)",
              path: "/system-admin?tab=content-hub",
              description: "RSS feed ingestion and content routing",
              count: await storage.getPendingRssContentCount(),
            },
            {
              name: "Educational Standards",
              path: "/standards-admin",
              description: "Curriculum standards management",
              count: jurisdictions.length,
            },
            {
              name: "Billing & Subscriptions",
              path: "/admin?tab=billing",
              description: "Payment and tier management",
            },
            {
              name: "Feature Flags",
              path: "/admin?tab=flags",
              description: "Platform feature toggles",
            },
            {
              name: "Global Authorities",
              path: "/admin?tab=authorities",
              description: "Educational governance hierarchy",
              count: authorities.length,
            },
          ],
        },
        organizations: orgs.map(org => ({
          id: org.id,
          name: org.name,
          type: org.type,
          status: org.status,
          tier: org.tier,
        })),
      };
      
      res.json(sitemap);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sitemap" });
    }
  });


  // ================================
  // Pricing Tiers Management (System Admin)
  // ================================

  app.get("/api/admin/pricing-tiers", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const tiers = await db.select().from(pricingTiers).orderBy(pricingTiers.basePrice);
      res.json(tiers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pricing tiers" });
    }
  });


  app.patch("/api/admin/pricing-tiers/:tierId", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { tierId } = req.params;
      const adminId = req.user?.claims?.sub;
      const { name, basePrice, period, description, features, isActive, maxStudentsPerClass, maxAiLessons, includesAds } = req.body;

      const updates: any = { updatedAt: new Date(), updatedBy: adminId };
      if (name !== undefined) updates.name = name;
      if (basePrice !== undefined) updates.basePrice = basePrice;
      if (period !== undefined) updates.period = period;
      if (description !== undefined) updates.description = description;
      if (features !== undefined) updates.features = features;
      if (isActive !== undefined) updates.isActive = isActive;
      if (maxStudentsPerClass !== undefined) updates.maxStudentsPerClass = maxStudentsPerClass;
      if (maxAiLessons !== undefined) updates.maxAiLessons = maxAiLessons;
      if (includesAds !== undefined) updates.includesAds = includesAds;

      const [updated] = await db.update(pricingTiers)
        .set(updates)
        .where(eq(pricingTiers.tierId, tierId))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Pricing tier not found" });
        return;
      }

      res.json(updated);
    } catch (error) {
      console.error("Failed to update pricing tier:", error);
      res.status(500).json({ error: "Failed to update pricing tier" });
    }
  });


  // ============ Safety Suite & Content Moderation Routes ============

  app.get("/api/admin/review-queue", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      const { status, severity, limit, offset } = req.query;
      const items = await db.select().from(contentReviewQueueTable)
        .where(status ? eq(contentReviewQueueTable.status, status as string) : undefined)
        .orderBy(desc(contentReviewQueueTable.createdAt))
        .limit(parseInt(limit as string) || 50)
        .offset(parseInt(offset as string) || 0);
      
      const total = await db.select({ count: drizzleSql<number>`count(*)` })
        .from(contentReviewQueueTable)
        .where(status ? eq(contentReviewQueueTable.status, status as string) : undefined);
      
      res.json({ items, total: total[0]?.count || 0 });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch review queue" });
    }
  });


  app.get("/api/admin/review-queue/stats", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      const pending = await db.select({ count: drizzleSql<number>`count(*)` })
        .from(contentReviewQueueTable).where(eq(contentReviewQueueTable.status, "pending_review"));
      const approved = await db.select({ count: drizzleSql<number>`count(*)` })
        .from(contentReviewQueueTable).where(eq(contentReviewQueueTable.status, "approved"));
      const rejected = await db.select({ count: drizzleSql<number>`count(*)` })
        .from(contentReviewQueueTable).where(eq(contentReviewQueueTable.status, "rejected"));
      const high = await db.select({ count: drizzleSql<number>`count(*)` })
        .from(contentReviewQueueTable)
        .where(and(eq(contentReviewQueueTable.severity, "high"), eq(contentReviewQueueTable.status, "pending_review")));
      
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


  app.patch("/api/admin/review-queue/:id", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      const { action, notes } = req.body;
      
      if (!["approved", "rejected", "archived"].includes(action)) {
        res.status(400).json({ error: "Invalid action" });
        return;
      }
      
      const [updated] = await db.update(contentReviewQueueTable)
        .set({
          status: action,
          reviewedBy: userId,
          reviewedAt: new Date(),
          reviewAction: action,
          reviewNotes: notes || null,
        })
        .where(eq(contentReviewQueueTable.id, id))
        .returning();
      
      if (!updated) {
        res.status(404).json({ error: "Review item not found" });
        return;
      }
      
      await logAuditEvent({
        userId,
        action: `content_review_${action}`,
        category: "content_moderation",
        severity: action === "rejected" ? "warning" : "info",
        resourceType: "content_review",
        resourceId: id,
        details: { reviewAction: action, notes },
        ipAddress: getClientIP(req),
      });
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update review item" });
    }
  });


  app.post("/api/admin/review-queue/bulk", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { ids, action, notes } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ error: "No items selected" });
        return;
      }
      if (!["approved", "rejected", "archived"].includes(action)) {
        res.status(400).json({ error: "Invalid action" });
        return;
      }
      
      let updated = 0;
      for (const id of ids) {
        const [result] = await db.update(contentReviewQueueTable)
          .set({
            status: action,
            reviewedBy: userId,
            reviewedAt: new Date(),
            reviewAction: action,
            reviewNotes: notes || null,
          })
          .where(eq(contentReviewQueueTable.id, id))
          .returning();
        if (result) updated++;
      }
      
      await logAuditEvent({
        userId,
        action: `bulk_content_review_${action}`,
        category: "content_moderation",
        severity: "info",
        details: { count: updated, action, ids },
        ipAddress: getClientIP(req),
      });
      
      res.json({ updated, total: ids.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to bulk update review items" });
    }
  });


  // ============ Audit Log Routes ============

  app.get("/api/admin/audit-logs", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      const { category, severity, userId, startDate, endDate, limit, offset } = req.query;
      const logs = await getAuditLogs({
        category: category as string,
        severity: severity as string,
        userId: userId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: parseInt(limit as string) || 100,
        offset: parseInt(offset as string) || 0,
      });
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });


  app.get("/api/admin/parental-consents", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      const consents = await db.select().from(parentalConsentsTable)
        .orderBy(desc(parentalConsentsTable.createdAt))
        .limit(100);
      res.json(consents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch consents" });
    }
  });


  // Rule 7: Fraud Strike Check (middleware helper exposed as endpoint for admin)
  app.get("/api/admin/fraud-strikes/:userId", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      const { checkFraudStrikes } = await import("../services/dataGovernance");
      const result = await checkFraudStrikes(req.params.userId);
      const strikes = await db.select().from(fraudStrikesTable)
        .where(eq(fraudStrikesTable.userId, req.params.userId))
        .orderBy(desc(fraudStrikesTable.createdAt));
      res.json({ ...result, strikes });
    } catch (error) {
      res.status(500).json({ error: "Failed to check fraud strikes" });
    }
  });


  app.post("/api/admin/fraud-strikes/:userId/resolve", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      const adminId = req.user?.claims?.sub;
      const { resolveFraudStrikes } = await import("../services/dataGovernance");
      await resolveFraudStrikes(req.params.userId, adminId);
      res.json({ resolved: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to resolve fraud strikes" });
    }
  });


  // Governance Status endpoint (for admin dashboard)
  app.get("/api/admin/governance-status", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      const [totalMarks] = await db.select({ count: count() }).from(successMarksTable);
      const [finalizedMarks] = await db.select({ count: count() }).from(successMarksTable).where(eq(successMarksTable.isMutable, false));
      const [totalVault] = await db.select({ count: count() }).from(safetyVaultTable);
      const [blockedMessages] = await db.select({ count: count() }).from(safetyVaultTable).where(eq(safetyVaultTable.isPiiBlocked, true));
      const [totalStrikes] = await db.select({ count: count() }).from(fraudStrikesTable);
      const [unresolvedStrikes] = await db.select({ count: count() }).from(fraudStrikesTable).where(eq(fraudStrikesTable.isResolved, false));

      res.json({
        successLedger: {
          totalMarks: totalMarks.count,
          finalizedMarks: finalizedMarks.count,
          editWindowHours: 24,
        },
        safetyVault: {
          totalArchived: totalVault.count,
          piiBlocked: blockedMessages.count,
        },
        fraudProtection: {
          totalStrikes: totalStrikes.count,
          unresolvedStrikes: unresolvedStrikes.count,
          strikeThreshold: 3,
        },
        rules: [
          { id: 1, name: "Success Ledger Immutability", status: "active", description: "24-hour edit window, then requires audit reason" },
          { id: 2, name: "Communication Safety Intercept", status: "active", description: "PII blocking, cross-tenant lockdown, archive mandate" },
          { id: 3, name: "Multi-Tenant RLS", status: "active", description: "App-level tenant scoping on queries" },
          { id: 4, name: "Data Residency", status: "stub", description: "Region tagging active, geographic routing planned" },
          { id: 5, name: "COPPA Compliance", status: "active", description: "Under-13 restricted state, messaging blocked without consent" },
          { id: 6, name: "Marketplace Security", status: "active", description: "Content filter on uploads, standards read-only" },
          { id: 7, name: "VPN/Fraud Protection", status: "active", description: "3-strike GeoIP mismatch tracking" },
        ],
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch governance status" });
    }
  });


  app.get("/api/admin/rss-feeds", isAuthenticated, requireRssAdmin, async (req: any, res) => {
    try {
      const feeds = await storage.getRssFeeds();
      res.json(feeds);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch RSS feeds" });
    }
  });


  app.post("/api/admin/rss-feeds", isAuthenticated, requireRssAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertRssFeedSchema.parse({ ...req.body, createdBy: userId });
      const feed = await storage.createRssFeed(parsed);
      res.json(feed);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create RSS feed" });
    }
  });


  app.patch("/api/admin/rss-feeds/:id", isAuthenticated, requireRssAdmin, async (req: any, res) => {
    try {
      const { name, url, feedType, description, isActive, fetchIntervalMinutes } = req.body;
      const allowedUpdates: any = {};
      if (name !== undefined) allowedUpdates.name = name;
      if (url !== undefined) allowedUpdates.url = url;
      if (feedType !== undefined) {
        if (!["podcast", "blog"].includes(feedType)) return res.status(400).json({ error: "Invalid feed type" });
        allowedUpdates.feedType = feedType;
      }
      if (description !== undefined) allowedUpdates.description = description;
      if (isActive !== undefined) allowedUpdates.isActive = isActive;
      if (fetchIntervalMinutes !== undefined) allowedUpdates.fetchIntervalMinutes = fetchIntervalMinutes;
      const feed = await storage.updateRssFeed(req.params.id, allowedUpdates);
      if (!feed) return res.status(404).json({ error: "Feed not found" });
      res.json(feed);
    } catch (error) {
      res.status(500).json({ error: "Failed to update RSS feed" });
    }
  });


  app.delete("/api/admin/rss-feeds/:id", isAuthenticated, requireRssAdmin, async (req: any, res) => {
    try {
      const deleted = await storage.deleteRssFeed(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Feed not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete RSS feed" });
    }
  });


  app.post("/api/admin/rss-feeds/:id/fetch", isAuthenticated, requireRssAdmin, async (req: any, res) => {
    try {
      const feed = await storage.getRssFeed(req.params.id);
      if (!feed) return res.status(404).json({ error: "Feed not found" });
      const result = await fetchAndProcessFeed(feed);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch RSS feed" });
    }
  });


  app.get("/api/admin/rss-content", isAuthenticated, requireRssAdmin, async (req: any, res) => {
    try {
      const filters: any = {};
      if (req.query.feedId) filters.feedId = req.query.feedId;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.placement) filters.placement = req.query.placement;
      const items = await storage.getRssContentItems(filters);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch RSS content items" });
    }
  });


  app.get("/api/admin/rss-content/pending-count", isAuthenticated, requireRssAdmin, async (req: any, res) => {
    try {
      const count = await storage.getPendingRssContentCount();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to get pending count" });
    }
  });


  app.patch("/api/admin/rss-content/:id", isAuthenticated, requireRssAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { status, approvedPlacements, bkdPillar, aiUsageType, reviewNotes, careerFields, tags } = req.body;
      const validStatuses = ["pending", "approved", "rejected", "archived"];
      const validPlacements = ["know_resource", "ai_lesson", "featured", "mentor_connect"];
      const validPillars = ["be", "know", "do"];
      const validUsageTypes = ["supplemental", "primary"];
      if (status && !validStatuses.includes(status)) return res.status(400).json({ error: "Invalid status" });
      if (bkdPillar && !validPillars.includes(bkdPillar)) return res.status(400).json({ error: "Invalid BKD pillar" });
      if (aiUsageType && !validUsageTypes.includes(aiUsageType)) return res.status(400).json({ error: "Invalid AI usage type" });
      if (approvedPlacements && (!Array.isArray(approvedPlacements) || !approvedPlacements.every((p: string) => validPlacements.includes(p)))) return res.status(400).json({ error: "Invalid placements" });
      const updates: any = {};
      if (status) updates.status = status;
      if (approvedPlacements) updates.approvedPlacements = approvedPlacements;
      if (bkdPillar) updates.bkdPillar = bkdPillar;
      if (aiUsageType) updates.aiUsageType = aiUsageType;
      if (reviewNotes !== undefined) updates.reviewNotes = reviewNotes;
      if (careerFields) updates.careerFields = careerFields;
      if (tags) updates.tags = tags;
      if (status === "approved" || status === "rejected") {
        updates.reviewedBy = userId;
        updates.reviewedAt = new Date();
      }

      const item = await storage.updateRssContentItem(req.params.id, updates);
      if (!item) return res.status(404).json({ error: "Content item not found" });

      if (status === "approved" && item.approvedPlacements) {
        const placements = item.approvedPlacements as string[];
        if (placements.includes("know_resource")) {
          try {
            const feed = await storage.getRssFeed(item.feedId);
            const resourceType = feed?.feedType === "podcast" ? "podcast" : "website";
            await storage.createKnowResource({
              title: item.title,
              description: item.description || undefined,
              resourceType,
              url: item.contentUrl || undefined,
              imageUrl: item.imageUrl || undefined,
              author: item.author || undefined,
              rssFeedUrl: item.audioUrl || undefined,
              tags: (item.tags as string[]) || [],
              careerFields: (item.careerFields as string[]) || [],
              isActive: true,
              featured: false,
              createdBy: userId,
            });
          } catch (err) {
            console.error("Failed to create KNOW resource from RSS:", err);
          }
        }
      }

      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update content item" });
    }
  });


  app.patch("/api/admin/foundation/modules/:slug", isAuthenticated, requireFoundationAdmin, async (req: any, res) => {
    try {
      const slug = req.params.slug;
      const updates = foundationModuleUpdateSchema.parse(req.body);
      const updated = await storage.updateFoundationModule(slug, updates as any);
      if (!updated) return res.status(404).json({ error: "Module not found" });
      res.json(updated);
    } catch (error: any) {
      if (error?.issues) return res.status(400).json({ error: "Invalid body", issues: error.issues });
      res.status(500).json({ error: "Failed to update module" });
    }
  });


  app.get("/api/admin/foundation/rollup", isAuthenticated, requireFoundationAdmin, async (_req: any, res) => {
    try {
      const rollup = await storage.getFoundationRollup();
      res.json(rollup);
    } catch (error) {
      res.status(500).json({ error: "Failed to load rollup" });
    }
  });


  // Scholarship sync admin routes
  app.post("/api/admin/scholarship-sync", isAuthenticated, async (req: any, res) => {
    try {
      const role = req.user?.role || req.user?.claims?.role;
      if (!["site_admin", "system_admin"].includes(role)) return res.status(403).json({ error: "Admin only" });
      const { type = "full" } = req.body;
      runScholarshipSync(type).catch(console.error); // non-blocking
      res.json({ success: true, message: `Scholarship ${type} sync started` });
    } catch (error) {
      res.status(500).json({ error: "Failed to start sync" });
    }
  });


  app.get("/api/admin/scholarship-sync/history", isAuthenticated, async (req: any, res) => {
    try {
      const role = req.user?.role || req.user?.claims?.role;
      if (!["site_admin", "system_admin"].includes(role)) return res.status(403).json({ error: "Admin only" });
      const history = await db.select().from(scholarshipSyncLog).orderBy(scholarshipSyncLog.startedAt).limit(20);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sync history" });
    }
  });

  // ===== Bricks/BKD lesson AI improvements =====
  // LYS canon entries CRUD (DB-backed canonical reference). Bumps subject
  // version on any write so cache keys invalidate per-subject.
  app.get("/api/admin/canon-entries", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { subject, kind, isActive } = req.query as any;
      const entries = await storage.listLysCanonEntries({
        subject: subject || undefined,
        kind: kind || undefined,
        isActive: isActive === undefined ? undefined : isActive === "true",
      });
      res.json(entries);
    } catch (e) {
      res.status(500).json({ error: "Failed to list canon entries" });
    }
  });

  app.post("/api/admin/canon-entries", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { normalizeSubject } = await import("../services/lysCanonService");
      // Normalize subject before persistence so admin writes and generation
      // cache keys agree on the canonical key (e.g. "Math" -> "math").
      const payload = { ...req.body, subject: normalizeSubject(req.body?.subject) || "_global" };
      const created = await storage.createLysCanonEntry(payload);
      if (created.subject) await storage.bumpSubjectCanonVersion(created.subject);
      res.json(created);
    } catch (e) {
      res.status(400).json({ error: "Failed to create canon entry", details: (e as Error).message });
    }
  });

  app.patch("/api/admin/canon-entries/:id", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { normalizeSubject } = await import("../services/lysCanonService");
      const payload = req.body?.subject !== undefined
        ? { ...req.body, subject: normalizeSubject(req.body.subject) || "_global" }
        : req.body;
      const updated = await storage.updateLysCanonEntry(req.params.id, payload);
      if (updated?.subject) await storage.bumpSubjectCanonVersion(updated.subject);
      res.json(updated);
    } catch (e) {
      res.status(400).json({ error: "Failed to update canon entry" });
    }
  });

  app.delete("/api/admin/canon-entries/:id", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { normalizeSubject } = await import("../services/lysCanonService");
      const existing = await storage.listLysCanonEntries();
      const target = existing.find(e => e.id === req.params.id);
      const ok = await storage.deleteLysCanonEntry(req.params.id);
      if (ok && target?.subject) await storage.bumpSubjectCanonVersion(normalizeSubject(target.subject) || "_global");
      res.json({ success: ok });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete canon entry" });
    }
  });

  // Top exemplars by attribution / score correlation.
  app.get("/api/admin/lesson-attribution/top", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const limit = Number(req.query.limit) || 20;
      const top = await storage.listTopExemplars(limit);
      res.json(top);
    } catch (e) {
      res.status(500).json({ error: "Failed to load top exemplars" });
    }
  });

  // Per-org opt-in/out of teacher edit capture as a training signal.
  app.patch("/api/admin/orgs/:orgId/ai-training", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const enabled = Boolean(req.body?.editCaptureEnabled);
      const updated = await storage.upsertLessonAiOrgSettings(req.params.orgId, enabled);
      res.json(updated);
    } catch (e) {
      res.status(400).json({ error: "Failed to update org AI training settings" });
    }
  });
}
