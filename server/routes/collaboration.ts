import type { Express } from "express";
import { storage } from "../storage";
import {
  users,
  sessions,
  type User,
  parentalConsents as parentalConsentsTable,
  organizationMemberships as orgMembershipsTable,
} from "@shared/schema";
import { z } from "zod";
import { isAuthenticated } from "../replit_integrations/auth";
import multer from "multer";
import { db } from "../db";
import { getClientIP } from "../services/auditLog";
import { eq, and } from "drizzle-orm";
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

// AUTO-SPLIT from server/routes.ts -- domain: collaboration (22 routes)
export function registerCollaborationRoutes(app: Express): void {


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


  // Update meeting links for a session (host only)
  app.patch("/api/collaboration/sessions/:id/meeting", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const { zoomUrl, whatsappLink, youtubeUrl } = req.body;
      const session = await storage.updateCollaborationSession(id, { zoomUrl, whatsappLink, youtubeUrl }, userId);
      if (!session) {
        return res.status(404).json({ error: "Session not found or not authorized" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to update meeting links" });
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


  // Rule 2: Communication Safety Intercept
  app.post("/api/messages/send", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user) { res.status(401).json({ error: "User not found" }); return; }

      const { isCoppaRestricted } = await import("../services/dataGovernance");
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

      const { interceptStudentMessage } = await import("../services/dataGovernance");
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
}
