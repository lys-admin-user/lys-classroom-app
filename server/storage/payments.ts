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

// AUTO-SPLIT from server/storage/database.ts -- domain: payments (9 methods)
// The `ThisType<DatabaseStorage>` annotation tells TypeScript that `this`
// inside these methods is a full DatabaseStorage instance, so cross-domain
// `this.someOtherMethod(...)` calls type-check correctly.
const paymentsMethods: ThisType<DatabaseStorage> = {


  async getActiveTrialByIP(ipAddress: string): Promise<FreeTrial | undefined> {
    const now = new Date();
    const [trial] = await db.select().from(freeTrials)
      .where(and(
        eq(freeTrials.ipAddress, ipAddress),
        eq(freeTrials.isActive, true),
        gte(freeTrials.trialEndDate, now)
      ))
      .orderBy(desc(freeTrials.createdAt))
      .limit(1);
    return trial;
  },


  async getActiveTrialByFingerprint(fingerprint: string): Promise<FreeTrial | undefined> {
    if (!fingerprint) return undefined;
    const now = new Date();
    const [trial] = await db.select().from(freeTrials)
      .where(and(
        eq(freeTrials.fingerprint, fingerprint),
        eq(freeTrials.isActive, true),
        gte(freeTrials.trialEndDate, now)
      ))
      .orderBy(desc(freeTrials.createdAt))
      .limit(1);
    return trial;
  },


  async getActiveTrialByUserId(userId: string): Promise<FreeTrial | undefined> {
    const now = new Date();
    const [trial] = await db.select().from(freeTrials)
      .where(and(
        eq(freeTrials.userId, userId),
        eq(freeTrials.isActive, true),
        gte(freeTrials.trialEndDate, now)
      ))
      .orderBy(desc(freeTrials.createdAt))
      .limit(1);
    return trial;
  },


  async getTrialsByIP(ipAddress: string, sinceDateMs: number): Promise<FreeTrial[]> {
    const sinceDate = new Date(sinceDateMs);
    return db.select().from(freeTrials)
      .where(and(
        eq(freeTrials.ipAddress, ipAddress),
        gte(freeTrials.createdAt, sinceDate)
      ))
      .orderBy(desc(freeTrials.createdAt));
  },


  async getTrialsByFingerprint(fingerprint: string, sinceDateMs: number): Promise<FreeTrial[]> {
    if (!fingerprint) return [];
    const sinceDate = new Date(sinceDateMs);
    return db.select().from(freeTrials)
      .where(and(
        eq(freeTrials.fingerprint, fingerprint),
        gte(freeTrials.createdAt, sinceDate)
      ))
      .orderBy(desc(freeTrials.createdAt));
  },


  async createFreeTrial(trial: InsertFreeTrial): Promise<FreeTrial> {
    const [newTrial] = await db.insert(freeTrials).values(trial as any).returning();
    return newTrial;
  },


  async bindTrialToUser(trialId: string, userId: string): Promise<FreeTrial | undefined> {
    const [updated] = await db.update(freeTrials)
      .set({ userId, updatedAt: new Date() })
      .where(eq(freeTrials.id, trialId))
      .returning();
    return updated;
  },


  async flagTrialAbuse(trialId: string): Promise<FreeTrial | undefined> {
    const [updated] = await db.update(freeTrials)
      .set({ abuseFlags: sql`${freeTrials.abuseFlags} + 1`, updatedAt: new Date() })
      .where(eq(freeTrials.id, trialId))
      .returning();
    return updated;
  },


  async getActiveTrialCount(ipAddress: string, sinceDateMs: number): Promise<number> {
    const sinceDate = new Date(sinceDateMs);
    const result = await db.select({ count: sql<number>`count(*)` }).from(freeTrials)
      .where(and(
        eq(freeTrials.ipAddress, ipAddress),
        gte(freeTrials.createdAt, sinceDate)
      ));
    return Number(result[0]?.count || 0);
  },
};

Object.assign(DatabaseStorage.prototype, paymentsMethods);
