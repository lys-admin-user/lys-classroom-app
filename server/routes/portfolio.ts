import type { Express } from "express";
import { storage } from "../storage";
import { parentalConsents as parentalConsentsTable } from "@shared/schema";
import { z } from "zod";
import { isAuthenticated } from "../replit_integrations/auth";
import multer from "multer";
import { db } from "../db";
import { eq, and, count } from "drizzle-orm";
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

// AUTO-SPLIT from server/routes.ts -- domain: portfolio (24 routes)
export function registerPortfolioRoutes(app: Express): void {


  // ====================================================
  // PORTFOLIO REPORTS (teacher oversight)
  // ====================================================

  app.get("/api/portfolio-reports", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user || !["educator", "campus_admin", "district_admin", "site_admin", "system_admin"].includes(user.role || "")) {
        res.status(403).json({ error: "Only educators can view portfolio reports" }); return;
      }
      const reports = await storage.getPortfolioReports({
        studentUserId: req.query.studentUserId as string | undefined,
        status: req.query.status as string | undefined,
      });
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to get portfolio reports" });
    }
  });


  app.post("/api/portfolio-reports", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user || !["educator", "campus_admin", "district_admin", "site_admin", "system_admin"].includes(user.role || "")) {
        res.status(403).json({ error: "Only educators can report portfolio items" }); return;
      }
      const report = await storage.createPortfolioReport({ ...req.body, reportedByUserId: userId });
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to create portfolio report" });
    }
  });


  app.patch("/api/portfolio-reports/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user || !["campus_admin", "district_admin", "site_admin", "system_admin"].includes(user.role || "")) {
        res.status(403).json({ error: "Only admins can resolve portfolio reports" }); return;
      }
      const updated = await storage.updatePortfolioReport(req.params.id, { ...req.body, resolvedByUserId: userId, resolvedAt: new Date() });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update portfolio report" });
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
          const { isCoppaRestricted } = await import("../services/dataGovernance");
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
      const userId = req.user?.claims?.sub;
      const { portfolioId } = req.params;
      const dbUser = await storage.getUser(userId);
      const userRole = dbUser?.role;
      
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
      if (userRole === "homeschool_parent") {
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
      const userId = req.user?.claims?.sub;
      const { itemId } = req.params;
      const dbUser2 = await storage.getUser(userId);
      const userRole = dbUser2?.role;
      
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
      if (userRole === "homeschool_parent") {
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
      const userId = req.user?.claims?.sub;
      const { portfolioId } = req.params;
      const { content, portfolioItemId } = req.body;
      const dbUser3 = await storage.getUser(userId);
      const userRole = dbUser3?.role;
      
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
      const isParent = userRole === "homeschool_parent";
      
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
      const userId = req.user?.claims?.sub;
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
      const userId = req.user?.claims?.sub;
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


  // ===========================================
  // STUDENT NARRATIVES (BE Pillar)
  // ===========================================
  
  app.get("/api/narratives", isAuthenticated, async (req: any, res) => {
    try {
      const narratives = await storage.getStudentNarratives(req.user?.claims?.sub);
      res.json(narratives);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch narratives" });
    }
  });


  app.get("/api/narratives/:id", isAuthenticated, async (req: any, res) => {
    try {
      const narrative = await storage.getStudentNarrative(req.params.id);
      if (!narrative || narrative.userId !== req.user?.claims?.sub) {
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
        userId: req.user?.claims?.sub,
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
      const narrative = await storage.updateStudentNarrative(req.params.id, updates, req.user?.claims?.sub);
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
      const success = await storage.deleteStudentNarrative(req.params.id, req.user?.claims?.sub);
      if (!success) {
        res.status(404).json({ error: "Narrative not found" });
        return;
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete narrative" });
    }
  });
}
