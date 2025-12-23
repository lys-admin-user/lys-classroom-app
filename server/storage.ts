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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Lessons (saved by authenticated users)
  getLessons(userId: string): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson | undefined>;
  getLessonByShareId(shareId: string): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  deleteLesson(id: string, userId: string): Promise<boolean>;
  toggleLessonShare(id: string, userId: string): Promise<{ shareId: string | null } | undefined>;
  
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
  
  // User tier and role management
  getUserTier(userId: string): Promise<string>;
  updateUserTier(userId: string, tier: string): Promise<User | undefined>;
  updateUserRole(userId: string, role: UserRole): Promise<User | undefined>;
  completeOnboarding(userId: string): Promise<User | undefined>;
  
  // User Preferences
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  createUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences | undefined>;
  
  // Static data (in-memory)
  getCareers(): Promise<Career[]>;
  getCareer(id: string): Promise<Career | undefined>;
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
  createAssignmentRecipient(recipient: InsertAssignmentRecipient): Promise<AssignmentRecipient>;
  updateAssignmentRecipient(id: string, updates: Partial<AssignmentRecipient>): Promise<AssignmentRecipient | undefined>;
}

// Seed data for careers and resources (static content)
const seedCareers: Career[] = [
  {
    id: "1",
    title: "Software Developer",
    category: "technology",
    description: "Design, develop, and maintain software applications. Work with cutting-edge technologies to solve complex problems.",
    salaryMin: 65000,
    salaryMax: 150000,
    salaryMedian: 110000,
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
  },
  {
    id: "2",
    title: "Registered Nurse",
    category: "healthcare",
    description: "Provide patient care, educate patients about health conditions, and support physicians in medical procedures.",
    salaryMin: 55000,
    salaryMax: 120000,
    salaryMedian: 77000,
    educationRequired: "Associate's or Bachelor's Degree",
    yearsExperience: "0-3 years",
    growthRate: "+12%",
    skills: ["Patient Care", "Communication", "Critical Thinking", "Empathy", "Attention to Detail"],
    relatedCareers: ["Nurse Practitioner", "Physician Assistant", "Healthcare Administrator"],
    pathways: [
      { type: "college", description: "Complete a BSN (Bachelor of Science in Nursing) program.", duration: "4 years", cost: "$30,000-$150,000" },
      { type: "trade", description: "Complete an ADN (Associate Degree in Nursing) at a community college.", duration: "2 years", cost: "$10,000-$30,000" },
      { type: "military", description: "Train as a military nurse and serve while gaining experience.", duration: "4+ years", cost: "Free + Benefits" },
    ],
  },
  {
    id: "3",
    title: "Marketing Manager",
    category: "business",
    description: "Develop marketing strategies, manage campaigns, and analyze market trends to drive business growth.",
    salaryMin: 60000,
    salaryMax: 140000,
    salaryMedian: 95000,
    educationRequired: "Bachelor's Degree",
    yearsExperience: "3-7 years",
    growthRate: "+10%",
    skills: ["Strategic Planning", "Data Analysis", "Creativity", "Leadership", "Communication"],
    relatedCareers: ["Brand Manager", "Digital Marketing Specialist", "Product Manager"],
    pathways: [
      { type: "college", description: "Earn a Bachelor's in Marketing, Business, or Communications.", duration: "4 years", cost: "$40,000-$200,000" },
      { type: "certification", description: "Gain experience through internships and earn digital marketing certifications.", duration: "1-2 years", cost: "$5,000-$15,000" },
    ],
  },
  {
    id: "4",
    title: "Electrician",
    category: "trades",
    description: "Install, maintain, and repair electrical systems in residential, commercial, and industrial settings.",
    salaryMin: 40000,
    salaryMax: 100000,
    salaryMedian: 60000,
    educationRequired: "High School + Apprenticeship",
    yearsExperience: "0-4 years",
    growthRate: "+9%",
    skills: ["Technical Skills", "Problem Solving", "Physical Stamina", "Safety Awareness", "Math"],
    relatedCareers: ["HVAC Technician", "Plumber", "Construction Manager"],
    pathways: [
      { type: "trade", description: "Complete a 4-5 year apprenticeship program combining classroom instruction with on-the-job training.", duration: "4-5 years", cost: "Paid training" },
      { type: "military", description: "Train as a military electrician and gain certifications.", duration: "4+ years", cost: "Free + Benefits" },
    ],
  },
  {
    id: "5",
    title: "Graphic Designer",
    category: "creative",
    description: "Create visual content for brands, including logos, marketing materials, websites, and more.",
    salaryMin: 40000,
    salaryMax: 90000,
    salaryMedian: 55000,
    educationRequired: "Bachelor's Degree or Portfolio",
    yearsExperience: "0-3 years",
    growthRate: "+3%",
    skills: ["Adobe Creative Suite", "Typography", "Color Theory", "Creativity", "Communication"],
    relatedCareers: ["UX Designer", "Art Director", "Brand Designer"],
    pathways: [
      { type: "college", description: "Earn a Bachelor's in Graphic Design or Visual Arts.", duration: "4 years", cost: "$40,000-$180,000" },
      { type: "certification", description: "Build a portfolio through online courses and freelance work.", duration: "1-2 years", cost: "$2,000-$10,000" },
    ],
  },
  {
    id: "6",
    title: "Paralegal",
    category: "legal",
    description: "Assist lawyers with legal research, document preparation, and case management.",
    salaryMin: 40000,
    salaryMax: 75000,
    salaryMedian: 56000,
    educationRequired: "Associate's or Bachelor's Degree",
    yearsExperience: "0-3 years",
    growthRate: "+12%",
    skills: ["Legal Research", "Writing", "Attention to Detail", "Organization", "Communication"],
    relatedCareers: ["Legal Secretary", "Court Reporter", "Lawyer"],
    pathways: [
      { type: "college", description: "Complete a paralegal certificate or associate's degree program.", duration: "1-2 years", cost: "$5,000-$30,000" },
      { type: "certification", description: "Earn a paralegal certification from an accredited program.", duration: "6 months - 1 year", cost: "$3,000-$10,000" },
    ],
  },
];

