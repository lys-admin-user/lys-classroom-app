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

// AUTO-SPLIT from server/routes.ts -- domain: org (51 routes)
export function registerOrgRoutes(app: Express): void {


  // ===========================================
  // ALIGNMENT DASHBOARD API
  // ===========================================
  
  // Get alignment data for a specific lesson
  app.get("/api/alignment/:lessonId", isAuthenticated, async (req: any, res) => {
    try {
      const lessonId = req.params.lessonId;
      const lesson = await storage.getLesson(lessonId);
      
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      
      // Get all alignments for this lesson
      const alignments = await storage.getAlignmentsByLesson(lessonId);
      const objectives = (lesson.objectives as string[]) || [];
      
      // Calculate coverage for each objective
      const objectiveCoverage = objectives.map((obj, idx) => {
        const alignment = alignments.find(a => a.objectiveIndex === idx);
        return {
          objectiveIndex: idx,
          objectiveText: obj,
          questionCount: alignment?.questionCount || 0,
          coveragePercentage: alignment?.coveragePercentage || 0,
          bkdFocus: alignment?.bkdFocus || lesson.bkdFocus,
          assessmentTypes: [],
        };
      });
      
      const coveredObjectives = objectiveCoverage.filter(o => o.questionCount > 0).length;
      const averageCoverage = objectives.length > 0 
        ? Math.round(objectiveCoverage.reduce((sum, o) => sum + o.coveragePercentage, 0) / objectives.length)
        : 0;
        
      const missingCoverage = objectiveCoverage
        .filter(o => o.coveragePercentage < 50)
        .map(o => o.objectiveText);
      
      // Calculate BKD distribution from alignments
      const bkdCounts = { be: 0, know: 0, do: 0 };
      alignments.forEach(a => {
        if (a.bkdFocus && a.bkdFocus in bkdCounts) {
          bkdCounts[a.bkdFocus as keyof typeof bkdCounts] += a.questionCount || 0;
        }
      });
      const totalQuestions = bkdCounts.be + bkdCounts.know + bkdCounts.do || 1;
      
      res.json({
        lessonId,
        lessonTitle: lesson.title,
        totalObjectives: objectives.length,
        coveredObjectives,
        averageCoverage,
        bkdDistribution: {
          be: Math.round((bkdCounts.be / totalQuestions) * 100),
          know: Math.round((bkdCounts.know / totalQuestions) * 100),
          do: Math.round((bkdCounts.do / totalQuestions) * 100),
        },
        objectives: objectiveCoverage,
        missingCoverage,
      });
    } catch (error) {
      console.error("Alignment fetch error:", error);
      res.status(500).json({ error: "Failed to fetch alignment data" });
    }
  });


  app.post("/api/standards/auto-match", isAuthenticated, async (req: any, res) => {
    try {
      const validationResult = autoMatchSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: validationResult.error.errors 
        });
      }
      
      const { topic, gradeLevel, subject, objectives, standardSetId } = validationResult.data;
      
      const { autoMatchStandards } = await import("../standardsAutoMatch");
      const matches = await autoMatchStandards({
        topic,
        gradeLevel,
        subject: subject || '',
        objectives,
        standardSetId,
      });
      
      res.json(matches);
    } catch (error) {
      console.error("Standards auto-match error:", error);
      res.status(500).json({ error: "Failed to auto-match standards" });
    }
  });

  
  app.post("/api/standards/validate-alignment", isAuthenticated, async (req: any, res) => {
    try {
      const { objectives, standardCodes } = req.body;
      
      const { validateStandardAlignment } = await import("../standardsAutoMatch");
      const result = await validateStandardAlignment(objectives, standardCodes);
      
      res.json(result);
    } catch (error) {
      console.error("Validate alignment error:", error);
      res.status(500).json({ error: "Failed to validate alignment" });
    }
  });


  // Get all jurisdictions (public endpoint for onboarding)
  app.get("/api/standards/jurisdictions", async (req: any, res) => {
    try {
      const country = req.query.country as string | undefined;
      const jurisdictions = await storage.getJurisdictions(country);
      res.json(jurisdictions);
    } catch (error) {
      console.error("Get jurisdictions error:", error);
      res.status(500).json({ error: "Failed to get jurisdictions" });
    }
  });


  // Public API to get standards for lesson planning (used by frontend)
  app.get("/api/standards/countries", async (req, res) => {
    try {
      const jurisdictions = await storage.getJurisdictions();
      const countries = Array.from(new Set(jurisdictions.map(j => j.country)));
      res.json(countries);
    } catch (error) {
      console.error("Get countries error:", error);
      res.status(500).json({ error: "Failed to get countries" });
    }
  });


  app.get("/api/standards/states/:country", async (req, res) => {
    try {
      const { country } = req.params;
      const jurisdictions = await storage.getJurisdictions(country);
      
      // For US, merge CSP database with fallback standards
      if (country === 'United States') {
        // Filter CSP by state NAME to avoid conflicts with organizations
        const cspStates = jurisdictions.filter(j => US_STATES[j.name] !== undefined);
        const cspStateNames = new Set(cspStates.map(j => j.name));
        
        // Import fallback standards for states not in CSP
        const { getStates } = await import("@shared/standards");
        const fallbackStates = getStates(country);
        
        // Combine: CSP states + fallback states not already in CSP
        // Note: jurisdictions with source='manual' should show as 'manual' not 'csp'
        const result = cspStates.map(j => ({
          state: j.name,
          abbreviation: US_STATES[j.name] || j.abbreviation,
          standardsName: j.standardsName,
          source: (j.source === 'manual' ? 'manual' : 'csp') as 'csp' | 'manual' | 'fallback',
        }));
        
        // Add fallback states that aren't in CSP
        for (const fb of fallbackStates) {
          if (!cspStateNames.has(fb.state)) {
            result.push({
              state: fb.state,
              abbreviation: fb.abbreviation,
              standardsName: fb.standardsName,
              source: 'fallback' as const,
            });
          }
        }
        
        // Sort alphabetically by state name
        result.sort((a, b) => a.state.localeCompare(b.state));
        res.json(result);
        return;
      }
      
      res.json(jurisdictions.map(j => ({
        state: j.name,
        abbreviation: j.abbreviation,
        standardsName: j.standardsName,
        source: 'csp' as const,
      })));
    } catch (error) {
      console.error("Get states error:", error);
      res.status(500).json({ error: "Failed to get states" });
    }
  });


  app.get("/api/standards/subjects/:country/:stateAbbr", async (req, res) => {
    try {
      const { country, stateAbbr } = req.params;
      
      // For US, look up by state name instead of abbreviation (database has wrong abbreviations)
      let jurisdiction;
      if (country === 'United States') {
        const stateName = getStateNameFromAbbr(stateAbbr);
        if (stateName) {
          const jurisdictions = await storage.getJurisdictions(country);
          jurisdiction = jurisdictions.find(j => j.name === stateName);
        }
      } else {
        jurisdiction = await storage.getJurisdictionByAbbr(country, stateAbbr);
      }
      
      // Try CSP first if a jurisdiction exists with actual standard sets.
      const sets = jurisdiction ? await storage.getStandardSets(jurisdiction.id) : [];
      if (jurisdiction && sets.length > 0) {
        const subjects = Array.from(new Set(sets.map(s => s.subject)));
        res.json(subjects.map(subject => ({ subject, source: 'csp' })));
        return;
      }

      // Otherwise fall back to the static curriculum file. This covers two cases:
      //   (a) jurisdiction missing entirely (no DB row), and
      //   (b) jurisdiction seeded but no standard sets attached — common for
      //       Nigerian/Philippine/etc. regions where CSP doesn't actually publish
      //       per-outcome curricula. Without this, those users see an empty
      //       subjects dropdown and a dead-end UI.
      const { getSubjects } = await import("@shared/standards");
      const fallbackSubjects = getSubjects(country, stateAbbr);
      if (fallbackSubjects.length > 0) {
        res.json(fallbackSubjects.map(s => ({ subject: s.subject, source: 'fallback' })));
        return;
      }
      res.json([]);
    } catch (error) {
      console.error("Get subjects error:", error);
      res.status(500).json({ error: "Failed to get subjects" });
    }
  });


  app.get("/api/standards/codes/:country/:stateAbbr/:subject", async (req, res) => {
    try {
      const { country, stateAbbr, subject } = req.params;
      const gradeLevels = req.query.gradeLevels as string | undefined;
      const gradeLevelsArray = gradeLevels ? gradeLevels.split(',') : [];
      
      // For US, look up by state name instead of abbreviation (database has wrong abbreviations)
      let jurisdiction;
      if (country === 'United States') {
        const stateName = getStateNameFromAbbr(stateAbbr);
        if (stateName) {
          const jurisdictions = await storage.getJurisdictions(country);
          jurisdiction = jurisdictions.find(j => j.name === stateName);
        }
      } else {
        jurisdiction = await storage.getJurisdictionByAbbr(country, stateAbbr);
      }
      
      // If no CSP jurisdiction found OR jurisdiction has no standard sets,
      // fall through to the static curriculum file (mirrors the subjects route).
      const sets = jurisdiction ? await storage.getStandardSets(jurisdiction.id) : [];
      if (!jurisdiction || sets.length === 0) {
        const { getStandardCodes } = await import("@shared/standards");
        const fallbackCodes = getStandardCodes(country, stateAbbr, subject);
        // Always respond — many international curricula intentionally have no
        // per-outcome codes; the lesson generator handles empty arrays.
        res.json(fallbackCodes.map(s => ({
          code: s.code,
          description: s.description,
          source: 'fallback',
        })));
        return;
      }

      const subjectSet = sets.find(s => s.subject === subject);
      if (!subjectSet) {
        // Try fallback for missing subjects in CSP
        const { getStandardCodes } = await import("@shared/standards");
        const fallbackCodes = getStandardCodes(country, stateAbbr, subject);
        if (fallbackCodes.length > 0) {
          res.json(fallbackCodes.map(s => ({
            code: s.code,
            description: s.description,
            source: 'fallback',
          })));
          return;
        }
        res.json([]);
        return;
      }
      
      // Use grade level filtering if provided
      const standards = gradeLevelsArray.length > 0
        ? await storage.getEducationalStandardsByGradeLevels(subjectSet.id, gradeLevelsArray)
        : await storage.getEducationalStandards(subjectSet.id);
        
      res.json(standards.map(s => ({
        code: s.humanCoding,
        description: s.statement,
        gradeLevel: s.gradeLevel,
        source: 'csp',
      })));
    } catch (error) {
      console.error("Get standard codes error:", error);
      res.status(500).json({ error: "Failed to get standard codes" });
    }
  });

  
  // Get standards filtered by user's saved grade preferences
  app.get("/api/standards/my-codes/:country/:stateAbbr/:subject", isAuthenticated, async (req: any, res) => {
    try {
      const { country, stateAbbr, subject } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Get user preferences to find their grade levels
      const prefs = await storage.getUserPreferences(userId);
      const gradeLevels = prefs?.gradeBands || prefs?.gradeLevels || [];
      
      // For US, look up by state name instead of abbreviation
      let jurisdiction;
      if (country === 'United States') {
        const stateName = getStateNameFromAbbr(stateAbbr);
        if (stateName) {
          const jurisdictions = await storage.getJurisdictions(country);
          jurisdiction = jurisdictions.find(j => j.name === stateName);
        }
      } else {
        jurisdiction = await storage.getJurisdictionByAbbr(country, stateAbbr);
      }
      
      if (!jurisdiction) {
        const { getStandardCodes } = await import("@shared/standards");
        const fallbackCodes = getStandardCodes(country, stateAbbr, subject);
        res.json(fallbackCodes.map(s => ({
          code: s.code,
          description: s.description,
          source: 'fallback',
        })));
        return;
      }
      
      const sets = await storage.getStandardSets(jurisdiction.id);
      const subjectSet = sets.find(s => s.subject === subject);
      if (!subjectSet) {
        const { getStandardCodes } = await import("@shared/standards");
        const fallbackCodes = getStandardCodes(country, stateAbbr, subject);
        res.json(fallbackCodes.map(s => ({
          code: s.code,
          description: s.description,
          source: 'fallback',
        })));
        return;
      }
      
      // Filter by user's grade preferences
      const standards = (gradeLevels as string[]).length > 0
        ? await storage.getEducationalStandardsByGradeLevels(subjectSet.id, gradeLevels as string[])
        : await storage.getEducationalStandards(subjectSet.id);
        
      res.json({
        standards: standards.map(s => ({
          code: s.humanCoding,
          description: s.statement,
          gradeLevel: s.gradeLevel,
          source: 'csp',
        })),
        userGradeLevels: gradeLevels,
        filteredByGrade: (gradeLevels as string[]).length > 0,
      });
    } catch (error) {
      console.error("Get my standard codes error:", error);
      res.status(500).json({ error: "Failed to get standard codes" });
    }
  });


  // ===========================================
  // CAMPUS LESSON AUTHORS (Campus Admin Only)
  // ===========================================

  // Get campus lesson authors for an organization
  app.get("/api/campus/lesson-authors", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      const isCampusAdmin = user.role === "campus_admin" || user.role === "district_admin";
      
      if (!isSiteAdminUser && !isCampusAdmin) {
        res.status(403).json({ error: "Campus admin access required" });
        return;
      }
      
      // Get organization from user's membership or query param
      const organizationId = req.query.organizationId as string;
      if (!organizationId) {
        res.status(400).json({ error: "Organization ID required" });
        return;
      }
      
      // Verify campus admin is a member of this organization (site admins can access any)
      if (!isSiteAdminUser) {
        const membership = await storage.getOrgMembership(organizationId, userId!);
        if (!membership || !["admin", "owner"].includes(membership.role as string)) {
          res.status(403).json({ error: "You must be an admin of this organization to manage lesson authors" });
          return;
        }
      }
      
      const authors = await storage.getCampusLessonAuthors(organizationId);
      // Enrich with user info
      const enrichedAuthors = await Promise.all(
        authors.map(async (author) => {
          const authorUser = await storage.getUser(author.userId);
          return {
            ...author,
            userName: authorUser ? `${authorUser.firstName || ""} ${authorUser.lastName || ""}`.trim() : "Unknown",
            userEmail: authorUser?.email || "",
          };
        })
      );
      res.json(enrichedAuthors);
    } catch (error) {
      console.error("Error fetching campus lesson authors:", error);
      res.status(500).json({ error: "Failed to fetch campus lesson authors" });
    }
  });


  // Create a campus lesson author
  app.post("/api/campus/lesson-authors", isAuthenticated, async (req: any, res) => {
    try {
      const adminUserId = req.user?.claims?.sub;
      const user = await storage.getUser(adminUserId);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      
      const isSiteAdminUser = await storage.isSiteAdmin(adminUserId);
      const isCampusAdmin = user.role === "campus_admin" || user.role === "district_admin";
      
      if (!isSiteAdminUser && !isCampusAdmin) {
        res.status(403).json({ error: "Campus admin access required" });
        return;
      }
      
      const { userId, organizationId, specializations, bio } = req.body;
      
      if (!userId || !organizationId) {
        res.status(400).json({ error: "User ID and Organization ID required" });
        return;
      }
      
      // Verify campus admin is a member of this organization (site admins can manage any)
      if (!isSiteAdminUser) {
        const membership = await storage.getOrgMembership(organizationId, adminUserId!);
        if (!membership || !["admin", "owner"].includes(membership.role as string)) {
          res.status(403).json({ error: "You must be an admin of this organization to add lesson authors" });
          return;
        }
      }
      
      // Check if already an author for this campus
      const existing = await storage.getCampusLessonAuthor(userId, organizationId);
      if (existing) {
        res.status(400).json({ error: "User is already a campus lesson author for this organization" });
        return;
      }
      
      const author = await storage.createCampusLessonAuthor({
        userId,
        organizationId,
        authorizedBy: adminUserId,
        specializations: specializations || [],
        bio: bio || null,
        status: "active",
      });
      
      res.status(201).json(author);
    } catch (error) {
      console.error("Error creating campus lesson author:", error);
      res.status(500).json({ error: "Failed to create campus lesson author" });
    }
  });


  // Update a campus lesson author
  app.patch("/api/campus/lesson-authors/:userId/:organizationId", isAuthenticated, async (req: any, res) => {
    try {
      const adminUserId = req.user?.claims?.sub;
      const user = await storage.getUser(adminUserId);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      
      const isSiteAdminUser = await storage.isSiteAdmin(adminUserId);
      const isCampusAdmin = user.role === "campus_admin" || user.role === "district_admin";
      
      if (!isSiteAdminUser && !isCampusAdmin) {
        res.status(403).json({ error: "Campus admin access required" });
        return;
      }
      
      const { userId, organizationId } = req.params;
      const updates = req.body;
      
      // Verify campus admin is a member of this organization (site admins can manage any)
      if (!isSiteAdminUser) {
        const membership = await storage.getOrgMembership(organizationId, adminUserId!);
        if (!membership || !["admin", "owner"].includes(membership.role as string)) {
          res.status(403).json({ error: "You must be an admin of this organization to update lesson authors" });
          return;
        }
      }
      
      const updated = await storage.updateCampusLessonAuthor(userId, organizationId, updates);
      if (!updated) {
        res.status(404).json({ error: "Campus lesson author not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating campus lesson author:", error);
      res.status(500).json({ error: "Failed to update campus lesson author" });
    }
  });


  // Delete a campus lesson author
  app.delete("/api/campus/lesson-authors/:userId/:organizationId", isAuthenticated, async (req: any, res) => {
    try {
      const adminUserId = req.user?.claims?.sub;
      const user = await storage.getUser(adminUserId);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      
      const isSiteAdminUser = await storage.isSiteAdmin(adminUserId);
      const isCampusAdmin = user.role === "campus_admin" || user.role === "district_admin";
      
      if (!isSiteAdminUser && !isCampusAdmin) {
        res.status(403).json({ error: "Campus admin access required" });
        return;
      }
      
      const { userId, organizationId } = req.params;
      
      // Verify campus admin is a member of this organization (site admins can manage any)
      if (!isSiteAdminUser) {
        const membership = await storage.getOrgMembership(organizationId, adminUserId!);
        if (!membership || !["admin", "owner"].includes(membership.role as string)) {
          res.status(403).json({ error: "You must be an admin of this organization to remove lesson authors" });
          return;
        }
      }
      await storage.deleteCampusLessonAuthor(userId, organizationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing campus lesson author:", error);
      res.status(500).json({ error: "Failed to remove campus lesson author" });
    }
  });


  // Check if current user is a campus lesson author
  app.get("/api/campus/lesson-author/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const organizationId = req.query.organizationId as string | undefined;
      
      const isAuthor = await storage.isCampusLessonAuthor(userId, organizationId);
      let author = null;
      if (isAuthor) {
        author = organizationId 
          ? await storage.getCampusLessonAuthor(userId, organizationId)
          : await storage.getCampusLessonAuthorByUserId(userId);
      }
      res.json({ isAuthor, author });
    } catch (error) {
      console.error("Error checking campus author status:", error);
      res.status(500).json({ error: "Failed to check campus author status" });
    }
  });


  // Get current user's organizations
  app.get("/api/organizations/mine", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const memberships = await storage.getUserOrganizations(userId);
      
      const orgsWithDetails = await Promise.all(
        memberships.map(async (m) => {
          const org = await storage.getOrganization(m.organizationId);
          return { ...m, organization: org };
        })
      );
      
      res.json(orgsWithDetails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });


  app.get("/api/organizations/:orgId/children", isAuthenticated, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const children = await storage.getChildOrganizations(orgId);
      res.json(children);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch child organizations" });
    }
  });


  // Organization-scoped classroom data
  app.get("/api/orgs/:orgId/classes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { orgId } = req.params;
      const includeHierarchy = req.query.hierarchy === "true";
      
      const membership = await storage.getOrgMembership(orgId, userId);
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      
      if (!membership && !isSiteAdminUser) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      
      const classes = includeHierarchy 
        ? await storage.getClassesByOrganizationHierarchy(orgId)
        : await storage.getClassesByOrganization(orgId);
      
      res.json(classes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch organization classes" });
    }
  });


  app.get("/api/orgs/:orgId/students", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { orgId } = req.params;
      const includeHierarchy = req.query.hierarchy === "true";
      
      const membership = await storage.getOrgMembership(orgId, userId);
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      
      if (!membership && !isSiteAdminUser) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      
      const studentList = includeHierarchy 
        ? await storage.getStudentsByOrganizationHierarchy(orgId)
        : await storage.getStudentsByOrganization(orgId);
      
      res.json(studentList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch organization students" });
    }
  });


  // Get organizations by type (country, state, district, school, etc.)
  // Only returns orgs the user has access to
  app.get("/api/organizations/by-type/:type", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { type } = req.params;
      
      // Validate type against allowed values
      if (!validOrgTypes.includes(type)) {
        res.status(400).json({ error: "Invalid organization type" });
        return;
      }
      
      // Get user's org memberships
      const userMemberships = await storage.getUserOrganizations(userId);
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      
      const allOrgs = await storage.getOrganizationsByType(type);
      
      // Site admins can see all, others only see orgs they're members of or descendants of
      if (isSiteAdminUser) {
        res.json(allOrgs);
        return;
      }
      
      // Filter to only orgs user has access to
      const userOrgIds = new Set(userMemberships.map(m => m.organizationId));
      const accessibleOrgs = allOrgs.filter(org => userOrgIds.has(org.id));
      res.json(accessibleOrgs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch organizations by type" });
    }
  });


  // Get full hierarchy for an organization (ancestors up to root)
  // Requires membership in the org or site admin
  app.get("/api/organizations/:orgId/hierarchy", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { orgId } = req.params;
      
      // Check access
      const membership = await storage.getOrgMembership(orgId, userId);
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      
      if (!membership && !isSiteAdminUser) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      
      const hierarchy = await storage.getOrganizationHierarchy(orgId);
      res.json({
        hierarchy,
        levels: hierarchy.map(h => ({ id: h.id, name: h.name, type: h.type }))
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch organization hierarchy" });
    }
  });


  // Get all descendants of an organization
  // Requires membership in the org or site admin
  app.get("/api/organizations/:orgId/descendants", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { orgId } = req.params;
      
      // Check access
      const membership = await storage.getOrgMembership(orgId, userId);
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      
      if (!membership && !isSiteAdminUser) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      
      const descendants = await storage.getAllDescendants(orgId);
      res.json(descendants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch organization descendants" });
    }
  });


  // Get all schools/campuses under an organization
  // Requires membership in the org or site admin
  app.get("/api/organizations/:orgId/schools", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { orgId } = req.params;
      
      // Check access
      const membership = await storage.getOrgMembership(orgId, userId);
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      
      if (!membership && !isSiteAdminUser) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      
      const schools = await storage.getSchoolsInHierarchy(orgId);
      res.json(schools);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schools in hierarchy" });
    }
  });


  // Validate if a student can be enrolled in a class
  app.post("/api/enrollment/validate", isAuthenticated, async (req: any, res) => {
    try {
      const { studentId, classId } = req.body;
      if (!studentId || !classId) {
        res.status(400).json({ error: "studentId and classId are required" });
        return;
      }
      const result = await storage.validateEnrollment(studentId, classId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to validate enrollment" });
    }
  });


  app.post("/api/orgs/:orgId/share", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { orgId } = req.params;
      
      const parsed = entityShareBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid share data", details: parsed.error.errors });
        return;
      }
      
      const { entityType, entityId, targetOrganizationId, permission } = parsed.data;
      
      const membership = await storage.getOrgMembership(orgId, userId);
      if (!membership || membership.role === "member") {
        res.status(403).json({ error: "Admin access required to share" });
        return;
      }
      
      const targetOrg = await storage.getOrganization(targetOrganizationId);
      if (!targetOrg) {
        res.status(400).json({ error: "Target organization not found" });
        return;
      }
      
      const share = await storage.createEntityShare({
        entityType,
        entityId,
        sourceOrganizationId: orgId,
        targetOrganizationId,
        permission,
        sharedBy: userId,
      });
      
      res.json(share);
    } catch (error) {
      res.status(500).json({ error: "Failed to share entity" });
    }
  });


  app.get("/api/orgs/:orgId/shared-with-us", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { orgId } = req.params;
      
      const membership = await storage.getOrgMembership(orgId, userId);
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      
      if (!membership && !isSiteAdminUser) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      
      const shares = await storage.getSharedWithOrganization(orgId);
      res.json(shares);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shared entities" });
    }
  });


  // Campus Admin Analytics - aggregate data across organization
  app.get("/api/campus-analytics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      // Check if user is campus_admin
      if (user?.role !== "campus_admin") {
        res.status(403).json({ error: "Campus admin access required" });
        return;
      }
      
      // Get user's organizations
      const memberships = await storage.getUserOrganizations(userId);
      const orgIds = memberships.map(m => m.organizationId);
      
      if (orgIds.length === 0) {
        res.json({
          totalEducators: 0,
          totalStudents: 0,
          totalLessons: 0,
          totalGoals: 0,
          lessonsThisWeek: 0,
          lessonsLastWeek: 0,
          goalsCompleted: 0,
          goalsInProgress: 0,
          standardsCoverage: {},
          bkdDistribution: { be: 0, know: 0, do: 0 },
          activityByWeek: [],
          topEducators: [],
          organizations: [],
        });
        return;
      }
      
      // Get organization details
      const orgs = await Promise.all(
        orgIds.map(async (id) => {
          const org = await storage.getOrganization(id);
          const members = await storage.getOrganizationMembers(id);
          return { ...org, memberCount: members.length };
        })
      );
      
      // Get all members across organizations
      const allMembers = await Promise.all(
        orgIds.map(async (id) => storage.getOrganizationMembers(id))
      );
      const memberUserIds = allMembers.flat().map(m => m.userId);
      
      // Count educators and students
      const memberDetails = await Promise.all(
        memberUserIds.map(async (uid) => storage.getUser(uid))
      );
      const educators = memberDetails.filter(u => u?.role === "educator").length;
      const students = memberDetails.filter(u => u?.role === "student").length;
      
      // Get all lessons from organization members
      const allLessons = await Promise.all(
        memberUserIds.map(async (uid: string) => storage.getLessons(uid))
      );
      const lessons = allLessons.flat();
      
      // Get all goals from organization members
      const allGoals = await Promise.all(
        memberUserIds.map(async (uid: string) => storage.getGoals(uid))
      );
      const goals = allGoals.flat();
      
      // Calculate weekly stats
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      const lessonsThisWeek = lessons.filter((l: Lesson) => 
        l.createdAt && new Date(l.createdAt) >= oneWeekAgo
      ).length;
      const lessonsLastWeek = lessons.filter((l: Lesson) => 
        l.createdAt && new Date(l.createdAt) >= twoWeeksAgo && new Date(l.createdAt) < oneWeekAgo
      ).length;
      
      // Goals stats
      const goalsCompleted = goals.filter((g: Goal) => g.status === "completed").length;
      const goalsInProgress = goals.filter((g: Goal) => g.status === "in_progress").length;
      
      // Standards coverage
      const standardsCoverage: Record<string, number> = {};
      lessons.forEach((l: Lesson) => {
        const stds = (l.standards || "").split(",").map((s: string) => s.trim()).filter(Boolean);
        stds.forEach((s: string) => {
          const prefix = s.split(".")[0] || s.substring(0, 4);
          standardsCoverage[prefix] = (standardsCoverage[prefix] || 0) + 1;
        });
      });
      
      // BKD distribution
      const bkdDistribution = { be: 0, know: 0, do: 0 };
      lessons.forEach((l: Lesson) => {
        const focus = l.bkdFocus as "be" | "know" | "do";
        if (focus && bkdDistribution[focus] !== undefined) {
          bkdDistribution[focus]++;
        }
      });
      
      // Activity by week (last 4 weeks)
      const getWeek = (date: Date) => {
        const diff = Math.floor((now.getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000));
        if (diff === 0) return "This Week";
        if (diff === 1) return "Last Week";
        if (diff === 2) return "2 Weeks Ago";
        return "3+ Weeks Ago";
      };
      
      const activityMap: Record<string, { lessons: number; goals: number }> = {
        "This Week": { lessons: 0, goals: 0 },
        "Last Week": { lessons: 0, goals: 0 },
        "2 Weeks Ago": { lessons: 0, goals: 0 },
        "3+ Weeks Ago": { lessons: 0, goals: 0 },
      };
      
      lessons.forEach((l: Lesson) => {
        if (l.createdAt) activityMap[getWeek(new Date(l.createdAt))].lessons++;
      });
      goals.forEach((g: Goal) => {
        if (g.createdAt) activityMap[getWeek(new Date(g.createdAt))].goals++;
      });
      
      // Top educators by lesson count
      const lessonsByUser: Record<string, number> = {};
      lessons.forEach((l: Lesson) => {
        lessonsByUser[l.userId] = (lessonsByUser[l.userId] || 0) + 1;
      });
      
      const topEducators = await Promise.all(
        Object.entries(lessonsByUser)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(async ([uid, count]) => {
            const user = await storage.getUser(uid);
            return {
              id: uid,
              name: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown" : "Unknown",
              lessonCount: count,
            };
          })
      );
      
      res.json({
        totalEducators: educators,
        totalStudents: students,
        totalLessons: lessons.length,
        totalGoals: goals.length,
        lessonsThisWeek,
        lessonsLastWeek,
        goalsCompleted,
        goalsInProgress,
        standardsCoverage,
        bkdDistribution,
        activityByWeek: [
          { name: "3+ Weeks", ...activityMap["3+ Weeks Ago"] },
          { name: "2 Weeks", ...activityMap["2 Weeks Ago"] },
          { name: "Last Week", ...activityMap["Last Week"] },
          { name: "This Week", ...activityMap["This Week"] },
        ],
        topEducators,
        organizations: orgs,
      });
    } catch (error) {
      console.error("Campus analytics error:", error);
      res.status(500).json({ error: "Failed to fetch campus analytics" });
    }
  });


  // District Analytics - aggregates data across all schools in a district
  app.get("/api/district-analytics", isAuthenticated, async (req: any, res) => {
    try {
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
      
      // Get user's organizations
      const memberships = await storage.getUserOrganizations(userId);
      
      // Find districts where user is admin or owner (not just member)
      const districtIds: string[] = [];
      const districts: Array<{ id: string; name: string; type: string }> = [];
      
      for (const m of memberships) {
        // Only allow admin or owner access to district analytics
        if (m.role !== "admin" && m.role !== "owner") continue;
        
        const org = await storage.getOrganization(m.organizationId);
        if (org?.type === "district") {
          districtIds.push(org.id);
          districts.push({ id: org.id, name: org.name, type: org.type });
        }
      }
      
      if (districtIds.length === 0) {
        res.json({
          isDistrictAdmin: false,
          districts: [],
          schools: [],
          totalSchools: 0,
          totalEducators: 0,
          totalStudents: 0,
          totalLessons: 0,
          totalGoals: 0,
        });
        return;
      }
      
      // Get all child schools under these districts
      const allSchools: Array<{ id: string; name: string; districtId: string; memberCount: number; educatorCount: number; studentCount: number; lessonCount: number; goalCount: number }> = [];
      
      for (const districtId of districtIds) {
        const childOrgs = await storage.getChildOrganizations(districtId);
        for (const school of childOrgs) {
          const members = await storage.getOrganizationMembers(school.id);
          // Filter out any null/undefined userIds
          const memberUserIds = members.map(m => m.userId).filter((uid): uid is string => !!uid);
          
          // Get member details
          const memberDetails = await Promise.all(
            memberUserIds.map(async (uid) => storage.getUser(uid))
          );
          const educatorCount = memberDetails.filter(u => u?.role === "educator").length;
          const studentCount = memberDetails.filter(u => u?.role === "student").length;
          
          // Get lessons and goals from this school's members with error handling
          let lessonCount = 0;
          let goalCount = 0;
          
          for (const uid of memberUserIds) {
            try {
              const lessons = await storage.getLessons(uid);
              const goals = await storage.getGoals(uid);
              lessonCount += lessons.length;
              goalCount += goals.length;
            } catch (err) {
              console.error(`Error fetching data for user ${uid}:`, err);
            }
          }
          
          allSchools.push({
            id: school.id,
            name: school.name,
            districtId: districtId,
            memberCount: members.length,
            educatorCount,
            studentCount,
            lessonCount,
            goalCount,
          });
        }
      }
      
      // Aggregate totals
      const totalEducators = allSchools.reduce((sum, s) => sum + s.educatorCount, 0);
      const totalStudents = allSchools.reduce((sum, s) => sum + s.studentCount, 0);
      const totalLessons = allSchools.reduce((sum, s) => sum + s.lessonCount, 0);
      const totalGoals = allSchools.reduce((sum, s) => sum + s.goalCount, 0);
      
      res.json({
        isDistrictAdmin: true,
        districts,
        schools: allSchools,
        totalSchools: allSchools.length,
        totalEducators,
        totalStudents,
        totalLessons,
        totalGoals,
      });
    } catch (error) {
      console.error("District analytics error:", error);
      res.status(500).json({ error: "Failed to fetch district analytics" });
    }
  });


  // Invite user to organization
  app.post("/api/organizations/:id/invite", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { email, role, personType } = req.body;
      const userId = req.user?.claims?.sub;
      
      const user = await storage.getUser(userId);
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      const isCampusOrHigher = user && ["campus_admin", "district_admin", "site_admin", "system_admin"].includes(user.role || "");
      const membership = await storage.getOrgMembership(id, userId);
      
      if (!isSiteAdminUser && !isCampusOrHigher && (!membership || membership.role === "member")) {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      
      const token = randomUUID().replace(/-/g, "").substring(0, 32);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      const invitation = await storage.createOrgInvitation({
        organizationId: id,
        email,
        role: role || "member",
        personType: personType || "educator",
        token,
        invitedBy: userId,
        expiresAt,
      });
      
      res.json(invitation);
    } catch (error) {
      res.status(500).json({ error: "Failed to create invitation" });
    }
  });


  // Accept invitation
  app.post("/api/organizations/accept-invite", isAuthenticated, async (req: any, res) => {
    try {
      const { token } = req.body;
      const userId = req.user?.claims?.sub;
      
      const membership = await storage.acceptOrgInvitation(token, userId);
      if (!membership) {
        res.status(400).json({ error: "Invalid or expired invitation" });
        return;
      }
      
      res.json(membership);
    } catch (error) {
      res.status(500).json({ error: "Failed to accept invitation" });
    }
  });


  // Update member role
  app.patch("/api/organizations/:orgId/members/:memberId", isAuthenticated, async (req: any, res) => {
    try {
      const { orgId, memberId } = req.params;
      const { role, status } = req.body;
      const userId = req.user?.claims?.sub;
      
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      const membership = await storage.getOrgMembership(orgId, userId);
      
      if (!isSiteAdminUser && (!membership || membership.role !== "owner")) {
        res.status(403).json({ error: "Owner access required" });
        return;
      }
      
      const updated = await storage.updateOrgMembership(memberId, { role, status });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update member" });
    }
  });


  // Remove member from organization
  app.delete("/api/organizations/:orgId/members/:memberId", isAuthenticated, async (req: any, res) => {
    try {
      const { orgId, memberId } = req.params;
      const userId = req.user?.claims?.sub;
      
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      const membership = await storage.getOrgMembership(orgId, userId);
      
      if (!isSiteAdminUser && (!membership || membership.role === "member")) {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      
      await storage.deleteOrgMembership(memberId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove member" });
    }
  });


  // Bulk invite members to organization (CSV data)
  app.post("/api/organizations/:id/bulk-invite", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { people } = req.body;
      const userId = req.user?.claims?.sub;

      const user = await storage.getUser(userId);
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      const isCampusOrHigher = user && ["campus_admin", "district_admin", "site_admin", "system_admin"].includes(user.role || "");
      const membership = await storage.getOrgMembership(id, userId);

      if (!isSiteAdminUser && !isCampusOrHigher && (!membership || membership.role === "member")) {
        res.status(403).json({ error: "Admin access required" });
        return;
      }

      if (!Array.isArray(people) || people.length === 0) {
        res.status(400).json({ error: "No people data provided" });
        return;
      }

      if (people.length > 500) {
        res.status(400).json({ error: "Maximum 500 people per batch" });
        return;
      }

      const results = { success: 0, failed: 0, errors: [] as { row: number; email: string; message: string }[] };

      for (let i = 0; i < people.length; i++) {
        const person = people[i];
        const email = person.email?.trim();
        const role = person.role?.trim()?.toLowerCase() || "member";
        const personType = person.personType?.trim()?.toLowerCase() || "educator";

        if (!email || !email.includes("@")) {
          results.errors.push({ row: i + 1, email: email || "(empty)", message: "Invalid email address" });
          results.failed++;
          continue;
        }

        if (!["member", "admin", "owner"].includes(role)) {
          results.errors.push({ row: i + 1, email, message: `Invalid role "${role}". Use member, admin, or owner.` });
          results.failed++;
          continue;
        }

        const validPersonTypes = ["educator", "student", "mentor", "parent", "employer", "counselor", "administrator", "volunteer", "other"];
        const finalPersonType = validPersonTypes.includes(personType) ? personType : "educator";

        try {
          const token = randomUUID().replace(/-/g, "").substring(0, 32);
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

          await storage.createOrgInvitation({
            organizationId: id,
            email,
            role,
            personType: finalPersonType,
            token,
            invitedBy: userId,
            expiresAt,
          });
          results.success++;
        } catch (err) {
          results.errors.push({ row: i + 1, email, message: "Failed to create invitation" });
          results.failed++;
        }
      }

      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to process bulk invitations" });
    }
  });


  // Bulk remove members from organization
  app.post("/api/organizations/:orgId/bulk-remove", isAuthenticated, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const { memberIds } = req.body;
      const userId = req.user?.claims?.sub;

      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      const user = await storage.getUser(userId);
      const isCampusOrHigher = user && ["campus_admin", "district_admin", "site_admin", "system_admin"].includes(user.role || "");
      const membership = await storage.getOrgMembership(orgId, userId);

      if (!isSiteAdminUser && !isCampusOrHigher && (!membership || membership.role === "member")) {
        res.status(403).json({ error: "Admin access required" });
        return;
      }

      if (!Array.isArray(memberIds) || memberIds.length === 0) {
        res.status(400).json({ error: "No members selected" });
        return;
      }

      let removed = 0;
      let failed = 0;
      for (const memberId of memberIds) {
        try {
          await storage.deleteOrgMembership(memberId);
          removed++;
        } catch {
          failed++;
        }
      }

      res.json({ removed, failed });
    } catch (error) {
      res.status(500).json({ error: "Failed to bulk remove members" });
    }
  });


  // ================================
  // Global Authority Tree (LYS V3.0)
  // ================================

  // Get all authorities (optionally filtered by level)
  app.get("/api/authorities", async (req, res) => {
    try {
      const { level } = req.query;
      const authoritiesList = await storage.getAuthorities(level as string | undefined);
      res.json(authoritiesList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch authorities" });
    }
  });


  // Get single authority
  app.get("/api/authorities/:id", async (req, res) => {
    try {
      const authority = await storage.getAuthority(req.params.id);
      if (!authority) {
        res.status(404).json({ error: "Authority not found" });
        return;
      }
      res.json(authority);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch authority" });
    }
  });


  // Get child authorities
  app.get("/api/authorities/:id/children", async (req, res) => {
    try {
      const children = await storage.getChildAuthorities(req.params.id);
      res.json(children);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch child authorities" });
    }
  });


  // Create authority (admin only)
  app.post("/api/authorities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const isSiteAdmin = await storage.isSiteAdmin(userId);
      if (!isSiteAdmin) {
        res.status(403).json({ error: "Site admin access required" });
        return;
      }
      const authority = await storage.createAuthority(req.body);
      res.status(201).json(authority);
    } catch (error) {
      res.status(500).json({ error: "Failed to create authority" });
    }
  });


  // Update authority (admin only)
  app.patch("/api/authorities/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const isSiteAdmin = await storage.isSiteAdmin(userId);
      if (!isSiteAdmin) {
        res.status(403).json({ error: "Site admin access required" });
        return;
      }
      const authority = await storage.updateAuthority(req.params.id, req.body);
      if (!authority) {
        res.status(404).json({ error: "Authority not found" });
        return;
      }
      res.json(authority);
    } catch (error) {
      res.status(500).json({ error: "Failed to update authority" });
    }
  });


  // Get alignment matrix for an authority
  app.get("/api/alignment-matrix/:authorityId", async (req, res) => {
    try {
      const matrix = await storage.getAlignmentMatrixByAuthority(req.params.authorityId);
      if (!matrix) {
        res.status(404).json({ error: "Alignment matrix not found" });
        return;
      }
      res.json(matrix);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alignment matrix" });
    }
  });


  // ================================
  // Country Affordability Index (CAI) Pricing
  // ================================
  // Based on The Nomad Network Global Pricing System
  // Enables equitable, cross-border pricing based on local purchasing power
  
  // Get all CAI countries
  app.get("/api/cai/countries", async (req, res) => {
    try {
      const countries = await storage.getCAICountries();
      res.json(countries);
    } catch (error) {
      console.error("Failed to get CAI countries:", error);
      res.status(500).json({ error: "Failed to get CAI countries" });
    }
  });


  // Get CAI country by code
  app.get("/api/cai/countries/:code", async (req, res) => {
    try {
      const country = await storage.getCAICountry(req.params.code);
      if (!country) {
        res.status(404).json({ error: "Country not found" });
        return;
      }
      res.json(country);
    } catch (error) {
      console.error("Failed to get CAI country:", error);
      res.status(500).json({ error: "Failed to get CAI country" });
    }
  });


  // Get countries by region
  app.get("/api/cai/regions/:region", async (req, res) => {
    try {
      const countries = await storage.getCAICountriesByRegion(req.params.region);
      res.json(countries);
    } catch (error) {
      console.error("Failed to get CAI countries by region:", error);
      res.status(500).json({ error: "Failed to get CAI countries by region" });
    }
  });


  // Calculate CAI-adjusted pricing
  // Formula: Recommended Price = Global Reference Price × (CAI Score + LCSI Adjustment)
  app.get("/api/cai/pricing/:countryCode", async (req, res) => {
    try {
      const country = await storage.getCAICountry(req.params.countryCode);
      if (!country) {
        res.status(404).json({ error: "Country not found" });
        return;
      }

      const basePrices = {
        free: { base: 0, name: "Free" },
        pro: { base: 7.99, name: "Pro" },
        campus: { base: 299, name: "Campus" },
        enterprise: { base: 599, name: "Enterprise" },
      };

      const adjustmentFactor = country.caiScore + country.lcsiAdjustment;
      
      const pricing = Object.entries(basePrices).map(([tier, info]) => {
        const adjustedPrice = Math.round(info.base * adjustmentFactor * 100) / 100;
        const savings = info.base - adjustedPrice;
        const savingsPercent = info.base > 0 ? Math.round((savings / info.base) * 100) : 0;
        
        return {
          tier,
          name: info.name,
          globalPrice: info.base,
          adjustedPrice: adjustedPrice,
          savings: savings,
          savingsPercent: savingsPercent,
          currency: "USD",
        };
      });

      res.json({
        country,
        adjustmentFactor,
        pricing,
        methodology: {
          formula: "Adjusted Price = Global Reference Price × (CAI Score + LCSI Adjustment)",
          caiScore: country.caiScore,
          lcsiAdjustment: country.lcsiAdjustment,
          description: "Prices adjusted based on local purchasing power to ensure equitable access globally.",
        },
      });
    } catch (error) {
      console.error("Failed to calculate CAI pricing:", error);
      res.status(500).json({ error: "Failed to calculate CAI pricing" });
    }
  });


  app.get("/api/org-admin/my-orgs", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const orgIds = await getAdminManagedOrgIds(userId);
      const orgs = await Promise.all(orgIds.map(id => storage.getOrganization(id)));
      res.json(orgs.filter(Boolean));
    } catch (error) {
      console.error("Get admin orgs error:", error);
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });


  app.get("/api/org-admin/orgs/:orgId/members", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { orgId } = req.params;
      if (!await verifyOrgAdminAccess(userId, orgId)) {
        res.status(403).json({ error: "Access denied to this organization" });
        return;
      }
      const members = await storage.getOrganizationMembersWithDetails(orgId);
      res.json(members);
    } catch (error) {
      console.error("Get org members error:", error);
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });


  app.patch("/api/org-admin/orgs/:orgId/members/:memberId/role", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { orgId, memberId } = req.params;
      const { orgRole, platformRole } = req.body;
      if (!await verifyOrgAdminAccess(userId, orgId)) {
        res.status(403).json({ error: "Access denied to this organization" });
        return;
      }
      if (orgRole && !["member", "admin", "owner"].includes(orgRole)) {
        res.status(400).json({ error: "Invalid organization role" });
        return;
      }
      const allowedPlatformRoles = ["student", "educator", "staff", "homeschool_parent", "campus_admin"];
      if (platformRole && !allowedPlatformRoles.includes(platformRole)) {
        res.status(403).json({ error: "Cannot assign site_admin, district_admin, or system_admin roles. Contact system admin." });
        return;
      }
      if (orgRole) {
        await storage.updateOrgMembership(memberId, { role: orgRole });
      }
      if (platformRole) {
        const membership = await db.select().from(orgMembershipsTable).where(eq(orgMembershipsTable.id, memberId));
        if (membership[0]) {
          await db.update(users).set({ role: platformRole, updatedAt: new Date() }).where(eq(users.id, membership[0].userId));
        }
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Update member role error:", error);
      res.status(500).json({ error: "Failed to update member role" });
    }
  });


  app.patch("/api/org-admin/orgs/:orgId/members/:memberId/status", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { orgId, memberId } = req.params;
      const { status } = req.body;
      if (!await verifyOrgAdminAccess(userId, orgId)) {
        res.status(403).json({ error: "Access denied to this organization" });
        return;
      }
      if (!["active", "suspended"].includes(status)) {
        res.status(400).json({ error: "Status must be 'active' or 'suspended'" });
        return;
      }
      const updated = await storage.updateOrgMembership(memberId, { status });
      res.json(updated);
    } catch (error) {
      console.error("Update member status error:", error);
      res.status(500).json({ error: "Failed to update member status" });
    }
  });


  app.delete("/api/org-admin/orgs/:orgId/members/:memberId", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { orgId, memberId } = req.params;
      if (!await verifyOrgAdminAccess(userId, orgId)) {
        res.status(403).json({ error: "Access denied to this organization" });
        return;
      }
      const membership = await db.select().from(orgMembershipsTable).where(eq(orgMembershipsTable.id, memberId));
      if (membership[0]?.userId === userId) {
        res.status(400).json({ error: "Cannot remove yourself from the organization" });
        return;
      }
      await storage.deleteOrgMembership(memberId);
      res.json({ success: true });
    } catch (error) {
      console.error("Remove member error:", error);
      res.status(500).json({ error: "Failed to remove member" });
    }
  });


  app.get("/api/org-admin/orgs/:orgId/settings", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { orgId } = req.params;
      if (!await verifyOrgAdminAccess(userId, orgId)) {
        res.status(403).json({ error: "Access denied to this organization" });
        return;
      }
      const org = await storage.getOrganization(orgId);
      if (!org) {
        res.status(404).json({ error: "Organization not found" });
        return;
      }
      res.json(org);
    } catch (error) {
      console.error("Get org settings error:", error);
      res.status(500).json({ error: "Failed to fetch organization settings" });
    }
  });


  app.patch("/api/org-admin/orgs/:orgId/settings", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { orgId } = req.params;
      if (!await verifyOrgAdminAccess(userId, orgId)) {
        res.status(403).json({ error: "Access denied to this organization" });
        return;
      }
      const { name, address, city, state, country, zipCode, phone, website, settings } = req.body;
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (address !== undefined) updates.address = address;
      if (city !== undefined) updates.city = city;
      if (state !== undefined) updates.state = state;
      if (country !== undefined) updates.country = country;
      if (zipCode !== undefined) updates.zipCode = zipCode;
      if (phone !== undefined) updates.phone = phone;
      if (website !== undefined) updates.website = website;
      if (settings !== undefined) updates.settings = settings;
      const updated = await storage.updateOrganization(orgId, updates);
      res.json(updated);
    } catch (error) {
      console.error("Update org settings error:", error);
      res.status(500).json({ error: "Failed to update organization settings" });
    }
  });


  app.get("/api/org-admin/orgs/:orgId/activity", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { orgId } = req.params;
      if (!await verifyOrgAdminAccess(userId, orgId)) {
        res.status(403).json({ error: "Access denied to this organization" });
        return;
      }
      const stats = await storage.getEducatorActivityStats(orgId);
      res.json(stats);
    } catch (error) {
      console.error("Get educator activity error:", error);
      res.status(500).json({ error: "Failed to fetch educator activity" });
    }
  });
}
