import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "../storage";
import { requireCaptcha } from "../services/captcha";
import { recordBundleAcceptance, consentRequestMeta } from "../services/consentService";
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
import { isUnderCoppaAge, setUserBirthdate } from "../services/dataSubjectService";
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

// Self-serve onboarding may only ever set a non-privileged identity. Elevated
// roles (staff/admin/system) are granted exclusively through admin-controlled
// flows — never by the user picking them during onboarding.
const SELF_SERVE_ONBOARDING_ROLES = ["student", "educator", "homeschool_parent"] as const;

const completeOnboardingSchema = z.object({
  birthdate: z.string().optional(),
  role: z.enum(SELF_SERVE_ONBOARDING_ROLES).optional(),
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

// AUTO-SPLIT from server/routes.ts -- domain: account (10 routes)
export function registerAccountRoutes(app: Express): void {


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
  app.post("/api/onboarding/complete", isAuthenticated, requireCaptcha(), async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;

      // Click-wrap gate: onboarding cannot complete without an affirmative,
      // un-prechecked agreement to the Terms of Service & Subscription Agreement.
      if (req.body?.agreedToTerms !== true) {
        return res.status(400).json({
          error: "terms_required",
          message: "Please agree to the Terms of Service to continue.",
        });
      }

      const validated = completeOnboardingSchema.parse(req.body);
      const { role, preferences, needsAnalysis, birthdate } = validated;

      // COPPA gate: block under-13 self sign-up. Under-13 users may only be
      // added via a school or homeschool-parent account, never through the
      // self-serve onboarding flow.
      //
      // Birthdate is required for EVERY self-serve onboarding completion (any
      // role), so age can always be checked and a caller cannot skip the gate by
      // omitting `role` or choosing a non-student role. Any under-13 birthdate
      // (newly provided OR already stored) is blocked regardless of declared role.
      const currentUser = await storage.getUser(userId);
      const parsedBirthdate = birthdate ? new Date(birthdate) : null;
      const hasNewBirthdate = !!(parsedBirthdate && !isNaN(parsedBirthdate.getTime()));
      const existingBirthdate = currentUser?.birthdate ? new Date(currentUser.birthdate) : null;
      const effectiveBirthdate = hasNewBirthdate ? parsedBirthdate : existingBirthdate;

      // Birthdate is MANDATORY for all self-serve onboarding regardless of the
      // requested role, so COPPA age can always be evaluated. This closes the
      // bypass where a user picked a non-student role and omitted birthdate to
      // skip age verification entirely.
      if (!effectiveBirthdate) {
        return res.status(400).json({
          error: "birthdate_required",
          message: "Please enter your date of birth to continue.",
        });
      }

      // Block under-13 self sign-up entirely (newly provided OR already on file),
      // regardless of declared role.
      if (isUnderCoppaAge(effectiveBirthdate)) {
        await logAuditEvent({
          userId,
          action: "coppa.self_signup_blocked",
          category: "security",
          severity: "warning",
          resourceType: "user",
          resourceId: userId,
          ipAddress: getClientIP(req),
          userAgent: req.get("user-agent"),
        });
        return res.status(403).json({
          error: "coppa_blocked",
          message:
            "Students under 13 can't create their own account. Ask a teacher, school, or parent to set one up for you.",
        });
      }

      if (hasNewBirthdate) {
        await setUserBirthdate(userId, parsedBirthdate!);
      }

      // Update user role (map homeschool_parent to educator for DB storage).
      // Defense in depth: even though the schema already restricts `role` to the
      // self-serve set, re-check here so onboarding can never grant a privileged
      // role (staff/admin/system) — that path is admin-controlled only.
      if (role) {
        if (!(SELF_SERVE_ONBOARDING_ROLES as readonly string[]).includes(role)) {
          await logAuditEvent({
            userId,
            action: "onboarding.role_escalation_blocked",
            category: "security",
            severity: "warning",
            resourceType: "user",
            resourceId: userId,
            ipAddress: getClientIP(req),
            userAgent: req.get("user-agent"),
          });
          return res.status(403).json({
            error: "role_not_allowed",
            message: "That role can't be set during sign-up.",
          });
        }
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

      // Record click-wrap acceptance of the policy bundle in the consent ledger.
      try {
        const { ipAddress, userAgent } = consentRequestMeta(req);
        await recordBundleAcceptance({
          userId,
          email: user?.email ?? currentUser?.email ?? null,
          context: "onboarding",
          ipAddress,
          userAgent,
        });
      } catch (consentErr) {
        console.error("Failed to record onboarding consent:", consentErr);
        // The user DID affirm the click-wrap box; if the ledger write fails we
        // still capture durable evidence in the tamper-evident audit chain so
        // the affirmation is not lost.
        await logAuditEvent({
          userId,
          action: "consent.ledger_write_failed",
          category: "security",
          severity: "warning",
          resourceType: "consent",
          details: { context: "onboarding", error: String((consentErr as Error)?.message ?? consentErr) },
        }).catch(() => {});
      }

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
      // SECURITY (privilege escalation): this is a self-service endpoint, so a
      // user must NEVER be able to grant themselves an elevated/admin role here.
      // Only the non-privileged onboarding identities are accepted. Elevated
      // roles (staff/campus_admin/district_admin/site_admin/system_admin) are
      // granted exclusively by an existing admin via /api/admin/users/:id.
      const selfRoleSchema = z.object({
        role: z.enum(["student", "educator", "homeschool_parent"]),
      });
      const validated = selfRoleSchema.parse(req.body);
      const dbRole = validated.role === "homeschool_parent" ? "educator" : validated.role;
      const before = await storage.getUser(userId);
      const user = await storage.updateUserRole(userId, dbRole as UserRole);
      await logAuditEvent({
        userId,
        action: "user.self_role_change",
        category: "security",
        severity: "info",
        resourceType: "user",
        resourceId: userId,
        details: { from: before?.role ?? null, to: dbRole, requested: validated.role },
        ipAddress: getClientIP(req),
        userAgent: req.get("user-agent"),
      });
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
}
