import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { lessons } from "@shared/schema";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerDevLogin } from "./devLogin";
import multer from "multer";
import { startBlsScheduler } from "./services/blsService";
import { startRssFeedScheduler } from "./services/rssFeedService";
import { startScholarshipScheduler } from "./services/scholarshipService";
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

import { registerAdminRoutes } from "./routes/admin";
import { registerOrgRoutes } from "./routes/org";
import { registerStudentRoutes } from "./routes/student";
import { registerCurriculumRoutes } from "./routes/curriculum";
import { registerCurriculumLibraryRoutes } from "./routes/curriculumLibrary";
import { registerParentRoutes } from "./routes/parent";
import { registerLessonsRoutes } from "./routes/lessons";
import { registerPracticeRoutes } from "./routes/practice";
import { registerDemoRoutes } from "./routes/demo";
import { registerHomeschoolRoutes } from "./routes/homeschool";
import { registerTeacherStandardsRoutes } from "./routes/teacherStandards";
import { registerClassroomRoutes } from "./routes/classroom";
import { registerCareersRoutes } from "./routes/careers";
import { registerIntegrationsRoutes } from "./routes/integrations";
import { registerPdRoutes } from "./routes/pd";
import { registerPortfolioRoutes } from "./routes/portfolio";
import { registerMarketplaceRoutes } from "./routes/marketplace";
import { registerCollaborationRoutes } from "./routes/collaboration";
import { registerPaymentsRoutes } from "./routes/payments";
import { registerAccountRoutes } from "./routes/account";
import { registerAnalyticsRoutes } from "./routes/analytics";
import { registerMiscRoutes } from "./routes/misc";
import { registerNotificationsRoutes } from "./routes/notifications";
import { registerMfaRoutes, requireLoginMfa } from "./routes/mfa";
import { registerDsrRoutes } from "./routes/dsr";
import { registerConsentRoutes } from "./routes/consent";
import { registerSsoRoutes } from "./routes/sso";
import { startDigestScheduler, startModerationBacklogScheduler } from "./services/digestScheduler";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {


  // Setup authentication FIRST
  await setupAuth(app);

  registerAuthRoutes(app);

  // Development-only login switcher (hard-disabled on the deployed site).
  // Mounted before the MFA gate so the pre-auth login POST isn't intercepted.
  registerDevLogin(app);

  // Login-MFA gate: educators-and-up must complete a second factor (TOTP or
  // email code) before mutating anything via the API. Mounted after auth so the
  // session/user is populated; reads pass through, and it degrades safely when a
  // user has no usable second factor. Must precede the protected route modules.
  app.use("/api", requireLoginMfa);


  // ================================
  // BLS Data Sync Routes
  // ================================

  // Start the BLS scheduler when server starts
  startBlsScheduler();


  // Seed the 6 default modules on first boot (idempotent — leaves edits alone).
  // Run in the background so route registration / health checks aren't blocked.
  import("./seedFoundation").then(async ({ seedFoundationModules }) => {
    try {
      const seedResult = await seedFoundationModules();
      if (seedResult.inserted > 0) {
        console.log(`[foundation] Seeded ${seedResult.inserted} module(s); ${seedResult.skipped} already existed.`);
      }
    } catch (e) {
      console.error("[foundation] seed failed:", e);
    }
  }).catch((e) => console.error("[foundation] seed import failed:", e));


  startRssFeedScheduler(60);

  startScholarshipScheduler();

  // ===== Per-domain route registrations (auto-split) =====
  registerAdminRoutes(app);
  registerOrgRoutes(app);
  registerStudentRoutes(app);
  registerCurriculumRoutes(app);
  registerCurriculumLibraryRoutes(app);
  registerParentRoutes(app);
  registerLessonsRoutes(app);
  registerPracticeRoutes(app);
  registerDemoRoutes(app);
  registerHomeschoolRoutes(app);
  registerTeacherStandardsRoutes(app);
  registerClassroomRoutes(app);
  registerCareersRoutes(app);
  registerIntegrationsRoutes(app);
  registerPdRoutes(app);
  registerPortfolioRoutes(app);
  registerMarketplaceRoutes(app);
  registerCollaborationRoutes(app);
  registerPaymentsRoutes(app);
  registerAccountRoutes(app);
  registerAnalyticsRoutes(app);
  registerMiscRoutes(app);
  registerNotificationsRoutes(app);
  registerMfaRoutes(app);
  registerDsrRoutes(app);
  registerConsentRoutes(app);
  registerSsoRoutes(app);

  // Task #8: weekly standards observability digest (Mondays 09:00 site-local).
  startDigestScheduler();
  // Task #12: daily moderation-queue backlog alert (08:00 site-local).
  startModerationBacklogScheduler();

  return httpServer;
}