const seedResources: Resource[] = [
  {
    id: "1",
    title: "Gates Scholarship",
    description: "Full scholarship for outstanding minority high school seniors with significant financial need.",
    type: "scholarship",
    category: "financial",
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
    amount: 20000,
    deadline: "2025-10-31",
    eligibility: ["High school senior", "US Citizen", "GPA 3.0+"],
    tags: ["Leadership", "Community Service", "Achievement"],
  },
  {
    id: "4",
    title: "FAFSA Complete Guide",
    description: "Step-by-step walkthrough of the Free Application for Federal Student Aid process.",
    type: "guide",
    category: "financial",
    tags: ["Financial Aid", "College", "Government Aid"],
  },
  {
    id: "5",
    title: "Resume Writing 101",
    description: "Learn how to create a compelling resume that stands out to employers.",
    type: "guide",
    category: "career",
    tags: ["Job Search", "Career Development", "Professional Skills"],
  },
  {
    id: "6",
    title: "Interview Preparation Tips",
    description: "Master the art of interviewing with these proven strategies and practice questions.",
    type: "video",
    category: "career",
    tags: ["Interviews", "Job Search", "Communication"],
  },
  {
    id: "7",
    title: "Military Career Paths",
    description: "Explore different branches and career opportunities within the US Armed Forces.",
    type: "guide",
    category: "military",
    tags: ["Armed Forces", "Career Paths", "Benefits"],
  },
  {
    id: "8",
    title: "Budgeting Basics for Students",
    description: "Learn essential budgeting skills to manage your money effectively in college and beyond.",
    type: "video",
    category: "financial",
    tags: ["Money Management", "Budgeting", "Life Skills"],
  },
  {
    id: "9",
    title: "SAT/ACT Prep Resources",
    description: "Free and low-cost resources to help you prepare for standardized college entrance exams.",
    type: "tool",
    category: "college",
    tags: ["Test Prep", "SAT", "ACT", "College Admissions"],
  },
  {
    id: "10",
    title: "College Application Timeline",
    description: "A month-by-month guide to stay on track with your college application process.",
    type: "guide",
    category: "college",
    tags: ["Applications", "Planning", "Deadlines"],
  },
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

  // User tier management
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
}

export const storage = new DatabaseStorage();
