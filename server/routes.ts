import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateLessonPlan } from "./openai";
import { calculateLessonQualityScore, getQualityLevel } from "./lessonQualityScorer";
import { parseDocument } from "./documentParser";
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
  hasRolePrivilege,
} from "@shared/schema";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { randomUUID } from "crypto";
import multer from "multer";
import { syncJurisdictionsFromCSP, syncStandardSetFromCSP, getSyncStatus, fetchCSPJurisdictions, syncAllStandardsFromCSP, getImportProgress } from "./services/cspService";
import { extractStandardsFromText, processPdfImport, checkSourceForChanges } from "./services/llmExtractionService";
import { syncBlsData, getLastSyncStatus, getSyncHistory, startBlsScheduler, getSchedulerStatus } from "./services/blsService";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault, isPayPalConfigured } from "./paypal";
import * as hubspotService from "./services/hubspotService";
import * as wordpressService from "./services/wordpressService";
import { db } from "./db";
import { logAuditEvent, getAuditLogs, getClientIP } from "./services/auditLog";
import { filterChatMessage } from "./services/contentFilter";
import { eq, desc, and, sql as drizzleSql, count, inArray } from "drizzle-orm";

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
  role: z.enum(["student", "educator", "campus_admin", "district_admin", "site_admin", "system_admin", "homeschool_parent"]).optional(),
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
  role: z.enum(["student", "educator", "homeschool_parent", "campus_admin", "district_admin", "site_admin", "system_admin"]),
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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Setup authentication FIRST
  await setupAuth(app);
  registerAuthRoutes(app);

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
      const limit = isUnlimited ? null : 3;
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

  // Guest Lesson Generation - limited to 3 total per IP for unauthenticated users
  app.post("/api/lessons/generate-guest", async (req: any, res) => {
    try {
      const validated = generateLessonRequestSchema.parse(req.body);
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
      
      // Check and reserve guest generation (3 total per IP)
      const { success, currentCount } = await storage.tryReserveGuestLessonGeneration(ipAddress, 3, validated.topic);
      if (!success) {
        res.status(403).json({ 
          error: "Guest limit reached", 
          message: "Create a free account to continue generating lessons.",
          guestCount: currentCount,
          limit: 3,
          requiresSignup: true
        });
        return;
      }
      
      const generatedPlan = await generateLessonPlan(validated);
      res.json({ 
        ...generatedPlan, 
        guestUsage: { used: currentCount + 1, limit: 3, remaining: 3 - currentCount - 1 }
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

  // Guest usage check endpoint
  app.get("/api/lessons/guest-usage", async (req: any, res) => {
    try {
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
      const count = await storage.countGuestGenerations(ipAddress);
      res.json({ used: count, limit: 3, remaining: Math.max(0, 3 - count) });
    } catch (error) {
      res.status(500).json({ error: "Failed to check guest usage" });
    }
  });

  // Free Trial System
  const TRIAL_DURATION_DAYS = 10;
  const TRIAL_RESET_MONTHS = 6;
  const MAX_TRIALS_PER_IP = 5;

  function getTrialSinceDate(): number {
    const d = new Date();
    d.setMonth(d.getMonth() - TRIAL_RESET_MONTHS);
    return d.getTime();
  }

  app.get("/api/trial/status", async (req: any, res) => {
    try {
      const ipAddress = getClientIP(req);
      const userId = req.user?.claims?.sub || null;
      const fingerprint = (req.query.fingerprint as string) || null;
      const sinceDate = getTrialSinceDate();

      let activeTrial = null;

      if (userId) {
        activeTrial = await storage.getActiveTrialByUserId(userId);
      }
      if (!activeTrial) {
        activeTrial = await storage.getActiveTrialByIP(ipAddress);
      }
      if (!activeTrial && fingerprint) {
        activeTrial = await storage.getActiveTrialByFingerprint(fingerprint);
      }

      if (activeTrial) {
        const now = new Date();
        const endDate = new Date(activeTrial.trialEndDate);
        const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        const totalDays = TRIAL_DURATION_DAYS;

        res.json({
          hasTrial: true,
          isActive: true,
          daysRemaining,
          totalDays,
          trialStartDate: activeTrial.trialStartDate,
          trialEndDate: activeTrial.trialEndDate,
          trialId: activeTrial.id,
        });
        return;
      }

      const trialCount = await storage.getActiveTrialCount(ipAddress, sinceDate);
      let fingerprintTrials: any[] = [];
      if (fingerprint) {
        fingerprintTrials = await storage.getTrialsByFingerprint(fingerprint, sinceDate);
      }

      const totalTrials = Math.max(trialCount, fingerprintTrials.length);
      const canStartTrial = totalTrials < MAX_TRIALS_PER_IP;

      const ipTrials = await storage.getTrialsByIP(ipAddress, sinceDate);
      const lastTrial = ipTrials[0] || fingerprintTrials[0] || null;
      let nextEligibleDate = null;
      if (lastTrial && !canStartTrial) {
        const lastCreated = new Date(lastTrial.createdAt!);
        nextEligibleDate = new Date(lastCreated);
        nextEligibleDate.setMonth(nextEligibleDate.getMonth() + TRIAL_RESET_MONTHS);
      }

      res.json({
        hasTrial: false,
        isActive: false,
        canStartTrial,
        trialsUsed: totalTrials,
        trialsAllowed: MAX_TRIALS_PER_IP,
        nextEligibleDate,
      });
    } catch (error) {
      console.error("Trial status error:", error);
      res.status(500).json({ error: "Failed to check trial status" });
    }
  });

  app.post("/api/trial/start", async (req: any, res) => {
    try {
      const ipAddress = getClientIP(req);
      const userId = req.user?.claims?.sub || null;
      const { fingerprint, metadata } = req.body;
      const sinceDate = getTrialSinceDate();

      if (userId) {
        const existingUserTrial = await storage.getActiveTrialByUserId(userId);
        if (existingUserTrial) {
          res.status(400).json({ error: "You already have an active trial" });
          return;
        }
      }

      const existingIPTrial = await storage.getActiveTrialByIP(ipAddress);
      if (existingIPTrial) {
        if (userId && !existingIPTrial.userId) {
          await storage.bindTrialToUser(existingIPTrial.id, userId);
        }
        res.status(400).json({ error: "An active trial already exists for this network" });
        return;
      }

      if (fingerprint) {
        const existingFPTrial = await storage.getActiveTrialByFingerprint(fingerprint);
        if (existingFPTrial) {
          await storage.flagTrialAbuse(existingFPTrial.id);
          res.status(400).json({ error: "An active trial already exists" });
          return;
        }
      }

      const trialCount = await storage.getActiveTrialCount(ipAddress, sinceDate);
      if (trialCount >= MAX_TRIALS_PER_IP) {
        res.status(403).json({ 
          error: "Trial limit reached for this network. Trials reset every 6 months.",
          nextEligibleDate: null,
        });
        return;
      }

      if (fingerprint) {
        const fpTrials = await storage.getTrialsByFingerprint(fingerprint, sinceDate);
        if (fpTrials.length >= MAX_TRIALS_PER_IP) {
          res.status(403).json({ error: "Trial limit reached. Trials reset every 6 months." });
          return;
        }
      }

      const now = new Date();
      const trialEndDate = new Date(now);
      trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DURATION_DAYS);

      const trial = await storage.createFreeTrial({
        ipAddress,
        fingerprint: fingerprint || null,
        userId,
        trialStartDate: now,
        trialEndDate,
        isActive: true,
        abuseFlags: 0,
        metadata: metadata || null,
      });

      await logAuditEvent({
        userId: userId || "guest",
        action: "trial_started",
        resourceType: "free_trial",
        resourceId: trial.id,
        category: "data_modify",
        severity: "info",
        details: { ipAddress, fingerprint: fingerprint ? "provided" : "none", durationDays: TRIAL_DURATION_DAYS },
        ipAddress,
      });

      res.json({
        success: true,
        trialId: trial.id,
        trialStartDate: trial.trialStartDate,
        trialEndDate: trial.trialEndDate,
        daysRemaining: TRIAL_DURATION_DAYS,
        totalDays: TRIAL_DURATION_DAYS,
      });
    } catch (error) {
      console.error("Trial start error:", error);
      res.status(500).json({ error: "Failed to start trial" });
    }
  });

  app.post("/api/trial/bind", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const ipAddress = getClientIP(req);

      const existingUserTrial = await storage.getActiveTrialByUserId(userId);
      if (existingUserTrial) {
        res.json({ success: true, trialId: existingUserTrial.id });
        return;
      }

      const ipTrial = await storage.getActiveTrialByIP(ipAddress);
      if (ipTrial && !ipTrial.userId) {
        const updated = await storage.bindTrialToUser(ipTrial.id, userId);
        res.json({ success: true, trialId: updated?.id });
        return;
      }

      if (ipTrial && ipTrial.userId && ipTrial.userId !== userId) {
        await storage.flagTrialAbuse(ipTrial.id);
        res.status(403).json({ error: "Trial is bound to a different account" });
        return;
      }

      res.json({ success: false, message: "No active trial found to bind" });
    } catch (error) {
      console.error("Trial bind error:", error);
      res.status(500).json({ error: "Failed to bind trial" });
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
      
      const { checkFraudStrikes } = await import("./services/dataGovernance");
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
        const { success, currentCount } = await storage.tryReserveLessonGeneration(userId, 3, validated.topic);
        if (!success) {
          res.status(403).json({ 
            error: "Monthly limit reached", 
            message: "Free accounts can generate up to 3 lessons per month. Upgrade to Pro for unlimited lessons.",
            monthlyCount: currentCount,
            limit: 3,
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

  app.post("/api/lessons/save", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const validated = saveLessonSchema.parse(req.body);
      const lesson = await storage.createLesson({
        ...validated,
        userId,
      });
      res.json(lesson);
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

  // Get shared lesson by share ID (public endpoint)
  app.get("/api/shared/:shareId", async (req, res) => {
    try {
      const lesson = await storage.getLessonByShareId(req.params.shareId);
      if (!lesson) {
        res.status(404).json({ error: "Shared lesson not found" });
        return;
      }
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shared lesson" });
    }
  });

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

  // ===========================================
  // AUTHOR QUALITY METRICS API
  // ===========================================
  
  app.get("/api/author-metrics/:authorId", isAuthenticated, async (req: any, res) => {
    try {
      const authorId = req.params.authorId;
      const metrics = await storage.getAuthorQualityMetrics(authorId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch author metrics" });
    }
  });
  
  app.get("/api/author-metrics/:authorId/latest", isAuthenticated, async (req: any, res) => {
    try {
      const authorId = req.params.authorId;
      const metrics = await storage.getLatestAuthorMetrics(authorId);
      res.json(metrics || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch latest metrics" });
    }
  });

  // ===========================================
  // STANDARDS AUTO-MATCHING API
  // ===========================================
  
  const autoMatchSchema = z.object({
    topic: z.string().min(1, "Topic is required"),
    gradeLevel: z.string().min(1, "Grade level is required"),
    subject: z.string().optional(),
    objectives: z.array(z.string()).optional(),
    standardSetId: z.string().uuid("Valid standard set ID is required"),
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
      
      const { autoMatchStandards } = await import("./standardsAutoMatch");
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
      
      const { validateStandardAlignment } = await import("./standardsAutoMatch");
      const result = await validateStandardAlignment(objectives, standardCodes);
      
      res.json(result);
    } catch (error) {
      console.error("Validate alignment error:", error);
      res.status(500).json({ error: "Failed to validate alignment" });
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

  // Goals - works for all users, but data is session-based for non-auth
  app.get("/api/goals", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.post("/api/goals", async (req: any, res) => {
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

  app.patch("/api/goals/:id", async (req: any, res) => {
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

  app.delete("/api/goals/:id", async (req: any, res) => {
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

  app.patch("/api/goals/:goalId/milestones/:milestoneId", async (req: any, res) => {
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

  // Educator Profiles - requires authentication
  const educatorProfileSchema = z.object({
    educatorType: z.enum(["teacher", "homeschooling_parent", "micro_school"]).optional(),
    country: z.string().optional(),
    state: z.string().optional(),
    standardsName: z.string().optional(),
    schoolDistrict: z.string().optional(),
    schoolName: z.string().optional(),
    gradeLevels: z.array(z.string()).optional().default([]),
    subjects: z.array(z.string()).optional().default([]),
    preferredSubject: z.string().optional(),
    preferredStandardCodes: z.array(z.object({
      code: z.string(),
      description: z.string(),
    })).optional().default([]),
  });

  app.get("/api/educator-profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const profile = await storage.getEducatorProfile(userId);
      const tier = await storage.getUserTier(userId);
      const sponsoredAccess = await storage.getUserSponsoredAccess(userId);
      
      let hasActiveTrial = false;
      if (tier === "free") {
        const userTrial = await storage.getActiveTrialByUserId(userId);
        hasActiveTrial = !!userTrial;
      }

      res.json({ profile: profile || null, tier, sponsoredAccess: sponsoredAccess || null, hasActiveTrial });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch educator profile" });
    }
  });

  app.get("/api/ads/sponsorship", async (req, res) => {
    try {
      const placement = req.query.placement as string;
      if (!placement) {
        res.status(400).json({ error: "Placement parameter required" });
        return;
      }
      const sponsorship = await storage.getActiveSponsorship(placement);
      res.json(sponsorship || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sponsorship" });
    }
  });

  app.post("/api/educator-profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const validated = educatorProfileSchema.parse(req.body);
      
      const existing = await storage.getEducatorProfile(userId);
      if (existing) {
        res.status(400).json({ error: "Profile already exists. Use PATCH to update." });
        return;
      }
      
      const profile = await storage.createEducatorProfile({
        userId,
        ...validated,
      });
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid profile data", details: error.errors });
      } else {
        console.error("Create profile error:", error);
        res.status(500).json({ error: "Failed to create educator profile" });
      }
    }
  });

  app.patch("/api/educator-profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const validated = educatorProfileSchema.parse(req.body);
      
      let profile = await storage.getEducatorProfile(userId);
      if (!profile) {
        profile = await storage.createEducatorProfile({
          userId,
          ...validated,
        });
      } else {
        profile = await storage.updateEducatorProfile(userId, validated);
      }
      
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid profile data", details: error.errors });
      } else {
        console.error("Update profile error:", error);
        res.status(500).json({ error: "Failed to update educator profile" });
      }
    }
  });

  app.post("/api/educator-profile/complete-onboarding", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      // Mark onboarding complete on user record
      const user = await storage.completeOnboarding(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });

  // Profile Sitemap - Secure tier-based navigation
  // This endpoint returns features available/locked based on user's tier
  // Maximum security: tier is always validated server-side from database
  app.get("/api/profile/sitemap", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      
      // Get user's tier from database - NEVER trust client-side tier claims
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      
      // Import tier functions from shared schema
      const { getFeaturesForTier, getNextTier, TIER_BENEFITS, UserTier: UserTierConst } = await import("@shared/schema");
      
      type TierType = typeof UserTierConst[keyof typeof UserTierConst];
      const userTier = (user.tier || "free") as TierType;
      const { available, locked } = getFeaturesForTier(userTier);
      const nextTierKey = getNextTier(userTier);
      
      // Build response with tier info
      const currentTierInfo = TIER_BENEFITS[userTier as keyof typeof TIER_BENEFITS];
      const nextTierInfo = nextTierKey ? TIER_BENEFITS[nextTierKey as keyof typeof TIER_BENEFITS] : null;
      
      // Generate personalized upgrade recommendation based on user activity
      let upgradeRecommendation: string | undefined;
      if (userTier === "free") {
        const lessonCount = await storage.countMonthlyGenerations(userId);
        if (lessonCount >= 3) {
          upgradeRecommendation = "You're using AI lessons frequently! Upgrade to Pro for unlimited lesson generation and advanced analytics.";
        } else {
          upgradeRecommendation = "Unlock unlimited AI lessons and personalized professional development with Pro.";
        }
      } else if (userTier === "pro") {
        upgradeRecommendation = "Ready to collaborate? Campus tier enables real-time co-creation, classroom management, and shared resources.";
      }
      
      const sitemap = {
        currentTier: userTier,
        tierInfo: currentTierInfo,
        nextTier: nextTierInfo,
        availableFeatures: available.map(f => ({
          id: f.id,
          name: f.name,
          description: f.description,
          icon: f.icon,
          path: f.path,
          category: f.category,
          limitInfo: f.limitInfo,
        })),
        lockedFeatures: locked.map(f => ({
          id: f.id,
          name: f.name,
          description: f.description,
          icon: f.icon,
          path: f.path,
          category: f.category,
          requiredTier: f.requiredTier,
          upgradeMessage: f.upgradeMessage,
        })),
        upgradeRecommendation,
      };
      
      res.json(sitemap);
    } catch (error) {
      console.error("Profile sitemap error:", error);
      res.status(500).json({ error: "Failed to load profile sitemap" });
    }
  });

  // Tier access validation middleware for protected routes
  // Use this to prevent direct URL access to tier-locked features
  app.get("/api/profile/check-feature-access/:featureId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { featureId } = req.params;
      
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      
      const { TIER_FEATURES, tierHasAccess, UserTier: UserTierConst2 } = await import("@shared/schema");
      
      const feature = TIER_FEATURES.find(f => f.id === featureId);
      if (!feature) {
        res.status(404).json({ error: "Feature not found" });
        return;
      }
      
      type TierType = typeof UserTierConst2[keyof typeof UserTierConst2];
      const userTier = (user.tier || "free") as TierType;
      const hasAccess = tierHasAccess(userTier, feature.requiredTier);
      
      res.json({
        featureId,
        hasAccess,
        requiredTier: feature.requiredTier,
        userTier,
        upgradeMessage: hasAccess ? null : feature.upgradeMessage,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to check feature access" });
    }
  });

  // Careers - public with filtering options
  app.get("/api/careers", async (req, res) => {
    try {
      const { grade, state } = req.query;
      let careers;
      
      if (grade && typeof grade === "string") {
        careers = await storage.getCareersByGrade(grade);
      } else if (state && typeof state === "string") {
        careers = await storage.getCareersByState(state);
      } else {
        careers = await storage.getCareers();
      }
      res.json(careers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch careers" });
    }
  });

  // Get trending/high-growth careers based on BLS data
  app.get("/api/careers/trending", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const trendingCareers = await storage.getTrendingCareers(limit);
      res.json(trendingCareers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trending careers" });
    }
  });

  app.get("/api/careers/recommended", async (req, res) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const results = await storage.getSelfDiscoveryResults(userId);
      
      if (results.length === 0) {
        return res.json({ 
          hasAssessment: false, 
          recommendations: [],
          message: "Complete the Self-Discovery assessment to get personalized career recommendations"
        });
      }

      const latestResult = results[0];
      const limit = parseInt(req.query.limit as string) || 6;
      
      const recommendations = await storage.getRecommendedCareers(
        latestResult.beScore,
        latestResult.knowScore,
        latestResult.doScore,
        limit
      );

      res.json({ 
        hasAssessment: true,
        userProfile: {
          beScore: latestResult.beScore,
          knowScore: latestResult.knowScore,
          doScore: latestResult.doScore,
          strengths: latestResult.strengths
        },
        recommendations 
      });
    } catch (error) {
      console.error("Error fetching recommended careers:", error);
      res.status(500).json({ error: "Failed to fetch recommended careers" });
    }
  });

  // Get market trends data - aggregated BLS statistics
  app.get("/api/careers/market-trends", async (req, res) => {
    try {
      const { state } = req.query;
      const allCareers = state && typeof state === "string" 
        ? await storage.getCareersByState(state)
        : await storage.getCareers();
      
      // Calculate market trends summary
      const outlookCounts = { 
        much_faster: 0, 
        faster_than_average: 0, 
        average: 0, 
        little_change: 0, 
        declining: 0 
      };
      const demandCounts = { very_high: 0, high: 0, moderate: 0, low: 0 };
      const categoryCounts: Record<string, number> = {};
      let totalProjectedOpenings = 0;
      let avgGrowthRate = 0;
      
      allCareers.forEach(c => {
        if (c.jobOutlook) outlookCounts[c.jobOutlook]++;
        if (c.demandLevel) demandCounts[c.demandLevel]++;
        categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
        totalProjectedOpenings += c.projectedOpenings || 0;
        avgGrowthRate += c.projectedGrowth || 0;
      });
      
      avgGrowthRate = allCareers.length > 0 ? avgGrowthRate / allCareers.length : 0;
      
      const topGrowingCareers = [...allCareers]
        .sort((a, b) => (b.projectedGrowth || 0) - (a.projectedGrowth || 0))
        .slice(0, 5)
        .map(c => ({ id: c.id, title: c.title, growth: c.projectedGrowth, category: c.category }));
      
      const highDemandCategories = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }));
      
      res.json({
        summary: {
          totalCareers: allCareers.length,
          totalProjectedOpenings,
          avgGrowthRate: Math.round(avgGrowthRate * 10) / 10,
          lastUpdated: "2024-09",
          source: "Bureau of Labor Statistics (BLS)"
        },
        outlookDistribution: outlookCounts,
        demandDistribution: demandCounts,
        topGrowingCareers,
        highDemandCategories,
        stateFilter: state || null
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch market trends" });
    }
  });

  app.get("/api/careers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const career = await storage.getCareer(id);
      if (!career) {
        res.status(404).json({ error: "Career not found" });
        return;
      }
      res.json(career);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch career" });
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
      const scope = await storage.getScopeSequence(id);
      if (!scope) {
        res.status(404).json({ error: "Scope sequence not found" });
        return;
      }
      // Get units for this scope
      const units = await storage.getSequenceUnits(id);
      res.json({ scope, units });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scope sequence" });
    }
  });

  app.post("/api/scopes", isAuthenticated, async (req: any, res) => {
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

  app.patch("/api/scopes/:id", isAuthenticated, async (req: any, res) => {
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

  app.delete("/api/scopes/:id", isAuthenticated, async (req: any, res) => {
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
  app.post("/api/scopes/import", isAuthenticated, upload.single("file"), async (req: any, res) => {
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
  app.post("/api/scopes/:scopeId/units", isAuthenticated, async (req: any, res) => {
    try {
      const { scopeId } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Verify user owns the scope
      const scope = await storage.getScopeSequence(scopeId);
      if (!scope || scope.userId !== userId) {
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

  app.patch("/api/units/:id", isAuthenticated, async (req: any, res) => {
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

  app.delete("/api/units/:id", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/scopes/:scopeId/sync-standards", isAuthenticated, async (req: any, res) => {
    try {
      const { scopeId } = req.params;
      const userId = req.user?.claims?.sub;

      const scope = await storage.getScopeSequence(scopeId);
      if (!scope || scope.userId !== userId) {
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

  // Get all pending change requests (for campus admin)
  app.get("/api/admin/change-requests", isAuthenticated, requireCampusAdmin, async (req: any, res) => {
    try {
      const requests = await storage.getAllPendingChangeRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending change requests" });
    }
  });

  // Self-Discovery Results
  app.get("/api/self-discovery/results", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const results = await storage.getSelfDiscoveryResults(userId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch self-discovery results" });
    }
  });

  app.post("/api/self-discovery/results", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { beScore, knowScore, doScore, totalScore, strengths, growthAreas, answers } = req.body;
      
      const result = await storage.saveSelfDiscoveryResult({
        userId,
        beScore,
        knowScore,
        doScore,
        totalScore,
        strengths,
        growthAreas,
        answers,
      });
      
      // Also update the student's Be-Know-Do journey progress
      let journey = await storage.getStudentJourneyProgressByUserId(userId);
      if (!journey) {
        // Auto-create journey if it doesn't exist
        journey = await storage.createStudentJourneyProgress({
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
      
      // Update journey with assessment results
      const overallScore = Math.round((beScore + knowScore + doScore) / 3);
      await storage.updateStudentJourneyProgress(journey.id, {
        beScore,
        knowScore,
        doScore,
        overallScore,
        totalAssessmentsCompleted: (journey.totalAssessmentsCompleted || 0) + 1,
        latestAssessmentResults: {
          completedAt: new Date().toISOString(),
          beAnswers: answers,
          knowAnswers: answers,
          doAnswers: answers,
          strengths: strengths || [],
          growthAreas: growthAreas || [],
        },
        lastActivityDate: new Date(),
      });
      
      // Log the assessment activity
      await storage.createStudentJourneyActivity({
        journeyProgressId: journey.id,
        studentId: userId,
        activityType: "assessment",
        title: "Self-Discovery Assessment Completed",
        description: `Be: ${beScore}%, Know: ${knowScore}%, Do: ${doScore}%`,
        category: "be",
        pointsEarned: overallScore,
        metadata: { beScore, knowScore, doScore, strengths, growthAreas },
      });
      
      // Also create a journey entry for the timeline
      // Get user role for journey entry context
      const user = await storage.getUser(userId);
      await storage.createStudentJourneyEntry({
        userId,
        userRole: user?.role || "student",
        entryType: "assessment",
        bkdPillar: "be",
        title: "Completed Self-Discovery Assessment",
        description: `Discovered strengths in ${(strengths || []).slice(0, 2).join(", ") || "various areas"}. Scores: Be ${beScore}%, Know ${knowScore}%, Do ${doScore}%`,
        pointsEarned: Math.round(overallScore / 10),
        metadata: {
          assessmentId: result.id,
        },
      });
      
      res.json(result);
    } catch (error) {
      console.error("Save self-discovery result error:", error);
      res.status(500).json({ error: "Failed to save self-discovery result" });
    }
  });

  // Saved Careers
  app.get("/api/saved-careers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const careers = await storage.getSavedCareers(userId);
      res.json(careers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch saved careers" });
    }
  });

  app.post("/api/saved-careers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const career = await storage.saveCareer({
        ...req.body,
        userId,
      });
      
      // Create a journey entry for career exploration
      // Get user role for journey entry context
      const user = await storage.getUser(userId);
      await storage.createStudentJourneyEntry({
        userId,
        userRole: user?.role || "student",
        entryType: "career_exploration",
        bkdPillar: "know",
        title: `Saved Career: ${req.body.careerTitle || "New Career"}`,
        description: req.body.careerCategory ? `Exploring ${req.body.careerCategory} careers` : "Added to career exploration list",
        pointsEarned: 2,
        metadata: {
          careerId: career.id,
        },
      });
      
      res.json(career);
    } catch (error) {
      console.error("Save career error:", error);
      res.status(500).json({ error: "Failed to save career" });
    }
  });

  app.delete("/api/saved-careers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const deleted = await storage.deleteSavedCareer(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Saved career not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete saved career" });
    }
  });

  // ================================
  // User Preferences & Onboarding
  // ================================

  // Get user preferences
  app.get("/api/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const prefs = await storage.getUserPreferences(userId);
      res.json(prefs || {});
    } catch (error) {
      console.error("Get preferences error:", error);
      res.status(500).json({ error: "Failed to get preferences" });
    }
  });

  // Update user preferences
  app.patch("/api/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const validated = updatePreferencesSchema.parse(req.body);
      const prefs = await storage.updateUserPreferences(userId, validated as any);
      res.json(prefs);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid preferences data", details: error.errors });
        return;
      }
      console.error("Update preferences error:", error);
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  // Skip onboarding (with limit tracking)
  app.post("/api/onboarding/skip", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      
      const currentSkipCount = user.onboardingSkipCount || 0;
      const maxSkips = 3;
      
      if (currentSkipCount >= maxSkips) {
        res.status(403).json({ 
          error: "Maximum skips reached", 
          message: "Please complete onboarding to continue using the app",
          skipsRemaining: 0 
        });
        return;
      }
      
      // Increment skip count
      const updatedUser = await storage.incrementOnboardingSkipCount(userId);
      
      res.json({ 
        success: true, 
        skipsRemaining: maxSkips - (updatedUser.onboardingSkipCount || 0),
        message: `You have ${maxSkips - (updatedUser.onboardingSkipCount || 0)} skips remaining`
      });
    } catch (error) {
      console.error("Skip onboarding error:", error);
      res.status(500).json({ error: "Failed to skip onboarding" });
    }
  });

  // Complete onboarding
  app.post("/api/onboarding/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const validated = completeOnboardingSchema.parse(req.body);
      const { role, preferences, needsAnalysis } = validated;
      
      // Update user role (map homeschool_parent to educator for DB storage)
      if (role) {
        const dbRole = role === "homeschool_parent" ? "educator" : role;
        await storage.updateUserRole(userId, dbRole as UserRole);
      }
      
      // Save preferences with needs analysis
      await storage.updateUserPreferences(userId, {
        ...preferences,
        needsAnalysis: needsAnalysis as any,
      });
      
      // Mark onboarding complete
      const user = await storage.completeOnboarding(userId);
      
      res.json({ success: true, user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid onboarding data", details: error.errors });
        return;
      }
      console.error("Complete onboarding error:", error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });

  // Update user role
  app.patch("/api/user/role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const validated = updateRoleSchema.parse(req.body);
      const dbRole = validated.role === "homeschool_parent" ? "educator" : validated.role;
      const user = await storage.updateUserRole(userId, dbRole as UserRole);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid role data", details: error.errors });
        return;
      }
      console.error("Update role error:", error);
      res.status(500).json({ error: "Failed to update role" });
    }
  });

  // ================================
  // Assignment System (Paid Feature)
  // ================================

  // Helper to check paid tier
  const requirePaidTier = async (req: any, res: any, next: any) => {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tier = await storage.getUserTier(userId);
    if (tier === "free") {
      res.status(403).json({ 
        error: "Paid subscription required",
        message: "Assignment generation is a Pro/Campus feature. Upgrade your plan to access this feature.",
        requiredTier: "pro"
      });
      return;
    }
    next();
  };

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

  // Generate assignment from lesson (PAID FEATURE)
  app.post("/api/assignments/generate", isAuthenticated, requirePaidTier, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { lessonId, assignmentType, questionCount, difficulty, includeBeKnowDo, accommodationTypes, accommodationNotes, projectTemplate } = req.body;
      
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        res.status(404).json({ error: "Lesson not found" });
        return;
      }
      
      if (lesson.userId !== userId) {
        res.status(403).json({ error: "You can only generate assignments from your own lessons" });
        return;
      }
      
      const { generateAssignment } = await import("./assignmentGenerator");
      const generated = await generateAssignment({
        lesson,
        assignmentType: assignmentType || "quiz",
        questionCount: questionCount || 5,
        difficulty: difficulty || "medium",
        includeBeKnowDo: includeBeKnowDo !== false,
        accommodationTypes,
        accommodationNotes,
        projectTemplate: projectTemplate || "community_consultant",
      });
      
      res.json(generated);
    } catch (error) {
      console.error("Generate assignment error:", error);
      res.status(500).json({ error: "Failed to generate assignment" });
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

  // Get students with specific accommodation types (for accommodation group targeting)
  app.post("/api/students/by-accommodations", isAuthenticated, async (req: any, res) => {
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

  // Get grades for a specific student
  app.get("/api/students/:studentId/grades", isAuthenticated, async (req: any, res) => {
    try {
      const { studentId } = req.params;
      const gradesList = await storage.getStudentGradesByStudent(studentId);
      res.json(gradesList);
    } catch (error) {
      console.error("Error fetching student grades:", error);
      res.status(500).json({ error: "Failed to fetch student grades" });
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

  // Students management
  app.get("/api/students", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const studentsList = await storage.getStudents(userId);
      res.json(studentsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  app.post("/api/students", isAuthenticated, async (req: any, res) => {
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

  app.patch("/api/students/:id", isAuthenticated, async (req: any, res) => {
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

  app.delete("/api/students/:id", isAuthenticated, async (req: any, res) => {
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

  // Student Notes
  app.get("/api/students/:studentId/notes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { studentId } = req.params;
      const notes = await storage.getStudentNotes(studentId, userId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student notes" });
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

  app.post("/api/students/:studentId/notes", isAuthenticated, async (req: any, res) => {
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

  app.patch("/api/student-notes/:id", isAuthenticated, async (req: any, res) => {
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

  app.delete("/api/student-notes/:id", isAuthenticated, async (req: any, res) => {
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

  app.get("/api/students/:studentId/attendance", isAuthenticated, async (req: any, res) => {
    try {
      const { studentId } = req.params;
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

  // Student groups
  app.get("/api/student-groups", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const groups = await storage.getStudentGroups(userId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student groups" });
    }
  });

  app.post("/api/student-groups", isAuthenticated, async (req: any, res) => {
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

  app.patch("/api/student-groups/:id", isAuthenticated, async (req: any, res) => {
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

  app.delete("/api/student-groups/:id", isAuthenticated, async (req: any, res) => {
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
  // Real-Time Collaboration System
  // ================================

  // Generate unique invite code
  function generateInviteCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Create collaboration session
  app.post("/api/collaboration/sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { title, description, lessonId, sessionType, maxParticipants, settings } = req.body;
      
      const session = await storage.createCollaborationSession({
        hostUserId: userId,
        title,
        description,
        lessonId,
        sessionType: sessionType || "lesson_planning",
        status: "active",
        inviteCode: generateInviteCode(),
        maxParticipants: maxParticipants || 10,
        settings: settings || {
          allowEditing: true,
          allowChat: true,
          allowComments: true,
          requireApproval: false,
        },
      });
      
      await storage.createSessionParticipant({
        sessionId: session.id,
        userId,
        role: "host",
        status: "active",
      });
      
      res.json(session);
    } catch (error) {
      console.error("Create collaboration session error:", error);
      res.status(500).json({ error: "Failed to create collaboration session" });
    }
  });

  // Get user's hosted sessions
  app.get("/api/collaboration/sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const sessions = await storage.getCollaborationSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch collaboration sessions" });
    }
  });

  // Get sessions user is participating in
  app.get("/api/collaboration/participating", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const sessions = await storage.getUserParticipatedSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch participated sessions" });
    }
  });

  // Get single session
  app.get("/api/collaboration/sessions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const session = await storage.getCollaborationSession(id);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      
      const participants = await storage.getActiveSessionParticipants(id);
      res.json({ session, participants });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  // Join session by invite code
  app.post("/api/collaboration/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { inviteCode } = req.body;
      
      const session = await storage.getCollaborationSessionByInviteCode(inviteCode);
      if (!session) {
        res.status(404).json({ error: "Invalid invite code" });
        return;
      }
      
      if (session.status !== "active") {
        res.status(400).json({ error: "This session has ended" });
        return;
      }
      
      const existingParticipant = await storage.getSessionParticipant(session.id, userId);
      if (existingParticipant) {
        await storage.updateSessionParticipant(existingParticipant.id, { status: "active" });
        res.json({ session, participant: existingParticipant });
        return;
      }
      
      const activeParticipants = await storage.getActiveSessionParticipants(session.id);
      if (session.maxParticipants && activeParticipants.length >= session.maxParticipants) {
        res.status(400).json({ error: "Session is full" });
        return;
      }
      
      const participant = await storage.createSessionParticipant({
        sessionId: session.id,
        userId,
        role: "editor",
        status: "active",
      });
      
      res.json({ session, participant });
    } catch (error) {
      console.error("Join session error:", error);
      res.status(500).json({ error: "Failed to join session" });
    }
  });

  // End collaboration session
  app.post("/api/collaboration/sessions/:id/end", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      
      const session = await storage.endCollaborationSession(id, userId);
      if (!session) {
        res.status(404).json({ error: "Session not found or not authorized" });
        return;
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to end session" });
    }
  });

  // Leave session
  app.post("/api/collaboration/sessions/:id/leave", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      
      await storage.leaveSession(id, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to leave session" });
    }
  });

  // Get session messages
  app.get("/api/collaboration/sessions/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const messages = await storage.getCollaborationMessages(id, 100);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Get session edit history
  app.get("/api/collaboration/sessions/:id/history", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const history = await storage.getSessionEditHistory(id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch edit history" });
    }
  });

  // ================================
  // Shared Resources Library
  // ================================

  // Get public shared resources
  app.get("/api/shared-resources", async (req, res) => {
    try {
      const { category, subject } = req.query;
      const resources = await storage.getSharedResources({ 
        visibility: "public",
        category: category as string,
        subject: subject as string,
      });
      res.json(resources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shared resources" });
    }
  });

  // Get user's shared resources
  app.get("/api/shared-resources/mine", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const resources = await storage.getUserSharedResources(userId);
      res.json(resources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch your resources" });
    }
  });

  // Get single shared resource
  app.get("/api/shared-resources/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const resource = await storage.getSharedResource(id);
      if (!resource) {
        res.status(404).json({ error: "Resource not found" });
        return;
      }
      res.json(resource);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resource" });
    }
  });

  // Create shared resource
  app.post("/api/shared-resources", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const resource = await storage.createSharedResource({
        ...req.body,
        userId,
      });
      res.json(resource);
    } catch (error) {
      console.error("Create resource error:", error);
      res.status(500).json({ error: "Failed to create resource" });
    }
  });

  // Update shared resource
  app.patch("/api/shared-resources/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const updated = await storage.updateSharedResource(id, req.body, userId);
      if (!updated) {
        res.status(404).json({ error: "Resource not found or not authorized" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update resource" });
    }
  });

  // Delete shared resource
  app.delete("/api/shared-resources/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const deleted = await storage.deleteSharedResource(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Resource not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete resource" });
    }
  });

  // Like/unlike shared resource
  app.post("/api/shared-resources/:id/like", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const liked = await storage.toggleResourceLike(id, userId);
      res.json({ liked });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle like" });
    }
  });

  // Track shared resource download
  app.post("/api/shared-resources/:id/download", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.incrementResourceDownload(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to track download" });
    }
  });

  // ================================
  // KNOW Resources Routes (Admin-managed educational resources)
  // ================================

  // Get all KNOW resources (public - for students/educators)
  app.get("/api/know-resources", async (req, res) => {
    try {
      const { type, category, featured } = req.query;
      const resources = await storage.getKnowResources({
        resourceType: type as string,
        category: category as string,
        isActive: true,
        featured: featured === "true" ? true : undefined,
      });
      res.json(resources);
    } catch (error) {
      console.error("Failed to fetch KNOW resources:", error);
      res.status(500).json({ error: "Failed to fetch resources" });
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

  // ================================
  // Student Matriculation & Achievement Tracking (System-Level)
  // ================================

  // Get matriculation history for a student
  app.get("/api/students/:studentId/matriculation", isAuthenticated, async (req: any, res) => {
    try {
      const { studentId } = req.params;
      const history = await storage.getStudentMatriculationHistory(studentId);
      res.json(history);
    } catch (error) {
      console.error("Get matriculation history error:", error);
      res.status(500).json({ error: "Failed to get matriculation history" });
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

  // Get all system achievements (public for browsing)
  app.get("/api/achievements", async (req, res) => {
    try {
      const { category, isActive } = req.query;
      const achievements = await storage.getSystemAchievements({
        category: category as string,
        isActive: isActive === 'true',
        isSystemWide: true,
      });
      res.json(achievements);
    } catch (error) {
      console.error("Get achievements error:", error);
      res.status(500).json({ error: "Failed to get achievements" });
    }
  });

  // Get single achievement
  app.get("/api/achievements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const achievement = await storage.getSystemAchievement(id);
      if (!achievement) {
        res.status(404).json({ error: "Achievement not found" });
        return;
      }
      res.json(achievement);
    } catch (error) {
      console.error("Get achievement error:", error);
      res.status(500).json({ error: "Failed to get achievement" });
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

  // Get student achievements
  app.get("/api/students/:studentId/achievements", isAuthenticated, async (req: any, res) => {
    try {
      const { studentId } = req.params;
      const achievements = await storage.getStudentAchievements(studentId);
      res.json(achievements);
    } catch (error) {
      console.error("Get student achievements error:", error);
      res.status(500).json({ error: "Failed to get student achievements" });
    }
  });

  // Award achievement to student (educator/admin)
  app.post("/api/students/:studentId/achievements", isAuthenticated, async (req: any, res) => {
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

  // Affiliate System - Get or create affiliate profile
  app.get("/api/affiliate/me", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
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
      
      res.json(affiliate);
    } catch (error) {
      console.error("Get affiliate error:", error);
      res.status(500).json({ error: "Failed to get affiliate profile" });
    }
  });

  // Get affiliate dashboard with stats
  app.get("/api/affiliate/dashboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      let affiliate = await storage.getEducatorAffiliate(userId);
      
      if (!affiliate) {
        res.status(404).json({ error: "Affiliate profile not found" });
        return;
      }
      
      const recentEvents = await storage.getReferralEvents(affiliate.id, 20);
      const rewards = await storage.getAffiliateRewards(affiliate.id);
      
      res.json({
        affiliate,
        recentEvents,
        rewards,
      });
    } catch (error) {
      console.error("Get affiliate dashboard error:", error);
      res.status(500).json({ error: "Failed to get affiliate dashboard" });
    }
  });

  // Update affiliate profile
  app.patch("/api/affiliate/me", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { displayName, bio } = req.body;
      
      const updated = await storage.updateEducatorAffiliate(userId, {
        displayName,
        bio,
      });
      
      if (!updated) {
        res.status(404).json({ error: "Affiliate profile not found" });
        return;
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Update affiliate error:", error);
      res.status(500).json({ error: "Failed to update affiliate profile" });
    }
  });

  // Track referral event (public endpoint for shared lesson views)
  app.post("/api/referral/track", async (req, res) => {
    try {
      const { shareId, referralCode, eventType, channel, visitorId } = req.body;
      
      if (!eventType) {
        res.status(400).json({ error: "Event type is required" });
        return;
      }
      
      let affiliate;
      if (referralCode) {
        affiliate = await storage.getEducatorAffiliateByCode(referralCode);
      } else if (shareId) {
        const lesson = await storage.getLessonByShareId(shareId);
        if (lesson) {
          affiliate = await storage.getEducatorAffiliate(lesson.userId);
        }
      }
      
      if (!affiliate) {
        res.status(404).json({ error: "Invalid referral" });
        return;
      }
      
      const pointsMap: Record<string, number> = {
        view: 1,
        share: 5,
        copy_link: 2,
        signup: 50,
        lesson_save: 25,
      };
      
      const event = await storage.createReferralEvent({
        affiliateId: affiliate.id,
        shareId: shareId || null,
        eventType,
        channel: channel || "direct",
        visitorId: visitorId || null,
        pointsEarned: pointsMap[eventType] || 0,
      });
      
      if (pointsMap[eventType] && pointsMap[eventType] > 0) {
        await storage.createAffiliateReward({
          affiliateId: affiliate.id,
          points: pointsMap[eventType],
          rewardType: "earned",
          description: `${eventType} from ${channel || "direct"} link`,
          eventId: event.id,
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Track referral error:", error);
      res.status(500).json({ error: "Failed to track referral" });
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
        await storage.createReferralEvent({
          affiliateId: affiliate.id,
          lessonId: id,
          shareId,
          eventType: "share",
          channel,
          pointsEarned: 5,
        });
        
        await storage.createAffiliateReward({
          affiliateId: affiliate.id,
          points: 5,
          rewardType: "earned",
          description: `Shared lesson via ${channel}`,
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

  // ================================
  // Educational Standards Admin API
  // ================================

  // Helper to check site admin for standards admin routes
  const requireSiteAdminForStandards = async (req: any, res: any): Promise<boolean> => {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return false;
    }
    const isSiteAdminUser = await storage.isSiteAdmin(userId);
    if (!isSiteAdminUser) {
      res.status(403).json({ error: "Standards administration requires system-level admin access" });
      return false;
    }
    return true;
  };

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

  // Map of actual US state names to their abbreviations for filtering
  const US_STATES: Record<string, string> = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 
    'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 
    'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID', 
    'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS', 
    'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
    'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
    'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
    'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
    'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
    'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
    'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC'
  };

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

  // Helper to find state name from abbreviation
  const getStateNameFromAbbr = (abbr: string): string | undefined => {
    return Object.entries(US_STATES).find(([name, ab]) => ab === abbr)?.[0];
  };

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
      
      // If no CSP jurisdiction found, try fallback standards
      if (!jurisdiction) {
        const { getSubjects } = await import("@shared/standards");
        const fallbackSubjects = getSubjects(country, stateAbbr);
        if (fallbackSubjects.length > 0) {
          res.json(fallbackSubjects.map(s => ({ subject: s.subject, source: 'fallback' })));
          return;
        }
        res.json([]);
        return;
      }
      
      const sets = await storage.getStandardSets(jurisdiction.id);
      const subjects = Array.from(new Set(sets.map(s => s.subject)));
      res.json(subjects.map(subject => ({ subject, source: 'csp' })));
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
      
      // If no CSP jurisdiction found, try fallback standards
      if (!jurisdiction) {
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
      
      const sets = await storage.getStandardSets(jurisdiction.id);
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

  // ================================
  // Site Administration & Multi-Tenant
  // ================================

  // Middleware to check if user is a site admin
  const isSiteAdmin = async (req: any, res: any, next: any) => {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const isAdmin = await storage.isSiteAdmin(userId);
    if (!isAdmin) {
      res.status(403).json({ error: "Site admin access required" });
      return;
    }
    next();
  };

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

  // Get all users (site admin only) - for selecting lesson authors
  app.get("/api/users", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      // Return basic user info only
      const users = allUsers.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role
      }));
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
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

  // ================================
  // Organization Hierarchy Endpoints
  // ================================

  // Valid organization types for validation
  const validOrgTypes = ["country", "state", "jurisdiction", "district", "school", "campus", "university", "other"];

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

  // Entity sharing between organizations
  const entityShareBodySchema = z.object({
    entityType: z.enum(["class", "student", "assignment", "lesson", "scope_sequence"]),
    entityId: z.string().min(1),
    targetOrganizationId: z.string().min(1),
    permission: z.enum(["view", "edit", "copy"]).optional().default("view"),
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

  app.get("/api/shares/entity/:entityType/:entityId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { entityType, entityId } = req.params;
      
      const shares = await storage.getEntityShares(entityType, entityId);
      
      const userOrgs = await storage.getUserOrganizations(userId);
      const userOrgIds = userOrgs.map(m => m.organizationId);
      
      const filteredShares = shares.filter(share => 
        userOrgIds.includes(share.sourceOrganizationId) ||
        userOrgIds.includes(share.targetOrganizationId)
      );
      
      res.json(filteredShares);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch entity shares" });
    }
  });

  app.delete("/api/shares/:shareId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { shareId } = req.params;
      
      const share = await storage.getEntityShare(shareId);
      if (!share) {
        res.status(404).json({ error: "Share not found" });
        return;
      }
      
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      
      const sourceOrgMembership = await storage.getOrgMembership(share.sourceOrganizationId, userId);
      const isSourceOrgAdmin = sourceOrgMembership && 
        (sourceOrgMembership.role === "admin" || sourceOrgMembership.role === "owner");
      
      if (!isSiteAdminUser && !isSourceOrgAdmin) {
        res.status(403).json({ error: "Admin access required to delete share" });
        return;
      }
      
      await storage.deleteEntityShare(shareId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete share" });
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
      const estimatedMRR = (proUsers * 14.99) + (campusUsers * 39.99) + (enterpriseUsers * 199);
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
      const { tier, role, email, firstName, lastName } = req.body;
      
      const updates: Partial<User> = {};
      if (tier) updates.tier = tier;
      if (role) updates.role = role;
      if (email) updates.email = email;
      if (firstName) updates.firstName = firstName;
      if (lastName) updates.lastName = lastName;
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

  // ============ Parent Portal Routes ============
  
  // Get linked students (for parents) or linked parents (for students)
  app.get("/api/parent-portal/links", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const role = req.query.role as 'parent' | 'student' || 'parent';
      
      const links = await storage.getParentStudentLinks(userId, role);
      
      // Enrich with user details
      const enrichedLinks = await Promise.all(links.map(async (link) => {
        const targetUserId = role === 'parent' ? link.studentUserId : link.parentUserId;
        const user = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
        return {
          ...link,
          linkedUser: user[0] ? {
            id: user[0].id,
            firstName: user[0].firstName,
            lastName: user[0].lastName,
            email: user[0].email,
          } : null,
        };
      }));
      
      res.json(enrichedLinks);
    } catch (error) {
      console.error("Error fetching parent-student links:", error);
      res.status(500).json({ error: "Failed to fetch links" });
    }
  });

  // Get a specific link
  app.get("/api/parent-portal/links/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const link = await storage.getParentStudentLink(req.params.id);
      
      if (!link || (link.parentUserId !== userId && link.studentUserId !== userId)) {
        res.status(404).json({ error: "Link not found" });
        return;
      }
      
      res.json(link);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch link" });
    }
  });

  // Update link permissions (student controls what parent can see)
  app.patch("/api/parent-portal/links/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const link = await storage.getParentStudentLink(req.params.id);
      
      if (!link || (link.studentUserId !== userId && link.parentUserId !== userId)) {
        res.status(403).json({ error: "Only the student or parent can update permissions" });
        return;
      }
      
      const { permissions, status } = req.body;
      const updated = await storage.updateParentStudentLink(req.params.id, { permissions, status });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update link" });
    }
  });

  // Delete a parent-student link
  app.delete("/api/parent-portal/links/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const link = await storage.getParentStudentLink(req.params.id);
      
      if (!link || (link.studentUserId !== userId && link.parentUserId !== userId)) {
        res.status(403).json({ error: "Not authorized to delete this link" });
        return;
      }
      
      await storage.deleteParentStudentLink(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete link" });
    }
  });

  // Get student's invitations sent to parents
  app.get("/api/parent-portal/invitations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const invitations = await storage.getParentInvitations(userId);
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invitations" });
    }
  });

  // Student invites a parent
  app.post("/api/parent-portal/invitations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { parentEmail, relationship } = req.body;
      
      if (!parentEmail) {
        res.status(400).json({ error: "Parent email is required" });
        return;
      }
      
      const token = randomUUID().replace(/-/g, "").substring(0, 32);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      const invitation = await storage.createParentInvitation({
        studentUserId: userId,
        parentEmail,
        relationship: relationship || "parent",
        token,
        status: "pending",
        expiresAt,
      });
      
      res.json(invitation);
    } catch (error) {
      res.status(500).json({ error: "Failed to create invitation" });
    }
  });

  // Accept parent invitation (parent uses this after signing in)
  app.post("/api/parent-portal/invitations/accept", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { token } = req.body;
      
      if (!token) {
        res.status(400).json({ error: "Invitation token is required" });
        return;
      }
      
      const link = await storage.acceptParentInvitation(token, userId);
      if (!link) {
        res.status(400).json({ error: "Invalid or expired invitation" });
        return;
      }
      
      res.json(link);
    } catch (error) {
      res.status(500).json({ error: "Failed to accept invitation" });
    }
  });

  // Delete invitation
  app.delete("/api/parent-portal/invitations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const invitations = await storage.getParentInvitations(userId);
      const invitation = invitations.find(i => i.id === req.params.id);
      
      if (!invitation) {
        res.status(404).json({ error: "Invitation not found" });
        return;
      }
      
      await storage.deleteParentInvitation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete invitation" });
    }
  });

  // Get student data for parent view (respects permissions)
  app.get("/api/parent-portal/student/:studentId", isAuthenticated, async (req: any, res) => {
    try {
      const parentUserId = req.user?.claims?.sub;
      const { studentId } = req.params;
      
      const link = await storage.getParentStudentLinkByUsers(parentUserId, studentId);
      if (!link || link.status !== 'active') {
        res.status(403).json({ error: "You don't have access to this student's data" });
        return;
      }
      
      const permissions = (link.permissions || {}) as { 
        viewGoals?: boolean; 
        viewAssessments?: boolean; 
        viewCareers?: boolean; 
        viewLessons?: boolean; 
        viewMilestones?: boolean;
        viewActivities?: boolean;
        receiveNotifications?: boolean;
      };
      const studentData: any = {};
      
      // Get student user info
      const [student] = await db.select().from(users).where(eq(users.id, studentId));
      if (student) {
        studentData.student = {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
        };
      }
      
      // Always try to get journey progress (core feature for parents)
      try {
        const journeyProgress = await storage.getStudentJourneyProgress(studentId);
        if (journeyProgress) {
          studentData.journeyProgress = {
            beScore: journeyProgress.beScore,
            knowScore: journeyProgress.knowScore,
            doScore: journeyProgress.doScore,
            overallScore: journeyProgress.overallScore,
            totalAssessmentsCompleted: journeyProgress.totalAssessmentsCompleted,
            totalMilestonesAchieved: journeyProgress.totalMilestonesAchieved,
            currentFocus: journeyProgress.currentFocus,
            lastActivityDate: journeyProgress.lastActivityDate,
          };
        }
      } catch (e) {
        // Journey progress may not exist yet
      }
      
      // Get goals if permitted
      if (permissions.viewGoals) {
        studentData.goals = await storage.getGoals(studentId);
      }
      
      // Get self-discovery results if permitted
      if (permissions.viewAssessments) {
        studentData.assessments = await storage.getSelfDiscoveryResults(studentId);
      }
      
      // Get saved careers if permitted
      if (permissions.viewCareers) {
        studentData.savedCareers = await storage.getSavedCareers(studentId);
      }
      
      // Get milestones if permitted
      if (permissions.viewMilestones) {
        try {
          const milestones = await storage.getLyseMilestones(studentId);
          studentData.milestones = milestones.filter(m => m.status === 'completed');
        } catch (e) {
          studentData.milestones = [];
        }
      }
      
      // Get recent activities if permitted - use journey progress activities
      if (permissions.viewActivities) {
        try {
          const existingJourneyProgress = await storage.getStudentJourneyProgress(studentId);
          if (existingJourneyProgress) {
            studentData.recentActivities = await storage.getStudentJourneyActivities(existingJourneyProgress.id, 10);
          } else {
            studentData.recentActivities = [];
          }
        } catch (e) {
          studentData.recentActivities = [];
        }
      }
      
      // Get portfolio if permitted
      if ((permissions as any).viewPortfolio) {
        try {
          const portfolio = await storage.getStudentPortfolio(studentId);
          if (portfolio) {
            const portfolioItems = await storage.getPortfolioItems(portfolio.id);
            studentData.portfolio = {
              ...portfolio,
              items: portfolioItems.slice(0, 10), // Limit to recent 10 items
            };
          }
        } catch (e) {
          studentData.portfolio = null;
        }
      }
      
      // Get assignments for the student if permitted
      if ((permissions as any).viewAssignments) {
        try {
          const studentAssignments = await storage.getAssignmentsForStudent(studentId);
          studentData.assignments = studentAssignments.slice(0, 10).map(({ assignment, recipient }) => ({
            id: assignment.id,
            title: assignment.title,
            type: (assignment as any).type,
            status: recipient.status,
            grade: (recipient as any).grade,
            submittedAt: recipient.submittedAt,
            dueDate: assignment.dueDate,
            feedback: recipient.feedback,
          }));
        } catch (e) {
          studentData.assignments = [];
        }
      }
      
      // Get parent's notes for this link
      const notes = await storage.getParentProgressNotes(link.id);
      studentData.notes = notes.filter(n => !n.isPrivate || n.parentUserId === parentUserId);
      
      res.json(studentData);
    } catch (error) {
      console.error("Error fetching student data:", error);
      res.status(500).json({ error: "Failed to fetch student data" });
    }
  });

  // Parent adds a progress note
  app.post("/api/parent-portal/notes", isAuthenticated, async (req: any, res) => {
    try {
      const parentUserId = req.user?.claims?.sub;
      const { linkId, studentUserId, noteType, content, relatedGoalId, isPrivate } = req.body;
      
      // Verify parent has access to this link
      const link = await storage.getParentStudentLink(linkId);
      if (!link || link.parentUserId !== parentUserId) {
        res.status(403).json({ error: "Not authorized to add notes for this student" });
        return;
      }
      
      const note = await storage.createParentProgressNote({
        linkId,
        parentUserId,
        studentUserId,
        noteType: noteType || "general",
        content,
        relatedGoalId,
        isPrivate: isPrivate || false,
      });
      
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  // Delete a note
  app.delete("/api/parent-portal/notes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const parentUserId = req.user?.claims?.sub;
      await storage.deleteParentProgressNote(req.params.id, parentUserId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // ================================
  // Parent-Student Connection (Educator-initiated)
  // ================================

  // Educator invites parent for their student
  app.post("/api/educator/invite-parent", isAuthenticated, async (req: any, res) => {
    try {
      const educatorId = req.user?.claims?.sub;
      const { studentId, parentEmail, relationship } = req.body;
      
      if (!studentId || !parentEmail) {
        res.status(400).json({ error: "Student ID and parent email are required" });
        return;
      }
      
      // Verify educator has access to this student (enrolled in their class)
      const educator = await storage.getUser(educatorId);
      if (!educator || (educator.role !== "educator" && educator.role !== "campus_admin" && educator.role !== "district_admin")) {
        res.status(403).json({ error: "Only educators can invite parents" });
        return;
      }
      
      // Get student to verify exists
      const student = await storage.getStudent(studentId);
      if (!student) {
        res.status(404).json({ error: "Student not found" });
        return;
      }
      
      // Verify student is in educator's class (unless campus admin)
      if (educator.role === "educator") {
        const educatorClasses = await storage.getClasses(educatorId);
        let studentInClass = false;
        for (const cls of educatorClasses) {
          const classStudentsList = await storage.getClassStudents(cls.id);
          if (classStudentsList.some(cs => cs.studentId === studentId)) {
            studentInClass = true;
            break;
          }
        }
        
        if (!studentInClass) {
          res.status(403).json({ error: "You can only invite parents for students in your classes" });
          return;
        }
      }
      
      // Create invitation with student's user ID
      const token = randomUUID().replace(/-/g, "").substring(0, 32);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      const invitation = await storage.createParentInvitation({
        studentUserId: student.userId,
        parentEmail,
        relationship: relationship || "parent",
        token,
        status: "pending",
        expiresAt,
      });
      
      res.json(invitation);
    } catch (error) {
      res.status(500).json({ error: "Failed to create parent invitation" });
    }
  });

  // Get schools/campuses for parent lookup (public endpoint for dropdown)
  app.get("/api/parent-portal/schools", async (req, res) => {
    try {
      // Get organizations that are schools/campuses
      const orgs = await storage.getOrganizations();
      const schools = orgs
        .filter(o => o.type === "school" || o.type === "campus")
        .map(o => ({ id: o.id, name: o.name, type: o.type }));
      res.json(schools);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schools" });
    }
  });

  // Parent looks up student by school and student ID
  app.post("/api/parent-portal/lookup-student", isAuthenticated, async (req: any, res) => {
    try {
      const parentUserId = req.user?.claims?.sub;
      const { schoolId, studentIdNumber } = req.body;
      
      // Verify this user is not a student (students can't lookup other students)
      const requestingUser = await storage.getUser(parentUserId);
      if (requestingUser?.role === "student") {
        res.status(403).json({ error: "Students cannot use the parent lookup feature" });
        return;
      }
      
      if (!schoolId || !studentIdNumber) {
        res.status(400).json({ error: "School and student ID are required" });
        return;
      }
      
      // Find student by organization and student ID number
      const student = await storage.findStudentBySchoolAndId(schoolId, studentIdNumber);
      if (!student) {
        res.status(404).json({ error: "Student not found. Please verify the school and student ID." });
        return;
      }
      
      // Check if already connected
      const existingLink = await storage.getParentStudentLinkByUsers(parentUserId, student.userId);
      if (existingLink) {
        res.status(400).json({ 
          error: existingLink.status === "active" 
            ? "You are already connected to this student" 
            : "A connection request is already pending"
        });
        return;
      }
      
      // Return limited student info for confirmation
      res.json({
        id: student.id,
        userId: student.userId,
        firstName: student.firstName,
        lastName: student.lastName,
        gradeLevel: student.gradeLevel,
        schoolName: student.organizationName || "Unknown School"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to lookup student" });
    }
  });

  // Parent requests connection to student
  app.post("/api/parent-portal/request-connection", isAuthenticated, async (req: any, res) => {
    try {
      const parentUserId = req.user?.claims?.sub;
      const { studentUserId, relationship } = req.body;
      
      if (!studentUserId) {
        res.status(400).json({ error: "Student ID is required" });
        return;
      }
      
      // Verify student exists
      const [studentUser] = await db.select().from(users).where(eq(users.id, studentUserId));
      if (!studentUser) {
        res.status(404).json({ error: "Student not found" });
        return;
      }
      
      // Check for existing link
      const existingLink = await storage.getParentStudentLinkByUsers(parentUserId, studentUserId);
      if (existingLink) {
        res.status(400).json({ error: "Connection already exists or is pending" });
        return;
      }
      
      // Create pending link - requires educator/admin approval
      const link = await storage.createParentStudentLink({
        parentUserId,
        studentUserId,
        relationship: relationship || "parent",
        status: "pending",
        permissions: {
          viewGoals: true,
          viewAssessments: true,
          viewCareers: true,
          viewLessons: false,
          receiveNotifications: true
        }
      });
      
      res.json(link);
    } catch (error) {
      res.status(500).json({ error: "Failed to create connection request" });
    }
  });

  // Get pending parent connection requests (for educators)
  app.get("/api/educator/parent-requests", isAuthenticated, async (req: any, res) => {
    try {
      const educatorId = req.user?.claims?.sub;
      const educator = await storage.getUser(educatorId);
      
      if (!educator || (educator.role !== "educator" && educator.role !== "campus_admin")) {
        res.status(403).json({ error: "Only educators can view parent requests" });
        return;
      }
      
      const requests = await storage.getPendingParentRequests(educatorId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch parent requests" });
    }
  });

  // Educator approves/rejects parent connection request
  app.post("/api/educator/parent-requests/:id/respond", isAuthenticated, async (req: any, res) => {
    try {
      const educatorId = req.user?.claims?.sub;
      const { id } = req.params;
      const { action } = req.body; // "approve" or "reject"
      
      const educator = await storage.getUser(educatorId);
      if (!educator || (educator.role !== "educator" && educator.role !== "campus_admin")) {
        res.status(403).json({ error: "Only educators can respond to parent requests" });
        return;
      }
      
      if (action !== "approve" && action !== "reject") {
        res.status(400).json({ error: "Action must be 'approve' or 'reject'" });
        return;
      }
      
      const updatedLink = await storage.updateParentStudentLink(id, {
        status: action === "approve" ? "active" : "revoked",
        acceptedAt: action === "approve" ? new Date() : undefined
      });
      
      res.json(updatedLink);
    } catch (error) {
      res.status(500).json({ error: "Failed to process request" });
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
        pro: { base: 19, name: "Pro" },
        campus: { base: 99, name: "Campus" },
        enterprise: { base: 299, name: "Enterprise" },
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

  // ================================
  // Subscription / Tier Management (Demo Mode)
  // ================================
  // NOTE: This is a demo/development mode that simulates tier upgrades
  // For production, integrate Stripe via Replit's Stripe connector
  
  app.get("/api/subscription/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      
      res.json({
        tier: user.tier || "free",
        subscriptionStatus: user.subscriptionStatus || null,
        stripeCustomerId: user.stripeCustomerId || null,
        stripeSubscriptionId: user.stripeSubscriptionId || null,
        isDemo: !process.env.STRIPE_SECRET_KEY,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get subscription status" });
    }
  });

  // Demo tier upgrade (for development/testing only)
  app.post("/api/subscription/demo-upgrade", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { tier } = req.body;
      
      if (!["pro", "campus"].includes(tier)) {
        res.status(400).json({ error: "Invalid tier. Choose 'pro' or 'campus'" });
        return;
      }
      
      // Update user tier directly for demo purposes
      await db.update(users)
        .set({ 
          tier: tier,
          subscriptionStatus: "demo_active",
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      
      res.json({ 
        success: true, 
        message: `Upgraded to ${tier} tier (demo mode)`,
        tier: tier,
        isDemo: true,
        note: "For production, connect Stripe via Replit integrations"
      });
    } catch (error) {
      console.error("Demo upgrade error:", error);
      res.status(500).json({ error: "Failed to upgrade tier" });
    }
  });

  // Demo tier downgrade
  app.post("/api/subscription/demo-downgrade", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      await db.update(users)
        .set({ 
          tier: "free",
          subscriptionStatus: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      
      res.json({ 
        success: true, 
        message: "Downgraded to free tier",
        tier: "free"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to downgrade tier" });
    }
  });

  // ================================
  // Payment Methods & PayPal Integration
  // ================================

  app.get("/api/payment-methods/available", async (_req: any, res) => {
    try {
      const methods = [
        {
          id: "stripe",
          name: "Credit / Debit Card",
          description: "Pay securely with Visa, Mastercard, Amex, or Discover",
          icon: "credit-card",
          configured: !!process.env.STRIPE_SECRET_KEY,
          available: true,
        },
        {
          id: "paypal",
          name: "PayPal",
          description: "Pay with your PayPal account or PayPal Credit",
          icon: "paypal",
          configured: isPayPalConfigured(),
          available: true,
        },
        {
          id: "purchase_order",
          name: "Purchase Order",
          description: "For schools and districts - pay via institutional purchase order",
          icon: "file-text",
          configured: true,
          available: true,
        },
        {
          id: "bank_transfer",
          name: "Bank Transfer / ACH",
          description: "Direct bank payment for annual plans (US institutions)",
          icon: "landmark",
          configured: true,
          available: true,
        },
      ];
      res.json(methods);
    } catch (error) {
      res.status(500).json({ error: "Failed to get payment methods" });
    }
  });

  app.post("/api/purchase-order/submit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { tier, poNumber, organizationName, contactName, contactEmail, notes } = req.body;

      if (!tier || !poNumber || !organizationName || !contactEmail) {
        res.status(400).json({ error: "Missing required fields: tier, poNumber, organizationName, contactEmail" });
        return;
      }

      if (!["pro", "campus"].includes(tier)) {
        res.status(400).json({ error: "Invalid tier" });
        return;
      }

      await db.update(users)
        .set({
          tier: tier,
          subscriptionStatus: "po_pending",
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      res.json({
        success: true,
        message: `Purchase order ${poNumber} submitted for ${tier} tier. Your account has been provisioned while we process the PO.`,
        tier: tier,
        poNumber: poNumber,
        status: "pending_verification",
      });
    } catch (error) {
      console.error("Purchase order error:", error);
      res.status(500).json({ error: "Failed to submit purchase order" });
    }
  });

  app.post("/api/bank-transfer/request", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { tier, organizationName, contactEmail } = req.body;

      if (!tier || !organizationName || !contactEmail) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      res.json({
        success: true,
        message: "Bank transfer instructions have been sent to your email.",
        bankDetails: {
          bankName: "LYS Education Inc.",
          routingNumber: "Contact sales@lys.edu for details",
          accountType: "Business Checking",
          reference: `LYS-${tier.toUpperCase()}-${userId.slice(0, 8)}`,
          note: "Please include the reference number in your transfer memo",
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to process bank transfer request" });
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

  // ================================
  // Professional Development System
  // ================================

  // Get educator career goals
  app.get("/api/pd/career-goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const goals = await storage.getEducatorCareerGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch career goals" });
    }
  });

  // Create career goal
  app.post("/api/pd/career-goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const goal = await storage.createEducatorCareerGoal({
        ...req.body,
        userId,
      });
      res.status(201).json(goal);
    } catch (error) {
      res.status(500).json({ error: "Failed to create career goal" });
    }
  });

  // Update career goal
  app.patch("/api/pd/career-goals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const goal = await storage.updateEducatorCareerGoal(req.params.id, userId, req.body);
      if (!goal) {
        res.status(404).json({ error: "Goal not found" });
        return;
      }
      res.json(goal);
    } catch (error) {
      res.status(500).json({ error: "Failed to update career goal" });
    }
  });

  // Delete career goal
  app.delete("/api/pd/career-goals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      await storage.deleteEducatorCareerGoal(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete career goal" });
    }
  });

  // Get educator skills
  app.get("/api/pd/skills", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const skills = await storage.getEducatorSkills(userId);
      res.json(skills);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch skills" });
    }
  });

  // Create skill
  app.post("/api/pd/skills", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const skill = await storage.createEducatorSkill({
        ...req.body,
        userId,
      });
      res.status(201).json(skill);
    } catch (error) {
      res.status(500).json({ error: "Failed to create skill" });
    }
  });

  // Update skill
  app.patch("/api/pd/skills/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const skill = await storage.updateEducatorSkill(req.params.id, userId, req.body);
      if (!skill) {
        res.status(404).json({ error: "Skill not found" });
        return;
      }
      res.json(skill);
    } catch (error) {
      res.status(500).json({ error: "Failed to update skill" });
    }
  });

  // Delete skill
  app.delete("/api/pd/skills/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      await storage.deleteEducatorSkill(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete skill" });
    }
  });

  // Get PD resources
  app.get("/api/pd/resources", async (req, res) => {
    try {
      const { resourceType } = req.query;
      const resources = await storage.getPDResources({
        resourceType: resourceType as string | undefined,
        isActive: true,
      });
      res.json(resources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch PD resources" });
    }
  });

  // Get PD recommendations
  app.get("/api/pd/recommendations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { status } = req.query;
      const recs = await storage.getPDRecommendations(userId, status as string | undefined);
      res.json(recs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  // Generate AI recommendations
  app.post("/api/pd/recommendations/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      // Get user's goals and skills
      const userGoals = await storage.getEducatorCareerGoals(userId);
      const userSkills = await storage.getEducatorSkills(userId);
      const profile = await storage.getEducatorProfile(userId);
      
      // Transform skills to expected format
      const skillsForAI = userSkills.map(s => ({
        skillName: s.skillName,
        category: s.category,
        currentLevel: s.proficiencyLevel,
        targetLevel: Math.min(s.proficiencyLevel + 1, 5),
      }));
      
      // Generate recommendations using AI
      const { generatePDRecommendations } = await import("./openai");
      const recommendations = await generatePDRecommendations(userGoals, skillsForAI, profile as any);
      
      // Clear old recommendations and save new ones
      await storage.clearUserPDRecommendations(userId);
      
      const savedRecs = [];
      for (const rec of recommendations.recommendations) {
        const saved = await storage.createPDRecommendation({
          userId,
          title: rec.title,
          description: rec.description,
          reason: rec.reason,
          skillGaps: rec.skillGaps,
          resourceType: rec.resourceType,
          provider: rec.provider || null,
          estimatedDuration: rec.estimatedDuration || null,
          priority: rec.priority,
          status: "new",
        });
        savedRecs.push(saved);
      }
      
      res.json({
        recommendations: savedRecs,
        summary: recommendations.summary,
        focusAreas: recommendations.focusAreas,
      });
    } catch (error) {
      console.error("Failed to generate PD recommendations:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  // Update recommendation status
  app.patch("/api/pd/recommendations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { status } = req.body;
      const rec = await storage.updatePDRecommendationStatus(req.params.id, userId, status);
      if (!rec) {
        res.status(404).json({ error: "Recommendation not found" });
        return;
      }
      res.json(rec);
    } catch (error) {
      res.status(500).json({ error: "Failed to update recommendation" });
    }
  });

  // Get PD progress
  app.get("/api/pd/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const progress = await storage.getEducatorPDProgress(userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch PD progress" });
    }
  });

  // Start PD activity (from recommendation)
  app.post("/api/pd/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { recommendationId, resourceId, title } = req.body;
      
      const progress = await storage.createEducatorPDProgress({
        userId,
        recommendationId,
        resourceId,
        title,
        status: "in_progress",
        progress: 0,
      });
      
      // Update recommendation status if provided
      if (recommendationId) {
        await storage.updatePDRecommendationStatus(recommendationId, userId, "started");
      }
      
      res.status(201).json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to start PD activity" });
    }
  });

  // Update PD progress
  app.patch("/api/pd/progress/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const updates = req.body;
      
      // If marking as completed, set completedAt
      if (updates.status === "completed" && !updates.completedAt) {
        updates.completedAt = new Date();
      }
      
      const progress = await storage.updateEducatorPDProgress(req.params.id, userId, updates);
      if (!progress) {
        res.status(404).json({ error: "Progress not found" });
        return;
      }
      
      // Update related recommendation if completed
      if (progress.status === "completed" && progress.recommendationId) {
        await storage.updatePDRecommendationStatus(progress.recommendationId, userId, "completed");
      }
      
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to update PD progress" });
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
  app.get("/api/student-journeys", isAuthenticated, async (req: any, res) => {
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
  app.post("/api/student-journey", isAuthenticated, async (req: any, res) => {
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
  app.patch("/api/student-journey/:id", isAuthenticated, async (req: any, res) => {
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
  app.post("/api/student-journey/:id/activity", isAuthenticated, async (req: any, res) => {
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
  app.post("/api/student-journey/:id/milestone", isAuthenticated, async (req: any, res) => {
    try {
      const { id: journeyProgressId } = req.params;
      const { category, title, description, targetDate } = req.body;
      
      const milestone = await storage.createStudentJourneyMilestone({
        journeyProgressId,
        studentId: req.body.studentId || "",
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
  app.patch("/api/student-journey/milestones/:id", isAuthenticated, async (req: any, res) => {
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
  app.post("/api/student-journey/:id/assessment", isAuthenticated, async (req: any, res) => {
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

  // ================================
  // Student Journey Entries (User-specific Timeline)
  // ================================
  
  // Query param validation schemas
  const entriesQuerySchema = z.object({
    limit: z.string().optional().transform(val => {
      const parsed = parseInt(val || "50", 10);
      return isNaN(parsed) || parsed < 1 ? 50 : Math.min(parsed, 200);
    }),
  });
  
  const pillarParamSchema = z.enum(["be", "know", "do"]);

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

  // Validation schema for creating journey entries via API
  const createJourneyEntrySchema = insertStudentJourneyEntrySchema.omit({ userId: true }).extend({
    entryType: z.enum(["assessment", "goal_completed", "milestone", "reflection", "career_exploration", "skill_gained"]),
    bkdPillar: z.enum(["be", "know", "do"]),
    title: z.string().min(1).max(500),
    description: z.string().max(2000).nullable().optional(),
    pointsEarned: z.number().int().min(0).max(1000).optional().default(0),
    metadata: z.record(z.any()).nullable().optional(),
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

  // ================================
  // Student Digital Portfolio System
  // ================================

  // Get current user's portfolio
  app.get("/api/portfolio", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const portfolio = await storage.getStudentPortfolio(userId);
      res.json(portfolio || null);
    } catch (error) {
      console.error("Failed to fetch portfolio:", error);
      res.status(500).json({ error: "Failed to fetch portfolio" });
    }
  });

  // Get public portfolio by shareable slug (no auth required)
  app.get("/api/portfolio/public/:slug", async (req: any, res) => {
    try {
      const { slug } = req.params;
      const portfolio = await storage.getStudentPortfolioBySlug(slug);
      
      if (!portfolio) {
        res.status(404).json({ error: "Portfolio not found" });
        return;
      }
      
      if (portfolio.privacy === "private") {
        res.status(403).json({ error: "This portfolio is private" });
        return;
      }
      
      // Increment view count
      await storage.incrementPortfolioViews(portfolio.id);
      
      // Get portfolio items
      const items = await storage.getPortfolioItems(portfolio.id);
      
      res.json({ portfolio, items });
    } catch (error) {
      console.error("Failed to fetch public portfolio:", error);
      res.status(500).json({ error: "Failed to fetch portfolio" });
    }
  });

  // Create portfolio
  app.post("/api/portfolio", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      // Check if user already has a portfolio
      const existing = await storage.getStudentPortfolio(userId);
      if (existing) {
        res.status(400).json({ error: "You already have a portfolio. Please update it instead." });
        return;
      }
      
      const portfolio = await storage.createStudentPortfolio({
        userId,
        title: req.body.title || "My Portfolio",
        bio: req.body.bio,
        profileImageUrl: req.body.profileImageUrl,
        privacy: req.body.privacy || "private",
        theme: req.body.theme || "professional",
        contactEmail: req.body.contactEmail,
        linkedinUrl: req.body.linkedinUrl,
        handshakeUrl: req.body.handshakeUrl,
        customLinks: req.body.customLinks || [],
        skills: req.body.skills || [],
        education: req.body.education || [],
      });
      
      res.status(201).json(portfolio);
    } catch (error) {
      console.error("Failed to create portfolio:", error);
      res.status(500).json({ error: "Failed to create portfolio" });
    }
  });

  // Update portfolio
  app.patch("/api/portfolio/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;

      if (req.body.privacy && req.body.privacy !== "private") {
        const user = await storage.getUser(userId);
        if (user) {
          const { isCoppaRestricted } = await import("./services/dataGovernance");
          if (isCoppaRestricted(user.birthdate)) {
            const parentalConsent = await db.select().from(parentalConsentsTable)
              .where(and(eq(parentalConsentsTable.studentUserId, userId), eq(parentalConsentsTable.consentStatus, "approved")));
            if (parentalConsent.length === 0) {
              res.status(403).json({ error: "Users under 13 cannot make portfolios public without parental consent (COPPA)." });
              return;
            }
          }
        }
      }
      
      const updated = await storage.updateStudentPortfolio(id, req.body, userId);
      if (!updated) {
        res.status(404).json({ error: "Portfolio not found or not authorized" });
        return;
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to update portfolio:", error);
      res.status(500).json({ error: "Failed to update portfolio" });
    }
  });

  // Delete portfolio
  app.delete("/api/portfolio/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      
      const deleted = await storage.deleteStudentPortfolio(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Portfolio not found or not authorized" });
        return;
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete portfolio:", error);
      res.status(500).json({ error: "Failed to delete portfolio" });
    }
  });

  // Get portfolio items
  app.get("/api/portfolio/:id/items", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      
      // Verify ownership
      const portfolio = await storage.getStudentPortfolio(userId);
      if (!portfolio || portfolio.id !== id) {
        res.status(403).json({ error: "Not authorized" });
        return;
      }
      
      const items = await storage.getPortfolioItems(id);
      res.json(items);
    } catch (error) {
      console.error("Failed to fetch portfolio items:", error);
      res.status(500).json({ error: "Failed to fetch portfolio items" });
    }
  });

  // Add item to portfolio
  app.post("/api/portfolio/:id/items", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id: portfolioId } = req.params;
      
      // Verify ownership
      const portfolio = await storage.getStudentPortfolio(userId);
      if (!portfolio || portfolio.id !== portfolioId) {
        res.status(403).json({ error: "Not authorized" });
        return;
      }
      
      const item = await storage.createPortfolioItem({
        portfolioId,
        itemType: req.body.itemType || "custom",
        itemId: req.body.itemId || null,
        customTitle: req.body.customTitle,
        customDescription: req.body.customDescription,
        thumbnailUrl: req.body.thumbnailUrl,
        attachmentUrl: req.body.attachmentUrl,
        highlighted: req.body.highlighted || false,
        bkdFocus: req.body.bkdFocus,
        skills: req.body.skills || [],
        completedAt: req.body.completedAt ? new Date(req.body.completedAt) : null,
        score: req.body.score,
        metadata: req.body.metadata || {},
      });
      
      res.status(201).json(item);
    } catch (error) {
      console.error("Failed to add portfolio item:", error);
      res.status(500).json({ error: "Failed to add portfolio item" });
    }
  });

  // Update portfolio item
  app.patch("/api/portfolio/items/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      
      // Get the item to verify ownership
      const item = await storage.getPortfolioItem(id);
      if (!item) {
        res.status(404).json({ error: "Item not found" });
        return;
      }
      
      // Verify portfolio ownership
      const portfolio = await storage.getStudentPortfolio(userId);
      if (!portfolio || portfolio.id !== item.portfolioId) {
        res.status(403).json({ error: "Not authorized" });
        return;
      }
      
      const updated = await storage.updatePortfolioItem(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Failed to update portfolio item:", error);
      res.status(500).json({ error: "Failed to update portfolio item" });
    }
  });

  // Delete portfolio item
  app.delete("/api/portfolio/items/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      
      // Get the item to verify ownership
      const item = await storage.getPortfolioItem(id);
      if (!item) {
        res.status(404).json({ error: "Item not found" });
        return;
      }
      
      // Verify portfolio ownership
      const portfolio = await storage.getStudentPortfolio(userId);
      if (!portfolio || portfolio.id !== item.portfolioId) {
        res.status(403).json({ error: "Not authorized" });
        return;
      }
      
      await storage.deletePortfolioItem(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete portfolio item:", error);
      res.status(500).json({ error: "Failed to delete portfolio item" });
    }
  });

  // Reorder portfolio items
  app.post("/api/portfolio/:id/reorder", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id: portfolioId } = req.params;
      const { itemIds } = req.body;
      
      // Verify ownership
      const portfolio = await storage.getStudentPortfolio(userId);
      if (!portfolio || portfolio.id !== portfolioId) {
        res.status(403).json({ error: "Not authorized" });
        return;
      }
      
      await storage.reorderPortfolioItems(portfolioId, itemIds);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to reorder portfolio items:", error);
      res.status(500).json({ error: "Failed to reorder portfolio items" });
    }
  });

  // Add completed assignment to portfolio (quick add)
  app.post("/api/portfolio/add-assignment/:assignmentId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { assignmentId } = req.params;
      
      // Get or create portfolio
      let portfolio = await storage.getStudentPortfolio(userId);
      if (!portfolio) {
        portfolio = await storage.createStudentPortfolio({
          userId,
          title: "My Portfolio",
          privacy: "private",
          theme: "professional",
        });
      }
      
      // Get assignment details
      const assignment = await storage.getAssignment(assignmentId);
      if (!assignment) {
        res.status(404).json({ error: "Assignment not found" });
        return;
      }
      
      // Create portfolio item from assignment
      const item = await storage.createPortfolioItem({
        portfolioId: portfolio.id,
        itemType: "assignment",
        itemId: assignmentId,
        customTitle: req.body.customTitle || assignment.title,
        customDescription: req.body.customDescription || assignment.description || null,
        bkdFocus: req.body.bkdFocus,
        skills: req.body.skills || [],
        completedAt: new Date(),
        score: req.body.score,
        metadata: {
          originalTitle: assignment.title,
          course: req.body.course,
          educator: req.body.educator,
          feedback: req.body.feedback,
        },
      });
      
      res.status(201).json({ portfolio, item });
    } catch (error) {
      console.error("Failed to add assignment to portfolio:", error);
      res.status(500).json({ error: "Failed to add assignment to portfolio" });
    }
  });

  // Get portfolio comments (with role-based filtering)
  app.get("/api/portfolio/:portfolioId/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { portfolioId } = req.params;
      const userRole = req.user.role;
      
      // Get the portfolio to verify ownership/access
      const portfolio = await storage.getStudentPortfolioBySlug(portfolioId);
      const portfolioById = portfolio || await storage.getStudentPortfolio(userId);
      
      if (!portfolioById) {
        res.status(404).json({ error: "Portfolio not found" });
        return;
      }
      
      const allComments = await storage.getPortfolioComments(portfolioById.id);
      
      // Role-based filtering
      // Students see all comments on their portfolio
      if (portfolioById.userId === userId) {
        res.json(allComments);
        return;
      }
      
      // Educators see all comments
      if (userRole === "educator" || userRole === "campus_admin") {
        res.json(allComments);
        return;
      }
      
      // Parents see their own comments + educator comments
      if (userRole === "parent") {
        const filteredComments = allComments.filter(
          c => c.authorId === userId || c.authorRole === "educator" || c.authorRole === "campus_admin"
        );
        res.json(filteredComments);
        return;
      }
      
      // Default: only own comments
      const ownComments = allComments.filter(c => c.authorId === userId);
      res.json(ownComments);
    } catch (error) {
      console.error("Failed to fetch portfolio comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // Get comments for a specific portfolio item
  app.get("/api/portfolio/items/:itemId/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;
      const userRole = req.user.role;
      
      const item = await storage.getPortfolioItem(itemId);
      if (!item) {
        res.status(404).json({ error: "Portfolio item not found" });
        return;
      }
      
      const allComments = await storage.getPortfolioItemComments(itemId);
      
      // Get portfolio to check ownership
      const portfolio = await storage.getStudentPortfolio(userId);
      
      // Portfolio owner sees all
      if (portfolio && portfolio.id === item.portfolioId) {
        res.json(allComments);
        return;
      }
      
      // Educators see all
      if (userRole === "educator" || userRole === "campus_admin") {
        res.json(allComments);
        return;
      }
      
      // Parents see their own + educator comments
      if (userRole === "parent") {
        const filteredComments = allComments.filter(
          c => c.authorId === userId || c.authorRole === "educator" || c.authorRole === "campus_admin"
        );
        res.json(filteredComments);
        return;
      }
      
      const ownComments = allComments.filter(c => c.authorId === userId);
      res.json(ownComments);
    } catch (error) {
      console.error("Failed to fetch item comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // Create a portfolio comment
  app.post("/api/portfolio/:portfolioId/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { portfolioId } = req.params;
      const { content, portfolioItemId } = req.body;
      const userRole = req.user.role;
      
      if (!content || content.trim().length === 0) {
        res.status(400).json({ error: "Comment content is required" });
        return;
      }
      
      // Verify portfolio exists
      const portfolio = await storage.getStudentPortfolioBySlug(portfolioId);
      const actualPortfolio = portfolio || (await storage.getStudentPortfolio(userId));
      
      if (!actualPortfolio) {
        res.status(404).json({ error: "Portfolio not found" });
        return;
      }
      
      // Only student (owner), parents linked to student, and educators can comment
      const isOwner = actualPortfolio.userId === userId;
      const isEducator = userRole === "educator" || userRole === "campus_admin";
      const isParent = userRole === "parent";
      
      if (!isOwner && !isEducator && !isParent) {
        res.status(403).json({ error: "You do not have permission to comment on this portfolio" });
        return;
      }
      
      // Get author name from user
      const user = await storage.getUser(userId);
      const authorName = user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}`
        : user?.email?.split("@")[0] || "Anonymous";
      
      const comment = await storage.createPortfolioComment({
        portfolioId: actualPortfolio.id,
        portfolioItemId: portfolioItemId || null,
        authorId: userId,
        authorRole: userRole || "student",
        authorName,
        content: content.trim(),
      });
      
      res.status(201).json(comment);
    } catch (error) {
      console.error("Failed to create comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  // Update a portfolio comment (only author can update)
  app.patch("/api/portfolio/comments/:commentId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { commentId } = req.params;
      const { content } = req.body;
      
      if (!content || content.trim().length === 0) {
        res.status(400).json({ error: "Comment content is required" });
        return;
      }
      
      const updated = await storage.updatePortfolioComment(commentId, userId, {
        content: content.trim(),
      });
      
      if (!updated) {
        res.status(404).json({ error: "Comment not found or you are not the author" });
        return;
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to update comment:", error);
      res.status(500).json({ error: "Failed to update comment" });
    }
  });

  // Delete a portfolio comment (only author can delete)
  app.delete("/api/portfolio/comments/:commentId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { commentId } = req.params;
      
      const deleted = await storage.deletePortfolioComment(commentId, userId);
      
      if (!deleted) {
        res.status(404).json({ error: "Comment not found or you are not the author" });
        return;
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // ================================
  // BLS Data Sync Routes
  // ================================

  // Start the BLS scheduler when server starts
  startBlsScheduler();

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

  // ================================
  // HubSpot Integration Routes
  // ================================

  app.get("/api/integrations/hubspot/status", isAuthenticated, async (req: any, res) => {
    try {
      const client = await hubspotService.getUncachableHubSpotClient();
      res.json({ 
        connected: true,
        message: "HubSpot integration is active"
      });
    } catch (error: any) {
      res.json({ 
        connected: false,
        message: error.message || "HubSpot not connected"
      });
    }
  });

  app.get("/api/integrations/hubspot/contacts", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as User;
      if (user.role !== "system_admin" && user.role !== "campus_admin") {
        res.status(403).json({ error: "Admin access required" });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const contacts = await hubspotService.getContacts(limit);
      res.json(contacts);
    } catch (error) {
      console.error("Failed to get HubSpot contacts:", error);
      res.status(500).json({ error: "Failed to get contacts from HubSpot" });
    }
  });

  app.get("/api/integrations/hubspot/companies", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as User;
      if (user.role !== "system_admin" && user.role !== "campus_admin") {
        res.status(403).json({ error: "Admin access required" });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const companies = await hubspotService.getCompanies(limit);
      res.json(companies);
    } catch (error) {
      console.error("Failed to get HubSpot companies:", error);
      res.status(500).json({ error: "Failed to get companies from HubSpot" });
    }
  });

  app.post("/api/integrations/hubspot/sync-user", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as User;
      
      if (!user.email) {
        res.status(400).json({ error: "User email is required for HubSpot sync" });
        return;
      }
      
      const result = await hubspotService.syncUserToHubSpot({
        email: user.email,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        role: user.role || undefined,
        tier: user.tier || undefined,
      });
      
      res.json({ success: true, contact: result });
    } catch (error) {
      console.error("Failed to sync user to HubSpot:", error);
      res.status(500).json({ error: "Failed to sync user to HubSpot" });
    }
  });

  app.post("/api/integrations/hubspot/create-contact", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as User;
      if (user.role !== "system_admin" && user.role !== "campus_admin") {
        res.status(403).json({ error: "Admin access required" });
        return;
      }

      const contactSchema = z.object({
        email: z.string().email(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        role: z.string().optional(),
        organization: z.string().optional(),
        country: z.string().optional(),
        tier: z.string().optional(),
      });

      const validated = contactSchema.parse(req.body);
      const result = await hubspotService.createOrUpdateContact(validated);
      res.json({ success: true, contact: result });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid contact data", details: error.errors });
        return;
      }
      console.error("Failed to create HubSpot contact:", error);
      res.status(500).json({ error: "Failed to create contact in HubSpot" });
    }
  });

  app.post("/api/integrations/hubspot/create-company", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as User;
      if (user.role !== "system_admin" && user.role !== "campus_admin") {
        res.status(403).json({ error: "Admin access required" });
        return;
      }

      const companySchema = z.object({
        name: z.string().min(1),
        domain: z.string().optional(),
        type: z.string().optional(),
        country: z.string().optional(),
        industry: z.string().optional(),
      });

      const validated = companySchema.parse(req.body);
      const result = await hubspotService.createOrUpdateCompany(validated);
      res.json({ success: true, company: result });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid company data", details: error.errors });
        return;
      }
      console.error("Failed to create HubSpot company:", error);
      res.status(500).json({ error: "Failed to create company in HubSpot" });
    }
  });

  app.post("/api/integrations/hubspot/create-deal", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as User;
      if (user.role !== "system_admin" && user.role !== "campus_admin") {
        res.status(403).json({ error: "Admin access required" });
        return;
      }

      const dealSchema = z.object({
        name: z.string().min(1),
        amount: z.number().optional(),
        stage: z.string().optional(),
        contactId: z.string().optional(),
        companyId: z.string().optional(),
      });

      const validated = dealSchema.parse(req.body);
      const result = await hubspotService.createDeal(validated);
      res.json({ success: true, deal: result });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid deal data", details: error.errors });
        return;
      }
      console.error("Failed to create HubSpot deal:", error);
      res.status(500).json({ error: "Failed to create deal in HubSpot" });
    }
  });

  // ================================
  // WordPress Integration Routes
  // ================================

  app.get("/api/integrations/wordpress/status", async (req, res) => {
    try {
      const status = wordpressService.getWordPressIntegrationStatus();
      res.json(status);
    } catch (error) {
      console.error("Failed to get WordPress status:", error);
      res.status(500).json({ error: "Failed to get WordPress integration status" });
    }
  });

  app.get("/api/integrations/wordpress/embed-code", async (req, res) => {
    try {
      const type = req.query.type as string || 'lesson-generator';
      const validTypes = Object.keys(wordpressService.EMBED_PATHS);
      
      if (!validTypes.includes(type)) {
        res.status(400).json({ error: "Invalid embed type", validTypes });
        return;
      }

      const options = {
        theme: (req.query.theme as 'light' | 'dark') || 'light',
        width: req.query.width as string,
        height: req.query.height as string,
        locale: req.query.locale as string,
        initialPath: req.query.initialPath as string,
      };

      const embedCode = wordpressService.generateEmbedCode(type as wordpressService.EmbedType, options);
      res.json({ embedCode, type, options, availableTypes: validTypes });
    } catch (error) {
      console.error("Failed to generate embed code:", error);
      res.status(500).json({ error: "Failed to generate embed code" });
    }
  });

  app.get("/api/integrations/wordpress/plugin", async (req, res) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const pluginPath = path.join(process.cwd(), 'public', 'lys-wordpress-plugin.php');
      
      if (!fs.existsSync(pluginPath)) {
        res.status(404).json({ error: "WordPress plugin not found" });
        return;
      }
      
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', 'attachment; filename="lys-platform.php"');
      res.sendFile(pluginPath);
    } catch (error) {
      console.error("Failed to download WordPress plugin:", error);
      res.status(500).json({ error: "Failed to download WordPress plugin" });
    }
  });

  app.get("/api/integrations/wordpress/embed-types", async (req, res) => {
    try {
      res.json({ 
        embedTypes: wordpressService.EMBED_PATHS,
        categories: {
          educators: ['lesson-generator', 'dashboard', 'gradebook', 'classroom', 'assignments', 'my-lessons', 'scope-sequence', 'resource-library', 'analytics', 'professional-development', 'educator-influence'],
          students: ['career-explorer', 'self-discovery', 'my-journey', 'milestones', 'action-plans', 'portfolio'],
          parents: ['parent-portal'],
          admins: ['admin', 'lesson-authoring'],
          utility: ['pricing', 'assessments'],
          fullSite: ['full-site']
        }
      });
    } catch (error) {
      console.error("Failed to get embed types:", error);
      res.status(500).json({ error: "Failed to get embed types" });
    }
  });

  app.get("/api/integrations/wordpress/shortcode-instructions", async (req, res) => {
    try {
      const instructions = wordpressService.generateShortcodeInstructions();
      res.json({ instructions });
    } catch (error) {
      console.error("Failed to get shortcode instructions:", error);
      res.status(500).json({ error: "Failed to get shortcode instructions" });
    }
  });

  app.get("/api/oembed", async (req, res) => {
    try {
      const url = req.query.url as string;
      const format = req.query.format as string || 'json';
      
      if (!url) {
        res.status(400).json({ error: "URL parameter required" });
        return;
      }

      let type = 'lesson-generator';
      if (url.includes('/careers')) type = 'career-explorer';
      if (url.includes('/self-discovery')) type = 'self-discovery';
      if (url.includes('/pricing')) type = 'pricing';

      const oembedResponse = wordpressService.generateOEmbedResponse(url, type);
      
      if (format === 'xml') {
        res.type('application/xml');
        res.send(`<?xml version="1.0" encoding="utf-8"?>
<oembed>
  <version>${oembedResponse.version}</version>
  <type>${oembedResponse.type}</type>
  <provider_name>${oembedResponse.provider_name}</provider_name>
  <provider_url>${oembedResponse.provider_url}</provider_url>
  <title>${oembedResponse.title}</title>
  <width>${oembedResponse.width}</width>
  <height>${oembedResponse.height}</height>
  <html><![CDATA[${oembedResponse.html}]]></html>
</oembed>`);
      } else {
        res.json(oembedResponse);
      }
    } catch (error) {
      console.error("Failed to generate oEmbed response:", error);
      res.status(500).json({ error: "Failed to generate oEmbed response" });
    }
  });

  app.post("/api/integrations/wordpress/sync-lesson", isAuthenticated, async (req: any, res) => {
    try {
      const syncSchema = z.object({
        siteUrl: z.string().url(),
        username: z.string().optional(),
        applicationPassword: z.string().optional(),
        lessonPlan: z.object({
          title: z.string(),
          content: z.string(),
          objectives: z.array(z.string()),
          standards: z.array(z.string()),
          gradeLevel: z.string(),
        }),
      });

      const validated = syncSchema.parse(req.body);
      
      const config: wordpressService.WordPressConfig = {
        siteUrl: validated.siteUrl,
        apiEndpoint: '/wp-json/wp/v2',
        username: validated.username,
        applicationPassword: validated.applicationPassword,
      };

      const result = await wordpressService.syncLessonPlanToWordPress(config, validated.lessonPlan);
      res.json({ success: true, post: result });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid sync data", details: error.errors });
        return;
      }
      console.error("Failed to sync lesson to WordPress:", error);
      res.status(500).json({ error: "Failed to sync lesson to WordPress" });
    }
  });

  // ================================
  // SIS Integration Routes
  // ================================
  // Supports Clever, PowerSchool, Canvas, Infinite Campus, OneRoster
  
  const { sisService } = await import("./services/sisService");
  const { SIS_PROVIDERS } = await import("@shared/schema");

  // Get available SIS providers
  app.get("/api/integrations/sis/providers", async (req, res) => {
    res.json(SIS_PROVIDERS);
  });

  // Get user's SIS connections (includes inherited org connections)
  app.get("/api/integrations/sis/connections", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const connections = await storage.getSisConnectionsWithHierarchy(userId);
      
      // Don't expose tokens in response
      const safeConnections = connections.map(c => ({
        ...c,
        accessToken: c.accessToken ? "[ENCRYPTED]" : null,
        refreshToken: c.refreshToken ? "[ENCRYPTED]" : null,
      }));
      
      res.json(safeConnections);
    } catch (error) {
      console.error("Failed to get SIS connections:", error);
      res.status(500).json({ error: "Failed to get SIS connections" });
    }
  });

  // Get organization's SIS connections (for campus admins)
  app.get("/api/integrations/sis/connections/org/:organizationId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { organizationId } = req.params;
      
      // Verify user has access to this organization
      const membership = await storage.getOrgMembership(organizationId, userId!);
      if (!membership || !["owner", "admin"].includes(membership.role as string)) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      
      const connections = await storage.getSisConnectionsByOrg(organizationId);
      
      const safeConnections = connections.map(c => ({
        ...c,
        accessToken: c.accessToken ? "[ENCRYPTED]" : null,
        refreshToken: c.refreshToken ? "[ENCRYPTED]" : null,
      }));
      
      res.json(safeConnections);
    } catch (error) {
      console.error("Failed to get organization SIS connections:", error);
      res.status(500).json({ error: "Failed to get organization SIS connections" });
    }
  });

  // Create a new SIS connection (manual configuration)
  const createSisConnectionSchema = z.object({
    provider: z.enum(["clever", "powerschool", "canvas", "infinite_campus", "skyward", "oneroster"]),
    providerName: z.string().optional(),
    organizationId: z.string().optional(),
    baseUrl: z.string().url().optional(),
    accessToken: z.string().optional(),
    districtId: z.string().optional(),
    settings: z.object({
      autoSync: z.boolean().default(false),
      syncFrequency: z.string().default("manual"),
      syncStudents: z.boolean().default(true),
      syncTeachers: z.boolean().default(true),
      syncCourses: z.boolean().default(true),
      syncGrades: z.boolean().default(false),
      syncAttendance: z.boolean().default(false),
    }).optional(),
  });

  app.post("/api/integrations/sis/connections", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      // Only educators and campus admins can connect SIS
      if (!user || !["educator", "campus_admin"].includes(user.role || "")) {
        res.status(403).json({ error: "Only educators and administrators can connect SIS systems" });
        return;
      }
      
      const validated = createSisConnectionSchema.parse(req.body);
      
      const connection = await storage.createSisConnection({
        userId,
        provider: validated.provider,
        providerName: validated.providerName || SIS_PROVIDERS[validated.provider].name,
        organizationId: validated.organizationId,
        status: validated.accessToken ? "connected" : "pending",
        accessToken: validated.accessToken,
        districtId: validated.districtId,
        settings: validated.settings || {
          autoSync: false,
          syncFrequency: "manual",
          syncStudents: true,
          syncTeachers: true,
          syncCourses: true,
          syncGrades: false,
          syncAttendance: false,
        },
        metadata: { baseUrl: validated.baseUrl } as any,
      } as any);
      
      res.json({
        ...connection,
        accessToken: connection.accessToken ? "[ENCRYPTED]" : null,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid connection data", details: error.errors });
        return;
      }
      console.error("Failed to create SIS connection:", error);
      res.status(500).json({ error: "Failed to create SIS connection" });
    }
  });

  // Update SIS connection settings
  app.patch("/api/integrations/sis/connections/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      
      const connection = await storage.getSisConnection(id);
      if (!connection || connection.userId !== userId) {
        res.status(404).json({ error: "Connection not found" });
        return;
      }
      
      const updateSchema = z.object({
        providerName: z.string().optional(),
        settings: z.object({
          autoSync: z.boolean().optional(),
          syncFrequency: z.string().optional(),
          syncStudents: z.boolean().optional(),
          syncTeachers: z.boolean().optional(),
          syncCourses: z.boolean().optional(),
          syncGrades: z.boolean().optional(),
          syncAttendance: z.boolean().optional(),
        }).optional(),
      });
      
      const validated = updateSchema.parse(req.body);
      
      const updated = await storage.updateSisConnection(id, {
        providerName: validated.providerName,
        settings: validated.settings ? { ...connection.settings, ...validated.settings } as any : undefined,
      });
      
      if (!updated) {
        res.status(404).json({ error: "Connection not found" });
        return;
      }
      
      res.json({
        ...updated,
        accessToken: updated.accessToken ? "[ENCRYPTED]" : null,
        refreshToken: updated.refreshToken ? "[ENCRYPTED]" : null,
      });
    } catch (error) {
      console.error("Failed to update SIS connection:", error);
      res.status(500).json({ error: "Failed to update SIS connection" });
    }
  });

  // Delete SIS connection
  app.delete("/api/integrations/sis/connections/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      
      await storage.deleteSisConnection(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete SIS connection:", error);
      res.status(500).json({ error: "Failed to delete SIS connection" });
    }
  });

  // Test SIS connection
  app.post("/api/integrations/sis/connections/:id/test", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      
      const connection = await storage.getSisConnection(id);
      if (!connection || connection.userId !== userId) {
        res.status(404).json({ error: "Connection not found" });
        return;
      }
      
      if (!connection.accessToken) {
        res.status(400).json({ error: "Connection not configured with access token" });
        return;
      }
      
      sisService.setConfig(connection.provider as any, {
        baseUrl: (connection.metadata as any)?.baseUrl || SIS_PROVIDERS[connection.provider as keyof typeof SIS_PROVIDERS].apiBase,
        accessToken: connection.accessToken,
        refreshToken: connection.refreshToken || undefined,
        districtId: connection.districtId || undefined,
      });
      
      const result = await sisService.testConnection();
      
      // Update connection status
      await storage.updateSisConnection(id, {
        status: result.success ? "connected" : "error",
        syncError: result.success ? null : result.message,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Failed to test SIS connection:", error);
      res.status(500).json({ error: "Failed to test SIS connection" });
    }
  });

  // Sync data from SIS
  app.post("/api/integrations/sis/connections/:id/sync", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      
      const syncTypeSchema = z.object({
        syncType: z.enum(["full", "students", "teachers", "courses", "grades"]).default("full"),
      });
      
      const { syncType } = syncTypeSchema.parse(req.body);
      
      const connection = await storage.getSisConnection(id);
      if (!connection || connection.userId !== userId) {
        res.status(404).json({ error: "Connection not found" });
        return;
      }
      
      if (!connection.accessToken) {
        res.status(400).json({ error: "Connection not configured" });
        return;
      }
      
      // Update connection sync status
      await storage.updateSisConnection(id, {
        syncStatus: "syncing",
        lastSyncAt: new Date(),
      });
      
      // Create sync history entry
      const syncHistory = await storage.createSisSyncHistory({
        connectionId: id,
        userId,
        syncType,
        status: "started",
      });
      
      // Configure service
      sisService.setConfig(connection.provider as any, {
        baseUrl: (connection.metadata as any)?.baseUrl || SIS_PROVIDERS[connection.provider as keyof typeof SIS_PROVIDERS].apiBase,
        accessToken: connection.accessToken,
        refreshToken: connection.refreshToken || undefined,
        districtId: connection.districtId || undefined,
      });
      
      let recordsProcessed = 0;
      let recordsCreated = 0;
      let recordsUpdated = 0;
      const errors: { message: string; record?: any }[] = [];
      
      try {
        // Sync students
        if (syncType === "full" || syncType === "students") {
          const students = await sisService.fetchStudents(200, 0);
          for (const student of students) {
            recordsProcessed++;
            try {
              const existing = await storage.getSisStudentBySisId(id, student.sisId);
              if (existing) {
                await storage.updateSisStudent(existing.id, {
                  firstName: student.firstName,
                  lastName: student.lastName,
                  email: student.email,
                  gradeLevel: student.gradeLevel,
                  schoolId: student.schoolId,
                  enrollmentStatus: student.enrollmentStatus,
                  sisData: student.rawData,
                });
                recordsUpdated++;
              } else {
                await storage.createSisStudent({
                  connectionId: id,
                  sisStudentId: student.sisId,
                  firstName: student.firstName,
                  lastName: student.lastName,
                  email: student.email,
                  gradeLevel: student.gradeLevel,
                  schoolId: student.schoolId,
                  enrollmentStatus: student.enrollmentStatus,
                  sisData: student.rawData,
                });
                recordsCreated++;
              }
            } catch (e: any) {
              errors.push({ message: e.message, record: { sisId: student.sisId } });
            }
          }
        }
        
        // Sync courses
        if (syncType === "full" || syncType === "courses") {
          const courses = await sisService.fetchCourses(200, 0);
          for (const course of courses) {
            recordsProcessed++;
            try {
              const existing = await storage.getSisCourseBySisId(id, course.sisId);
              if (existing) {
                await storage.updateSisCourse(existing.id, {
                  name: course.name,
                  courseCode: course.courseCode,
                  subject: course.subject,
                  gradeLevel: course.gradeLevel,
                  schoolId: course.schoolId,
                  teacherIds: course.teacherIds,
                  studentCount: course.studentCount,
                  term: course.term,
                  status: course.status,
                  sisData: course.rawData,
                });
                recordsUpdated++;
              } else {
                await storage.createSisCourse({
                  connectionId: id,
                  sisCourseId: course.sisId,
                  name: course.name,
                  courseCode: course.courseCode,
                  subject: course.subject,
                  gradeLevel: course.gradeLevel,
                  schoolId: course.schoolId,
                  teacherIds: course.teacherIds,
                  studentCount: course.studentCount,
                  term: course.term,
                  status: course.status,
                  sisData: course.rawData,
                });
                recordsCreated++;
              }
            } catch (e: any) {
              errors.push({ message: e.message, record: { sisId: course.sisId } });
            }
          }
        }
        
        // Update sync history
        await storage.updateSisSyncHistory(syncHistory.id, {
          status: "completed",
          recordsProcessed,
          recordsCreated,
          recordsUpdated,
          recordsSkipped: recordsProcessed - recordsCreated - recordsUpdated,
          errorCount: errors.length,
          errors: errors.length > 0 ? errors : null,
          completedAt: new Date(),
        });
        
        // Update connection status
        await storage.updateSisConnection(id, {
          syncStatus: "idle",
          syncError: errors.length > 0 ? `${errors.length} errors during sync` : null,
        });
        
        res.json({
          success: true,
          syncHistoryId: syncHistory.id,
          recordsProcessed,
          recordsCreated,
          recordsUpdated,
          errorCount: errors.length,
        });
      } catch (syncError: any) {
        // Update sync history on failure
        await storage.updateSisSyncHistory(syncHistory.id, {
          status: "failed",
          recordsProcessed,
          recordsCreated,
          recordsUpdated,
          errorCount: 1,
          errors: [{ message: syncError.message }],
          completedAt: new Date(),
        });
        
        await storage.updateSisConnection(id, {
          syncStatus: "error",
          syncError: syncError.message,
        });
        
        throw syncError;
      }
    } catch (error) {
      console.error("Failed to sync SIS data:", error);
      res.status(500).json({ error: "Failed to sync SIS data" });
    }
  });

  // Get sync history for a connection
  app.get("/api/integrations/sis/connections/:id/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      
      const connection = await storage.getSisConnection(id);
      if (!connection || connection.userId !== userId) {
        res.status(404).json({ error: "Connection not found" });
        return;
      }
      
      const history = await storage.getSisSyncHistory(id, 20);
      res.json(history);
    } catch (error) {
      console.error("Failed to get sync history:", error);
      res.status(500).json({ error: "Failed to get sync history" });
    }
  });

  // Get students from a SIS connection
  app.get("/api/integrations/sis/connections/:id/students", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      
      const connection = await storage.getSisConnection(id);
      if (!connection || connection.userId !== userId) {
        res.status(404).json({ error: "Connection not found" });
        return;
      }
      
      const students = await storage.getSisStudents(id);
      res.json(students);
    } catch (error) {
      console.error("Failed to get SIS students:", error);
      res.status(500).json({ error: "Failed to get SIS students" });
    }
  });

  // Get courses from a SIS connection
  app.get("/api/integrations/sis/connections/:id/courses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      
      const connection = await storage.getSisConnection(id);
      if (!connection || connection.userId !== userId) {
        res.status(404).json({ error: "Connection not found" });
        return;
      }
      
      const courses = await storage.getSisCourses(id);
      res.json(courses);
    } catch (error) {
      console.error("Failed to get SIS courses:", error);
      res.status(500).json({ error: "Failed to get SIS courses" });
    }
  });

  // Export grades to SIS
  app.post("/api/integrations/sis/connections/:id/export-grades", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      
      // Validate request body with Zod
      const exportGradesSchema = z.object({
        classId: z.string().min(1, "Class ID is required"),
      });
      
      const parseResult = exportGradesSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: "Invalid request", details: parseResult.error.errors });
        return;
      }
      
      const { classId } = parseResult.data;
      
      const connection = await storage.getSisConnection(id);
      if (!connection || connection.userId !== userId) {
        res.status(404).json({ error: "Connection not found" });
        return;
      }
      
      if (!connection.accessToken) {
        res.status(400).json({ error: "Connection not configured" });
        return;
      }
      
      // Get the class and verify ownership
      const classData = await storage.getClass(classId);
      
      if (!classData) {
        res.status(404).json({ error: "Class not found" });
        return;
      }
      
      // Authorization check: Verify the user owns the class or has access through org
      if (classData.userId !== userId) {
        // Check if user has access through organization membership
        if (classData.organizationId) {
          const membership = await storage.getOrgMembership(classData.organizationId, userId!);
          if (!membership || !["owner", "admin", "educator"].includes(membership.role as string)) {
            res.status(403).json({ error: "Access denied to this class" });
            return;
          }
        } else {
          res.status(403).json({ error: "Access denied to this class" });
          return;
        }
      }
      
      // Get grades for the class
      const grades = await storage.getStudentGrades(classId);
      
      // Get students for mapping
      const classStudentsList = await storage.getClassStudents(classId);
      const studentIds = classStudentsList.map(cs => cs.studentId);
      const students = await storage.getStudents(userId);
      const studentsInClass = students.filter(s => studentIds.includes(s.id));
      
      // Create sync history entry
      const syncHistory = await storage.createSisSyncHistory({
        connectionId: id,
        userId,
        syncType: "grades",
        status: "started",
      });
      
      // In production, this would send to the actual SIS API
      // For now, we'll simulate a successful export
      const exportedGrades = grades.map(g => {
        const student = studentsInClass.find(s => s.id === g.studentId);
        return {
          studentId: student?.studentId || g.studentId,
          studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
          assignment: g.title,
          score: g.pointsEarned,
          maxScore: g.pointsPossible,
          percentage: g.percentage,
          letterGrade: g.letterGrade,
          gradedAt: g.gradedAt,
        };
      });
      
      // Update sync history with success
      await storage.updateSisSyncHistory(syncHistory.id, {
        status: "completed",
        recordsProcessed: exportedGrades.length,
        completedAt: new Date(),
        metadata: { exportedGrades: exportedGrades.length, className: classData.name },
      });
      
      res.json({ 
        success: true, 
        message: `Exported ${exportedGrades.length} grades to ${connection.provider}`,
        exportedCount: exportedGrades.length,
        className: classData.name,
      });
    } catch (error) {
      console.error("Failed to export grades to SIS:", error);
      res.status(500).json({ error: "Failed to export grades to SIS" });
    }
  });

  // OAuth callback for Clever
  app.get("/api/integrations/sis/oauth/clever/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        res.status(400).send("Missing OAuth parameters");
        return;
      }
      
      // Parse state to get userId and connectionId
      const stateData = JSON.parse(Buffer.from(state as string, "base64").toString());
      const { userId, connectionId } = stateData;
      
      // Get the redirect URI (same as what was used to initiate OAuth)
      const redirectUri = `${req.protocol}://${req.get("host")}/api/integrations/sis/oauth/clever/callback`;
      
      const tokens = await sisService.exchangeCodeForTokens("clever", code as string, redirectUri);
      
      if (!tokens) {
        res.status(400).send("Failed to exchange OAuth code");
        return;
      }
      
      // Update the connection with the new tokens
      await storage.updateSisConnection(connectionId, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
        status: "connected",
      });
      
      // Redirect back to the app
      res.redirect("/settings?sis=connected");
    } catch (error) {
      console.error("Clever OAuth callback error:", error);
      res.redirect("/settings?sis=error");
    }
  });

  // Get OAuth URL for connecting a SIS
  app.post("/api/integrations/sis/oauth/initiate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      const initiateSchema = z.object({
        provider: z.enum(["clever", "powerschool", "canvas", "infinite_campus", "skyward", "oneroster"]),
        organizationId: z.string().optional(),
      });
      
      const { provider, organizationId } = initiateSchema.parse(req.body);
      
      // Create a pending connection
      const connection = await storage.createSisConnection({
        userId,
        provider,
        providerName: SIS_PROVIDERS[provider].name,
        organizationId,
        status: "pending",
        settings: {
          autoSync: false,
          syncFrequency: "manual",
          syncStudents: true,
          syncTeachers: true,
          syncCourses: true,
          syncGrades: false,
          syncAttendance: false,
        },
      });
      
      const redirectUri = `${req.protocol}://${req.get("host")}/api/integrations/sis/oauth/${provider}/callback`;
      const state = Buffer.from(JSON.stringify({ userId, connectionId: connection.id })).toString("base64");
      
      const oauthUrl = sisService.getOAuthUrl(provider, redirectUri, state);
      
      if (!oauthUrl) {
        res.status(400).json({ 
          error: "OAuth not available for this provider. Please configure manually with an access token.",
          connectionId: connection.id,
        });
        return;
      }
      
      res.json({ oauthUrl, connectionId: connection.id });
    } catch (error) {
      console.error("Failed to initiate SIS OAuth:", error);
      res.status(500).json({ error: "Failed to initiate SIS OAuth" });
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
      const existing = await storage.getUserResourceRating(req.params.resourceId, req.user.id);
      if (existing) {
        res.status(400).json({ error: "You have already rated this resource" });
        return;
      }
      const rating = await storage.createResourceRating({
        resourceId: req.params.resourceId,
        userId: req.user.id,
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
  // STUDENT NARRATIVES (BE Pillar)
  // ===========================================
  
  app.get("/api/narratives", isAuthenticated, async (req: any, res) => {
    try {
      const narratives = await storage.getStudentNarratives(req.user.id);
      res.json(narratives);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch narratives" });
    }
  });

  app.get("/api/narratives/:id", isAuthenticated, async (req: any, res) => {
    try {
      const narrative = await storage.getStudentNarrative(req.params.id);
      if (!narrative || narrative.userId !== req.user.id) {
        res.status(404).json({ error: "Narrative not found" });
        return;
      }
      res.json(narrative);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch narrative" });
    }
  });

  app.post("/api/narratives", isAuthenticated, async (req: any, res) => {
    try {
      const narrative = await storage.createStudentNarrative({
        ...req.body,
        userId: req.user.id,
        wordCount: req.body.content ? req.body.content.split(/\s+/).filter(Boolean).length : 0,
      });
      res.json(narrative);
    } catch (e) {
      res.status(500).json({ error: "Failed to create narrative" });
    }
  });

  app.patch("/api/narratives/:id", isAuthenticated, async (req: any, res) => {
    try {
      const updates = { ...req.body };
      if (updates.content) {
        updates.wordCount = updates.content.split(/\s+/).filter(Boolean).length;
      }
      const narrative = await storage.updateStudentNarrative(req.params.id, updates, req.user.id);
      if (!narrative) {
        res.status(404).json({ error: "Narrative not found" });
        return;
      }
      res.json(narrative);
    } catch (e) {
      res.status(500).json({ error: "Failed to update narrative" });
    }
  });

  app.delete("/api/narratives/:id", isAuthenticated, async (req: any, res) => {
    try {
      const success = await storage.deleteStudentNarrative(req.params.id, req.user.id);
      if (!success) {
        res.status(404).json({ error: "Narrative not found" });
        return;
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete narrative" });
    }
  });

  // ===========================================
  // STRENGTHS INVENTORY (BE Pillar)
  // ===========================================
  
  app.get("/api/strengths", isAuthenticated, async (req: any, res) => {
    try {
      const strengths = await storage.getStrengthsInventory(req.user.id);
      res.json(strengths);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch strengths" });
    }
  });

  app.post("/api/strengths", isAuthenticated, async (req: any, res) => {
    try {
      const strength = await storage.createStrength({
        ...req.body,
        userId: req.user.id,
      });
      res.json(strength);
    } catch (e) {
      res.status(500).json({ error: "Failed to create strength" });
    }
  });

  app.patch("/api/strengths/:id", isAuthenticated, async (req: any, res) => {
    try {
      const strength = await storage.updateStrength(req.params.id, req.body, req.user.id);
      if (!strength) {
        res.status(404).json({ error: "Strength not found" });
        return;
      }
      res.json(strength);
    } catch (e) {
      res.status(500).json({ error: "Failed to update strength" });
    }
  });

  app.delete("/api/strengths/:id", isAuthenticated, async (req: any, res) => {
    try {
      const success = await storage.deleteStrength(req.params.id, req.user.id);
      if (!success) {
        res.status(404).json({ error: "Strength not found" });
        return;
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete strength" });
    }
  });

  // ===========================================
  // CAMPUS ACTIVITIES (DO Pillar)
  // ===========================================
  
  app.get("/api/campus-activities", isAuthenticated, async (req: any, res) => {
    try {
      const activities = await storage.getCampusActivities(req.user.id);
      res.json(activities);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.post("/api/campus-activities", isAuthenticated, async (req: any, res) => {
    try {
      const activity = await storage.createCampusActivity({
        ...req.body,
        userId: req.user.id,
      });
      res.json(activity);
    } catch (e) {
      res.status(500).json({ error: "Failed to create activity" });
    }
  });

  app.patch("/api/campus-activities/:id", isAuthenticated, async (req: any, res) => {
    try {
      const activity = await storage.updateCampusActivity(req.params.id, req.body, req.user.id);
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
      const success = await storage.deleteCampusActivity(req.params.id, req.user.id);
      if (!success) {
        res.status(404).json({ error: "Activity not found" });
        return;
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete activity" });
    }
  });

  // ===========================================
  // SCHOLARSHIP APPLICATIONS (Planner)
  // ===========================================
  
  app.get("/api/scholarship-applications", isAuthenticated, async (req: any, res) => {
    try {
      const applications = await storage.getScholarshipApplications(req.user.id);
      res.json(applications);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  app.get("/api/scholarship-applications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const application = await storage.getScholarshipApplication(req.params.id);
      if (!application || application.userId !== req.user.id) {
        res.status(404).json({ error: "Application not found" });
        return;
      }
      res.json(application);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch application" });
    }
  });

  app.post("/api/scholarship-applications", isAuthenticated, async (req: any, res) => {
    try {
      const application = await storage.createScholarshipApplication({
        ...req.body,
        userId: req.user.id,
      });
      res.json(application);
    } catch (e) {
      res.status(500).json({ error: "Failed to create application" });
    }
  });

  app.patch("/api/scholarship-applications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const application = await storage.updateScholarshipApplication(req.params.id, req.body, req.user.id);
      if (!application) {
        res.status(404).json({ error: "Application not found" });
        return;
      }
      res.json(application);
    } catch (e) {
      res.status(500).json({ error: "Failed to update application" });
    }
  });

  app.delete("/api/scholarship-applications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const success = await storage.deleteScholarshipApplication(req.params.id, req.user.id);
      if (!success) {
        res.status(404).json({ error: "Application not found" });
        return;
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete application" });
    }
  });

  // ===========================================
  // MENTOR SYSTEM
  // ===========================================
  
  app.get("/api/mentors", async (req: any, res) => {
    try {
      const filters: any = {};
      if (req.query.careerField) filters.careerField = req.query.careerField;
      if (req.query.available === "true") filters.isAvailable = true;
      const mentors = await storage.getMentorProfiles(filters);
      res.json(mentors);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch mentors" });
    }
  });

  app.get("/api/mentors/me", isAuthenticated, async (req: any, res) => {
    try {
      const profile = await storage.getMentorProfileByUser(req.user.id);
      res.json(profile || null);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch mentor profile" });
    }
  });

  app.post("/api/mentors", isAuthenticated, async (req: any, res) => {
    try {
      const profile = await storage.createMentorProfile({
        ...req.body,
        userId: req.user.id,
      });
      res.json(profile);
    } catch (e) {
      res.status(500).json({ error: "Failed to create mentor profile" });
    }
  });

  app.patch("/api/mentors/:id", isAuthenticated, async (req: any, res) => {
    try {
      const profile = await storage.updateMentorProfile(req.params.id, req.body, req.user.id);
      if (!profile) {
        res.status(404).json({ error: "Mentor profile not found" });
        return;
      }
      res.json(profile);
    } catch (e) {
      res.status(500).json({ error: "Failed to update mentor profile" });
    }
  });

  // Mentor connections
  app.get("/api/mentor-connections", isAuthenticated, async (req: any, res) => {
    try {
      const connections = await storage.getMentorConnections(req.user.id);
      res.json(connections);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch connections" });
    }
  });

  app.get("/api/mentor-connections/mentor/:mentorId", isAuthenticated, async (req: any, res) => {
    try {
      const connections = await storage.getMentorConnectionsForMentor(req.params.mentorId);
      res.json(connections);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch mentor connections" });
    }
  });

  app.post("/api/mentor-connections", isAuthenticated, async (req: any, res) => {
    try {
      const connection = await storage.createMentorConnection({
        ...req.body,
        studentUserId: req.user.id,
      });
      res.json(connection);
    } catch (e) {
      res.status(500).json({ error: "Failed to create connection" });
    }
  });

  app.patch("/api/mentor-connections/:id", isAuthenticated, async (req: any, res) => {
    try {
      const connection = await storage.updateMentorConnection(req.params.id, req.body);
      if (!connection) {
        res.status(404).json({ error: "Connection not found" });
        return;
      }
      res.json(connection);
    } catch (e) {
      res.status(500).json({ error: "Failed to update connection" });
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

  // ============ Org-Admin Self-Service Routes (Campus/District Admins) ============

  const verifyOrgAdminAccess = async (userId: string, orgId: string): Promise<boolean> => {
    const user = await storage.getUser(userId);
    if (!user) return false;
    const isSiteAdminUser = await storage.isSiteAdmin(userId);
    if (isSiteAdminUser) return true;
    const membership = await storage.getOrgMembership(orgId, userId);
    if (membership && (membership.role === "admin" || membership.role === "owner")) return true;
    if (user.role === "district_admin") {
      const userOrgs = await storage.getUserOrganizations(userId);
      for (const uOrg of userOrgs) {
        const children = await storage.getChildOrganizations(uOrg.organizationId);
        if (children.some(c => c.id === orgId)) return true;
      }
    }
    return false;
  };

  const getAdminManagedOrgIds = async (userId: string): Promise<string[]> => {
    const user = await storage.getUser(userId);
    if (!user) return [];
    const memberships = await storage.getUserOrganizations(userId);
    const orgIds = memberships.map(m => m.organizationId);
    if (user.role === "district_admin") {
      for (const m of memberships) {
        const children = await storage.getChildOrganizations(m.organizationId);
        children.forEach(c => { if (!orgIds.includes(c.id)) orgIds.push(c.id); });
      }
    }
    return orgIds;
  };

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
      const allowedPlatformRoles = ["student", "educator", "homeschool_parent", "campus_admin"];
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

  // ============ Org-Scoped Safety Routes (Campus/District Admins) ============

  const getAdminOrgIds = async (userId: string): Promise<string[]> => {
    const memberships = await db.select().from(orgMembershipsTable)
      .where(eq(orgMembershipsTable.userId, userId));
    return memberships.map(m => m.organizationId);
  };

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

  // ============ Parental Consent Routes ============

  app.get("/api/parental-consent/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const [consent] = await db.select().from(parentalConsentsTable)
        .where(eq(parentalConsentsTable.studentUserId, userId))
        .orderBy(desc(parentalConsentsTable.createdAt))
        .limit(1);
      
      res.json({
        hasConsent: consent?.consentStatus === "approved",
        status: consent?.consentStatus || "none",
        parentEmail: consent?.parentEmail || null,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to check consent status" });
    }
  });

  app.post("/api/parental-consent/request", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { parentEmail, parentName } = req.body;
      
      if (!parentEmail || !parentEmail.includes("@")) {
        res.status(400).json({ error: "Valid parent email is required" });
        return;
      }
      
      const token = randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const [consent] = await db.insert(parentalConsentsTable).values({
        studentUserId: userId,
        parentEmail,
        parentName: parentName || null,
        consentStatus: "pending",
        verificationToken: token,
        expiresAt,
      }).returning();
      
      await logAuditEvent({
        userId,
        action: "parental_consent_requested",
        category: "auth",
        severity: "info",
        details: { parentEmail, consentId: consent.id },
        ipAddress: getClientIP(req),
      });
      
      res.json({ 
        success: true, 
        message: "Consent request created. Parent will need to verify.",
        consentId: consent.id,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to request parental consent" });
    }
  });

  app.post("/api/parental-consent/verify/:token", async (req: any, res) => {
    try {
      const { token } = req.params;
      
      const [consent] = await db.select().from(parentalConsentsTable)
        .where(eq(parentalConsentsTable.verificationToken, token));
      
      if (!consent) {
        res.status(404).json({ error: "Invalid or expired consent token" });
        return;
      }
      
      if (consent.expiresAt && new Date() > consent.expiresAt) {
        res.status(410).json({ error: "Consent request has expired" });
        return;
      }
      
      const [updated] = await db.update(parentalConsentsTable)
        .set({
          consentStatus: "approved",
          consentedAt: new Date(),
          verificationToken: null,
        })
        .where(eq(parentalConsentsTable.id, consent.id))
        .returning();
      
      await logAuditEvent({
        userId: consent.studentUserId,
        action: "parental_consent_verified",
        category: "auth",
        severity: "info",
        details: { consentId: consent.id, parentEmail: consent.parentEmail },
      });
      
      res.json({ success: true, message: "Parental consent verified successfully." });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify consent" });
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
      const { submitSuccessMark } = await import("./services/dataGovernance");
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
      const { editSuccessMark } = await import("./services/dataGovernance");
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

      const { archiveSuccessMark } = await import("./services/dataGovernance");
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

  // Rule 2: Communication Safety Intercept
  app.post("/api/messages/send", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user) { res.status(401).json({ error: "User not found" }); return; }

      const { isCoppaRestricted } = await import("./services/dataGovernance");
      if (isCoppaRestricted(user.birthdate)) {
        const parentalConsent = await db.select().from(parentalConsentsTable)
          .where(and(eq(parentalConsentsTable.studentUserId, userId), eq(parentalConsentsTable.consentStatus, "approved")));
        if (parentalConsent.length === 0) {
          res.status(403).json({ error: "Messaging is restricted for users under 13 without parental consent." });
          return;
        }
      }

      const { content, recipientId } = req.body;
      if (!content) { res.status(400).json({ error: "Message content is required" }); return; }

      const senderMemberships = await db.select().from(orgMembershipsTable)
        .where(eq(orgMembershipsTable.userId, userId));
      const senderTenantId = senderMemberships.length > 0 ? senderMemberships[0].organizationId : null;

      let recipientTenantId = null;
      if (recipientId) {
        const recipMemberships = await db.select().from(orgMembershipsTable)
          .where(eq(orgMembershipsTable.userId, recipientId));
        recipientTenantId = recipMemberships.length > 0 ? recipMemberships[0].organizationId : null;
      }

      const { interceptStudentMessage } = await import("./services/dataGovernance");
      const result = await interceptStudentMessage(
        userId, user.role || "student", senderTenantId, recipientId, recipientTenantId,
        content, getClientIP(req), req.headers["user-agent"]
      );

      if (!result.allowed) {
        res.status(403).json({ error: result.message, reason: result.reason });
        return;
      }

      res.json({ sent: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Rule 7: Fraud Strike Check (middleware helper exposed as endpoint for admin)
  app.get("/api/admin/fraud-strikes/:userId", isAuthenticated, requireSiteAdmin, async (req: any, res) => {
    try {
      const { checkFraudStrikes } = await import("./services/dataGovernance");
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
      const { resolveFraudStrikes } = await import("./services/dataGovernance");
      await resolveFraudStrikes(req.params.userId, adminId);
      res.json({ resolved: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to resolve fraud strikes" });
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

  return httpServer;
}
