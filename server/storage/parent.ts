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

// AUTO-SPLIT from server/storage/database.ts -- domain: parent (31 methods)
// The `ThisType<DatabaseStorage>` annotation tells TypeScript that `this`
// inside these methods is a full DatabaseStorage instance, so cross-domain
// `this.someOtherMethod(...)` calls type-check correctly.
const parentMethods: ThisType<DatabaseStorage> = {


  // Parent Portal
  async getParentStudentLinks(userId: string, role: 'parent' | 'student'): Promise<ParentStudentLink[]> {
    if (role === 'parent') {
      return await db.select().from(parentStudentLinks)
        .where(eq(parentStudentLinks.parentUserId, userId))
        .orderBy(desc(parentStudentLinks.createdAt));
    } else {
      return await db.select().from(parentStudentLinks)
        .where(eq(parentStudentLinks.studentUserId, userId))
        .orderBy(desc(parentStudentLinks.createdAt));
    }
  },


  async getParentStudentLink(id: string): Promise<ParentStudentLink | undefined> {
    const [result] = await db.select().from(parentStudentLinks)
      .where(eq(parentStudentLinks.id, id));
    return result || undefined;
  },


  async getParentStudentLinkByUsers(parentUserId: string, studentUserId: string): Promise<ParentStudentLink | undefined> {
    const [result] = await db.select().from(parentStudentLinks)
      .where(and(
        eq(parentStudentLinks.parentUserId, parentUserId),
        eq(parentStudentLinks.studentUserId, studentUserId)
      ));
    return result || undefined;
  },


  async createParentStudentLink(link: InsertParentStudentLink): Promise<ParentStudentLink> {
    const [created] = await db.insert(parentStudentLinks).values(link as any).returning();
    return created;
  },


  async updateParentStudentLink(id: string, updates: Partial<ParentStudentLink>): Promise<ParentStudentLink | undefined> {
    const [updated] = await db.update(parentStudentLinks)
      .set(updates)
      .where(eq(parentStudentLinks.id, id))
      .returning();
    return updated || undefined;
  },


  async deleteParentStudentLink(id: string): Promise<boolean> {
    await db.delete(parentStudentLinks).where(eq(parentStudentLinks.id, id));
    return true;
  },


  // Parent Invitations
  async getParentInvitations(studentUserId: string): Promise<ParentInvitation[]> {
    return await db.select().from(parentInvitations)
      .where(eq(parentInvitations.studentUserId, studentUserId))
      .orderBy(desc(parentInvitations.createdAt));
  },


  async getParentInvitationByToken(token: string): Promise<ParentInvitation | undefined> {
    const [result] = await db.select().from(parentInvitations)
      .where(eq(parentInvitations.token, token));
    return result || undefined;
  },


  async createParentInvitation(invitation: InsertParentInvitation): Promise<ParentInvitation> {
    const [created] = await db.insert(parentInvitations).values(invitation as any).returning();
    return created;
  },


  async updateParentInvitation(id: string, updates: Partial<ParentInvitation>): Promise<ParentInvitation | undefined> {
    const [updated] = await db.update(parentInvitations)
      .set(updates)
      .where(eq(parentInvitations.id, id))
      .returning();
    return updated || undefined;
  },


  async acceptParentInvitation(token: string, parentUserId: string): Promise<ParentStudentLink | undefined> {
    const invitation = await this.getParentInvitationByToken(token);
    if (!invitation || invitation.status !== 'pending' || new Date() > invitation.expiresAt) {
      return undefined;
    }
    
    await db.update(parentInvitations)
      .set({ status: 'accepted', acceptedAt: new Date() })
      .where(eq(parentInvitations.id, invitation.id));
    
    const link = await this.createParentStudentLink({
      parentUserId,
      studentUserId: invitation.studentUserId,
      relationship: invitation.relationship,
      status: 'active',
      acceptedAt: new Date(),
    });
    
    return link;
  },


  async deleteParentInvitation(id: string): Promise<boolean> {
    await db.delete(parentInvitations).where(eq(parentInvitations.id, id));
    return true;
  },


  // Parent Progress Notes
  async getParentProgressNotes(linkId: string): Promise<ParentProgressNote[]> {
    return await db.select().from(parentProgressNotes)
      .where(eq(parentProgressNotes.linkId, linkId))
      .orderBy(desc(parentProgressNotes.createdAt));
  },


  async createParentProgressNote(note: InsertParentProgressNote): Promise<ParentProgressNote> {
    const [created] = await db.insert(parentProgressNotes).values(note as any).returning();
    return created;
  },


  async deleteParentProgressNote(id: string, parentUserId: string): Promise<boolean> {
    await db.delete(parentProgressNotes).where(
      and(
        eq(parentProgressNotes.id, id),
        eq(parentProgressNotes.parentUserId, parentUserId)
      )
    );
    return true;
  },


  async getPendingParentRequests(educatorId: string): Promise<any[]> {
    // Get all classes taught by this educator
    const educatorClasses = await db.select().from(classes).where(eq(classes.userId, educatorId));
    if (educatorClasses.length === 0) return [];
    
    const classIds = educatorClasses.map(c => c.id);
    
    // Get all enrolled students in educator's classes
    const enrollments = await db.select().from(classStudents)
      .where(sql`${classStudents.classId} IN (${sql.join(classIds.map(id => sql`${id}`), sql`, `)})`);
    
    if (enrollments.length === 0) return [];
    
    const studentIds = enrollments.map(e => e.studentId);
    
    // Get students to get their userIds
    const enrolledStudents = await db.select().from(students)
      .where(sql`${students.id} IN (${sql.join(studentIds.map(id => sql`${id}`), sql`, `)})`);
    
    if (enrolledStudents.length === 0) return [];
    
    const studentUserIds = enrolledStudents.map(s => s.userId);
    
    // Get pending parent connection requests for these students
    const pendingLinks = await db.select().from(parentStudentLinks)
      .where(and(
        sql`${parentStudentLinks.studentUserId} IN (${sql.join(studentUserIds.map(id => sql`${id}`), sql`, `)})`,
        eq(parentStudentLinks.status, "pending")
      ));
    
    // Enrich with user info
    const enrichedRequests = await Promise.all(pendingLinks.map(async (link) => {
      const [parent] = await db.select().from(users).where(eq(users.id, link.parentUserId));
      const [studentUser] = await db.select().from(users).where(eq(users.id, link.studentUserId));
      const student = enrolledStudents.find(s => s.userId === link.studentUserId);
      
      return {
        ...link,
        parent: parent ? { id: parent.id, firstName: parent.firstName, lastName: parent.lastName, email: parent.email } : null,
        student: student ? { id: student.id, firstName: student.firstName, lastName: student.lastName, gradeLevel: student.gradeLevel } : null,
        studentUser: studentUser ? { id: studentUser.id, firstName: studentUser.firstName, lastName: studentUser.lastName } : null
      };
    }));
    
    return enrichedRequests;
  },


  // Magic Link
  async getParentInvitationByMagicToken(magicToken: string): Promise<ParentInvitation | undefined> {
    const [inv] = await db.select().from(parentInvitations).where(eq(parentInvitations.magicToken, magicToken));
    return inv || undefined;
  },


  // Quiet Hours
  async getQuietHours(orgId?: string, teacherUserId?: string): Promise<QuietHours[]> {
    const conditions = [];
    if (orgId) conditions.push(eq(quietHours.orgId, orgId));
    if (teacherUserId) conditions.push(eq(quietHours.teacherUserId, teacherUserId));
    const query = conditions.length > 0
      ? db.select().from(quietHours).where(and(...conditions))
      : db.select().from(quietHours);
    return await query.orderBy(asc(quietHours.startTime));
  },


  async getQuietHoursById(id: string): Promise<QuietHours | undefined> {
    const [qh] = await db.select().from(quietHours).where(eq(quietHours.id, id));
    return qh || undefined;
  },


  async createQuietHours(qh: InsertQuietHours): Promise<QuietHours> {
    const [created] = await db.insert(quietHours).values(qh as any).returning();
    return created;
  },


  async updateQuietHours(id: string, updates: Partial<QuietHours>): Promise<QuietHours | undefined> {
    const [updated] = await db.update(quietHours).set({ ...updates, updatedAt: new Date() } as any).where(eq(quietHours.id, id)).returning();
    return updated || undefined;
  },


  async deleteQuietHours(id: string): Promise<boolean> {
    await db.delete(quietHours).where(eq(quietHours.id, id));
    return true;
  },


  async isQuietHoursActive(orgId?: string, teacherUserId?: string): Promise<boolean> {
    const allQH = await this.getQuietHours(orgId, teacherUserId);
    if (allQH.length === 0) return false;
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return allQH.some(qh => {
      if (!qh.isActive) return false;
      const days = (qh.daysOfWeek as number[]) || [];
      if (!days.includes(currentDay)) return false;
      return currentTime >= qh.startTime && currentTime <= qh.endTime;
    });
  },


  // Parent Broadcast Posts
  async getParentBroadcastPosts(filters?: { orgId?: string; classId?: string; audience?: string }): Promise<ParentBroadcastPost[]> {
    const conditions = [eq(parentBroadcastPosts.isActive, true)];
    if (filters?.orgId) conditions.push(eq(parentBroadcastPosts.orgId, filters.orgId));
    if (filters?.classId) conditions.push(eq(parentBroadcastPosts.classId, filters.classId));
    if (filters?.audience) conditions.push(eq(parentBroadcastPosts.audience, filters.audience));
    return await db.select().from(parentBroadcastPosts).where(and(...conditions)).orderBy(desc(parentBroadcastPosts.isPinned), desc(parentBroadcastPosts.createdAt));
  },


  async getParentBroadcastPost(id: string): Promise<ParentBroadcastPost | undefined> {
    const [post] = await db.select().from(parentBroadcastPosts).where(eq(parentBroadcastPosts.id, id));
    return post || undefined;
  },


  async createParentBroadcastPost(post: InsertParentBroadcastPost): Promise<ParentBroadcastPost> {
    const [created] = await db.insert(parentBroadcastPosts).values(post as any).returning();
    return created;
  },


  async updateParentBroadcastPost(id: string, updates: Partial<ParentBroadcastPost>): Promise<ParentBroadcastPost | undefined> {
    const [updated] = await db.update(parentBroadcastPosts).set({ ...updates, updatedAt: new Date() } as any).where(eq(parentBroadcastPosts.id, id)).returning();
    return updated || undefined;
  },


  async deleteParentBroadcastPost(id: string): Promise<boolean> {
    await db.update(parentBroadcastPosts).set({ isActive: false } as any).where(eq(parentBroadcastPosts.id, id));
    return true;
  },


  // Parent Notification Preferences
  async getParentNotificationPreferences(parentUserId: string, linkId: string): Promise<ParentNotificationPreferences | undefined> {
    const [prefs] = await db.select().from(parentNotificationPreferences)
      .where(and(eq(parentNotificationPreferences.parentUserId, parentUserId), eq(parentNotificationPreferences.linkId, linkId)));
    return prefs || undefined;
  },


  async upsertParentNotificationPreferences(prefs: InsertParentNotificationPreferences): Promise<ParentNotificationPreferences> {
    const existing = await this.getParentNotificationPreferences(prefs.parentUserId, prefs.linkId);
    if (existing) {
      const [updated] = await db.update(parentNotificationPreferences)
        .set({ preferences: prefs.preferences, updatedAt: new Date() } as any)
        .where(eq(parentNotificationPreferences.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(parentNotificationPreferences).values(prefs as any).returning();
    return created;
  },


  async createParentMessage(message: InsertParentMessage): Promise<ParentMessage> {
    const [created] = await db.insert(parentMessages).values(message as any).returning();
    await db.update(parentMessageThreads).set({ lastMessageAt: new Date() } as any).where(eq(parentMessageThreads.id, message.threadId));
    return created;
  },
};

Object.assign(DatabaseStorage.prototype, parentMethods);
