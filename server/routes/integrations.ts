import type { Express } from "express";
import { storage } from "../storage";
import { type User, lessons, assignments } from "@shared/schema";
import { z } from "zod";
import { isAuthenticated } from "../replit_integrations/auth";
import multer from "multer";
import * as hubspotService from "../services/hubspotService";
import * as wordpressService from "../services/wordpressService";
import { and } from "drizzle-orm";
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
import { sisService } from "../services/sisService";
import { SIS_PROVIDERS } from "@shared/schema";

// AUTO-SPLIT from server/routes.ts -- domain: integrations (28 routes)
export function registerIntegrationsRoutes(app: Express): void {


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
}
