import type { Express } from "express";
import { storage } from "../storage";
import { users } from "@shared/schema";
import { z } from "zod";
import { isAuthenticated } from "../replit_integrations/auth";
import multer from "multer";
import { and, count } from "drizzle-orm";
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

// AUTO-SPLIT from server/routes.ts -- domain: marketplace (23 routes)
export function registerMarketplaceRoutes(app: Express): void {


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


  // ================================
  // LYS Marketplace
  // ================================

  app.get("/api/marketplace", isAuthenticated, async (req: any, res) => {
    try {
      const { audience, itemType } = req.query;
      const items = await storage.getMarketplaceItems({ isActive: true, audience: audience as string | undefined, itemType: itemType as string | undefined });
      const userId = req.user?.id || req.user?.claims?.sub;
      const purchases = userId ? await storage.getUserPurchases(userId) : [];
      const purchasedIds = new Set(purchases.map((p: any) => p.itemId));
      const result = items.map((item: any) => ({ ...item, owned: purchasedIds.has(item.id) }));
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch marketplace items" });
    }
  });


  app.get("/api/marketplace/:id", isAuthenticated, async (req: any, res) => {
    try {
      const item = await storage.getMarketplaceItem(req.params.id);
      if (!item) return res.status(404).json({ error: "Item not found" });
      const userId = req.user?.id || req.user?.claims?.sub;
      const owned = userId ? await storage.hasPurchased(userId, item.id) : false;
      res.json({ ...item, owned });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch marketplace item" });
    }
  });


  app.post("/api/marketplace/:id/claim", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const item = await storage.getMarketplaceItem(req.params.id);
      if (!item) return res.status(404).json({ error: "Item not found" });
      if (item.price !== 0) return res.status(400).json({ error: "This item requires payment" });
      const alreadyOwned = await storage.hasPurchased(userId, item.id);
      if (alreadyOwned) return res.json({ success: true, message: "Already claimed" });
      await storage.createPurchase({ userId, itemId: item.id, amountPaid: 0, status: "completed" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to claim item" });
    }
  });


  // ================================
  // Marketplace Wishlist
  // ================================

  app.get("/api/marketplace/wishlist", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const wishlist = await storage.getWishlist(userId);
      const itemIds = wishlist.map((w: any) => w.itemId);
      const items: any[] = [];
      for (const id of itemIds) {
        const item = await storage.getMarketplaceItem(id);
        if (item) items.push({ ...item, wishlisted: true });
      }
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wishlist" });
    }
  });


  app.post("/api/marketplace/:id/wishlist", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      await storage.addToWishlist(userId, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to add to wishlist" });
    }
  });


  app.delete("/api/marketplace/:id/wishlist", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      await storage.removeFromWishlist(userId, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove from wishlist" });
    }
  });


  // ================================
  // Marketplace Ratings
  // ================================

  app.get("/api/marketplace/:id/ratings", isAuthenticated, async (req: any, res) => {
    try {
      const [ratings, avgData] = await Promise.all([
        storage.getRatingsForItem(req.params.id),
        storage.getItemAverageRating(req.params.id),
      ]);
      const userId = req.user?.id || req.user?.claims?.sub;
      const userRating = userId ? await storage.getUserRating(userId, req.params.id) : undefined;
      res.json({ ratings, avg: avgData.avg, count: avgData.count, userRating: userRating || null });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ratings" });
    }
  });


  app.post("/api/marketplace/:id/rate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const { rating, review } = req.body;
      if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "Rating must be between 1 and 5" });
      const owned = await storage.hasPurchased(userId, req.params.id);
      const result = await storage.upsertRating(userId, req.params.id, rating, review, owned);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit rating" });
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
      
      const { AFFILIATE_POINT_CONFIG, AFFILIATE_CONVERSION_RATE } = await import("@shared/schema");
      const points = (AFFILIATE_POINT_CONFIG as Record<string, number>)[eventType] || 0;
      
      const event = await storage.createReferralEvent({
        affiliateId: affiliate.id,
        shareId: shareId || null,
        eventType,
        channel: channel || "direct",
        visitorId: visitorId || null,
        pointsEarned: points,
      });
      
      if (points > 0) {
        await storage.createAffiliateReward({
          affiliateId: affiliate.id,
          points,
          rewardType: "earned",
          description: `${eventType} from ${channel || "direct"} link`,
          eventId: event.id,
        });

        await storage.createWalletTransaction({
          affiliateId: affiliate.id,
          type: "points_earned",
          pointsAmount: points,
          cashAmountCents: 0,
          description: `Earned ${points} pts for ${eventType}`,
          status: "completed",
        });
      }

      if (affiliate.parentAffiliateId && points > 0) {
        const tier2Points = Math.floor(points * AFFILIATE_CONVERSION_RATE.tier2CommissionPercent / 100);
        if (tier2Points > 0) {
          const parent = await storage.getEducatorAffiliateById(affiliate.parentAffiliateId);
          if (parent) {
            await storage.createReferralEvent({
              affiliateId: parent.id,
              eventType: "tier2_commission",
              channel: "tier2",
              pointsEarned: tier2Points,
              metadata: { sourceAffiliateId: affiliate.id, originalEvent: eventType },
            });
            await storage.createAffiliateReward({
              affiliateId: parent.id,
              points: tier2Points,
              rewardType: "bonus",
              description: `Tier-2 commission from ${affiliate.referralCode}: ${eventType}`,
            });
            await storage.createWalletTransaction({
              affiliateId: parent.id,
              type: "tier2_commission",
              pointsAmount: tier2Points,
              cashAmountCents: 0,
              description: `Tier-2 bonus: ${tier2Points} pts from sub-affiliate`,
              status: "completed",
            });
            await storage.updateEducatorAffiliate(parent.userId, {
              tier2EarningsTotal: (parent.tier2EarningsTotal || 0) + tier2Points,
              totalPoints: (parent.totalPoints || 0) + tier2Points,
            });
          }
        }
      }

      if (eventType === "signup" && affiliate.affiliateMode !== "pro") {
        const updatedAffiliate = await storage.getEducatorAffiliateById(affiliate.id);
        if (updatedAffiliate && (updatedAffiliate.totalReferrals || 0) >= AFFILIATE_CONVERSION_RATE.proUpgradeThreshold) {
          await storage.upgradeToProMode(affiliate.id);
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Track referral error:", error);
      res.status(500).json({ error: "Failed to track referral" });
    }
  });


  // ================================
  // Hybrid Affiliate Wallet & Integrations
  // ================================

  app.get("/api/affiliate/wallet", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const affiliate = await storage.getEducatorAffiliate(userId);
      if (!affiliate) {
        res.status(404).json({ error: "Affiliate profile not found" });
        return;
      }

      const transactions = await storage.getWalletTransactions(affiliate.id, 50);
      const { AFFILIATE_CONVERSION_RATE } = await import("@shared/schema");

      res.json({
        pointsBalance: affiliate.totalPoints || 0,
        cashBalanceCents: affiliate.cashBalance || 0,
        affiliateMode: affiliate.affiliateMode || "student",
        canConvert: (affiliate.totalPoints || 0) >= AFFILIATE_CONVERSION_RATE.minimumPointsToConvert,
        conversionRate: AFFILIATE_CONVERSION_RATE,
        transactions,
      });
    } catch (error) {
      console.error("Get wallet error:", error);
      res.status(500).json({ error: "Failed to get wallet" });
    }
  });


  app.post("/api/affiliate/convert", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { pointsToConvert } = req.body;

      if (!pointsToConvert || typeof pointsToConvert !== "number" || pointsToConvert <= 0) {
        res.status(400).json({ error: "Invalid points amount" });
        return;
      }

      const affiliate = await storage.getEducatorAffiliate(userId);
      if (!affiliate) {
        res.status(404).json({ error: "Affiliate profile not found" });
        return;
      }

      const result = await storage.convertPointsToCash(affiliate.id, pointsToConvert);
      if (!result.success) {
        const { AFFILIATE_CONVERSION_RATE } = await import("@shared/schema");
        res.status(400).json({
          error: "Cannot convert points",
          minimumRequired: AFFILIATE_CONVERSION_RATE.minimumPointsToConvert,
          currentBalance: affiliate.totalPoints || 0,
        });
        return;
      }

      res.json({
        success: true,
        cashCreditedCents: result.cashCents,
        remainingPoints: result.remainingPoints,
        cashDollars: `$${(result.cashCents / 100).toFixed(2)}`,
      });
    } catch (error) {
      console.error("Convert points error:", error);
      res.status(500).json({ error: "Failed to convert points" });
    }
  });


  app.post("/api/affiliate/payout", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { amountCents } = req.body;

      const affiliate = await storage.getEducatorAffiliate(userId);
      if (!affiliate) {
        res.status(404).json({ error: "Affiliate profile not found" });
        return;
      }

      if (affiliate.affiliateMode !== "pro") {
        res.status(403).json({ error: "Cash payouts require Pro affiliate status. Refer 5+ users to upgrade." });
        return;
      }

      const { AFFILIATE_CONVERSION_RATE } = await import("@shared/schema");
      const payoutAmount = amountCents || (affiliate.cashBalance || 0);
      if (payoutAmount < AFFILIATE_CONVERSION_RATE.minimumPayoutCents) {
        res.status(400).json({
          error: `Minimum payout is $${(AFFILIATE_CONVERSION_RATE.minimumPayoutCents / 100).toFixed(2)}`,
          currentBalance: affiliate.cashBalance || 0,
        });
        return;
      }

      if (payoutAmount > (affiliate.cashBalance || 0)) {
        res.status(400).json({ error: "Insufficient cash balance" });
        return;
      }

      const { requestStripeConnectPayout } = await import("../services/affiliateIntegrations");
      const payoutResult = await requestStripeConnectPayout(affiliate, payoutAmount);

      if (payoutResult.success) {
        await storage.updateEducatorAffiliate(userId, {
          cashBalance: (affiliate.cashBalance || 0) - payoutAmount,
        });
        await storage.createWalletTransaction({
          affiliateId: affiliate.id,
          type: "cash_payout",
          pointsAmount: 0,
          cashAmountCents: -payoutAmount,
          description: `Payout of $${(payoutAmount / 100).toFixed(2)}${payoutResult.demoMode ? " (demo)" : ""}`,
          status: payoutResult.demoMode ? "pending" : "completed",
          externalTransactionId: payoutResult.transactionId,
        });
      }

      res.json({
        success: payoutResult.success,
        message: payoutResult.message,
        demoMode: payoutResult.demoMode,
        transactionId: payoutResult.transactionId,
      });
    } catch (error) {
      console.error("Payout error:", error);
      res.status(500).json({ error: "Failed to process payout" });
    }
  });


  app.get("/api/affiliate/tier2", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const affiliate = await storage.getEducatorAffiliate(userId);
      if (!affiliate) {
        res.status(404).json({ error: "Affiliate profile not found" });
        return;
      }

      const subAffiliates = await storage.getTier2Affiliates(affiliate.id);

      res.json({
        parentAffiliate: {
          id: affiliate.id,
          referralCode: affiliate.referralCode,
          tier2EarningsTotal: affiliate.tier2EarningsTotal || 0,
        },
        subAffiliates: subAffiliates.map(sub => ({
          id: sub.id,
          displayName: sub.displayName,
          referralCode: sub.referralCode,
          totalPoints: sub.totalPoints || 0,
          totalReferrals: sub.totalReferrals || 0,
          affiliateMode: sub.affiliateMode,
          createdAt: sub.createdAt,
        })),
        tier2InviteLink: `${req.protocol}://${req.get("host")}?ref=${affiliate.referralCode}&tier=2`,
      });
    } catch (error) {
      console.error("Get tier2 error:", error);
      res.status(500).json({ error: "Failed to get tier-2 network" });
    }
  });


  app.post("/api/affiliate/promo/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { courseName } = req.body;

      const affiliate = await storage.getEducatorAffiliate(userId);
      if (!affiliate) {
        res.status(404).json({ error: "Affiliate profile not found" });
        return;
      }

      const displayName = affiliate.displayName || "An Educator";
      const course = courseName || "LYS Educational Platform";
      const referralLink = `${req.protocol}://${req.get("host")}?ref=${affiliate.referralCode}`;

      let caption = "";
      let imageUrl = "";

      try {
        const openai = (await import("openai")).default;
        const client = new openai();

        const captionResponse = await client.chat.completions.create({
          model: "gpt-4o",
          messages: [{
            role: "user",
            content: `Write a short, professional LinkedIn-style social media caption (2-3 sentences) for an educator named "${displayName}" who recommends "${course}" on the LYS platform. Include a call to action. Do not include hashtags or emojis. Keep it genuine and professional.`,
          }],
          max_tokens: 150,
        });
        caption = captionResponse.choices[0]?.message?.content || `${displayName} recommends ${course} on LYS — empowering the next generation of learners. Start your journey today!`;

        const imageResponse = await client.images.generate({
          model: "dall-e-3",
          prompt: `Professional, clean LinkedIn promotional banner image for an educational platform. Features modern typography reading "${displayName} recommends ${course}" with a gradient background in warm red (#C41E3A) and teal (#006D6F) tones. Include subtle education icons (books, graduation cap, lightbulb). Corporate professional style, no faces or photos of people.`,
          size: "1792x1024",
          quality: "standard",
          n: 1,
        });
        imageUrl = imageResponse.data?.[0]?.url || "";
      } catch (aiError) {
        console.log("AI promo generation unavailable, using fallback:", aiError);
        caption = `${displayName} recommends ${course} on LYS — empowering educators and students through the Be-Know-Do methodology. Join us and start building your path to success!`;
        imageUrl = "";
      }

      const asset = await storage.createPromoAsset({
        affiliateId: affiliate.id,
        imageUrl: imageUrl || null,
        caption,
        courseName: course,
        referralLink,
        status: imageUrl ? "completed" : "text_only",
      });

      res.json({
        asset,
        caption: `${caption}\n\n🔗 ${referralLink}`,
      });
    } catch (error) {
      console.error("Promo generation error:", error);
      res.status(500).json({ error: "Failed to generate promo content" });
    }
  });


  app.get("/api/affiliate/promos", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const affiliate = await storage.getEducatorAffiliate(userId);
      if (!affiliate) {
        res.status(404).json({ error: "Affiliate profile not found" });
        return;
      }

      const promos = await storage.getPromoAssets(affiliate.id);
      res.json(promos);
    } catch (error) {
      console.error("Get promos error:", error);
      res.status(500).json({ error: "Failed to get promo assets" });
    }
  });


  app.get("/api/affiliate/config", async (_req, res) => {
    try {
      const { AFFILIATE_POINT_CONFIG, AFFILIATE_CONVERSION_RATE } = await import("@shared/schema");
      const { getIntegrationStatus } = await import("../services/affiliateIntegrations");

      res.json({
        pointConfig: AFFILIATE_POINT_CONFIG,
        conversionRate: AFFILIATE_CONVERSION_RATE,
        integrations: getIntegrationStatus(),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get affiliate config" });
    }
  });


  app.get("/api/affiliate/integrations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const affiliate = await storage.getEducatorAffiliate(userId);
      if (!affiliate) {
        res.status(404).json({ error: "Affiliate profile not found" });
        return;
      }

      const { getIntegrationStatus, syncExternalCommissions } = await import("../services/affiliateIntegrations");
      const status = getIntegrationStatus();
      const { commissions, demoMode } = await syncExternalCommissions(affiliate);

      res.json({
        integrations: status,
        externalCommissions: commissions,
        demoMode,
        affiliateExternalIds: {
          rewardful: affiliate.externalRewardfulId,
          partnerstack: affiliate.externalPartnerstackId,
          stripeConnect: affiliate.stripeConnectAccountId,
        },
      });
    } catch (error) {
      console.error("Get integrations error:", error);
      res.status(500).json({ error: "Failed to get integrations" });
    }
  });
}
