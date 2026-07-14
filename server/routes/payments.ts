import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "../storage";
import { recordBillingAuthorization, consentRequestMeta } from "../services/consentService";
import { generateLessonPlan } from "../openai";
import { detectAfricanCountryFromText } from "@shared/africaContext";
import { computeEnterpriseQuote, planPrice, type PlanId } from "@shared/pricing";
import { sendEmail } from "../services/emailTransport";
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
  purchaseOrders,
} from "@shared/schema";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "../replit_integrations/auth";
import { requireFreshMfa } from "./mfa";
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

// AUTO-SPLIT from server/routes.ts -- domain: payments (12 routes)
export function registerPaymentsRoutes(app: Express): void {


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

      // system_admin users bypass all trial limits (unlimited for demos/testing)
      const isSystemAdmin = userId
        ? (await storage.getUser(userId))?.role === "system_admin"
        : false;

      if (!isSystemAdmin) {
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
            error: "Trial limit reached. Each network is allowed one 10-day trial.",
            nextEligibleDate: null,
          });
          return;
        }

        if (fingerprint) {
          const fpTrials = await storage.getTrialsByFingerprint(fingerprint, sinceDate);
          if (fpTrials.length >= MAX_TRIALS_PER_IP) {
            res.status(403).json({ error: "Trial limit reached. Each device is allowed one 10-day trial." });
            return;
          }
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

      let currentPeriodEnd: string | null = null;
      if (user.stripeSubscriptionId) {
        try {
          const stripe = await getUncachableStripeClient();
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          const sub = subscription as any;
          // current_period_end moved in newer Stripe API versions; try multiple locations
          const rawTs: number | undefined =
            typeof sub.current_period_end === "number" ? sub.current_period_end :
            typeof sub.cancel_at === "number" ? sub.cancel_at :
            typeof sub.billing_cycle_anchor === "number" ? sub.billing_cycle_anchor :
            sub.items?.data?.[0]?.current_period_end;
          if (rawTs && !isNaN(rawTs)) {
            currentPeriodEnd = new Date(rawTs * 1000).toISOString();
          }
        } catch {
          // Non-fatal: period end simply won't be shown
        }
      }
      
      res.json({
        tier: user.tier || "free",
        subscriptionStatus: user.subscriptionStatus || null,
        stripeCustomerId: user.stripeCustomerId || null,
        stripeSubscriptionId: user.stripeSubscriptionId || null,
        currentPeriodEnd,
        downgradeTargetTier: user.downgradeTargetTier || null,
        isDemo: !process.env.STRIPE_SECRET_KEY,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get subscription status" });
    }
  });


  // Create Stripe Checkout Session for real card payments
  app.post("/api/subscription/create-checkout-session", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { tier, billingAuthorized } = req.body;

      if (!["pro", "campus"].includes(tier)) {
        res.status(400).json({ error: "Invalid tier. Choose 'pro' or 'campus'" });
        return;
      }

      // De-coupled recurring-billing authorization (FTC "Click to Cancel" /
      // ROSCA): the subscriber must give a standalone, affirmative consent to
      // recurring charges, separate from accepting the Terms. The UI presents an
      // un-prechecked checkbox; we refuse to start checkout without it.
      if (billingAuthorized !== true) {
        res.status(400).json({
          error: "billing_authorization_required",
          message: "Please authorize the recurring subscription charge to continue.",
        });
        return;
      }

      const stripe = await getUncachableStripeClient();
      const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const user = userRecord[0];

      // Campus minimum bill = $299 base + 10 seats × $12/seat = $419/mo
      const tierPrices: Record<string, { amount: number; name: string; period: string }> = {
        pro: { amount: 9900, name: "LYS Pro (Focus Mode)", period: "month" },
        campus: { amount: 41900, name: "LYS Campus (10-seat minimum)", period: "month" },
      };
      const tierInfo = tierPrices[tier];

      // Find or create Stripe customer
      let customerId = user?.stripeCustomerId || undefined;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user?.email || undefined,
          name: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || undefined,
          metadata: { userId },
        });
        customerId = customer.id;
        await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, userId));
      }

      const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, "") || "https://localhost:5000";

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { name: tierInfo.name },
              unit_amount: tierInfo.amount,
              recurring: { interval: tierInfo.period as "month" | "year" },
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/pricing?checkout_success=true&session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
        cancel_url: `${origin}/pricing?checkout_cancelled=true`,
        metadata: { userId, tier },
      });

      // Persist the standalone billing authorization to the consent ledger.
      try {
        const { ipAddress, userAgent } = consentRequestMeta(req);
        await recordBillingAuthorization({ userId, email: user?.email ?? null, ipAddress, userAgent });
      } catch (consentErr) {
        console.error("Failed to record billing authorization:", consentErr);
        // The user DID affirm standalone recurring-billing authorization; if the
        // ledger write fails we still capture durable evidence in the
        // tamper-evident audit chain so the authorization is not lost.
        await logAuditEvent({
          userId,
          action: "consent.ledger_write_failed",
          category: "security",
          severity: "warning",
          resourceType: "consent",
          details: { context: "billing_authorization", error: String((consentErr as Error)?.message ?? consentErr) },
        }).catch(() => {});
      }

      res.json({ url: session.url, sessionId: session.id });
    } catch (error: any) {
      console.error("Stripe checkout session error:", error);
      res.status(500).json({ error: "Failed to create checkout session", details: error.message });
    }
  });


  // Verify checkout session after Stripe redirects back
  app.post("/api/subscription/verify-checkout", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { sessionId } = req.body;

      if (!sessionId) {
        res.status(400).json({ error: "Missing sessionId" });
        return;
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription"],
      });

      if (session.payment_status !== "paid" && session.status !== "complete") {
        res.status(400).json({ error: "Payment not completed" });
        return;
      }

      const tier = (session.metadata?.tier || "pro") as "free" | "pro" | "campus" | "enterprise";
      const subscription = session.subscription as any;

      await db.update(users)
        .set({
          tier,
          subscriptionStatus: "active",
          stripeSubscriptionId: subscription?.id || null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      res.json({ success: true, tier, message: `Successfully upgraded to ${tier}` });
    } catch (error: any) {
      console.error("Checkout verification error:", error);
      res.status(500).json({ error: "Failed to verify checkout session" });
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


  // Tier downgrade — cancels at period end for real subscriptions, immediate for demo
  app.post("/api/subscription/downgrade", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { targetTier } = req.body;

      const validTiers = ["free", "pro", "campus"];
      if (!validTiers.includes(targetTier)) {
        res.status(400).json({ error: "Invalid target tier" });
        return;
      }

      const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const user = userRecord[0];
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Real Stripe subscription — cancel at period end. Keyed off the presence
      // of a Stripe subscription id (NOT status === "active") so a subscription
      // that already has a scheduled downgrade ("canceling") is re-scheduled at
      // period end rather than wiped immediately, which would forfeit paid time.
      if (user.stripeSubscriptionId) {
        const stripe = await getUncachableStripeClient();
        const sub = await stripe.subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: true,
        }) as any;
        // current_period_end moved in newer Stripe API versions; try multiple locations
        const rawTs: number | undefined =
          typeof sub.current_period_end === "number" ? sub.current_period_end :
          typeof sub.cancel_at === "number" ? sub.cancel_at :
          typeof sub.billing_cycle_anchor === "number" ? sub.billing_cycle_anchor :
          sub.items?.data?.[0]?.current_period_end;
        const periodEnd = (rawTs && !isNaN(rawTs))
          ? new Date(rawTs * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // fallback: 30 days

        await db.update(users)
          .set({ subscriptionStatus: "canceling", downgradeTargetTier: targetTier, updatedAt: new Date() })
          .where(eq(users.id, userId));

        res.json({
          success: true,
          immediate: false,
          currentPeriodEnd: periodEnd,
          targetTier,
          message: `Your plan will change to ${targetTier} on ${new Date(periodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`,
        });
      } else {
        // Demo/no subscription — immediate downgrade
        await db.update(users)
          .set({ tier: targetTier, subscriptionStatus: null, stripeSubscriptionId: null, downgradeTargetTier: null, updatedAt: new Date() })
          .where(eq(users.id, userId));

        res.json({ success: true, immediate: true, targetTier, message: `Switched to ${targetTier} plan.` });
      }
    } catch (error: any) {
      console.error("Downgrade error:", error);
      res.status(500).json({ error: "Failed to downgrade plan" });
    }
  });

  // Cancel a scheduled downgrade / cancellation and keep the current plan.
  // Clears cancel_at_period_end on Stripe and restores the active status so the
  // subscription continues billing normally.
  app.post("/api/subscription/resume", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;

      const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const user = userRecord[0];
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (!user.stripeSubscriptionId) {
        res.status(400).json({ error: "No active subscription to resume." });
        return;
      }

      const stripe = await getUncachableStripeClient();
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });

      await db.update(users)
        .set({ subscriptionStatus: "active", downgradeTargetTier: null, updatedAt: new Date() })
        .where(eq(users.id, userId));

      res.json({
        success: true,
        message: `Your ${user.tier} plan will continue as before.`,
      });
    } catch (error: any) {
      console.error("Resume subscription error:", error);
      res.status(500).json({ error: "Failed to resume subscription" });
    }
  });


  // Explicit "Cancel Subscription" — FTC "Click to Cancel" parity. Cancellation
  // must be as simple as sign-up: one click, no retention hoops. Cancels at the
  // end of the paid period (so the user keeps what they paid for) and reverts to
  // the free tier afterward.
  app.post("/api/subscription/cancel", isAuthenticated, requireFreshMfa, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const user = userRecord[0];
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Real Stripe subscription — cancel at period end. Keyed off the presence
      // of a Stripe subscription id (NOT status === "active") so a subscription
      // already scheduled to change ("canceling") is kept to period end rather
      // than wiped immediately, which would forfeit paid time.
      if (user.stripeSubscriptionId) {
        const stripe = await getUncachableStripeClient();
        const sub = await stripe.subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: true,
        }) as any;
        const rawTs: number | undefined =
          typeof sub.current_period_end === "number" ? sub.current_period_end :
          typeof sub.cancel_at === "number" ? sub.cancel_at :
          typeof sub.billing_cycle_anchor === "number" ? sub.billing_cycle_anchor :
          sub.items?.data?.[0]?.current_period_end;
        const periodEnd = (rawTs && !isNaN(rawTs))
          ? new Date(rawTs * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        await db.update(users)
          .set({ subscriptionStatus: "canceling", downgradeTargetTier: "free", updatedAt: new Date() })
          .where(eq(users.id, userId));

        res.json({
          success: true,
          immediate: false,
          currentPeriodEnd: periodEnd,
          message: `Your subscription is canceled and will end on ${new Date(periodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. You'll keep access until then.`,
        });
      } else {
        // Demo / no live subscription — revert immediately.
        await db.update(users)
          .set({ tier: "free", subscriptionStatus: null, stripeSubscriptionId: null, downgradeTargetTier: null, updatedAt: new Date() })
          .where(eq(users.id, userId));

        res.json({ success: true, immediate: true, message: "Your subscription has been canceled." });
      }
    } catch (error: any) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });


  // Legacy demo downgrade (kept for backward compatibility)
  app.post("/api/subscription/demo-downgrade", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      await db.update(users)
        .set({ tier: "free", subscriptionStatus: null, updatedAt: new Date() })
        .where(eq(users.id, userId));
      res.json({ success: true, message: "Downgraded to free tier", tier: "free" });
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
          configured: true,
          available: true,
        },
        {
          id: "paypal",
          name: "PayPal",
          description: "Pay with your PayPal account or PayPal Credit — Coming soon",
          icon: "paypal",
          configured: false,
          available: false,
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

      // Persist the PO record and provision the account atomically: if the PO
      // paper trail cannot be written, we must NOT grant paid access. Both
      // writes share one transaction so they succeed or fail together.
      const monthlyAmountCents = Math.round(planPrice(tier as PlanId) * 100);
      const savedPo = await db.transaction(async (tx) => {
        await tx.update(users)
          .set({
            tier: tier,
            subscriptionStatus: "po_pending",
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        const [created] = await tx.insert(purchaseOrders).values({
          poNumber: String(poNumber),
          organizationName: String(organizationName),
          contactName: contactName ? String(contactName) : null,
          billingEmail: String(contactEmail),
          tier: String(tier),
          monthlyAmountCents,
          notes: notes ? String(notes) : null,
          submittedByUserId: userId,
        }).returning();
        return created;
      });

      // Notify the platform owner(s). Never block or fail the submission on email.
      try {
        const priceLabel = `$${planPrice(tier as PlanId).toFixed(2)}/mo`;
        const subject = `New purchase order — ${organizationName}, ${tier}, ${poNumber}`;
        const body = [
          `A new purchase order was submitted.`,
          ``,
          `Organization: ${organizationName}`,
          `Plan: ${tier} (${priceLabel})`,
          `PO number: ${poNumber}`,
          `Contact: ${contactName || "(not provided)"} <${contactEmail}>`,
          notes ? `Notes: ${notes}` : `Notes: (none)`,
          ``,
          `The account has been provisioned immediately and marked PO-pending.`,
          `Review it in the admin area under Billing → Purchase Orders and mark it paid once the invoice clears.`,
        ].join("\n");

        const overrideEmail = process.env.PO_NOTIFY_EMAIL || process.env.PLATFORM_OWNER_EMAIL;
        const recipients = new Set<string>();
        if (overrideEmail) recipients.add(overrideEmail);
        const admins = await db
          .select({ email: users.email })
          .from(users)
          .where(inArray(users.role, ["site_admin", "system_admin"]));
        for (const a of admins) {
          if (a.email) recipients.add(a.email);
        }
        for (const email of Array.from(recipients)) {
          await sendEmail({ email }, subject, body, { logPrefix: "purchase-order" });
        }
      } catch (emailErr) {
        console.error("[purchase-order] Failed to send owner notification:", emailErr);
      }

      res.json({
        success: true,
        message: `Purchase order ${poNumber} submitted for ${tier} tier. Your account has been provisioned while we process the PO.`,
        tier: tier,
        poNumber: poNumber,
        purchaseOrderId: savedPo?.id,
        status: "pending_verification",
      });
    } catch (error) {
      console.error("Purchase order error:", error);
      res.status(500).json({ error: "Failed to submit purchase order" });
    }
  });


  // Auto-calculated Enterprise quote: prices a network from the ACTUAL number of
  // campuses nested beneath the org(s) the requesting admin manages, plus base +
  // seats. Returns hasOrg=false when the user manages no eligible network so the
  // client can fall back to a manual estimator.
  app.get("/api/pricing/enterprise-quote", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const seatCountRaw = req.query.seats;
      const seatCount = seatCountRaw !== undefined ? Number(seatCountRaw) : undefined;
      const seatCountValid = seatCount !== undefined && Number.isFinite(seatCount) ? seatCount : undefined;
      const requestedOrgId = typeof req.query.organizationId === "string" ? req.query.organizationId : undefined;

      const ENTERPRISE_ORG_TYPES = ["network", "charter_network", "district"];

      // A quote exposes an org's name + campus count, so it requires a DIRECT
      // admin/owner membership on that org (or a platform admin). This is stricter
      // than the shared verifyOrgAdminAccess helper, which also grants district
      // admins access via plain (non-admin) membership on a parent org.
      const isPlatformAdmin = await storage.isSiteAdmin(userId);
      const isOrgAdmin = async (orgId: string): Promise<boolean> => {
        if (isPlatformAdmin) return true;
        const membership = await storage.getOrgMembership(orgId, userId);
        return !!membership && (membership.role === "admin" || membership.role === "owner");
      };

      const buildResponse = async (org: { id: string; name: string; type: string }) => {
        const campuses = await storage.getSchoolsInHierarchy(org.id);
        const quote = computeEnterpriseQuote({ campusCount: campuses.length, seatCount: seatCountValid });
        return {
          hasOrg: true,
          organizationId: org.id,
          organizationName: org.name,
          organizationType: org.type,
          quote,
        };
      };

      // When the caller names a specific org, verify they administer it before
      // exposing its name + campus count.
      if (requestedOrgId) {
        if (!(await isOrgAdmin(requestedOrgId))) {
          res.status(403).json({ error: "You do not manage this organization" });
          return;
        }
        const org = await storage.getOrganization(requestedOrgId);
        if (!org || !ENTERPRISE_ORG_TYPES.includes(org.type as string)) {
          res.json({ hasOrg: false });
          return;
        }
        res.json(await buildResponse(org as any));
        return;
      }

      // Otherwise auto-discover the enterprise-eligible orgs the user administers.
      const managedOrgIds = await getAdminManagedOrgIds(userId);
      const managedOrgs = (
        await Promise.all(managedOrgIds.map((id) => storage.getOrganization(id)))
      ).filter((o): o is NonNullable<typeof o> => !!o);

      const adminEligibleOrgs: typeof managedOrgs = [];
      for (const org of managedOrgs) {
        if (!ENTERPRISE_ORG_TYPES.includes(org.type as string)) continue;
        if (await isOrgAdmin(org.id)) {
          adminEligibleOrgs.push(org);
        }
      }

      if (adminEligibleOrgs.length === 0) {
        res.json({ hasOrg: false });
        return;
      }

      // Default to the largest network when the caller didn't pick one; the
      // response includes the org name so the UI shows which network was priced.
      let best: { org: typeof adminEligibleOrgs[number]; campusCount: number } | null = null;
      for (const org of adminEligibleOrgs) {
        const campuses = await storage.getSchoolsInHierarchy(org.id);
        if (!best || campuses.length > best.campusCount) {
          best = { org, campusCount: campuses.length };
        }
      }

      res.json(await buildResponse(best!.org as any));
    } catch (error) {
      console.error("Enterprise quote error:", error);
      res.status(500).json({ error: "Failed to compute enterprise quote" });
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
}
