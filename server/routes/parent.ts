import type { Express } from "express";
import { storage } from "../storage";
import { users, goals, savedCareers, assignments, parentalConsents as parentalConsentsTable } from "@shared/schema";
import { z } from "zod";
import { isAuthenticated } from "../replit_integrations/auth";
import { randomUUID } from "crypto";
import multer from "multer";
import { db } from "../db";
import { logAuditEvent, getClientIP } from "../services/auditLog";
import { eq, desc, and, count } from "drizzle-orm";
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

// AUTO-SPLIT from server/routes.ts -- domain: parent (39 routes)
export function registerParentRoutes(app: Express): void {


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


  // ====================================================
  // PARENT PORTAL v2 — Magic Links, Multi-directional invites
  // ====================================================

  // Generate a magic link invite (teacher/admin/parent initiated)
  app.post("/api/parent-portal/magic-invite", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

      const { studentUserId, parentEmail, relationship, inviterType } = req.body;
      if (!studentUserId || !parentEmail) {
        res.status(400).json({ error: "Student user ID and parent email are required" }); return;
      }

      // Validate the student exists
      const student = await storage.getUser(studentUserId);
      if (!student) { res.status(404).json({ error: "Student not found. They must have a LYS account first." }); return; }

      const token = randomUUID().replace(/-/g, "").substring(0, 32);
      const magicToken = randomUUID().replace(/-/g, "");
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const invitation = await storage.createParentInvitation({
        studentUserId,
        parentEmail,
        relationship: relationship || "parent",
        token,
        magicToken,
        inviterUserId: userId,
        inviterType: inviterType || user.role || "student",
        status: "pending",
        expiresAt,
      });

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      res.json({ ...invitation, magicLink: `${baseUrl}/parent-connect?magic=${magicToken}` });
    } catch (error) {
      res.status(500).json({ error: "Failed to create magic link invite" });
    }
  });


  // Accept a magic link (no auth required — lightweight access)
  app.get("/api/parent-portal/magic-accept/:token", async (req: any, res) => {
    try {
      const { token } = req.params;
      const invitation = await storage.getParentInvitationByMagicToken(token);
      if (!invitation) { res.status(404).json({ error: "Invitation not found or expired" }); return; }
      if (invitation.status !== "pending" || new Date() > invitation.expiresAt) {
        res.status(410).json({ error: "This invitation has expired" }); return;
      }
      // Return invitation info so the frontend can guide the user to sign in / connect
      res.json({
        valid: true,
        studentUserId: invitation.studentUserId,
        parentEmail: invitation.parentEmail,
        relationship: invitation.relationship,
        inviterType: invitation.inviterType,
        token: invitation.token,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to validate magic link" });
    }
  });


  // Parent-initiated invite: parent enters student's email to request connection
  app.post("/api/parent-portal/request-by-email", isAuthenticated, async (req: any, res) => {
    try {
      const parentId = req.user?.claims?.sub;
      const parent = await storage.getUser(parentId);
      if (!parent || (parent.role !== "homeschool_parent" && parent.role !== "student")) {
        // Allow any authenticated user to request (educator can also find student for parent)
      }

      const { studentEmail, relationship } = req.body;
      if (!studentEmail) { res.status(400).json({ error: "Student email is required" }); return; }

      // Find student by email — must have a LYS account
      const studentUser = await storage.getUserByEmail(studentEmail);
      if (!studentUser) {
        res.status(404).json({ error: "No LYS account found with that email. The student must create an account first." }); return;
      }
      if (studentUser.role !== "student" && studentUser.role !== "homeschool_parent") {
        res.status(400).json({ error: "That account is not a student account" }); return;
      }

      // Check if link already exists
      const existing = await storage.getParentStudentLinkByUsers(parentId, studentUser.id);
      if (existing) { res.json({ message: "Connection already exists", link: existing }); return; }

      // Create a pending link (student must approve)
      const link = await storage.createParentStudentLink({
        parentUserId: parentId,
        studentUserId: studentUser.id,
        relationship: relationship || "parent",
        status: "pending",
      });

      res.json(link);
    } catch (error) {
      res.status(500).json({ error: "Failed to create connection request" });
    }
  });


  // Student approves/rejects a parent connection request
  app.patch("/api/parent-portal/connection-requests/:linkId", isAuthenticated, async (req: any, res) => {
    try {
      const studentId = req.user?.claims?.sub;
      const { linkId } = req.params;
      const { action } = req.body; // "approve" or "reject"

      const link = await storage.getParentStudentLink(linkId);
      if (!link || link.studentUserId !== studentId) {
        res.status(403).json({ error: "Not authorized" }); return;
      }

      if (action === "approve") {
        await storage.updateParentStudentLink(linkId, { status: "active", acceptedAt: new Date() });
        res.json({ success: true, status: "active" });
      } else if (action === "reject") {
        await storage.deleteParentStudentLink(linkId);
        res.json({ success: true, status: "rejected" });
      } else {
        res.status(400).json({ error: "Action must be 'approve' or 'reject'" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update connection request" });
    }
  });


  // Get pending connection requests for the logged-in student
  app.get("/api/parent-portal/connection-requests", isAuthenticated, async (req: any, res) => {
    try {
      const studentId = req.user?.claims?.sub;
      const allLinks = await storage.getParentStudentLinks(studentId, "student");
      const pending = allLinks.filter(l => l.status === "pending");
      res.json(pending);
    } catch (error) {
      res.status(500).json({ error: "Failed to get connection requests" });
    }
  });


  // ====================================================
  // QUIET HOURS
  // ====================================================

  app.get("/api/quiet-hours", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
      const { orgId, teacherUserId } = req.query;
      const qh = await storage.getQuietHours(orgId as string | undefined, teacherUserId as string | undefined);
      res.json(qh);
    } catch (error) {
      res.status(500).json({ error: "Failed to get quiet hours" });
    }
  });


  app.get("/api/quiet-hours/active", isAuthenticated, async (req: any, res) => {
    try {
      const { orgId, teacherUserId } = req.query;
      const active = await storage.isQuietHoursActive(orgId as string | undefined, teacherUserId as string | undefined);
      res.json({ active });
    } catch (error) {
      res.status(500).json({ error: "Failed to check quiet hours" });
    }
  });


  app.post("/api/quiet-hours", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user || !["educator", "campus_admin", "district_admin", "site_admin", "system_admin"].includes(user.role || "")) {
        res.status(403).json({ error: "Only educators and admins can set quiet hours" }); return;
      }
      const qh = await storage.createQuietHours({ ...req.body, createdBy: userId });
      res.json(qh);
    } catch (error) {
      res.status(500).json({ error: "Failed to create quiet hours" });
    }
  });


  app.patch("/api/quiet-hours/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user || !["educator", "campus_admin", "district_admin", "site_admin", "system_admin"].includes(user.role || "")) {
        res.status(403).json({ error: "Only educators and admins can update quiet hours" }); return;
      }
      const updated = await storage.updateQuietHours(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update quiet hours" });
    }
  });


  app.delete("/api/quiet-hours/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user || !["educator", "campus_admin", "district_admin", "site_admin", "system_admin"].includes(user.role || "")) {
        res.status(403).json({ error: "Only educators and admins can delete quiet hours" }); return;
      }
      await storage.deleteQuietHours(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete quiet hours" });
    }
  });


  // ====================================================
  // BROADCAST POSTS
  // ====================================================

  app.get("/api/broadcast-posts", isAuthenticated, async (req: any, res) => {
    try {
      const { orgId, classId, audience } = req.query;
      const posts = await storage.getParentBroadcastPosts({
        orgId: orgId as string | undefined,
        classId: classId as string | undefined,
        audience: audience as string | undefined,
      });
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get broadcast posts" });
    }
  });


  app.post("/api/broadcast-posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user || !["educator", "campus_admin", "district_admin", "site_admin", "system_admin"].includes(user.role || "")) {
        res.status(403).json({ error: "Only educators and admins can post broadcasts" }); return;
      }
      const post = await storage.createParentBroadcastPost({
        ...req.body,
        authorUserId: userId,
        authorType: ["campus_admin", "district_admin"].includes(user.role || "") ? "campus_admin" : "teacher",
      });
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: "Failed to create broadcast post" });
    }
  });


  app.patch("/api/broadcast-posts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const post = await storage.getParentBroadcastPost(req.params.id);
      if (!post || post.authorUserId !== userId) {
        res.status(403).json({ error: "Not authorized to edit this post" }); return;
      }
      const updated = await storage.updateParentBroadcastPost(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update broadcast post" });
    }
  });


  app.delete("/api/broadcast-posts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      const post = await storage.getParentBroadcastPost(req.params.id);
      if (!post) { res.status(404).json({ error: "Post not found" }); return; }
      if (post.authorUserId !== userId && !["campus_admin", "district_admin", "site_admin", "system_admin"].includes(user?.role || "")) {
        res.status(403).json({ error: "Not authorized" }); return;
      }
      await storage.deleteParentBroadcastPost(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete broadcast post" });
    }
  });


  // ====================================================
  // NOTIFICATION PREFERENCES
  // ====================================================

  app.get("/api/parent-portal/notification-preferences/:linkId", isAuthenticated, async (req: any, res) => {
    try {
      const parentId = req.user?.claims?.sub;
      const prefs = await storage.getParentNotificationPreferences(parentId, req.params.linkId);
      res.json(prefs || { preferences: { milestones: true, lowEngagement: true, newPortfolioItems: true, assignmentGrades: true, messages: true, broadcastPosts: true, goalUpdates: true, careerActivity: false } });
    } catch (error) {
      res.status(500).json({ error: "Failed to get notification preferences" });
    }
  });


  app.put("/api/parent-portal/notification-preferences/:linkId", isAuthenticated, async (req: any, res) => {
    try {
      const parentId = req.user?.claims?.sub;
      const prefs = await storage.upsertParentNotificationPreferences({
        parentUserId: parentId,
        linkId: req.params.linkId,
        preferences: req.body.preferences,
      });
      res.json(prefs);
    } catch (error) {
      res.status(500).json({ error: "Failed to save notification preferences" });
    }
  });


  // ====================================================
  // PARENT MESSAGES (1-to-1 secure messaging)
  // ====================================================

  app.get("/api/parent-messages/threads", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const threads = await storage.getMessageThreadsForUser(userId);
      res.json(threads);
    } catch (error) {
      res.status(500).json({ error: "Failed to get message threads" });
    }
  });


  app.get("/api/parent-messages/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });


  app.get("/api/parent-messages/thread/:threadId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const messages = await storage.getMessagesForThread(req.params.threadId);
      await storage.markMessagesAsRead(req.params.threadId, userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to get messages" });
    }
  });


  app.post("/api/parent-messages/thread", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { recipientUserId, linkId } = req.body;
      if (!recipientUserId) { res.status(400).json({ error: "Recipient required" }); return; }
      const thread = await storage.getOrCreateMessageThread(userId, recipientUserId, linkId);
      res.json(thread);
    } catch (error) {
      res.status(500).json({ error: "Failed to get or create thread" });
    }
  });


  app.post("/api/parent-messages/send", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { threadId, content, metadata } = req.body;
      if (!threadId || !content) { res.status(400).json({ error: "Thread ID and content required" }); return; }
      const message = await storage.createParentMessage({ threadId, senderUserId: userId, content, metadata });
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });


  // Homeschool parent: get combined parent+educator view data
  app.get("/api/parent-portal/homeschool-view/:studentUserId", isAuthenticated, async (req: any, res) => {
    try {
      const parentId = req.user?.claims?.sub;
      const parent = await storage.getUser(parentId);
      if (!parent || parent.role !== "homeschool_parent") {
        res.status(403).json({ error: "Only homeschool parents can access this view" }); return;
      }
      const link = await storage.getParentStudentLinkByUsers(parentId, req.params.studentUserId);
      if (!link || link.status !== "active") {
        res.status(403).json({ error: "No active connection to this student" }); return;
      }
      const [studentData, classes, assignments] = await Promise.all([
        storage.getUser(req.params.studentUserId),
        storage.getClasses(parentId).catch(() => []),
        storage.getAssignmentsByClass ? storage.getAssignmentsByClass(parentId).catch(() => []) : Promise.resolve([]),
      ]);
      res.json({ parentView: { link }, educatorView: { classes, assignments }, student: studentData ? { id: studentData.id, firstName: studentData.firstName, lastName: studentData.lastName } : null });
    } catch (error) {
      res.status(500).json({ error: "Failed to load homeschool view" });
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
}
