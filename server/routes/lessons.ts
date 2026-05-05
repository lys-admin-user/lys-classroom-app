import type { Express } from "express";
import { storage } from "../storage";
import { generateLessonPlan } from "../openai";
import { detectAfricanCountryFromText } from "@shared/africaContext";
import {
  generateLessonRequestSchema,
  users,
  type Lesson,
  lessons,
  assignments,
  contentReviewQueue as contentReviewQueueTable,
  needsAnalyzerResponses,
} from "@shared/schema";
import { z } from "zod";
import { isAuthenticated } from "../replit_integrations/auth";
import multer from "multer";
import { db } from "../db";
import { logAuditEvent, getClientIP } from "../services/auditLog";
import { filterChatMessage } from "../services/contentFilter";
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


  // Guest Lesson Generation - limited to 5 total per IP for unauthenticated users
  app.post("/api/lessons/generate-guest", async (req: any, res) => {
    try {
      const validated = generateLessonRequestSchema.parse(req.body);
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
      
      // Check and reserve guest generation (5 total per IP)
      const { success, currentCount } = await storage.tryReserveGuestLessonGeneration(ipAddress, 5, validated.topic);
      if (!success) {
        res.status(403).json({ 
          error: "Guest limit reached", 
          message: "Create a free account to continue generating lessons.",
          guestCount: currentCount,
          limit: 5,
          requiresSignup: true
        });
        return;
      }
      
      const generatedPlan = await generateLessonPlan(validated);
      res.json({ 
        ...generatedPlan, 
        guestUsage: { used: currentCount + 1, limit: 5, remaining: 5 - currentCount - 1 }
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
      res.json({ used: count, limit: 5, remaining: Math.max(0, 5 - count) });
    } catch (error) {
      res.status(500).json({ error: "Failed to check guest usage" });
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
