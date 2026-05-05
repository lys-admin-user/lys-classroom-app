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

// AUTO-SPLIT from server/storage/database.ts -- domain: student (45 methods)
// The `ThisType<DatabaseStorage>` annotation tells TypeScript that `this`
// inside these methods is a full DatabaseStorage instance, so cross-domain
// `this.someOtherMethod(...)` calls type-check correctly.
const studentMethods: ThisType<DatabaseStorage> = {


  // Students
  async getStudents(userId: string): Promise<Student[]> {
    return await db.select().from(students)
      .where(eq(students.userId, userId))
      .orderBy(asc(students.lastName), asc(students.firstName));
  },


  async getStudent(id: string): Promise<Student | undefined> {
    const [result] = await db.select().from(students).where(eq(students.id, id));
    return result || undefined;
  },


  async createStudent(student: InsertStudent): Promise<Student> {
    const [created] = await db.insert(students).values(student as any).returning();
    return created;
  },


  async updateStudent(id: string, updates: Partial<Student>, userId: string): Promise<Student | undefined> {
    const existing = await this.getStudent(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const [updated] = await db.update(students)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return updated || undefined;
  },


  async deleteStudent(id: string, userId: string): Promise<boolean> {
    const existing = await this.getStudent(id);
    if (!existing || existing.userId !== userId) return false;
    
    await db.delete(students).where(eq(students.id, id));
    return true;
  },


  async findStudentBySchoolAndId(organizationId: string, studentIdNumber: string): Promise<(Student & { organizationName?: string }) | undefined> {
    const [result] = await db.select()
      .from(students)
      .where(and(
        eq(students.organizationId, organizationId),
        eq(students.studentId, studentIdNumber)
      ));
    
    if (!result) return undefined;
    
    // Get organization name
    const [org] = await db.select().from(organizations).where(eq(organizations.id, organizationId));
    
    return {
      ...result,
      organizationName: org?.name
    };
  },


  async enrollStudent(enrollment: InsertClassStudent): Promise<ClassStudent> {
    const classData = await this.getClass(enrollment.classId);
    if (!classData) {
      throw new Error("Class not found");
    }
    
    const currentStudents = await this.getClassStudents(enrollment.classId);
    const maxStudents = classData.maxStudents || 35;
    
    if (currentStudents.length >= maxStudents) {
      throw new Error(`Class has reached maximum capacity of ${maxStudents} students`);
    }
    
    const [created] = await db.insert(classStudents)
      .values(enrollment as any)
      .returning();
    return created;
  },


  async getStudentsByOrganization(organizationId: string): Promise<Student[]> {
    return await db.select().from(students)
      .where(eq(students.organizationId, organizationId))
      .orderBy(asc(students.lastName), asc(students.firstName));
  },


  async getStudentsByOrganizationHierarchy(organizationId: string): Promise<Student[]> {
    const childOrgs = await this.getChildOrganizations(organizationId);
    const orgIds = [organizationId, ...childOrgs.map(o => o.id)];
    
    const allStudents: Student[] = [];
    for (const orgId of orgIds) {
      const orgStudents = await this.getStudentsByOrganization(orgId);
      allStudents.push(...orgStudents);
    }
    return allStudents.sort((a, b) => a.lastName.localeCompare(b.lastName));
  },


  // Student Groups
  async getStudentGroups(userId: string): Promise<StudentGroup[]> {
    return await db.select().from(studentGroups)
      .where(eq(studentGroups.userId, userId))
      .orderBy(desc(studentGroups.createdAt));
  },


  async getStudentGroup(id: string): Promise<StudentGroup | undefined> {
    const [result] = await db.select().from(studentGroups).where(eq(studentGroups.id, id));
    return result || undefined;
  },


  async createStudentGroup(group: InsertStudentGroup): Promise<StudentGroup> {
    const [created] = await db.insert(studentGroups).values(group as any).returning();
    return created;
  },


  async updateStudentGroup(id: string, updates: Partial<StudentGroup>, userId: string): Promise<StudentGroup | undefined> {
    const existing = await this.getStudentGroup(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const [updated] = await db.update(studentGroups)
      .set(updates)
      .where(eq(studentGroups.id, id))
      .returning();
    return updated || undefined;
  },


  async deleteStudentGroup(id: string, userId: string): Promise<boolean> {
    const existing = await this.getStudentGroup(id);
    if (!existing || existing.userId !== userId) return false;
    
    await db.delete(studentGroups).where(eq(studentGroups.id, id));
    return true;
  },


  async getAssignmentsForStudent(studentId: string): Promise<{ assignment: Assignment; recipient: AssignmentRecipient }[]> {
    const recipients = await db.select().from(assignmentRecipients)
      .where(and(
        eq(assignmentRecipients.recipientType, "student"),
        eq(assignmentRecipients.recipientId, studentId)
      ));
    
    const result: { assignment: Assignment; recipient: AssignmentRecipient }[] = [];
    for (const recipient of recipients) {
      const assignment = await this.getAssignment(recipient.assignmentId);
      if (assignment) {
        result.push({ assignment, recipient });
      }
    }
    return result;
  },


  async getStudentsByAccommodations(accommodationTypes: string[], classId?: string): Promise<Student[]> {
    // Get all students
    let allStudents: Student[];
    if (classId) {
      // Get students in specific class
      const classStudentsList = await db.select().from(classStudents)
        .where(eq(classStudents.classId, classId));
      const studentIds = classStudentsList.map(cs => cs.studentId);
      if (studentIds.length === 0) return [];
      allStudents = await db.select().from(students)
        .where(inArray(students.id, studentIds));
    } else {
      allStudents = await db.select().from(students);
    }

    // Filter students that have any of the specified accommodation types
    return allStudents.filter(student => {
      if (!student.accommodations || !Array.isArray(student.accommodations)) return false;
      const studentAccommodationTypes = (student.accommodations as any[])
        .filter(a => a.active)
        .map(a => a.type);
      return accommodationTypes.some(type => studentAccommodationTypes.includes(type));
    });
  },


  // Student Matriculation History (System-Level Tracking)
  async getStudentMatriculationHistory(studentId: string): Promise<StudentMatriculationHistory[]> {
    return await db.select().from(studentMatriculationHistory)
      .where(eq(studentMatriculationHistory.studentId, studentId))
      .orderBy(desc(studentMatriculationHistory.eventDate));
  },


  async getStudentMatriculationEvent(id: string): Promise<StudentMatriculationHistory | undefined> {
    const [result] = await db.select().from(studentMatriculationHistory)
      .where(eq(studentMatriculationHistory.id, id));
    return result || undefined;
  },


  // Student Achievements (Earned)
  async getStudentAchievements(studentId: string): Promise<StudentAchievement[]> {
    return await db.select().from(studentAchievements)
      .where(eq(studentAchievements.studentId, studentId))
      .orderBy(desc(studentAchievements.earnedAt));
  },


  async getStudentAchievement(id: string): Promise<StudentAchievement | undefined> {
    const [result] = await db.select().from(studentAchievements)
      .where(eq(studentAchievements.id, id));
    return result || undefined;
  },


  // Validate that a student can be enrolled in a class
  // Enforces: Student and Class should belong to the same school/campus organization
  // Legacy mode: Allows enrollment when both have no organization assigned
  async validateEnrollment(studentId: string, classId: string): Promise<{ valid: boolean; reason?: string }> {
    const student = await this.getStudent(studentId);
    if (!student) {
      return { valid: false, reason: 'Student not found' };
    }

    const classData = await this.getClass(classId);
    if (!classData) {
      return { valid: false, reason: 'Class not found' };
    }

    // Legacy mode: If neither has an organization, allow enrollment
    if (!student.organizationId && !classData.organizationId) {
      return { valid: true };
    }

    // If only one has an org, they need to match
    if (!student.organizationId && classData.organizationId) {
      return { valid: false, reason: 'Student must be assigned to a school before enrolling in an organization-linked class' };
    }
    
    if (student.organizationId && !classData.organizationId) {
      // Allow students with org to enroll in legacy classes
      return { valid: true };
    }

    // Both have organizations - verify they match or are in hierarchy
    const classOrg = await this.getOrganization(classData.organizationId!);
    if (!classOrg) {
      return { valid: false, reason: 'Class organization not found' };
    }
    
    // Optionally verify class org type (soft check - don't fail for legacy data)
    const validClassContainerTypes = ['school', 'campus', 'university'];
    if (classOrg.type && !validClassContainerTypes.includes(classOrg.type)) {
      // Log warning but don't fail - could be legacy or special org type
      console.warn(`Class ${classId} org type '${classOrg.type}' is not a typical school container`);
    }

    // Check if student's organization matches the class organization (same school)
    if (student.organizationId === classData.organizationId) {
      return { valid: true };
    }

    // Check if student's org is within the class org's hierarchy
    // This allows a student at a campus to enroll in a class at the parent school
    const studentHierarchy = await this.getOrganizationHierarchy(student.organizationId!);
    const classOrgInHierarchy = studentHierarchy.some(org => org.id === classData.organizationId);
    
    if (classOrgInHierarchy) {
      return { valid: true };
    }

    // Also check reverse - student's school is a parent of the class's school
    const classHierarchy = await this.getOrganizationHierarchy(classData.organizationId!);
    const studentOrgInClassHierarchy = classHierarchy.some(org => org.id === student.organizationId);
    
    if (studentOrgInClassHierarchy) {
      return { valid: true };
    }

    return { 
      valid: false, 
      reason: 'Student must be enrolled in the same school or a related school as the class' 
    };
  },


  // ================================
  // Student Journey Progress (Be-Know-Do Tracking)
  // ================================

  async getStudentJourneyProgress(studentId: string): Promise<StudentJourneyProgress | undefined> {
    const [progress] = await db.select().from(studentJourneyProgress)
      .where(eq(studentJourneyProgress.studentId, studentId));
    return progress || undefined;
  },


  async getStudentJourneyProgressByUserId(userId: string): Promise<StudentJourneyProgress | undefined> {
    const [progress] = await db.select().from(studentJourneyProgress)
      .where(eq(studentJourneyProgress.studentId, userId));
    return progress || undefined;
  },


  async getStudentJourneyProgressByEducator(educatorUserId: string): Promise<StudentJourneyProgress[]> {
    return await db.select().from(studentJourneyProgress)
      .where(eq(studentJourneyProgress.educatorUserId, educatorUserId))
      .orderBy(desc(studentJourneyProgress.lastActivityDate));
  },


  async createStudentJourneyProgress(progress: InsertStudentJourneyProgress): Promise<StudentJourneyProgress> {
    const [created] = await db.insert(studentJourneyProgress).values(progress as any).returning();
    return created;
  },


  async updateStudentJourneyProgress(id: string, updates: Partial<StudentJourneyProgress>): Promise<StudentJourneyProgress | undefined> {
    const [updated] = await db.update(studentJourneyProgress)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(studentJourneyProgress.id, id))
      .returning();
    return updated || undefined;
  },


  async deleteStudentJourneyProgress(id: string): Promise<boolean> {
    const result = await db.delete(studentJourneyProgress).where(eq(studentJourneyProgress.id, id));
    return (result.rowCount ?? 0) > 0;
  },


  // Student Journey Milestones
  async getStudentJourneyMilestones(journeyProgressId: string): Promise<StudentJourneyMilestone[]> {
    return await db.select().from(studentJourneyMilestones)
      .where(eq(studentJourneyMilestones.journeyProgressId, journeyProgressId))
      .orderBy(desc(studentJourneyMilestones.createdAt));
  },


  async getStudentJourneyMilestone(id: string): Promise<StudentJourneyMilestone | undefined> {
    const [milestone] = await db.select().from(studentJourneyMilestones)
      .where(eq(studentJourneyMilestones.id, id));
    return milestone || undefined;
  },


  async createStudentJourneyMilestone(milestone: InsertStudentJourneyMilestone): Promise<StudentJourneyMilestone> {
    const [created] = await db.insert(studentJourneyMilestones).values(milestone as any).returning();
    return created;
  },


  async updateStudentJourneyMilestone(id: string, updates: Partial<StudentJourneyMilestone>): Promise<StudentJourneyMilestone | undefined> {
    const [updated] = await db.update(studentJourneyMilestones)
      .set(updates)
      .where(eq(studentJourneyMilestones.id, id))
      .returning();
    return updated || undefined;
  },


  async deleteStudentJourneyMilestone(id: string): Promise<boolean> {
    const result = await db.delete(studentJourneyMilestones).where(eq(studentJourneyMilestones.id, id));
    return (result.rowCount ?? 0) > 0;
  },


  // Student Journey Activities
  async getStudentJourneyActivities(journeyProgressId: string, limit: number = 50): Promise<StudentJourneyActivity[]> {
    return await db.select().from(studentJourneyActivities)
      .where(eq(studentJourneyActivities.journeyProgressId, journeyProgressId))
      .orderBy(desc(studentJourneyActivities.createdAt))
      .limit(limit);
  },


  async createStudentJourneyActivity(activity: InsertStudentJourneyActivity): Promise<StudentJourneyActivity> {
    const [created] = await db.insert(studentJourneyActivities).values(activity as any).returning();
    return created;
  },


  // Student Journey Entries (Timeline/Activity Log for individual students)
  async getStudentJourneyEntries(userId: string, limit: number = 50): Promise<StudentJourneyEntry[]> {
    return await db.select().from(studentJourneyEntries)
      .where(eq(studentJourneyEntries.userId, userId))
      .orderBy(desc(studentJourneyEntries.createdAt))
      .limit(limit);
  },


  async getStudentJourneyEntriesByPillar(userId: string, pillar: string): Promise<StudentJourneyEntry[]> {
    return await db.select().from(studentJourneyEntries)
      .where(and(
        eq(studentJourneyEntries.userId, userId),
        eq(studentJourneyEntries.bkdPillar, pillar)
      ))
      .orderBy(desc(studentJourneyEntries.createdAt));
  },


  async createStudentJourneyEntry(entry: InsertStudentJourneyEntry): Promise<StudentJourneyEntry> {
    const [created] = await db.insert(studentJourneyEntries).values(entry as any).returning();
    return created;
  },


  async deleteStudentJourneyEntry(id: string): Promise<boolean> {
    const result = await db.delete(studentJourneyEntries).where(eq(studentJourneyEntries.id, id));
    return (result.rowCount ?? 0) > 0;
  },


  // Student Journey Progress History
  async getStudentJourneyProgressHistory(journeyProgressId: string, limit: number = 100): Promise<StudentJourneyProgressHistory[]> {
    return await db.select().from(studentJourneyProgressHistory)
      .where(eq(studentJourneyProgressHistory.journeyProgressId, journeyProgressId))
      .orderBy(desc(studentJourneyProgressHistory.createdAt))
      .limit(limit);
  },


  async getStudentJourneyProgressHistoryByStudent(studentId: string, limit: number = 100): Promise<StudentJourneyProgressHistory[]> {
    return await db.select().from(studentJourneyProgressHistory)
      .where(eq(studentJourneyProgressHistory.studentId, studentId))
      .orderBy(desc(studentJourneyProgressHistory.createdAt))
      .limit(limit);
  },


  async createStudentJourneyProgressHistory(history: InsertStudentJourneyProgressHistory): Promise<StudentJourneyProgressHistory> {
    const [created] = await db.insert(studentJourneyProgressHistory).values(history as any).returning();
    return created;
  },


  // Student Notes Methods
  async getStudentNotes(studentId: string, educatorId: string): Promise<StudentNote[]> {
    return await db.select().from(studentNotes)
      .where(and(
        eq(studentNotes.studentId, studentId),
        eq(studentNotes.educatorId, educatorId)
      ))
      .orderBy(desc(studentNotes.createdAt));
  },


  async createStudentNote(note: InsertStudentNote): Promise<StudentNote> {
    const [created] = await db.insert(studentNotes).values(note as any).returning();
    return created;
  },


  async updateStudentNote(id: string, updates: Partial<StudentNote>, educatorId: string): Promise<StudentNote | undefined> {
    const [existing] = await db.select().from(studentNotes).where(eq(studentNotes.id, id));
    if (!existing || existing.educatorId !== educatorId) return undefined;
    
    const [updated] = await db.update(studentNotes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(studentNotes.id, id))
      .returning();
    return updated || undefined;
  },


  async deleteStudentNote(id: string, educatorId: string): Promise<boolean> {
    const [existing] = await db.select().from(studentNotes).where(eq(studentNotes.id, id));
    if (!existing || existing.educatorId !== educatorId) return false;
    
    await db.delete(studentNotes).where(eq(studentNotes.id, id));
    return true;
  },
};

Object.assign(DatabaseStorage.prototype, studentMethods);
