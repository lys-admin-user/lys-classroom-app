import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "../storage";
import { generateLessonPlan, generateLessonPlanStreaming } from "../openai";
import { setupSSE, makeEmitter } from "../services/generationStream";
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

const ALLOWED_UPLOAD_MIME = new Set<string>([
  "image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif",
  "application/pdf", "text/plain", "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);
const ALLOWED_UPLOAD_EXT = new Set<string>([
  ".pdf", ".txt", ".csv",
  ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = (file.originalname.match(/\.[^.]+$/)?.[0] || "").toLowerCase();
    if (ALLOWED_UPLOAD_MIME.has(file.mimetype) && ALLOWED_UPLOAD_EXT.has(ext)) cb(null, true);
    else cb(new Error("Unsupported file type."));
  },
});

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

// AUTO-SPLIT from server/routes.ts -- domain: lessons (36 routes)
export function registerLessonsRoutes(app: Express): void {


  // Get lesson generation usage for free tier
  app.get("/api/lessons/usage", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const tier = await storage.getUserTier(userId);
      const monthlyCount = await storage.countMonthlyGenerations(userId);
      
      let hasActiveTrial = false;
      if (tier === "free") {
        const userTrial = await storage.getActiveTrialByUserId(userId);
        hasActiveTrial = !!userTrial;
      }

      const isUnlimited = tier !== "free" || hasActiveTrial;
      const limit = isUnlimited ? null : 5;
      const remaining = limit !== null ? Math.max(0, limit - monthlyCount) : null;
      
      res.json({
        tier,
        monthlyCount,
        limit,
        remaining,
        unlimited: isUnlimited,
        hasActiveTrial,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get usage info" });
    }
  });


  // Guest Lesson Generation — limited to 5 total per guestId cookie (with
  // IP fallback). Kept as a non-streaming JSON endpoint for compatibility
  // with older clients; new code paths use /api/lessons/generate-guest-stream.
  const GUEST_LESSON_LIMIT = 5;
  const guestKeyFromReq = (req: any) => ({
    guestId: req.guestId as string | undefined,
    ipAddress: (req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown') as string,
  });

  app.post("/api/lessons/generate-guest", async (req: any, res) => {
    try {
      const validated = generateLessonRequestSchema.parse(req.body);
      const lead = await storage.getGuestLead(guestKeyFromReq(req));
      if (!lead) {
        res.status(403).json({
          error: "Email required",
          message: "Enter your email to unlock 5 free lessons.",
          requiresEmail: true,
        });
        return;
      }
      const { success, currentCount } = await storage.tryReserveGuestLessonGeneration(
        guestKeyFromReq(req),
        GUEST_LESSON_LIMIT,
        validated.topic,
      );
      if (!success) {
        res.status(403).json({
          error: "Guest limit reached",
          message: "Create a free account to continue generating lessons.",
          guestCount: currentCount,
          limit: GUEST_LESSON_LIMIT,
          requiresSignup: true,
        });
        return;
      }

      const generatedPlan = await generateLessonPlan(validated);
      res.json({
        ...generatedPlan,
        guestUsage: { used: currentCount + 1, limit: GUEST_LESSON_LIMIT, remaining: GUEST_LESSON_LIMIT - currentCount - 1 },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Guest lesson generation error:", error);
        res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate lesson" });
      }
    }
  });


  // Streaming variant for guests — same SSE phase/delta/done envelope as the
  // authed endpoint so the GenerationCountdown UI works identically. Quota
  // check runs before opening the SSE stream so we can return a proper 403
  // with `requiresSignup: true` instead of half-streaming.
  app.post("/api/lessons/generate-guest-stream", async (req: any, res) => {
    let validated: z.infer<typeof generateLessonRequestSchema>;
    try {
      validated = generateLessonRequestSchema.parse(req.body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: err.errors });
      }
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const lead = await storage.getGuestLead(guestKeyFromReq(req));
      if (!lead) {
        return res.status(403).json({
          error: "Email required",
          message: "Enter your email to unlock 5 free lessons.",
          requiresEmail: true,
        });
      }
      const { success, currentCount } = await storage.tryReserveGuestLessonGeneration(
        guestKeyFromReq(req),
        GUEST_LESSON_LIMIT,
        validated.topic,
      );
      if (!success) {
        return res.status(403).json({
          error: "Guest limit reached",
          message: "Create a free account to continue generating lessons.",
          guestCount: currentCount,
          limit: GUEST_LESSON_LIMIT,
          requiresSignup: true,
        });
      }

      setupSSE(res);
      const emit = makeEmitter(res);
      try {
        const result = await generateLessonPlanStreaming(validated, emit);
        emit({
          type: "done",
          data: {
            ...result,
            guestUsage: {
              used: currentCount + 1,
              limit: GUEST_LESSON_LIMIT,
              remaining: GUEST_LESSON_LIMIT - currentCount - 1,
            },
          },
        });
      } catch (err: any) {
        emit({
          type: "error",
          data: { message: err?.message || "Generation failed", hint: err?.hint },
        });
      } finally {
        res.end();
      }
    } catch (error: any) {
      console.error("Guest lesson stream setup error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error?.message || "Failed to start generation" });
      } else {
        res.end();
      }
    }
  });


  // Guest usage check endpoint
  app.get("/api/lessons/guest-usage", async (req: any, res) => {
    try {
      const key = guestKeyFromReq(req);
      const count = await storage.countGuestGenerations(key);
      const lead = await storage.getGuestLead(key);
      res.json({
        used: count,
        limit: GUEST_LESSON_LIMIT,
        remaining: Math.max(0, GUEST_LESSON_LIMIT - count),
        emailCaptured: !!lead,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to check guest usage" });
    }
  });


  // Email gate: a guest provides an email to unlock their 5 free lessons. The
  // email is stored as a lead (contact list); browser/guestId tracking still
  // enforces the monthly ceiling.
  const guestEmailSchema = z.object({ email: z.string().email() });
  app.post("/api/lessons/guest-email", async (req: any, res) => {
    try {
      const { email } = guestEmailSchema.parse(req.body);
      await storage.saveGuestLead(guestKeyFromReq(req), email);
      res.json({ ok: true, emailCaptured: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Please enter a valid email address." });
      } else {
        console.error("Guest email capture error:", error);
        res.status(500).json({ error: "Failed to save email" });
      }
    }
  });


  // Stash a guest's in-flight form values + last generated lesson against
  // their guestId cookie so we can rehydrate after they sign up. Called by
  // the GuestSignupModal immediately before redirecting to /api/login.
  app.post("/api/guest/handoff", async (req: any, res) => {
    try {
      const { formContext, lastLessonContent } = req.body || {};
      await storage.saveGuestHandoff(guestKeyFromReq(req), formContext ?? null, lastLessonContent ?? null);
      res.json({ ok: true });
    } catch (error) {
      console.error("Guest handoff error:", error);
      res.status(500).json({ error: "Failed to save handoff state" });
    }
  });


  // Called once on the lesson-generator page after a fresh signup. Reads the
  // guestId cookie, marks all of that guest's rows as claimed by the newly
  // authenticated user, seeds their EducatorProfile with country/state/subject
  // (only when those fields aren't already set), drops the saved lesson into
  // their library as a draft if present, and returns the original form
  // values for client-side state restoration.
  app.post("/api/guest/claim", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const guestId = req.guestId as string | undefined;
      if (!guestId) return res.json({ claimed: false });

      const claimed = await storage.claimGuestHandoff(guestId, userId);
      if (!claimed) return res.json({ claimed: false });

      const { formContext, lastLessonContent } = claimed;

      // Seed EducatorProfile non-destructively.
      try {
        const existing = await storage.getEducatorProfile(userId);
        const patch: Record<string, any> = {};
        if (formContext?.selectedCountry && !existing?.country) patch.country = formContext.selectedCountry;
        if (formContext?.selectedState && !existing?.state) patch.state = formContext.selectedState;
        if (formContext?.selectedSubject && !existing?.preferredSubject) patch.preferredSubject = formContext.selectedSubject;
        if (Object.keys(patch).length > 0) {
          if (existing) {
            await storage.updateEducatorProfile(userId, patch);
          } else {
            await storage.createEducatorProfile({ userId, ...patch } as any);
          }
        }
      } catch (e) {
        // Profile seeding is best-effort — don't block claim on it.
        console.warn("Guest claim: profile seed failed", e);
      }

      // Drop the last generated lesson into the user's library as a draft.
      let savedLessonId: string | null = null;
      if (lastLessonContent && typeof lastLessonContent === "object") {
        try {
          const lp = lastLessonContent as any;
          const saved = await storage.createLesson({
            userId,
            title: lp.title || `Lesson: ${lp.topic || "Untitled"}`,
            topic: lp.topic || formContext?.topic || "Untitled",
            gradeLevel: lp.gradeLevel || formContext?.gradeLevel || "",
            bkdFocus: lp.bkdFocus || formContext?.bkdFocus || "be",
            standards: typeof lp.standards === "string" ? lp.standards : (lp.standards ? JSON.stringify(lp.standards) : ""),
            duration: lp.duration || formContext?.duration || "45 minutes",
            objectives: lp.objectives || [],
            activities: lp.activities || [],
            materials: lp.materials || [],
            assessment: lp.assessment || "",
            reflection: lp.reflection || "",
          } as any);
          savedLessonId = (saved as any)?.id ?? null;
        } catch (e) {
          console.warn("Guest claim: lesson seed failed", e);
        }
      }

      res.json({ claimed: true, formContext, lastLessonContent, savedLessonId });
    } catch (error) {
      console.error("Guest claim error:", error);
      res.status(500).json({ error: "Failed to claim guest state" });
    }
  });


  // Lesson Plans - Generate (requires auth, free users limited to 3/month)
  app.post("/api/lessons/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const validated = generateLessonRequestSchema.parse(req.body);
      
      const user = await storage.getUser(userId);
      const topicCheck = filterChatMessage(validated.topic, user?.role || "student");
      if (topicCheck.autoBlock) {
        res.status(400).json({ error: "Content not allowed", flagged: true });
        return;
      }
      if (topicCheck.requiresReview) {
        await db.insert(contentReviewQueueTable).values({
          contentType: "lesson_topic",
          sourceUserId: userId,
          sourceUserRole: user?.role || "unknown",
          content: validated.topic,
          flaggedKeywords: topicCheck.matchedKeywords,
          severity: topicCheck.severity,
          status: "pending_review",
        });
      }
      
      const { checkFraudStrikes } = await import("../services/dataGovernance");
      const fraudCheck = await checkFraudStrikes(userId);
      if (fraudCheck.blocked) {
        res.status(403).json({
          error: "AI features are temporarily disabled due to location verification required. Please contact support.",
          reason: "fraud_strikes_exceeded",
        });
        return;
      }

      await logAuditEvent({
        userId,
        action: "lesson_generate",
        category: "ai_usage",
        severity: "info",
        details: { topic: validated.topic, gradeLevel: validated.gradeLevel },
        ipAddress: getClientIP(req),
      });
      
      const tier = await storage.getUserTier(userId);
      
      let hasActiveTrial = false;
      if (tier === "free") {
        const userTrial = await storage.getActiveTrialByUserId(userId);
        hasActiveTrial = !!userTrial;
      }

      if (tier === "free" && !hasActiveTrial) {
        const { success, currentCount } = await storage.tryReserveLessonGeneration(userId, 5, validated.topic);
        if (!success) {
          res.status(403).json({ 
            error: "Monthly limit reached", 
            message: "Free accounts can generate up to 5 lessons per month. Upgrade to Pro for unlimited lessons.",
            monthlyCount: currentCount,
            limit: 5,
            requiredTier: "pro"
          });
          return;
        }
      } else {
        await storage.logLessonGeneration(userId, validated.topic);
      }
      
      const generatedPlan = await generateLessonPlan(validated);
      res.json(generatedPlan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Lesson generation error:", error);
        res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate lesson" });
      }
    }
  });


  // Streaming variant — same auth + tier checks as /api/lessons/generate, but
  // pushes Server-Sent Events (phase / delta / done / error) so the UI can
  // render the GenerationCountdown experience.
  app.post("/api/lessons/generate-stream", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    let validated: z.infer<typeof generateLessonRequestSchema>;
    try {
      validated = generateLessonRequestSchema.parse(req.body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: err.errors });
      }
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const user = await storage.getUser(userId);
      const topicCheck = filterChatMessage(validated.topic, user?.role || "student");
      if (topicCheck.autoBlock) {
        return res.status(400).json({ error: "Content not allowed", flagged: true });
      }
      if (topicCheck.requiresReview) {
        await db.insert(contentReviewQueueTable).values({
          contentType: "lesson_topic",
          sourceUserId: userId,
          sourceUserRole: user?.role || "unknown",
          content: validated.topic,
          flaggedKeywords: topicCheck.matchedKeywords,
          severity: topicCheck.severity,
          status: "pending_review",
        });
      }

      const { checkFraudStrikes } = await import("../services/dataGovernance");
      const fraudCheck = await checkFraudStrikes(userId);
      if (fraudCheck.blocked) {
        return res.status(403).json({
          error: "AI features are temporarily disabled due to location verification required.",
          reason: "fraud_strikes_exceeded",
        });
      }

      const tier = await storage.getUserTier(userId);
      let hasActiveTrial = false;
      if (tier === "free") {
        const userTrial = await storage.getActiveTrialByUserId(userId);
        hasActiveTrial = !!userTrial;
      }
      if (tier === "free" && !hasActiveTrial) {
        const { success, currentCount } = await storage.tryReserveLessonGeneration(userId, 5, validated.topic);
        if (!success) {
          return res.status(403).json({
            error: "Monthly limit reached",
            message: "Free accounts can generate up to 5 lessons per month.",
            monthlyCount: currentCount,
            limit: 5,
            requiredTier: "pro",
          });
        }
      } else {
        await storage.logLessonGeneration(userId, validated.topic);
      }

      await logAuditEvent({
        userId,
        action: "lesson_generate_stream",
        category: "ai_usage",
        severity: "info",
        details: { topic: validated.topic, gradeLevel: validated.gradeLevel },
        ipAddress: getClientIP(req),
      });

      setupSSE(res);
      const emit = makeEmitter(res);
      try {
        const result = await generateLessonPlanStreaming(validated, emit);
        emit({ type: "done", data: result });
      } catch (err: any) {
        emit({
          type: "error",
          data: { message: err?.message || "Generation failed", hint: err?.hint },
        });
      } finally {
        res.end();
      }
    } catch (error: any) {
      // Pre-stream error — respond JSON normally.
      console.error("Lesson stream setup error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error?.message || "Failed to start generation" });
      } else {
        res.end();
      }
    }
  });


  // Saved Lessons - requires authentication
  app.get("/api/lessons", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const lessons = await storage.getLessons(userId);
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });


  // Get a single lesson by ID
  app.get("/api/lessons/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const lesson = await storage.getLesson(req.params.id);
      if (!lesson || lesson.userId !== userId) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });


  app.post("/api/lessons/save", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const validated = saveLessonSchema.parse(req.body);
      const lesson = await storage.createLesson({
        ...validated,
        userId,
      });
      res.json(lesson);

      // Capture edit signal: diff what AI generated vs what teacher saved.
      // Fire-and-forget; failures must not impact the save response.
      (async () => {
        try {
          const generatedSnapshot = (req.body as any)?.__generatedSnapshot;
          if (!generatedSnapshot) return;
          const { captureEdit } = await import("../services/lessonEditCaptureService");
          const orgId = (req.user?.claims as any)?.org_id ?? null;
          await captureEdit({
            lessonId: lesson.id,
            userId,
            generatedPlan: generatedSnapshot,
            savedPlan: validated,
            orgId,
          });
        } catch (e) {
          console.warn("[lessons.save] edit capture skipped:", (e as Error).message);
        }
      })();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid lesson data", details: error.errors });
      } else {
        console.error("Save lesson error:", error);
        res.status(500).json({ error: "Failed to save lesson" });
      }
    }
  });


  app.delete("/api/lessons/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const deleted = await storage.deleteLesson(req.params.id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Lesson not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lesson" });
    }
  });


  // Toggle lesson sharing (authenticated users only)
  app.post("/api/lessons/:id/share", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const result = await storage.toggleLessonShare(req.params.id, userId);
      if (!result) {
        res.status(404).json({ error: "Lesson not found or not authorized" });
        return;
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle sharing" });
    }
  });


  // ===========================================
  // QUESTION BANK API
  // ===========================================
  
  app.get("/api/question-bank", isAuthenticated, async (req: any, res) => {
    try {
      const { subject, gradeLevel, topic, difficulty, bkdFocus } = req.query;
      const questions = await storage.getQuestionBankItems({
        subject: subject as string,
        gradeLevel: gradeLevel as string,
        topic: topic as string,
        difficulty: difficulty as string,
        bkdFocus: bkdFocus as string,
      });
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch question bank" });
    }
  });

  
  app.post("/api/question-bank", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const question = await storage.createQuestionBankItem({
        ...req.body,
        creatorId: userId,
      });
      res.json(question);
    } catch (error) {
      res.status(500).json({ error: "Failed to create question" });
    }
  });


  // Lesson Templates - for one-click lesson creation
  app.get("/api/templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const templates = await storage.getLessonTemplates(userId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });


  app.get("/api/templates/public", async (req, res) => {
    try {
      const templates = await storage.getPublicLessonTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch public templates" });
    }
  });


  app.get("/api/templates/:id", async (req, res) => {
    try {
      const template = await storage.getLessonTemplate(req.params.id);
      if (!template) {
        res.status(404).json({ error: "Template not found" });
        return;
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });


  app.post("/api/templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const template = await storage.createLessonTemplate({
        ...req.body,
        userId,
      });
      res.json(template);
    } catch (error) {
      console.error("Create template error:", error);
      res.status(500).json({ error: "Failed to create template" });
    }
  });


  app.patch("/api/templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const updated = await storage.updateLessonTemplate(req.params.id, req.body, userId);
      if (!updated) {
        res.status(404).json({ error: "Template not found or not authorized" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update template" });
    }
  });


  app.delete("/api/templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const deleted = await storage.deleteLessonTemplate(req.params.id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Template not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete template" });
    }
  });


  // Create lesson from template (one-click)
  app.post("/api/templates/:id/use", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const template = await storage.getLessonTemplate(req.params.id);
      if (!template) {
        res.status(404).json({ error: "Template not found" });
        return;
      }

      // Increment use count
      await storage.incrementTemplateUseCount(req.params.id);

      // Create a new lesson from the template with optional customizations
      const customizations = req.body || {};
      const lesson = await storage.createLesson({
        userId,
        title: customizations.title || template.title,
        topic: customizations.topic || template.title,
        gradeLevel: customizations.gradeLevel || template.gradeLevel,
        bkdFocus: template.bkdFocus,
        standards: customizations.standards || "",
        duration: template.duration,
        objectives: template.objectives,
        activities: template.activities,
        materials: template.materials,
        assessment: template.assessmentTemplate,
        reflection: "",
      });

      res.json(lesson);
    } catch (error) {
      console.error("Use template error:", error);
      res.status(500).json({ error: "Failed to create lesson from template" });
    }
  });


  // Save existing lesson as template
  app.post("/api/lessons/:id/save-as-template", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const lesson = await storage.getLesson(req.params.id);
      if (!lesson || lesson.userId !== userId) {
        res.status(404).json({ error: "Lesson not found or not authorized" });
        return;
      }

      const templateData = req.body || {};
      const template = await storage.createLessonTemplate({
        userId,
        title: templateData.title || `${lesson.title} Template`,
        description: templateData.description || `Template based on: ${lesson.title}`,
        category: templateData.category || "General",
        gradeLevel: lesson.gradeLevel,
        subject: templateData.subject,
        bkdFocus: lesson.bkdFocus,
        duration: lesson.duration,
        objectives: lesson.objectives,
        activities: lesson.activities,
        materials: lesson.materials,
        assessmentTemplate: lesson.assessment,
        lysMethodology: templateData.lysMethodology,
        tags: templateData.tags || [],
        visibility: templateData.visibility || "private",
      });

      res.json(template);
    } catch (error) {
      console.error("Save as template error:", error);
      res.status(500).json({ error: "Failed to save lesson as template" });
    }
  });


  // Generate assignment from lesson (PAID FEATURE)
  app.post("/api/assignments/generate", isAuthenticated, requirePaidTier, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { lessonId, assignmentType, questionCount, difficulty, includeBeKnowDo, accommodationTypes, accommodationNotes, projectTemplate, country, language } = req.body;
      
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        res.status(404).json({ error: "Lesson not found" });
        return;
      }
      
      if (lesson.userId !== userId) {
        res.status(403).json({ error: "You can only generate assignments from your own lessons" });
        return;
      }
      
      // Auto-detect African country from the saved lesson's STRUCTURED
      // standards string only (never the user-authored topic, which would
      // false-positive on lessons like "History of Nigeria" written by a
      // US teacher). The lesson save flow embeds "[Country] " at the head of
      // standards for new lessons; older saved lessons rely on the exam-name /
      // word-boundary detection in detectAfricanCountryFromText.
      const resolvedCountry = country || detectAfricanCountryFromText(lesson.standards) || undefined;

      const { generateAssignment } = await import("../assignmentGenerator");
      const generated = await generateAssignment({
        lesson,
        assignmentType: assignmentType || "quiz",
        questionCount: questionCount || 5,
        difficulty: difficulty || "medium",
        includeBeKnowDo: includeBeKnowDo !== false,
        accommodationTypes,
        accommodationNotes,
        projectTemplate: projectTemplate || "community_consultant",
        country: resolvedCountry,
        language,
      });
      
      res.json(generated);
    } catch (error) {
      console.error("Generate assignment error:", error);
      res.status(500).json({ error: "Failed to generate assignment" });
    }
  });


  // Streaming variant — same auth + tier checks, SSE phase/delta/done/error.
  app.post("/api/assignments/generate-stream", isAuthenticated, requirePaidTier, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { lessonId, assignmentType, questionCount, difficulty, includeBeKnowDo, accommodationTypes, accommodationNotes, projectTemplate, country, language } = req.body;

      const lesson = await storage.getLesson(lessonId);
      if (!lesson) return res.status(404).json({ error: "Lesson not found" });
      if (lesson.userId !== userId) {
        return res.status(403).json({ error: "You can only generate assignments from your own lessons" });
      }

      const resolvedCountry = country || detectAfricanCountryFromText(lesson.standards) || undefined;

      const { generateAssignmentStreaming } = await import("../assignmentGenerator");

      setupSSE(res);
      const emit = makeEmitter(res);
      try {
        const result = await generateAssignmentStreaming(
          {
            lesson,
            assignmentType: assignmentType || "quiz",
            questionCount: questionCount || 5,
            difficulty: difficulty || "medium",
            includeBeKnowDo: includeBeKnowDo !== false,
            accommodationTypes,
            accommodationNotes,
            projectTemplate: projectTemplate || "community_consultant",
            country: resolvedCountry,
            language,
          },
          emit,
        );
        emit({ type: "done", data: result });
      } catch (err: any) {
        emit({ type: "error", data: { message: err?.message || "Generation failed", hint: err?.hint } });
      } finally {
        res.end();
      }
    } catch (error: any) {
      console.error("Assignment stream setup error:", error);
      if (!res.headersSent) res.status(500).json({ error: error?.message || "Failed to start generation" });
      else res.end();
    }
  });


  // Save assignment (PAID FEATURE)
  app.post("/api/assignments", isAuthenticated, requirePaidTier, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const assignment = await storage.createAssignment({
        ...req.body,
        userId,
      });
      res.json(assignment);
    } catch (error) {
      console.error("Create assignment error:", error);
      res.status(500).json({ error: "Failed to create assignment" });
    }
  });


  // Get user's assignments
  app.get("/api/assignments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const assignmentsList = await storage.getAssignments(userId);
      res.json(assignmentsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });


  // Get single assignment
  app.get("/api/assignments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const assignment = await storage.getAssignment(id);
      if (!assignment) {
        res.status(404).json({ error: "Assignment not found" });
        return;
      }
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assignment" });
    }
  });


  // Update assignment
  app.patch("/api/assignments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const updated = await storage.updateAssignment(id, req.body, userId);
      if (!updated) {
        res.status(404).json({ error: "Assignment not found or not authorized" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update assignment" });
    }
  });


  // Delete assignment
  app.delete("/api/assignments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const deleted = await storage.deleteAssignment(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Assignment not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete assignment" });
    }
  });


  // Assign to recipients (student, group, or class)
  app.post("/api/assignments/:id/assign", isAuthenticated, requirePaidTier, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const { recipientType, recipientIds } = req.body;
      
      const assignment = await storage.getAssignment(id);
      if (!assignment || assignment.userId !== userId) {
        res.status(404).json({ error: "Assignment not found or not authorized" });
        return;
      }
      
      // Validate class student limits when distributing to a class
      if (recipientType === "class") {
        for (const classId of recipientIds) {
          const classData = await storage.getClass(classId);
          if (classData) {
            const classStudentsList = await storage.getClassStudents(classId);
            const maxStudents = classData.maxStudents || 35;
            if (classStudentsList.length > maxStudents) {
              res.status(400).json({ 
                error: `Class "${classData.name}" exceeds the ${maxStudents} student limit for assignment distribution. Please reduce class size.`,
                code: "CLASS_OVER_LIMIT"
              });
              return;
            }
          }
        }
      }
      
      const recipients = [];
      for (const recipientId of recipientIds) {
        const recipient = await storage.createAssignmentRecipient({
          assignmentId: id,
          recipientType,
          recipientId,
          status: "assigned",
        });
        recipients.push(recipient);
      }
      
      res.json({ success: true, recipients });
    } catch (error) {
      console.error("Assign error:", error);
      res.status(500).json({ error: "Failed to assign" });
    }
  });


  // Generate share URL with referral code
  app.post("/api/lessons/:id/share-link", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const { channel } = req.body;
      
      const lesson = await storage.getLesson(id);
      if (!lesson || lesson.userId !== userId) {
        res.status(404).json({ error: "Lesson not found or not authorized" });
        return;
      }
      
      let shareId = lesson.shareId;
      if (!shareId) {
        const result = await storage.toggleLessonShare(id, userId);
        shareId = result?.shareId || null;
      }
      
      let affiliate = await storage.getEducatorAffiliate(userId);
      if (!affiliate) {
        const referralCode = `LYS${userId.substring(0, 6).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
        affiliate = await storage.createEducatorAffiliate({
          userId,
          referralCode,
          displayName: req.user?.claims?.name || null,
          isActive: true,
        });
      }
      
      if (channel) {
        const { AFFILIATE_POINT_CONFIG } = await import("@shared/schema");
        const sharePoints = AFFILIATE_POINT_CONFIG.share;
        await storage.createReferralEvent({
          affiliateId: affiliate.id,
          lessonId: id,
          shareId,
          eventType: "share",
          channel,
          pointsEarned: sharePoints,
        });
        
        await storage.createAffiliateReward({
          affiliateId: affiliate.id,
          points: sharePoints,
          rewardType: "earned",
          description: `Shared lesson via ${channel}`,
        });

        await storage.createWalletTransaction({
          affiliateId: affiliate.id,
          type: "points_earned",
          pointsAmount: sharePoints,
          cashAmountCents: 0,
          description: `Earned ${sharePoints} pts for sharing via ${channel}`,
          status: "completed",
        });
      }
      
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const shareUrl = `${baseUrl}/shared/${shareId}?ref=${affiliate.referralCode}`;
      
      res.json({
        shareUrl,
        shareId,
        referralCode: affiliate.referralCode,
      });
    } catch (error) {
      console.error("Generate share link error:", error);
      res.status(500).json({ error: "Failed to generate share link" });
    }
  });

  
  // Check if current user is a lesson author (system-level)
  app.get("/api/lesson-author/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const isAuthor = await storage.isSystemLessonAuthor(userId);
      const author = isAuthor ? await storage.getSystemLessonAuthor(userId) : null;
      res.json({ isAuthor, author });
    } catch (error) {
      res.status(500).json({ error: "Failed to check author status" });
    }
  });

  
  // Get my authored lessons (Lesson Author)
  app.get("/api/lesson-author/my-lessons", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const isAuthor = await storage.isSystemLessonAuthor(userId);
      
      if (!isAuthor) {
        res.status(403).json({ error: "Lesson author access required" });
        return;
      }
      
      const lessons = await storage.getMasterLessonsByAuthor(userId);
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  
  // Create master lesson (Lesson Author only)
  app.post("/api/lesson-author/master-lessons", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const isAuthor = await storage.isSystemLessonAuthor(userId);
      
      if (!isAuthor) {
        res.status(403).json({ error: "Lesson author access required" });
        return;
      }
      
      const lessonData = { ...req.body, authorId: userId, status: "draft" };
      const lesson = await storage.createMasterLesson(lessonData);
      await storage.incrementAuthorLessonCount(userId);
      
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to create lesson" });
    }
  });

  
  // Update master lesson
  app.patch("/api/lesson-author/master-lessons/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      
      const lesson = await storage.getMasterLesson(id);
      if (!lesson) {
        res.status(404).json({ error: "Lesson not found" });
        return;
      }
      
      // Only author can edit their own lessons, site admin can edit any
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      if (lesson.authorId !== userId && !isSiteAdminUser) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      
      const updated = await storage.updateMasterLesson(id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update lesson" });
    }
  });

  
  // Submit lesson for review
  app.post("/api/lesson-author/master-lessons/:id/submit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      
      const lesson = await storage.getMasterLesson(id);
      if (!lesson || lesson.authorId !== userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      
      const updated = await storage.updateMasterLesson(id, { status: "pending_review" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit lesson" });
    }
  });


  // Delete master lesson (Author only, if not approved)
  app.delete("/api/lesson-author/master-lessons/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      
      const lesson = await storage.getMasterLesson(id);
      if (!lesson) {
        res.status(404).json({ error: "Lesson not found" });
        return;
      }
      
      // Only author can delete their own non-approved lessons
      if (lesson.authorId !== userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      
      if (lesson.status === "approved") {
        res.status(400).json({ error: "Cannot delete approved lessons" });
        return;
      }
      
      await storage.deleteMasterLesson(id, userId);
      await storage.decrementAuthorLessonCount(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lesson" });
    }
  });


  app.post("/api/needs-analyzer/submit", async (req: any, res) => {
    try {
      const parsed = analyzerSubmitSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid analyzer response" });
        return;
      }
      // If this session already has a response, update the latest in place
      // rather than creating duplicates (same visitor revising answers).
      const existing = await db
        .select()
        .from(needsAnalyzerResponses)
        .where(eq(needsAnalyzerResponses.sessionId, parsed.data.sessionId))
        .orderBy(desc(needsAnalyzerResponses.createdAt))
        .limit(1);
      // Use req.ip only — never trust raw `x-forwarded-for` for attribution
      // since it is trivially spoofable by anonymous clients. Behind Replit's
      // proxy, Express is configured to populate req.ip from the trusted
      // forwarded header.
      const ipAddress = typeof req.ip === "string" && req.ip.length > 0 ? req.ip : null;
      if (existing.length > 0) {
        await db
          .update(needsAnalyzerResponses)
          .set({
            identity: parsed.data.identity,
            corePain: parsed.data.corePain ?? null,
            urgency: parsed.data.urgency ?? null,
            desiredOutcome: parsed.data.desiredOutcome ?? null,
            ctaShown: parsed.data.ctaShown ?? null,
            ipAddress,
          })
          .where(eq(needsAnalyzerResponses.id, existing[0].id));
        res.json({ id: existing[0].id, updated: true });
        return;
      }
      const [created] = await db
        .insert(needsAnalyzerResponses)
        .values({ ...parsed.data, ipAddress })
        .returning();
      res.json({ id: created.id, updated: false });
    } catch (error) {
      console.error("Needs analyzer submit error:", error);
      res.status(500).json({ error: "Failed to save response" });
    }
  });


  app.post("/api/needs-analyzer/cta-click", async (req: any, res) => {
    try {
      // sendBeacon posts as a blob with application/json content-type; Express
      // body parsers should handle it, but if body is a Buffer/string we
      // attempt one parse before validating.
      let body = req.body;
      if (typeof body === "string") {
        try { body = JSON.parse(body); } catch { body = {}; }
      } else if (body && typeof body === "object" && Buffer.isBuffer(body)) {
        try { body = JSON.parse(body.toString("utf8")); } catch { body = {}; }
      }
      const parsed = analyzerCtaClickSchema.safeParse(body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid CTA click payload" });
        return;
      }
      await db
        .update(needsAnalyzerResponses)
        .set({ ctaClicked: parsed.data.ctaClicked, ctaClickedAt: new Date() })
        .where(eq(needsAnalyzerResponses.sessionId, parsed.data.sessionId));
      res.json({ ok: true });
    } catch (error) {
      console.error("Needs analyzer cta-click error:", error);
      res.status(500).json({ error: "Failed to record CTA click" });
    }
  });


  app.post("/api/needs-analyzer/bind", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const parsed = analyzerBindSchema.safeParse(req.body);
      if (!userId || !parsed.success) {
        res.status(400).json({ error: "sessionId required and user must be authenticated" });
        return;
      }
      await db
        .update(needsAnalyzerResponses)
        .set({ userId, convertedAt: new Date() })
        .where(eq(needsAnalyzerResponses.sessionId, parsed.data.sessionId));
      res.json({ ok: true });
    } catch (error) {
      console.error("Needs analyzer bind error:", error);
      res.status(500).json({ error: "Failed to bind analyzer response" });
    }
  });
}
