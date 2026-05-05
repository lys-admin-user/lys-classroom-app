import { 
  type Lesson,
  type InsertLesson,
  type Goal,
  type InsertGoal,
  type Career,
  type Resource,
  type Assessment,
  type AssessmentResult,
  type LessonPlan,
  type EducatorProfile,
  type InsertEducatorProfile,
  type FoundationModule,
  type InsertFoundationModule,
  type FoundationProgress,
  foundationModules,
  foundationProgress,
  type User,
  type UserRole,
  type UserTier,
  type UserPreferences,
  type InsertUserPreferences,
  type ScopeSequence,
  type InsertScopeSequence,
  type SequenceUnit,
  type InsertSequenceUnit,
  type ScopeChangeRequest,
  type InsertScopeChangeRequest,
  type SelfDiscoveryResult,
  type InsertSelfDiscoveryResult,
  type SavedCareer,
  type InsertSavedCareer,
  type EducatorAffiliate,
  type InsertEducatorAffiliate,
  type ReferralEvent,
  type CAICountry,
  type InsertReferralEvent,
  type AffiliateReward,
  type InsertAffiliateReward,
  type WalletTransaction,
  type InsertWalletTransaction,
  type PromoAsset,
  type InsertPromoAsset,
  AFFILIATE_CONVERSION_RATE,
  type StandardsJurisdiction,
  type InsertStandardsJurisdiction,
  type StandardSet,
  type InsertStandardSet,
  type EducationalStandard,
  type InsertEducationalStandard,
  type SyncLog,
  type InsertSyncLog,
  type StandardsStaging,
  type InsertStandardsStaging,
  type SourceChecksum,
  type InsertSourceChecksum,
  type PdfImport,
  type InsertPdfImport,
  type Class,
  type InsertClass,
  type Student,
  type InsertStudent,
  type ClassStudent,
  type InsertClassStudent,
  type StudentGroup,
  type InsertStudentGroup,
  type Assignment,
  type InsertAssignment,
  type AssignmentRecipient,
  type InsertAssignmentRecipient,
  type GradeCategory,
  type InsertGradeCategory,
  type StudentGrade,
  type InsertStudentGrade,
  type GradingPeriod,
  type InsertGradingPeriod,
  type CollaborationSession,
  type InsertCollaborationSession,
  type SessionParticipant,
  type InsertSessionParticipant,
  type CollaborationMessage,
  type InsertCollaborationMessage,
  type SharedResource,
  type InsertSharedResource,
  type ResourceLike,
  type InsertResourceLike,
  type KnowResource,
  type InsertKnowResource,
  type Institution,
  type InsertInstitution,
  type ScholarshipScrapeRun,
  type InsertScholarshipScrapeRun,
  type UrlDiscoveryStatus,
  type StudentMatriculationHistory,
  type InsertStudentMatriculationHistory,
  type SystemAchievement,
  type InsertSystemAchievement,
  type StudentAchievement,
  type InsertStudentAchievement,
  studentMatriculationHistory,
  systemAchievements,
  studentAchievements,
  type SessionEditHistory,
  type InsertSessionEditHistory,
  type Organization,
  type InsertOrganization,
  type OrgMembership,
  type InsertOrgMembership,
  type OrgInvitation,
  type InsertOrgInvitation,
  type SiteAdmin,
  type InsertSiteAdmin,
  type ParentStudentLink,
  type InsertParentStudentLink,
  type ParentInvitation,
  type InsertParentInvitation,
  type ParentProgressNote,
  type InsertParentProgressNote,
  type QuietHours,
  type InsertQuietHours,
  type ParentBroadcastPost,
  type InsertParentBroadcastPost,
  type ParentNotificationPreferences,
  type InsertParentNotificationPreferences,
  type PortfolioReport,
  type InsertPortfolioReport,
  type ParentMessageThread,
  type InsertParentMessageThread,
  type ParentMessage,
  type InsertParentMessage,
  type FeatureFlag,
  type InsertFeatureFlag,
  type EmailTemplate,
  type InsertEmailTemplate,
  type StudentTransferRequest,
  type InsertStudentTransferRequest,
  type TransferRequestStatus,
  lessons,
  goals,
  educatorProfiles,
  users,
  userPreferences,
  scopeSequences,
  sequenceUnits,
  scopeChangeRequests,
  selfDiscoveryResults,
  savedCareers,
  educatorAffiliates,
  referralEvents,
  affiliateRewards,
  affiliateWalletTransactions,
  affiliatePromoAssets,
  standardsJurisdictions,
  standardSets,
  educationalStandardsDb,
  standardsSyncLog,
  standardsStaging,
  sourceChecksums,
  pdfImportQueue,
  classes,
  students,
  classStudents,
  studentGroups,
  assignments,
  assignmentRecipients,
  gradeCategories,
  studentGrades,
  gradingPeriods,
  collaborationSessions,
  sessionParticipants,
  collaborationMessages,
  sharedResources,
  resourceLikes,
  knowResources,
  institutions,
  scholarshipScrapeRuns,
  marketplaceItems,
  marketplacePurchases,
  marketplaceWishlists,
  marketplaceRatings,
  savedScholarships,
  resourceReports,
  type ResourceReport,
  type InsertResourceReport,
  REPORT_AUTOHIDE_THRESHOLD,
  type MarketplaceItem,
  type InsertMarketplaceItem,
  type MarketplacePurchase,
  type InsertMarketplacePurchase,
  type MarketplaceWishlist,
  type InsertMarketplaceWishlist,
  type MarketplaceRating,
  type InsertMarketplaceRating,
  type SavedScholarship,
  type InsertSavedScholarship,
  sessionEditHistory,
  organizations,
  organizationMemberships,
  organizationInvitations,
  siteAdmins,
  parentStudentLinks,
  parentInvitations,
  parentProgressNotes,
  quietHours,
  parentBroadcastPosts,
  parentNotificationPreferences,
  portfolioReports,
  parentMessageThreads,
  parentMessages,
  featureFlags,
  emailTemplates,
  studentTransferRequests,
  authorities,
  lyseMilestones,
  workforceTrends,
  alignmentMatrix,
  type Authority,
  type InsertAuthority,
  type LyseMilestone,
  type InsertLyseMilestone,
  type WorkforceTrend,
  type InsertWorkforceTrend,
  type AlignmentMatrix,
  type InsertAlignmentMatrix,
  type EntityShare,
  type InsertEntityShare,
  entityShares,
  lessonGenerations,
  guestLessonGenerations,
  type InsertLessonGeneration,
  type EducatorCareerGoal,
  type InsertEducatorCareerGoal,
  type EducatorSkill,
  type InsertEducatorSkill,
  type PDResource,
  type InsertPDResource,
  type PDRecommendation,
  type InsertPDRecommendation,
  type EducatorPDProgress,
  type InsertEducatorPDProgress,
  educatorCareerGoals,
  educatorSkills,
  pdResources,
  pdRecommendations,
  educatorPDProgress,
  type StudentJourneyProgress,
  type InsertStudentJourneyProgress,
  type StudentJourneyMilestone,
  type InsertStudentJourneyMilestone,
  type StudentJourneyActivity,
  type InsertStudentJourneyActivity,
  type StudentJourneyEntry,
  type InsertStudentJourneyEntry,
  type StudentJourneyProgressHistory,
  type InsertStudentJourneyProgressHistory,
  studentJourneyProgress,
  studentJourneyMilestones,
  studentJourneyActivities,
  studentJourneyEntries,
  studentJourneyProgressHistory,
  type LessonTemplate,
  type InsertLessonTemplate,
  lessonTemplates,
  type StudentPortfolio,
  type InsertStudentPortfolio,
  studentPortfolios,
  type PortfolioItem,
  type InsertPortfolioItem,
  portfolioItems,
  type PortfolioComment,
  type InsertPortfolioComment,
  portfolioComments,
  type SponsoredAccess,
  sponsoredAccess,
  type ContextualSponsorship,
  contextualSponsorships,
  type SisConnection,
  type InsertSisConnection,
  sisConnections,
  type SisSyncHistory,
  type InsertSisSyncHistory,
  sisSyncHistory,
  type SisStudent,
  type InsertSisStudent,
  sisStudents,
  type SisCourse,
  type InsertSisCourse,
  sisCourses,
  type StudentNote,
  type InsertStudentNote,
  studentNotes,
  type AttendanceRecord,
  type InsertAttendanceRecord,
  attendanceRecords,
  type SystemLessonAuthor,
  type InsertSystemLessonAuthor,
  systemLessonAuthors,
  type CampusLessonAuthor,
  type InsertCampusLessonAuthor,
  campusLessonAuthors,
  type MasterLesson,
  type InsertMasterLesson,
  masterLessons,
  type ContentLibraryItem,
  type InsertContentLibrary,
  contentLibrary,
  type LessonBulkImport,
  type InsertLessonBulkImport,
  lessonBulkImports,
  type QuestionBank,
  type InsertQuestionBank,
  questionBanks,
  type AuthorQualityMetrics,
  type InsertAuthorQualityMetrics,
  authorQualityMetrics,
  type AssignmentAlignment,
  type InsertAssignmentAlignment,
  assignmentAlignments,
  type ResourceRating,
  type InsertResourceRating,
  resourceRatings,
  type StudentNarrative,
  type InsertStudentNarrative,
  studentNarratives,
  type StrengthsInventory,
  type InsertStrengthsInventory,
  strengthsInventory,
  type CampusActivity,
  type InsertCampusActivity,
  campusActivities,
  type ScholarshipApplication,
  type InsertScholarshipApplication,
  scholarshipApplications,
  type MentorProfile,
  type InsertMentorProfile,
  mentorProfiles,
  type MentorConnection,
  type InsertMentorConnection,
  mentorConnections,
  type FreeTrial,
  type InsertFreeTrial,
  freeTrials,
  type RssFeed,
  type InsertRssFeed,
  rssFeeds,
  type RssContentItem,
  type InsertRssContentItem,
  rssContentItems,
  type RssContentStatus,
  type RssPlacement,
} from "@shared/schema";
import { db } from "../db";
import { eq, desc, and, asc, gte, sql, or, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

import {
  DatabaseStorage,
  seedResources,
  seedCareers,
  caiCountries,
  type EducatorPerformanceMetric,
  type CampusPerformanceMetric,
  type OrganizationPerformanceMetric,
  type SystemWideStats,
  type MatriculationStats,
  type AchievementStats,
} from "./_base";

// AUTO-SPLIT from server/storage/database.ts -- domain: marketplace (16 methods)
// The `ThisType<DatabaseStorage>` annotation tells TypeScript that `this`
// inside these methods is a full DatabaseStorage instance, so cross-domain
// `this.someOtherMethod(...)` calls type-check correctly.
const marketplaceMethods: ThisType<DatabaseStorage> = {


  // Affiliate System
  async getEducatorAffiliate(userId: string): Promise<EducatorAffiliate | undefined> {
    const [affiliate] = await db.select().from(educatorAffiliates)
      .where(eq(educatorAffiliates.userId, userId));
    return affiliate || undefined;
  },


  async getEducatorAffiliateByCode(referralCode: string): Promise<EducatorAffiliate | undefined> {
    const [affiliate] = await db.select().from(educatorAffiliates)
      .where(eq(educatorAffiliates.referralCode, referralCode));
    return affiliate || undefined;
  },


  async getEducatorAffiliateById(affiliateId: string): Promise<EducatorAffiliate | undefined> {
    const [affiliate] = await db.select().from(educatorAffiliates)
      .where(eq(educatorAffiliates.id, affiliateId));
    return affiliate || undefined;
  },


  async createEducatorAffiliate(affiliate: InsertEducatorAffiliate): Promise<EducatorAffiliate> {
    const [created] = await db.insert(educatorAffiliates).values(affiliate as any).returning();
    return created;
  },


  async updateEducatorAffiliate(userId: string, updates: Partial<EducatorAffiliate>): Promise<EducatorAffiliate | undefined> {
    const [updated] = await db.update(educatorAffiliates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(educatorAffiliates.userId, userId))
      .returning();
    return updated || undefined;
  },


  // Referral Events
  async createReferralEvent(event: InsertReferralEvent): Promise<ReferralEvent> {
    const [created] = await db.insert(referralEvents).values(event as any).returning();
    
    // Update affiliate totals based on event type
    const affiliate = await db.select().from(educatorAffiliates)
      .where(eq(educatorAffiliates.id, event.affiliateId));
    if (affiliate.length > 0) {
      const current = affiliate[0];
      const updates: Partial<EducatorAffiliate> = { updatedAt: new Date() };
      
      if (event.eventType === "view") {
        updates.totalViews = (current.totalViews || 0) + 1;
      } else if (event.eventType === "share" || event.eventType === "copy_link") {
        updates.totalShares = (current.totalShares || 0) + 1;
      } else if (event.eventType === "signup" || event.eventType === "lesson_save") {
        updates.totalReferrals = (current.totalReferrals || 0) + 1;
      }
      
      if (event.pointsEarned && event.pointsEarned > 0) {
        updates.totalPoints = (current.totalPoints || 0) + event.pointsEarned;
      }
      
      await db.update(educatorAffiliates)
        .set(updates)
        .where(eq(educatorAffiliates.id, event.affiliateId));
    }
    
    return created;
  },


  async getReferralEvents(affiliateId: string, limit: number = 50): Promise<ReferralEvent[]> {
    return await db.select().from(referralEvents)
      .where(eq(referralEvents.affiliateId, affiliateId))
      .orderBy(desc(referralEvents.createdAt))
      .limit(limit);
  },


  // Affiliate Rewards
  async createAffiliateReward(reward: InsertAffiliateReward): Promise<AffiliateReward> {
    const [created] = await db.insert(affiliateRewards).values(reward as any).returning();
    return created;
  },


  async getAffiliateRewards(affiliateId: string): Promise<AffiliateReward[]> {
    return await db.select().from(affiliateRewards)
      .where(eq(affiliateRewards.affiliateId, affiliateId))
      .orderBy(desc(affiliateRewards.createdAt));
  },


  async getTier2Affiliates(parentAffiliateId: string): Promise<EducatorAffiliate[]> {
    return await db.select().from(educatorAffiliates)
      .where(eq(educatorAffiliates.parentAffiliateId, parentAffiliateId));
  },


  // Marketplace Items
  async getMarketplaceItems(filters?: { audience?: string; itemType?: string; isActive?: boolean }): Promise<MarketplaceItem[]> {
    const conditions: any[] = [];
    if (filters?.isActive !== undefined) conditions.push(eq(marketplaceItems.isActive, filters.isActive));
    if (filters?.audience) conditions.push(eq(marketplaceItems.audience as any, filters.audience));
    if (filters?.itemType) conditions.push(eq(marketplaceItems.itemType as any, filters.itemType));
    const q = conditions.length > 0
      ? db.select().from(marketplaceItems).where(and(...conditions))
      : db.select().from(marketplaceItems);
    return await q.orderBy(desc(marketplaceItems.featured), desc(marketplaceItems.createdAt));
  },


  async getMarketplaceItem(id: string): Promise<MarketplaceItem | undefined> {
    const [item] = await db.select().from(marketplaceItems).where(eq(marketplaceItems.id, id));
    return item;
  },


  async createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem> {
    const [created] = await db.insert(marketplaceItems).values(item as any).returning();
    return created;
  },


  async updateMarketplaceItem(id: string, updates: Partial<MarketplaceItem>): Promise<MarketplaceItem | undefined> {
    const [updated] = await db.update(marketplaceItems).set({ ...updates, updatedAt: new Date() }).where(eq(marketplaceItems.id, id)).returning();
    return updated;
  },


  async deleteMarketplaceItem(id: string): Promise<boolean> {
    await db.delete(marketplaceItems).where(eq(marketplaceItems.id, id));
    return true;
  },

  
  async getLatestAuthorMetrics(authorId: string): Promise<AuthorQualityMetrics | undefined> {
    const [metrics] = await db.select().from(authorQualityMetrics)
      .where(eq(authorQualityMetrics.authorId, authorId))
      .orderBy(desc(authorQualityMetrics.periodEnd))
      .limit(1);
    return metrics;
  },
};

Object.assign(DatabaseStorage.prototype, marketplaceMethods);
