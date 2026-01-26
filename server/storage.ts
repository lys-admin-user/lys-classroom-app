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
  type FeatureFlag,
  type InsertFeatureFlag,
  type EmailTemplate,
  type InsertEmailTemplate,
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
  collaborationSessions,
  sessionParticipants,
  collaborationMessages,
  sharedResources,
  resourceLikes,
  sessionEditHistory,
  organizations,
  organizationMemberships,
  organizationInvitations,
  siteAdmins,
  parentStudentLinks,
  parentInvitations,
  parentProgressNotes,
  featureFlags,
  emailTemplates,
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
  studentJourneyProgress,
  studentJourneyMilestones,
  studentJourneyActivities,
  studentJourneyEntries,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, asc, gte, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Lessons (saved by authenticated users)
  getLessons(userId: string): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson | undefined>;
  getLessonByShareId(shareId: string): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  deleteLesson(id: string, userId: string): Promise<boolean>;
  toggleLessonShare(id: string, userId: string): Promise<{ shareId: string | null } | undefined>;
  countMonthlyGenerations(userId: string): Promise<number>;
  logLessonGeneration(userId: string, topic?: string): Promise<void>;
  tryReserveLessonGeneration(userId: string, limit: number, topic?: string): Promise<{ success: boolean; currentCount: number }>;
  
  // Lesson Templates
  getLessonTemplates(userId: string): Promise<LessonTemplate[]>;
  getPublicLessonTemplates(): Promise<LessonTemplate[]>;
  getLessonTemplate(id: string): Promise<LessonTemplate | undefined>;
  createLessonTemplate(template: InsertLessonTemplate): Promise<LessonTemplate>;
  updateLessonTemplate(id: string, updates: Partial<LessonTemplate>, userId: string): Promise<LessonTemplate | undefined>;
  deleteLessonTemplate(id: string, userId: string): Promise<boolean>;
  incrementTemplateUseCount(id: string): Promise<void>;
  
  // Goals
  getGoals(userId?: string): Promise<Goal[]>;
  getGoal(id: string): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: string, updates: Partial<Goal>, userId?: string | null): Promise<Goal | undefined>;
  deleteGoal(id: string, userId?: string | null): Promise<boolean>;
  updateMilestone(goalId: string, milestoneId: string, completed: boolean, userId?: string | null): Promise<Goal | undefined>;
  
  // Educator Profiles
  getEducatorProfile(userId: string): Promise<EducatorProfile | undefined>;
  createEducatorProfile(profile: InsertEducatorProfile): Promise<EducatorProfile>;
  updateEducatorProfile(userId: string, updates: Partial<EducatorProfile>): Promise<EducatorProfile | undefined>;
  
  // User management
  getUser(userId: string): Promise<User | undefined>;
  getUserTier(userId: string): Promise<string>;
  updateUserTier(userId: string, tier: string): Promise<User | undefined>;
  updateUserRole(userId: string, role: UserRole): Promise<User | undefined>;
  completeOnboarding(userId: string): Promise<User | undefined>;
  
  // Sponsored Access
  getUserSponsoredAccess(userId: string): Promise<SponsoredAccess | undefined>;
  getActiveSponsorship(placement: string): Promise<ContextualSponsorship | undefined>;
  
  // User Preferences
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  createUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences | undefined>;
  
  // Static data (in-memory)
  getCareers(): Promise<Career[]>;
  getCareer(id: string): Promise<Career | undefined>;
  getCareersByGrade(gradeBand: string): Promise<Career[]>;
  getTrendingCareers(limit?: number): Promise<Career[]>;
  getCareersByState(stateCode: string): Promise<Career[]>;
  updateCareerFromBls(blsCode: string, updates: Partial<Career>): Promise<Career | undefined>;
  getResources(): Promise<Resource[]>;
  getResource(id: string): Promise<Resource | undefined>;
  getAssessments(): Promise<Assessment[]>;
  getAssessment(id: string): Promise<Assessment | undefined>;
  saveAssessmentResult(result: AssessmentResult): Promise<AssessmentResult>;
  
  // Scope and Sequence
  getScopeSequences(userId: string): Promise<ScopeSequence[]>;
  getScopeSequence(id: string): Promise<ScopeSequence | undefined>;
  createScopeSequence(scope: InsertScopeSequence): Promise<ScopeSequence>;
  updateScopeSequence(id: string, updates: Partial<ScopeSequence>, userId: string): Promise<ScopeSequence | undefined>;
  deleteScopeSequence(id: string, userId: string): Promise<boolean>;
  
  // Sequence Units
  getSequenceUnits(scopeId: string): Promise<SequenceUnit[]>;
  getSequenceUnit(id: string): Promise<SequenceUnit | undefined>;
  createSequenceUnit(unit: InsertSequenceUnit): Promise<SequenceUnit>;
  updateSequenceUnit(id: string, updates: Partial<SequenceUnit>, userId: string): Promise<SequenceUnit | undefined>;
  deleteSequenceUnit(id: string, userId: string): Promise<boolean>;
  
  // Scope Change Requests
  getScopeChangeRequests(scopeId: string): Promise<ScopeChangeRequest[]>;
  getAllPendingChangeRequests(): Promise<ScopeChangeRequest[]>;
  createScopeChangeRequest(request: InsertScopeChangeRequest): Promise<ScopeChangeRequest>;
  updateScopeChangeRequest(id: string, updates: Partial<ScopeChangeRequest>): Promise<ScopeChangeRequest | undefined>;
  
  // Self-Discovery Results
  getSelfDiscoveryResults(userId: string): Promise<SelfDiscoveryResult[]>;
  saveSelfDiscoveryResult(result: InsertSelfDiscoveryResult): Promise<SelfDiscoveryResult>;
  
  // Saved Careers
  getSavedCareers(userId: string): Promise<SavedCareer[]>;
  saveCareer(career: InsertSavedCareer): Promise<SavedCareer>;
  deleteSavedCareer(id: string, userId: string): Promise<boolean>;
  
  // Affiliate System
  getEducatorAffiliate(userId: string): Promise<EducatorAffiliate | undefined>;
  getEducatorAffiliateByCode(referralCode: string): Promise<EducatorAffiliate | undefined>;
  createEducatorAffiliate(affiliate: InsertEducatorAffiliate): Promise<EducatorAffiliate>;
  updateEducatorAffiliate(userId: string, updates: Partial<EducatorAffiliate>): Promise<EducatorAffiliate | undefined>;
  
  // Referral Events
  createReferralEvent(event: InsertReferralEvent): Promise<ReferralEvent>;
  getReferralEvents(affiliateId: string, limit?: number): Promise<ReferralEvent[]>;
  
  // Affiliate Rewards
  createAffiliateReward(reward: InsertAffiliateReward): Promise<AffiliateReward>;
  getAffiliateRewards(affiliateId: string): Promise<AffiliateReward[]>;
  
  // Educational Standards Ingestion
  getJurisdictions(country?: string): Promise<StandardsJurisdiction[]>;
  getJurisdiction(id: string): Promise<StandardsJurisdiction | undefined>;
  getJurisdictionByAbbr(country: string, abbreviation: string): Promise<StandardsJurisdiction | undefined>;
  createJurisdiction(jurisdiction: InsertStandardsJurisdiction): Promise<StandardsJurisdiction>;
  updateJurisdiction(id: string, updates: Partial<StandardsJurisdiction>): Promise<StandardsJurisdiction | undefined>;
  
  getStandardSets(jurisdictionId: string): Promise<StandardSet[]>;
  getStandardSet(id: string): Promise<StandardSet | undefined>;
  getStandardSetByUid(uid: string): Promise<StandardSet | undefined>;
  createStandardSet(set: InsertStandardSet): Promise<StandardSet>;
  updateStandardSet(id: string, updates: Partial<StandardSet>): Promise<StandardSet | undefined>;
  
  getEducationalStandards(standardSetId: string): Promise<EducationalStandard[]>;
  getEducationalStandardsByGradeLevels(standardSetId: string, gradeLevels: string[]): Promise<EducationalStandard[]>;
  getEducationalStandard(id: string): Promise<EducationalStandard | undefined>;
  getEducationalStandardByUid(uid: string): Promise<EducationalStandard | undefined>;
  createEducationalStandard(standard: InsertEducationalStandard): Promise<EducationalStandard>;
  updateEducationalStandard(id: string, updates: Partial<EducationalStandard>): Promise<EducationalStandard | undefined>;
  bulkCreateEducationalStandards(standards: InsertEducationalStandard[]): Promise<EducationalStandard[]>;
  
  createSyncLog(log: InsertSyncLog): Promise<SyncLog>;
  updateSyncLog(id: string, updates: Partial<SyncLog>): Promise<SyncLog | undefined>;
  getLatestSyncLogs(limit?: number): Promise<SyncLog[]>;
  
  // Standards Staging (Approval Queue)
  createStagingStandard(staging: InsertStandardsStaging): Promise<StandardsStaging>;
  getStagingStandards(status?: string): Promise<StandardsStaging[]>;
  updateStagingStandard(id: string, updates: Partial<StandardsStaging>): Promise<StandardsStaging | undefined>;
  approveStagingStandard(id: string, reviewerId: string): Promise<EducationalStandard | undefined>;
  rejectStagingStandard(id: string, reviewerId: string, reason: string): Promise<StandardsStaging | undefined>;
  bulkCreateStagingStandards(standards: InsertStandardsStaging[]): Promise<StandardsStaging[]>;
  
  // Source Checksums (Change Detection)
  createSourceChecksum(checksum: InsertSourceChecksum): Promise<SourceChecksum>;
  getSourceChecksum(sourceUrl: string): Promise<SourceChecksum | undefined>;
  updateSourceChecksum(id: string, updates: Partial<SourceChecksum>): Promise<SourceChecksum | undefined>;
  getChangedSources(): Promise<SourceChecksum[]>;
  
  // PDF Import Queue
  createPdfImport(pdfImport: InsertPdfImport): Promise<PdfImport>;
  getPdfImport(id: string): Promise<PdfImport | undefined>;
  updatePdfImport(id: string, updates: Partial<PdfImport>): Promise<PdfImport | undefined>;
  getPdfImports(userId: string): Promise<PdfImport[]>;
  
  // Soft Delete for Standards
  deprecateStandard(id: string): Promise<EducationalStandard | undefined>;

  // Assignment System (Paid Feature)
  getClasses(userId: string): Promise<Class[]>;
  getClass(id: string): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: string, updates: Partial<Class>, userId: string): Promise<Class | undefined>;
  deleteClass(id: string, userId: string): Promise<boolean>;

  getStudents(userId: string): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, updates: Partial<Student>, userId: string): Promise<Student | undefined>;
  deleteStudent(id: string, userId: string): Promise<boolean>;

  getClassStudents(classId: string): Promise<Student[]>;
  addStudentToClass(classId: string, studentId: string): Promise<ClassStudent>;
  removeStudentFromClass(classId: string, studentId: string): Promise<boolean>;

  getStudentGroups(userId: string): Promise<StudentGroup[]>;
  getStudentGroup(id: string): Promise<StudentGroup | undefined>;
  createStudentGroup(group: InsertStudentGroup): Promise<StudentGroup>;
  updateStudentGroup(id: string, updates: Partial<StudentGroup>, userId: string): Promise<StudentGroup | undefined>;
  deleteStudentGroup(id: string, userId: string): Promise<boolean>;

  getAssignments(userId: string): Promise<Assignment[]>;
  getAssignment(id: string): Promise<Assignment | undefined>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: string, updates: Partial<Assignment>, userId: string): Promise<Assignment | undefined>;
  deleteAssignment(id: string, userId: string): Promise<boolean>;

  getAssignmentRecipients(assignmentId: string): Promise<AssignmentRecipient[]>;
  getAssignmentsForStudent(studentId: string): Promise<{ assignment: Assignment; recipient: AssignmentRecipient }[]>;
  createAssignmentRecipient(recipient: InsertAssignmentRecipient): Promise<AssignmentRecipient>;
  updateAssignmentRecipient(id: string, updates: Partial<AssignmentRecipient>): Promise<AssignmentRecipient | undefined>;

  // Organization-Scoped Classroom Access
  getClassesByOrganization(organizationId: string): Promise<Class[]>;
  getStudentsByOrganization(organizationId: string): Promise<Student[]>;
  getClassesByOrganizationHierarchy(organizationId: string): Promise<Class[]>;
  getStudentsByOrganizationHierarchy(organizationId: string): Promise<Student[]>;

  // Entity Sharing
  createEntityShare(share: InsertEntityShare): Promise<EntityShare>;
  getEntityShare(id: string): Promise<EntityShare | undefined>;
  getEntityShares(entityType: string, entityId: string): Promise<EntityShare[]>;
  getSharedWithOrganization(targetOrganizationId: string): Promise<EntityShare[]>;
  deleteEntityShare(id: string): Promise<boolean>;
  
  // Organizations (Multi-Tenant)
  getOrganizations(): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  getChildOrganizations(parentId: string): Promise<Organization[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined>;
  deleteOrganization(id: string): Promise<boolean>;
  
  // Organization Memberships
  getOrganizationMembers(orgId: string): Promise<OrgMembership[]>;
  getUserOrganizations(userId: string): Promise<OrgMembership[]>;
  getOrgMembership(orgId: string, userId: string): Promise<OrgMembership | undefined>;
  createOrgMembership(membership: InsertOrgMembership): Promise<OrgMembership>;
  updateOrgMembership(id: string, updates: Partial<OrgMembership>): Promise<OrgMembership | undefined>;
  deleteOrgMembership(id: string): Promise<boolean>;
  
  // Organization Invitations
  getOrgInvitations(orgId: string): Promise<OrgInvitation[]>;
  getOrgInvitationByToken(token: string): Promise<OrgInvitation | undefined>;
  createOrgInvitation(invitation: InsertOrgInvitation): Promise<OrgInvitation>;
  acceptOrgInvitation(token: string, userId: string): Promise<OrgMembership | undefined>;
  deleteOrgInvitation(id: string): Promise<boolean>;
  
  // Site Administrators
  getSiteAdmins(): Promise<SiteAdmin[]>;
  getSiteAdmin(userId: string): Promise<SiteAdmin | undefined>;
  isSiteAdmin(userId: string): Promise<boolean>;
  createSiteAdmin(admin: InsertSiteAdmin): Promise<SiteAdmin>;
  deleteSiteAdmin(userId: string): Promise<boolean>;
  
  // Parent Portal
  getParentStudentLinks(userId: string, role: 'parent' | 'student'): Promise<ParentStudentLink[]>;
  getParentStudentLink(id: string): Promise<ParentStudentLink | undefined>;
  getParentStudentLinkByUsers(parentUserId: string, studentUserId: string): Promise<ParentStudentLink | undefined>;
  createParentStudentLink(link: InsertParentStudentLink): Promise<ParentStudentLink>;
  updateParentStudentLink(id: string, updates: Partial<ParentStudentLink>): Promise<ParentStudentLink | undefined>;
  deleteParentStudentLink(id: string): Promise<boolean>;
  
  // Parent Invitations
  getParentInvitations(studentUserId: string): Promise<ParentInvitation[]>;
  getParentInvitationByToken(token: string): Promise<ParentInvitation | undefined>;
  createParentInvitation(invitation: InsertParentInvitation): Promise<ParentInvitation>;
  updateParentInvitation(id: string, updates: Partial<ParentInvitation>): Promise<ParentInvitation | undefined>;
  acceptParentInvitation(token: string, parentUserId: string): Promise<ParentStudentLink | undefined>;
  deleteParentInvitation(id: string): Promise<boolean>;
  
  // Parent Progress Notes
  getParentProgressNotes(linkId: string): Promise<ParentProgressNote[]>;
  createParentProgressNote(note: InsertParentProgressNote): Promise<ParentProgressNote>;
  deleteParentProgressNote(id: string, parentUserId: string): Promise<boolean>;
  
  // Feature Flags
  getFeatureFlags(): Promise<FeatureFlag[]>;
  getFeatureFlag(id: string): Promise<FeatureFlag | undefined>;
  getFeatureFlagByName(name: string): Promise<FeatureFlag | undefined>;
  createFeatureFlag(flag: InsertFeatureFlag): Promise<FeatureFlag>;
  updateFeatureFlag(id: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag | undefined>;
  deleteFeatureFlag(id: string): Promise<boolean>;
  
  // Email Templates
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(id: string): Promise<EmailTemplate | undefined>;
  getEmailTemplateByName(name: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: string): Promise<boolean>;
  
  // Global Authority Tree (LYS V3.0)
  getAuthorities(level?: string): Promise<Authority[]>;
  getAuthority(id: string): Promise<Authority | undefined>;
  getAuthorityByCode(code: string): Promise<Authority | undefined>;
  getChildAuthorities(parentId: string): Promise<Authority[]>;
  createAuthority(authority: InsertAuthority): Promise<Authority>;
  updateAuthority(id: string, updates: Partial<Authority>): Promise<Authority | undefined>;
  deleteAuthority(id: string): Promise<boolean>;
  
  // LYS Milestones (Being, Knowing, Doing)
  getLyseMilestones(userId: string): Promise<LyseMilestone[]>;
  getLyseMilestone(id: string): Promise<LyseMilestone | undefined>;
  getLyseMilestonesByCategory(userId: string, category: string): Promise<LyseMilestone[]>;
  getGatekeeperMilestones(userId: string): Promise<LyseMilestone[]>;
  createLyseMilestone(milestone: InsertLyseMilestone): Promise<LyseMilestone>;
  updateLyseMilestone(id: string, updates: Partial<LyseMilestone>): Promise<LyseMilestone | undefined>;
  deleteLyseMilestone(id: string, userId: string): Promise<boolean>;
  
  // Workforce Trends
  getWorkforceTrends(country?: string): Promise<WorkforceTrend[]>;
  getWorkforceTrend(id: string): Promise<WorkforceTrend | undefined>;
  createWorkforceTrend(trend: InsertWorkforceTrend): Promise<WorkforceTrend>;
  updateWorkforceTrend(id: string, updates: Partial<WorkforceTrend>): Promise<WorkforceTrend | undefined>;
  
  // Alignment Matrix
  getAlignmentMatrices(): Promise<AlignmentMatrix[]>;
  getAlignmentMatrix(id: string): Promise<AlignmentMatrix | undefined>;
  getAlignmentMatrixByAuthority(authorityId: string): Promise<AlignmentMatrix | undefined>;
  createAlignmentMatrix(matrix: InsertAlignmentMatrix): Promise<AlignmentMatrix>;
  updateAlignmentMatrix(id: string, updates: Partial<AlignmentMatrix>): Promise<AlignmentMatrix | undefined>;
  
  // Professional Development System
  getEducatorCareerGoals(userId: string): Promise<EducatorCareerGoal[]>;
  getEducatorCareerGoal(id: string): Promise<EducatorCareerGoal | undefined>;
  createEducatorCareerGoal(goal: InsertEducatorCareerGoal): Promise<EducatorCareerGoal>;
  updateEducatorCareerGoal(id: string, userId: string, updates: Partial<EducatorCareerGoal>): Promise<EducatorCareerGoal | undefined>;
  deleteEducatorCareerGoal(id: string, userId: string): Promise<boolean>;
  
  getEducatorSkills(userId: string): Promise<EducatorSkill[]>;
  getEducatorSkill(id: string): Promise<EducatorSkill | undefined>;
  createEducatorSkill(skill: InsertEducatorSkill): Promise<EducatorSkill>;
  updateEducatorSkill(id: string, userId: string, updates: Partial<EducatorSkill>): Promise<EducatorSkill | undefined>;
  deleteEducatorSkill(id: string, userId: string): Promise<boolean>;
  
  getPDResources(filters?: { resourceType?: string; skillsAddressed?: string[]; isActive?: boolean }): Promise<PDResource[]>;
  getPDResource(id: string): Promise<PDResource | undefined>;
  createPDResource(resource: InsertPDResource): Promise<PDResource>;
  updatePDResource(id: string, updates: Partial<PDResource>): Promise<PDResource | undefined>;
  
  getPDRecommendations(userId: string, status?: string): Promise<PDRecommendation[]>;
  getPDRecommendation(id: string): Promise<PDRecommendation | undefined>;
  createPDRecommendation(rec: InsertPDRecommendation): Promise<PDRecommendation>;
  updatePDRecommendationStatus(id: string, userId: string, status: string): Promise<PDRecommendation | undefined>;
  clearUserPDRecommendations(userId: string): Promise<void>;
  
  getEducatorPDProgress(userId: string): Promise<EducatorPDProgress[]>;
  getEducatorPDProgressItem(id: string): Promise<EducatorPDProgress | undefined>;
  createEducatorPDProgress(progress: InsertEducatorPDProgress): Promise<EducatorPDProgress>;
  updateEducatorPDProgress(id: string, userId: string, updates: Partial<EducatorPDProgress>): Promise<EducatorPDProgress | undefined>;
  
  // Student Journey Progress (Be-Know-Do Tracking)
  getStudentJourneyProgress(studentId: string): Promise<StudentJourneyProgress | undefined>;
  getStudentJourneyProgressByUserId(userId: string): Promise<StudentJourneyProgress | undefined>;
  getStudentJourneyProgressByEducator(educatorUserId: string): Promise<StudentJourneyProgress[]>;
  createStudentJourneyProgress(progress: InsertStudentJourneyProgress): Promise<StudentJourneyProgress>;
  updateStudentJourneyProgress(id: string, updates: Partial<StudentJourneyProgress>): Promise<StudentJourneyProgress | undefined>;
  deleteStudentJourneyProgress(id: string): Promise<boolean>;
  
  // Student Journey Entries (Timeline/Activity Log)
  getStudentJourneyEntries(userId: string, limit?: number): Promise<StudentJourneyEntry[]>;
  getStudentJourneyEntriesByPillar(userId: string, pillar: string): Promise<StudentJourneyEntry[]>;
  createStudentJourneyEntry(entry: InsertStudentJourneyEntry): Promise<StudentJourneyEntry>;
  deleteStudentJourneyEntry(id: string): Promise<boolean>;
  
  // Student Journey Milestones
  getStudentJourneyMilestones(journeyProgressId: string): Promise<StudentJourneyMilestone[]>;
  getStudentJourneyMilestone(id: string): Promise<StudentJourneyMilestone | undefined>;
  createStudentJourneyMilestone(milestone: InsertStudentJourneyMilestone): Promise<StudentJourneyMilestone>;
  updateStudentJourneyMilestone(id: string, updates: Partial<StudentJourneyMilestone>): Promise<StudentJourneyMilestone | undefined>;
  deleteStudentJourneyMilestone(id: string): Promise<boolean>;
  
  // Student Journey Activities
  getStudentJourneyActivities(journeyProgressId: string, limit?: number): Promise<StudentJourneyActivity[]>;
  createStudentJourneyActivity(activity: InsertStudentJourneyActivity): Promise<StudentJourneyActivity>;
  
  // Student Digital Portfolio
  getStudentPortfolio(userId: string): Promise<StudentPortfolio | undefined>;
  getStudentPortfolioBySlug(slug: string): Promise<StudentPortfolio | undefined>;
  createStudentPortfolio(portfolio: InsertStudentPortfolio): Promise<StudentPortfolio>;
  updateStudentPortfolio(id: string, updates: Partial<StudentPortfolio>, userId: string): Promise<StudentPortfolio | undefined>;
  deleteStudentPortfolio(id: string, userId: string): Promise<boolean>;
  incrementPortfolioViews(id: string): Promise<void>;
  
  // Portfolio Items
  getPortfolioItems(portfolioId: string): Promise<PortfolioItem[]>;
  getPortfolioItem(id: string): Promise<PortfolioItem | undefined>;
  createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem>;
  updatePortfolioItem(id: string, updates: Partial<PortfolioItem>): Promise<PortfolioItem | undefined>;
  deletePortfolioItem(id: string): Promise<boolean>;
  reorderPortfolioItems(portfolioId: string, itemIds: string[]): Promise<void>;
  
  // Portfolio Comments
  getPortfolioComments(portfolioId: string): Promise<PortfolioComment[]>;
  getPortfolioItemComments(portfolioItemId: string): Promise<PortfolioComment[]>;
  createPortfolioComment(comment: InsertPortfolioComment): Promise<PortfolioComment>;
  updatePortfolioComment(id: string, authorId: string, updates: Partial<PortfolioComment>): Promise<PortfolioComment | undefined>;
  deletePortfolioComment(id: string, authorId: string): Promise<boolean>;
  
  // CAI (Country Affordability Index)
  getCAICountries(): Promise<CAICountry[]>;
  getCAICountry(code: string): Promise<CAICountry | undefined>;
  getCAICountriesByRegion(region: string): Promise<CAICountry[]>;
}

// Seed data for careers and resources (static content - mutable for BLS sync updates)
let seedCareers: Career[] = [
  {
    id: "1",
    title: "Software Developer",
    category: "technology",
    description: "Design, develop, and maintain software applications. Work with cutting-edge technologies to solve complex problems.",
    salaryMin: 65000,
    salaryMax: 150000,
    salaryMedian: 130160,
    educationRequired: "Bachelor's Degree",
    yearsExperience: "0-5 years",
    growthRate: "+25%",
    skills: ["Programming", "Problem Solving", "Communication", "Teamwork", "Critical Thinking"],
    relatedCareers: ["Web Developer", "Data Scientist", "DevOps Engineer"],
    pathways: [
      { type: "college", description: "Earn a Bachelor's in Computer Science or related field from an accredited university.", duration: "4 years", cost: "$40,000-$200,000" },
      { type: "certification", description: "Complete coding bootcamp and earn industry certifications like AWS or Google Cloud.", duration: "3-6 months", cost: "$10,000-$20,000" },
      { type: "military", description: "Serve in IT roles in the military and transition to civilian tech careers.", duration: "4+ years", cost: "Free + Benefits" },
    ],
    blsCode: "15-1252",
    jobOutlook: "much_faster",
    projectedGrowth: 25,
    projectedOpenings: 153900,
    demandLevel: "very_high",
    appropriateGrades: ["middle_school", "high_school", "post_secondary"],
    entryPointsForGrades: {
      middle_school: "Explore coding games like Scratch, join coding clubs, or build simple websites",
      high_school: "Take AP Computer Science, participate in hackathons, or start personal coding projects",
      post_secondary: "Pursue CS degree or coding bootcamp, build portfolio, contribute to open source"
    },
    workEnvironment: "Most work in offices or remotely. Collaboration with teams is common.",
    typicalEntryEducation: "Bachelor's degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      TX: { min: 75000, max: 160000, median: 125000, employment: 189500, demandLevel: "very_high" },
      CA: { min: 90000, max: 200000, median: 155000, employment: 287400, demandLevel: "very_high" },
      NY: { min: 80000, max: 175000, median: 140000, employment: 112300, demandLevel: "high" },
      FL: { min: 65000, max: 140000, median: 110000, employment: 89200, demandLevel: "high" },
      WA: { min: 95000, max: 210000, median: 165000, employment: 98700, demandLevel: "very_high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "2",
    title: "Registered Nurse",
    category: "healthcare",
    description: "Provide patient care, educate patients about health conditions, and support physicians in medical procedures.",
    salaryMin: 55000,
    salaryMax: 120000,
    salaryMedian: 86070,
    educationRequired: "Associate's or Bachelor's Degree",
    yearsExperience: "0-3 years",
    growthRate: "+6%",
    skills: ["Patient Care", "Communication", "Critical Thinking", "Empathy", "Attention to Detail"],
    relatedCareers: ["Nurse Practitioner", "Physician Assistant", "Healthcare Administrator"],
    pathways: [
      { type: "college", description: "Complete a BSN (Bachelor of Science in Nursing) program.", duration: "4 years", cost: "$30,000-$150,000" },
      { type: "trade", description: "Complete an ADN (Associate Degree in Nursing) at a community college.", duration: "2 years", cost: "$10,000-$30,000" },
      { type: "military", description: "Train as a military nurse and serve while gaining experience.", duration: "4+ years", cost: "Free + Benefits" },
    ],
    blsCode: "29-1141",
    jobOutlook: "faster_than_average",
    projectedGrowth: 6,
    projectedOpenings: 193100,
    demandLevel: "very_high",
    appropriateGrades: ["middle_school", "high_school", "post_secondary"],
    entryPointsForGrades: {
      middle_school: "Volunteer at hospitals, take health science classes, join health career clubs",
      high_school: "Become a CNA, take anatomy/biology courses, shadow healthcare professionals",
      post_secondary: "Enroll in nursing program, gain clinical experience, obtain RN license"
    },
    workEnvironment: "Hospitals, clinics, nursing homes. Often involves shift work and physical demands.",
    typicalEntryEducation: "Bachelor's degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      TX: { min: 60000, max: 100000, median: 82000, employment: 223500, demandLevel: "very_high" },
      CA: { min: 90000, max: 165000, median: 133000, employment: 325400, demandLevel: "very_high" },
      NY: { min: 75000, max: 120000, median: 98000, employment: 195300, demandLevel: "high" },
      FL: { min: 55000, max: 95000, median: 73000, employment: 198700, demandLevel: "very_high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "3",
    title: "Marketing Manager",
    category: "business",
    description: "Develop marketing strategies, manage campaigns, and analyze market trends to drive business growth.",
    salaryMin: 60000,
    salaryMax: 180000,
    salaryMedian: 156580,
    educationRequired: "Bachelor's Degree",
    yearsExperience: "3-7 years",
    growthRate: "+8%",
    skills: ["Strategic Planning", "Data Analysis", "Creativity", "Leadership", "Communication"],
    relatedCareers: ["Brand Manager", "Digital Marketing Specialist", "Product Manager"],
    pathways: [
      { type: "college", description: "Earn a Bachelor's in Marketing, Business, or Communications.", duration: "4 years", cost: "$40,000-$200,000" },
      { type: "certification", description: "Gain experience through internships and earn digital marketing certifications.", duration: "1-2 years", cost: "$5,000-$15,000" },
    ],
    blsCode: "11-2021",
    jobOutlook: "faster_than_average",
    projectedGrowth: 8,
    projectedOpenings: 34000,
    demandLevel: "high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Join DECA/FBLA, manage social media for clubs, take business courses",
      post_secondary: "Major in marketing, gain internship experience, build digital portfolio"
    },
    workEnvironment: "Office settings with some remote work. Fast-paced, deadline-driven.",
    typicalEntryEducation: "Bachelor's degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      TX: { min: 80000, max: 170000, median: 145000, employment: 23400, demandLevel: "high" },
      CA: { min: 95000, max: 220000, median: 175000, employment: 34200, demandLevel: "high" },
      NY: { min: 90000, max: 200000, median: 165000, employment: 28100, demandLevel: "high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "4",
    title: "Electrician",
    category: "trades",
    description: "Install, maintain, and repair electrical systems in residential, commercial, and industrial settings.",
    salaryMin: 40000,
    salaryMax: 100000,
    salaryMedian: 61590,
    educationRequired: "High School + Apprenticeship",
    yearsExperience: "0-4 years",
    growthRate: "+6%",
    skills: ["Technical Skills", "Problem Solving", "Physical Stamina", "Safety Awareness", "Math"],
    relatedCareers: ["HVAC Technician", "Plumber", "Construction Manager"],
    pathways: [
      { type: "trade", description: "Complete a 4-5 year apprenticeship program combining classroom instruction with on-the-job training.", duration: "4-5 years", cost: "Paid training" },
      { type: "military", description: "Train as a military electrician and gain certifications.", duration: "4+ years", cost: "Free + Benefits" },
    ],
    blsCode: "47-2111",
    jobOutlook: "faster_than_average",
    projectedGrowth: 6,
    projectedOpenings: 73500,
    demandLevel: "high",
    appropriateGrades: ["middle_school", "high_school", "post_secondary"],
    entryPointsForGrades: {
      middle_school: "Take shop classes, learn basic circuits, explore maker spaces",
      high_school: "Enroll in vocational programs, join SkillsUSA, get pre-apprenticeship training",
      post_secondary: "Begin apprenticeship, attend trade school, obtain journeyman license"
    },
    workEnvironment: "Construction sites, homes, businesses. Physical work, often outdoors.",
    typicalEntryEducation: "High school diploma",
    onTheJobTraining: "Apprenticeship",
    stateSalaryData: {
      TX: { min: 45000, max: 90000, median: 58000, employment: 67200, demandLevel: "high" },
      CA: { min: 55000, max: 120000, median: 78000, employment: 71300, demandLevel: "high" },
      NY: { min: 50000, max: 110000, median: 82000, employment: 45800, demandLevel: "moderate" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "5",
    title: "Graphic Designer",
    category: "creative",
    description: "Create visual content for brands, including logos, marketing materials, websites, and more.",
    salaryMin: 40000,
    salaryMax: 100000,
    salaryMedian: 59970,
    educationRequired: "Bachelor's Degree or Portfolio",
    yearsExperience: "0-3 years",
    growthRate: "+3%",
    skills: ["Adobe Creative Suite", "Typography", "Color Theory", "Creativity", "Communication"],
    relatedCareers: ["UX Designer", "Art Director", "Brand Designer"],
    pathways: [
      { type: "college", description: "Earn a Bachelor's in Graphic Design or Visual Arts.", duration: "4 years", cost: "$40,000-$180,000" },
      { type: "certification", description: "Build a portfolio through online courses and freelance work.", duration: "1-2 years", cost: "$2,000-$10,000" },
    ],
    blsCode: "27-1024",
    jobOutlook: "average",
    projectedGrowth: 3,
    projectedOpenings: 22800,
    demandLevel: "moderate",
    appropriateGrades: ["middle_school", "high_school", "post_secondary"],
    entryPointsForGrades: {
      middle_school: "Create digital art, take art classes, learn basic design software",
      high_school: "Build portfolio, take AP Art, learn Adobe Creative Suite",
      post_secondary: "Get design degree, do freelance work, specialize in UI/UX"
    },
    workEnvironment: "Studios, offices, or remote. Often deadline-driven project work.",
    typicalEntryEducation: "Bachelor's degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      TX: { min: 42000, max: 85000, median: 58000, employment: 18900, demandLevel: "moderate" },
      CA: { min: 50000, max: 110000, median: 72000, employment: 29100, demandLevel: "moderate" },
      NY: { min: 48000, max: 100000, median: 68000, employment: 19800, demandLevel: "moderate" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "6",
    title: "Paralegal",
    category: "legal",
    description: "Assist lawyers with legal research, document preparation, and case management.",
    salaryMin: 40000,
    salaryMax: 85000,
    salaryMedian: 60970,
    educationRequired: "Associate's or Bachelor's Degree",
    yearsExperience: "0-3 years",
    growthRate: "+4%",
    skills: ["Legal Research", "Writing", "Attention to Detail", "Organization", "Communication"],
    relatedCareers: ["Legal Secretary", "Court Reporter", "Lawyer"],
    pathways: [
      { type: "college", description: "Complete a paralegal certificate or associate's degree program.", duration: "1-2 years", cost: "$5,000-$30,000" },
      { type: "certification", description: "Earn a paralegal certification from an accredited program.", duration: "6 months - 1 year", cost: "$3,000-$10,000" },
    ],
    blsCode: "23-2011",
    jobOutlook: "average",
    projectedGrowth: 4,
    projectedOpenings: 36400,
    demandLevel: "moderate",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Join mock trial, take legal studies courses, develop research skills",
      post_secondary: "Complete paralegal program, gain legal internship, obtain certification"
    },
    workEnvironment: "Law firms, corporate legal departments. Office-based with regular hours.",
    typicalEntryEducation: "Associate's degree",
    onTheJobTraining: "Short-term on-the-job training",
    stateSalaryData: {
      TX: { min: 42000, max: 75000, median: 56000, employment: 21200, demandLevel: "moderate" },
      CA: { min: 50000, max: 95000, median: 68000, employment: 28100, demandLevel: "moderate" },
      NY: { min: 48000, max: 90000, median: 65000, employment: 19300, demandLevel: "moderate" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "7",
    title: "Data Scientist",
    category: "technology",
    description: "Analyze complex data to help organizations make better decisions. Use machine learning and statistics.",
    salaryMin: 80000,
    salaryMax: 180000,
    salaryMedian: 108020,
    educationRequired: "Bachelor's or Master's Degree",
    yearsExperience: "0-5 years",
    growthRate: "+36%",
    skills: ["Python/R Programming", "Machine Learning", "Statistics", "Data Visualization", "SQL"],
    relatedCareers: ["Data Analyst", "Machine Learning Engineer", "Business Intelligence Analyst"],
    pathways: [
      { type: "college", description: "Earn a degree in Data Science, Statistics, or Computer Science.", duration: "4-6 years", cost: "$50,000-$250,000" },
      { type: "certification", description: "Complete data science bootcamp and earn industry certifications.", duration: "6-12 months", cost: "$15,000-$30,000" },
    ],
    blsCode: "15-2051",
    jobOutlook: "much_faster",
    projectedGrowth: 36,
    projectedOpenings: 17700,
    demandLevel: "very_high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Excel in math/statistics, learn Python basics, participate in data competitions",
      post_secondary: "Major in data science or statistics, build portfolio of projects, get internships"
    },
    workEnvironment: "Office or remote. Project-based work with cross-functional teams.",
    typicalEntryEducation: "Bachelor's degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      TX: { min: 85000, max: 165000, median: 120000, employment: 12400, demandLevel: "very_high" },
      CA: { min: 100000, max: 200000, median: 150000, employment: 28900, demandLevel: "very_high" },
      WA: { min: 95000, max: 190000, median: 145000, employment: 8700, demandLevel: "very_high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "8",
    title: "Wind Turbine Technician",
    category: "trades",
    description: "Install, maintain, and repair wind turbines. Work at great heights in renewable energy sector.",
    salaryMin: 45000,
    salaryMax: 80000,
    salaryMedian: 61770,
    educationRequired: "Technical Certificate",
    yearsExperience: "0-2 years",
    growthRate: "+45%",
    skills: ["Mechanical Skills", "Electrical Knowledge", "Physical Fitness", "Problem Solving", "Safety"],
    relatedCareers: ["Solar Panel Installer", "Electrical Technician", "Maintenance Technician"],
    pathways: [
      { type: "trade", description: "Complete wind energy technology certificate program.", duration: "1-2 years", cost: "$5,000-$15,000" },
      { type: "certification", description: "Earn technical certifications and safety credentials.", duration: "6-12 months", cost: "$3,000-$8,000" },
    ],
    blsCode: "49-9081",
    jobOutlook: "much_faster",
    projectedGrowth: 45,
    projectedOpenings: 1400,
    demandLevel: "high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Take physics and shop classes, learn about renewable energy, build physical fitness",
      post_secondary: "Enroll in wind technician program, obtain safety certifications, gain field experience"
    },
    workEnvironment: "Outdoor work at wind farms. Heights, various weather conditions.",
    typicalEntryEducation: "Postsecondary nondegree award",
    onTheJobTraining: "Long-term on-the-job training",
    stateSalaryData: {
      TX: { min: 50000, max: 85000, median: 65000, employment: 4200, demandLevel: "very_high" },
      IA: { min: 48000, max: 78000, median: 60000, employment: 1800, demandLevel: "high" },
      OK: { min: 45000, max: 75000, median: 58000, employment: 1500, demandLevel: "high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "9",
    title: "Physician Assistant",
    category: "healthcare",
    description: "Diagnose illnesses, develop treatment plans, and prescribe medications under physician supervision.",
    salaryMin: 100000,
    salaryMax: 180000,
    salaryMedian: 130000,
    educationRequired: "Master's Degree",
    yearsExperience: "0-3 years",
    growthRate: "+28%",
    skills: ["Medical Knowledge", "Patient Care", "Critical Thinking", "Communication", "Empathy"],
    relatedCareers: ["Nurse Practitioner", "Physician", "Healthcare Administrator"],
    pathways: [
      { type: "college", description: "Complete Bachelor's degree then PA Master's program.", duration: "6-7 years", cost: "$100,000-$300,000" },
    ],
    blsCode: "29-1071",
    jobOutlook: "much_faster",
    projectedGrowth: 28,
    projectedOpenings: 14100,
    demandLevel: "very_high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Excel in sciences, volunteer in healthcare, gain patient care experience",
      post_secondary: "Complete pre-PA requirements, work as medical assistant or EMT, apply to PA programs"
    },
    workEnvironment: "Hospitals, clinics, specialty practices. May include night/weekend shifts.",
    typicalEntryEducation: "Master's degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      TX: { min: 105000, max: 160000, median: 125000, employment: 12800, demandLevel: "very_high" },
      CA: { min: 120000, max: 190000, median: 150000, employment: 16200, demandLevel: "very_high" },
      NY: { min: 115000, max: 175000, median: 140000, employment: 11900, demandLevel: "high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "10",
    title: "Cybersecurity Analyst",
    category: "technology",
    description: "Protect computer systems and networks from cyber threats. Monitor security and respond to incidents.",
    salaryMin: 70000,
    salaryMax: 160000,
    salaryMedian: 120360,
    educationRequired: "Bachelor's Degree",
    yearsExperience: "0-5 years",
    growthRate: "+33%",
    skills: ["Network Security", "Threat Analysis", "Security Tools", "Problem Solving", "Communication"],
    relatedCareers: ["Security Engineer", "Penetration Tester", "Security Architect"],
    pathways: [
      { type: "college", description: "Earn a degree in Cybersecurity, Computer Science, or IT.", duration: "4 years", cost: "$40,000-$200,000" },
      { type: "certification", description: "Earn security certifications like CompTIA Security+, CISSP.", duration: "6-12 months", cost: "$5,000-$15,000" },
      { type: "military", description: "Serve in military cyber operations and transition to civilian roles.", duration: "4+ years", cost: "Free + Benefits" },
    ],
    blsCode: "15-1212",
    jobOutlook: "much_faster",
    projectedGrowth: 33,
    projectedOpenings: 16800,
    demandLevel: "very_high",
    appropriateGrades: ["middle_school", "high_school", "post_secondary"],
    entryPointsForGrades: {
      middle_school: "Learn about online safety, explore coding, participate in cyber competitions",
      high_school: "Take cybersecurity courses, join CyberPatriot, learn networking basics",
      post_secondary: "Get cybersecurity degree, earn certifications, participate in CTF competitions"
    },
    workEnvironment: "Office or remote. May include on-call responsibilities for security incidents.",
    typicalEntryEducation: "Bachelor's degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      TX: { min: 80000, max: 155000, median: 115000, employment: 24600, demandLevel: "very_high" },
      CA: { min: 95000, max: 180000, median: 140000, employment: 31200, demandLevel: "very_high" },
      VA: { min: 90000, max: 170000, median: 135000, employment: 28900, demandLevel: "very_high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "11",
    title: "Solar Photovoltaic Installer",
    category: "trades",
    description: "Install and maintain solar panel systems on rooftops and other structures.",
    salaryMin: 35000,
    salaryMax: 65000,
    salaryMedian: 47670,
    educationRequired: "High School + Training",
    yearsExperience: "0-2 years",
    growthRate: "+22%",
    skills: ["Electrical Knowledge", "Physical Fitness", "Safety Awareness", "Technical Skills", "Problem Solving"],
    relatedCareers: ["Electrician", "Wind Turbine Technician", "Construction Worker"],
    pathways: [
      { type: "trade", description: "Complete solar installation training program.", duration: "6-12 months", cost: "$3,000-$10,000" },
      { type: "certification", description: "Earn NABCEP certification for solar installation.", duration: "3-6 months", cost: "$2,000-$5,000" },
    ],
    blsCode: "47-2231",
    jobOutlook: "much_faster",
    projectedGrowth: 22,
    projectedOpenings: 3500,
    demandLevel: "high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Learn basic electrical concepts, take vocational courses, develop physical fitness",
      post_secondary: "Complete solar training program, earn certifications, gain field experience"
    },
    workEnvironment: "Outdoor work on rooftops. Physical labor in various weather conditions.",
    typicalEntryEducation: "High school diploma",
    onTheJobTraining: "Moderate-term on-the-job training",
    stateSalaryData: {
      CA: { min: 45000, max: 75000, median: 55000, employment: 12800, demandLevel: "very_high" },
      AZ: { min: 38000, max: 60000, median: 48000, employment: 3200, demandLevel: "high" },
      TX: { min: 36000, max: 58000, median: 46000, employment: 4500, demandLevel: "high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "12",
    title: "Elementary School Teacher",
    category: "education",
    description: "Teach students in grades K-5 foundational skills in reading, writing, math, and other subjects.",
    salaryMin: 40000,
    salaryMax: 80000,
    salaryMedian: 61690,
    educationRequired: "Bachelor's Degree + License",
    yearsExperience: "0-3 years",
    growthRate: "+1%",
    skills: ["Classroom Management", "Communication", "Patience", "Creativity", "Organization"],
    relatedCareers: ["Special Education Teacher", "School Counselor", "Principal"],
    pathways: [
      { type: "college", description: "Earn a Bachelor's in Elementary Education and obtain teaching license.", duration: "4 years", cost: "$40,000-$150,000" },
      { type: "certification", description: "Complete alternative certification program after bachelor's degree.", duration: "1-2 years", cost: "$5,000-$15,000" },
    ],
    blsCode: "25-2021",
    jobOutlook: "little_change",
    projectedGrowth: 1,
    projectedOpenings: 107100,
    demandLevel: "high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Tutor younger students, volunteer at schools, take education courses",
      post_secondary: "Major in education, complete student teaching, obtain certification"
    },
    workEnvironment: "Schools. Regular school-year schedule with summers off.",
    typicalEntryEducation: "Bachelor's degree",
    onTheJobTraining: "Internship/residency",
    stateSalaryData: {
      TX: { min: 45000, max: 65000, median: 55000, employment: 178500, demandLevel: "high" },
      CA: { min: 55000, max: 95000, median: 75000, employment: 156200, demandLevel: "moderate" },
      NY: { min: 50000, max: 90000, median: 70000, employment: 89300, demandLevel: "moderate" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "13",
    title: "Physical Therapist",
    category: "healthcare",
    description: "Help patients recover from injuries and improve movement through exercises and treatments.",
    salaryMin: 75000,
    salaryMax: 130000,
    salaryMedian: 99710,
    educationRequired: "Doctoral Degree (DPT)",
    yearsExperience: "0-3 years",
    growthRate: "+15%",
    skills: ["Anatomy Knowledge", "Patient Care", "Communication", "Physical Stamina", "Problem Solving"],
    relatedCareers: ["Occupational Therapist", "Athletic Trainer", "Chiropractor"],
    pathways: [
      { type: "college", description: "Complete Bachelor's degree then Doctor of Physical Therapy (DPT) program.", duration: "7 years", cost: "$150,000-$350,000" },
    ],
    blsCode: "29-1123",
    jobOutlook: "much_faster",
    projectedGrowth: 15,
    projectedOpenings: 12800,
    demandLevel: "high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Excel in biology and anatomy, volunteer in PT clinics, play sports",
      post_secondary: "Complete pre-PT requirements, shadow physical therapists, apply to DPT programs"
    },
    workEnvironment: "Hospitals, clinics, sports facilities. Active work requiring physical stamina.",
    typicalEntryEducation: "Doctoral or professional degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      TX: { min: 80000, max: 120000, median: 95000, employment: 18900, demandLevel: "high" },
      CA: { min: 95000, max: 145000, median: 115000, employment: 22100, demandLevel: "high" },
      FL: { min: 75000, max: 110000, median: 90000, employment: 16800, demandLevel: "high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "14",
    title: "Veterinarian",
    category: "healthcare",
    description: "Diagnose and treat animals, perform surgeries, and provide preventive care.",
    salaryMin: 70000,
    salaryMax: 180000,
    salaryMedian: 119100,
    educationRequired: "Doctoral Degree (DVM)",
    yearsExperience: "0-3 years",
    growthRate: "+19%",
    skills: ["Animal Care", "Medical Knowledge", "Surgery Skills", "Communication", "Problem Solving"],
    relatedCareers: ["Veterinary Technician", "Animal Scientist", "Zoologist"],
    pathways: [
      { type: "college", description: "Complete Bachelor's degree then Doctor of Veterinary Medicine (DVM) program.", duration: "8 years", cost: "$200,000-$400,000" },
    ],
    blsCode: "29-1131",
    jobOutlook: "much_faster",
    projectedGrowth: 19,
    projectedOpenings: 4600,
    demandLevel: "high",
    appropriateGrades: ["elementary", "middle_school", "high_school", "post_secondary"],
    entryPointsForGrades: {
      elementary: "Learn about animals, visit zoos and animal shelters, read about animal care",
      middle_school: "Volunteer at animal shelters, learn animal anatomy, join 4-H clubs",
      high_school: "Gain hands-on experience with animals, excel in biology and chemistry, shadow vets",
      post_secondary: "Complete pre-vet requirements, gain clinical experience, apply to vet schools"
    },
    workEnvironment: "Veterinary clinics, animal hospitals. May include emergency and weekend work.",
    typicalEntryEducation: "Doctoral or professional degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      TX: { min: 80000, max: 150000, median: 110000, employment: 5800, demandLevel: "high" },
      CA: { min: 100000, max: 190000, median: 140000, employment: 7200, demandLevel: "high" },
      FL: { min: 75000, max: 140000, median: 105000, employment: 4900, demandLevel: "moderate" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "15",
    title: "Construction Manager",
    category: "trades",
    description: "Plan, coordinate, and oversee construction projects from start to finish.",
    salaryMin: 60000,
    salaryMax: 150000,
    salaryMedian: 104900,
    educationRequired: "Bachelor's Degree or Experience",
    yearsExperience: "5+ years",
    growthRate: "+5%",
    skills: ["Project Management", "Leadership", "Budgeting", "Communication", "Problem Solving"],
    relatedCareers: ["Civil Engineer", "Architect", "General Contractor"],
    pathways: [
      { type: "college", description: "Earn a degree in Construction Management or Civil Engineering.", duration: "4 years", cost: "$40,000-$180,000" },
      { type: "trade", description: "Advance through construction trades and gain management experience.", duration: "10+ years", cost: "On-the-job experience" },
    ],
    blsCode: "11-9021",
    jobOutlook: "faster_than_average",
    projectedGrowth: 5,
    projectedOpenings: 45100,
    demandLevel: "high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Learn trades skills, take construction technology courses, work summer construction jobs",
      post_secondary: "Pursue construction management degree, gain field experience, obtain certifications"
    },
    workEnvironment: "Construction sites and offices. Project-based work with travel.",
    typicalEntryEducation: "Bachelor's degree",
    onTheJobTraining: "Moderate-term on-the-job training",
    stateSalaryData: {
      TX: { min: 70000, max: 140000, median: 100000, employment: 28900, demandLevel: "high" },
      CA: { min: 85000, max: 170000, median: 125000, employment: 32100, demandLevel: "high" },
      FL: { min: 65000, max: 130000, median: 95000, employment: 21500, demandLevel: "high" }
    },
    blsLastUpdated: "2024-09"
  }
];

const seedResources: Resource[] = [
  {
    id: "1",
    title: "Gates Scholarship",
    description: "Full scholarship for outstanding minority high school seniors with significant financial need.",
    type: "scholarship",
    category: "financial",
    url: "https://www.thegatesscholarship.org/",
    amount: 100000,
    deadline: "2025-09-15",
    eligibility: ["High school senior", "Pell Grant eligible", "GPA 3.3+"],
    tags: ["Full Ride", "Minorities", "High School Seniors"],
  },
  {
    id: "2",
    title: "Dell Scholars Program",
    description: "Scholarship for students who demonstrate grit and ambition to succeed despite challenges.",
    type: "scholarship",
    category: "financial",
    url: "https://www.dellscholars.org/",
    amount: 20000,
    deadline: "2025-12-01",
    eligibility: ["High school senior", "Pell Grant eligible", "GPA 2.4+"],
    tags: ["Underserved", "First Generation", "College Prep"],
  },
  {
    id: "3",
    title: "Coca-Cola Scholars Program",
    description: "Achievement-based scholarship for high school seniors who demonstrate leadership and service.",
    type: "scholarship",
    category: "financial",
    url: "https://www.coca-colascholarsfoundation.org/apply/",
    amount: 20000,
    deadline: "2025-10-31",
    eligibility: ["High school senior", "US Citizen", "GPA 3.0+"],
    tags: ["Leadership", "Community Service", "Achievement"],
  },
  {
    id: "11",
    title: "Jack Kent Cooke Foundation",
    description: "College scholarship for high-achieving students with financial need to attend the nation's top colleges.",
    type: "scholarship",
    category: "financial",
    url: "https://www.jkcf.org/our-scholarships/",
    amount: 55000,
    deadline: "2025-11-18",
    eligibility: ["High school senior", "GPA 3.5+", "Financial need", "Top 15% of class"],
    tags: ["High Achievers", "Financial Need", "Full Ride"],
  },
  {
    id: "12",
    title: "Questbridge National College Match",
    description: "Program that connects high-achieving, low-income students with full scholarships to top colleges.",
    type: "scholarship",
    category: "financial",
    url: "https://www.questbridge.org/high-school-students/national-college-match",
    amount: 200000,
    deadline: "2025-09-26",
    eligibility: ["High school senior", "Low income", "Strong academics"],
    tags: ["Full Ride", "Low Income", "Top Colleges"],
  },
  {
    id: "13",
    title: "Ron Brown Scholar Program",
    description: "Scholarship for African American high school seniors who excel academically and are committed to public service.",
    type: "scholarship",
    category: "financial",
    url: "https://www.ronbrown.org/apply",
    amount: 40000,
    deadline: "2025-11-01",
    eligibility: ["African American", "High school senior", "Community leadership"],
    tags: ["African American", "Leadership", "Public Service"],
  },
  {
    id: "14",
    title: "Hispanic Scholarship Fund",
    description: "Scholarships for Hispanic students pursuing higher education across all disciplines.",
    type: "scholarship",
    category: "financial",
    url: "https://www.hsf.net/scholarship",
    amount: 5000,
    deadline: "2025-02-15",
    eligibility: ["Hispanic heritage", "US Citizen or eligible non-citizen", "GPA 3.0+"],
    tags: ["Hispanic", "Higher Education", "All Majors"],
  },
  {
    id: "15",
    title: "Cameron Impact Scholarship",
    description: "Four-year scholarship for students who demonstrate leadership and commitment to making a positive impact.",
    type: "scholarship",
    category: "financial",
    url: "https://www.bryancameroneducationfoundation.org/cameron-impact-scholarship",
    amount: 100000,
    deadline: "2025-09-13",
    eligibility: ["High school senior", "GPA 3.7+", "Leadership experience"],
    tags: ["Full Ride", "Leadership", "Impact"],
  },
  {
    id: "4",
    title: "FAFSA Complete Guide",
    description: "Step-by-step walkthrough of the Free Application for Federal Student Aid process.",
    type: "guide",
    category: "financial",
    url: "https://studentaid.gov/h/apply-for-aid/fafsa",
    tags: ["Financial Aid", "College", "Government Aid"],
  },
  {
    id: "5",
    title: "Resume Writing 101",
    description: "Learn how to create a compelling resume that stands out to employers.",
    type: "guide",
    category: "career",
    url: "https://www.indeed.com/career-advice/resumes-cover-letters/how-to-make-a-resume-with-examples",
    tags: ["Job Search", "Career Development", "Professional Skills"],
  },
  {
    id: "6",
    title: "Interview Preparation Tips",
    description: "Master the art of interviewing with these proven strategies and practice questions.",
    type: "video",
    category: "career",
    url: "https://www.youtube.com/results?search_query=job+interview+tips",
    tags: ["Interviews", "Job Search", "Communication"],
  },
  {
    id: "7",
    title: "Military Career Paths",
    description: "Explore different branches and career opportunities within the US Armed Forces.",
    type: "guide",
    category: "military",
    url: "https://www.todaysmilitary.com/ways-to-serve",
    tags: ["Armed Forces", "Career Paths", "Benefits"],
  },
  {
    id: "8",
    title: "Budgeting Basics for Students",
    description: "Learn essential budgeting skills to manage your money effectively in college and beyond.",
    type: "video",
    category: "financial",
    url: "https://www.khanacademy.org/college-careers-more/personal-finance",
    tags: ["Money Management", "Budgeting", "Life Skills"],
  },
  {
    id: "9",
    title: "SAT/ACT Prep Resources",
    description: "Free and low-cost resources to help you prepare for standardized college entrance exams.",
    type: "tool",
    category: "college",
    url: "https://www.khanacademy.org/sat",
    tags: ["Test Prep", "SAT", "ACT", "College Admissions"],
  },
  {
    id: "10",
    title: "College Application Timeline",
    description: "A month-by-month guide to stay on track with your college application process.",
    type: "guide",
    category: "college",
    url: "https://bigfuture.collegeboard.org/plan-for-college/your-college-application-timeline",
    tags: ["Applications", "Planning", "Deadlines"],
  },
];

// Country Affordability Index (CAI) Database - 120+ countries
// Based on The Nomad Network Global Pricing System
const caiCountries: CAICountry[] = [
  // High Income (CAI: 0.70-1.0)
  { code: "US", name: "United States", currency: "USD", currencySymbol: "$", caiScore: 1.0, lcsiAdjustment: 0.0, region: "Americas", incomeLevel: "high", avgMonthlyIncomeUSD: 5500, lastUpdated: "2024-12" },
  { code: "CH", name: "Switzerland", currency: "CHF", currencySymbol: "CHF", caiScore: 0.95, lcsiAdjustment: 0.05, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 6500, lastUpdated: "2024-12" },
  { code: "NO", name: "Norway", currency: "NOK", currencySymbol: "kr", caiScore: 0.92, lcsiAdjustment: 0.05, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 5800, lastUpdated: "2024-12" },
  { code: "AU", name: "Australia", currency: "AUD", currencySymbol: "$", caiScore: 0.88, lcsiAdjustment: 0.03, region: "Oceania", incomeLevel: "high", avgMonthlyIncomeUSD: 4800, lastUpdated: "2024-12" },
  { code: "DE", name: "Germany", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.85, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 4200, lastUpdated: "2024-12" },
  { code: "CA", name: "Canada", currency: "CAD", currencySymbol: "$", caiScore: 0.85, lcsiAdjustment: 0.02, region: "Americas", incomeLevel: "high", avgMonthlyIncomeUSD: 4000, lastUpdated: "2024-12" },
  { code: "GB", name: "United Kingdom", currency: "GBP", currencySymbol: "\u00A3", caiScore: 0.82, lcsiAdjustment: 0.03, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 4100, lastUpdated: "2024-12" },
  { code: "NL", name: "Netherlands", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.82, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 4300, lastUpdated: "2024-12" },
  { code: "SE", name: "Sweden", currency: "SEK", currencySymbol: "kr", caiScore: 0.80, lcsiAdjustment: 0.03, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 4000, lastUpdated: "2024-12" },
  { code: "DK", name: "Denmark", currency: "DKK", currencySymbol: "kr", caiScore: 0.80, lcsiAdjustment: 0.04, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 4800, lastUpdated: "2024-12" },
  { code: "AT", name: "Austria", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.78, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 3800, lastUpdated: "2024-12" },
  { code: "BE", name: "Belgium", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.78, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 3700, lastUpdated: "2024-12" },
  { code: "IE", name: "Ireland", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.78, lcsiAdjustment: 0.03, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 4200, lastUpdated: "2024-12" },
  { code: "FR", name: "France", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.75, lcsiAdjustment: 0.03, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 3500, lastUpdated: "2024-12" },
  { code: "FI", name: "Finland", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.75, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 3800, lastUpdated: "2024-12" },
  { code: "NZ", name: "New Zealand", currency: "NZD", currencySymbol: "$", caiScore: 0.75, lcsiAdjustment: 0.03, region: "Oceania", incomeLevel: "high", avgMonthlyIncomeUSD: 3400, lastUpdated: "2024-12" },
  { code: "JP", name: "Japan", currency: "JPY", currencySymbol: "\u00A5", caiScore: 0.72, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "high", avgMonthlyIncomeUSD: 3200, lastUpdated: "2024-12" },
  { code: "SG", name: "Singapore", currency: "SGD", currencySymbol: "$", caiScore: 0.72, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "high", avgMonthlyIncomeUSD: 4500, lastUpdated: "2024-12" },
  { code: "KR", name: "South Korea", currency: "KRW", currencySymbol: "\u20A9", caiScore: 0.70, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "high", avgMonthlyIncomeUSD: 2800, lastUpdated: "2024-12" },
  { code: "IT", name: "Italy", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.70, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 2600, lastUpdated: "2024-12" },
  { code: "ES", name: "Spain", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.68, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 2400, lastUpdated: "2024-12" },
  { code: "PT", name: "Portugal", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.65, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 1800, lastUpdated: "2024-12" },
  { code: "IL", name: "Israel", currency: "ILS", currencySymbol: "\u20AA", caiScore: 0.70, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "high", avgMonthlyIncomeUSD: 3200, lastUpdated: "2024-12" },
  { code: "AE", name: "United Arab Emirates", currency: "AED", currencySymbol: "AED", caiScore: 0.75, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "high", avgMonthlyIncomeUSD: 4000, lastUpdated: "2024-12" },
  { code: "QA", name: "Qatar", currency: "QAR", currencySymbol: "QR", caiScore: 0.78, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "high", avgMonthlyIncomeUSD: 5000, lastUpdated: "2024-12" },
  
  // Upper-Middle Income (CAI: 0.40-0.69)
  { code: "CZ", name: "Czech Republic", currency: "CZK", currencySymbol: "K\u010D", caiScore: 0.58, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 1600, lastUpdated: "2024-12" },
  { code: "PL", name: "Poland", currency: "PLN", currencySymbol: "z\u0142", caiScore: 0.55, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 1500, lastUpdated: "2024-12" },
  { code: "HU", name: "Hungary", currency: "HUF", currencySymbol: "Ft", caiScore: 0.52, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 1300, lastUpdated: "2024-12" },
  { code: "GR", name: "Greece", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.55, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 1400, lastUpdated: "2024-12" },
  { code: "HR", name: "Croatia", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.50, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 1200, lastUpdated: "2024-12" },
  { code: "RO", name: "Romania", currency: "RON", currencySymbol: "lei", caiScore: 0.45, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 1100, lastUpdated: "2024-12" },
  { code: "BG", name: "Bulgaria", currency: "BGN", currencySymbol: "лв", caiScore: 0.42, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 900, lastUpdated: "2024-12" },
  { code: "RU", name: "Russia", currency: "RUB", currencySymbol: "\u20BD", caiScore: 0.45, lcsiAdjustment: 0.03, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 800, lastUpdated: "2024-12" },
  { code: "TR", name: "Turkey", currency: "TRY", currencySymbol: "\u20BA", caiScore: 0.42, lcsiAdjustment: 0.03, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 700, lastUpdated: "2024-12" },
  { code: "MX", name: "Mexico", currency: "MXN", currencySymbol: "$", caiScore: 0.45, lcsiAdjustment: 0.03, region: "Americas", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 650, lastUpdated: "2024-12" },
  { code: "BR", name: "Brazil", currency: "BRL", currencySymbol: "R$", caiScore: 0.42, lcsiAdjustment: 0.04, region: "Americas", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 600, lastUpdated: "2024-12" },
  { code: "AR", name: "Argentina", currency: "ARS", currencySymbol: "$", caiScore: 0.35, lcsiAdjustment: 0.05, region: "Americas", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 450, lastUpdated: "2024-12" },
  { code: "CL", name: "Chile", currency: "CLP", currencySymbol: "$", caiScore: 0.50, lcsiAdjustment: 0.03, region: "Americas", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 1000, lastUpdated: "2024-12" },
  { code: "CO", name: "Colombia", currency: "COP", currencySymbol: "$", caiScore: 0.38, lcsiAdjustment: 0.03, region: "Americas", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 400, lastUpdated: "2024-12" },
  { code: "PE", name: "Peru", currency: "PEN", currencySymbol: "S/", caiScore: 0.35, lcsiAdjustment: 0.03, region: "Americas", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 450, lastUpdated: "2024-12" },
  { code: "EC", name: "Ecuador", currency: "USD", currencySymbol: "$", caiScore: 0.35, lcsiAdjustment: 0.03, region: "Americas", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 400, lastUpdated: "2024-12" },
  { code: "CN", name: "China", currency: "CNY", currencySymbol: "\u00A5", caiScore: 0.48, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 900, lastUpdated: "2024-12" },
  { code: "TH", name: "Thailand", currency: "THB", currencySymbol: "\u0E3F", caiScore: 0.42, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 550, lastUpdated: "2024-12" },
  { code: "MY", name: "Malaysia", currency: "MYR", currencySymbol: "RM", caiScore: 0.48, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 800, lastUpdated: "2024-12" },
  { code: "ZA", name: "South Africa", currency: "ZAR", currencySymbol: "R", caiScore: 0.40, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 500, lastUpdated: "2024-12" },
  { code: "EG", name: "Egypt", currency: "EGP", currencySymbol: "\u00A3", caiScore: 0.32, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 300, lastUpdated: "2024-12" },
  { code: "JO", name: "Jordan", currency: "JOD", currencySymbol: "JD", caiScore: 0.38, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 500, lastUpdated: "2024-12" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR", currencySymbol: "SR", caiScore: 0.60, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 2000, lastUpdated: "2024-12" },
  { code: "KW", name: "Kuwait", currency: "KWD", currencySymbol: "KD", caiScore: 0.65, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 2500, lastUpdated: "2024-12" },
  
  // Lower-Middle Income (CAI: 0.20-0.39)
  { code: "IN", name: "India", currency: "INR", currencySymbol: "\u20B9", caiScore: 0.25, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 200, lastUpdated: "2024-12" },
  { code: "PH", name: "Philippines", currency: "PHP", currencySymbol: "\u20B1", caiScore: 0.28, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 300, lastUpdated: "2024-12" },
  { code: "ID", name: "Indonesia", currency: "IDR", currencySymbol: "Rp", caiScore: 0.30, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 350, lastUpdated: "2024-12" },
  { code: "VN", name: "Vietnam", currency: "VND", currencySymbol: "\u20AB", caiScore: 0.28, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 280, lastUpdated: "2024-12" },
  { code: "PK", name: "Pakistan", currency: "PKR", currencySymbol: "Rs", caiScore: 0.22, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 150, lastUpdated: "2024-12" },
  { code: "BD", name: "Bangladesh", currency: "BDT", currencySymbol: "\u09F3", caiScore: 0.20, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 120, lastUpdated: "2024-12" },
  { code: "LK", name: "Sri Lanka", currency: "LKR", currencySymbol: "Rs", caiScore: 0.25, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 180, lastUpdated: "2024-12" },
  { code: "NP", name: "Nepal", currency: "NPR", currencySymbol: "Rs", caiScore: 0.20, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 100, lastUpdated: "2024-12" },
  { code: "MM", name: "Myanmar", currency: "MMK", currencySymbol: "K", caiScore: 0.18, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 80, lastUpdated: "2024-12" },
  { code: "KH", name: "Cambodia", currency: "KHR", currencySymbol: "\u17DB", caiScore: 0.22, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 150, lastUpdated: "2024-12" },
  { code: "NG", name: "Nigeria", currency: "NGN", currencySymbol: "\u20A6", caiScore: 0.25, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 150, lastUpdated: "2024-12" },
  { code: "KE", name: "Kenya", currency: "KES", currencySymbol: "KSh", caiScore: 0.25, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 180, lastUpdated: "2024-12" },
  { code: "GH", name: "Ghana", currency: "GHS", currencySymbol: "\u20B5", caiScore: 0.25, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 200, lastUpdated: "2024-12" },
  { code: "TZ", name: "Tanzania", currency: "TZS", currencySymbol: "TSh", caiScore: 0.22, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 100, lastUpdated: "2024-12" },
  { code: "UG", name: "Uganda", currency: "UGX", currencySymbol: "USh", caiScore: 0.20, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 80, lastUpdated: "2024-12" },
  { code: "SN", name: "Senegal", currency: "XOF", currencySymbol: "CFA", caiScore: 0.22, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 150, lastUpdated: "2024-12" },
  { code: "CI", name: "Ivory Coast", currency: "XOF", currencySymbol: "CFA", caiScore: 0.25, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 180, lastUpdated: "2024-12" },
  { code: "CM", name: "Cameroon", currency: "XAF", currencySymbol: "FCFA", caiScore: 0.22, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 130, lastUpdated: "2024-12" },
  { code: "ZW", name: "Zimbabwe", currency: "ZWL", currencySymbol: "$", caiScore: 0.18, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 100, lastUpdated: "2024-12" },
  { code: "MA", name: "Morocco", currency: "MAD", currencySymbol: "DH", caiScore: 0.32, lcsiAdjustment: 0.03, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 350, lastUpdated: "2024-12" },
  { code: "TN", name: "Tunisia", currency: "TND", currencySymbol: "DT", caiScore: 0.30, lcsiAdjustment: 0.03, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 300, lastUpdated: "2024-12" },
  { code: "DZ", name: "Algeria", currency: "DZD", currencySymbol: "DA", caiScore: 0.30, lcsiAdjustment: 0.03, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 280, lastUpdated: "2024-12" },
  { code: "UA", name: "Ukraine", currency: "UAH", currencySymbol: "\u20B4", caiScore: 0.28, lcsiAdjustment: 0.04, region: "Europe", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 350, lastUpdated: "2024-12" },
  { code: "BY", name: "Belarus", currency: "BYN", currencySymbol: "Br", caiScore: 0.32, lcsiAdjustment: 0.03, region: "Europe", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 450, lastUpdated: "2024-12" },
  { code: "BO", name: "Bolivia", currency: "BOB", currencySymbol: "Bs", caiScore: 0.28, lcsiAdjustment: 0.03, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 300, lastUpdated: "2024-12" },
  { code: "PY", name: "Paraguay", currency: "PYG", currencySymbol: "\u20B2", caiScore: 0.30, lcsiAdjustment: 0.03, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 350, lastUpdated: "2024-12" },
  { code: "GT", name: "Guatemala", currency: "GTQ", currencySymbol: "Q", caiScore: 0.28, lcsiAdjustment: 0.04, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 280, lastUpdated: "2024-12" },
  { code: "HN", name: "Honduras", currency: "HNL", currencySymbol: "L", caiScore: 0.25, lcsiAdjustment: 0.04, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 220, lastUpdated: "2024-12" },
  { code: "NI", name: "Nicaragua", currency: "NIO", currencySymbol: "C$", caiScore: 0.22, lcsiAdjustment: 0.04, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 180, lastUpdated: "2024-12" },
  { code: "SV", name: "El Salvador", currency: "USD", currencySymbol: "$", caiScore: 0.30, lcsiAdjustment: 0.03, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 350, lastUpdated: "2024-12" },
  { code: "DO", name: "Dominican Republic", currency: "DOP", currencySymbol: "RD$", caiScore: 0.35, lcsiAdjustment: 0.03, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 400, lastUpdated: "2024-12" },
  { code: "JM", name: "Jamaica", currency: "JMD", currencySymbol: "$", caiScore: 0.32, lcsiAdjustment: 0.04, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 350, lastUpdated: "2024-12" },
  { code: "CR", name: "Costa Rica", currency: "CRC", currencySymbol: "\u20A1", caiScore: 0.40, lcsiAdjustment: 0.03, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 600, lastUpdated: "2024-12" },
  { code: "PA", name: "Panama", currency: "PAB", currencySymbol: "B/.", caiScore: 0.45, lcsiAdjustment: 0.03, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 700, lastUpdated: "2024-12" },
  { code: "UY", name: "Uruguay", currency: "UYU", currencySymbol: "$", caiScore: 0.48, lcsiAdjustment: 0.02, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 900, lastUpdated: "2024-12" },
  
  // Low Income (CAI: 0.05-0.19)
  { code: "ET", name: "Ethiopia", currency: "ETB", currencySymbol: "Br", caiScore: 0.12, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 60, lastUpdated: "2024-12" },
  { code: "CD", name: "DR Congo", currency: "CDF", currencySymbol: "FC", caiScore: 0.08, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 40, lastUpdated: "2024-12" },
  { code: "ML", name: "Mali", currency: "XOF", currencySymbol: "CFA", caiScore: 0.10, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 50, lastUpdated: "2024-12" },
  { code: "NE", name: "Niger", currency: "XOF", currencySymbol: "CFA", caiScore: 0.08, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 35, lastUpdated: "2024-12" },
  { code: "MZ", name: "Mozambique", currency: "MZN", currencySymbol: "MT", caiScore: 0.10, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 45, lastUpdated: "2024-12" },
  { code: "MW", name: "Malawi", currency: "MWK", currencySymbol: "MK", caiScore: 0.08, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 30, lastUpdated: "2024-12" },
  { code: "ZM", name: "Zambia", currency: "ZMW", currencySymbol: "ZK", caiScore: 0.15, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 90, lastUpdated: "2024-12" },
  { code: "RW", name: "Rwanda", currency: "RWF", currencySymbol: "FRw", caiScore: 0.12, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 70, lastUpdated: "2024-12" },
  { code: "BF", name: "Burkina Faso", currency: "XOF", currencySymbol: "CFA", caiScore: 0.10, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 55, lastUpdated: "2024-12" },
  { code: "BJ", name: "Benin", currency: "XOF", currencySymbol: "CFA", caiScore: 0.12, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 75, lastUpdated: "2024-12" },
  { code: "TG", name: "Togo", currency: "XOF", currencySymbol: "CFA", caiScore: 0.10, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 50, lastUpdated: "2024-12" },
  { code: "MG", name: "Madagascar", currency: "MGA", currencySymbol: "Ar", caiScore: 0.08, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 35, lastUpdated: "2024-12" },
  { code: "SD", name: "Sudan", currency: "SDG", currencySymbol: "SDG", caiScore: 0.10, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 50, lastUpdated: "2024-12" },
  { code: "SS", name: "South Sudan", currency: "SSP", currencySymbol: "SSP", caiScore: 0.05, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 25, lastUpdated: "2024-12" },
  { code: "SO", name: "Somalia", currency: "SOS", currencySymbol: "Sh", caiScore: 0.05, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 25, lastUpdated: "2024-12" },
  { code: "CF", name: "Central African Republic", currency: "XAF", currencySymbol: "FCFA", caiScore: 0.05, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 30, lastUpdated: "2024-12" },
  { code: "TD", name: "Chad", currency: "XAF", currencySymbol: "FCFA", caiScore: 0.08, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 40, lastUpdated: "2024-12" },
  { code: "SL", name: "Sierra Leone", currency: "SLE", currencySymbol: "Le", caiScore: 0.08, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 40, lastUpdated: "2024-12" },
  { code: "LR", name: "Liberia", currency: "LRD", currencySymbol: "$", caiScore: 0.10, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 50, lastUpdated: "2024-12" },
  { code: "GM", name: "Gambia", currency: "GMD", currencySymbol: "D", caiScore: 0.12, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 60, lastUpdated: "2024-12" },
  { code: "GN", name: "Guinea", currency: "GNF", currencySymbol: "FG", caiScore: 0.10, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 55, lastUpdated: "2024-12" },
  { code: "GW", name: "Guinea-Bissau", currency: "XOF", currencySymbol: "CFA", caiScore: 0.08, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 40, lastUpdated: "2024-12" },
  { code: "BI", name: "Burundi", currency: "BIF", currencySymbol: "FBu", caiScore: 0.05, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 20, lastUpdated: "2024-12" },
  { code: "ER", name: "Eritrea", currency: "ERN", currencySymbol: "Nfk", caiScore: 0.08, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 45, lastUpdated: "2024-12" },
  { code: "AF", name: "Afghanistan", currency: "AFN", currencySymbol: "\u060B", caiScore: 0.08, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "low", avgMonthlyIncomeUSD: 40, lastUpdated: "2024-12" },
  { code: "YE", name: "Yemen", currency: "YER", currencySymbol: "\uFDFC", caiScore: 0.08, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "low", avgMonthlyIncomeUSD: 40, lastUpdated: "2024-12" },
  { code: "HT", name: "Haiti", currency: "HTG", currencySymbol: "G", caiScore: 0.10, lcsiAdjustment: 0.05, region: "Americas", incomeLevel: "low", avgMonthlyIncomeUSD: 60, lastUpdated: "2024-12" },
  
  // Additional countries (various income levels)
  { code: "CU", name: "Cuba", currency: "CUP", currencySymbol: "$", caiScore: 0.25, lcsiAdjustment: 0.05, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 30, lastUpdated: "2024-12" },
  { code: "VE", name: "Venezuela", currency: "VES", currencySymbol: "Bs", caiScore: 0.15, lcsiAdjustment: 0.05, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 50, lastUpdated: "2024-12" },
  { code: "IR", name: "Iran", currency: "IRR", currencySymbol: "\uFDFC", caiScore: 0.30, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 200, lastUpdated: "2024-12" },
  { code: "IQ", name: "Iraq", currency: "IQD", currencySymbol: "IQD", caiScore: 0.32, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 350, lastUpdated: "2024-12" },
  { code: "SY", name: "Syria", currency: "SYP", currencySymbol: "\u00A3", caiScore: 0.12, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "low", avgMonthlyIncomeUSD: 50, lastUpdated: "2024-12" },
  { code: "LB", name: "Lebanon", currency: "LBP", currencySymbol: "\u00A3", caiScore: 0.25, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 100, lastUpdated: "2024-12" },
  { code: "KZ", name: "Kazakhstan", currency: "KZT", currencySymbol: "\u20B8", caiScore: 0.38, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 550, lastUpdated: "2024-12" },
  { code: "UZ", name: "Uzbekistan", currency: "UZS", currencySymbol: "so'm", caiScore: 0.25, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 200, lastUpdated: "2024-12" },
  { code: "AZ", name: "Azerbaijan", currency: "AZN", currencySymbol: "\u20BC", caiScore: 0.35, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 450, lastUpdated: "2024-12" },
  { code: "GE", name: "Georgia", currency: "GEL", currencySymbol: "\u20BE", caiScore: 0.35, lcsiAdjustment: 0.03, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 400, lastUpdated: "2024-12" },
  { code: "AM", name: "Armenia", currency: "AMD", currencySymbol: "\u058F", caiScore: 0.32, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 350, lastUpdated: "2024-12" },
  { code: "MD", name: "Moldova", currency: "MDL", currencySymbol: "L", caiScore: 0.28, lcsiAdjustment: 0.03, region: "Europe", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 300, lastUpdated: "2024-12" },
  { code: "RS", name: "Serbia", currency: "RSD", currencySymbol: "din", caiScore: 0.42, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 700, lastUpdated: "2024-12" },
  { code: "BA", name: "Bosnia and Herzegovina", currency: "BAM", currencySymbol: "KM", caiScore: 0.38, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 550, lastUpdated: "2024-12" },
  { code: "MK", name: "North Macedonia", currency: "MKD", currencySymbol: "den", caiScore: 0.35, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 500, lastUpdated: "2024-12" },
  { code: "AL", name: "Albania", currency: "ALL", currencySymbol: "L", caiScore: 0.35, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 450, lastUpdated: "2024-12" },
  { code: "ME", name: "Montenegro", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.42, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 650, lastUpdated: "2024-12" },
  { code: "XK", name: "Kosovo", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.32, lcsiAdjustment: 0.03, region: "Europe", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 400, lastUpdated: "2024-12" },
  { code: "SI", name: "Slovenia", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.62, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 2000, lastUpdated: "2024-12" },
  { code: "SK", name: "Slovakia", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.55, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 1400, lastUpdated: "2024-12" },
  { code: "EE", name: "Estonia", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.58, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 1700, lastUpdated: "2024-12" },
  { code: "LV", name: "Latvia", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.52, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 1400, lastUpdated: "2024-12" },
  { code: "LT", name: "Lithuania", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.55, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 1500, lastUpdated: "2024-12" },
  { code: "CY", name: "Cyprus", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.58, lcsiAdjustment: 0.03, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 1800, lastUpdated: "2024-12" },
  { code: "MT", name: "Malta", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.60, lcsiAdjustment: 0.03, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 2000, lastUpdated: "2024-12" },
  { code: "LU", name: "Luxembourg", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.90, lcsiAdjustment: 0.05, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 5500, lastUpdated: "2024-12" },
  { code: "IS", name: "Iceland", currency: "ISK", currencySymbol: "kr", caiScore: 0.80, lcsiAdjustment: 0.05, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 4500, lastUpdated: "2024-12" },
  { code: "HK", name: "Hong Kong", currency: "HKD", currencySymbol: "$", caiScore: 0.68, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "high", avgMonthlyIncomeUSD: 3000, lastUpdated: "2024-12" },
  { code: "TW", name: "Taiwan", currency: "TWD", currencySymbol: "NT$", caiScore: 0.60, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "high", avgMonthlyIncomeUSD: 2000, lastUpdated: "2024-12" },
  { code: "MN", name: "Mongolia", currency: "MNT", currencySymbol: "\u20AE", caiScore: 0.28, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 300, lastUpdated: "2024-12" },
  { code: "LA", name: "Laos", currency: "LAK", currencySymbol: "\u20AD", caiScore: 0.20, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 150, lastUpdated: "2024-12" },
  { code: "BN", name: "Brunei", currency: "BND", currencySymbol: "$", caiScore: 0.65, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "high", avgMonthlyIncomeUSD: 2500, lastUpdated: "2024-12" },
  { code: "BT", name: "Bhutan", currency: "BTN", currencySymbol: "Nu.", caiScore: 0.22, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 200, lastUpdated: "2024-12" },
  { code: "MV", name: "Maldives", currency: "MVR", currencySymbol: "Rf", caiScore: 0.40, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 700, lastUpdated: "2024-12" },
  { code: "FJ", name: "Fiji", currency: "FJD", currencySymbol: "$", caiScore: 0.35, lcsiAdjustment: 0.04, region: "Oceania", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 400, lastUpdated: "2024-12" },
  { code: "PG", name: "Papua New Guinea", currency: "PGK", currencySymbol: "K", caiScore: 0.22, lcsiAdjustment: 0.05, region: "Oceania", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 180, lastUpdated: "2024-12" },
  { code: "WS", name: "Samoa", currency: "WST", currencySymbol: "T", caiScore: 0.28, lcsiAdjustment: 0.04, region: "Oceania", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 280, lastUpdated: "2024-12" },
  { code: "TO", name: "Tonga", currency: "TOP", currencySymbol: "T$", caiScore: 0.30, lcsiAdjustment: 0.04, region: "Oceania", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 350, lastUpdated: "2024-12" },
  { code: "VU", name: "Vanuatu", currency: "VUV", currencySymbol: "Vt", caiScore: 0.25, lcsiAdjustment: 0.05, region: "Oceania", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 250, lastUpdated: "2024-12" },
  { code: "SB", name: "Solomon Islands", currency: "SBD", currencySymbol: "$", caiScore: 0.18, lcsiAdjustment: 0.05, region: "Oceania", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 150, lastUpdated: "2024-12" },
  { code: "AO", name: "Angola", currency: "AOA", currencySymbol: "Kz", caiScore: 0.22, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 250, lastUpdated: "2024-12" },
  { code: "BW", name: "Botswana", currency: "BWP", currencySymbol: "P", caiScore: 0.38, lcsiAdjustment: 0.03, region: "Africa", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 600, lastUpdated: "2024-12" },
  { code: "NA", name: "Namibia", currency: "NAD", currencySymbol: "$", caiScore: 0.35, lcsiAdjustment: 0.03, region: "Africa", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 500, lastUpdated: "2024-12" },
  { code: "MU", name: "Mauritius", currency: "MUR", currencySymbol: "Rs", caiScore: 0.42, lcsiAdjustment: 0.03, region: "Africa", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 700, lastUpdated: "2024-12" },
  { code: "SC", name: "Seychelles", currency: "SCR", currencySymbol: "Rs", caiScore: 0.48, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 900, lastUpdated: "2024-12" },
  { code: "CV", name: "Cabo Verde", currency: "CVE", currencySymbol: "$", caiScore: 0.28, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 300, lastUpdated: "2024-12" },
  { code: "DJ", name: "Djibouti", currency: "DJF", currencySymbol: "Fdj", caiScore: 0.22, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 200, lastUpdated: "2024-12" },
  { code: "LS", name: "Lesotho", currency: "LSL", currencySymbol: "L", caiScore: 0.15, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 100, lastUpdated: "2024-12" },
  { code: "SZ", name: "Eswatini", currency: "SZL", currencySymbol: "E", caiScore: 0.22, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 200, lastUpdated: "2024-12" },
  { code: "TT", name: "Trinidad and Tobago", currency: "TTD", currencySymbol: "$", caiScore: 0.48, lcsiAdjustment: 0.03, region: "Americas", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 1200, lastUpdated: "2024-12" },
  { code: "BS", name: "Bahamas", currency: "BSD", currencySymbol: "$", caiScore: 0.60, lcsiAdjustment: 0.04, region: "Americas", incomeLevel: "high", avgMonthlyIncomeUSD: 2200, lastUpdated: "2024-12" },
  { code: "BB", name: "Barbados", currency: "BBD", currencySymbol: "$", caiScore: 0.52, lcsiAdjustment: 0.04, region: "Americas", incomeLevel: "high", avgMonthlyIncomeUSD: 1500, lastUpdated: "2024-12" },
  { code: "BZ", name: "Belize", currency: "BZD", currencySymbol: "$", caiScore: 0.32, lcsiAdjustment: 0.04, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 400, lastUpdated: "2024-12" },
  { code: "GY", name: "Guyana", currency: "GYD", currencySymbol: "$", caiScore: 0.35, lcsiAdjustment: 0.04, region: "Americas", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 500, lastUpdated: "2024-12" },
  { code: "SR", name: "Suriname", currency: "SRD", currencySymbol: "$", caiScore: 0.32, lcsiAdjustment: 0.04, region: "Americas", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 400, lastUpdated: "2024-12" },
  { code: "OM", name: "Oman", currency: "OMR", currencySymbol: "OMR", caiScore: 0.55, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "high", avgMonthlyIncomeUSD: 1800, lastUpdated: "2024-12" },
  { code: "BH", name: "Bahrain", currency: "BHD", currencySymbol: "BD", caiScore: 0.58, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "high", avgMonthlyIncomeUSD: 2000, lastUpdated: "2024-12" },
  { code: "TJ", name: "Tajikistan", currency: "TJS", currencySymbol: "SM", caiScore: 0.15, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "low", avgMonthlyIncomeUSD: 90, lastUpdated: "2024-12" },
  { code: "KG", name: "Kyrgyzstan", currency: "KGS", currencySymbol: "c", caiScore: 0.18, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 120, lastUpdated: "2024-12" },
  { code: "TM", name: "Turkmenistan", currency: "TMT", currencySymbol: "m", caiScore: 0.32, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 400, lastUpdated: "2024-12" },
  { code: "LY", name: "Libya", currency: "LYD", currencySymbol: "LD", caiScore: 0.35, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 400, lastUpdated: "2024-12" },
  { code: "MR", name: "Mauritania", currency: "MRU", currencySymbol: "UM", caiScore: 0.15, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 100, lastUpdated: "2024-12" },
  { code: "GQ", name: "Equatorial Guinea", currency: "XAF", currencySymbol: "FCFA", caiScore: 0.35, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 600, lastUpdated: "2024-12" },
  { code: "GA", name: "Gabon", currency: "XAF", currencySymbol: "FCFA", caiScore: 0.38, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 650, lastUpdated: "2024-12" },
  { code: "CG", name: "Republic of Congo", currency: "XAF", currencySymbol: "FCFA", caiScore: 0.22, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 200, lastUpdated: "2024-12" },
];

export class DatabaseStorage implements IStorage {
  private assessmentResults: Map<string, AssessmentResult> = new Map();

  // Lessons - stored in database, tied to user
  async getLessons(userId: string): Promise<Lesson[]> {
    return await db.select().from(lessons).where(eq(lessons.userId, userId)).orderBy(desc(lessons.createdAt));
  }

  async getLesson(id: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson || undefined;
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [created] = await db.insert(lessons).values(lesson as any).returning();
    return created;
  }

  async deleteLesson(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(lessons)
      .where(and(eq(lessons.id, id), eq(lessons.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getLessonByShareId(shareId: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.shareId, shareId));
    return lesson || undefined;
  }

  async toggleLessonShare(id: string, userId: string): Promise<{ shareId: string | null } | undefined> {
    const lesson = await this.getLesson(id);
    if (!lesson || lesson.userId !== userId) return undefined;
    
    const newShareId = lesson.shareId ? null : randomUUID().substring(0, 12);
    await db.update(lessons).set({ shareId: newShareId }).where(eq(lessons.id, id));
    return { shareId: newShareId };
  }

  async countMonthlyGenerations(userId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(lessonGenerations)
      .where(and(
        eq(lessonGenerations.userId, userId),
        gte(lessonGenerations.createdAt, startOfMonth)
      ));
    return Number(result[0]?.count || 0);
  }

  async logLessonGeneration(userId: string, topic?: string): Promise<void> {
    await db.insert(lessonGenerations).values({ userId, topic });
  }

  async tryReserveLessonGeneration(userId: string, limit: number, topic?: string): Promise<{ success: boolean; currentCount: number }> {
    // Atomic check-and-insert using a single SQL statement
    // This inserts a row only if the current count is below the limit
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await db.execute(sql`
      WITH current_count AS (
        SELECT COUNT(*) as cnt FROM lesson_generations 
        WHERE user_id = ${userId} AND created_at >= ${startOfMonth}
      ),
      inserted AS (
        INSERT INTO lesson_generations (id, user_id, topic, created_at)
        SELECT gen_random_uuid(), ${userId}, ${topic}, NOW()
        WHERE (SELECT cnt FROM current_count) < ${limit}
        RETURNING 1
      )
      SELECT 
        (SELECT cnt FROM current_count)::int as current_count,
        (SELECT COUNT(*) FROM inserted)::int as inserted_count
    `);
    
    const row = result.rows[0] as any;
    const currentCount = Number(row?.current_count || 0);
    const insertedCount = Number(row?.inserted_count || 0);
    
    return {
      success: insertedCount > 0,
      currentCount: currentCount
    };
  }

  // Lesson Templates - stored in database
  async getLessonTemplates(userId: string): Promise<LessonTemplate[]> {
    return await db.select().from(lessonTemplates)
      .where(eq(lessonTemplates.userId, userId))
      .orderBy(desc(lessonTemplates.createdAt));
  }

  async getPublicLessonTemplates(): Promise<LessonTemplate[]> {
    return await db.select().from(lessonTemplates)
      .where(eq(lessonTemplates.visibility, "public"))
      .orderBy(desc(lessonTemplates.useCount));
  }

  async getLessonTemplate(id: string): Promise<LessonTemplate | undefined> {
    const [template] = await db.select().from(lessonTemplates).where(eq(lessonTemplates.id, id));
    return template || undefined;
  }

  async createLessonTemplate(template: InsertLessonTemplate): Promise<LessonTemplate> {
    const [created] = await db.insert(lessonTemplates).values(template as any).returning();
    return created;
  }

  async updateLessonTemplate(id: string, updates: Partial<LessonTemplate>, userId: string): Promise<LessonTemplate | undefined> {
    const template = await this.getLessonTemplate(id);
    if (!template || template.userId !== userId) return undefined;
    
    const [updated] = await db.update(lessonTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(lessonTemplates.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteLessonTemplate(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(lessonTemplates)
      .where(and(eq(lessonTemplates.id, id), eq(lessonTemplates.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async incrementTemplateUseCount(id: string): Promise<void> {
    await db.update(lessonTemplates)
      .set({ useCount: sql`${lessonTemplates.useCount} + 1` })
      .where(eq(lessonTemplates.id, id));
  }

  // Goals - stored in database
  async getGoals(userId?: string): Promise<Goal[]> {
    if (userId) {
      return await db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.createdAt));
    }
    return await db.select().from(goals).orderBy(desc(goals.createdAt));
  }

  async getGoal(id: string): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal || undefined;
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [created] = await db.insert(goals).values({
      ...goal,
      milestones: goal.milestones || [],
    } as any).returning();
    return created;
  }

  async updateGoal(id: string, updates: Partial<Goal>, userId?: string | null): Promise<Goal | undefined> {
    const goal = await this.getGoal(id);
    if (!goal) return undefined;
    if (goal.userId && goal.userId !== userId) return undefined;
    
    const [updated] = await db.update(goals).set(updates).where(eq(goals.id, id)).returning();
    return updated || undefined;
  }

  async deleteGoal(id: string, userId?: string | null): Promise<boolean> {
    const goal = await this.getGoal(id);
    if (!goal) return false;
    if (goal.userId && goal.userId !== userId) return false;
    
    await db.delete(goals).where(eq(goals.id, id));
    return true;
  }

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
  }

  // Educator Profiles
  async getEducatorProfile(userId: string): Promise<EducatorProfile | undefined> {
    const [profile] = await db.select().from(educatorProfiles).where(eq(educatorProfiles.userId, userId));
    return profile || undefined;
  }

  async createEducatorProfile(profile: InsertEducatorProfile): Promise<EducatorProfile> {
    const [created] = await db.insert(educatorProfiles).values(profile as any).returning();
    return created;
  }

  async updateEducatorProfile(userId: string, updates: Partial<EducatorProfile>): Promise<EducatorProfile | undefined> {
    const existing = await this.getEducatorProfile(userId);
    if (!existing) return undefined;
    
    const [updated] = await db.update(educatorProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(educatorProfiles.userId, userId))
      .returning();
    return updated || undefined;
  }

  // User management
  async getUser(userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user || undefined;
  }

  async getUserTier(userId: string): Promise<string> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user?.tier || "free";
  }

  async updateUserTier(userId: string, tier: string): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ tier: tier as any, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated || undefined;
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated || undefined;
  }

  async completeOnboarding(userId: string): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ onboardingCompleted: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated || undefined;
  }

  // Sponsored Access
  async getUserSponsoredAccess(userId: string): Promise<SponsoredAccess | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user?.sponsoredAccessId) return undefined;
    
    const [access] = await db.select()
      .from(sponsoredAccess)
      .where(and(
        eq(sponsoredAccess.id, user.sponsoredAccessId),
        eq(sponsoredAccess.status, "active")
      ));
    return access || undefined;
  }

  async getActiveSponsorship(placement: string): Promise<ContextualSponsorship | undefined> {
    const now = new Date();
    const [sponsor] = await db.select()
      .from(contextualSponsorships)
      .where(and(
        eq(contextualSponsorships.placement, placement as any),
        eq(contextualSponsorships.isActive, true),
        eq(contextualSponsorships.minorsSafe, true)
      ))
      .limit(1);
    return sponsor || undefined;
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return prefs || undefined;
  }

  async createUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences> {
    const [created] = await db.insert(userPreferences).values(prefs as any).returning();
    return created;
  }

  async updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences | undefined> {
    const existing = await this.getUserPreferences(userId);
    
    // Filter out undefined values to prevent overwriting existing data
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    if (!existing) {
      return await this.createUserPreferences({ userId, ...filteredUpdates } as InsertUserPreferences);
    }
    
    // Merge with existing preferences
    const [updated] = await db.update(userPreferences)
      .set({ ...filteredUpdates, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId))
      .returning();
    return updated || undefined;
  }

  // Static data - careers
  async getCareers(): Promise<Career[]> {
    return seedCareers;
  }

  async getCareer(id: string): Promise<Career | undefined> {
    return seedCareers.find(c => c.id === id);
  }

  async getCareersByGrade(gradeBand: string): Promise<Career[]> {
    return seedCareers.filter(c => 
      c.appropriateGrades?.includes(gradeBand as any) ?? true
    );
  }

  async getTrendingCareers(limit: number = 10): Promise<Career[]> {
    // Sort by growth rate and demand level
    const outlookOrder = { "much_faster": 5, "faster_than_average": 4, "average": 3, "little_change": 2, "declining": 1 };
    const demandOrder = { "very_high": 4, "high": 3, "moderate": 2, "low": 1 };
    
    return [...seedCareers]
      .sort((a, b) => {
        const aOutlook = outlookOrder[a.jobOutlook || "average"] || 3;
        const bOutlook = outlookOrder[b.jobOutlook || "average"] || 3;
        const aDemand = demandOrder[a.demandLevel || "moderate"] || 2;
        const bDemand = demandOrder[b.demandLevel || "moderate"] || 2;
        
        // Primary sort by outlook, secondary by demand
        if (bOutlook !== aOutlook) return bOutlook - aOutlook;
        return bDemand - aDemand;
      })
      .slice(0, limit);
  }

  async getCareersByState(stateCode: string): Promise<Career[]> {
    // Filter careers that have state-specific data for the given state
    return seedCareers.filter(c => 
      c.stateSalaryData && stateCode in c.stateSalaryData
    ).map(c => ({
      ...c,
      // Override national salary data with state-specific data
      salaryMin: c.stateSalaryData![stateCode].min,
      salaryMax: c.stateSalaryData![stateCode].max,
      salaryMedian: c.stateSalaryData![stateCode].median,
      demandLevel: c.stateSalaryData![stateCode].demandLevel || c.demandLevel,
    }));
  }

  async updateCareerFromBls(blsCode: string, updates: Partial<Career>): Promise<Career | undefined> {
    const index = seedCareers.findIndex(c => c.blsCode === blsCode);
    if (index === -1) return undefined;
    
    seedCareers[index] = {
      ...seedCareers[index],
      ...updates,
      blsLastUpdated: new Date().toISOString().slice(0, 7), // YYYY-MM format
    };
    
    return seedCareers[index];
  }

  // Static data - resources
  async getResources(): Promise<Resource[]> {
    return seedResources;
  }

  async getResource(id: string): Promise<Resource | undefined> {
    return seedResources.find(r => r.id === id);
  }

  // Assessments - in memory for now
  async getAssessments(): Promise<Assessment[]> {
    return [];
  }

  async getAssessment(id: string): Promise<Assessment | undefined> {
    return undefined;
  }

  async saveAssessmentResult(result: AssessmentResult): Promise<AssessmentResult> {
    this.assessmentResults.set(result.id, result);
    return result;
  }

  // Scope and Sequence
  async getScopeSequences(userId: string): Promise<ScopeSequence[]> {
    return await db.select().from(scopeSequences)
      .where(eq(scopeSequences.userId, userId))
      .orderBy(desc(scopeSequences.createdAt));
  }

  async getScopeSequence(id: string): Promise<ScopeSequence | undefined> {
    const [scope] = await db.select().from(scopeSequences).where(eq(scopeSequences.id, id));
    return scope || undefined;
  }

  async createScopeSequence(scope: InsertScopeSequence): Promise<ScopeSequence> {
    const [created] = await db.insert(scopeSequences).values(scope as any).returning();
    return created;
  }

  async updateScopeSequence(id: string, updates: Partial<ScopeSequence>, userId: string): Promise<ScopeSequence | undefined> {
    const scope = await this.getScopeSequence(id);
    if (!scope || scope.userId !== userId) return undefined;
    
    const [updated] = await db.update(scopeSequences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(scopeSequences.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteScopeSequence(id: string, userId: string): Promise<boolean> {
    const scope = await this.getScopeSequence(id);
    if (!scope || scope.userId !== userId) return false;
    
    // Delete associated units first
    await db.delete(sequenceUnits).where(eq(sequenceUnits.scopeId, id));
    // Delete the scope
    await db.delete(scopeSequences).where(eq(scopeSequences.id, id));
    return true;
  }

  // Sequence Units
  async getSequenceUnits(scopeId: string): Promise<SequenceUnit[]> {
    return await db.select().from(sequenceUnits)
      .where(eq(sequenceUnits.scopeId, scopeId))
      .orderBy(asc(sequenceUnits.unitNumber));
  }

  async getSequenceUnit(id: string): Promise<SequenceUnit | undefined> {
    const [unit] = await db.select().from(sequenceUnits).where(eq(sequenceUnits.id, id));
    return unit || undefined;
  }

  async createSequenceUnit(unit: InsertSequenceUnit): Promise<SequenceUnit> {
    const [created] = await db.insert(sequenceUnits).values(unit as any).returning();
    return created;
  }

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
  }

  async deleteSequenceUnit(id: string, userId: string): Promise<boolean> {
    const unit = await this.getSequenceUnit(id);
    if (!unit) return false;
    
    // Verify user owns the scope
    const scope = await this.getScopeSequence(unit.scopeId);
    if (!scope || scope.userId !== userId) return false;
    
    await db.delete(sequenceUnits).where(eq(sequenceUnits.id, id));
    return true;
  }

  // Scope Change Requests
  async getScopeChangeRequests(scopeId: string): Promise<ScopeChangeRequest[]> {
    return await db.select().from(scopeChangeRequests)
      .where(eq(scopeChangeRequests.scopeId, scopeId))
      .orderBy(desc(scopeChangeRequests.createdAt));
  }

  async createScopeChangeRequest(request: InsertScopeChangeRequest): Promise<ScopeChangeRequest> {
    const [created] = await db.insert(scopeChangeRequests).values(request as any).returning();
    return created;
  }

  async updateScopeChangeRequest(id: string, updates: Partial<ScopeChangeRequest>): Promise<ScopeChangeRequest | undefined> {
    const [updated] = await db.update(scopeChangeRequests)
      .set(updates)
      .where(eq(scopeChangeRequests.id, id))
      .returning();
    return updated || undefined;
  }

  async getAllPendingChangeRequests(): Promise<ScopeChangeRequest[]> {
    return await db.select().from(scopeChangeRequests)
      .where(eq(scopeChangeRequests.status, "pending"))
      .orderBy(desc(scopeChangeRequests.createdAt));
  }

  // Self-Discovery Results
  async getSelfDiscoveryResults(userId: string): Promise<SelfDiscoveryResult[]> {
    return await db.select().from(selfDiscoveryResults)
      .where(eq(selfDiscoveryResults.userId, userId))
      .orderBy(desc(selfDiscoveryResults.createdAt));
  }

  async saveSelfDiscoveryResult(result: InsertSelfDiscoveryResult): Promise<SelfDiscoveryResult> {
    const [created] = await db.insert(selfDiscoveryResults).values(result as any).returning();
    return created;
  }

  // Saved Careers
  async getSavedCareers(userId: string): Promise<SavedCareer[]> {
    return await db.select().from(savedCareers)
      .where(eq(savedCareers.userId, userId))
      .orderBy(desc(savedCareers.createdAt));
  }

  async saveCareer(career: InsertSavedCareer): Promise<SavedCareer> {
    const [created] = await db.insert(savedCareers).values(career as any).returning();
    return created;
  }

  async deleteSavedCareer(id: string, userId: string): Promise<boolean> {
    const [existing] = await db.select().from(savedCareers)
      .where(and(eq(savedCareers.id, id), eq(savedCareers.userId, userId)));
    if (!existing) return false;
    await db.delete(savedCareers).where(eq(savedCareers.id, id));
    return true;
  }

  // Affiliate System
  async getEducatorAffiliate(userId: string): Promise<EducatorAffiliate | undefined> {
    const [affiliate] = await db.select().from(educatorAffiliates)
      .where(eq(educatorAffiliates.userId, userId));
    return affiliate || undefined;
  }

  async getEducatorAffiliateByCode(referralCode: string): Promise<EducatorAffiliate | undefined> {
    const [affiliate] = await db.select().from(educatorAffiliates)
      .where(eq(educatorAffiliates.referralCode, referralCode));
    return affiliate || undefined;
  }

  async createEducatorAffiliate(affiliate: InsertEducatorAffiliate): Promise<EducatorAffiliate> {
    const [created] = await db.insert(educatorAffiliates).values(affiliate as any).returning();
    return created;
  }

  async updateEducatorAffiliate(userId: string, updates: Partial<EducatorAffiliate>): Promise<EducatorAffiliate | undefined> {
    const [updated] = await db.update(educatorAffiliates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(educatorAffiliates.userId, userId))
      .returning();
    return updated || undefined;
  }

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
  }

  async getReferralEvents(affiliateId: string, limit: number = 50): Promise<ReferralEvent[]> {
    return await db.select().from(referralEvents)
      .where(eq(referralEvents.affiliateId, affiliateId))
      .orderBy(desc(referralEvents.createdAt))
      .limit(limit);
  }

  // Affiliate Rewards
  async createAffiliateReward(reward: InsertAffiliateReward): Promise<AffiliateReward> {
    const [created] = await db.insert(affiliateRewards).values(reward as any).returning();
    return created;
  }

  async getAffiliateRewards(affiliateId: string): Promise<AffiliateReward[]> {
    return await db.select().from(affiliateRewards)
      .where(eq(affiliateRewards.affiliateId, affiliateId))
      .orderBy(desc(affiliateRewards.createdAt));
  }

  // Educational Standards Ingestion
  async getJurisdictions(country?: string): Promise<StandardsJurisdiction[]> {
    if (country) {
      return await db.select().from(standardsJurisdictions)
        .where(eq(standardsJurisdictions.country, country))
        .orderBy(asc(standardsJurisdictions.name));
    }
    return await db.select().from(standardsJurisdictions)
      .orderBy(asc(standardsJurisdictions.country), asc(standardsJurisdictions.name));
  }

  async getJurisdiction(id: string): Promise<StandardsJurisdiction | undefined> {
    const [result] = await db.select().from(standardsJurisdictions)
      .where(eq(standardsJurisdictions.id, id));
    return result || undefined;
  }

  async getJurisdictionByAbbr(country: string, abbreviation: string): Promise<StandardsJurisdiction | undefined> {
    const [result] = await db.select().from(standardsJurisdictions)
      .where(and(
        eq(standardsJurisdictions.country, country),
        eq(standardsJurisdictions.abbreviation, abbreviation)
      ));
    return result || undefined;
  }

  async createJurisdiction(jurisdiction: InsertStandardsJurisdiction): Promise<StandardsJurisdiction> {
    const [created] = await db.insert(standardsJurisdictions).values(jurisdiction as any).returning();
    return created;
  }

  async updateJurisdiction(id: string, updates: Partial<StandardsJurisdiction>): Promise<StandardsJurisdiction | undefined> {
    const [updated] = await db.update(standardsJurisdictions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(standardsJurisdictions.id, id))
      .returning();
    return updated || undefined;
  }

  async getStandardSets(jurisdictionId: string): Promise<StandardSet[]> {
    return await db.select().from(standardSets)
      .where(eq(standardSets.jurisdictionId, jurisdictionId))
      .orderBy(asc(standardSets.title));
  }

  async getStandardSet(id: string): Promise<StandardSet | undefined> {
    const [result] = await db.select().from(standardSets)
      .where(eq(standardSets.id, id));
    return result || undefined;
  }

  async getStandardSetByUid(uid: string): Promise<StandardSet | undefined> {
    const [result] = await db.select().from(standardSets)
      .where(eq(standardSets.uid, uid));
    return result || undefined;
  }

  async createStandardSet(set: InsertStandardSet): Promise<StandardSet> {
    const [created] = await db.insert(standardSets).values(set as any).returning();
    return created;
  }

  async updateStandardSet(id: string, updates: Partial<StandardSet>): Promise<StandardSet | undefined> {
    const [updated] = await db.update(standardSets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(standardSets.id, id))
      .returning();
    return updated || undefined;
  }

  async getEducationalStandards(standardSetId: string): Promise<EducationalStandard[]> {
    return await db.select().from(educationalStandardsDb)
      .where(eq(educationalStandardsDb.standardSetId, standardSetId))
      .orderBy(asc(educationalStandardsDb.position));
  }

  async getEducationalStandardsByGradeLevels(standardSetId: string, gradeLevels: string[]): Promise<EducationalStandard[]> {
    if (!gradeLevels || gradeLevels.length === 0) {
      return this.getEducationalStandards(standardSetId);
    }
    
    // Expand grade bands to individual grades for matching
    const expandedGrades = new Set<string>();
    const gradeBandMapping: Record<string, string[]> = {
      'elementary': ['K', '1', '2', '3', '4', '5'],
      'middle_school': ['6', '7', '8'],
      'high_school': ['9', '10', '11', '12'],
      'post_secondary': ['post_secondary', 'college', 'university', '13+'],
    };
    
    gradeLevels.forEach(level => {
      if (gradeBandMapping[level]) {
        gradeBandMapping[level].forEach(g => expandedGrades.add(g));
      } else {
        expandedGrades.add(level);
      }
    });
    
    const allStandards = await this.getEducationalStandards(standardSetId);
    
    // Filter standards by grade level
    return allStandards.filter(standard => {
      if (!standard.gradeLevel) return true; // Include standards without grade info
      
      const standardGrade = standard.gradeLevel.toLowerCase();
      
      // Check for exact match or range overlap
      for (const grade of expandedGrades) {
        const g = grade.toLowerCase();
        if (standardGrade === g) return true;
        if (standardGrade.includes(g)) return true;
        // Handle ranges like "9-12", "K-2", etc.
        if (standardGrade.includes('-')) {
          const [start, end] = standardGrade.split('-').map(s => s.trim());
          const gradeNum = parseInt(g);
          const startNum = start === 'k' ? 0 : parseInt(start);
          const endNum = parseInt(end);
          if (!isNaN(gradeNum) && !isNaN(startNum) && !isNaN(endNum)) {
            if (gradeNum >= startNum && gradeNum <= endNum) return true;
          }
        }
      }
      return false;
    });
  }

  async getEducationalStandard(id: string): Promise<EducationalStandard | undefined> {
    const [result] = await db.select().from(educationalStandardsDb)
      .where(eq(educationalStandardsDb.id, id));
    return result || undefined;
  }

  async getEducationalStandardByUid(uid: string): Promise<EducationalStandard | undefined> {
    const [result] = await db.select().from(educationalStandardsDb)
      .where(eq(educationalStandardsDb.uid, uid));
    return result || undefined;
  }

  async createEducationalStandard(standard: InsertEducationalStandard): Promise<EducationalStandard> {
    const [created] = await db.insert(educationalStandardsDb).values(standard as any).returning();
    return created;
  }

  async updateEducationalStandard(id: string, updates: Partial<EducationalStandard>): Promise<EducationalStandard | undefined> {
    const [updated] = await db.update(educationalStandardsDb)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(educationalStandardsDb.id, id))
      .returning();
    return updated || undefined;
  }

  async bulkCreateEducationalStandards(standards: InsertEducationalStandard[]): Promise<EducationalStandard[]> {
    if (standards.length === 0) return [];
    return await db.insert(educationalStandardsDb).values(standards as any[]).returning();
  }

  async createSyncLog(log: InsertSyncLog): Promise<SyncLog> {
    const [created] = await db.insert(standardsSyncLog).values(log as any).returning();
    return created;
  }

  async updateSyncLog(id: string, updates: Partial<SyncLog>): Promise<SyncLog | undefined> {
    const [updated] = await db.update(standardsSyncLog)
      .set(updates)
      .where(eq(standardsSyncLog.id, id))
      .returning();
    return updated || undefined;
  }

  async getLatestSyncLogs(limit: number = 20): Promise<SyncLog[]> {
    return await db.select().from(standardsSyncLog)
      .orderBy(desc(standardsSyncLog.startedAt))
      .limit(limit);
  }

  // Standards Staging (Approval Queue)
  async createStagingStandard(staging: InsertStandardsStaging): Promise<StandardsStaging> {
    const [created] = await db.insert(standardsStaging).values(staging as any).returning();
    return created;
  }

  async getStagingStandards(status?: string): Promise<StandardsStaging[]> {
    if (status) {
      return await db.select().from(standardsStaging)
        .where(eq(standardsStaging.status, status))
        .orderBy(desc(standardsStaging.createdAt));
    }
    return await db.select().from(standardsStaging)
      .orderBy(desc(standardsStaging.createdAt));
  }

  async updateStagingStandard(id: string, updates: Partial<StandardsStaging>): Promise<StandardsStaging | undefined> {
    const [updated] = await db.update(standardsStaging)
      .set(updates)
      .where(eq(standardsStaging.id, id))
      .returning();
    return updated || undefined;
  }

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
  }

  async rejectStagingStandard(id: string, reviewerId: string, reason: string): Promise<StandardsStaging | undefined> {
    const [updated] = await db.update(standardsStaging)
      .set({ status: "rejected", reviewedBy: reviewerId, reviewedAt: new Date(), rejectionReason: reason })
      .where(eq(standardsStaging.id, id))
      .returning();
    return updated || undefined;
  }

  async bulkCreateStagingStandards(standards: InsertStandardsStaging[]): Promise<StandardsStaging[]> {
    if (standards.length === 0) return [];
    return await db.insert(standardsStaging).values(standards as any[]).returning();
  }

  // Source Checksums (Change Detection)
  async createSourceChecksum(checksum: InsertSourceChecksum): Promise<SourceChecksum> {
    const [created] = await db.insert(sourceChecksums).values(checksum as any).returning();
    return created;
  }

  async getSourceChecksum(sourceUrl: string): Promise<SourceChecksum | undefined> {
    const [result] = await db.select().from(sourceChecksums)
      .where(eq(sourceChecksums.sourceUrl, sourceUrl));
    return result || undefined;
  }

  async updateSourceChecksum(id: string, updates: Partial<SourceChecksum>): Promise<SourceChecksum | undefined> {
    const [updated] = await db.update(sourceChecksums)
      .set({ ...updates, lastCheckedAt: new Date() })
      .where(eq(sourceChecksums.id, id))
      .returning();
    return updated || undefined;
  }

  async getChangedSources(): Promise<SourceChecksum[]> {
    return await db.select().from(sourceChecksums)
      .where(eq(sourceChecksums.hasChanged, true));
  }

  // PDF Import Queue
  async createPdfImport(pdfImport: InsertPdfImport): Promise<PdfImport> {
    const [created] = await db.insert(pdfImportQueue).values(pdfImport as any).returning();
    return created;
  }

  async getPdfImport(id: string): Promise<PdfImport | undefined> {
    const [result] = await db.select().from(pdfImportQueue)
      .where(eq(pdfImportQueue.id, id));
    return result || undefined;
  }

  async updatePdfImport(id: string, updates: Partial<PdfImport>): Promise<PdfImport | undefined> {
    const [updated] = await db.update(pdfImportQueue)
      .set(updates)
      .where(eq(pdfImportQueue.id, id))
      .returning();
    return updated || undefined;
  }

  async getPdfImports(userId: string): Promise<PdfImport[]> {
    return await db.select().from(pdfImportQueue)
      .where(eq(pdfImportQueue.userId, userId))
      .orderBy(desc(pdfImportQueue.createdAt));
  }

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
  }

  // ================================
  // Assignment System (Paid Feature)
  // ================================

  // Classes
  async getClasses(userId: string): Promise<Class[]> {
    return await db.select().from(classes)
      .where(eq(classes.userId, userId))
      .orderBy(desc(classes.createdAt));
  }

  async getClass(id: string): Promise<Class | undefined> {
    const [result] = await db.select().from(classes).where(eq(classes.id, id));
    return result || undefined;
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const [created] = await db.insert(classes).values(classData as any).returning();
    return created;
  }

  async updateClass(id: string, updates: Partial<Class>, userId: string): Promise<Class | undefined> {
    const existing = await this.getClass(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const [updated] = await db.update(classes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(classes.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteClass(id: string, userId: string): Promise<boolean> {
    const existing = await this.getClass(id);
    if (!existing || existing.userId !== userId) return false;
    
    await db.delete(classes).where(eq(classes.id, id));
    return true;
  }

  // Students
  async getStudents(userId: string): Promise<Student[]> {
    return await db.select().from(students)
      .where(eq(students.userId, userId))
      .orderBy(asc(students.lastName), asc(students.firstName));
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const [result] = await db.select().from(students).where(eq(students.id, id));
    return result || undefined;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [created] = await db.insert(students).values(student as any).returning();
    return created;
  }

  async updateStudent(id: string, updates: Partial<Student>, userId: string): Promise<Student | undefined> {
    const existing = await this.getStudent(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const [updated] = await db.update(students)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteStudent(id: string, userId: string): Promise<boolean> {
    const existing = await this.getStudent(id);
    if (!existing || existing.userId !== userId) return false;
    
    await db.delete(students).where(eq(students.id, id));
    return true;
  }

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
  }

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
  }

  async removeStudentFromClass(classId: string, studentId: string): Promise<boolean> {
    await db.delete(classStudents)
      .where(and(eq(classStudents.classId, classId), eq(classStudents.studentId, studentId)));
    return true;
  }

  // Organization-Scoped Classroom Access
  async getClassesByOrganization(organizationId: string): Promise<Class[]> {
    return await db.select().from(classes)
      .where(eq(classes.organizationId, organizationId))
      .orderBy(desc(classes.createdAt));
  }

  async getStudentsByOrganization(organizationId: string): Promise<Student[]> {
    return await db.select().from(students)
      .where(eq(students.organizationId, organizationId))
      .orderBy(asc(students.lastName), asc(students.firstName));
  }

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
  }

  async getStudentsByOrganizationHierarchy(organizationId: string): Promise<Student[]> {
    const childOrgs = await this.getChildOrganizations(organizationId);
    const orgIds = [organizationId, ...childOrgs.map(o => o.id)];
    
    const allStudents: Student[] = [];
    for (const orgId of orgIds) {
      const orgStudents = await this.getStudentsByOrganization(orgId);
      allStudents.push(...orgStudents);
    }
    return allStudents.sort((a, b) => a.lastName.localeCompare(b.lastName));
  }

  // Entity Sharing
  async createEntityShare(share: InsertEntityShare): Promise<EntityShare> {
    const [result] = await db.insert(entityShares).values(share as any).returning();
    return result;
  }

  async getEntityShare(id: string): Promise<EntityShare | undefined> {
    const [result] = await db.select().from(entityShares).where(eq(entityShares.id, id));
    return result || undefined;
  }

  async getEntityShares(entityType: string, entityId: string): Promise<EntityShare[]> {
    return await db.select().from(entityShares)
      .where(and(eq(entityShares.entityType, entityType as any), eq(entityShares.entityId, entityId)))
      .orderBy(desc(entityShares.createdAt));
  }

  async getSharedWithOrganization(targetOrganizationId: string): Promise<EntityShare[]> {
    return await db.select().from(entityShares)
      .where(eq(entityShares.targetOrganizationId, targetOrganizationId))
      .orderBy(desc(entityShares.createdAt));
  }

  async deleteEntityShare(id: string): Promise<boolean> {
    await db.delete(entityShares).where(eq(entityShares.id, id));
    return true;
  }

  // Student Groups
  async getStudentGroups(userId: string): Promise<StudentGroup[]> {
    return await db.select().from(studentGroups)
      .where(eq(studentGroups.userId, userId))
      .orderBy(desc(studentGroups.createdAt));
  }

  async getStudentGroup(id: string): Promise<StudentGroup | undefined> {
    const [result] = await db.select().from(studentGroups).where(eq(studentGroups.id, id));
    return result || undefined;
  }

  async createStudentGroup(group: InsertStudentGroup): Promise<StudentGroup> {
    const [created] = await db.insert(studentGroups).values(group as any).returning();
    return created;
  }

  async updateStudentGroup(id: string, updates: Partial<StudentGroup>, userId: string): Promise<StudentGroup | undefined> {
    const existing = await this.getStudentGroup(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const [updated] = await db.update(studentGroups)
      .set(updates)
      .where(eq(studentGroups.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteStudentGroup(id: string, userId: string): Promise<boolean> {
    const existing = await this.getStudentGroup(id);
    if (!existing || existing.userId !== userId) return false;
    
    await db.delete(studentGroups).where(eq(studentGroups.id, id));
    return true;
  }

  // Assignments
  async getAssignments(userId: string): Promise<Assignment[]> {
    return await db.select().from(assignments)
      .where(eq(assignments.userId, userId))
      .orderBy(desc(assignments.createdAt));
  }

  async getAssignment(id: string): Promise<Assignment | undefined> {
    const [result] = await db.select().from(assignments).where(eq(assignments.id, id));
    return result || undefined;
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [created] = await db.insert(assignments).values(assignment as any).returning();
    return created;
  }

  async updateAssignment(id: string, updates: Partial<Assignment>, userId: string): Promise<Assignment | undefined> {
    const existing = await this.getAssignment(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const [updated] = await db.update(assignments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(assignments.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAssignment(id: string, userId: string): Promise<boolean> {
    const existing = await this.getAssignment(id);
    if (!existing || existing.userId !== userId) return false;
    
    await db.delete(assignments).where(eq(assignments.id, id));
    return true;
  }

  // Assignment Recipients
  async getAssignmentRecipients(assignmentId: string): Promise<AssignmentRecipient[]> {
    return await db.select().from(assignmentRecipients)
      .where(eq(assignmentRecipients.assignmentId, assignmentId));
  }

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
  }

  async createAssignmentRecipient(recipient: InsertAssignmentRecipient): Promise<AssignmentRecipient> {
    const [created] = await db.insert(assignmentRecipients).values(recipient as any).returning();
    return created;
  }

  async updateAssignmentRecipient(id: string, updates: Partial<AssignmentRecipient>): Promise<AssignmentRecipient | undefined> {
    const [updated] = await db.update(assignmentRecipients)
      .set(updates)
      .where(eq(assignmentRecipients.id, id))
      .returning();
    return updated || undefined;
  }

  // ================================
  // Real-Time Collaboration System
  // ================================

  // Collaboration Sessions
  async getCollaborationSessions(userId: string): Promise<CollaborationSession[]> {
    return await db.select().from(collaborationSessions)
      .where(eq(collaborationSessions.hostUserId, userId))
      .orderBy(desc(collaborationSessions.createdAt));
  }

  async getActiveCollaborationSessions(userId: string): Promise<CollaborationSession[]> {
    return await db.select().from(collaborationSessions)
      .where(and(
        eq(collaborationSessions.hostUserId, userId),
        eq(collaborationSessions.status, "active")
      ))
      .orderBy(desc(collaborationSessions.createdAt));
  }

  async getCollaborationSession(id: string): Promise<CollaborationSession | undefined> {
    const [result] = await db.select().from(collaborationSessions)
      .where(eq(collaborationSessions.id, id));
    return result || undefined;
  }

  async getCollaborationSessionByInviteCode(inviteCode: string): Promise<CollaborationSession | undefined> {
    const [result] = await db.select().from(collaborationSessions)
      .where(eq(collaborationSessions.inviteCode, inviteCode));
    return result || undefined;
  }

  async createCollaborationSession(session: InsertCollaborationSession): Promise<CollaborationSession> {
    const [created] = await db.insert(collaborationSessions)
      .values(session as any)
      .returning();
    return created;
  }

  async updateCollaborationSession(id: string, updates: Partial<CollaborationSession>, hostUserId: string): Promise<CollaborationSession | undefined> {
    const existing = await this.getCollaborationSession(id);
    if (!existing || existing.hostUserId !== hostUserId) return undefined;
    
    const [updated] = await db.update(collaborationSessions)
      .set(updates)
      .where(eq(collaborationSessions.id, id))
      .returning();
    return updated || undefined;
  }

  async endCollaborationSession(id: string, hostUserId: string): Promise<CollaborationSession | undefined> {
    return await this.updateCollaborationSession(id, { 
      status: "ended", 
      endedAt: new Date() 
    }, hostUserId);
  }

  // Session Participants
  async getSessionParticipants(sessionId: string): Promise<SessionParticipant[]> {
    return await db.select().from(sessionParticipants)
      .where(eq(sessionParticipants.sessionId, sessionId))
      .orderBy(desc(sessionParticipants.joinedAt));
  }

  async getActiveSessionParticipants(sessionId: string): Promise<SessionParticipant[]> {
    return await db.select().from(sessionParticipants)
      .where(and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.status, "active")
      ));
  }

  async getSessionParticipant(sessionId: string, userId: string): Promise<SessionParticipant | undefined> {
    const [result] = await db.select().from(sessionParticipants)
      .where(and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.userId, userId)
      ));
    return result || undefined;
  }

  async createSessionParticipant(participant: InsertSessionParticipant): Promise<SessionParticipant> {
    const [created] = await db.insert(sessionParticipants)
      .values(participant as any)
      .returning();
    return created;
  }

  async updateSessionParticipant(id: string, updates: Partial<SessionParticipant>): Promise<SessionParticipant | undefined> {
    const [updated] = await db.update(sessionParticipants)
      .set({ ...updates, lastActiveAt: new Date() })
      .where(eq(sessionParticipants.id, id))
      .returning();
    return updated || undefined;
  }

  async leaveSession(sessionId: string, userId: string): Promise<boolean> {
    const participant = await this.getSessionParticipant(sessionId, userId);
    if (!participant) return false;
    
    await db.update(sessionParticipants)
      .set({ status: "left", leftAt: new Date() })
      .where(eq(sessionParticipants.id, participant.id));
    return true;
  }

  // Collaboration Messages
  async getCollaborationMessages(sessionId: string, limit = 50): Promise<CollaborationMessage[]> {
    return await db.select().from(collaborationMessages)
      .where(eq(collaborationMessages.sessionId, sessionId))
      .orderBy(desc(collaborationMessages.createdAt))
      .limit(limit);
  }

  async createCollaborationMessage(message: InsertCollaborationMessage): Promise<CollaborationMessage> {
    const [created] = await db.insert(collaborationMessages)
      .values(message as any)
      .returning();
    return created;
  }

  // Shared Resources
  async getSharedResources(filters?: { visibility?: string; category?: string; subject?: string }): Promise<SharedResource[]> {
    let query = db.select().from(sharedResources);
    
    if (filters?.visibility) {
      query = query.where(eq(sharedResources.visibility, filters.visibility)) as any;
    }
    
    return await query.orderBy(desc(sharedResources.createdAt));
  }

  async getUserSharedResources(userId: string): Promise<SharedResource[]> {
    return await db.select().from(sharedResources)
      .where(eq(sharedResources.userId, userId))
      .orderBy(desc(sharedResources.createdAt));
  }

  async getSharedResource(id: string): Promise<SharedResource | undefined> {
    const [result] = await db.select().from(sharedResources)
      .where(eq(sharedResources.id, id));
    return result || undefined;
  }

  async createSharedResource(resource: InsertSharedResource): Promise<SharedResource> {
    const [created] = await db.insert(sharedResources)
      .values(resource as any)
      .returning();
    return created;
  }

  async updateSharedResource(id: string, updates: Partial<SharedResource>, userId: string): Promise<SharedResource | undefined> {
    const existing = await this.getSharedResource(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const [updated] = await db.update(sharedResources)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sharedResources.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSharedResource(id: string, userId: string): Promise<boolean> {
    const existing = await this.getSharedResource(id);
    if (!existing || existing.userId !== userId) return false;
    
    await db.delete(sharedResources).where(eq(sharedResources.id, id));
    return true;
  }

  async incrementResourceDownload(id: string): Promise<void> {
    const resource = await this.getSharedResource(id);
    if (resource) {
      await db.update(sharedResources)
        .set({ downloadCount: (resource.downloadCount || 0) + 1 })
        .where(eq(sharedResources.id, id));
    }
  }

  // Resource Likes
  async getResourceLike(resourceId: string, userId: string): Promise<ResourceLike | undefined> {
    const [result] = await db.select().from(resourceLikes)
      .where(and(
        eq(resourceLikes.resourceId, resourceId),
        eq(resourceLikes.userId, userId)
      ));
    return result || undefined;
  }

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
  }

  // Session Edit History
  async getSessionEditHistory(sessionId: string, limit = 100): Promise<SessionEditHistory[]> {
    return await db.select().from(sessionEditHistory)
      .where(eq(sessionEditHistory.sessionId, sessionId))
      .orderBy(desc(sessionEditHistory.createdAt))
      .limit(limit);
  }

  async createSessionEdit(edit: InsertSessionEditHistory): Promise<SessionEditHistory> {
    const [created] = await db.insert(sessionEditHistory)
      .values(edit as any)
      .returning();
    return created;
  }

  // Get sessions user is participating in
  async getUserParticipatedSessions(userId: string): Promise<CollaborationSession[]> {
    const participations = await db.select().from(sessionParticipants)
      .where(eq(sessionParticipants.userId, userId));
    
    const sessions: CollaborationSession[] = [];
    for (const p of participations) {
      const session = await this.getCollaborationSession(p.sessionId);
      if (session && session.status === "active") {
        sessions.push(session);
      }
    }
    return sessions;
  }

  // Organizations (Multi-Tenant)
  async getOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).orderBy(asc(organizations.name));
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [result] = await db.select().from(organizations).where(eq(organizations.id, id));
    return result || undefined;
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const [result] = await db.select().from(organizations).where(eq(organizations.slug, slug));
    return result || undefined;
  }

  async getChildOrganizations(parentId: string): Promise<Organization[]> {
    return db.select().from(organizations).where(eq(organizations.parentOrganizationId, parentId));
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [created] = await db.insert(organizations).values(org as any).returning();
    return created;
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined> {
    const [updated] = await db.update(organizations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteOrganization(id: string): Promise<boolean> {
    await db.delete(organizations).where(eq(organizations.id, id));
    return true;
  }

  // Organization Memberships
  async getOrganizationMembers(orgId: string): Promise<OrgMembership[]> {
    return await db.select().from(organizationMemberships)
      .where(eq(organizationMemberships.organizationId, orgId));
  }

  async getUserOrganizations(userId: string): Promise<OrgMembership[]> {
    return await db.select().from(organizationMemberships)
      .where(eq(organizationMemberships.userId, userId));
  }

  async getOrgMembership(orgId: string, userId: string): Promise<OrgMembership | undefined> {
    const [result] = await db.select().from(organizationMemberships)
      .where(and(
        eq(organizationMemberships.organizationId, orgId),
        eq(organizationMemberships.userId, userId)
      ));
    return result || undefined;
  }

  async createOrgMembership(membership: InsertOrgMembership): Promise<OrgMembership> {
    const [created] = await db.insert(organizationMemberships).values(membership as any).returning();
    return created;
  }

  async updateOrgMembership(id: string, updates: Partial<OrgMembership>): Promise<OrgMembership | undefined> {
    const [updated] = await db.update(organizationMemberships)
      .set(updates)
      .where(eq(organizationMemberships.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteOrgMembership(id: string): Promise<boolean> {
    await db.delete(organizationMemberships).where(eq(organizationMemberships.id, id));
    return true;
  }

  // Organization Invitations
  async getOrgInvitations(orgId: string): Promise<OrgInvitation[]> {
    return await db.select().from(organizationInvitations)
      .where(eq(organizationInvitations.organizationId, orgId));
  }

  async getOrgInvitationByToken(token: string): Promise<OrgInvitation | undefined> {
    const [result] = await db.select().from(organizationInvitations)
      .where(eq(organizationInvitations.token, token));
    return result || undefined;
  }

  async createOrgInvitation(invitation: InsertOrgInvitation): Promise<OrgInvitation> {
    const [created] = await db.insert(organizationInvitations).values(invitation as any).returning();
    return created;
  }

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
  }

  async deleteOrgInvitation(id: string): Promise<boolean> {
    await db.delete(organizationInvitations).where(eq(organizationInvitations.id, id));
    return true;
  }

  // Site Administrators
  async getSiteAdmins(): Promise<SiteAdmin[]> {
    return await db.select().from(siteAdmins);
  }

  async getSiteAdmin(userId: string): Promise<SiteAdmin | undefined> {
    const [result] = await db.select().from(siteAdmins).where(eq(siteAdmins.userId, userId));
    return result || undefined;
  }

  async isSiteAdmin(userId: string): Promise<boolean> {
    const admin = await this.getSiteAdmin(userId);
    return !!admin;
  }

  async createSiteAdmin(admin: InsertSiteAdmin): Promise<SiteAdmin> {
    const [created] = await db.insert(siteAdmins).values(admin as any).returning();
    return created;
  }

  async deleteSiteAdmin(userId: string): Promise<boolean> {
    await db.delete(siteAdmins).where(eq(siteAdmins.userId, userId));
    return true;
  }

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
  }

  async getParentStudentLink(id: string): Promise<ParentStudentLink | undefined> {
    const [result] = await db.select().from(parentStudentLinks)
      .where(eq(parentStudentLinks.id, id));
    return result || undefined;
  }

  async getParentStudentLinkByUsers(parentUserId: string, studentUserId: string): Promise<ParentStudentLink | undefined> {
    const [result] = await db.select().from(parentStudentLinks)
      .where(and(
        eq(parentStudentLinks.parentUserId, parentUserId),
        eq(parentStudentLinks.studentUserId, studentUserId)
      ));
    return result || undefined;
  }

  async createParentStudentLink(link: InsertParentStudentLink): Promise<ParentStudentLink> {
    const [created] = await db.insert(parentStudentLinks).values(link as any).returning();
    return created;
  }

  async updateParentStudentLink(id: string, updates: Partial<ParentStudentLink>): Promise<ParentStudentLink | undefined> {
    const [updated] = await db.update(parentStudentLinks)
      .set(updates)
      .where(eq(parentStudentLinks.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteParentStudentLink(id: string): Promise<boolean> {
    await db.delete(parentStudentLinks).where(eq(parentStudentLinks.id, id));
    return true;
  }

  // Parent Invitations
  async getParentInvitations(studentUserId: string): Promise<ParentInvitation[]> {
    return await db.select().from(parentInvitations)
      .where(eq(parentInvitations.studentUserId, studentUserId))
      .orderBy(desc(parentInvitations.createdAt));
  }

  async getParentInvitationByToken(token: string): Promise<ParentInvitation | undefined> {
    const [result] = await db.select().from(parentInvitations)
      .where(eq(parentInvitations.token, token));
    return result || undefined;
  }

  async createParentInvitation(invitation: InsertParentInvitation): Promise<ParentInvitation> {
    const [created] = await db.insert(parentInvitations).values(invitation as any).returning();
    return created;
  }

  async updateParentInvitation(id: string, updates: Partial<ParentInvitation>): Promise<ParentInvitation | undefined> {
    const [updated] = await db.update(parentInvitations)
      .set(updates)
      .where(eq(parentInvitations.id, id))
      .returning();
    return updated || undefined;
  }

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
  }

  async deleteParentInvitation(id: string): Promise<boolean> {
    await db.delete(parentInvitations).where(eq(parentInvitations.id, id));
    return true;
  }

  // Parent Progress Notes
  async getParentProgressNotes(linkId: string): Promise<ParentProgressNote[]> {
    return await db.select().from(parentProgressNotes)
      .where(eq(parentProgressNotes.linkId, linkId))
      .orderBy(desc(parentProgressNotes.createdAt));
  }

  async createParentProgressNote(note: InsertParentProgressNote): Promise<ParentProgressNote> {
    const [created] = await db.insert(parentProgressNotes).values(note as any).returning();
    return created;
  }

  async deleteParentProgressNote(id: string, parentUserId: string): Promise<boolean> {
    await db.delete(parentProgressNotes).where(
      and(
        eq(parentProgressNotes.id, id),
        eq(parentProgressNotes.parentUserId, parentUserId)
      )
    );
    return true;
  }

  // Feature Flags
  async getFeatureFlags(): Promise<FeatureFlag[]> {
    return await db.select().from(featureFlags).orderBy(asc(featureFlags.name));
  }

  async getFeatureFlag(id: string): Promise<FeatureFlag | undefined> {
    const [flag] = await db.select().from(featureFlags).where(eq(featureFlags.id, id));
    return flag || undefined;
  }

  async getFeatureFlagByName(name: string): Promise<FeatureFlag | undefined> {
    const [flag] = await db.select().from(featureFlags).where(eq(featureFlags.name, name));
    return flag || undefined;
  }

  async createFeatureFlag(flag: InsertFeatureFlag): Promise<FeatureFlag> {
    const [created] = await db.insert(featureFlags).values(flag as any).returning();
    return created;
  }

  async updateFeatureFlag(id: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag | undefined> {
    const [updated] = await db.update(featureFlags)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(featureFlags.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteFeatureFlag(id: string): Promise<boolean> {
    await db.delete(featureFlags).where(eq(featureFlags.id, id));
    return true;
  }

  // Email Templates
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).orderBy(asc(emailTemplates.name));
  }

  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return template || undefined;
  }

  async getEmailTemplateByName(name: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.name, name));
    return template || undefined;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [created] = await db.insert(emailTemplates).values(template as any).returning();
    return created;
  }

  async updateEmailTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate | undefined> {
    const [updated] = await db.update(emailTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteEmailTemplate(id: string): Promise<boolean> {
    await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
    return true;
  }

  // ==========================================================================
  // Global Authority Tree (LYS V3.0)
  // ==========================================================================

  async getAuthorities(level?: string): Promise<Authority[]> {
    if (level) {
      return await db.select().from(authorities)
        .where(eq(authorities.level, level as any))
        .orderBy(asc(authorities.name));
    }
    return await db.select().from(authorities).orderBy(asc(authorities.name));
  }

  async getAuthority(id: string): Promise<Authority | undefined> {
    const [authority] = await db.select().from(authorities).where(eq(authorities.id, id));
    return authority || undefined;
  }

  async getAuthorityByCode(code: string): Promise<Authority | undefined> {
    const [authority] = await db.select().from(authorities).where(eq(authorities.code, code));
    return authority || undefined;
  }

  async getChildAuthorities(parentId: string): Promise<Authority[]> {
    return await db.select().from(authorities)
      .where(eq(authorities.parentId, parentId))
      .orderBy(asc(authorities.name));
  }

  async createAuthority(authority: InsertAuthority): Promise<Authority> {
    const [created] = await db.insert(authorities).values(authority as any).returning();
    return created;
  }

  async updateAuthority(id: string, updates: Partial<Authority>): Promise<Authority | undefined> {
    const [updated] = await db.update(authorities)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(authorities.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAuthority(id: string): Promise<boolean> {
    await db.delete(authorities).where(eq(authorities.id, id));
    return true;
  }

  // ==========================================================================
  // LYS Milestones (Being, Knowing, Doing)
  // ==========================================================================

  async getLyseMilestones(userId: string): Promise<LyseMilestone[]> {
    return await db.select().from(lyseMilestones)
      .where(eq(lyseMilestones.userId, userId))
      .orderBy(asc(lyseMilestones.dueDate));
  }

  async getLyseMilestone(id: string): Promise<LyseMilestone | undefined> {
    const [milestone] = await db.select().from(lyseMilestones).where(eq(lyseMilestones.id, id));
    return milestone || undefined;
  }

  async getLyseMilestonesByCategory(userId: string, category: string): Promise<LyseMilestone[]> {
    return await db.select().from(lyseMilestones)
      .where(and(
        eq(lyseMilestones.userId, userId),
        eq(lyseMilestones.category, category as any)
      ))
      .orderBy(asc(lyseMilestones.dueDate));
  }

  async getGatekeeperMilestones(userId: string): Promise<LyseMilestone[]> {
    return await db.select().from(lyseMilestones)
      .where(and(
        eq(lyseMilestones.userId, userId),
        eq(lyseMilestones.isGatekeeper, true)
      ))
      .orderBy(asc(lyseMilestones.dueDate));
  }

  async createLyseMilestone(milestone: InsertLyseMilestone): Promise<LyseMilestone> {
    const [created] = await db.insert(lyseMilestones).values(milestone as any).returning();
    return created;
  }

  async updateLyseMilestone(id: string, updates: Partial<LyseMilestone>): Promise<LyseMilestone | undefined> {
    const [updated] = await db.update(lyseMilestones)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(lyseMilestones.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteLyseMilestone(id: string, userId: string): Promise<boolean> {
    await db.delete(lyseMilestones).where(
      and(eq(lyseMilestones.id, id), eq(lyseMilestones.userId, userId))
    );
    return true;
  }

  // ==========================================================================
  // Workforce Trends
  // ==========================================================================

  async getWorkforceTrends(country?: string): Promise<WorkforceTrend[]> {
    if (country) {
      return await db.select().from(workforceTrends)
        .where(eq(workforceTrends.country, country))
        .orderBy(desc(workforceTrends.lastUpdated));
    }
    return await db.select().from(workforceTrends).orderBy(desc(workforceTrends.lastUpdated));
  }

  async getWorkforceTrend(id: string): Promise<WorkforceTrend | undefined> {
    const [trend] = await db.select().from(workforceTrends).where(eq(workforceTrends.id, id));
    return trend || undefined;
  }

  async createWorkforceTrend(trend: InsertWorkforceTrend): Promise<WorkforceTrend> {
    const [created] = await db.insert(workforceTrends).values(trend as any).returning();
    return created;
  }

  async updateWorkforceTrend(id: string, updates: Partial<WorkforceTrend>): Promise<WorkforceTrend | undefined> {
    const [updated] = await db.update(workforceTrends)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(workforceTrends.id, id))
      .returning();
    return updated || undefined;
  }

  // ==========================================================================
  // Alignment Matrix
  // ==========================================================================

  async getAlignmentMatrices(): Promise<AlignmentMatrix[]> {
    return await db.select().from(alignmentMatrix).orderBy(asc(alignmentMatrix.createdAt));
  }

  async getAlignmentMatrix(id: string): Promise<AlignmentMatrix | undefined> {
    const [matrix] = await db.select().from(alignmentMatrix).where(eq(alignmentMatrix.id, id));
    return matrix || undefined;
  }

  async getAlignmentMatrixByAuthority(authorityId: string): Promise<AlignmentMatrix | undefined> {
    const [matrix] = await db.select().from(alignmentMatrix).where(eq(alignmentMatrix.authorityId, authorityId));
    return matrix || undefined;
  }

  async createAlignmentMatrix(matrix: InsertAlignmentMatrix): Promise<AlignmentMatrix> {
    const [created] = await db.insert(alignmentMatrix).values(matrix as any).returning();
    return created;
  }

  async updateAlignmentMatrix(id: string, updates: Partial<AlignmentMatrix>): Promise<AlignmentMatrix | undefined> {
    const [updated] = await db.update(alignmentMatrix)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(alignmentMatrix.id, id))
      .returning();
    return updated || undefined;
  }

  // ==========================================================================
  // Professional Development System
  // ==========================================================================

  async getEducatorCareerGoals(userId: string): Promise<EducatorCareerGoal[]> {
    return await db.select().from(educatorCareerGoals)
      .where(eq(educatorCareerGoals.userId, userId))
      .orderBy(desc(educatorCareerGoals.priority), desc(educatorCareerGoals.createdAt));
  }

  async getEducatorCareerGoal(id: string): Promise<EducatorCareerGoal | undefined> {
    const [goal] = await db.select().from(educatorCareerGoals).where(eq(educatorCareerGoals.id, id));
    return goal || undefined;
  }

  async createEducatorCareerGoal(goal: InsertEducatorCareerGoal): Promise<EducatorCareerGoal> {
    const [created] = await db.insert(educatorCareerGoals).values(goal as any).returning();
    return created;
  }

  async updateEducatorCareerGoal(id: string, userId: string, updates: Partial<EducatorCareerGoal>): Promise<EducatorCareerGoal | undefined> {
    const [updated] = await db.update(educatorCareerGoals)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(educatorCareerGoals.id, id), eq(educatorCareerGoals.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteEducatorCareerGoal(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(educatorCareerGoals)
      .where(and(eq(educatorCareerGoals.id, id), eq(educatorCareerGoals.userId, userId)));
    return true;
  }

  async getEducatorSkills(userId: string): Promise<EducatorSkill[]> {
    return await db.select().from(educatorSkills)
      .where(eq(educatorSkills.userId, userId))
      .orderBy(asc(educatorSkills.category), asc(educatorSkills.skillName));
  }

  async getEducatorSkill(id: string): Promise<EducatorSkill | undefined> {
    const [skill] = await db.select().from(educatorSkills).where(eq(educatorSkills.id, id));
    return skill || undefined;
  }

  async createEducatorSkill(skill: InsertEducatorSkill): Promise<EducatorSkill> {
    const [created] = await db.insert(educatorSkills).values(skill as any).returning();
    return created;
  }

  async updateEducatorSkill(id: string, userId: string, updates: Partial<EducatorSkill>): Promise<EducatorSkill | undefined> {
    const [updated] = await db.update(educatorSkills)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(educatorSkills.id, id), eq(educatorSkills.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteEducatorSkill(id: string, userId: string): Promise<boolean> {
    await db.delete(educatorSkills)
      .where(and(eq(educatorSkills.id, id), eq(educatorSkills.userId, userId)));
    return true;
  }

  async getPDResources(filters?: { resourceType?: string; skillsAddressed?: string[]; isActive?: boolean }): Promise<PDResource[]> {
    let query = db.select().from(pdResources);
    if (filters?.isActive !== undefined) {
      query = query.where(eq(pdResources.isActive, filters.isActive)) as any;
    }
    if (filters?.resourceType) {
      query = query.where(eq(pdResources.resourceType, filters.resourceType)) as any;
    }
    return await query.orderBy(desc(pdResources.rating), desc(pdResources.completionCount));
  }

  async getPDResource(id: string): Promise<PDResource | undefined> {
    const [resource] = await db.select().from(pdResources).where(eq(pdResources.id, id));
    return resource || undefined;
  }

  async createPDResource(resource: InsertPDResource): Promise<PDResource> {
    const [created] = await db.insert(pdResources).values(resource as any).returning();
    return created;
  }

  async updatePDResource(id: string, updates: Partial<PDResource>): Promise<PDResource | undefined> {
    const [updated] = await db.update(pdResources)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pdResources.id, id))
      .returning();
    return updated || undefined;
  }

  async getPDRecommendations(userId: string, status?: string): Promise<PDRecommendation[]> {
    if (status) {
      return await db.select().from(pdRecommendations)
        .where(and(eq(pdRecommendations.userId, userId), eq(pdRecommendations.status, status)))
        .orderBy(desc(pdRecommendations.priority), desc(pdRecommendations.createdAt));
    }
    return await db.select().from(pdRecommendations)
      .where(eq(pdRecommendations.userId, userId))
      .orderBy(desc(pdRecommendations.priority), desc(pdRecommendations.createdAt));
  }

  async getPDRecommendation(id: string): Promise<PDRecommendation | undefined> {
    const [rec] = await db.select().from(pdRecommendations).where(eq(pdRecommendations.id, id));
    return rec || undefined;
  }

  async createPDRecommendation(rec: InsertPDRecommendation): Promise<PDRecommendation> {
    const [created] = await db.insert(pdRecommendations).values(rec as any).returning();
    return created;
  }

  async updatePDRecommendationStatus(id: string, userId: string, status: string): Promise<PDRecommendation | undefined> {
    const [updated] = await db.update(pdRecommendations)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(pdRecommendations.id, id), eq(pdRecommendations.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async clearUserPDRecommendations(userId: string): Promise<void> {
    await db.delete(pdRecommendations).where(eq(pdRecommendations.userId, userId));
  }

  async getEducatorPDProgress(userId: string): Promise<EducatorPDProgress[]> {
    return await db.select().from(educatorPDProgress)
      .where(eq(educatorPDProgress.userId, userId))
      .orderBy(desc(educatorPDProgress.updatedAt));
  }

  async getEducatorPDProgressItem(id: string): Promise<EducatorPDProgress | undefined> {
    const [progress] = await db.select().from(educatorPDProgress).where(eq(educatorPDProgress.id, id));
    return progress || undefined;
  }

  async createEducatorPDProgress(progress: InsertEducatorPDProgress): Promise<EducatorPDProgress> {
    const [created] = await db.insert(educatorPDProgress).values(progress as any).returning();
    return created;
  }

  async updateEducatorPDProgress(id: string, userId: string, updates: Partial<EducatorPDProgress>): Promise<EducatorPDProgress | undefined> {
    const [updated] = await db.update(educatorPDProgress)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(educatorPDProgress.id, id), eq(educatorPDProgress.userId, userId)))
      .returning();
    return updated || undefined;
  }

  // ================================
  // Student Journey Progress (Be-Know-Do Tracking)
  // ================================

  async getStudentJourneyProgress(studentId: string): Promise<StudentJourneyProgress | undefined> {
    const [progress] = await db.select().from(studentJourneyProgress)
      .where(eq(studentJourneyProgress.studentId, studentId));
    return progress || undefined;
  }

  async getStudentJourneyProgressByUserId(userId: string): Promise<StudentJourneyProgress | undefined> {
    const [progress] = await db.select().from(studentJourneyProgress)
      .where(eq(studentJourneyProgress.studentId, userId));
    return progress || undefined;
  }

  async getStudentJourneyProgressByEducator(educatorUserId: string): Promise<StudentJourneyProgress[]> {
    return await db.select().from(studentJourneyProgress)
      .where(eq(studentJourneyProgress.educatorUserId, educatorUserId))
      .orderBy(desc(studentJourneyProgress.lastActivityDate));
  }

  async createStudentJourneyProgress(progress: InsertStudentJourneyProgress): Promise<StudentJourneyProgress> {
    const [created] = await db.insert(studentJourneyProgress).values(progress as any).returning();
    return created;
  }

  async updateStudentJourneyProgress(id: string, updates: Partial<StudentJourneyProgress>): Promise<StudentJourneyProgress | undefined> {
    const [updated] = await db.update(studentJourneyProgress)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(studentJourneyProgress.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteStudentJourneyProgress(id: string): Promise<boolean> {
    const result = await db.delete(studentJourneyProgress).where(eq(studentJourneyProgress.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Student Journey Milestones
  async getStudentJourneyMilestones(journeyProgressId: string): Promise<StudentJourneyMilestone[]> {
    return await db.select().from(studentJourneyMilestones)
      .where(eq(studentJourneyMilestones.journeyProgressId, journeyProgressId))
      .orderBy(desc(studentJourneyMilestones.createdAt));
  }

  async getStudentJourneyMilestone(id: string): Promise<StudentJourneyMilestone | undefined> {
    const [milestone] = await db.select().from(studentJourneyMilestones)
      .where(eq(studentJourneyMilestones.id, id));
    return milestone || undefined;
  }

  async createStudentJourneyMilestone(milestone: InsertStudentJourneyMilestone): Promise<StudentJourneyMilestone> {
    const [created] = await db.insert(studentJourneyMilestones).values(milestone as any).returning();
    return created;
  }

  async updateStudentJourneyMilestone(id: string, updates: Partial<StudentJourneyMilestone>): Promise<StudentJourneyMilestone | undefined> {
    const [updated] = await db.update(studentJourneyMilestones)
      .set(updates)
      .where(eq(studentJourneyMilestones.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteStudentJourneyMilestone(id: string): Promise<boolean> {
    const result = await db.delete(studentJourneyMilestones).where(eq(studentJourneyMilestones.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Student Journey Activities
  async getStudentJourneyActivities(journeyProgressId: string, limit: number = 50): Promise<StudentJourneyActivity[]> {
    return await db.select().from(studentJourneyActivities)
      .where(eq(studentJourneyActivities.journeyProgressId, journeyProgressId))
      .orderBy(desc(studentJourneyActivities.createdAt))
      .limit(limit);
  }

  async createStudentJourneyActivity(activity: InsertStudentJourneyActivity): Promise<StudentJourneyActivity> {
    const [created] = await db.insert(studentJourneyActivities).values(activity as any).returning();
    return created;
  }

  // Student Journey Entries (Timeline/Activity Log for individual students)
  async getStudentJourneyEntries(userId: string, limit: number = 50): Promise<StudentJourneyEntry[]> {
    return await db.select().from(studentJourneyEntries)
      .where(eq(studentJourneyEntries.userId, userId))
      .orderBy(desc(studentJourneyEntries.createdAt))
      .limit(limit);
  }

  async getStudentJourneyEntriesByPillar(userId: string, pillar: string): Promise<StudentJourneyEntry[]> {
    return await db.select().from(studentJourneyEntries)
      .where(and(
        eq(studentJourneyEntries.userId, userId),
        eq(studentJourneyEntries.bkdPillar, pillar)
      ))
      .orderBy(desc(studentJourneyEntries.createdAt));
  }

  async createStudentJourneyEntry(entry: InsertStudentJourneyEntry): Promise<StudentJourneyEntry> {
    const [created] = await db.insert(studentJourneyEntries).values(entry as any).returning();
    return created;
  }

  async deleteStudentJourneyEntry(id: string): Promise<boolean> {
    const result = await db.delete(studentJourneyEntries).where(eq(studentJourneyEntries.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ================================
  // Student Digital Portfolio
  // ================================

  async getStudentPortfolio(userId: string): Promise<StudentPortfolio | undefined> {
    const [portfolio] = await db.select().from(studentPortfolios)
      .where(eq(studentPortfolios.userId, userId));
    return portfolio || undefined;
  }

  async getStudentPortfolioBySlug(slug: string): Promise<StudentPortfolio | undefined> {
    const [portfolio] = await db.select().from(studentPortfolios)
      .where(eq(studentPortfolios.shareableSlug, slug));
    return portfolio || undefined;
  }

  async createStudentPortfolio(portfolio: InsertStudentPortfolio): Promise<StudentPortfolio> {
    const slug = portfolio.shareableSlug || `portfolio-${randomUUID().slice(0, 8)}`;
    const [created] = await db.insert(studentPortfolios).values({
      ...portfolio,
      shareableSlug: slug,
    } as any).returning();
    return created;
  }

  async updateStudentPortfolio(id: string, updates: Partial<StudentPortfolio>, userId: string): Promise<StudentPortfolio | undefined> {
    const [existing] = await db.select().from(studentPortfolios)
      .where(and(eq(studentPortfolios.id, id), eq(studentPortfolios.userId, userId)));
    if (!existing) return undefined;
    
    const [updated] = await db.update(studentPortfolios)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(studentPortfolios.id, id))
      .returning();
    return updated;
  }

  async deleteStudentPortfolio(id: string, userId: string): Promise<boolean> {
    const [existing] = await db.select().from(studentPortfolios)
      .where(and(eq(studentPortfolios.id, id), eq(studentPortfolios.userId, userId)));
    if (!existing) return false;
    
    await db.delete(portfolioItems).where(eq(portfolioItems.portfolioId, id));
    await db.delete(studentPortfolios).where(eq(studentPortfolios.id, id));
    return true;
  }

  async incrementPortfolioViews(id: string): Promise<void> {
    await db.update(studentPortfolios)
      .set({ viewCount: sql`COALESCE(${studentPortfolios.viewCount}, 0) + 1` })
      .where(eq(studentPortfolios.id, id));
  }

  // Portfolio Items
  async getPortfolioItems(portfolioId: string): Promise<PortfolioItem[]> {
    return await db.select().from(portfolioItems)
      .where(eq(portfolioItems.portfolioId, portfolioId))
      .orderBy(asc(portfolioItems.displayOrder), desc(portfolioItems.createdAt));
  }

  async getPortfolioItem(id: string): Promise<PortfolioItem | undefined> {
    const [item] = await db.select().from(portfolioItems)
      .where(eq(portfolioItems.id, id));
    return item || undefined;
  }

  async createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem> {
    const items = await this.getPortfolioItems(item.portfolioId);
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.displayOrder)) : -1;
    
    const [created] = await db.insert(portfolioItems).values({
      ...item,
      displayOrder: item.displayOrder ?? maxOrder + 1,
    } as any).returning();
    return created;
  }

  async updatePortfolioItem(id: string, updates: Partial<PortfolioItem>): Promise<PortfolioItem | undefined> {
    const [updated] = await db.update(portfolioItems)
      .set(updates)
      .where(eq(portfolioItems.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePortfolioItem(id: string): Promise<boolean> {
    const result = await db.delete(portfolioItems).where(eq(portfolioItems.id, id));
    return true;
  }

  async reorderPortfolioItems(portfolioId: string, itemIds: string[]): Promise<void> {
    for (let i = 0; i < itemIds.length; i++) {
      await db.update(portfolioItems)
        .set({ displayOrder: i })
        .where(and(eq(portfolioItems.id, itemIds[i]), eq(portfolioItems.portfolioId, portfolioId)));
    }
  }

  // Portfolio Comments
  async getPortfolioComments(portfolioId: string): Promise<PortfolioComment[]> {
    return await db.select().from(portfolioComments)
      .where(eq(portfolioComments.portfolioId, portfolioId))
      .orderBy(desc(portfolioComments.createdAt));
  }

  async getPortfolioItemComments(portfolioItemId: string): Promise<PortfolioComment[]> {
    return await db.select().from(portfolioComments)
      .where(eq(portfolioComments.portfolioItemId, portfolioItemId))
      .orderBy(desc(portfolioComments.createdAt));
  }

  async createPortfolioComment(comment: InsertPortfolioComment): Promise<PortfolioComment> {
    const [created] = await db.insert(portfolioComments).values(comment as any).returning();
    return created;
  }

  async updatePortfolioComment(id: string, authorId: string, updates: Partial<PortfolioComment>): Promise<PortfolioComment | undefined> {
    const [updated] = await db.update(portfolioComments)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(portfolioComments.id, id), eq(portfolioComments.authorId, authorId)))
      .returning();
    return updated || undefined;
  }

  async deletePortfolioComment(id: string, authorId: string): Promise<boolean> {
    await db.delete(portfolioComments).where(and(eq(portfolioComments.id, id), eq(portfolioComments.authorId, authorId)));
    return true;
  }

  // CAI (Country Affordability Index) Methods
  async getCAICountries(): Promise<CAICountry[]> {
    return caiCountries;
  }

  async getCAICountry(code: string): Promise<CAICountry | undefined> {
    return caiCountries.find(c => c.code.toUpperCase() === code.toUpperCase());
  }

  async getCAICountriesByRegion(region: string): Promise<CAICountry[]> {
    return caiCountries.filter(c => c.region.toLowerCase() === region.toLowerCase());
  }
}

export const storage = new DatabaseStorage();
