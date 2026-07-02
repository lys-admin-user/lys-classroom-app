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
import { expandGradeSelectionToTokens, standardMatchesGrades } from "@shared/gradeLevels";
import { decryptIfPossible } from "../services/crypto";
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

// AUTO-SPLIT from server/storage/database.ts -- domain: classroom (44 methods)
// The `ThisType<DatabaseStorage>` annotation tells TypeScript that `this`
// inside these methods is a full DatabaseStorage instance, so cross-domain
// `this.someOtherMethod(...)` calls type-check correctly.
const classroomMethods: ThisType<DatabaseStorage> = {


  async upgradeToProMode(affiliateId: string): Promise<EducatorAffiliate | undefined> {
    const [updated] = await db.update(educatorAffiliates)
      .set({ affiliateMode: "pro", proUpgradedAt: new Date(), updatedAt: new Date() })
      .where(eq(educatorAffiliates.id, affiliateId))
      .returning();
    return updated || undefined;
  },


  async getEducationalStandardsByGradeLevels(standardSetId: string, gradeLevels: string[]): Promise<EducationalStandard[]> {
    if (!gradeLevels || gradeLevels.length === 0) {
      return this.getEducationalStandards(standardSetId);
    }

    // Normalize the chosen grades (individual grades, band keys, or a mix — as
    // stored in user preferences) into a set of canonical tokens. Using a set
    // intersection avoids the old substring bug where grade "1" also matched
    // "10"/"11"/"12" and "K" never matched numeric ranges.
    const selected = expandGradeSelectionToTokens(gradeLevels);

    const allStandards = await this.getEducationalStandards(standardSetId);

    // If nothing normalized (e.g. an international label with no US numeric
    // equivalent), don't over-filter — return everything for the set.
    if (selected.size === 0) return allStandards;

    return allStandards.filter((standard) =>
      standardMatchesGrades(standard.gradeLevel, selected),
    );
  },


  // ================================
  // Assignment System (Paid Feature)
  // ================================

  // Classes
  async getClasses(userId: string): Promise<Class[]> {
    return await db.select().from(classes)
      .where(eq(classes.userId, userId))
      .orderBy(desc(classes.createdAt));
  },


  async getClass(id: string): Promise<Class | undefined> {
    const [result] = await db.select().from(classes).where(eq(classes.id, id));
    return result || undefined;
  },


  async createClass(classData: InsertClass): Promise<Class> {
    const [created] = await db.insert(classes).values(classData as any).returning();
    return created;
  },


  async updateClass(id: string, updates: Partial<Class>, userId: string): Promise<Class | undefined> {
    const existing = await this.getClass(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const [updated] = await db.update(classes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(classes.id, id))
      .returning();
    return updated || undefined;
  },


  async deleteClass(id: string, userId: string): Promise<boolean> {
    const existing = await this.getClass(id);
    if (!existing || existing.userId !== userId) return false;
    
    await db.delete(classes).where(eq(classes.id, id));
    return true;
  },


  // Class-Student Relationships
  async getClassStudents(classId: string): Promise<Student[]> {
    const enrollments = await db.select().from(classStudents)
      .where(eq(classStudents.classId, classId));
    
    if (enrollments.length === 0) return [];
    
    const studentIds = enrollments.map(e => e.studentId);
    const result: Student[] = [];
    for (const sid of studentIds) {
      const student = await this.getStudent(sid);
      if (student) result.push(student);
    }
    return result;
  },


  async getClassStudent(classId: string, studentId: string): Promise<ClassStudent | undefined> {
    const [result] = await db.select().from(classStudents)
      .where(and(eq(classStudents.classId, classId), eq(classStudents.studentId, studentId)));
    return result || undefined;
  },


  async addStudentToClass(classId: string, studentId: string): Promise<ClassStudent> {
    const classData = await this.getClass(classId);
    if (!classData) {
      throw new Error("Class not found");
    }
    
    const currentStudents = await this.getClassStudents(classId);
    const maxStudents = classData.maxStudents || 35;
    
    if (currentStudents.length >= maxStudents) {
      throw new Error(`Class has reached maximum capacity of ${maxStudents} students`);
    }
    
    const [created] = await db.insert(classStudents)
      .values({ classId, studentId } as any)
      .returning();
    return created;
  },


  async removeStudentFromClass(classId: string, studentId: string): Promise<boolean> {
    await db.delete(classStudents)
      .where(and(eq(classStudents.classId, classId), eq(classStudents.studentId, studentId)));
    return true;
  },


  // Organization-Scoped Classroom Access
  async getClassesByOrganization(organizationId: string): Promise<Class[]> {
    return await db.select().from(classes)
      .where(eq(classes.organizationId, organizationId))
      .orderBy(desc(classes.createdAt));
  },


  async getClassesByOrganizationHierarchy(organizationId: string): Promise<Class[]> {
    const childOrgs = await this.getChildOrganizations(organizationId);
    const orgIds = [organizationId, ...childOrgs.map(o => o.id)];
    
    const allClasses: Class[] = [];
    for (const orgId of orgIds) {
      const orgClasses = await this.getClassesByOrganization(orgId);
      allClasses.push(...orgClasses);
    }
    return allClasses.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  },


  async getAssignmentsByClass(classId: string): Promise<Assignment[]> {
    return await db.select().from(assignments)
      .where(eq(assignments.classId, classId))
      .orderBy(desc(assignments.createdAt));
  },


  // Gradebook System Implementation
  async getGradeCategories(classId: string): Promise<GradeCategory[]> {
    return await db.select().from(gradeCategories)
      .where(eq(gradeCategories.classId, classId))
      .orderBy(gradeCategories.name);
  },


  async createGradeCategory(category: InsertGradeCategory): Promise<GradeCategory> {
    const [created] = await db.insert(gradeCategories).values(category as any).returning();
    return created;
  },


  async updateGradeCategory(id: string, updates: Partial<GradeCategory>, userId: string): Promise<GradeCategory | undefined> {
    const [existing] = await db.select().from(gradeCategories).where(eq(gradeCategories.id, id));
    if (!existing || existing.userId !== userId) return undefined;
    const [updated] = await db.update(gradeCategories)
      .set(updates)
      .where(eq(gradeCategories.id, id))
      .returning();
    return updated || undefined;
  },


  async deleteGradeCategory(id: string, userId: string): Promise<boolean> {
    const [existing] = await db.select().from(gradeCategories).where(eq(gradeCategories.id, id));
    if (!existing || existing.userId !== userId) return false;
    await db.delete(gradeCategories).where(eq(gradeCategories.id, id));
    return true;
  },


  async getStudentGrades(classId: string): Promise<StudentGrade[]> {
    return await db.select().from(studentGrades)
      .where(eq(studentGrades.classId, classId))
      .orderBy(desc(studentGrades.gradedAt));
  },


  async getStudentGradesByStudent(studentId: string): Promise<StudentGrade[]> {
    return await db.select().from(studentGrades)
      .where(eq(studentGrades.studentId, studentId))
      .orderBy(desc(studentGrades.gradedAt));
  },


  async createStudentGrade(grade: InsertStudentGrade): Promise<StudentGrade> {
    // Calculate percentage and letter grade if not provided
    const percentage = grade.pointsEarned !== undefined && grade.pointsEarned !== null
      ? Math.round((grade.pointsEarned / (grade.pointsPossible || 100)) * 100)
      : undefined;
    const letterGrade = percentage !== undefined ? this.calculateLetterGrade(percentage) : undefined;
    
    const [created] = await db.insert(studentGrades).values({
      ...grade,
      percentage,
      letterGrade,
    } as any).returning();
    return created;
  },


  calculateLetterGrade(percentage: number): string {
    if (percentage >= 97) return "A+";
    if (percentage >= 93) return "A";
    if (percentage >= 90) return "A-";
    if (percentage >= 87) return "B+";
    if (percentage >= 83) return "B";
    if (percentage >= 80) return "B-";
    if (percentage >= 77) return "C+";
    if (percentage >= 73) return "C";
    if (percentage >= 70) return "C-";
    if (percentage >= 67) return "D+";
    if (percentage >= 63) return "D";
    if (percentage >= 60) return "D-";
    return "F";
  },


  async updateStudentGrade(id: string, updates: Partial<StudentGrade>, userId: string): Promise<StudentGrade | undefined> {
    const [existing] = await db.select().from(studentGrades).where(eq(studentGrades.id, id));
    if (!existing || existing.userId !== userId) return undefined;
    
    // Recalculate percentage if points changed
    let percentage = updates.percentage;
    let letterGrade = updates.letterGrade;
    if (updates.pointsEarned !== undefined || updates.pointsPossible !== undefined) {
      const earned = updates.pointsEarned ?? existing.pointsEarned;
      const possible = updates.pointsPossible ?? existing.pointsPossible;
      if (earned !== null && earned !== undefined) {
        percentage = Math.round((earned / (possible || 100)) * 100);
        letterGrade = this.calculateLetterGrade(percentage);
      }
    }
    
    const [updated] = await db.update(studentGrades)
      .set({ ...updates, percentage, letterGrade, updatedAt: new Date() })
      .where(eq(studentGrades.id, id))
      .returning();
    return updated || undefined;
  },


  async deleteStudentGrade(id: string, userId: string): Promise<boolean> {
    const [existing] = await db.select().from(studentGrades).where(eq(studentGrades.id, id));
    if (!existing || existing.userId !== userId) return false;
    await db.delete(studentGrades).where(eq(studentGrades.id, id));
    return true;
  },


  async bulkUpdateStudentGrades(gradesData: { id: string; pointsEarned: number; comments?: string }[], userId: string): Promise<StudentGrade[]> {
    const results: StudentGrade[] = [];
    for (const g of gradesData) {
      const updated = await this.updateStudentGrade(g.id, { 
        pointsEarned: g.pointsEarned,
        comments: g.comments,
      }, userId);
      if (updated) results.push(updated);
    }
    return results;
  },


  async getGradingPeriods(userId: string): Promise<GradingPeriod[]> {
    return await db.select().from(gradingPeriods)
      .where(eq(gradingPeriods.userId, userId))
      .orderBy(gradingPeriods.startDate);
  },


  async createGradingPeriod(period: InsertGradingPeriod): Promise<GradingPeriod> {
    const [created] = await db.insert(gradingPeriods).values(period as any).returning();
    return created;
  },


  async updateGradingPeriod(id: string, updates: Partial<GradingPeriod>, userId: string): Promise<GradingPeriod | undefined> {
    const [existing] = await db.select().from(gradingPeriods).where(eq(gradingPeriods.id, id));
    if (!existing || existing.userId !== userId) return undefined;
    const [updated] = await db.update(gradingPeriods)
      .set(updates)
      .where(eq(gradingPeriods.id, id))
      .returning();
    return updated || undefined;
  },


  async deleteGradingPeriod(id: string, userId: string): Promise<boolean> {
    const [existing] = await db.select().from(gradingPeriods).where(eq(gradingPeriods.id, id));
    if (!existing || existing.userId !== userId) return false;
    await db.delete(gradingPeriods).where(eq(gradingPeriods.id, id));
    return true;
  },


  async getStudentNotesByClass(classId: string, educatorId: string): Promise<StudentNote[]> {
    const rows = await db.select().from(studentNotes)
      .where(and(
        eq(studentNotes.classId, classId),
        eq(studentNotes.educatorId, educatorId)
      ))
      .orderBy(desc(studentNotes.createdAt));
    return rows.map((row) => row.content != null
      ? { ...row, content: (decryptIfPossible(row.content) ?? row.content) }
      : row);
  },


  // Attendance Records Methods
  async getAttendanceByClass(classId: string, date: Date): Promise<AttendanceRecord[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await db.select().from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.classId, classId),
        gte(attendanceRecords.date, startOfDay),
        sql`${attendanceRecords.date} <= ${endOfDay}`
      ))
      .orderBy(asc(attendanceRecords.studentId));
  },


  async getAttendanceByStudent(studentId: string, startDate?: Date, endDate?: Date): Promise<AttendanceRecord[]> {
    const conditions = [eq(attendanceRecords.studentId, studentId)];
    
    if (startDate) {
      conditions.push(gte(attendanceRecords.date, startDate));
    }
    if (endDate) {
      conditions.push(sql`${attendanceRecords.date} <= ${endDate}`);
    }
    
    return await db.select().from(attendanceRecords)
      .where(and(...conditions))
      .orderBy(desc(attendanceRecords.date));
  },


  async createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const [created] = await db.insert(attendanceRecords).values(record as any).returning();
    return created;
  },


  async updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord | undefined> {
    const [updated] = await db.update(attendanceRecords)
      .set(updates)
      .where(eq(attendanceRecords.id, id))
      .returning();
    return updated || undefined;
  },


  async bulkCreateAttendance(records: InsertAttendanceRecord[]): Promise<AttendanceRecord[]> {
    if (records.length === 0) return [];
    const created = await db.insert(attendanceRecords).values(records as any[]).returning();
    return created;
  },


  // ================================
  // Student Transfer Request Methods
  // ================================

  async createTransferRequest(data: InsertStudentTransferRequest): Promise<StudentTransferRequest> {
    const [created] = await db.insert(studentTransferRequests).values(data as any).returning();
    return created;
  },


  async getTransferRequest(id: string): Promise<StudentTransferRequest | undefined> {
    const [request] = await db.select().from(studentTransferRequests)
      .where(eq(studentTransferRequests.id, id));
    return request || undefined;
  },


  async getTransferRequestsByStudent(studentId: string): Promise<StudentTransferRequest[]> {
    return await db.select().from(studentTransferRequests)
      .where(eq(studentTransferRequests.studentId, studentId))
      .orderBy(desc(studentTransferRequests.createdAt));
  },


  async getTransferRequestsByOrganization(organizationId: string): Promise<StudentTransferRequest[]> {
    return await db.select().from(studentTransferRequests)
      .where(or(
        eq(studentTransferRequests.sourceOrganizationId, organizationId),
        eq(studentTransferRequests.targetOrganizationId, organizationId)
      ))
      .orderBy(desc(studentTransferRequests.createdAt));
  },


  async getPendingTransferRequests(level: "campus" | "district" | "system_admin"): Promise<StudentTransferRequest[]> {
    const statusMap = {
      campus: "pending_campus" as TransferRequestStatus,
      district: "pending_district" as TransferRequestStatus,
      system_admin: "pending_system_admin" as TransferRequestStatus
    };
    return await db.select().from(studentTransferRequests)
      .where(eq(studentTransferRequests.status, statusMap[level]))
      .orderBy(desc(studentTransferRequests.createdAt));
  },


  async approveTransferAtLevel(
    id: string, 
    level: "campus" | "district" | "system_admin",
    approvedBy: string
  ): Promise<StudentTransferRequest | undefined> {
    const now = new Date();
    let updates: Partial<StudentTransferRequest> = { updatedAt: now };
    
    if (level === "campus") {
      updates = {
        ...updates,
        campusApprovedBy: approvedBy,
        campusApprovedAt: now,
        status: "pending_district" as TransferRequestStatus
      };
    } else if (level === "district") {
      updates = {
        ...updates,
        districtApprovedBy: approvedBy,
        districtApprovedAt: now,
        status: "pending_system_admin" as TransferRequestStatus
      };
    } else if (level === "system_admin") {
      updates = {
        ...updates,
        systemAdminApprovedBy: approvedBy,
        systemAdminApprovedAt: now,
        status: "approved" as TransferRequestStatus,
        transferExecutedAt: now
      };
    }

    const [updated] = await db.update(studentTransferRequests)
      .set(updates)
      .where(eq(studentTransferRequests.id, id))
      .returning();
    return updated || undefined;
  },


  async rejectTransfer(
    id: string,
    level: "campus" | "district" | "system_admin",
    rejectedBy: string,
    reason: string
  ): Promise<StudentTransferRequest | undefined> {
    const now = new Date();
    let updates: Partial<StudentTransferRequest> = { 
      updatedAt: now,
      status: "rejected" as TransferRequestStatus
    };

    if (level === "campus") {
      updates.campusRejectionReason = reason;
    } else if (level === "district") {
      updates.districtRejectionReason = reason;
    } else if (level === "system_admin") {
      updates.systemAdminRejectionReason = reason;
    }

    const [updated] = await db.update(studentTransferRequests)
      .set(updates)
      .where(eq(studentTransferRequests.id, id))
      .returning();
    return updated || undefined;
  },


  async cancelTransferRequest(id: string): Promise<StudentTransferRequest | undefined> {
    const [updated] = await db.update(studentTransferRequests)
      .set({ 
        status: "cancelled" as TransferRequestStatus,
        updatedAt: new Date()
      })
      .where(eq(studentTransferRequests.id, id))
      .returning();
    return updated || undefined;
  },


  async executeTransfer(id: string): Promise<StudentTransferRequest | undefined> {
    const request = await this.getTransferRequest(id);
    if (!request || request.status !== "approved") return undefined;

    // Update the student's organization/educator
    if (request.transferType === "organization" && request.targetOrganizationId) {
      await db.update(students)
        .set({ 
          organizationId: request.targetOrganizationId,
          updatedAt: new Date()
        })
        .where(eq(students.id, request.studentId));
    }

    // Mark transfer as executed
    const [updated] = await db.update(studentTransferRequests)
      .set({ 
        transferExecutedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(studentTransferRequests.id, id))
      .returning();
    return updated || undefined;
  },
};

Object.assign(DatabaseStorage.prototype, classroomMethods);
