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


// ===== Hoisted helpers (formerly inside registerRoutes) =====


  // Free Trial System
  export const TRIAL_DURATION_DAYS = 10;

  export const TRIAL_RESET_MONTHS = 6;

  export const MAX_TRIALS_PER_IP = 1;
 // 1 trial per IP for regular users; system_admin bypasses this

  export function getTrialSinceDate(): number {
    const d = new Date();
    d.setMonth(d.getMonth() - TRIAL_RESET_MONTHS);
    return d.getTime();
  }


  // ===========================================
  // STANDARDS AUTO-MATCHING API
  // ===========================================
  
  export const autoMatchSchema = z.object({
    topic: z.string().min(1, "Topic is required"),
    gradeLevel: z.string().min(1, "Grade level is required"),
    subject: z.string().optional(),
    objectives: z.array(z.string()).optional(),
    standardSetId: z.string().uuid("Valid standard set ID is required"),
  });


  // Educator Profiles - requires authentication
  export const educatorProfileSchema = z.object({
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


  // ================================
  // Assignment System (Paid Feature)
  // ================================

  // Helper to check paid tier
  export const requirePaidTier = async (req: any, res: any, next: any) => {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tier = await storage.getUserTier(userId);
    if (tier !== "free") return next();
    // Also allow active free trial users
    const now = new Date();
    const activeTrial = await db
      .select({ id: freeTrials.id })
      .from(freeTrials)
      .where(and(eq(freeTrials.userId, userId), eq(freeTrials.isActive, true), lte(freeTrials.trialStartDate, now), gte(freeTrials.trialEndDate, now)))
      .limit(1);
    if (activeTrial.length > 0) return next();
    res.status(403).json({ 
      error: "Paid subscription required",
      message: "Assignment generation is a Pro/Campus feature. Upgrade your plan to access this feature.",
      requiredTier: "pro"
    });
  };


  // ================================
  // Real-Time Collaboration System
  // ================================

  // Generate unique invite code
  export function generateInviteCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }


  // ================================
  // Educational Standards Admin API
  // ================================

  // Helper to check site admin for standards admin routes
  export const requireSiteAdminForStandards = async (req: any, res: any): Promise<boolean> => {
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


  // Map of actual US state names to their abbreviations for filtering
  export const US_STATES: Record<string, string> = {
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


  // Helper to find state name from abbreviation
  export const getStateNameFromAbbr = (abbr: string): string | undefined => {
    return Object.entries(US_STATES).find(([name, ab]) => ab === abbr)?.[0];
  };


  // ================================
  // Site Administration & Multi-Tenant
  // ================================

  // Middleware to check if user is a site admin
  export const isSiteAdmin = async (req: any, res: any, next: any) => {
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


  // ================================
  // Organization Hierarchy Endpoints
  // ================================

  // Valid organization types for validation
  export const validOrgTypes = ["country", "state", "jurisdiction", "district", "school", "campus", "university", "other"];


  // Entity sharing between organizations
  export const entityShareBodySchema = z.object({
    entityType: z.enum(["class", "student", "assignment", "lesson", "scope_sequence"]),
    entityId: z.string().min(1),
    targetOrganizationId: z.string().min(1),
    permission: z.enum(["view", "edit", "copy"]).optional().default("view"),
  });


  // ===== Needs Analyzer (4-question funnel) =================================
  // Anonymous visitors can submit; we key responses by a localStorage uuid
  // (`sessionId`). After signup, the onboarding flow calls `/bind` to attach
  // the response to the user account so we can measure segment conversion.
  //
  // These endpoints are intentionally unauthenticated (the funnel runs before
  // signup) so we validate input strictly and parse Content-Type ourselves
  // because sendBeacon may post with `application/json` blob content.
  export const ANALYZER_IDENTITIES = [
    "student",
    "educator",
    "homeschool_parent",
    "campus_admin",
    "district_admin",
  ] as const;

  export const ANALYZER_URGENCIES = ["exploring", "looking", "ready_now"] as const;

  export const ANALYZER_CTAS = ["start_free", "try_sample", "book_demo"] as const;

  export const ANALYZER_SESSION_REGEX = /^[A-Za-z0-9_.-]{8,128}$/;

  export const analyzerSubmitSchema = z.object({
    sessionId: z.string().regex(ANALYZER_SESSION_REGEX),
    identity: z.enum(ANALYZER_IDENTITIES),
    corePain: z.string().trim().max(500).optional().nullable(),
    urgency: z.enum(ANALYZER_URGENCIES).optional().nullable(),
    desiredOutcome: z.string().trim().max(500).optional().nullable(),
    ctaShown: z.enum(ANALYZER_CTAS).optional().nullable(),
  });

  export const analyzerCtaClickSchema = z.object({
    sessionId: z.string().regex(ANALYZER_SESSION_REGEX),
    ctaClicked: z.enum(ANALYZER_CTAS),
  });

  export const analyzerBindSchema = z.object({
    sessionId: z.string().regex(ANALYZER_SESSION_REGEX),
  });


  // ================================
  // Student Journey Entries (User-specific Timeline)
  // ================================
  
  // Query param validation schemas
  export const entriesQuerySchema = z.object({
    limit: z.string().optional().transform(val => {
      const parsed = parseInt(val || "50", 10);
      return isNaN(parsed) || parsed < 1 ? 50 : Math.min(parsed, 200);
    }),
  });

  
  export const pillarParamSchema = z.enum(["be", "know", "do"]);


  // Validation schema for creating journey entries via API
  export const createJourneyEntrySchema = insertStudentJourneyEntrySchema.omit({ userId: true }).extend({
    entryType: z.enum(["assessment", "goal_completed", "milestone", "reflection", "career_exploration", "skill_gained"]),
    bkdPillar: z.enum(["be", "know", "do"]),
    title: z.string().min(1).max(500),
    description: z.string().max(2000).nullable().optional(),
    pointsEarned: z.number().int().min(0).max(1000).optional().default(0),
    metadata: z.record(z.any()).nullable().optional(),
  });


  // Create a new SIS connection (manual configuration)
  export const createSisConnectionSchema = z.object({
    provider: z.enum(["clever", "powerschool", "canvas", "infinite_campus", "skyward", "oneroster", "classlink"]),
    providerName: z.string().optional(),
    organizationId: z.string().optional(),
    baseUrl: z.string().url().optional(),
    accessToken: z.string().optional(),
    districtId: z.string().optional(),
    // OneRoster / ClassLink OAuth2 client-credentials
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    tokenUrl: z.string().url().optional(),
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


  // ============ Org-Admin Self-Service Routes (Campus/District Admins) ============

  export const verifyOrgAdminAccess = async (userId: string, orgId: string): Promise<boolean> => {
    const user = await storage.getUser(userId);
    if (!user) return false;
    const isSiteAdminUser = await storage.isSiteAdmin(userId);
    if (isSiteAdminUser) return true;
    const membership = await storage.getOrgMembership(orgId, userId);
    if (membership && (membership.role === "admin" || membership.role === "owner")) return true;
    if (user.role === "district_admin") {
      // Only expand scope to child orgs from memberships where the user is an
      // admin/owner — a plain member role grants no administrative scope
      // (aligned with the DSR tenant-scoping rule in the threat model).
      const userOrgs = await storage.getUserOrganizations(userId);
      for (const uOrg of userOrgs) {
        if (uOrg.role !== "admin" && uOrg.role !== "owner") continue;
        const children = await storage.getChildOrganizations(uOrg.organizationId);
        if (children.some(c => c.id === orgId)) return true;
      }
    }
    return false;
  };


  export const getAdminManagedOrgIds = async (userId: string): Promise<string[]> => {
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


  // ============ Org-Scoped Safety Routes (Campus/District Admins) ============

  export const getAdminOrgIds = async (userId: string): Promise<string[]> => {
    const memberships = await db.select().from(orgMembershipsTable)
      .where(eq(orgMembershipsTable.userId, userId));
    return memberships.map(m => m.organizationId);
  };


  // ============ RSS Content Ingestion Routes ============

  export const requireRssAdmin = async (req: any, res: any, next: any) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const isAdmin = await storage.isSiteAdmin(userId);
    if (!isAdmin) return res.status(403).json({ error: "System admin access required" });
    next();
  };


  // ==========================================================================
  // Foundation onboarding (staff-facing widget)
  // ==========================================================================
  export const requireStaffOrAdmin = requireRole("staff", "site_admin", "system_admin");

  export const requireFoundationAdmin = requireRole("site_admin", "system_admin");


  export const foundationProgressBodySchema = z.object({
    moduleSlug: z.string().min(1).max(64),
    action: z.enum(["viewed", "completed"]),
    quizScore: z.number().int().min(0).max(100).optional(),
  });


  export const foundationQuizQuestionSchema = z.object({
    question: z.string().min(1).max(500),
    options: z.array(z.string().min(1).max(300)).min(2).max(6),
    correctIndex: z.number().int().min(0).max(5),
    explanation: z.string().max(1000).optional(),
  });


  // Strict allowlist for video URLs. Must be https + an approved provider host
  // (or a direct .mp4/.webm/.ogg/.mov file). This is the authoritative gate —
  // never trust the client allowlist alone; an admin could still craft a request
  // that bypasses the UI.
  export const APPROVED_VIDEO_HOSTS = [
    /^(?:www\.)?youtube\.com$/i,
    /^youtu\.be$/i,
    /^(?:www\.|player\.)?vimeo\.com$/i,
    /^(?:www\.)?loom\.com$/i,
    /^(?:[a-z0-9-]+\.)?wistia\.(?:com|net)$/i,
    /^drive\.google\.com$/i,
  ];

  export const isApprovedVideoUrl = (raw: string): boolean => {
    try {
      const u = new URL(raw);
      if (u.protocol !== "https:") return false;
      if (APPROVED_VIDEO_HOSTS.some((re) => re.test(u.hostname))) return true;
      // Also allow https direct video files on any host.
      if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(u.pathname)) return true;
      return false;
    } catch {
      return false;
    }
  };

  export const videoUrlSchema = z
    .string()
    .max(1000)
    .refine(isApprovedVideoUrl, {
      message: "Video URL must be https and from an approved provider (YouTube, Vimeo, Loom, Wistia, Google Drive) or a direct .mp4/.webm/.ogg/.mov file.",
    });


  export const foundationModuleUpdateSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    subtitle: z.string().max(500).nullable().optional(),
    videoUrl: videoUrlSchema.nullable().optional().or(z.literal("").transform(() => null)),
    body: z.string().max(50000).optional(),
    isPublished: z.boolean().optional(),
    order: z.number().int().min(0).max(999).optional(),
    quizJson: z.array(foundationQuizQuestionSchema).max(20).optional(),
  }).refine(
    (data) => !data.quizJson || data.quizJson.every((q) => q.correctIndex < q.options.length),
    { message: "Each question's correctIndex must be less than its number of options." }
  );
