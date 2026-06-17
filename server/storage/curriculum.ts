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
  type CurriculumShare,
  type InsertCurriculumShare,
  type CurriculumAccessRequest,
  type InsertCurriculumAccessRequest,
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
  curriculumShares,
  curriculumAccessRequests,
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

// AUTO-SPLIT from server/storage/database.ts -- domain: curriculum (79 methods)
// The `ThisType<DatabaseStorage>` annotation tells TypeScript that `this`
// inside these methods is a full DatabaseStorage instance, so cross-domain
// `this.someOtherMethod(...)` calls type-check correctly.
const curriculumMethods: ThisType<DatabaseStorage> = {


  // Goals - stored in database
  async getGoals(userId?: string): Promise<Goal[]> {
    if (userId) {
      return await db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.createdAt));
    }
    return await db.select().from(goals).orderBy(desc(goals.createdAt));
  },


  async getGoal(id: string): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal || undefined;
  },


  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [created] = await db.insert(goals).values({
      ...goal,
      milestones: goal.milestones || [],
    } as any).returning();
    return created;
  },


  async updateGoal(id: string, updates: Partial<Goal>, userId?: string | null): Promise<Goal | undefined> {
    const goal = await this.getGoal(id);
    if (!goal) return undefined;
    if (goal.userId && goal.userId !== userId) return undefined;
    
    const [updated] = await db.update(goals).set(updates).where(eq(goals.id, id)).returning();
    return updated || undefined;
  },


  async deleteGoal(id: string, userId?: string | null): Promise<boolean> {
    const goal = await this.getGoal(id);
    if (!goal) return false;
    if (goal.userId && goal.userId !== userId) return false;
    
    await db.delete(goals).where(eq(goals.id, id));
    return true;
  },


  async updateMilestone(goalId: string, milestoneId: string, completed: boolean, userId?: string | null): Promise<Goal | undefined> {
    const goal = await this.getGoal(goalId);
    if (!goal) return undefined;
    if (goal.userId && goal.userId !== userId) return undefined;

    const updatedMilestones = (goal.milestones as any[]).map((m: any) =>
      m.id === milestoneId ? { ...m, completed } : m
    );
    
    const completedCount = updatedMilestones.filter((m: any) => m.completed).length;
    const progress = updatedMilestones.length > 0 
      ? Math.round((completedCount / updatedMilestones.length) * 100)
      : 0;
    
    let status = goal.status;
    if (progress === 100) {
      status = "completed";
    } else if (progress > 0) {
      status = "in_progress";
    }

    return await this.updateGoal(goalId, { milestones: updatedMilestones, progress, status }, userId);
  },


  // Static data - resources
  async getResources(): Promise<Resource[]> {
    return seedResources;
  },


  async getResource(id: string): Promise<Resource | undefined> {
    return seedResources.find(r => r.id === id);
  },


  // Scope and Sequence
  async getScopeSequences(userId: string): Promise<ScopeSequence[]> {
    return await db.select().from(scopeSequences)
      .where(eq(scopeSequences.userId, userId))
      .orderBy(desc(scopeSequences.createdAt));
  },


  // Recursively resolve all descendant org IDs for a set of root orgs
  async getDescendantOrgIds(rootOrgIds: string[]): Promise<Set<string>> {
    const result = new Set<string>();
    const queue = [...rootOrgIds];
    while (queue.length) {
      const current = queue.shift()!;
      const children = await this.getChildOrganizations(current);
      for (const child of children) {
        if (!result.has(child.id)) {
          result.add(child.id);
          queue.push(child.id);
        }
      }
    }
    return result;
  },


  // Build the curriculum access profile that drives view/list authorization.
  async getCurriculumAccessProfile(userId: string): Promise<{
    isPlatformAdmin: boolean;
    schoolAdminOrgIds: Set<string>;
    memberOrgIds: Set<string>;
    districtVisibleOrgIds: Set<string>;
  }> {
    const user = await this.getUser(userId);
    const isPlatformAdmin = await this.isSiteAdmin(userId);
    const memberships = await this.getUserOrganizations(userId);
    const schoolAdminOrgIds = new Set<string>();
    const memberOrgIds = new Set<string>();
    const districtRootIds: string[] = [];

    for (const m of memberships) {
      memberOrgIds.add(m.organizationId);
      const org: Organization | undefined = await this.getOrganization(m.organizationId);
      if (!org) continue;
      const isOrgAdmin = m.role === "admin" || m.role === "owner";
      if (!isOrgAdmin) continue;
      if (org.type === "school" || org.type === "campus") {
        schoolAdminOrgIds.add(org.id);
      }
      if (org.type === "district" || org.type === "network" || org.type === "charter_network") {
        districtRootIds.push(org.id);
      }
    }

    // Global district_admin role: treat all their orgs as district roots.
    if (user?.role === "district_admin") {
      for (const m of memberships) districtRootIds.push(m.organizationId);
    }

    const descendants = await this.getDescendantOrgIds(districtRootIds);
    const districtVisibleOrgIds = new Set<string>(districtRootIds);
    descendants.forEach(id => districtVisibleOrgIds.add(id));
    return { isPlatformAdmin, schoolAdminOrgIds, memberOrgIds, districtVisibleOrgIds };
  },


  // Can the user VIEW this scope?
  async canViewScope(userId: string, scope: ScopeSequence): Promise<boolean> {
    if (scope.userId === userId) return true;
    if (await this.isSiteAdmin(userId)) return true;
    const share = await this.getCurriculumShareForUser(scope.id, userId);
    if (share) return true;
    if (scope.visibility === "system" && scope.status === "published") return true;

    const profile = await this.getCurriculumAccessProfile(userId);
    const orgIds = [scope.organizationId, scope.campusId].filter(Boolean) as string[];

    // School admins see ALL their school's scopes regardless of visibility/status.
    if (orgIds.some(o => profile.schoolAdminOrgIds.has(o))) return true;

    // Campus-published scopes are visible to members of that school.
    if (scope.status === "published" && scope.visibility === "campus"
        && orgIds.some(o => profile.memberOrgIds.has(o))) return true;

    // District/network admins see PUBLISHED scopes across descendant schools.
    if (scope.status === "published" && orgIds.some(o => profile.districtVisibleOrgIds.has(o))) return true;

    return false;
  },


  // Can the user EDIT this scope's content? Owner, granted edit-collaborator, or platform admin.
  async canEditScope(userId: string, scope: ScopeSequence): Promise<boolean> {
    if (scope.userId === userId) return true;
    if (await this.isSiteAdmin(userId)) return true;
    const share = await this.getCurriculumShareForUser(scope.id, userId);
    return !!share && share.permission === "edit";
  },


  // Can the user MANAGE sharing / approve access requests? Owner, edit-collaborator (owner's assignee), or platform admin.
  async canManageScope(userId: string, scope: ScopeSequence): Promise<boolean> {
    return await this.canEditScope(userId, scope);
  },


  async getScopeSequencesWithHierarchy(userId: string): Promise<ScopeSequence[]> {
    const userScopes = await this.getScopeSequences(userId);
    const byId = new Map<string, ScopeSequence>();
    for (const s of userScopes) byId.set(s.id, s);

    const profile = await this.getCurriculumAccessProfile(userId);

    // Peer-shared scopes (owner -> this user)
    const shares = await db.select().from(curriculumShares)
      .where(eq(curriculumShares.sharedWithUserId, userId));
    for (const sh of shares) {
      if (byId.has(sh.scopeId)) continue;
      const sc = await this.getScopeSequence(sh.scopeId);
      if (sc) byId.set(sc.id, sc);
    }

    // School admin: ALL scopes in their school(s)
    if (profile.schoolAdminOrgIds.size > 0) {
      const ids = Array.from(profile.schoolAdminOrgIds);
      const rows = await db.select().from(scopeSequences).where(
        or(inArray(scopeSequences.organizationId, ids), inArray(scopeSequences.campusId, ids))
      );
      for (const sc of rows) if (!byId.has(sc.id)) byId.set(sc.id, sc);
    }

    // Members: campus-published scopes for their schools
    if (profile.memberOrgIds.size > 0) {
      const ids = Array.from(profile.memberOrgIds);
      const rows = await db.select().from(scopeSequences).where(and(
        eq(scopeSequences.status, "published"),
        eq(scopeSequences.visibility as any, "campus"),
        or(inArray(scopeSequences.organizationId, ids), inArray(scopeSequences.campusId, ids))
      ));
      for (const sc of rows) if (!byId.has(sc.id)) byId.set(sc.id, sc);
    }

    // District/network admin: published scopes across descendant schools
    if (profile.districtVisibleOrgIds.size > 0) {
      const ids = Array.from(profile.districtVisibleOrgIds);
      const rows = await db.select().from(scopeSequences).where(and(
        eq(scopeSequences.status, "published"),
        or(inArray(scopeSequences.organizationId, ids), inArray(scopeSequences.campusId, ids))
      ));
      for (const sc of rows) if (!byId.has(sc.id)) byId.set(sc.id, sc);
    }

    // System-wide published
    const systemScopes = await db.select().from(scopeSequences).where(and(
      eq(scopeSequences.visibility as any, "system"),
      eq(scopeSequences.status, "published")
    ));
    for (const sc of systemScopes) if (!byId.has(sc.id)) byId.set(sc.id, sc);

    return Array.from(byId.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  },


  async getScopeSequence(id: string): Promise<ScopeSequence | undefined> {
    const [scope] = await db.select().from(scopeSequences).where(eq(scopeSequences.id, id));
    return scope || undefined;
  },


  async createScopeSequence(scope: InsertScopeSequence): Promise<ScopeSequence> {
    const [created] = await db.insert(scopeSequences).values(scope as any).returning();
    return created;
  },


  async updateScopeSequence(id: string, updates: Partial<ScopeSequence>, userId: string): Promise<ScopeSequence | undefined> {
    const scope = await this.getScopeSequence(id);
    if (!scope) return undefined;
    if (!(await this.canEditScope(userId, scope))) return undefined;

    const [updated] = await db.update(scopeSequences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(scopeSequences.id, id))
      .returning();
    return updated || undefined;
  },


  async deleteScopeSequence(id: string, userId: string): Promise<boolean> {
    const scope = await this.getScopeSequence(id);
    // Deletion is destructive: restrict to the owner or a platform admin.
    if (!scope) return false;
    if (scope.userId !== userId && !(await this.isSiteAdmin(userId))) return false;

    // Delete associated units, shares, and access requests first
    await db.delete(sequenceUnits).where(eq(sequenceUnits.scopeId, id));
    await db.delete(curriculumShares).where(eq(curriculumShares.scopeId, id));
    await db.delete(curriculumAccessRequests).where(eq(curriculumAccessRequests.scopeId, id));
    await db.delete(scopeSequences).where(eq(scopeSequences.id, id));
    return true;
  },


  // ---- Curriculum sharing (peer share) ----
  async getCurriculumShares(scopeId: string): Promise<CurriculumShare[]> {
    return await db.select().from(curriculumShares)
      .where(eq(curriculumShares.scopeId, scopeId))
      .orderBy(desc(curriculumShares.createdAt));
  },

  async getCurriculumShareForUser(scopeId: string, userId: string): Promise<CurriculumShare | undefined> {
    const [row] = await db.select().from(curriculumShares)
      .where(and(eq(curriculumShares.scopeId, scopeId), eq(curriculumShares.sharedWithUserId, userId)));
    return row || undefined;
  },

  async createCurriculumShare(share: InsertCurriculumShare): Promise<CurriculumShare> {
    const existing = await this.getCurriculumShareForUser(share.scopeId, share.sharedWithUserId);
    if (existing) {
      const [updated] = await db.update(curriculumShares)
        .set({ permission: (share.permission ?? existing.permission) as any, sharedBy: share.sharedBy })
        .where(eq(curriculumShares.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(curriculumShares).values(share as any).returning();
    return created;
  },

  async deleteCurriculumShare(scopeId: string, sharedWithUserId: string): Promise<boolean> {
    await db.delete(curriculumShares)
      .where(and(eq(curriculumShares.scopeId, scopeId), eq(curriculumShares.sharedWithUserId, sharedWithUserId)));
    return true;
  },


  // ---- Curriculum edit-access requests ----
  async getCurriculumAccessRequests(scopeId: string): Promise<CurriculumAccessRequest[]> {
    return await db.select().from(curriculumAccessRequests)
      .where(eq(curriculumAccessRequests.scopeId, scopeId))
      .orderBy(desc(curriculumAccessRequests.createdAt));
  },

  async getCurriculumAccessRequest(id: string): Promise<CurriculumAccessRequest | undefined> {
    const [row] = await db.select().from(curriculumAccessRequests)
      .where(eq(curriculumAccessRequests.id, id));
    return row || undefined;
  },

  async createCurriculumAccessRequest(request: InsertCurriculumAccessRequest & { requesterId: string }): Promise<CurriculumAccessRequest> {
    const [created] = await db.insert(curriculumAccessRequests).values(request as any).returning();
    return created;
  },

  async updateCurriculumAccessRequest(id: string, updates: Partial<CurriculumAccessRequest>): Promise<CurriculumAccessRequest | undefined> {
    const [updated] = await db.update(curriculumAccessRequests)
      .set(updates)
      .where(eq(curriculumAccessRequests.id, id))
      .returning();
    return updated || undefined;
  },


  // Sequence Units
  async getSequenceUnits(scopeId: string): Promise<SequenceUnit[]> {
    return await db.select().from(sequenceUnits)
      .where(eq(sequenceUnits.scopeId, scopeId))
      .orderBy(asc(sequenceUnits.unitNumber));
  },


  async getSequenceUnit(id: string): Promise<SequenceUnit | undefined> {
    const [unit] = await db.select().from(sequenceUnits).where(eq(sequenceUnits.id, id));
    return unit || undefined;
  },


  async createSequenceUnit(unit: InsertSequenceUnit): Promise<SequenceUnit> {
    const [created] = await db.insert(sequenceUnits).values(unit as any).returning();
    return created;
  },


  async updateSequenceUnit(id: string, updates: Partial<SequenceUnit>, userId: string): Promise<SequenceUnit | undefined> {
    const unit = await this.getSequenceUnit(id);
    if (!unit) return undefined;
    
    // Verify user owns the scope
    const scope = await this.getScopeSequence(unit.scopeId);
    if (!scope || scope.userId !== userId) return undefined;
    
    const [updated] = await db.update(sequenceUnits)
      .set(updates)
      .where(eq(sequenceUnits.id, id))
      .returning();
    return updated || undefined;
  },


  async deleteSequenceUnit(id: string, userId: string): Promise<boolean> {
    const unit = await this.getSequenceUnit(id);
    if (!unit) return false;
    
    // Verify user owns the scope
    const scope = await this.getScopeSequence(unit.scopeId);
    if (!scope || scope.userId !== userId) return false;
    
    await db.delete(sequenceUnits).where(eq(sequenceUnits.id, id));
    return true;
  },


  // Scope Change Requests
  async getScopeChangeRequests(scopeId: string): Promise<ScopeChangeRequest[]> {
    return await db.select().from(scopeChangeRequests)
      .where(eq(scopeChangeRequests.scopeId, scopeId))
      .orderBy(desc(scopeChangeRequests.createdAt));
  },


  async createScopeChangeRequest(request: InsertScopeChangeRequest): Promise<ScopeChangeRequest> {
    const [created] = await db.insert(scopeChangeRequests).values(request as any).returning();
    return created;
  },


  async updateScopeChangeRequest(id: string, updates: Partial<ScopeChangeRequest>): Promise<ScopeChangeRequest | undefined> {
    const [updated] = await db.update(scopeChangeRequests)
      .set(updates)
      .where(eq(scopeChangeRequests.id, id))
      .returning();
    return updated || undefined;
  },


  async getStandardSets(jurisdictionId: string): Promise<StandardSet[]> {
    return await db.select().from(standardSets)
      .where(eq(standardSets.jurisdictionId, jurisdictionId))
      .orderBy(asc(standardSets.title));
  },


  async getStandardSet(id: string): Promise<StandardSet | undefined> {
    const [result] = await db.select().from(standardSets)
      .where(eq(standardSets.id, id));
    return result || undefined;
  },


  async getStandardSetByUid(uid: string): Promise<StandardSet | undefined> {
    const [result] = await db.select().from(standardSets)
      .where(eq(standardSets.uid, uid));
    return result || undefined;
  },


  async createStandardSet(set: InsertStandardSet): Promise<StandardSet> {
    const [created] = await db.insert(standardSets).values(set as any).returning();
    return created;
  },


  async updateStandardSet(id: string, updates: Partial<StandardSet>): Promise<StandardSet | undefined> {
    const [updated] = await db.update(standardSets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(standardSets.id, id))
      .returning();
    return updated || undefined;
  },


  async getEducationalStandards(standardSetId: string): Promise<EducationalStandard[]> {
    return await db.select().from(educationalStandardsDb)
      .where(eq(educationalStandardsDb.standardSetId, standardSetId))
      .orderBy(asc(educationalStandardsDb.position));
  },


  async getEducationalStandard(id: string): Promise<EducationalStandard | undefined> {
    const [result] = await db.select().from(educationalStandardsDb)
      .where(eq(educationalStandardsDb.id, id));
    return result || undefined;
  },


  async getEducationalStandardByUid(uid: string): Promise<EducationalStandard | undefined> {
    const [result] = await db.select().from(educationalStandardsDb)
      .where(eq(educationalStandardsDb.uid, uid));
    return result || undefined;
  },


  async createEducationalStandard(standard: InsertEducationalStandard): Promise<EducationalStandard> {
    const [created] = await db.insert(educationalStandardsDb).values(standard as any).returning();
    return created;
  },


  async updateEducationalStandard(id: string, updates: Partial<EducationalStandard>): Promise<EducationalStandard | undefined> {
    const [updated] = await db.update(educationalStandardsDb)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(educationalStandardsDb.id, id))
      .returning();
    return updated || undefined;
  },


  async bulkCreateEducationalStandards(standards: InsertEducationalStandard[]): Promise<EducationalStandard[]> {
    if (standards.length === 0) return [];
    return await db.insert(educationalStandardsDb).values(standards as any[]).returning();
  },


  // Standards Staging (Approval Queue)
  async createStagingStandard(staging: InsertStandardsStaging): Promise<StandardsStaging> {
    const [created] = await db.insert(standardsStaging).values(staging as any).returning();
    return created;
  },


  async getStagingStandards(status?: string): Promise<StandardsStaging[]> {
    if (status) {
      return await db.select().from(standardsStaging)
        .where(eq(standardsStaging.status, status))
        .orderBy(desc(standardsStaging.createdAt));
    }
    return await db.select().from(standardsStaging)
      .orderBy(desc(standardsStaging.createdAt));
  },


  async updateStagingStandard(id: string, updates: Partial<StandardsStaging>): Promise<StandardsStaging | undefined> {
    const [updated] = await db.update(standardsStaging)
      .set(updates)
      .where(eq(standardsStaging.id, id))
      .returning();
    return updated || undefined;
  },


  async approveStagingStandard(id: string, reviewerId: string): Promise<EducationalStandard | undefined> {
    const [staging] = await db.select().from(standardsStaging).where(eq(standardsStaging.id, id));
    if (!staging) return undefined;

    await db.update(standardsStaging)
      .set({ status: "approved", reviewedBy: reviewerId, reviewedAt: new Date() })
      .where(eq(standardsStaging.id, id));

    const uid = `${staging.jurisdictionId}-${staging.humanCoding}-${Date.now()}`;
    const [created] = await db.insert(educationalStandardsDb).values({
      uid,
      standardSetId: staging.standardSetId || "",
      humanCoding: staging.humanCoding,
      statement: staging.statement,
      description: staging.description,
      gradeLevel: staging.gradeLevel,
      depth: staging.depth,
      position: staging.position,
      isActive: true,
      source: staging.source,
      versionHistory: [{ version: "1.0", changedAt: new Date().toISOString(), changeType: "create" as const }],
    } as any).returning();
    return created;
  },


  async rejectStagingStandard(id: string, reviewerId: string, reason: string): Promise<StandardsStaging | undefined> {
    const [updated] = await db.update(standardsStaging)
      .set({ status: "rejected", reviewedBy: reviewerId, reviewedAt: new Date(), rejectionReason: reason })
      .where(eq(standardsStaging.id, id))
      .returning();
    return updated || undefined;
  },


  async bulkCreateStagingStandards(standards: InsertStandardsStaging[]): Promise<StandardsStaging[]> {
    if (standards.length === 0) return [];
    return await db.insert(standardsStaging).values(standards as any[]).returning();
  },


  // Soft Delete for Standards
  async deprecateStandard(id: string): Promise<EducationalStandard | undefined> {
    const existing = await this.getEducationalStandard(id);
    if (!existing) return undefined;

    const versionHistory = existing.versionHistory || [];
    versionHistory.push({
      version: new Date().toISOString(),
      changedAt: new Date().toISOString(),
      previousStatement: existing.statement,
      changeType: "deprecate",
    });

    const [updated] = await db.update(educationalStandardsDb)
      .set({ isActive: false, versionHistory, updatedAt: new Date() })
      .where(eq(educationalStandardsDb.id, id))
      .returning();
    return updated || undefined;
  },


  // Shared Resources
  async getSharedResources(filters?: { visibility?: string; category?: string; subject?: string }): Promise<SharedResource[]> {
    let query = db.select().from(sharedResources);
    
    if (filters?.visibility) {
      query = query.where(eq(sharedResources.visibility, filters.visibility)) as any;
    }
    
    return await query.orderBy(desc(sharedResources.createdAt));
  },


  async getUserSharedResources(userId: string): Promise<SharedResource[]> {
    return await db.select().from(sharedResources)
      .where(eq(sharedResources.userId, userId))
      .orderBy(desc(sharedResources.createdAt));
  },


  async getSharedResource(id: string): Promise<SharedResource | undefined> {
    const [result] = await db.select().from(sharedResources)
      .where(eq(sharedResources.id, id));
    return result || undefined;
  },


  async createSharedResource(resource: InsertSharedResource): Promise<SharedResource> {
    const [created] = await db.insert(sharedResources)
      .values(resource as any)
      .returning();
    return created;
  },


  async updateSharedResource(id: string, updates: Partial<SharedResource>, userId: string): Promise<SharedResource | undefined> {
    const existing = await this.getSharedResource(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const [updated] = await db.update(sharedResources)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sharedResources.id, id))
      .returning();
    return updated || undefined;
  },


  async deleteSharedResource(id: string, userId: string): Promise<boolean> {
    const existing = await this.getSharedResource(id);
    if (!existing || existing.userId !== userId) return false;
    
    await db.delete(sharedResources).where(eq(sharedResources.id, id));
    return true;
  },


  async incrementResourceDownload(id: string): Promise<void> {
    const resource = await this.getSharedResource(id);
    if (resource) {
      await db.update(sharedResources)
        .set({ downloadCount: (resource.downloadCount || 0) + 1 })
        .where(eq(sharedResources.id, id));
    }
  },


  // Resource Likes
  async getResourceLike(resourceId: string, userId: string): Promise<ResourceLike | undefined> {
    const [result] = await db.select().from(resourceLikes)
      .where(and(
        eq(resourceLikes.resourceId, resourceId),
        eq(resourceLikes.userId, userId)
      ));
    return result || undefined;
  },


  async toggleResourceLike(resourceId: string, userId: string): Promise<boolean> {
    const existing = await this.getResourceLike(resourceId, userId);
    const resource = await this.getSharedResource(resourceId);
    
    if (!resource) return false;
    
    if (existing) {
      await db.delete(resourceLikes).where(eq(resourceLikes.id, existing.id));
      await db.update(sharedResources)
        .set({ likeCount: Math.max(0, (resource.likeCount || 0) - 1) })
        .where(eq(sharedResources.id, resourceId));
      return false;
    } else {
      await db.insert(resourceLikes).values({ resourceId, userId } as any);
      await db.update(sharedResources)
        .set({ likeCount: (resource.likeCount || 0) + 1 })
        .where(eq(sharedResources.id, resourceId));
      return true;
    }
  },


  // KNOW Resources (Admin-managed educational resources)
  async getKnowResources(filters?: { 
    resourceType?: string; 
    category?: string; 
    isActive?: boolean;
    featured?: boolean;
  }): Promise<KnowResource[]> {
    let conditions = [];
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(knowResources.isActive, filters.isActive));
    }
    if (filters?.featured !== undefined) {
      conditions.push(eq(knowResources.featured, filters.featured));
    }
    if (filters?.resourceType) {
      conditions.push(eq(knowResources.resourceType as any, filters.resourceType));
    }
    if (filters?.category) {
      conditions.push(eq(knowResources.category, filters.category));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(knowResources)
        .where(and(...conditions))
        .orderBy(knowResources.sortOrder, desc(knowResources.createdAt));
    }
    
    return await db.select().from(knowResources)
      .orderBy(knowResources.sortOrder, desc(knowResources.createdAt));
  },


  async getKnowResource(id: string): Promise<KnowResource | undefined> {
    const [result] = await db.select().from(knowResources)
      .where(eq(knowResources.id, id));
    return result || undefined;
  },


  async createKnowResource(resource: InsertKnowResource): Promise<KnowResource> {
    const [created] = await db.insert(knowResources)
      .values(resource as any)
      .returning();
    return created;
  },


  async updateKnowResource(id: string, updates: Partial<KnowResource>, userId: string): Promise<KnowResource | undefined> {
    const [updated] = await db.update(knowResources)
      .set({ ...updates, updatedBy: userId, updatedAt: new Date() })
      .where(eq(knowResources.id, id))
      .returning();
    return updated || undefined;
  },


  async deleteKnowResource(id: string): Promise<boolean> {
    const result = await db.delete(knowResources).where(eq(knowResources.id, id));
    return true;
  },


  // Resource Reports — community moderation for scholarship listings
  async createResourceReport(data: InsertResourceReport): Promise<ResourceReport> {
    const [created] = await db.insert(resourceReports).values(data as any).returning();
    // Auto-hide if pending reports >= threshold
    const pending = await db.select({ id: resourceReports.id }).from(resourceReports)
      .where(and(eq(resourceReports.resourceId, data.resourceId), eq(resourceReports.status, "pending")));
    if (pending.length >= REPORT_AUTOHIDE_THRESHOLD) {
      await db.update(knowResources).set({ isActive: false, updatedAt: new Date() }).where(eq(knowResources.id, data.resourceId));
    }
    return created;
  },


  async listResourceReports(filters?: { status?: string; resourceId?: string }): Promise<ResourceReport[]> {
    const conditions: any[] = [];
    if (filters?.status) conditions.push(eq(resourceReports.status, filters.status as any));
    if (filters?.resourceId) conditions.push(eq(resourceReports.resourceId, filters.resourceId));
    const q = conditions.length > 0
      ? db.select().from(resourceReports).where(and(...conditions))
      : db.select().from(resourceReports);
    return await q.orderBy(desc(resourceReports.createdAt));
  },


  async resolveResourceReport(id: string, userId: string, status: "resolved" | "dismissed"): Promise<ResourceReport | undefined> {
    const [updated] = await db.update(resourceReports)
      .set({ status, resolvedBy: userId, resolvedAt: new Date() })
      .where(eq(resourceReports.id, id))
      .returning();
    return updated;
  },


  async countActiveReportsForResource(resourceId: string): Promise<number> {
    const rows = await db.select({ id: resourceReports.id }).from(resourceReports)
      .where(and(eq(resourceReports.resourceId, resourceId), eq(resourceReports.status, "pending")));
    return rows.length;
  },


  async verifyKnowResource(id: string, userId: string): Promise<KnowResource | undefined> {
    const { computeBkdAlignment, parseNextDeadline } = await import("../lib/bkdAlignment");
    const [existing] = await db.select().from(knowResources).where(eq(knowResources.id, id));
    if (!existing) return undefined;

    const now = new Date();
    const refreshed: any = {
      ...existing,
      lastVerifiedAt: now,
      trustLevel: "verified",
    };
    if (!refreshed.nextDeadline) {
      const parsed = parseNextDeadline(existing.scholarshipDeadline);
      if (parsed) refreshed.nextDeadline = parsed;
    }

    const updates: any = {
      lastVerifiedAt: now,
      trustLevel: "verified",
      updatedBy: userId,
      updatedAt: now,
    };
    if (refreshed.nextDeadline && !existing.nextDeadline) {
      updates.nextDeadline = refreshed.nextDeadline;
    }
    if (!(existing as any).bkdManualOverride) {
      updates.bkdAlignment = computeBkdAlignment(refreshed);
    }

    const [updated] = await db.update(knowResources)
      .set(updates)
      .where(eq(knowResources.id, id))
      .returning();
    return updated;
  },


  async bulkVerifyKnowResources(ids: string[], userId: string): Promise<number> {
    if (!ids.length) return 0;
    let count = 0;
    for (const id of ids) {
      const r = await this.verifyKnowResource(id, userId);
      if (r) count++;
    }
    return count;
  },


  // ==========================================================================
  // LYS Milestones (Being, Knowing, Doing)
  // ==========================================================================

  async getLyseMilestones(userId: string): Promise<LyseMilestone[]> {
    return await db.select().from(lyseMilestones)
      .where(eq(lyseMilestones.userId, userId))
      .orderBy(asc(lyseMilestones.dueDate));
  },


  async getLyseMilestone(id: string): Promise<LyseMilestone | undefined> {
    const [milestone] = await db.select().from(lyseMilestones).where(eq(lyseMilestones.id, id));
    return milestone || undefined;
  },


  async getLyseMilestonesByCategory(userId: string, category: string): Promise<LyseMilestone[]> {
    return await db.select().from(lyseMilestones)
      .where(and(
        eq(lyseMilestones.userId, userId),
        eq(lyseMilestones.category, category as any)
      ))
      .orderBy(asc(lyseMilestones.dueDate));
  },


  async getGatekeeperMilestones(userId: string): Promise<LyseMilestone[]> {
    return await db.select().from(lyseMilestones)
      .where(and(
        eq(lyseMilestones.userId, userId),
        eq(lyseMilestones.isGatekeeper, true)
      ))
      .orderBy(asc(lyseMilestones.dueDate));
  },


  async createLyseMilestone(milestone: InsertLyseMilestone): Promise<LyseMilestone> {
    const [created] = await db.insert(lyseMilestones).values(milestone as any).returning();
    return created;
  },


  async updateLyseMilestone(id: string, updates: Partial<LyseMilestone>): Promise<LyseMilestone | undefined> {
    const [updated] = await db.update(lyseMilestones)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(lyseMilestones.id, id))
      .returning();
    return updated || undefined;
  },


  async deleteLyseMilestone(id: string, userId: string): Promise<boolean> {
    await db.delete(lyseMilestones).where(
      and(eq(lyseMilestones.id, id), eq(lyseMilestones.userId, userId))
    );
    return true;
  },


  async getEducatorSkills(userId: string): Promise<EducatorSkill[]> {
    return await db.select().from(educatorSkills)
      .where(eq(educatorSkills.userId, userId))
      .orderBy(asc(educatorSkills.category), asc(educatorSkills.skillName));
  },


  async getEducatorSkill(id: string): Promise<EducatorSkill | undefined> {
    const [skill] = await db.select().from(educatorSkills).where(eq(educatorSkills.id, id));
    return skill || undefined;
  },


  async createEducatorSkill(skill: InsertEducatorSkill): Promise<EducatorSkill> {
    const [created] = await db.insert(educatorSkills).values(skill as any).returning();
    return created;
  },


  async updateEducatorSkill(id: string, userId: string, updates: Partial<EducatorSkill>): Promise<EducatorSkill | undefined> {
    const [updated] = await db.update(educatorSkills)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(educatorSkills.id, id), eq(educatorSkills.userId, userId)))
      .returning();
    return updated || undefined;
  },


  async deleteEducatorSkill(id: string, userId: string): Promise<boolean> {
    await db.delete(educatorSkills)
      .where(and(eq(educatorSkills.id, id), eq(educatorSkills.userId, userId)));
    return true;
  },


  async getPDResources(filters?: { resourceType?: string; skillsAddressed?: string[]; isActive?: boolean }): Promise<PDResource[]> {
    let query = db.select().from(pdResources);
    if (filters?.isActive !== undefined) {
      query = query.where(eq(pdResources.isActive, filters.isActive)) as any;
    }
    if (filters?.resourceType) {
      query = query.where(eq(pdResources.resourceType, filters.resourceType)) as any;
    }
    return await query.orderBy(desc(pdResources.rating), desc(pdResources.completionCount));
  },


  async getPDResource(id: string): Promise<PDResource | undefined> {
    const [resource] = await db.select().from(pdResources).where(eq(pdResources.id, id));
    return resource || undefined;
  },


  async createPDResource(resource: InsertPDResource): Promise<PDResource> {
    const [created] = await db.insert(pdResources).values(resource as any).returning();
    return created;
  },


  async updatePDResource(id: string, updates: Partial<PDResource>): Promise<PDResource | undefined> {
    const [updated] = await db.update(pdResources)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pdResources.id, id))
      .returning();
    return updated || undefined;
  },


  // Resource Ratings
  async getResourceRatings(resourceId: string): Promise<ResourceRating[]> {
    return db.select().from(resourceRatings)
      .where(eq(resourceRatings.resourceId, resourceId))
      .orderBy(desc(resourceRatings.createdAt));
  },


  async getUserResourceRating(resourceId: string, userId: string): Promise<ResourceRating | undefined> {
    const [rating] = await db.select().from(resourceRatings)
      .where(and(eq(resourceRatings.resourceId, resourceId), eq(resourceRatings.userId, userId)));
    return rating;
  },


  async createResourceRating(rating: InsertResourceRating): Promise<ResourceRating> {
    const [newRating] = await db.insert(resourceRatings).values(rating).returning();
    return newRating;
  },
};

Object.assign(DatabaseStorage.prototype, curriculumMethods);
