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

// AUTO-SPLIT from server/storage/database.ts -- domain: collaboration (19 methods)
// The `ThisType<DatabaseStorage>` annotation tells TypeScript that `this`
// inside these methods is a full DatabaseStorage instance, so cross-domain
// `this.someOtherMethod(...)` calls type-check correctly.
const collaborationMethods: ThisType<DatabaseStorage> = {


  // ================================
  // Real-Time Collaboration System
  // ================================

  // Collaboration Sessions
  async getCollaborationSessions(userId: string): Promise<CollaborationSession[]> {
    return await db.select().from(collaborationSessions)
      .where(eq(collaborationSessions.hostUserId, userId))
      .orderBy(desc(collaborationSessions.createdAt));
  },


  async getActiveCollaborationSessions(userId: string): Promise<CollaborationSession[]> {
    return await db.select().from(collaborationSessions)
      .where(and(
        eq(collaborationSessions.hostUserId, userId),
        eq(collaborationSessions.status, "active")
      ))
      .orderBy(desc(collaborationSessions.createdAt));
  },


  async getCollaborationSession(id: string): Promise<CollaborationSession | undefined> {
    const [result] = await db.select().from(collaborationSessions)
      .where(eq(collaborationSessions.id, id));
    return result || undefined;
  },


  async getCollaborationSessionByInviteCode(inviteCode: string): Promise<CollaborationSession | undefined> {
    const [result] = await db.select().from(collaborationSessions)
      .where(eq(collaborationSessions.inviteCode, inviteCode));
    return result || undefined;
  },


  async createCollaborationSession(session: InsertCollaborationSession): Promise<CollaborationSession> {
    const [created] = await db.insert(collaborationSessions)
      .values(session as any)
      .returning();
    return created;
  },


  async updateCollaborationSession(id: string, updates: Partial<CollaborationSession>, hostUserId: string): Promise<CollaborationSession | undefined> {
    const existing = await this.getCollaborationSession(id);
    if (!existing || existing.hostUserId !== hostUserId) return undefined;
    
    const [updated] = await db.update(collaborationSessions)
      .set(updates)
      .where(eq(collaborationSessions.id, id))
      .returning();
    return updated || undefined;
  },


  async endCollaborationSession(id: string, hostUserId: string): Promise<CollaborationSession | undefined> {
    return await this.updateCollaborationSession(id, { 
      status: "ended", 
      endedAt: new Date() 
    }, hostUserId);
  },


  // Collaboration Messages
  async getCollaborationMessages(sessionId: string, limit = 50): Promise<CollaborationMessage[]> {
    return await db.select().from(collaborationMessages)
      .where(eq(collaborationMessages.sessionId, sessionId))
      .orderBy(desc(collaborationMessages.createdAt))
      .limit(limit);
  },


  async createCollaborationMessage(message: InsertCollaborationMessage): Promise<CollaborationMessage> {
    const [created] = await db.insert(collaborationMessages)
      .values(message as any)
      .returning();
    return created;
  },


  // Organization Invitations
  async getOrgInvitations(orgId: string): Promise<OrgInvitation[]> {
    return await db.select().from(organizationInvitations)
      .where(eq(organizationInvitations.organizationId, orgId));
  },


  async getOrgInvitationByToken(token: string): Promise<OrgInvitation | undefined> {
    const [result] = await db.select().from(organizationInvitations)
      .where(eq(organizationInvitations.token, token));
    return result || undefined;
  },


  async createOrgInvitation(invitation: InsertOrgInvitation): Promise<OrgInvitation> {
    const [created] = await db.insert(organizationInvitations).values(invitation as any).returning();
    return created;
  },


  async acceptOrgInvitation(token: string, userId: string): Promise<OrgMembership | undefined> {
    const invitation = await this.getOrgInvitationByToken(token);
    if (!invitation || invitation.acceptedAt || new Date() > invitation.expiresAt) {
      return undefined;
    }
    
    await db.update(organizationInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(organizationInvitations.id, invitation.id));
    
    const membership = await this.createOrgMembership({
      organizationId: invitation.organizationId,
      userId,
      role: invitation.role || "member",
      status: "active",
      invitedBy: invitation.invitedBy,
      invitedAt: invitation.createdAt,
      joinedAt: new Date(),
    });
    
    return membership;
  },


  async deleteOrgInvitation(id: string): Promise<boolean> {
    await db.delete(organizationInvitations).where(eq(organizationInvitations.id, id));
    return true;
  },


  // Parent Messages (1-to-1)
  async getOrCreateMessageThread(participantA: string, participantB: string, linkId?: string): Promise<ParentMessageThread> {
    const [existing] = await db.select().from(parentMessageThreads).where(
      sql`(${parentMessageThreads.participantA} = ${participantA} AND ${parentMessageThreads.participantB} = ${participantB})
       OR (${parentMessageThreads.participantA} = ${participantB} AND ${parentMessageThreads.participantB} = ${participantA})`
    );
    if (existing) return existing;
    const [created] = await db.insert(parentMessageThreads).values({ participantA, participantB, linkId } as any).returning();
    return created;
  },


  async getMessageThreadsForUser(userId: string): Promise<(ParentMessageThread & { lastMessage?: ParentMessage; otherParticipant?: any })[]> {
    const threads = await db.select().from(parentMessageThreads).where(
      sql`${parentMessageThreads.participantA} = ${userId} OR ${parentMessageThreads.participantB} = ${userId}`
    ).orderBy(desc(parentMessageThreads.lastMessageAt));

    return await Promise.all(threads.map(async (thread) => {
      const [lastMessage] = await db.select().from(parentMessages).where(eq(parentMessages.threadId, thread.id)).orderBy(desc(parentMessages.createdAt)).limit(1);
      const otherId = thread.participantA === userId ? thread.participantB : thread.participantA;
      const [otherUser] = await db.select().from(users).where(eq(users.id, otherId));
      return { ...thread, lastMessage: lastMessage || undefined, otherParticipant: otherUser ? { id: otherUser.id, firstName: otherUser.firstName, lastName: otherUser.lastName, profileImageUrl: otherUser.profileImageUrl, role: otherUser.role } : undefined };
    }));
  },


  async getMessagesForThread(threadId: string, limit = 50): Promise<ParentMessage[]> {
    return await db.select().from(parentMessages).where(eq(parentMessages.threadId, threadId)).orderBy(asc(parentMessages.createdAt)).limit(limit);
  },


  async markMessagesAsRead(threadId: string, userId: string): Promise<void> {
    await db.update(parentMessages).set({ isRead: true } as any).where(
      and(eq(parentMessages.threadId, threadId), sql`${parentMessages.senderUserId} != ${userId}`, eq(parentMessages.isRead, false))
    );
  },


  async getUnreadMessageCount(userId: string): Promise<number> {
    const threads = await db.select().from(parentMessageThreads).where(
      sql`${parentMessageThreads.participantA} = ${userId} OR ${parentMessageThreads.participantB} = ${userId}`
    );
    if (threads.length === 0) return 0;
    const threadIds = threads.map(t => t.id);
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(parentMessages).where(
      and(
        sql`${parentMessages.threadId} IN (${sql.join(threadIds.map(id => sql`${id}`), sql`, `)})`,
        sql`${parentMessages.senderUserId} != ${userId}`,
        eq(parentMessages.isRead, false)
      )
    );
    return Number(result?.count || 0);
  },
};

Object.assign(DatabaseStorage.prototype, collaborationMethods);
