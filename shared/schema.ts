import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp, real, index, uniqueIndex, customType } from "drizzle-orm/pg-core";

// Postgres BYTEA custom type for storing original uploaded files so the
// moderation viewer can render them side-by-side with the AI extraction.
const bytea = customType<{ data: Buffer; default: false }>({
  dataType() {
    return "bytea";
  },
});
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { isCoverageOptionalCountry } from "./standards";

// Re-export auth schema (users and sessions tables)
export * from "./models/auth";

// Saved Lessons Table (for educators to save generated lessons)
export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  gradeLevel: text("grade_level").notNull(),
  bkdFocus: text("bkd_focus").notNull(),
  standards: text("standards"),
  duration: text("duration").notNull(),
  objectives: jsonb("objectives").notNull().$type<string[]>(),
  activities: jsonb("activities").notNull().$type<{ title: string; description: string; duration: string; type: string }[]>(),
  materials: jsonb("materials").notNull().$type<string[]>(),
  assessment: text("assessment").notNull(),
  reflection: text("reflection"),
  shareId: varchar("share_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true, createdAt: true });
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;

// Lesson Plan Templates (for one-click lesson creation)
export const lessonTemplates = pgTable("lesson_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  gradeLevel: text("grade_level").notNull(),
  subject: text("subject"),
  bkdFocus: text("bkd_focus").notNull(),
  duration: text("duration").notNull(),
  objectives: jsonb("objectives").notNull().$type<string[]>(),
  activities: jsonb("activities").notNull().$type<{ title: string; description: string; duration: string; type: string }[]>(),
  materials: jsonb("materials").notNull().$type<string[]>(),
  assessmentTemplate: text("assessment_template").notNull(),
  lysMethodology: jsonb("lys_methodology").$type<{ be: { focus: string; description: string }; know: { focus: string; description: string }; do: { focus: string; description: string } }>(),
  tags: jsonb("tags").$type<string[]>(),
  visibility: text("visibility").notNull().default("private"),
  useCount: integer("use_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLessonTemplateSchema = createInsertSchema(lessonTemplates).omit({ id: true, createdAt: true, updatedAt: true, useCount: true });
export type InsertLessonTemplate = z.infer<typeof insertLessonTemplateSchema>;
export type LessonTemplate = typeof lessonTemplates.$inferSelect;

// Lesson Generation Tracking (for free tier limits)
export const lessonGenerations = pgTable("lesson_generations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  topic: text("topic"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLessonGenerationSchema = createInsertSchema(lessonGenerations).omit({ id: true, createdAt: true });
export type InsertLessonGeneration = z.infer<typeof insertLessonGenerationSchema>;
export type LessonGeneration = typeof lessonGenerations.$inferSelect;

// Guest Lesson Generation Tracking (for unauthenticated users).
// Keyed primarily by `guestId` (UUID cookie); `ipAddress` retained as secondary
// signal for fraud review. `formContext` + `lastLessonContent` carry guest
// state across the signup handoff; `claimedByUserId` marks rows already
// adopted by a registered account.
export const guestLessonGenerations = pgTable("guest_lesson_generations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guestId: varchar("guest_id"),
  ipAddress: varchar("ip_address").notNull(),
  topic: text("topic"),
  formContext: jsonb("form_context"),
  lastLessonContent: jsonb("last_lesson_content"),
  claimedByUserId: varchar("claimed_by_user_id"),
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGuestLessonGenerationSchema = createInsertSchema(guestLessonGenerations).omit({ id: true, createdAt: true });
export type InsertGuestLessonGeneration = z.infer<typeof insertGuestLessonGenerationSchema>;
export type GuestLessonGeneration = typeof guestLessonGenerations.$inferSelect;

// Guest lead capture (email gate). An email is captured once before a guest
// may generate free lessons; it doubles as a marketing contact list. Browser
// (guestId) is the primary signal, with ipAddress as a secondary guard.
export const guestLeads = pgTable("guest_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  guestId: varchar("guest_id"),
  ipAddress: varchar("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGuestLeadSchema = createInsertSchema(guestLeads).omit({ id: true, createdAt: true });
export type InsertGuestLead = z.infer<typeof insertGuestLeadSchema>;
export type GuestLead = typeof guestLeads.$inferSelect;

// Goals Table (for action plans)
export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  bkdPillar: text("bkd_pillar").default("do"),
  linkedCareerId: varchar("linked_career_id"),
  targetDate: text("target_date").notNull(),
  status: text("status").notNull().default("not_started"),
  progress: integer("progress").notNull().default(0),
  milestones: jsonb("milestones").notNull().$type<{ id: string; title: string; completed: boolean; dueDate?: string; reflection?: string }[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, createdAt: true });
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;

// LYS Methodology Schema
export const lysMethodologySchema = z.object({
  be: z.object({
    focus: z.string(),
    description: z.string(),
  }),
  know: z.object({
    focus: z.string(),
    description: z.string(),
  }),
  do: z.object({
    focus: z.string(),
    description: z.string(),
  }),
});

// Instructional Phase Schema
export const instructionalPhaseSchema = z.object({
  anticipatorySet: z.string(),
  modeling: z.string(),
  guidedPractice: z.string(),
  independentPractice: z.string(),
});

// Lesson Close Schema - Life Application Connections
export const lessonCloseSchema = z.object({
  educational: z.string().optional(),
  social: z.string().optional(),
  vocational: z.string().optional(),
  financial: z.string().optional(),
  spiritual: z.string().optional(),
  cultural: z.string().optional(),
  health: z.string().optional(),
});

// Lesson Plan Schema (for API response - not stored in DB)
export const lessonPlanSchema = z.object({
  id: z.string(),
  title: z.string(),
  topic: z.string(),
  course: z.string().optional(),
  unit: z.string().optional(),
  gradeLevel: z.string(),
  bkdFocus: z.enum(["be", "know", "do"]),
  standards: z.object({
    country: z.string(),
    state: z.string(),
    standardsName: z.string(),
    subject: z.string(),
    codes: z.array(z.object({
      code: z.string(),
      description: z.string(),
    })),
  }).optional(),
  duration: z.string(),
  lessonPart: z.string().optional(),
  objectives: z.array(z.string()),
  essentialQuestions: z.array(z.string()),
  lysMethodology: lysMethodologySchema,
  resources: z.array(z.object({
    title: z.string(),
    url: z.string().optional(),
    type: z.string(),
  })),
  asynchronousInstruction: instructionalPhaseSchema.optional(),
  synchronousInstruction: instructionalPhaseSchema,
  activities: z.array(z.object({
    title: z.string(),
    description: z.string(),
    duration: z.string(),
    type: z.enum(["be", "know", "do"]),
  })),
  materials: z.array(z.string()),
  assessment: z.string(),
  lessonClose: lessonCloseSchema,
  reflection: z.string().optional(),
});

export type LessonPlan = z.infer<typeof lessonPlanSchema>;
export type LYSMethodology = z.infer<typeof lysMethodologySchema>;
export type InstructionalPhase = z.infer<typeof instructionalPhaseSchema>;
export type LessonClose = z.infer<typeof lessonCloseSchema>;

// Assessment Schema (BE - Identity & Purpose)
export const assessmentSchema = z.object({
  id: z.string(),
  type: z.enum(["personality", "values", "strengths"]),
  title: z.string(),
  description: z.string(),
  questions: z.array(z.object({
    id: z.string(),
    text: z.string(),
    options: z.array(z.object({
      value: z.string(),
      label: z.string(),
      trait: z.string().optional(),
    })),
  })),
});

export type Assessment = z.infer<typeof assessmentSchema>;

export const assessmentResultSchema = z.object({
  id: z.string(),
  assessmentId: z.string(),
  answers: z.record(z.string(), z.string()),
  results: z.object({
    primaryTrait: z.string(),
    secondaryTraits: z.array(z.string()),
    summary: z.string(),
    strengths: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),
});

export type AssessmentResult = z.infer<typeof assessmentResultSchema>;

// Grade Level Types for Career Recommendations
export const gradeLevelBand = z.enum(["elementary", "middle_school", "high_school", "post_secondary"]);
export type GradeLevelBand = z.infer<typeof gradeLevelBand>;

// Job Outlook Categories based on BLS projections
export const jobOutlook = z.enum(["declining", "little_change", "average", "faster_than_average", "much_faster"]);
export type JobOutlook = z.infer<typeof jobOutlook>;

// Be-Know-Do Career Alignment Schema
// Weights indicate how strongly a career aligns with each pillar (0-100)
// - BE: Identity, purpose, values alignment (careers requiring strong self-awareness, ethics, identity)
// - KNOW: Knowledge acquisition, research, learning (careers requiring extensive study, expertise)
// - DO: Action, execution, practical skills (careers requiring hands-on work, project completion)
export const bkdCareerAlignmentSchema = z.object({
  be: z.number().min(0).max(100), // Identity/purpose alignment weight
  know: z.number().min(0).max(100), // Knowledge/learning alignment weight
  do: z.number().min(0).max(100), // Action/execution alignment weight
  primaryPillar: z.enum(["be", "know", "do"]), // Which pillar is most dominant
  careerPersonality: z.string().optional(), // Brief description of ideal personality fit
});

// BLS Occupational Outlook Handbook (OOH) Occupation Groups
export const blsOohGroups = [
  "architecture-and-engineering",
  "arts-and-design",
  "building-and-grounds-cleaning",
  "business-and-financial",
  "community-and-social-service",
  "computer-and-information-technology",
  "construction-and-extraction",
  "education-training-and-library",
  "entertainment-and-sports",
  "farming-fishing-and-forestry",
  "food-preparation-and-serving",
  "healthcare",
  "installation-maintenance-and-repair",
  "legal",
  "life-physical-and-social-science",
  "management",
  "math",
  "media-and-communication",
  "military",
  "office-and-administrative-support",
  "personal-care-and-service",
  "production",
  "protective-service",
  "sales",
  "transportation-and-material-moving",
] as const;
export type BlsOohGroup = typeof blsOohGroups[number];

// NAICS (North American Industry Classification System) 2-digit Sector Codes
export const naicsSectors = [
  "11", // Agriculture, Forestry, Fishing and Hunting
  "21", // Mining, Quarrying, and Oil and Gas Extraction
  "22", // Utilities
  "23", // Construction
  "31-33", // Manufacturing
  "42", // Wholesale Trade
  "44-45", // Retail Trade
  "48-49", // Transportation and Warehousing
  "51", // Information
  "52", // Finance and Insurance
  "53", // Real Estate and Rental and Leasing
  "54", // Professional, Scientific, and Technical Services
  "55", // Management of Companies and Enterprises
  "56", // Administrative and Support and Waste Management
  "61", // Educational Services
  "62", // Health Care and Social Assistance
  "71", // Arts, Entertainment, and Recreation
  "72", // Accommodation and Food Services
  "81", // Other Services (except Public Administration)
  "92", // Public Administration
] as const;
export type NaicsSector = typeof naicsSectors[number];

// Career Pathway Schema (KNOW - Strategy & Resources)
export const careerSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  description: z.string(),
  salaryMin: z.number(),
  salaryMax: z.number(),
  salaryMedian: z.number(),
  educationRequired: z.string(),
  yearsExperience: z.string(),
  growthRate: z.string(),
  skills: z.array(z.string()),
  relatedCareers: z.array(z.string()),
  pathways: z.array(z.object({
    type: z.enum(["college", "military", "trade", "certification"]),
    description: z.string(),
    duration: z.string(),
    cost: z.string(),
  })),
  // Be-Know-Do Alignment for personalized recommendations
  bkdAlignment: bkdCareerAlignmentSchema.optional(),
  // BLS and Market Data
  blsCode: z.string().optional(), // BLS Standard Occupational Classification (SOC) code
  blsOohGroup: z.string().optional(), // BLS Occupational Outlook Handbook occupation group
  naicsCode: z.string().optional(), // NAICS 2-6 digit industry classification code
  jobOutlook: jobOutlook.optional(), // BLS job outlook category
  projectedGrowth: z.number().optional(), // Projected employment change percentage (2023-2033)
  projectedOpenings: z.number().optional(), // Annual job openings
  demandLevel: z.enum(["low", "moderate", "high", "very_high"]).optional(),
  // Grade-appropriate recommendations
  appropriateGrades: z.array(gradeLevelBand).optional(), // Which grade bands this career is appropriate for
  entryPointsForGrades: z.record(z.string(), z.string()).optional(), // Grade-specific intro activities
  // State-specific data
  stateSalaryData: z.record(z.string(), z.object({
    min: z.number(),
    max: z.number(),
    median: z.number(),
    employment: z.number().optional(),
    demandLevel: z.enum(["low", "moderate", "high", "very_high"]).optional(),
  })).optional(),
  // Additional BLS data
  workEnvironment: z.string().optional(),
  typicalEntryEducation: z.string().optional(),
  onTheJobTraining: z.string().optional(),
  blsLastUpdated: z.string().optional(),
});

export type Career = z.infer<typeof careerSchema>;

// Career Fields for mapping classes to career categories
export const CAREER_FIELDS = [
  { id: "stem", name: "STEM & Technology", subjects: ["math", "science", "computer science", "engineering", "physics", "chemistry", "biology"] },
  { id: "healthcare", name: "Healthcare & Medicine", subjects: ["biology", "chemistry", "health", "anatomy", "nursing"] },
  { id: "business", name: "Business & Finance", subjects: ["business", "economics", "accounting", "finance", "entrepreneurship"] },
  { id: "arts", name: "Arts & Creative", subjects: ["art", "music", "theater", "drama", "creative writing", "design"] },
  { id: "humanities", name: "Humanities & Social Sciences", subjects: ["history", "social studies", "psychology", "sociology", "philosophy"] },
  { id: "education", name: "Education & Training", subjects: ["education", "child development", "teaching"] },
  { id: "law", name: "Law & Government", subjects: ["government", "civics", "criminal justice", "law", "political science"] },
  { id: "trades", name: "Skilled Trades", subjects: ["woodworking", "auto shop", "welding", "construction", "hvac", "electrical", "plumbing", "diesel", "automotive"] },
  { id: "public_safety", name: "Public Safety", subjects: ["fire science", "emergency management", "emt", "paramedic", "criminal justice", "public safety"] },
  { id: "personal_services", name: "Personal Services", subjects: ["cosmetology", "barbering", "beauty", "real estate", "hospitality"] },
  { id: "science", name: "Science & Environment", subjects: ["environmental science", "ecology", "sustainability", "biotech", "genetics", "laboratory science", "chemistry", "biology"] },
  { id: "communications", name: "Communications & Media", subjects: ["english", "journalism", "communications", "media", "writing"] },
  { id: "agriculture", name: "Agriculture & Environment", subjects: ["agriculture", "forestry"] },
] as const;

export type CareerFieldId = typeof CAREER_FIELDS[number]["id"];

// Helper to suggest career fields based on class subject
export function suggestCareerFields(subject: string): CareerFieldId[] {
  const lowerSubject = subject.toLowerCase();
  return CAREER_FIELDS
    .filter(field => field.subjects.some(s => lowerSubject.includes(s) || s.includes(lowerSubject)))
    .map(field => field.id);
}

// Resource Schema
export const resourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(["scholarship", "guide", "video", "tool", "article"]),
  category: z.enum(["financial", "college", "career", "military", "life_skills"]),
  url: z.string().optional(),
  imageUrl: z.string().optional(),
  amount: z.number().optional(),
  deadline: z.string().optional(),
  eligibility: z.array(z.string()).optional(),
  tags: z.array(z.string()),
});

export type Resource = z.infer<typeof resourceSchema>;

// API Request/Response Types
export const generateLessonRequestSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  course: z.string().optional(),
  unit: z.string().optional(),
  gradeLevel: z.string().min(1, "Grade level is required"),
  bkdFocus: z.enum(["be", "know", "do"]),
  standards: z.object({
    country: z.string().min(1, "Country is required"),
    state: z.string().min(1, "State is required"),
    standardsName: z.string().min(1, "Standards name is required"),
    subject: z.string().min(1, "Subject is required"),
    codes: z.array(z.object({
      code: z.string().min(1, "Standard code is required"),
      description: z.string(),
    })).default([]),
  }),
  duration: z.string().optional().default("45 minutes"),
  lessonPart: z.string().optional(),
  skipValidation: z.boolean().optional(), // Skip quality validation loop for faster generation
  // African / WAEC support — optional bilingual local-language code or name
  // (e.g., "yo", "Yoruba"). Ignored for non-African countries.
  language: z.string().optional(),
  // Org-uploaded curriculum context (YAG / scope-and-sequence excerpts) that
  // the lesson should align to. Populated by the client from the Curriculum
  // Library when the user has not opted out.
  alignmentContext: z
    .object({
      sourceTitle: z.string(),
      sourceDocId: z.string(),
      excerpt: z.string().max(20000),
    })
    .array()
    .optional(),
}).superRefine((data, ctx) => {
  // Preserve the original "at least one standard code is required" contract for
  // countries whose system DOES expose per-outcome codes (US/CCSS/etc).
  // African + international developing-nation curricula are exempted because
  // most national curricula don't expose a public per-outcome code system —
  // the AI infers outcomes from the country/grade context instead.
  if (!isCoverageOptionalCountry(data.standards.country) && data.standards.codes.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["standards", "codes"],
      message: "At least one standard code is required",
    });
  }
});

export type GenerateLessonRequest = z.infer<typeof generateLessonRequestSchema>;

// Student Practice Generation — a lightweight, student-facing flow that turns a
// subject/grade/topic into a set of practice questions with progressive,
// step-by-step hints (not just the final answer). Open to anonymous visitors via
// the same guest email-gate + monthly free quota used by lesson generation.
export const generatePracticeRequestSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  gradeLevel: z.string().min(1, "Grade level is required"),
  topic: z.string().min(1, "Topic is required"),
  questionCount: z.coerce.number().int().min(1).max(10).default(5),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

export type GeneratePracticeRequest = z.infer<typeof generatePracticeRequestSchema>;

export interface PracticeQuestion {
  id: string;
  type: "multiple_choice" | "short_answer";
  question: string;
  options?: string[];
  hints: string[];
  answer: string;
  explanation: string;
}

export interface GeneratedPracticeSet {
  id: string;
  title: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  difficulty: "easy" | "medium" | "hard";
  questions: PracticeQuestion[];
}

// School / district "Request a demo" lead capture, submitted from the public
// "See it for your school" page (`/for-schools`). Doubles as a sales lead list.
export const demoRequests = pgTable("demo_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: varchar("email").notNull(),
  organization: text("organization").notNull(),
  role: text("role"),
  teacherCount: text("teacher_count"),
  message: text("message"),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDemoRequestSchema = createInsertSchema(demoRequests).omit({
  id: true,
  status: true,
  createdAt: true,
});
export type InsertDemoRequest = z.infer<typeof insertDemoRequestSchema>;
export type DemoRequest = typeof demoRequests.$inferSelect;

// Homeschool Weekly Planner — a parent-facing flow that turns a child's grade +
// chosen subjects + interests into a ready-to-teach, day-by-day week plan.
// Open to anonymous visitors via the same guest email-gate + monthly free quota
// shared with lesson/practice generation.
export const generateHomeschoolPlanRequestSchema = z.object({
  gradeLevel: z.string().min(1, "Grade level is required"),
  subjects: z
    .array(z.string().min(1))
    .min(1, "Pick at least one subject")
    .max(10, "That's a lot of subjects — pick up to 10"),
  daysPerWeek: z.coerce.number().int().min(1).max(7).default(5),
  interests: z.string().max(300).optional(),
  notes: z.string().max(500).optional(),
});

export type GenerateHomeschoolPlanRequest = z.infer<typeof generateHomeschoolPlanRequestSchema>;

export interface HomeschoolActivity {
  subject: string;
  focus: string;
  activity: string;
  materials?: string[];
  estimatedMinutes?: number;
}

export interface HomeschoolDayPlan {
  id: string;
  day: string;
  theme?: string;
  activities: HomeschoolActivity[];
}

export interface GeneratedHomeschoolPlan {
  id: string;
  title: string;
  gradeLevel: string;
  weeklyTheme?: string;
  overview?: string;
  days: HomeschoolDayPlan[];
}

// Public API contract for the demo-request form (trims/validates user input).
export const demoRequestSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("A valid email is required"),
  organization: z.string().min(1, "School or district is required").max(200),
  role: z.string().max(200).optional(),
  teacherCount: z.string().max(100).optional(),
  message: z.string().max(2000).optional(),
});
export type DemoRequestInput = z.infer<typeof demoRequestSchema>;

export const lessonPlanCache = pgTable("lesson_plan_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cacheKey: varchar("cache_key").notNull().unique(),
  topic: varchar("topic").notNull(),
  course: varchar("course"),
  unit: varchar("unit"),
  gradeLevel: varchar("grade_level").notNull(),
  bkdFocus: varchar("bkd_focus").notNull(),
  duration: varchar("duration"),
  standardsCodes: text("standards_codes"),
  generatedPlan: jsonb("generated_plan").notNull(),
  hitCount: integer("hit_count").default(0),
  lastHitAt: timestamp("last_hit_at"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export type LessonPlanCache = typeof lessonPlanCache.$inferSelect;

// Question Bank System - Reusable questions for assignments
export const questionBanks = pgTable("question_banks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull(),
  subject: text("subject").notNull(),
  gradeLevel: text("grade_level").notNull(),
  topic: text("topic").notNull(),
  questionType: text("question_type").notNull(), // multiple_choice, short_answer, essay, etc.
  bkdFocus: text("bkd_focus"), // be, know, do
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  stimulus: text("stimulus"), // The prompt/context
  question: text("question").notNull(),
  options: jsonb("options").$type<string[]>(),
  correctAnswer: text("correct_answer"),
  rubric: jsonb("rubric").$type<{ criteria: string; points: number }[]>(),
  distractorFeedback: jsonb("distractor_feedback").$type<{ option: string; feedback: string }[]>(),
  standardMappings: jsonb("standard_mappings").$type<{ code: string; description: string }[]>(),
  bloomsLevel: text("blooms_level"), // remember, understand, apply, analyze, evaluate, create
  depthOfKnowledge: integer("depth_of_knowledge"), // 1-4
  usageCount: integer("usage_count").default(0),
  visibility: text("visibility").notNull().default("personal"), // personal, campus, district, system
  organizationId: varchar("organization_id"),
  status: text("status").notNull().default("active"), // active, archived
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQuestionBankSchema = createInsertSchema(questionBanks).omit({ id: true, createdAt: true, updatedAt: true, usageCount: true });
export type InsertQuestionBank = z.infer<typeof insertQuestionBankSchema>;
export type QuestionBank = typeof questionBanks.$inferSelect;

// Author Quality Metrics - Track lesson author performance over time
export const authorQualityMetrics = pgTable("author_quality_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  lessonsCreated: integer("lessons_created").default(0),
  lessonsApproved: integer("lessons_approved").default(0),
  averageQualityScore: integer("average_quality_score").default(0),
  distinguishedCount: integer("distinguished_count").default(0),
  accomplishedCount: integer("accomplished_count").default(0),
  acceptableCount: integer("acceptable_count").default(0),
  needsImprovementCount: integer("needs_improvement_count").default(0),
  totalObjectivesCovered: integer("total_objectives_covered").default(0),
  standardsCoverage: jsonb("standards_coverage").$type<{ standardCode: string; count: number }[]>(),
  bkdDistribution: jsonb("bkd_distribution").$type<{ be: number; know: number; do: number }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuthorQualityMetricsSchema = createInsertSchema(authorQualityMetrics).omit({ id: true, createdAt: true });
export type InsertAuthorQualityMetrics = z.infer<typeof insertAuthorQualityMetricsSchema>;
export type AuthorQualityMetrics = typeof authorQualityMetrics.$inferSelect;

// Assignment Alignment Tracking - Links assignments to lesson objectives
export const assignmentAlignments = pgTable("assignment_alignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull(),
  lessonId: varchar("lesson_id").notNull(),
  objectiveIndex: integer("objective_index").notNull(), // Which lesson objective
  questionCount: integer("question_count").default(0), // Questions aligned to this objective
  coveragePercentage: integer("coverage_percentage").default(0),
  bkdFocus: text("bkd_focus"), // be, know, do
  standardMappings: jsonb("standard_mappings").$type<{ code: string; alignmentStrength: number }[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAssignmentAlignmentSchema = createInsertSchema(assignmentAlignments).omit({ id: true, createdAt: true });
export type InsertAssignmentAlignment = z.infer<typeof insertAssignmentAlignmentSchema>;
export type AssignmentAlignment = typeof assignmentAlignments.$inferSelect;

// Scope Visibility Levels - defines inheritance hierarchy
export const SCOPE_VISIBILITY = {
  personal: "personal",     // Only visible to creator
  campus: "campus",         // Visible to all educators at campus
  district: "district",     // Visible to all campuses in district
  system: "system",         // System-wide (for authorized authors)
} as const;
export type ScopeVisibility = keyof typeof SCOPE_VISIBILITY;

// Scope and Sequence Tables
export const scopeSequences = pgTable("scope_sequences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  gradeLevel: text("grade_level").notNull(),
  country: text("country").notNull(),
  state: text("state").notNull(),
  standardsName: text("standards_name").notNull(),
  schoolYear: text("school_year").notNull(), // e.g., "2024-2025"
  totalWeeks: integer("total_weeks").default(36),
  status: text("status").notNull().default("draft"), // draft, published, archived
  isTemplate: boolean("is_template").default(false),
  visibility: text("visibility").notNull().default("personal"), // personal, campus, district, system
  organizationId: varchar("organization_id"), // The org this scope belongs to (campus or district)
  campusId: varchar("campus_id"), // DEPRECATED: Use organizationId instead. Kept for backward compatibility
  parentScopeId: varchar("parent_scope_id"), // if derived from admin/district scope
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertScopeSequenceSchema = createInsertSchema(scopeSequences).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertScopeSequence = z.infer<typeof insertScopeSequenceSchema>;
export type ScopeSequence = typeof scopeSequences.$inferSelect;

// Units within a Scope and Sequence
export const sequenceUnits = pgTable("sequence_units", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scopeId: varchar("scope_id").notNull(),
  unitNumber: integer("unit_number").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  transferGoal: text("transfer_goal"),
  startWeek: integer("start_week").notNull(),
  endWeek: integer("end_week").notNull(),
  nineWeeksPeriod: integer("nine_weeks_period").notNull(), // 1, 2, 3, or 4
  studentsWillKnow: jsonb("students_will_know").$type<string[]>().default([]),
  studentsWillBeSkilled: jsonb("students_will_be_skilled").$type<string[]>().default([]),
  standardCodes: jsonb("standard_codes").$type<{ code: string; description: string }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSequenceUnitSchema = createInsertSchema(sequenceUnits).omit({ id: true, createdAt: true });
export type InsertSequenceUnit = z.infer<typeof insertSequenceUnitSchema>;
export type SequenceUnit = typeof sequenceUnits.$inferSelect;

// Campus-level scope assignments (for admin to assign to all teachers)
export const campusScopes = pgTable("campus_scopes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campusId: varchar("campus_id").notNull(),
  scopeId: varchar("scope_id").notNull(),
  subject: text("subject").notNull(),
  gradeLevel: text("grade_level").notNull(),
  isActive: boolean("is_active").default(true),
  effectiveDate: timestamp("effective_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCampusScopeSchema = createInsertSchema(campusScopes).omit({ id: true, createdAt: true });
export type InsertCampusScope = z.infer<typeof insertCampusScopeSchema>;
export type CampusScope = typeof campusScopes.$inferSelect;

// Teacher change requests for admin-set scopes
export const scopeChangeRequests = pgTable("scope_change_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scopeId: varchar("scope_id").notNull(),
  userId: varchar("user_id").notNull(),
  unitId: varchar("unit_id"), // null if requesting scope-level changes
  changeType: text("change_type").notNull(), // "add_unit", "modify_unit", "remove_unit", "modify_scope"
  proposedChanges: jsonb("proposed_changes").notNull().$type<Record<string, unknown>>(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  adminNotes: text("admin_notes"),
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertScopeChangeRequestSchema = createInsertSchema(scopeChangeRequests).omit({ id: true, createdAt: true, reviewedAt: true });
export type InsertScopeChangeRequest = z.infer<typeof insertScopeChangeRequestSchema>;
export type ScopeChangeRequest = typeof scopeChangeRequests.$inferSelect;

// Curriculum peer sharing (owner -> specific user) + edit-access requests
export type CurriculumSharePermission = "view" | "edit";

export const curriculumShares = pgTable("curriculum_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scopeId: varchar("scope_id").notNull(),
  sharedWithUserId: varchar("shared_with_user_id").notNull(),
  permission: text("permission").notNull().default("view").$type<CurriculumSharePermission>(),
  sharedBy: varchar("shared_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCurriculumShareSchema = createInsertSchema(curriculumShares).omit({ id: true, createdAt: true });
export type InsertCurriculumShare = z.infer<typeof insertCurriculumShareSchema>;
export type CurriculumShare = typeof curriculumShares.$inferSelect;

export const curriculumAccessRequests = pgTable("curriculum_access_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scopeId: varchar("scope_id").notNull(),
  requesterId: varchar("requester_id").notNull(),
  requestedPermission: text("requested_permission").notNull().default("edit").$type<CurriculumSharePermission>(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"), // pending, approved, denied
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCurriculumAccessRequestSchema = createInsertSchema(curriculumAccessRequests).omit({
  id: true, createdAt: true, reviewedAt: true, reviewedBy: true, status: true,
});
export type InsertCurriculumAccessRequest = z.infer<typeof insertCurriculumAccessRequestSchema>;
export type CurriculumAccessRequest = typeof curriculumAccessRequests.$inferSelect;

// Scope with units (for API response)
export const scopeWithUnitsSchema = z.object({
  scope: z.object({
    id: z.string(),
    userId: z.string(),
    title: z.string(),
    subject: z.string(),
    gradeLevel: z.string(),
    country: z.string(),
    state: z.string(),
    standardsName: z.string(),
    schoolYear: z.string(),
    totalWeeks: z.number().nullable(),
    status: z.string(),
    isTemplate: z.boolean().nullable(),
    campusId: z.string().nullable(),
    parentScopeId: z.string().nullable(),
    createdAt: z.date().nullable(),
    updatedAt: z.date().nullable(),
  }),
  units: z.array(z.object({
    id: z.string(),
    scopeId: z.string(),
    unitNumber: z.number(),
    title: z.string(),
    summary: z.string().nullable(),
    transferGoal: z.string().nullable(),
    startWeek: z.number(),
    endWeek: z.number(),
    nineWeeksPeriod: z.number(),
    studentsWillKnow: z.array(z.string()).nullable(),
    studentsWillBeSkilled: z.array(z.string()).nullable(),
    standardCodes: z.array(z.object({
      code: z.string(),
      description: z.string(),
    })).nullable(),
    createdAt: z.date().nullable(),
  })),
});

export type ScopeWithUnits = z.infer<typeof scopeWithUnitsSchema>;

// Self-Discovery Assessment Results
export const selfDiscoveryResults = pgTable("self_discovery_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  beScore: integer("be_score").notNull(),
  knowScore: integer("know_score").notNull(),
  doScore: integer("do_score").notNull(),
  totalScore: integer("total_score").notNull(),
  strengths: jsonb("strengths").$type<string[]>().default([]),
  growthAreas: jsonb("growth_areas").$type<string[]>().default([]),
  answers: jsonb("answers").$type<Record<string, { value: string; score: number }>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSelfDiscoveryResultSchema = createInsertSchema(selfDiscoveryResults).omit({ id: true, createdAt: true });
export type InsertSelfDiscoveryResult = z.infer<typeof insertSelfDiscoveryResultSchema>;
export type SelfDiscoveryResult = typeof selfDiscoveryResults.$inferSelect;

// Student Journey - Tracks individual Be-Know-Do progress over time
// Note: "student" in the table name is legacy - this tracks both student AND educator journeys
// The userRole field differentiates between:
//   - student: Knowledge/career seeking (BE=identity, KNOW=career info, DO=skill building)
//   - educator: Career advancement/opportunity seeking (BE=teaching philosophy, KNOW=pedagogy, DO=professional growth)
export const studentJourneyEntries = pgTable("student_journey_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  userRole: text("user_role").default("student"), // 'student', 'educator', 'campus_admin' - determines BKD context
  entryType: text("entry_type").notNull(), // 'assessment', 'goal_completed', 'milestone', 'reflection', 'career_exploration', 'skill_gained', 'professional_development', 'teaching_achievement', 'opportunity_created'
  bkdPillar: text("bkd_pillar").notNull(), // 'be', 'know', 'do'
  title: text("title").notNull(),
  description: text("description"),
  pointsEarned: integer("points_earned").default(0),
  metadata: jsonb("metadata").$type<{
    assessmentId?: string;
    goalId?: string;
    careerId?: string;
    skillName?: string;
    reflectionPrompt?: string;
    linkedStandards?: string[];
    opportunityType?: string; // for educator opportunities
    certificationName?: string; // for educator certifications
    lessonPlanId?: string; // for educator lesson achievements
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentJourneyEntrySchema = createInsertSchema(studentJourneyEntries).omit({ id: true, createdAt: true });
export type InsertStudentJourneyEntry = z.infer<typeof insertStudentJourneyEntrySchema>;
export type StudentJourneyEntry = typeof studentJourneyEntries.$inferSelect;

// Saved Careers (for students to bookmark careers they're interested in)
export const savedCareers = pgTable("saved_careers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  careerId: varchar("career_id").notNull(),
  careerTitle: text("career_title").notNull(),
  careerCategory: text("career_category"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSavedCareerSchema = createInsertSchema(savedCareers).omit({ id: true, createdAt: true });
export type InsertSavedCareer = z.infer<typeof insertSavedCareerSchema>;
export type SavedCareer = typeof savedCareers.$inferSelect;

// Educator Affiliate Profiles
export const educatorAffiliates = pgTable("educator_affiliates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  referralCode: varchar("referral_code").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  totalPoints: integer("total_points").default(0),
  cashBalance: integer("cash_balance").default(0),
  totalViews: integer("total_views").default(0),
  totalShares: integer("total_shares").default(0),
  totalReferrals: integer("total_referrals").default(0),
  affiliateMode: text("affiliate_mode").default("student"),
  parentAffiliateId: varchar("parent_affiliate_id"),
  tier2EarningsTotal: integer("tier2_earnings_total").default(0),
  proUpgradedAt: timestamp("pro_upgraded_at"),
  externalRewardfulId: varchar("external_rewardful_id"),
  externalPartnerstackId: varchar("external_partnerstack_id"),
  stripeConnectAccountId: varchar("stripe_connect_account_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEducatorAffiliateSchema = createInsertSchema(educatorAffiliates).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEducatorAffiliate = z.infer<typeof insertEducatorAffiliateSchema>;
export type EducatorAffiliate = typeof educatorAffiliates.$inferSelect;

// Referral Events (tracks views, shares, signups from shared content)
export const referralEvents = pgTable("referral_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull(),
  lessonId: varchar("lesson_id"),
  shareId: varchar("share_id"),
  eventType: text("event_type").notNull(), // "view", "share", "copy_link", "signup", "lesson_save"
  channel: text("channel"), // "twitter", "facebook", "linkedin", "email", "direct"
  visitorId: text("visitor_id"), // anonymous tracking ID
  referredUserId: varchar("referred_user_id"), // if they signed up
  pointsEarned: integer("points_earned").default(0),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReferralEventSchema = createInsertSchema(referralEvents).omit({ id: true, createdAt: true });
export type InsertReferralEvent = z.infer<typeof insertReferralEventSchema>;
export type ReferralEvent = typeof referralEvents.$inferSelect;

// Affiliate Rewards (points ledger for redemption)
export const affiliateRewards = pgTable("affiliate_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull(),
  points: integer("points").notNull(),
  rewardType: text("reward_type").notNull(), // "earned", "redeemed", "bonus"
  description: text("description"),
  status: text("status").default("active"), // "active", "pending", "redeemed", "expired"
  eventId: varchar("event_id"), // links to referral event if applicable
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAffiliateRewardSchema = createInsertSchema(affiliateRewards).omit({ id: true, createdAt: true });
export type InsertAffiliateReward = z.infer<typeof insertAffiliateRewardSchema>;
export type AffiliateReward = typeof affiliateRewards.$inferSelect;

// Wallet Transactions (points + cash ledger)
export const affiliateWalletTransactions = pgTable("affiliate_wallet_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull(),
  type: text("type").notNull(),
  pointsAmount: integer("points_amount").default(0),
  cashAmountCents: integer("cash_amount_cents").default(0),
  description: text("description"),
  status: text("status").default("completed"),
  externalTransactionId: varchar("external_transaction_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWalletTransactionSchema = createInsertSchema(affiliateWalletTransactions).omit({ id: true, createdAt: true });
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type WalletTransaction = typeof affiliateWalletTransactions.$inferSelect;

// Affiliate Promo Assets (AI-generated branded content)
export const affiliatePromoAssets = pgTable("affiliate_promo_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull(),
  imageUrl: text("image_url"),
  caption: text("caption"),
  courseName: text("course_name"),
  referralLink: text("referral_link"),
  status: text("status").default("completed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPromoAssetSchema = createInsertSchema(affiliatePromoAssets).omit({ id: true, createdAt: true });
export type InsertPromoAsset = z.infer<typeof insertPromoAssetSchema>;
export type PromoAsset = typeof affiliatePromoAssets.$inferSelect;

// Affiliate Point Configuration
export const AFFILIATE_POINT_CONFIG = {
  referral_signup: 100,
  course_completion: 500,
  daily_login_streak: 5,
  verified_review: 50,
  view: 1,
  share: 5,
  copy_link: 2,
  lesson_save: 25,
  signup: 50,
  marketplace_sale: 200, // points earned when a marketplace item you authored sells
} as const;

export const AFFILIATE_CONVERSION_RATE = {
  pointsPerDollar: 100,
  minimumPayoutCents: 5000,
  minimumPointsToConvert: 5000,
  tier2CommissionPercent: 10,
  proUpgradeThreshold: 5,
} as const;

// Affiliate Dashboard Stats (computed type for API response)
export const affiliateDashboardSchema = z.object({
  affiliate: z.object({
    id: z.string(),
    userId: z.string(),
    referralCode: z.string(),
    displayName: z.string().nullable(),
    bio: z.string().nullable(),
    totalPoints: z.number().nullable(),
    cashBalance: z.number().nullable(),
    totalViews: z.number().nullable(),
    totalShares: z.number().nullable(),
    totalReferrals: z.number().nullable(),
    affiliateMode: z.string().nullable(),
    tier2EarningsTotal: z.number().nullable(),
    isActive: z.boolean().nullable(),
  }),
  recentEvents: z.array(z.object({
    id: z.string(),
    eventType: z.string(),
    channel: z.string().nullable(),
    pointsEarned: z.number().nullable(),
    createdAt: z.date().nullable(),
  })),
  rewards: z.array(z.object({
    id: z.string(),
    points: z.number(),
    rewardType: z.string(),
    description: z.string().nullable(),
    status: z.string().nullable(),
    createdAt: z.date().nullable(),
  })),
});

export type AffiliateDashboard = z.infer<typeof affiliateDashboardSchema>;

// ================================
// Educational Standards Ingestion System
// ================================

// Jurisdictions (Countries/States that have standards)
export const standardsJurisdictions = pgTable("standards_jurisdictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  externalId: varchar("external_id"), // CSP jurisdiction ID
  country: text("country").notNull(),
  name: text("name").notNull(), // e.g., "Texas", "California"
  abbreviation: text("abbreviation").notNull(), // e.g., "TX", "CA"
  standardsName: text("standards_name").notNull(), // e.g., "TEKS", "CCSS"
  source: text("source").notNull(), // "csp", "case", "manual", "pdf_import"
  sourceUrl: text("source_url"),
  // Coverage model for the lesson generator's runtime cascade:
  //   "codes_required"  — jurisdiction publishes per-outcome codes that teachers
  //                        must pick (US states with TEKS/CCSS, Common Core).
  //   "outcomes_only"   — jurisdiction has a national curriculum but does NOT
  //                        publish per-outcome codes (most African + developing
  //                        nation curricula). Teacher picks a theme or types
  //                        outcomes; AI uses country/grade/subject context.
  //   "unmapped"        — jurisdiction exists but we have no curriculum data
  //                        for it yet. Lessons are still generatable but get
  //                        tagged "no curriculum alignment verified" and the
  //                        request is logged to standards_fallback_misses for
  //                        the annual cleanup pass to prioritize.
  coverageMode: text("coverage_mode").notNull().default("codes_required"),
  lastSyncedAt: timestamp("last_synced_at"),
  // When a human moderator last confirmed this jurisdiction's source still
  // publishes the standards we ingested. Distinct from lastSyncedAt, which
  // only records when we last *ingested* data. Null = never verified, which
  // the source popover surfaces as "Not yet verified".
  lastVerifiedAt: timestamp("last_verified_at"),
  lastVerifiedBy: varchar("last_verified_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertJurisdictionSchema = createInsertSchema(standardsJurisdictions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStandardsJurisdiction = z.infer<typeof insertJurisdictionSchema>;
export type StandardsJurisdiction = typeof standardsJurisdictions.$inferSelect;

// Standard Sets (groups of standards, e.g., "Grade 6 Math")
export const standardSets = pgTable("standard_sets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  uid: varchar("uid").unique().notNull(), // Composite hash: country+state+year+grade+subject
  externalId: varchar("external_id"), // CSP standard_set ID
  jurisdictionId: varchar("jurisdiction_id").notNull(),
  title: text("title").notNull(), // e.g., "Grade 6 Mathematics"
  subject: text("subject").notNull(),
  educationLevels: jsonb("education_levels").$type<string[]>(), // grade levels
  documentTitle: text("document_title"), // source document title
  documentUrl: text("document_url"),
  documentYear: varchar("document_year"), // e.g., "2024"
  licenseTitle: text("license_title"),
  licenseUrl: text("license_url"),
  source: text("source").notNull(), // "csp", "case", "manual", "pdf_import"
  lastSyncedAt: timestamp("last_synced_at"),
  // Human-confirmed verification timestamp for this set's source — see the
  // matching note on standardsJurisdictions. Set-level verification wins over
  // jurisdiction-level when resolving "Last verified" in standardsCatalog.
  lastVerifiedAt: timestamp("last_verified_at"),
  lastVerifiedBy: varchar("last_verified_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStandardSetSchema = createInsertSchema(standardSets).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStandardSet = z.infer<typeof insertStandardSetSchema>;
export type StandardSet = typeof standardSets.$inferSelect;

// Individual Standards (the actual learning objectives)
export const educationalStandardsDb = pgTable("educational_standards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  uid: varchar("uid").unique().notNull(), // Composite hash for deduplication
  externalId: varchar("external_id"), // External system ID (CSP, CASE, ASN)
  asnIdentifier: varchar("asn_identifier"), // Achievement Standards Network ID
  standardSetId: varchar("standard_set_id").notNull(),
  humanCoding: varchar("human_coding").notNull(), // e.g., "CCSS.ELA-LITERACY.RI.1.1"
  statementLabel: text("statement_label"), // e.g., "Standard", "Cluster", "Domain"
  statement: text("statement").notNull(), // The actual learning objective text
  description: text("description"), // Extended description if available
  gradeLevel: text("grade_level"), // e.g., "6", "K", "9-12"
  depth: integer("depth").default(0), // Hierarchy depth in tree
  position: integer("position").default(0), // Order position
  parentId: varchar("parent_id"), // For hierarchical standards
  versionHistory: jsonb("version_history").$type<{
    version: string;
    changedAt: string;
    previousStatement?: string;
    changeType: "create" | "update" | "deprecate";
  }[]>(),
  isActive: boolean("is_active").default(true),
  source: text("source").notNull(), // "csp", "case", "manual", "pdf_import"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEducationalStandardSchema = createInsertSchema(educationalStandardsDb).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEducationalStandard = z.infer<typeof insertEducationalStandardSchema>;
export type EducationalStandard = typeof educationalStandardsDb.$inferSelect;

// Standards Sync Log (tracks sync operations)
export const standardsSyncLog = pgTable("standards_sync_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  source: text("source").notNull(), // "csp", "case", "pdf_import"
  jurisdictionId: varchar("jurisdiction_id"),
  standardSetId: varchar("standard_set_id"),
  status: text("status").notNull(), // "started", "in_progress", "completed", "failed"
  totalRecords: integer("total_records").default(0),
  processedRecords: integer("processed_records").default(0),
  newRecords: integer("new_records").default(0),
  updatedRecords: integer("updated_records").default(0),
  errorCount: integer("error_count").default(0),
  errorMessages: jsonb("error_messages").$type<string[]>(),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  triggeredBy: varchar("triggered_by"), // "cron", "manual", user ID
});

export const insertSyncLogSchema = createInsertSchema(standardsSyncLog).omit({ id: true, startedAt: true });
export type InsertSyncLog = z.infer<typeof insertSyncLogSchema>;
export type SyncLog = typeof standardsSyncLog.$inferSelect;

// PDF Import Queue (for Tier 3 sources)
export const pdfImportQueue = pgTable("pdf_import_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url"),
  country: text("country").notNull(),
  jurisdiction: text("jurisdiction").notNull(),
  subject: text("subject"),
  gradeLevel: text("grade_level"),
  status: text("status").notNull().default("pending"), // "pending", "processing", "completed", "failed"
  extractedData: jsonb("extracted_data").$type<{
    rawText?: string;
    standards?: Array<{
      code: string;
      statement: string;
      gradeLevel?: string;
    }>;
    confidence?: number;
  }>(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const insertPdfImportSchema = createInsertSchema(pdfImportQueue).omit({ id: true, createdAt: true });
export type InsertPdfImport = z.infer<typeof insertPdfImportSchema>;
export type PdfImport = typeof pdfImportQueue.$inferSelect;

// Standards Staging Table (for approval workflow)
export const standardsStaging = pgTable("standards_staging", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jurisdictionId: varchar("jurisdiction_id").notNull(),
  standardSetId: varchar("standard_set_id"),
  humanCoding: varchar("human_coding").notNull(),
  statement: text("statement").notNull(),
  description: text("description"),
  gradeLevel: text("grade_level"),
  depth: integer("depth").default(0),
  position: integer("position").default(0),
  parentCode: varchar("parent_code"),
  source: text("source").notNull(), // "csp", "case", "pdf_import", "llm_extract"
  rawSourceText: text("raw_source_text"), // Original text before processing
  extractionConfidence: integer("extraction_confidence"), // AI confidence 0-100
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected"
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStagingSchema = createInsertSchema(standardsStaging).omit({ id: true, createdAt: true });
export type InsertStandardsStaging = z.infer<typeof insertStagingSchema>;
export type StandardsStaging = typeof standardsStaging.$inferSelect;

// Source Checksums (for change detection watchdog)
export const sourceChecksums = pgTable("source_checksums", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceUrl: text("source_url").notNull().unique(),
  sourceName: text("source_name").notNull(),
  jurisdictionId: varchar("jurisdiction_id"),
  standardSetId: varchar("standard_set_id"),
  etag: varchar("etag"),
  md5Hash: varchar("md5_hash"),
  contentLength: integer("content_length"),
  lastModified: timestamp("last_modified"),
  lastCheckedAt: timestamp("last_checked_at").defaultNow(),
  hasChanged: boolean("has_changed").default(false),
  changeDetectedAt: timestamp("change_detected_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChecksumSchema = createInsertSchema(sourceChecksums).omit({ id: true, createdAt: true });
export type InsertSourceChecksum = z.infer<typeof insertChecksumSchema>;
export type SourceChecksum = typeof sourceChecksums.$inferSelect;

// BLS Data Sync Log (tracks BLS Occupational Outlook updates)
export const blsSyncLog = pgTable("bls_sync_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  syncType: text("sync_type").notNull(), // "full", "incremental", "wage_update"
  status: text("status").notNull(), // "started", "in_progress", "completed", "failed"
  totalOccupations: integer("total_occupations").default(0),
  processedOccupations: integer("processed_occupations").default(0),
  updatedOccupations: integer("updated_occupations").default(0),
  newOccupations: integer("new_occupations").default(0),
  errorCount: integer("error_count").default(0),
  errorMessages: jsonb("error_messages").$type<string[]>(),
  dataSource: text("data_source"), // "bls_api", "oews", "employment_projections"
  apiVersion: text("api_version"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  nextScheduledAt: timestamp("next_scheduled_at"),
  triggeredBy: text("triggered_by"), // "scheduled", "manual", user ID
});

export const insertBlsSyncLogSchema = createInsertSchema(blsSyncLog).omit({ id: true, startedAt: true });
export type InsertBlsSyncLog = z.infer<typeof insertBlsSyncLogSchema>;
export type BlsSyncLog = typeof blsSyncLog.$inferSelect;

// ================================
// Assignment System (Paid Feature)
// ================================

// Accommodation Types
export const accommodationTypes = [
  "extraTime",
  "notesCopyProvided",
  "studySheetProvided",
  "graphicOrganizer",
  "mnemonicDevices",
  "largerFont",
  "shortenedText",
  "peerSupport",
  "preferentialSeating",
  "frequentReminders",
  "completedExample",
  "visualOrganizer"
] as const;
export type AccommodationType = typeof accommodationTypes[number];

// Accommodation labels for display
export const accommodationLabels: Record<AccommodationType, string> = {
  extraTime: "Extra Time",
  notesCopyProvided: "Notes/Presentation Copy Provided",
  studySheetProvided: "Study Sheet Provided",
  graphicOrganizer: "Graphic Organizer",
  mnemonicDevices: "Mnemonic Devices",
  largerFont: "Larger Size Font",
  shortenedText: "Shortened Text",
  peerSupport: "Peer Support",
  preferentialSeating: "Preferential Seating",
  frequentReminders: "Frequent On Task Reminders",
  completedExample: "Provided A Completed Example",
  visualOrganizer: "Visual Organizer Provided"
};

// Classes Table (educator's classes)
// Classes should belong to a school/campus organization for proper hierarchy
export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  organizationId: varchar("organization_id"), // Should be a school/campus type org - required for hierarchy
  name: text("name").notNull(),
  subject: text("subject"),
  gradeLevel: text("grade_level"),
  period: text("period"),
  room: text("room"), // Physical or virtual room location
  schoolYear: text("school_year"),
  term: text("term"), // semester, quarter, trimester, etc.
  maxStudents: integer("max_students").default(35).notNull(),
  isActive: boolean("is_active").default(true),
  // Career alignment - maps this class to career categories for student insights
  careerFields: jsonb("career_fields").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertClassSchema = createInsertSchema(classes).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classes.$inferSelect;

// Students Table
// Students should belong to a school/campus organization for proper hierarchy
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Links to users table for login
  organizationId: varchar("organization_id"), // School/campus where student is enrolled - required for hierarchy
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  studentId: text("student_id"), // School-assigned student ID
  email: text("email"),
  gradeLevel: text("grade_level"),
  birthDate: timestamp("birth_date"),
  enrollmentDate: timestamp("enrollment_date").defaultNow(),
  status: text("status").default("active"), // active, inactive, graduated, transferred
  accommodations: jsonb("accommodations").$type<{
    type: AccommodationType;
    description: string;
    active: boolean;
  }[]>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStudentSchema = createInsertSchema(students).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

// Class-Student Junction Table - Enrollment records
export const classStudents = pgTable("class_students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").notNull(),
  studentId: varchar("student_id").notNull(),
  enrolledBy: varchar("enrolled_by"), // User ID of who enrolled the student
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  droppedAt: timestamp("dropped_at"),
  status: text("status").default("enrolled"), // enrolled, dropped, completed
  finalGrade: text("final_grade"),
});

export const insertClassStudentSchema = createInsertSchema(classStudents).omit({ id: true, enrolledAt: true });
export type InsertClassStudent = z.infer<typeof insertClassStudentSchema>;
export type ClassStudent = typeof classStudents.$inferSelect;

// ================================
// Student Transfer Requests (Triple Confirmation Workflow)
// ================================

// Transfer request statuses
export const transferRequestStatuses = [
  "pending_campus",      // Waiting for source campus approval
  "pending_district",    // Waiting for district approval
  "pending_system_admin", // Waiting for system admin approval
  "approved",            // All approvals complete, transfer executed
  "rejected",            // Rejected at any level
  "cancelled"            // Cancelled by requester
] as const;
export type TransferRequestStatus = typeof transferRequestStatuses[number];

// Transfer types - between educators (same org) or between organizations
export const transferTypes = ["educator", "organization"] as const;
export type TransferType = typeof transferTypes[number];

// Student Transfer Requests Table
export const studentTransferRequests = pgTable("student_transfer_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Student being transferred
  studentId: varchar("student_id").notNull(),
  
  // Transfer type: within org (between educators) or between orgs
  transferType: text("transfer_type").notNull().$type<TransferType>(),
  
  // Source information
  sourceEducatorId: varchar("source_educator_id").notNull(), // Current educator's user ID
  sourceOrganizationId: varchar("source_organization_id"), // Current org (campus/school)
  sourceDistrictId: varchar("source_district_id"), // Current district
  
  // Target information
  targetEducatorId: varchar("target_educator_id"), // New educator (for educator transfers)
  targetOrganizationId: varchar("target_organization_id"), // New org (for org transfers)
  targetDistrictId: varchar("target_district_id"), // New district (if cross-district)
  
  // Request details
  requestedBy: varchar("requested_by").notNull(), // User ID who initiated request
  reason: text("reason"), // Reason for transfer
  notes: text("notes"),
  
  // Current status
  status: text("status").notNull().default("pending_campus").$type<TransferRequestStatus>(),
  
  // Campus level approval (first approval)
  campusApprovedBy: varchar("campus_approved_by"),
  campusApprovedAt: timestamp("campus_approved_at"),
  campusRejectionReason: text("campus_rejection_reason"),
  
  // District level approval (second approval)
  districtApprovedBy: varchar("district_approved_by"),
  districtApprovedAt: timestamp("district_approved_at"),
  districtRejectionReason: text("district_rejection_reason"),
  
  // System admin approval (third/final approval)
  systemAdminApprovedBy: varchar("system_admin_approved_by"),
  systemAdminApprovedAt: timestamp("system_admin_approved_at"),
  systemAdminRejectionReason: text("system_admin_rejection_reason"),
  
  // Transfer execution
  transferExecutedAt: timestamp("transfer_executed_at"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStudentTransferRequestSchema = createInsertSchema(studentTransferRequests).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  campusApprovedBy: true,
  campusApprovedAt: true,
  districtApprovedBy: true,
  districtApprovedAt: true,
  systemAdminApprovedBy: true,
  systemAdminApprovedAt: true,
  transferExecutedAt: true
});
export type InsertStudentTransferRequest = z.infer<typeof insertStudentTransferRequestSchema>;
export type StudentTransferRequest = typeof studentTransferRequests.$inferSelect;

// ================================
// Student Journey Progress (Be-Know-Do Tracking)
// ================================

// BKD Category types for journey tracking
export const bkdCategories = ["be", "know", "do"] as const;
export type BkdCategory = typeof bkdCategories[number];

// Journey milestone status
export const journeyMilestoneStatuses = ["not_started", "in_progress", "completed", "mastered"] as const;
export type JourneyMilestoneStatus = typeof journeyMilestoneStatuses[number];

// Student Journey Progress Table - tracks overall BKD journey
export const studentJourneyProgress = pgTable("student_journey_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  educatorUserId: varchar("educator_user_id").notNull(),
  organizationId: varchar("organization_id"),
  
  // Overall scores (0-100)
  beScore: integer("be_score").notNull().default(0),
  knowScore: integer("know_score").notNull().default(0),
  doScore: integer("do_score").notNull().default(0),
  overallScore: integer("overall_score").notNull().default(0),
  
  // Journey metadata
  journeyStartDate: timestamp("journey_start_date").defaultNow(),
  lastActivityDate: timestamp("last_activity_date").defaultNow(),
  totalAssessmentsCompleted: integer("total_assessments_completed").notNull().default(0),
  totalMilestonesAchieved: integer("total_milestones_achieved").notNull().default(0),
  
  // Current focus area
  currentFocus: text("current_focus").$type<BkdCategory>().default("be"),
  
  // Saved career interests from exploration
  savedCareerIds: jsonb("saved_career_ids").$type<string[]>().default([]),
  
  // Self-discovery assessment results
  latestAssessmentResults: jsonb("latest_assessment_results").$type<{
    completedAt: string;
    beAnswers: Record<string, number>;
    knowAnswers: Record<string, number>;
    doAnswers: Record<string, number>;
    strengths: string[];
    growthAreas: string[];
  }>(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStudentJourneyProgressSchema = createInsertSchema(studentJourneyProgress).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudentJourneyProgress = z.infer<typeof insertStudentJourneyProgressSchema>;
export type StudentJourneyProgress = typeof studentJourneyProgress.$inferSelect;

// Student Journey Milestones - individual achievements in the journey
export const studentJourneyMilestones = pgTable("student_journey_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  journeyProgressId: varchar("journey_progress_id").notNull(),
  
  // Milestone details
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().$type<BkdCategory>(),
  status: text("status").notNull().default("not_started").$type<JourneyMilestoneStatus>(),
  
  // Progress tracking
  targetValue: integer("target_value").default(100),
  currentValue: integer("current_value").notNull().default(0),
  
  // Points and rewards
  pointsEarned: integer("points_earned").notNull().default(0),
  badgeId: varchar("badge_id"),
  
  // Dates
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  // Evidence/notes
  evidence: jsonb("evidence").$type<{
    type: "assignment" | "assessment" | "reflection" | "project" | "observation";
    title: string;
    date: string;
    notes?: string;
  }[]>().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentJourneyMilestoneSchema = createInsertSchema(studentJourneyMilestones).omit({ id: true, createdAt: true });
export type InsertStudentJourneyMilestone = z.infer<typeof insertStudentJourneyMilestoneSchema>;
export type StudentJourneyMilestone = typeof studentJourneyMilestones.$inferSelect;

// Student Journey Activity Log - tracks all activities in the journey
export const studentJourneyActivities = pgTable("student_journey_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  journeyProgressId: varchar("journey_progress_id").notNull(),
  
  // Activity details
  activityType: text("activity_type").notNull().$type<"assessment" | "lesson" | "career_exploration" | "goal_progress" | "reflection" | "milestone_achieved">(),
  title: text("title").notNull(),
  description: text("description"),
  
  // BKD impact
  category: text("category").$type<BkdCategory>(),
  pointsEarned: integer("points_earned").notNull().default(0),
  
  // Related entities
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: varchar("related_entity_id"),
  
  // Metadata
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentJourneyActivitySchema = createInsertSchema(studentJourneyActivities).omit({ id: true, createdAt: true });
export type InsertStudentJourneyActivity = z.infer<typeof insertStudentJourneyActivitySchema>;
export type StudentJourneyActivity = typeof studentJourneyActivities.$inferSelect;

// Student Journey Progress History - tracks Be-Know-Do score snapshots over time
export const studentJourneyProgressHistory = pgTable("student_journey_progress_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  journeyProgressId: varchar("journey_progress_id").notNull(),
  
  // Snapshot scores at this point in time
  beScore: integer("be_score").notNull(),
  knowScore: integer("know_score").notNull(),
  doScore: integer("do_score").notNull(),
  overallScore: integer("overall_score").notNull(),
  
  // Context for the snapshot
  snapshotType: text("snapshot_type").notNull().$type<"assessment" | "milestone" | "weekly" | "monthly" | "manual">(),
  triggerEvent: text("trigger_event"), // What triggered this snapshot (e.g., "completed_assessment", "milestone_achieved")
  notes: text("notes"),
  
  // Cumulative stats at snapshot time
  totalMilestonesCompleted: integer("total_milestones_completed").default(0),
  totalActivitiesLogged: integer("total_activities_logged").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentJourneyProgressHistorySchema = createInsertSchema(studentJourneyProgressHistory).omit({ id: true, createdAt: true });
export type InsertStudentJourneyProgressHistory = z.infer<typeof insertStudentJourneyProgressHistorySchema>;
export type StudentJourneyProgressHistory = typeof studentJourneyProgressHistory.$inferSelect;

// ================================
// Student Matriculation & Achievement Tracking (System-Level)
// ================================

// Matriculation Event Types
export const MATRICULATION_EVENT_TYPES = [
  "enrollment", // Initial enrollment
  "grade_promotion", // Moved to next grade
  "grade_retention", // Held back a grade
  "transfer_in", // Transferred in from another school
  "transfer_out", // Transferred out to another school
  "withdrawal", // Withdrawn from school
  "graduation", // Completed program/graduated
  "re_enrollment", // Re-enrolled after withdrawal
  "status_change", // General status change
] as const;
export type MatriculationEventType = typeof MATRICULATION_EVENT_TYPES[number];

// Student Matriculation History - tracks grade progression and enrollment changes
export const studentMatriculationHistory = pgTable("student_matriculation_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(), // References students table
  organizationId: varchar("organization_id"), // School/campus where event occurred
  
  eventType: text("event_type").notNull().$type<MatriculationEventType>(),
  eventDate: timestamp("event_date").notNull().defaultNow(),
  
  // Grade level tracking
  previousGradeLevel: text("previous_grade_level"),
  newGradeLevel: text("new_grade_level"),
  
  // Academic year tracking
  academicYear: text("academic_year"), // e.g., "2025-2026"
  semester: text("semester"), // "fall", "spring", "summer"
  
  // For transfers
  previousOrganizationId: varchar("previous_organization_id"),
  newOrganizationId: varchar("new_organization_id"),
  
  // Status tracking
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  
  // Additional info
  reason: text("reason"), // Reason for the change
  notes: text("notes"),
  documentUrl: text("document_url"), // Supporting document
  
  // Approval tracking
  approvedBy: varchar("approved_by"), // Admin who approved
  approvedAt: timestamp("approved_at"),
  
  // Audit trail
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentMatriculationHistorySchema = createInsertSchema(studentMatriculationHistory).omit({ 
  id: true, createdAt: true 
});
export type InsertStudentMatriculationHistory = z.infer<typeof insertStudentMatriculationHistorySchema>;
export type StudentMatriculationHistory = typeof studentMatriculationHistory.$inferSelect;

// System Achievement Types
export const ACHIEVEMENT_CATEGORIES = [
  "academic", // GPA, honor roll, dean's list
  "skill", // Skill mastery, competency
  "behavior", // Attendance, citizenship
  "extracurricular", // Sports, clubs, activities
  "career", // Career readiness, certifications
  "bkd", // Be-Know-Do framework achievements
  "custom", // Custom achievements
] as const;
export type AchievementCategory = typeof ACHIEVEMENT_CATEGORIES[number];

// System Achievements - defines available achievements
export const systemAchievements = pgTable("system_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Basic info
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().$type<AchievementCategory>(),
  
  // Visual elements
  badgeImageUrl: text("badge_image_url"),
  iconName: text("icon_name"), // Lucide icon name
  color: text("color"), // Badge color
  
  // Criteria
  criteria: jsonb("criteria").$type<{
    type: "automatic" | "manual"; // Automatic based on rules, or manually awarded
    rules?: {
      metric: string; // e.g., "gpa", "attendance_rate", "be_score"
      operator: "gte" | "lte" | "eq" | "gt" | "lt";
      value: number;
    }[];
    requiresEvidence?: boolean;
  }>(),
  
  // Points/rewards
  pointValue: integer("point_value").default(0),
  
  // Scope
  isSystemWide: boolean("is_system_wide").default(true), // Available to all organizations
  organizationId: varchar("organization_id"), // If org-specific
  gradeLevels: jsonb("grade_levels").$type<string[]>(), // Which grade levels can earn this
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Audit
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSystemAchievementSchema = createInsertSchema(systemAchievements).omit({ 
  id: true, createdAt: true, updatedAt: true 
});
export type InsertSystemAchievement = z.infer<typeof insertSystemAchievementSchema>;
export type SystemAchievement = typeof systemAchievements.$inferSelect;

// Student Achievements - records of achievements earned by students
export const studentAchievements = pgTable("student_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(), // References students table
  achievementId: varchar("achievement_id").notNull(), // References system_achievements
  
  // When/where earned
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
  academicYear: text("academic_year"),
  organizationId: varchar("organization_id"), // Where it was earned
  
  // Evidence/verification
  evidence: jsonb("evidence").$type<{
    type: string; // "document", "grade_report", "certificate", etc.
    url?: string;
    description?: string;
  }[]>(),
  
  // Verification status
  status: text("status").default("pending").$type<"pending" | "verified" | "revoked">(),
  verifiedBy: varchar("verified_by"),
  verifiedAt: timestamp("verified_at"),
  revokedReason: text("revoked_reason"),
  
  // Additional context
  notes: text("notes"),
  metadata: jsonb("metadata").$type<Record<string, any>>(), // Flexible additional data
  
  // Audit
  awardedBy: varchar("awarded_by").notNull(), // Who awarded it (can be system or user)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentAchievementSchema = createInsertSchema(studentAchievements).omit({ 
  id: true, createdAt: true 
});
export type InsertStudentAchievement = z.infer<typeof insertStudentAchievementSchema>;
export type StudentAchievement = typeof studentAchievements.$inferSelect;

// Entity Shares - for sharing classroom data across organizations
export type EntitySharePermission = "view" | "edit" | "copy";
export type ShareableEntityType = "class" | "student" | "assignment" | "lesson" | "scope_sequence";

export const entityShares = pgTable("entity_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type").notNull().$type<ShareableEntityType>(),
  entityId: varchar("entity_id").notNull(),
  sourceOrganizationId: varchar("source_organization_id").notNull(),
  targetOrganizationId: varchar("target_organization_id").notNull(),
  permission: text("permission").notNull().default("view").$type<EntitySharePermission>(),
  sharedBy: varchar("shared_by").notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEntityShareSchema = createInsertSchema(entityShares).omit({ id: true, createdAt: true });
export type InsertEntityShare = z.infer<typeof insertEntityShareSchema>;
export type EntityShare = typeof entityShares.$inferSelect;

// Student Groups (for group assignments)
export const studentGroups = pgTable("student_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  classId: varchar("class_id"),
  name: text("name").notNull(),
  description: text("description"),
  studentIds: jsonb("student_ids").notNull().$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentGroupSchema = createInsertSchema(studentGroups).omit({ id: true, createdAt: true });
export type InsertStudentGroup = z.infer<typeof insertStudentGroupSchema>;
export type StudentGroup = typeof studentGroups.$inferSelect;

// Assignment target types
export const assignmentTargetTypes = ["class", "accommodation_group", "individual"] as const;
export type AssignmentTargetType = typeof assignmentTargetTypes[number];

// Assignments Table
export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  lessonId: varchar("lesson_id"),
  title: text("title").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  questions: jsonb("questions").$type<{
    id: string;
    type: "multiple_choice" | "short_answer" | "essay" | "true_false" | "matching";
    question: string;
    options?: string[];
    correctAnswer?: string;
    points: number;
    bkdFocus?: "be" | "know" | "do";
  }[]>(),
  totalPoints: integer("total_points"),
  dueDate: timestamp("due_date"),
  
  // Target type: class, accommodation_group, or individual
  targetType: text("target_type").notNull().default("class").$type<AssignmentTargetType>(),
  
  // For class targeting
  classId: varchar("class_id"),
  
  // For accommodation group targeting - array of accommodation types to include
  targetAccommodations: jsonb("target_accommodations").$type<AccommodationType[]>(),
  
  // For individual targeting - array of student IDs
  targetStudentIds: jsonb("target_student_ids").$type<string[]>(),
  
  assignmentType: text("assignment_type").notNull().default("individual"),
  status: text("status").notNull().default("draft"),
  accommodationModified: boolean("accommodation_modified").default(false),
  accommodationTypes: jsonb("accommodation_types").$type<string[]>(),
  accommodationNotes: text("accommodation_notes"),
  // Standards selected via the country→state→subject→codes cascade, persisted
  // so the assignment detail can render badges + source provenance later. Each
  // entry preserves the catalog source tier and the linkable provenance URL
  // shown by the standard-code popover at selection time.
  standardsCodes: jsonb("standards_codes").$type<{
    code: string;
    description: string;
    source?: "official" | "curated" | "fallback";
    sourceUrl?: string | null;
    jurisdictionName?: string | null;
    standardsName?: string | null;
    lastVerifiedAt?: string | null;
  }[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignments.$inferSelect;

// Assignment Recipients (who the assignment is assigned to)
export const assignmentRecipients = pgTable("assignment_recipients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull(),
  recipientType: text("recipient_type").notNull(),
  recipientId: varchar("recipient_id").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  status: text("status").notNull().default("assigned"),
  submittedAt: timestamp("submitted_at"),
  score: integer("score"),
  feedback: text("feedback"),
});

export const insertAssignmentRecipientSchema = createInsertSchema(assignmentRecipients).omit({ id: true, assignedAt: true });
export type InsertAssignmentRecipient = z.infer<typeof insertAssignmentRecipientSchema>;
export type AssignmentRecipient = typeof assignmentRecipients.$inferSelect;

// ================================
// Gradebook System
// ================================

// Grade Categories (weights for different assignment types)
export const gradeCategories = pgTable("grade_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  classId: varchar("class_id").notNull(),
  name: text("name").notNull(),
  weight: integer("weight").notNull().default(100),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGradeCategorySchema = createInsertSchema(gradeCategories).omit({ id: true, createdAt: true });
export type InsertGradeCategory = z.infer<typeof insertGradeCategorySchema>;
export type GradeCategory = typeof gradeCategories.$inferSelect;

// Student Grades Table
export const studentGrades = pgTable("student_grades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  classId: varchar("class_id").notNull(),
  studentId: varchar("student_id").notNull(),
  assignmentId: varchar("assignment_id"),
  categoryId: varchar("category_id"),
  title: text("title").notNull(),
  pointsEarned: integer("points_earned"),
  pointsPossible: integer("points_possible").notNull().default(100),
  percentage: integer("percentage"),
  letterGrade: text("letter_grade"),
  comments: text("comments"),
  gradedAt: timestamp("graded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStudentGradeSchema = createInsertSchema(studentGrades).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudentGrade = z.infer<typeof insertStudentGradeSchema>;
export type StudentGrade = typeof studentGrades.$inferSelect;

// Grading Periods (quarters, semesters, etc.)
export const gradingPeriods = pgTable("grading_periods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  classId: varchar("class_id"),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isCurrent: boolean("is_current").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGradingPeriodSchema = createInsertSchema(gradingPeriods).omit({ id: true, createdAt: true });
export type InsertGradingPeriod = z.infer<typeof insertGradingPeriodSchema>;
export type GradingPeriod = typeof gradingPeriods.$inferSelect;

// ================================
// Student Digital Portfolio System
// ================================

// Student Portfolios Table
export const studentPortfolios = pgTable("student_portfolios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  bio: text("bio"),
  profileImageUrl: text("profile_image_url"),
  shareableSlug: varchar("shareable_slug").unique(),
  privacy: text("privacy").notNull().default("private"),
  theme: text("theme").notNull().default("professional"),
  contactEmail: text("contact_email"),
  linkedinUrl: text("linkedin_url"),
  handshakeUrl: text("handshake_url"),
  customLinks: jsonb("custom_links").$type<{ label: string; url: string }[]>(),
  skills: jsonb("skills").$type<string[]>(),
  education: jsonb("education").$type<{
    institution: string;
    degree?: string;
    field?: string;
    startYear?: number;
    endYear?: number;
    current?: boolean;
  }[]>(),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStudentPortfolioSchema = createInsertSchema(studentPortfolios).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true });
export type InsertStudentPortfolio = z.infer<typeof insertStudentPortfolioSchema>;
export type StudentPortfolio = typeof studentPortfolios.$inferSelect;

// Portfolio Items Table
export const portfolioItems = pgTable("portfolio_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").notNull(),
  itemType: text("item_type").notNull(),
  itemId: varchar("item_id"),
  customTitle: text("custom_title").notNull(),
  customDescription: text("custom_description"),
  thumbnailUrl: text("thumbnail_url"),
  attachmentUrl: text("attachment_url"),
  displayOrder: integer("display_order").notNull().default(0),
  highlighted: boolean("highlighted").default(false),
  bkdFocus: text("bkd_focus"),
  skills: jsonb("skills").$type<string[]>(),
  completedAt: timestamp("completed_at"),
  score: text("score"),
  metadata: jsonb("metadata").$type<{
    originalTitle?: string;
    course?: string;
    educator?: string;
    feedback?: string;
    certificateId?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPortfolioItemSchema = createInsertSchema(portfolioItems).omit({ id: true, createdAt: true });
export type InsertPortfolioItem = z.infer<typeof insertPortfolioItemSchema>;
export type PortfolioItem = typeof portfolioItems.$inferSelect;

// Portfolio item types
export const portfolioItemTypes = [
  "assignment",
  "project",
  "reflection",
  "certificate",
  "achievement",
  "custom"
] as const;

export type PortfolioItemType = typeof portfolioItemTypes[number];

// Portfolio themes
export const portfolioThemes = [
  { id: "professional", name: "Professional", description: "Clean and formal design" },
  { id: "creative", name: "Creative", description: "Colorful and expressive design" },
  { id: "minimal", name: "Minimal", description: "Simple and elegant design" },
  { id: "academic", name: "Academic", description: "Traditional academic style" },
] as const;

// Portfolio Comments Table (for teacher/parent feedback)
export const portfolioComments = pgTable("portfolio_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").notNull(),
  portfolioItemId: varchar("portfolio_item_id"),
  authorId: varchar("author_id").notNull(),
  authorRole: text("author_role").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPortfolioCommentSchema = createInsertSchema(portfolioComments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPortfolioComment = z.infer<typeof insertPortfolioCommentSchema>;
export type PortfolioComment = typeof portfolioComments.$inferSelect;

// Accommodation Suggestions (static reference data)
export const accommodationSuggestions = [
  { id: "1", type: "extraTime" as AccommodationType, category: "Timing", suggestion: "Provide 1.5x to 2x extended time for completing assignments", source: "IDEA Best Practices" },
  { id: "2", type: "notesCopyProvided" as AccommodationType, category: "Presentation", suggestion: "Provide copies of notes or presentation slides before class", source: "Universal Design for Learning" },
  { id: "3", type: "studySheetProvided" as AccommodationType, category: "Support", suggestion: "Provide a study sheet with key concepts and vocabulary", source: "Differentiated Instruction" },
  { id: "4", type: "graphicOrganizer" as AccommodationType, category: "Organization", suggestion: "Use graphic organizers to structure information visually", source: "Cognitive Strategy Instruction" },
  { id: "5", type: "mnemonicDevices" as AccommodationType, category: "Memory", suggestion: "Teach mnemonic devices to aid in memorization", source: "Cognitive Strategy Instruction" },
  { id: "6", type: "largerFont" as AccommodationType, category: "Presentation", suggestion: "Increase font size to 14pt or larger for readability", source: "Section 504 Guidelines" },
  { id: "7", type: "shortenedText" as AccommodationType, category: "Presentation", suggestion: "Reduce reading length while maintaining key concepts", source: "Differentiated Instruction" },
  { id: "8", type: "peerSupport" as AccommodationType, category: "Support", suggestion: "Pair with a peer buddy for collaborative learning", source: "Cooperative Learning" },
  { id: "9", type: "preferentialSeating" as AccommodationType, category: "Setting", suggestion: "Seat near the front or away from distractions", source: "Section 504 Guidelines" },
  { id: "10", type: "frequentReminders" as AccommodationType, category: "Behavior", suggestion: "Provide regular check-ins and on-task prompts", source: "PBIS Framework" },
  { id: "11", type: "completedExample" as AccommodationType, category: "Modeling", suggestion: "Show a completed example before independent work", source: "Explicit Instruction" },
  { id: "12", type: "visualOrganizer" as AccommodationType, category: "Organization", suggestion: "Use visual schedules and checklists for task completion", source: "Universal Design for Learning" },
] as const;

export type AccommodationSuggestion = typeof accommodationSuggestions[number];

// Generate Assignment Request Schema
export const generateAssignmentRequestSchema = z.object({
  lessonId: z.string(),
  assignmentType: z.enum(["quiz", "worksheet", "project", "discussion", "reflection"]),
  questionCount: z.number().min(1).max(20).default(5),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  includeBeKnowDo: z.boolean().default(true),
  accommodationTypes: z.array(z.enum(accommodationTypes)).optional(),
  accommodationNotes: z.string().optional(),
});

// ================================
// Real-Time Collaboration System
// ================================

// Collaboration Sessions Table
export const collaborationSessions = pgTable("collaboration_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hostUserId: varchar("host_user_id").notNull(),
  lessonId: varchar("lesson_id"),
  title: text("title").notNull(),
  description: text("description"),
  sessionType: text("session_type").notNull().default("lesson_planning"),
  status: text("status").notNull().default("active"),
  inviteCode: varchar("invite_code").notNull(),
  maxParticipants: integer("max_participants").default(10),
  settings: jsonb("settings").$type<{
    allowEditing: boolean;
    allowChat: boolean;
    allowComments: boolean;
    requireApproval: boolean;
  }>(),
  zoomUrl: text("zoom_url"),
  whatsappLink: text("whatsapp_link"),
  youtubeUrl: text("youtube_url"),
  createdAt: timestamp("created_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const insertCollaborationSessionSchema = createInsertSchema(collaborationSessions).omit({ id: true, createdAt: true });
export type InsertCollaborationSession = z.infer<typeof insertCollaborationSessionSchema>;
export type CollaborationSession = typeof collaborationSessions.$inferSelect;

// Session Participants Table
export const sessionParticipants = pgTable("session_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: text("role").notNull().default("viewer"),
  status: text("status").notNull().default("active"),
  cursorPosition: jsonb("cursor_position").$type<{ line: number; column: number; section?: string }>(),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
});

export const insertSessionParticipantSchema = createInsertSchema(sessionParticipants).omit({ id: true, joinedAt: true });
export type InsertSessionParticipant = z.infer<typeof insertSessionParticipantSchema>;
export type SessionParticipant = typeof sessionParticipants.$inferSelect;

// Collaboration Messages (Chat) Table
export const collaborationMessages = pgTable("collaboration_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id").notNull(),
  messageType: text("message_type").notNull().default("chat"),
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<{
    mentionedUserIds?: string[];
    replyToId?: string;
    attachmentUrl?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCollaborationMessageSchema = createInsertSchema(collaborationMessages).omit({ id: true, createdAt: true });
export type InsertCollaborationMessage = z.infer<typeof insertCollaborationMessageSchema>;
export type CollaborationMessage = typeof collaborationMessages.$inferSelect;

// Shared Resources Table
export const sharedResources = pgTable("shared_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  resourceType: text("resource_type").notNull(),
  category: text("category"),
  tags: jsonb("tags").$type<string[]>(),
  fileUrl: text("file_url"),
  content: text("content"),
  gradeLevel: text("grade_level"),
  subject: text("subject"),
  visibility: text("visibility").notNull().default("private"),
  downloadCount: integer("download_count").default(0),
  likeCount: integer("like_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSharedResourceSchema = createInsertSchema(sharedResources).omit({ id: true, createdAt: true, updatedAt: true, downloadCount: true, likeCount: true });
export type InsertSharedResource = z.infer<typeof insertSharedResourceSchema>;
export type SharedResource = typeof sharedResources.$inferSelect;

// Resource Likes Table
export const resourceLikes = pgTable("resource_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceId: varchar("resource_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertResourceLikeSchema = createInsertSchema(resourceLikes).omit({ id: true, createdAt: true });
export type InsertResourceLike = z.infer<typeof insertResourceLikeSchema>;
export type ResourceLike = typeof resourceLikes.$inferSelect;

// KNOW Resources Table - Admin-managed educational resources for career exploration
export const KNOW_RESOURCE_TYPES = ["book", "ebook", "youtube_channel", "podcast", "whatsapp_channel", "website", "course", "scholarship", "financial_guide", "essay_template"] as const;
export type KnowResourceType = typeof KNOW_RESOURCE_TYPES[number];

export const knowResources = pgTable("know_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  resourceType: text("resource_type").notNull().$type<KnowResourceType>(),
  category: text("category"), // career field: STEM, Healthcare, Business, Arts, etc.
  
  // Common fields
  url: text("url"),
  imageUrl: text("image_url"),
  author: text("author"),
  
  // Book/Ebook specific
  isbn: text("isbn"),
  publisher: text("publisher"),
  publishYear: integer("publish_year"),
  
  // YouTube specific
  channelId: text("channel_id"),
  subscriberCount: text("subscriber_count"),
  
  // Podcast specific
  rssFeedUrl: text("rss_feed_url"),
  podcastHost: text("podcast_host"),
  episodeCount: integer("episode_count"),
  
  // WhatsApp specific
  whatsappLink: text("whatsapp_link"),
  
  // Scholarship specific
  scholarshipType: text("scholarship_type"), // merit, need, both
  scholarshipAmount: text("scholarship_amount"), // e.g., "$5,000", "$40,000/year", "Varies"
  scholarshipDeadline: text("scholarship_deadline"), // deadline date string (display)
  nextDeadline: timestamp("next_deadline"), // parsed concrete deadline (auto-rolled for recurring)
  scholarshipSeason: text("scholarship_season"), // early_fall, late_fall, early_spring, late_spring
  eligibilityCriteria: jsonb("eligibility_criteria").$type<string[]>().default([]),
  applicationUrl: text("application_url"),
  isRecurring: boolean("is_recurring").default(false), // can reapply each year
  gpaRequirement: text("gpa_requirement"), // e.g., "3.5", "2.5", "None"
  minGpaDecimal: real("min_gpa_decimal"), // numeric GPA for comparisons, e.g. 3.5
  studentLevel: text("student_level"), // high_school, undergraduate, graduate, all
  firstGenFriendly: boolean("first_gen_friendly").default(false),
  stateRestrictions: jsonb("state_restrictions").$type<string[]>().default([]), // e.g. ["TX","FL"] empty = any state
  // Trust & verification (LYS curation signals)
  trustLevel: text("trust_level").default("verified").$type<"verified" | "community" | "external">(),
  lastVerifiedAt: timestamp("last_verified_at"),
  requiresFee: boolean("requires_fee").default(false), // flag/hide if true — never pay to apply
  privacyConcern: boolean("privacy_concern").default(false), // known data-harvesting aggregator
  // Being / Knowing / Doing alignment (auto-derived, admin-overridable)
  bkdAlignment: jsonb("bkd_alignment").$type<{
    being: boolean;
    knowing: boolean;
    doing: boolean;
    beingReason?: string;
    knowingReason?: string;
    doingReason?: string;
  }>().default({ being: false, knowing: false, doing: false }),
  bkdManualOverride: boolean("bkd_manual_override").default(false),
  // Auto-import tracking
  autoImported: boolean("auto_imported").default(false),
  urlStatus: text("url_status").default("unknown"), // unknown, active, broken
  lastValidatedAt: timestamp("last_validated_at"),
  // Provenance for institution-scraped scholarships
  sourceInstitutionId: varchar("source_institution_id"), // FK to institutions.id (nullable)
  sourceUrl: text("source_url"), // exact URL we scraped this from
  lastSeenAt: timestamp("last_seen_at"), // last scrape that confirmed this scholarship still exists
  scrapeRunId: varchar("scrape_run_id"), // last scrape run id that touched this row
  
  // Metadata
  tags: jsonb("tags").$type<string[]>().default([]),
  targetAudience: jsonb("target_audience").$type<string[]>().default([]), // students, educators, parents
  careerFields: jsonb("career_fields").$type<string[]>().default([]), // aligned career fields
  featured: boolean("featured").default(false),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  
  // Admin tracking
  createdBy: varchar("created_by").notNull(),
  updatedBy: varchar("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertKnowResourceSchema = createInsertSchema(knowResources).omit({ 
  id: true, createdAt: true, updatedAt: true 
});
export type InsertKnowResource = z.infer<typeof insertKnowResourceSchema>;
export type KnowResource = typeof knowResources.$inferSelect;

// LYS Marketplace Items — eBooks, mini courses, guides sold/offered via the platform
export const MARKETPLACE_ITEM_TYPES = ["ebook", "mini_course", "guide", "template", "workshop", "resource_pack", "lesson_plan", "pd_course"] as const;
export type MarketplaceItemType = typeof MARKETPLACE_ITEM_TYPES[number];

export const MARKETPLACE_AUDIENCE = ["students", "educators", "parents", "all"] as const;
export type MarketplaceAudience = typeof MARKETPLACE_AUDIENCE[number];

export const MARKETPLACE_BKD_TARGET = ["student_be", "student_know", "student_do", "educator_be", "educator_know", "educator_do"] as const;
export type MarketplaceBkdTarget = typeof MARKETPLACE_BKD_TARGET[number];

export const MARKETPLACE_CATEGORIES = ["lessons", "professional_development", "know_resources", "tools", "assessments", "other"] as const;
export type MarketplaceCategory = typeof MARKETPLACE_CATEGORIES[number];

export const marketplaceItems = pgTable("marketplace_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  itemType: text("item_type").notNull().$type<MarketplaceItemType>(),
  category: text("category").$type<MarketplaceCategory>().default("other"),
  audience: text("audience").notNull().$type<MarketplaceAudience>().default("all"),
  bkdTargets: jsonb("bkd_targets").$type<MarketplaceBkdTarget[]>().default([]),

  // Pricing
  price: integer("price").default(0), // in cents; 0 = free
  stripeProductId: text("stripe_product_id"),
  stripePriceId: text("stripe_price_id"),

  // Content
  coverImageUrl: text("cover_image_url"),
  previewUrl: text("preview_url"),
  contentUrl: text("content_url"), // download link after purchase
  externalUrl: text("external_url"), // for 3rd party hosted content

  // Metadata
  author: text("author"),
  authorBio: text("author_bio"),
  authorUserId: varchar("author_user_id"), // platform user who authored (for payouts)
  tags: jsonb("tags").$type<string[]>().default([]),
  careerFields: jsonb("career_fields").$type<string[]>().default([]),
  pageCount: integer("page_count"),
  durationMinutes: integer("duration_minutes"),
  featured: boolean("featured").default(false),
  isActive: boolean("is_active").default(true),
  salesCount: integer("sales_count").default(0),

  // Publishing
  publishedBy: varchar("published_by").notNull(), // userId of system_admin publisher
  isThirdParty: boolean("is_third_party").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMarketplaceItemSchema = createInsertSchema(marketplaceItems).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertMarketplaceItem = z.infer<typeof insertMarketplaceItemSchema>;
export type MarketplaceItem = typeof marketplaceItems.$inferSelect;

// Marketplace Wishlists — saved items for later
export const marketplaceWishlists = pgTable("marketplace_wishlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  itemId: varchar("item_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertMarketplaceWishlistSchema = createInsertSchema(marketplaceWishlists).omit({ id: true, createdAt: true });
export type InsertMarketplaceWishlist = z.infer<typeof insertMarketplaceWishlistSchema>;
export type MarketplaceWishlist = typeof marketplaceWishlists.$inferSelect;

// Marketplace Ratings — verified reviews from purchasers
export const marketplaceRatings = pgTable("marketplace_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  itemId: varchar("item_id").notNull(),
  rating: integer("rating").notNull(), // 1-5
  review: text("review"),
  verified: boolean("verified").default(false), // true if user has purchased
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertMarketplaceRatingSchema = createInsertSchema(marketplaceRatings).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMarketplaceRating = z.infer<typeof insertMarketplaceRatingSchema>;
export type MarketplaceRating = typeof marketplaceRatings.$inferSelect;

// Marketplace Purchases — tracks user acquisitions (free claim or paid)
export const marketplacePurchases = pgTable("marketplace_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  itemId: varchar("item_id").notNull(),
  amountPaid: integer("amount_paid").default(0), // in cents
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  status: text("status").notNull().default("completed"), // completed, pending, refunded
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMarketplacePurchaseSchema = createInsertSchema(marketplacePurchases).omit({
  id: true, createdAt: true,
});
export type InsertMarketplacePurchase = z.infer<typeof insertMarketplacePurchaseSchema>;
export type MarketplacePurchase = typeof marketplacePurchases.$inferSelect;

// Saved Scholarships — users bookmark scholarship resources for the Scholarship Planner
export const savedScholarships = pgTable("saved_scholarships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  resourceId: text("resource_id").notNull(), // prefixed: "know-<uuid>" or "<resource-id>"
  resourceTitle: text("resource_title").notNull(),
  resourceAmount: text("resource_amount"),
  resourceDeadline: text("resource_deadline"),
  resourceUrl: text("resource_url"),
  pursuitReason: text("pursuit_reason"), // BKD Being-tied reflection: "Why I'm pursuing this"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSavedScholarshipSchema = createInsertSchema(savedScholarships).omit({
  id: true, createdAt: true,
});
export type InsertSavedScholarship = z.infer<typeof insertSavedScholarshipSchema>;
export type SavedScholarship = typeof savedScholarships.$inferSelect;

// Resource Reports — students/educators flag suspect or broken scholarship listings
export const RESOURCE_REPORT_REASONS = [
  "broken_link",
  "expired",
  "scam_or_fee",
  "misleading",
  "privacy_concern",
  "other",
] as const;
export type ResourceReportReason = typeof RESOURCE_REPORT_REASONS[number];

export const RESOURCE_REPORT_STATUSES = ["pending", "resolved", "dismissed"] as const;
export type ResourceReportStatus = typeof RESOURCE_REPORT_STATUSES[number];

export const REPORT_AUTOHIDE_THRESHOLD = 3;

export const resourceReports = pgTable("resource_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceId: varchar("resource_id").notNull(), // know_resources.id (no "know-" prefix)
  userId: varchar("user_id").notNull(),
  reason: text("reason").notNull().$type<ResourceReportReason>(),
  details: text("details"),
  status: text("status").notNull().default("pending").$type<ResourceReportStatus>(),
  resolvedBy: varchar("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertResourceReportSchema = createInsertSchema(resourceReports).omit({
  id: true, createdAt: true, resolvedAt: true, resolvedBy: true, status: true,
});
export type InsertResourceReport = z.infer<typeof insertResourceReportSchema>;
export type ResourceReport = typeof resourceReports.$inferSelect;

// Session Edit History (for tracking collaborative changes)
export const sessionEditHistory = pgTable("session_edit_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id").notNull(),
  editType: text("edit_type").notNull(),
  fieldPath: text("field_path").notNull(),
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSessionEditHistorySchema = createInsertSchema(sessionEditHistory).omit({ id: true, createdAt: true });
export type InsertSessionEditHistory = z.infer<typeof insertSessionEditHistorySchema>;
export type SessionEditHistory = typeof sessionEditHistory.$inferSelect;

// Parent-Student Relationships Table
export const parentStudentLinks = pgTable("parent_student_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentUserId: varchar("parent_user_id").notNull(),
  studentUserId: varchar("student_user_id").notNull(),
  relationship: text("relationship").notNull().default("parent"), // parent, guardian, family_member
  status: text("status").notNull().default("pending"), // pending, active, revoked
  permissions: jsonb("permissions").$type<{
    viewGoals: boolean;
    viewAssessments: boolean;
    viewCareers: boolean;
    viewLessons: boolean;
    receiveNotifications: boolean;
  }>().default({ viewGoals: true, viewAssessments: true, viewCareers: true, viewLessons: false, receiveNotifications: true }),
  invitedAt: timestamp("invited_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertParentStudentLinkSchema = createInsertSchema(parentStudentLinks).omit({ id: true, createdAt: true, invitedAt: true });
export type InsertParentStudentLink = z.infer<typeof insertParentStudentLinkSchema>;
export type ParentStudentLink = typeof parentStudentLinks.$inferSelect;

// Parent Invitations Table
export const parentInvitations = pgTable("parent_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentUserId: varchar("student_user_id").notNull(),
  parentEmail: text("parent_email").notNull(),
  relationship: text("relationship").notNull().default("parent"),
  token: varchar("token").notNull().unique(),
  magicToken: varchar("magic_token").unique(), // copyable magic link token (no email service needed)
  inviterUserId: varchar("inviter_user_id"), // who sent the invite (student, parent, teacher, admin)
  inviterType: text("inviter_type").notNull().default("student"), // student, parent, teacher, campus_admin
  status: text("status").notNull().default("pending"), // pending, accepted, expired, revoked
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertParentInvitationSchema = createInsertSchema(parentInvitations).omit({ id: true, createdAt: true });
export type InsertParentInvitation = z.infer<typeof insertParentInvitationSchema>;
export type ParentInvitation = typeof parentInvitations.$inferSelect;

// Parent Progress Notes (for parents to add notes/comments)
export const parentProgressNotes = pgTable("parent_progress_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  linkId: varchar("link_id").notNull(), // references parent_student_links.id
  parentUserId: varchar("parent_user_id").notNull(),
  studentUserId: varchar("student_user_id").notNull(),
  noteType: text("note_type").notNull().default("general"), // general, encouragement, question, milestone_celebration
  content: text("content").notNull(),
  relatedGoalId: varchar("related_goal_id"),
  isPrivate: boolean("is_private").default(false), // private notes only visible to parent
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertParentProgressNoteSchema = createInsertSchema(parentProgressNotes).omit({ id: true, createdAt: true });
export type InsertParentProgressNote = z.infer<typeof insertParentProgressNoteSchema>;
export type ParentProgressNote = typeof parentProgressNotes.$inferSelect;

// Quiet Hours Table (teacher/admin-set messaging blackout windows)
export const quietHours = pgTable("quiet_hours", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id"), // campus-level default when set
  teacherUserId: varchar("teacher_user_id"), // teacher override; null = org-level
  classId: varchar("class_id"), // optional: scoped to a specific class
  startTime: varchar("start_time").notNull(), // "HH:MM" 24h format
  endTime: varchar("end_time").notNull(),   // "HH:MM" 24h format
  timezone: varchar("timezone").notNull().default("America/Chicago"),
  daysOfWeek: jsonb("days_of_week").$type<number[]>().default([0, 6]), // 0=Sun..6=Sat
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQuietHoursSchema = createInsertSchema(quietHours).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertQuietHours = z.infer<typeof insertQuietHoursSchema>;
export type QuietHours = typeof quietHours.$inferSelect;

// Parent Broadcast Posts (teacher/admin → all parents/students)
export const parentBroadcastPosts = pgTable("parent_broadcast_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorUserId: varchar("author_user_id").notNull(),
  authorType: text("author_type").notNull().default("teacher"), // teacher, campus_admin
  orgId: varchar("org_id"), // scoped to org/campus
  classId: varchar("class_id"), // optional: class-scoped
  title: text("title").notNull(),
  content: text("content").notNull(),
  audience: text("audience").notNull().default("parents"), // parents, students, all
  isPinned: boolean("is_pinned").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertParentBroadcastPostSchema = createInsertSchema(parentBroadcastPosts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertParentBroadcastPost = z.infer<typeof insertParentBroadcastPostSchema>;
export type ParentBroadcastPost = typeof parentBroadcastPosts.$inferSelect;

// Parent Notification Preferences (per parent-student link)
export const parentNotificationPreferences = pgTable("parent_notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentUserId: varchar("parent_user_id").notNull(),
  linkId: varchar("link_id").notNull(), // references parent_student_links.id
  preferences: jsonb("preferences").$type<{
    milestones: boolean;
    lowEngagement: boolean;
    newPortfolioItems: boolean;
    assignmentGrades: boolean;
    messages: boolean;
    broadcastPosts: boolean;
    goalUpdates: boolean;
    careerActivity: boolean;
  }>().default({
    milestones: true,
    lowEngagement: true,
    newPortfolioItems: true,
    assignmentGrades: true,
    messages: true,
    broadcastPosts: true,
    goalUpdates: true,
    careerActivity: false,
  }),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertParentNotificationPreferencesSchema = createInsertSchema(parentNotificationPreferences).omit({ id: true, updatedAt: true });
export type InsertParentNotificationPreferences = z.infer<typeof insertParentNotificationPreferencesSchema>;
export type ParentNotificationPreferences = typeof parentNotificationPreferences.$inferSelect;

// Portfolio Reports (teacher oversight/flagging)
export const portfolioReports = pgTable("portfolio_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioItemId: varchar("portfolio_item_id").notNull(),
  studentUserId: varchar("student_user_id").notNull(),
  reportedByUserId: varchar("reported_by_user_id").notNull(),
  reason: text("reason").notNull(), // inappropriate, copyright, incomplete, other
  notes: text("notes"),
  status: text("status").notNull().default("pending"), // pending, reviewed, dismissed, escalated
  resolvedByUserId: varchar("resolved_by_user_id"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPortfolioReportSchema = createInsertSchema(portfolioReports).omit({ id: true, createdAt: true });
export type InsertPortfolioReport = z.infer<typeof insertPortfolioReportSchema>;
export type PortfolioReport = typeof portfolioReports.$inferSelect;

// Parent Messages (1-to-1 secure messaging: parent↔student, parent↔teacher, teacher↔student)
// Uses same collaboration_messages infrastructure but with parentMessageThread as sessionId prefix
export const parentMessageThreads = pgTable("parent_message_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participantA: varchar("participant_a").notNull(), // userId
  participantB: varchar("participant_b").notNull(), // userId
  linkId: varchar("link_id"), // references parent_student_links.id for context
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const parentMessages = pgTable("parent_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull(), // references parent_message_threads.id
  senderUserId: varchar("sender_user_id").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  metadata: jsonb("metadata").$type<{ replyToId?: string; attachmentUrl?: string }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertParentMessageThreadSchema = createInsertSchema(parentMessageThreads).omit({ id: true, createdAt: true, lastMessageAt: true });
export type InsertParentMessageThread = z.infer<typeof insertParentMessageThreadSchema>;
export type ParentMessageThread = typeof parentMessageThreads.$inferSelect;

export const insertParentMessageSchema = createInsertSchema(parentMessages).omit({ id: true, createdAt: true });
export type InsertParentMessage = z.infer<typeof insertParentMessageSchema>;
export type ParentMessage = typeof parentMessages.$inferSelect;

// ================================
// Platform Configuration System
// ================================

// Feature Flags Table
export const featureFlags = pgTable("feature_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  isEnabled: boolean("enabled").notNull().default(false),
  rolloutPercentage: integer("rollout_percentage").notNull().default(100),
  allowedRoles: jsonb("allowed_roles").$type<string[]>().default([]),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;
export type FeatureFlag = typeof featureFlags.$inferSelect;

// Email Templates Table
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content"),
  textContent: text("text_content"),
  category: varchar("category").notNull().default("notification"),
  variables: jsonb("variables").$type<string[]>().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

// ================================
// Professional Development System
// ================================

// Educator Career Goals - tracks career aspirations for educators
export const educatorCareerGoals = pgTable("educator_career_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  goalType: text("goal_type").notNull(), // "leadership", "specialization", "certification", "skill_development", "role_change"
  targetRole: text("target_role"), // e.g., "Department Head", "Curriculum Specialist", "Principal"
  timeframe: text("timeframe").notNull(), // "6_months", "1_year", "2_years", "5_years"
  priority: integer("priority").default(1), // 1-5, higher is more important
  status: text("status").notNull().default("active"), // "active", "achieved", "paused", "abandoned"
  progress: integer("progress").default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEducatorCareerGoalSchema = createInsertSchema(educatorCareerGoals).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEducatorCareerGoal = z.infer<typeof insertEducatorCareerGoalSchema>;
export type EducatorCareerGoal = typeof educatorCareerGoals.$inferSelect;

// Educator Skills - tracks current skills and proficiency levels
export const educatorSkills = pgTable("educator_skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  skillName: text("skill_name").notNull(),
  category: text("category").notNull(), // "pedagogy", "technology", "leadership", "subject_matter", "assessment", "communication", "sel"
  proficiencyLevel: integer("proficiency_level").notNull().default(1), // 1-5: beginner, developing, proficient, advanced, expert
  isVerified: boolean("is_verified").default(false), // verified through assessment or certification
  lastAssessedAt: timestamp("last_assessed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEducatorSkillSchema = createInsertSchema(educatorSkills).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEducatorSkill = z.infer<typeof insertEducatorSkillSchema>;
export type EducatorSkill = typeof educatorSkills.$inferSelect;

// PD Resources - catalog of professional development opportunities
export const pdResources = pgTable("pd_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  provider: text("provider"), // "LYS", "Coursera", "EdX", "State", "District", etc.
  resourceType: text("resource_type").notNull(), // "course", "workshop", "certification", "webinar", "book", "mentorship", "conference"
  url: text("url"),
  duration: text("duration"), // "2 hours", "4 weeks", "self-paced"
  cost: text("cost"), // "free", "$50", "subscription"
  skillsAddressed: jsonb("skills_addressed").$type<string[]>().default([]),
  goalTypesAddressed: jsonb("goal_types_addressed").$type<string[]>().default([]),
  gradeRelevance: jsonb("grade_relevance").$type<string[]>().default([]), // K-2, 3-5, 6-8, 9-12, Higher Ed
  subjectRelevance: jsonb("subject_relevance").$type<string[]>().default([]),
  rating: integer("rating"), // 1-5 average rating
  completionCount: integer("completion_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPDResourceSchema = createInsertSchema(pdResources).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPDResource = z.infer<typeof insertPDResourceSchema>;
export type PDResource = typeof pdResources.$inferSelect;

// PD Recommendations - AI-generated personalized recommendations
export const pdRecommendations = pgTable("pd_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  resourceId: varchar("resource_id"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  reason: text("reason").notNull(), // why this was recommended
  skillGaps: jsonb("skill_gaps").$type<string[]>().default([]), // which skills this addresses
  relatedGoalIds: jsonb("related_goal_ids").$type<string[]>().default([]),
  priority: integer("priority").default(1), // 1-5, higher is more relevant
  status: text("status").notNull().default("new"), // "new", "viewed", "saved", "started", "completed", "dismissed"
  resourceType: text("resource_type"), // "course", "workshop", etc.
  provider: text("provider"),
  url: text("url"),
  estimatedDuration: text("estimated_duration"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPDRecommendationSchema = createInsertSchema(pdRecommendations).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPDRecommendation = z.infer<typeof insertPDRecommendationSchema>;
export type PDRecommendation = typeof pdRecommendations.$inferSelect;

// Educator PD Progress - tracks completion of PD activities
export const educatorPDProgress = pgTable("educator_pd_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  resourceId: varchar("resource_id"),
  recommendationId: varchar("recommendation_id"),
  title: text("title").notNull(),
  status: text("status").notNull().default("in_progress"), // "in_progress", "completed", "abandoned"
  progress: integer("progress").default(0), // 0-100
  hoursSpent: integer("hours_spent").default(0),
  completedAt: timestamp("completed_at"),
  certificateUrl: text("certificate_url"),
  notes: text("notes"),
  rating: integer("rating"), // user's rating 1-5
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEducatorPDProgressSchema = createInsertSchema(educatorPDProgress).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEducatorPDProgress = z.infer<typeof insertEducatorPDProgressSchema>;
export type EducatorPDProgress = typeof educatorPDProgress.$inferSelect;

// PD Recommendation Response Schema (for AI-generated recommendations)
export const pdRecommendationResponseSchema = z.object({
  recommendations: z.array(z.object({
    title: z.string(),
    description: z.string(),
    reason: z.string(),
    skillGaps: z.array(z.string()),
    resourceType: z.string(),
    provider: z.string().optional(),
    estimatedDuration: z.string().optional(),
    priority: z.number().min(1).max(5),
  })),
  summary: z.string(),
  focusAreas: z.array(z.string()),
});

export type PDRecommendationResponse = z.infer<typeof pdRecommendationResponseSchema>;

// ============================================
// TIER-BASED FEATURE ACCESS SYSTEM
// ============================================

export const UserTier = {
  FREE: "free",
  PRO: "pro",
  CAMPUS: "campus",
  ENTERPRISE: "enterprise",
} as const;

export type UserTierType = typeof UserTier[keyof typeof UserTier];

// Feature definition with tier requirements
export interface TierFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  category: "core" | "ai" | "collaboration" | "analytics" | "admin" | "premium";
  requiredTier: UserTierType;
  upgradeMessage?: string;
  limitInfo?: string; // e.g., "5/month on Free, Unlimited on Pro"
}

// Comprehensive feature definitions with tier requirements
export const TIER_FEATURES: TierFeature[] = [
  // Core Features (Free tier)
  { id: "dashboard", name: "Dashboard", description: "View your progress and recent activity", icon: "LayoutDashboard", path: "/", category: "core", requiredTier: "free" },
  { id: "self_discovery", name: "Self-Discovery", description: "Take assessments to understand your strengths", icon: "Compass", path: "/self-discovery", category: "core", requiredTier: "free" },
  { id: "careers", name: "Career Explorer", description: "Browse and save career pathways", icon: "Briefcase", path: "/careers", category: "core", requiredTier: "free" },
  { id: "action_plans", name: "Action Plans", description: "Create and track your goals", icon: "Target", path: "/action-plans", category: "core", requiredTier: "free", limitInfo: "3 active goals on Free" },
  { id: "resources", name: "Resources", description: "Access educational materials", icon: "BookOpen", path: "/resources", category: "core", requiredTier: "free" },
  
  // AI Features (Pro tier)
  { id: "lesson_generator", name: "AI Lesson Generator", description: "Create professional lesson plans with AI", icon: "Sparkles", path: "/lesson-generator", category: "ai", requiredTier: "free", limitInfo: "5/month on Free, Unlimited on Pro" },
  { id: "my_lessons", name: "My Lessons", description: "View and manage saved lessons", icon: "FileText", path: "/my-lessons", category: "ai", requiredTier: "free" },
  { id: "ai_recommendations", name: "AI PD Recommendations", description: "Get personalized professional development suggestions", icon: "Brain", path: "/professional-development", category: "ai", requiredTier: "pro", upgradeMessage: "Unlock AI-powered recommendations with Pro" },
  { id: "advanced_analytics", name: "Advanced Analytics", description: "Deep insights into your teaching impact", icon: "BarChart3", path: "/analytics", category: "analytics", requiredTier: "pro", upgradeMessage: "Get detailed analytics with Pro" },
  
  // Collaboration Features (Campus tier)
  { id: "collaboration", name: "Real-Time Collaboration", description: "Co-create lessons with colleagues", icon: "Users", path: "/collaboration", category: "collaboration", requiredTier: "campus", upgradeMessage: "Collaborate in real-time with Campus" },
  { id: "resource_library", name: "Shared Resource Library", description: "Share and discover resources with your community", icon: "Library", path: "/resource-library", category: "collaboration", requiredTier: "campus", upgradeMessage: "Access shared resources with Campus" },
  { id: "classroom", name: "Classroom Management", description: "Organize students and track progress", icon: "School", path: "/classroom", category: "collaboration", requiredTier: "campus", upgradeMessage: "Manage classrooms with Campus" },
  { id: "assignments", name: "Assignments", description: "Create and distribute assignments", icon: "ClipboardList", path: "/assignments", category: "collaboration", requiredTier: "campus", upgradeMessage: "Create assignments with Campus" },
  { id: "scope_sequence", name: "Scope & Sequence Builder", description: "Plan your curriculum across units", icon: "Calendar", path: "/scope-sequence", category: "collaboration", requiredTier: "campus", upgradeMessage: "Build curriculum with Campus" },
  
  // Admin Features (Campus tier)
  { id: "educator_influence", name: "Educator Influence", description: "Track your referrals and earn rewards", icon: "Award", path: "/educator-influence", category: "premium", requiredTier: "free" },
  { id: "milestones", name: "LYS Milestones", description: "Track Be-Know-Do milestone progress", icon: "Flag", path: "/milestones", category: "core", requiredTier: "free" },
  { id: "parent_portal", name: "Parent Portal", description: "Share progress with parents", icon: "Heart", path: "/parent-portal", category: "collaboration", requiredTier: "campus", upgradeMessage: "Share with parents via Campus" },
  
  // Enterprise Features
  { id: "standards_admin", name: "Standards Management", description: "Manage educational standards", icon: "Database", path: "/admin/standards", category: "admin", requiredTier: "enterprise", upgradeMessage: "Enterprise-level standards management" },
  { id: "site_admin", name: "Site Administration", description: "Full platform administration", icon: "Shield", path: "/admin", category: "admin", requiredTier: "enterprise", upgradeMessage: "Enterprise administration access" },
  { id: "system_admin", name: "System Administration", description: "Complete platform oversight", icon: "Settings", path: "/system-admin", category: "admin", requiredTier: "enterprise", upgradeMessage: "Enterprise system administration" },
];

// Tier benefits for upgrade messaging
export const TIER_BENEFITS = {
  free: {
    name: "Free",
    price: "$0",
    features: ["Self-Discovery Assessment", "Career Explorer", "5 AI Lessons/month", "3 Active Goals", "Basic Resources"],
  },
  pro: {
    name: "Pro",
    price: "$9.99/month",
    features: ["Everything in Free", "Unlimited AI Lessons", "AI PD Recommendations", "Advanced Analytics", "Priority Support"],
  },
  campus: {
    name: "Campus",
    price: "$29.99/month",
    features: ["Everything in Pro", "Real-Time Collaboration", "Classroom Management", "Assignments & Curriculum", "Shared Resource Library", "Parent Portal"],
  },
  enterprise: {
    name: "Enterprise",
    price: "Contact Sales",
    features: ["Everything in Campus", "Custom Integrations", "Standards Management", "Site Administration", "Dedicated Support", "Custom Branding"],
  },
};

// Helper function to check if a tier has access to a feature
export function tierHasAccess(userTier: UserTierType, requiredTier: UserTierType): boolean {
  const tierOrder: UserTierType[] = ["free", "pro", "campus", "enterprise"];
  return tierOrder.indexOf(userTier) >= tierOrder.indexOf(requiredTier);
}

// Get features for a specific tier (available and locked)
export function getFeaturesForTier(userTier: UserTierType): { available: TierFeature[]; locked: TierFeature[] } {
  const available: TierFeature[] = [];
  const locked: TierFeature[] = [];
  
  for (const feature of TIER_FEATURES) {
    if (tierHasAccess(userTier, feature.requiredTier)) {
      available.push(feature);
    } else {
      locked.push(feature);
    }
  }
  
  return { available, locked };
}

// Get the next tier for upgrade
export function getNextTier(currentTier: UserTierType): UserTierType | null {
  const tierOrder: UserTierType[] = ["free", "pro", "campus", "enterprise"];
  const currentIndex = tierOrder.indexOf(currentTier);
  if (currentIndex < tierOrder.length - 1) {
    return tierOrder[currentIndex + 1];
  }
  return null;
}

// Profile Sitemap Schema for API responses
export const profileSitemapSchema = z.object({
  currentTier: z.enum(["free", "pro", "campus", "enterprise"]),
  tierInfo: z.object({
    name: z.string(),
    price: z.string(),
    features: z.array(z.string()),
  }),
  nextTier: z.object({
    name: z.string(),
    price: z.string(),
    features: z.array(z.string()),
  }).nullable(),
  availableFeatures: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    icon: z.string(),
    path: z.string(),
    category: z.string(),
    limitInfo: z.string().optional(),
  })),
  lockedFeatures: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    icon: z.string(),
    path: z.string(),
    category: z.string(),
    requiredTier: z.string(),
    upgradeMessage: z.string().optional(),
  })),
  upgradeRecommendation: z.string().optional(),
});

export type ProfileSitemap = z.infer<typeof profileSitemapSchema>;

// Country Affordability Index (CAI) Schema
// Based on The Nomad Network Global Pricing System
export const caiCountrySchema = z.object({
  code: z.string(), // ISO 3166-1 alpha-2 country code
  name: z.string(),
  currency: z.string(), // ISO 4217 currency code
  currencySymbol: z.string(),
  caiScore: z.number().min(0.05).max(1.0), // Affordability score
  lcsiAdjustment: z.number().min(0).max(0.15), // Local cost adjustment
  region: z.string(),
  incomeLevel: z.enum(["high", "upper_middle", "lower_middle", "low"]),
  avgMonthlyIncomeUSD: z.number().optional(),
  lastUpdated: z.string(),
});

export type CAICountry = z.infer<typeof caiCountrySchema>;

// CAI Pricing calculation
export const caiPricingSchema = z.object({
  globalReferencePrice: z.number(),
  country: caiCountrySchema,
  adjustedPrice: z.number(),
  adjustedPriceLocal: z.number().optional(),
  savings: z.number(),
  savingsPercent: z.number(),
});

export type CAIPricing = z.infer<typeof caiPricingSchema>;

// Base prices in USD (Global Reference Prices)
export const BASE_PRICES_USD = {
  free: 0,
  pro: 7.99,
  campus: 299,
  enterprise: 299,
} as const;

// SIS (Student Information System) Integration
// Supports Clever, PowerSchool, Canvas, Infinite Campus, OneRoster
export const sisConnections = pgTable("sis_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // The educator/admin who connected
  organizationId: varchar("organization_id"), // Optional school/district organization
  provider: text("provider").notNull(), // clever, powerschool, canvas, infinite_campus, oneroster, skyward
  providerName: text("provider_name"), // Display name (e.g., "PowerSchool - Lincoln High")
  status: text("status").notNull().default("pending"), // pending, connected, error, disconnected
  accessToken: text("access_token"), // Encrypted OAuth access token
  refreshToken: text("refresh_token"), // Encrypted OAuth refresh token
  tokenExpiresAt: timestamp("token_expires_at"),
  districtId: varchar("district_id"), // Provider's district/school identifier
  schoolIds: jsonb("school_ids").$type<string[]>(), // Connected school IDs
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status"), // idle, syncing, error
  syncError: text("sync_error"),
  settings: jsonb("settings").$type<{
    autoSync: boolean;
    syncFrequency: string; // daily, weekly, manual
    syncStudents: boolean;
    syncTeachers: boolean;
    syncCourses: boolean;
    syncGrades: boolean;
    syncAttendance: boolean;
  }>(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSisConnectionSchema = createInsertSchema(sisConnections).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSisConnection = z.infer<typeof insertSisConnectionSchema>;
export type SisConnection = typeof sisConnections.$inferSelect;

// SIS Sync History - Track data transfer logs
export const sisSyncHistory = pgTable("sis_sync_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").notNull(),
  userId: varchar("user_id").notNull(),
  syncType: text("sync_type").notNull(), // full, incremental, students, teachers, courses, grades
  status: text("status").notNull(), // started, completed, failed
  recordsProcessed: integer("records_processed").default(0),
  recordsCreated: integer("records_created").default(0),
  recordsUpdated: integer("records_updated").default(0),
  recordsSkipped: integer("records_skipped").default(0),
  errorCount: integer("error_count").default(0),
  errors: jsonb("errors").$type<{ message: string; record?: any }[]>(),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
});

export const insertSisSyncHistorySchema = createInsertSchema(sisSyncHistory).omit({ id: true, startedAt: true });
export type InsertSisSyncHistory = z.infer<typeof insertSisSyncHistorySchema>;
export type SisSyncHistory = typeof sisSyncHistory.$inferSelect;

// SIS Imported Students - Students imported from SIS
export const sisStudents = pgTable("sis_students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").notNull(),
  sisStudentId: varchar("sis_student_id").notNull(), // ID from the SIS
  lysUserId: varchar("lys_user_id"), // Linked LYS user if exists
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  gradeLevel: text("grade_level"),
  schoolId: varchar("school_id"),
  schoolName: text("school_name"),
  enrollmentStatus: text("enrollment_status"), // active, inactive, transferred
  sisData: jsonb("sis_data").$type<Record<string, any>>(), // Raw data from SIS
  lastSyncAt: timestamp("last_sync_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSisStudentSchema = createInsertSchema(sisStudents).omit({ id: true, createdAt: true, lastSyncAt: true });
export type InsertSisStudent = z.infer<typeof insertSisStudentSchema>;
export type SisStudent = typeof sisStudents.$inferSelect;

// SIS Imported Courses/Sections
export const sisCourses = pgTable("sis_courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").notNull(),
  sisCourseId: varchar("sis_course_id").notNull(), // ID from the SIS
  name: text("name").notNull(),
  courseCode: text("course_code"),
  subject: text("subject"),
  gradeLevel: text("grade_level"),
  schoolId: varchar("school_id"),
  schoolName: text("school_name"),
  teacherIds: jsonb("teacher_ids").$type<string[]>(),
  studentCount: integer("student_count").default(0),
  term: text("term"), // Fall 2024, Spring 2025, etc.
  status: text("status"), // active, completed, upcoming
  sisData: jsonb("sis_data").$type<Record<string, any>>(),
  lastSyncAt: timestamp("last_sync_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSisCourseSchema = createInsertSchema(sisCourses).omit({ id: true, createdAt: true, lastSyncAt: true });
export type InsertSisCourse = z.infer<typeof insertSisCourseSchema>;
export type SisCourse = typeof sisCourses.$inferSelect;

// SIS Provider Configuration
export const SIS_PROVIDERS = {
  clever: {
    name: "Clever",
    description: "Rostering & SSO platform used by 100,000+ schools",
    apiBase: "https://api.clever.com/v3.1",
    authType: "oauth2",
    supports: ["students", "teachers", "courses", "schools"],
    icon: "graduation-cap",
  },
  powerschool: {
    name: "PowerSchool",
    description: "Leading K-12 student information system",
    apiBase: "", // District-specific
    authType: "oauth2",
    supports: ["students", "teachers", "courses", "grades", "attendance"],
    icon: "school",
  },
  canvas: {
    name: "Canvas LMS",
    description: "Learning management system by Instructure",
    apiBase: "", // Institution-specific
    authType: "access_token",
    supports: ["students", "teachers", "courses", "grades", "assignments"],
    icon: "book-open",
  },
  infinite_campus: {
    name: "Infinite Campus",
    description: "Cloud-based student information system",
    apiBase: "", // District-specific
    authType: "oauth2",
    supports: ["students", "teachers", "courses", "grades", "attendance"],
    icon: "building",
  },
  skyward: {
    name: "Skyward",
    description: "K-12 school administration software",
    apiBase: "", // District-specific
    authType: "oauth2",
    supports: ["students", "teachers", "courses", "grades"],
    icon: "cloud",
  },
  oneroster: {
    name: "OneRoster",
    description: "IMS Global OneRoster 1.1 — industry-standard rostering API",
    apiBase: "", // District-specific
    authType: "oauth2_client_credentials",
    supports: ["students", "teachers", "courses", "schools"],
    icon: "link",
  },
  classlink: {
    name: "ClassLink",
    description: "ClassLink Roster Server (OneRoster 1.1) — SSO & rostering for 2,500+ districts",
    apiBase: "", // District-specific
    authType: "oauth2_client_credentials",
    supports: ["students", "teachers", "courses", "schools"],
    icon: "link",
  },
} as const;

export type SisProvider = keyof typeof SIS_PROVIDERS;

// Student Notes - Educator comments about students
export const studentNotes = pgTable("student_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  educatorId: varchar("educator_id").notNull(),
  classId: varchar("class_id"), // Optional - note may be class-specific
  noteType: text("note_type").notNull().default("general"), // general, academic, behavioral, health, parent_contact
  content: text("content").notNull(),
  isPrivate: boolean("is_private").default(true), // If true, only note creator can see it
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStudentNoteSchema = createInsertSchema(studentNotes).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudentNote = z.infer<typeof insertStudentNoteSchema>;
export type StudentNote = typeof studentNotes.$inferSelect;

// Attendance Records
export const attendanceRecords = pgTable("attendance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").notNull(),
  studentId: varchar("student_id").notNull(),
  date: timestamp("date").notNull(),
  status: text("status").notNull().default("present"), // present, absent, tardy, excused
  notes: text("notes"),
  recordedBy: varchar("recorded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({ id: true, createdAt: true });
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;

// Note type enum for UI
export const NoteType = {
  GENERAL: "general",
  ACADEMIC: "academic",
  BEHAVIORAL: "behavioral",
  HEALTH: "health",
  PARENT_CONTACT: "parent_contact",
} as const;
export type NoteTypeValue = typeof NoteType[keyof typeof NoteType];

// Attendance status enum
export const AttendanceStatus = {
  PRESENT: "present",
  ABSENT: "absent",
  TARDY: "tardy",
  EXCUSED: "excused",
} as const;
export type AttendanceStatusValue = typeof AttendanceStatus[keyof typeof AttendanceStatus];

// ===========================================
// SYSTEM LESSON REPOSITORY & CONTENT LIBRARY
// ===========================================

// System Lesson Authors - Educators authorized to create master lessons
export const systemLessonAuthors = pgTable("system_lesson_authors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  authorizedBy: varchar("authorized_by").notNull(), // Site admin who granted permission
  specializations: jsonb("specializations").$type<string[]>().default([]), // e.g., ["math", "science", "elementary"]
  bio: text("bio"),
  status: text("status").notNull().default("active"), // active, suspended, revoked
  lessonsCreated: integer("lessons_created").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSystemLessonAuthorSchema = createInsertSchema(systemLessonAuthors).omit({ id: true, createdAt: true, updatedAt: true, lessonsCreated: true });
export type InsertSystemLessonAuthor = z.infer<typeof insertSystemLessonAuthorSchema>;
export type SystemLessonAuthor = typeof systemLessonAuthors.$inferSelect;

// Campus Lesson Authors - Educators authorized to create/influence lessons at campus level
export const campusLessonAuthors = pgTable("campus_lesson_authors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  organizationId: varchar("organization_id").notNull(), // Campus they are authorized for
  authorizedBy: varchar("authorized_by").notNull(), // Campus admin who granted permission
  specializations: jsonb("specializations").$type<string[]>().default([]),
  bio: text("bio"),
  status: text("status").notNull().default("active"), // active, suspended, revoked
  lessonsCreated: integer("lessons_created").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCampusLessonAuthorSchema = createInsertSchema(campusLessonAuthors).omit({ id: true, createdAt: true, updatedAt: true, lessonsCreated: true });
export type InsertCampusLessonAuthor = z.infer<typeof insertCampusLessonAuthorSchema>;
export type CampusLessonAuthor = typeof campusLessonAuthors.$inferSelect;

// Master Lessons - System-level authoritative lessons that influence AI generation
export const masterLessons = pgTable("master_lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull(), // System lesson author who created this
  title: text("title").notNull(),
  description: text("description"),
  topic: text("topic").notNull(),
  subject: text("subject").notNull(), // e.g., "math", "science", "english"
  gradeLevel: text("grade_level").notNull(),
  gradeBand: text("grade_band"), // e.g., "K-2", "3-5", "6-8", "9-12"
  bkdFocus: text("bkd_focus").notNull(), // "be", "know", "do", or "integrated"
  standards: jsonb("standards").$type<{ code: string; description: string }[]>().default([]),
  duration: text("duration").notNull(),
  objectives: jsonb("objectives").notNull().$type<string[]>(),
  activities: jsonb("activities").notNull().$type<{ title: string; description: string; duration: string; type: string; bkdAlignment?: string }[]>(),
  materials: jsonb("materials").notNull().$type<string[]>(),
  assessment: text("assessment").notNull(),
  reflection: text("reflection"),
  lysMethodology: jsonb("lys_methodology").$type<{ be: { focus: string; description: string }; know: { focus: string; description: string }; do: { focus: string; description: string } }>(),
  tags: jsonb("tags").$type<string[]>().default([]),
  qualityScore: integer("quality_score").default(0), // 0-100 based on completeness and usage
  usageCount: integer("usage_count").default(0), // Times this influenced AI generation
  status: text("status").notNull().default("draft"), // draft, pending_review, approved, archived
  reviewedBy: varchar("reviewed_by"), // Site admin who approved
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  embedding: jsonb("embedding").$type<number[]>(), // text-embedding-3-small (1536 dims) for semantic retrieval
  embeddedAt: timestamp("embedded_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMasterLessonSchema = createInsertSchema(masterLessons).omit({ id: true, createdAt: true, updatedAt: true, qualityScore: true, usageCount: true, reviewedAt: true, embedding: true, embeddedAt: true });
export type InsertMasterLesson = z.infer<typeof insertMasterLessonSchema>;
export type MasterLesson = typeof masterLessons.$inferSelect;

// Content Library - PDFs, eBooks, podcasts, YouTube for AI influence
export const ContentType = {
  PDF: "pdf",
  EBOOK: "ebook",
  BOOK: "book",
  PODCAST: "podcast",
  YOUTUBE_CHANNEL: "youtube_channel",
  YOUTUBE_VIDEO: "youtube_video",
  ARTICLE: "article",
  RESEARCH_PAPER: "research_paper",
} as const;
export type ContentTypeValue = typeof ContentType[keyof typeof ContentType];

export const contentLibrary = pgTable("content_library", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  uploadedBy: varchar("uploaded_by").notNull(), // Site admin or system author
  title: text("title").notNull(),
  description: text("description"),
  contentType: text("content_type").notNull().$type<ContentTypeValue>(),
  source: text("source"), // URL for online content, or original source reference
  fileUrl: text("file_url"), // S3/storage URL for uploaded files
  fileName: text("file_name"),
  fileSize: integer("file_size"), // in bytes
  author: text("author"), // Original author of the content
  publisher: text("publisher"),
  publicationDate: text("publication_date"),
  subjects: jsonb("subjects").$type<string[]>().default([]), // e.g., ["math", "stem", "education"]
  gradeLevels: jsonb("grade_levels").$type<string[]>().default([]), // e.g., ["K-2", "3-5"]
  tags: jsonb("tags").$type<string[]>().default([]),
  extractedText: text("extracted_text"), // Extracted/summarized text for AI processing
  embeddingVector: jsonb("embedding_vector").$type<number[]>(), // Vector embedding for semantic search
  processingStatus: text("processing_status").notNull().default("pending"), // pending, processing, completed, failed
  processingError: text("processing_error"),
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0), // Times used in AI generation
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContentLibrarySchema = createInsertSchema(contentLibrary).omit({ id: true, createdAt: true, updatedAt: true, usageCount: true, embeddingVector: true });
export type InsertContentLibrary = z.infer<typeof insertContentLibrarySchema>;
export type ContentLibraryItem = typeof contentLibrary.$inferSelect;

// Lesson Bulk Import Log - Track bulk uploads of lessons
export const lessonBulkImports = pgTable("lesson_bulk_imports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  uploadedBy: varchar("uploaded_by").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // csv, json
  totalRecords: integer("total_records").default(0),
  successCount: integer("success_count").default(0),
  errorCount: integer("error_count").default(0),
  errors: jsonb("errors").$type<{ row: number; field: string; message: string }[]>().default([]),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLessonBulkImportSchema = createInsertSchema(lessonBulkImports).omit({ id: true, createdAt: true, completedAt: true });
export type InsertLessonBulkImport = z.infer<typeof insertLessonBulkImportSchema>;
export type LessonBulkImport = typeof lessonBulkImports.$inferSelect;

// ===========================================
// RESOURCE RATINGS
// ===========================================
export const resourceRatings = pgTable("resource_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceId: varchar("resource_id").notNull(),
  userId: varchar("user_id").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  review: text("review"),
  helpful: boolean("helpful").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertResourceRatingSchema = createInsertSchema(resourceRatings).omit({ id: true, createdAt: true });
export type InsertResourceRating = z.infer<typeof insertResourceRatingSchema>;
export type ResourceRating = typeof resourceRatings.$inferSelect;

// ===========================================
// STUDENT NARRATIVES (BE Pillar - Personal Journey Storytelling)
// ===========================================
export const studentNarratives = pgTable("student_narratives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  narrativeType: text("narrative_type").notNull(), // personal_journey, strengths_story, career_vision, scholarship_essay, gratitude
  content: text("content").notNull(),
  bkdPillar: text("bkd_pillar"), // be, know, do
  tags: jsonb("tags").$type<string[]>().default([]),
  isPublic: boolean("is_public").default(false),
  wordCount: integer("word_count").default(0),
  lastEditedAt: timestamp("last_edited_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentNarrativeSchema = createInsertSchema(studentNarratives).omit({ id: true, createdAt: true });
export type InsertStudentNarrative = z.infer<typeof insertStudentNarrativeSchema>;
export type StudentNarrative = typeof studentNarratives.$inferSelect;

// ===========================================
// STRENGTHS INVENTORY (BE Pillar - from Self-Discovery)
// ===========================================
export const strengthsInventory = pgTable("strengths_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  strengthCategory: text("strength_category").notNull(), // identity, purpose, academic, social, leadership, resilience, creativity
  strengthTitle: text("strength_title").notNull(),
  description: text("description"),
  evidence: text("evidence"), // how they demonstrated this strength
  source: text("source"), // assessment, self_reported, educator_noted, activity
  relatedCareerFields: jsonb("related_career_fields").$type<string[]>().default([]),
  confidenceLevel: integer("confidence_level").default(3), // 1-5
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStrengthsInventorySchema = createInsertSchema(strengthsInventory).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStrengthsInventory = z.infer<typeof insertStrengthsInventorySchema>;
export type StrengthsInventory = typeof strengthsInventory.$inferSelect;

// ===========================================
// CAMPUS ACTIVITIES (DO Pillar - Activity Tracker)
// ===========================================
export const ACTIVITY_TYPES = ["club", "honor_society", "sports", "volunteer", "leadership", "work", "internship", "research", "arts", "other"] as const;
export type ActivityType = typeof ACTIVITY_TYPES[number];

export const campusActivities = pgTable("campus_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  activityName: text("activity_name").notNull(),
  activityType: text("activity_type").notNull().$type<ActivityType>(),
  organization: text("organization"), // school/campus name
  role: text("role"), // member, officer, president, captain, etc.
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  hoursPerWeek: integer("hours_per_week"),
  isActive: boolean("is_active").default(true),
  achievements: jsonb("achievements").$type<string[]>().default([]),
  relatedCareerFields: jsonb("related_career_fields").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCampusActivitySchema = createInsertSchema(campusActivities).omit({ id: true, createdAt: true });
export type InsertCampusActivity = z.infer<typeof insertCampusActivitySchema>;
export type CampusActivity = typeof campusActivities.$inferSelect;

// ===========================================
// SCHOLARSHIP APPLICATIONS (DO Pillar - Scholarship Planner)
// ===========================================
export const SCHOLARSHIP_SEASONS = ["early_fall", "late_fall", "early_spring", "late_spring"] as const;
export type ScholarshipSeason = typeof SCHOLARSHIP_SEASONS[number];

export const APPLICATION_STATUSES = ["planned", "in_progress", "submitted", "awarded", "rejected", "waitlisted"] as const;
export type ApplicationStatus = typeof APPLICATION_STATUSES[number];

export const scholarshipApplications = pgTable("scholarship_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  scholarshipName: text("scholarship_name").notNull(),
  scholarshipUrl: text("scholarship_url"),
  resourceId: varchar("resource_id"), // links to knowResources if exists
  amount: text("amount"),
  deadline: text("deadline"),
  season: text("season").$type<ScholarshipSeason>(),
  scholarshipType: text("scholarship_type"), // merit, need, both
  status: text("status").notNull().default("planned").$type<ApplicationStatus>(),
  essayRequired: boolean("essay_required").default(false),
  essayDraftId: varchar("essay_draft_id"), // links to studentNarratives
  transcriptRequired: boolean("transcript_required").default(false),
  referencesRequired: integer("references_required").default(0),
  checklist: jsonb("checklist").$type<{
    item: string;
    completed: boolean;
  }[]>().default([]),
  notes: text("notes"),
  awardedAmount: text("awarded_amount"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertScholarshipApplicationSchema = createInsertSchema(scholarshipApplications).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertScholarshipApplication = z.infer<typeof insertScholarshipApplicationSchema>;
export type ScholarshipApplication = typeof scholarshipApplications.$inferSelect;

// Scholarship sync log — tracks automated validation and import runs
export const scholarshipSyncLog = pgTable("scholarship_sync_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  syncType: text("sync_type").notNull(), // 'validation' | 'import' | 'full'
  status: text("status").notNull().default("running"), // running, completed, failed
  newCount: integer("new_count").default(0),
  deactivatedCount: integer("deactivated_count").default(0),
  validatedCount: integer("validated_count").default(0),
  errorCount: integer("error_count").default(0),
  notes: text("notes"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// ===========================================
// MENTOR CONNECTIONS
// ===========================================
export const mentorProfiles = pgTable("mentor_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  bio: text("bio"),
  expertise: jsonb("expertise").$type<string[]>().default([]),
  careerFields: jsonb("career_fields").$type<string[]>().default([]),
  yearsExperience: integer("years_experience"),
  maxMentees: integer("max_mentees").default(5),
  currentMentees: integer("current_mentees").default(0),
  isAvailable: boolean("is_available").default(true),
  mentorType: text("mentor_type"), // educator, professional, alumni, community_leader
  organization: text("organization"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMentorProfileSchema = createInsertSchema(mentorProfiles).omit({ id: true, createdAt: true });
export type InsertMentorProfile = z.infer<typeof insertMentorProfileSchema>;
export type MentorProfile = typeof mentorProfiles.$inferSelect;

export const mentorConnections = pgTable("mentor_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mentorId: varchar("mentor_id").notNull(), // mentorProfiles.id
  studentUserId: varchar("student_user_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, active, completed, declined
  message: text("message"), // student's request message
  careerInterest: text("career_interest"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMentorConnectionSchema = createInsertSchema(mentorConnections).omit({ id: true, createdAt: true });
export type InsertMentorConnection = z.infer<typeof insertMentorConnectionSchema>;
export type MentorConnection = typeof mentorConnections.$inferSelect;

// ===========================================
// SCHOLARSHIP CATEGORY CONSTANTS
// ===========================================
export const SCHOLARSHIP_CATEGORIES = [
  "Foundation & Corporate",
  "Federal Government",
  "Upper-class & Graduate",
  "Scholarship Searches",
  "HBCU",
  "Military",
  "STEM",
  "Arts & Humanities",
  "Athletic",
  "Religious",
  "Local & Community",
  "International",
  "First-Generation",
  "Minority",
  "Honor Society",
] as const;

export const ESSAY_TYPES = ["topical", "personal"] as const;
export type EssayType = typeof ESSAY_TYPES[number];

export const STRENGTH_CATEGORIES = [
  "identity",
  "purpose",
  "academic",
  "social",
  "leadership",
  "resilience",
  "creativity",
  "communication",
  "problem_solving",
  "teamwork",
] as const;
export type StrengthCategory = typeof STRENGTH_CATEGORIES[number];

// Pricing Tiers - Admin-managed pricing configuration
export const pricingTiers = pgTable("pricing_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tierId: text("tier_id").notNull().unique(), // free, pro, campus, enterprise
  name: text("name").notNull(),
  basePrice: integer("base_price").notNull().default(0), // in cents
  period: text("period").notNull().default("/month"), // /month, /year, forever
  description: text("description"),
  features: jsonb("features").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  maxStudentsPerClass: integer("max_students_per_class"),
  maxAiLessons: integer("max_ai_lessons"), // null = unlimited
  includesAds: boolean("includes_ads").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: text("updated_by"),
});

export const insertPricingTierSchema = createInsertSchema(pricingTiers).omit({ id: true, updatedAt: true });
export type InsertPricingTier = z.infer<typeof insertPricingTierSchema>;
export type PricingTier = typeof pricingTiers.$inferSelect;

export const contentReviewQueue = pgTable("content_review_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentType: varchar("content_type").notNull(),
  contentId: varchar("content_id"),
  sourceUserId: varchar("source_user_id").notNull(),
  sourceUserRole: varchar("source_user_role"),
  organizationId: varchar("organization_id"),
  content: text("content").notNull(),
  context: text("context"),
  flaggedKeywords: jsonb("flagged_keywords").$type<string[]>().default([]),
  severity: varchar("severity").notNull().default("medium"),
  status: varchar("status").notNull().default("pending_review"),
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  reviewAction: varchar("review_action"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContentReviewSchema = createInsertSchema(contentReviewQueue).omit({ id: true, createdAt: true, reviewedAt: true });
export type InsertContentReview = z.infer<typeof insertContentReviewSchema>;
export type ContentReview = typeof contentReviewQueue.$inferSelect;

export const parentalConsents = pgTable("parental_consents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentUserId: varchar("student_user_id").notNull(),
  parentEmail: varchar("parent_email").notNull(),
  parentName: varchar("parent_name"),
  consentStatus: varchar("consent_status").notNull().default("pending"),
  verificationToken: varchar("verification_token"),
  consentedAt: timestamp("consented_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertParentalConsentSchema = createInsertSchema(parentalConsents).omit({ id: true, createdAt: true });
export type InsertParentalConsent = z.infer<typeof insertParentalConsentSchema>;
export type ParentalConsent = typeof parentalConsents.$inferSelect;

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  action: varchar("action").notNull(),
  category: varchar("category").notNull(),
  severity: varchar("severity").notNull().default("info"),
  resourceType: varchar("resource_type"),
  resourceId: varchar("resource_id"),
  details: jsonb("details").$type<Record<string, any>>(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  organizationId: varchar("organization_id"),
  // Tamper-evidence (hash chain). `hash` is sha256 over the canonical row plus
  // the `prevHash` of the immediately prior chained row. The prevHash->hash
  // links form a linked list; any insertion/edit/deletion breaks it at verify
  // time. Order is derived by walking the links, so no separate sequence column
  // is needed (and existing pre-chain rows are left untouched).
  prevHash: varchar("prev_hash"),
  hash: varchar("hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Data Subject Requests (GDPR/CCPA/COPPA). Tracks export + delete requests and
// their lifecycle. Self-serve accounts are hard-deleted; school-owned student
// records are anonymized. When the subject is a student, the school admin and
// parent/guardian are alerted.
export const dataSubjectRequests = pgTable("data_subject_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull().$type<"export" | "delete">(),
  subjectUserId: varchar("subject_user_id").notNull(),
  requestedBy: varchar("requested_by").notNull(),
  requestedByRole: varchar("requested_by_role"),
  scope: varchar("scope").notNull().default("self").$type<"self" | "school">(),
  organizationId: varchar("organization_id"),
  status: varchar("status").notNull().default("pending").$type<"pending" | "processing" | "completed" | "failed" | "rejected">(),
  reason: text("reason"),
  resultDetails: jsonb("result_details").$type<Record<string, any>>(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDataSubjectRequestSchema = createInsertSchema(dataSubjectRequests).omit({ id: true, createdAt: true, completedAt: true, resultDetails: true, status: true });
export type InsertDataSubjectRequest = z.infer<typeof insertDataSubjectRequestSchema>;
export type DataSubjectRequest = typeof dataSubjectRequests.$inferSelect;

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true, prevHash: true, hash: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Append-only consent ledger (FTC/ROSCA + GDPR click-wrap evidence). Each row
// records one affirmative consent action: who, what policy + version, where it
// happened, and the exact (millisecond) timestamp, IP, and user agent. Rows are
// never updated or deleted — this is the proof-of-consent record.
export const consentEvents = pgTable("consent_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"), // nullable: may be captured before the account exists
  email: varchar("email"),
  policyType: varchar("policy_type").notNull(), // tos | privacy | ai | bundle | recurring_billing
  policyVersion: varchar("policy_version").notNull(),
  policyUuid: varchar("policy_uuid"),
  action: varchar("action").notNull().default("accept"), // accept | withdraw
  context: varchar("context").notNull(), // signup | onboarding | checkout | reaccept
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 }).defaultNow(),
});

export const insertConsentEventSchema = createInsertSchema(consentEvents).omit({ id: true, createdAt: true });
export type InsertConsentEvent = z.infer<typeof insertConsentEventSchema>;
export type ConsentEvent = typeof consentEvents.$inferSelect;

// =============================================================================
// ZERO-TRUST DATA GOVERNANCE
// =============================================================================

// Rule 1: Success Ledger - Immutable student success records
export const successMarks = pgTable("success_marks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  classId: varchar("class_id"),
  assignmentId: varchar("assignment_id"),
  educatorId: varchar("educator_id").notNull(),
  organizationId: varchar("organization_id"),
  standardCode: varchar("standard_code"),
  mark: varchar("mark").notNull().$type<"success" | "not_yet">(),
  isMutable: boolean("is_mutable").default(true),
  finalizedAt: timestamp("finalized_at"),
  auditReason: text("audit_reason"),
  auditEditedBy: varchar("audit_edited_by"),
  auditEditedAt: timestamp("audit_edited_at"),
  isArchived: boolean("is_archived").default(false),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  submittedAt: timestamp("submitted_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSuccessMarkSchema = createInsertSchema(successMarks).omit({ id: true, createdAt: true, finalizedAt: true, auditEditedAt: true });
export type InsertSuccessMark = z.infer<typeof insertSuccessMarkSchema>;
export type SuccessMark = typeof successMarks.$inferSelect;

// Rule 2: Communication Safety Vault - soft-delete archive for all messages
export const safetyVault = pgTable("safety_vault", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id"),
  threadId: varchar("thread_id"),
  senderId: varchar("sender_id").notNull(),
  senderRole: varchar("sender_role"),
  senderTenantId: varchar("sender_tenant_id"),
  recipientId: varchar("recipient_id"),
  recipientTenantId: varchar("recipient_tenant_id"),
  content: text("content").notNull(),
  contentType: varchar("content_type").default("message"),
  isDeletedFromUI: boolean("is_deleted_from_ui").default(false),
  isPiiBlocked: boolean("is_pii_blocked").default(false),
  blockedPatterns: jsonb("blocked_patterns").$type<string[]>(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  deviceId: varchar("device_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSafetyVaultSchema = createInsertSchema(safetyVault).omit({ id: true, createdAt: true });
export type InsertSafetyVault = z.infer<typeof insertSafetyVaultSchema>;
export type SafetyVault = typeof safetyVault.$inferSelect;

// Rule 7: VPN/Fraud 3-Strike Tracking
export const fraudStrikes = pgTable("fraud_strikes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  geoIpCountry: varchar("geo_ip_country"),
  geoIpRegion: varchar("geo_ip_region"),
  paymentRegion: varchar("payment_region"),
  sessionIp: varchar("session_ip"),
  mismatchType: varchar("mismatch_type").default("geo_payment"),
  strikeNumber: integer("strike_number").default(1),
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFraudStrikeSchema = createInsertSchema(fraudStrikes).omit({ id: true, createdAt: true });
export type InsertFraudStrike = z.infer<typeof insertFraudStrikeSchema>;
export type FraudStrike = typeof fraudStrikes.$inferSelect;

// Free Trial Tracking
export const freeTrials = pgTable("free_trials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ipAddress: varchar("ip_address").notNull(),
  fingerprint: varchar("fingerprint"),
  userId: varchar("user_id"),
  trialStartDate: timestamp("trial_start_date").notNull().defaultNow(),
  trialEndDate: timestamp("trial_end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  abuseFlags: integer("abuse_flags").notNull().default(0),
  metadata: jsonb("metadata").$type<{ userAgent?: string; timezone?: string; screenResolution?: string; language?: string }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFreeTrialSchema = createInsertSchema(freeTrials).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFreeTrial = z.infer<typeof insertFreeTrialSchema>;
export type FreeTrial = typeof freeTrials.$inferSelect;

// ----- Needs Analyzer (4-question funnel) ------------------------------------
// Captures the segment, pain, urgency, and desired outcome of every visitor
// who completes (or partially completes) the on-site Needs Analyzer. Anonymous
// responses are keyed by `sessionId` (a uuid stored in the visitor's
// localStorage); after they sign up, the onboarding flow calls a bind endpoint
// that fills in `userId` and `convertedAt`, so we can measure which segments
// convert best in the Exec KPIs tab.
export const needsAnalyzerResponses = pgTable(
  "needs_analyzer_responses",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: varchar("session_id").notNull(),
    userId: varchar("user_id"),
    identity: varchar("identity").notNull(),
    corePain: text("core_pain"),
    urgency: varchar("urgency"),
    desiredOutcome: text("desired_outcome"),
    ctaShown: varchar("cta_shown"),
    ctaClicked: varchar("cta_clicked"),
    ctaClickedAt: timestamp("cta_clicked_at"),
    convertedAt: timestamp("converted_at"),
    ipAddress: varchar("ip_address"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    sessionIdx: index("needs_analyzer_session_id_idx").on(t.sessionId),
    identityIdx: index("needs_analyzer_identity_idx").on(t.identity),
  }),
);
export const insertNeedsAnalyzerResponseSchema = createInsertSchema(needsAnalyzerResponses).omit({
  id: true,
  userId: true,
  ctaClickedAt: true,
  convertedAt: true,
  ipAddress: true,
  createdAt: true,
});
export type InsertNeedsAnalyzerResponse = z.infer<typeof insertNeedsAnalyzerResponseSchema>;
export type NeedsAnalyzerResponse = typeof needsAnalyzerResponses.$inferSelect;

// RSS Feeds (System-level content ingestion)
export type RssFeedType = "podcast" | "blog";
export type RssContentStatus = "pending" | "approved" | "rejected" | "archived";
export type RssPlacement = "know_resource" | "ai_lesson" | "featured" | "mentor_connect";
export type RssAiUsageType = "supplemental" | "primary";
export type RssBkdPillar = "be" | "know" | "do";

export const rssFeeds = pgTable("rss_feeds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  url: text("url").notNull(),
  feedType: text("feed_type").notNull().$type<RssFeedType>(),
  description: text("description"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  fetchIntervalMinutes: integer("fetch_interval_minutes").default(60),
  lastFetchedAt: timestamp("last_fetched_at"),
  itemCount: integer("item_count").default(0),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRssFeedSchema = createInsertSchema(rssFeeds).omit({ id: true, createdAt: true, updatedAt: true, lastFetchedAt: true, itemCount: true });
export type InsertRssFeed = z.infer<typeof insertRssFeedSchema>;
export type RssFeed = typeof rssFeeds.$inferSelect;

export const rssContentItems = pgTable("rss_content_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  feedId: varchar("feed_id").notNull(),
  guid: text("guid").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  contentUrl: text("content_url"),
  imageUrl: text("image_url"),
  audioUrl: text("audio_url"),
  author: text("author"),
  publishedAt: timestamp("published_at"),
  rawMetadata: jsonb("raw_metadata").$type<Record<string, any>>(),
  suggestedPlacements: jsonb("suggested_placements").$type<RssPlacement[]>().default([]),
  approvedPlacements: jsonb("approved_placements").$type<RssPlacement[]>().default([]),
  status: text("status").notNull().$type<RssContentStatus>().default("pending"),
  aiUsageType: text("ai_usage_type").$type<RssAiUsageType>().default("supplemental"),
  bkdPillar: text("bkd_pillar").$type<RssBkdPillar>(),
  careerFields: jsonb("career_fields").$type<string[]>().default([]),
  tags: jsonb("tags").$type<string[]>().default([]),
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRssContentItemSchema = createInsertSchema(rssContentItems).omit({ id: true, createdAt: true, updatedAt: true, reviewedAt: true });
export type InsertRssContentItem = z.infer<typeof insertRssContentItemSchema>;
export type RssContentItem = typeof rssContentItems.$inferSelect;

// =============================================================================
// Scholarship Scraper — Top-500 institutions, quarterly scrape, admin-approval
// =============================================================================

export const INSTITUTION_SECTORS = [
  "public_4yr",
  "private_nonprofit_4yr",
  "private_forprofit_4yr",
  "public_2yr",
  "private_nonprofit_2yr",
  "private_forprofit_2yr",
  "trade_vocational",
  "parallel_org",
  "other",
] as const;
export type InstitutionSector = typeof INSTITUTION_SECTORS[number];

export const URL_DISCOVERY_STATUS = ["pending", "found", "not_found", "failed"] as const;
export type UrlDiscoveryStatus = typeof URL_DISCOVERY_STATUS[number];

export const INSTITUTION_SCRAPE_STATUS = [
  "pending",
  "ok",
  "skipped_unchanged",
  "no_url",
  "blocked_by_robots",
  "fetch_failed",
  "extract_failed",
] as const;
export type InstitutionScrapeStatus = typeof INSTITUTION_SCRAPE_STATUS[number];

export const institutions = pgTable("institutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ipedsId: text("ipeds_id"),
  name: text("name").notNull(),
  websiteUrl: text("website_url"),
  scholarshipUrl: text("scholarship_url"),
  state: varchar("state"),
  sector: text("sector").$type<InstitutionSector>(),
  enrollment: integer("enrollment"),
  scholarshipUrlDiscoveryStatus: text("scholarship_url_discovery_status").default("pending").$type<UrlDiscoveryStatus>(),
  lastDiscoveryAttemptAt: timestamp("last_discovery_attempt_at"),
  lastScrapedAt: timestamp("last_scraped_at"),
  lastContentHash: text("last_content_hash"),
  lastScrapeStatus: text("last_scrape_status").$type<InstitutionScrapeStatus>(),
  lastScrapeError: text("last_scrape_error"),
  lastScrapeScholarshipsFound: integer("last_scrape_scholarships_found").default(0),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInstitutionSchema = createInsertSchema(institutions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;
export type Institution = typeof institutions.$inferSelect;

export const SCRAPE_RUN_STATUS = ["running", "completed", "failed"] as const;
export type ScrapeRunStatus = typeof SCRAPE_RUN_STATUS[number];

export const SCRAPE_TRIGGER = ["scheduled", "manual", "startup"] as const;
export type ScrapeTrigger = typeof SCRAPE_TRIGGER[number];

export const scholarshipScrapeRuns = pgTable("scholarship_scrape_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  triggerType: text("trigger_type").notNull().$type<ScrapeTrigger>(),
  triggeredBy: varchar("triggered_by"),
  startedAt: timestamp("started_at").defaultNow(),
  finishedAt: timestamp("finished_at"),
  status: text("status").notNull().default("running").$type<ScrapeRunStatus>(),
  institutionsTotal: integer("institutions_total").default(0),
  institutionsScraped: integer("institutions_scraped").default(0),
  institutionsSkipped: integer("institutions_skipped").default(0),
  institutionsFailed: integer("institutions_failed").default(0),
  scholarshipsFound: integer("scholarships_found").default(0),
  scholarshipsUpdated: integer("scholarships_updated").default(0),
  scholarshipsDeactivated: integer("scholarships_deactivated").default(0),
  errorMessage: text("error_message"),
});

export const insertScholarshipScrapeRunSchema = createInsertSchema(scholarshipScrapeRuns).omit({
  id: true,
  startedAt: true,
});
export type InsertScholarshipScrapeRun = z.infer<typeof insertScholarshipScrapeRunSchema>;
export type ScholarshipScrapeRun = typeof scholarshipScrapeRuns.$inferSelect;

// User data region tracking (Rule 4: Data Residency)
export const userDataRegions = pgTable("user_data_regions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  dataRegion: varchar("data_region").notNull().$type<"us" | "eu" | "ng" | "global">(),
  detectedCountry: varchar("detected_country"),
  detectedIp: varchar("detected_ip"),
  isLocked: boolean("is_locked").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// Foundation (Internal Onboarding) — staff-facing "Our Foundation" widget
// ============================================================================

// One row per onboarding module (Mission, Vision, Values, Brand, Strategy, Goals).
// HR can edit the title / video URL / body copy in the Admin Foundation page.
export const foundationModules = pgTable("foundation_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug").notNull().unique(),
  order: integer("order").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  contentType: varchar("content_type").notNull().default("text").$type<"text" | "video" | "quiz" | "timeline" | "okr">(),
  body: text("body").notNull().default(""),
  videoUrl: varchar("video_url"),
  quizJson: jsonb("quiz_json").$type<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  }[]>().default([]),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFoundationModuleSchema = createInsertSchema(foundationModules).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFoundationModule = z.infer<typeof insertFoundationModuleSchema>;
export type FoundationModule = typeof foundationModules.$inferSelect;

// One row per (user, module). viewedAt set on first open; completedAt set when the
// user clicks "Mark complete" or passes the quiz. quizScore is 0-100 for the Values quiz.
export const foundationProgress = pgTable("foundation_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  moduleSlug: varchar("module_slug").notNull(),
  viewedAt: timestamp("viewed_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  quizScore: integer("quiz_score"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_foundation_progress_user").on(table.userId),
  uniqueIndex("uq_foundation_progress_user_module").on(table.userId, table.moduleSlug),
]);

export const insertFoundationProgressSchema = createInsertSchema(foundationProgress).omit({ id: true, viewedAt: true, updatedAt: true });
export type InsertFoundationProgress = z.infer<typeof insertFoundationProgressSchema>;
export type FoundationProgress = typeof foundationProgress.$inferSelect;


// ===== Bricks/BKD Lesson AI Improvements =====

// Per-section embeddings on master lessons (objectives, essentialQuestions, activities, close, etc.)
export const masterLessonSections = pgTable("master_lesson_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  masterLessonId: varchar("master_lesson_id").notNull(),
  sectionType: varchar("section_type").notNull(), // objectives | essential_questions | activities | bkd_be | bkd_know | bkd_do | resources | close
  content: text("content").notNull(),
  embedding: jsonb("embedding").$type<number[]>(),
  embeddedAt: timestamp("embedded_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_mls_master_lesson").on(table.masterLessonId),
  index("idx_mls_section_type").on(table.sectionType),
]);
export const insertMasterLessonSectionSchema = createInsertSchema(masterLessonSections).omit({ id: true, createdAt: true, embedding: true, embeddedAt: true });
export type InsertMasterLessonSection = z.infer<typeof insertMasterLessonSectionSchema>;
export type MasterLessonSection = typeof masterLessonSections.$inferSelect;

// LYS Canon entries — DB-backed replacement for hardcoded lysReference.ts content.
// Also holds voice/style entries seeded from server/reference/lys/*.txt that the
// voiceProfileService retrieves via cosine similarity to infuse Master Teacher
// tone into both lesson and assignment generation.
export const lysCanonEntries = pgTable("lys_canon_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  kind: varchar("kind").notNull(), // exemplar | vocab | domain | accommodation | voice | exemplar_full
  subject: varchar("subject"), // null = applies to all subjects
  gradeBand: varchar("grade_band"), // e.g. "6-8"; null = all grades
  topicHint: text("topic_hint"), // optional matching keyword
  title: text("title").notNull(),
  body: text("body").notNull(),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").notNull().default(true),
  source: varchar("source").default("hardcoded_migration"), // hardcoded_migration | admin_created | lys_voice_corpus
  embedding: jsonb("embedding").$type<number[]>(), // lazily populated by voiceProfileService
  embeddedAt: timestamp("embedded_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_canon_kind").on(table.kind),
  index("idx_canon_subject").on(table.subject),
]);
export const insertLysCanonEntrySchema = createInsertSchema(lysCanonEntries).omit({ id: true, createdAt: true, updatedAt: true, embedding: true, embeddedAt: true });
export type InsertLysCanonEntry = z.infer<typeof insertLysCanonEntrySchema>;
export type LysCanonEntry = typeof lysCanonEntries.$inferSelect;

// Per-subject canon version stamps for granular cache invalidation (#7)
export const subjectCanonVersions = pgTable("subject_canon_versions", {
  subject: varchar("subject").primaryKey(),
  version: integer("version").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export type SubjectCanonVersion = typeof subjectCanonVersions.$inferSelect;

// Attribution: which exemplars/sections/canon entries fed a given generation,
// and what score the result earned. Used to learn which references work.
export const lessonGenerationAttribution = pgTable("lesson_generation_attribution", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cacheKey: varchar("cache_key"),
  lessonId: varchar("lesson_id"),
  userId: varchar("user_id"),
  topic: text("topic"),
  subject: varchar("subject"),
  gradeLevel: varchar("grade_level"),
  bkdFocus: varchar("bkd_focus"),
  masterLessonIds: jsonb("master_lesson_ids").$type<string[]>().default([]),
  sectionIds: jsonb("section_ids").$type<string[]>().default([]),
  canonEntryIds: jsonb("canon_entry_ids").$type<string[]>().default([]),
  finalScore: integer("final_score"), // 0-100
  retrievalMode: varchar("retrieval_mode").default("legacy"), // legacy | semantic
  // Voice critic post-pass results (only populated when new_lesson_retrieval flag on)
  voiceScore: integer("voice_score"), // 0-100 from voiceCriticService; null = critic skipped
  voiceCritique: jsonb("voice_critique").$type<{ tellsDetected?: string[]; notes?: string }>(),
  rewritten: boolean("rewritten").default(false), // true if critic rewrote below threshold
  voiceSnippetIds: jsonb("voice_snippet_ids").$type<string[]>().default([]),
  // AI cost tracking — populated per generation from OpenAI usage. Totals
  // across every model call (main draft + optional re-draft + voice critic).
  promptTokens: integer("prompt_tokens"),
  completionTokens: integer("completion_tokens"),
  costUsd: real("cost_usd"),
  costBreakdown: jsonb("cost_breakdown").$type<AiCostEntry[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_lga_cache_key").on(table.cacheKey),
  index("idx_lga_lesson").on(table.lessonId),
  index("idx_lga_created").on(table.createdAt),
]);
export type LessonGenerationAttribution = typeof lessonGenerationAttribution.$inferSelect;

// Per-model breakdown of the AI cost for a single generation. Stored as a
// jsonb array on both attribution tables so the admin panel can show exactly
// where the spend went (which model, which phase).
export type AiCostEntry = {
  model: string;
  phase: string; // e.g. "draft" | "redraft" | "voice-critic"
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
};

// Mirror of lesson attribution for the assignment generator. Lighter — assignments
// don't carry the same per-section richness, but we still track which voice
// snippets / canon entries fed each generation and the voice critic verdict.
export const assignmentGenerationAttribution = pgTable("assignment_generation_attribution", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id"),
  lessonId: varchar("lesson_id"),
  userId: varchar("user_id"),
  topic: text("topic"),
  subject: varchar("subject"),
  gradeLevel: varchar("grade_level"),
  assignmentType: varchar("assignment_type"),
  canonEntryIds: jsonb("canon_entry_ids").$type<string[]>().default([]),
  voiceSnippetIds: jsonb("voice_snippet_ids").$type<string[]>().default([]),
  voiceScore: integer("voice_score"),
  voiceCritique: jsonb("voice_critique").$type<{ tellsDetected?: string[]; notes?: string }>(),
  rewritten: boolean("rewritten").default(false),
  retrievalMode: varchar("retrieval_mode").default("legacy"),
  // Full GeneratedAssignment JSON cached for resilience fallback. When OpenAI
  // is unreachable, the most-recent matching attribution can be served as
  // "closest cached generation" instead of a typo-laden mock.
  generatedContent: jsonb("generated_content").$type<any>(),
  // AI cost tracking — see lessonGenerationAttribution for shape notes.
  promptTokens: integer("prompt_tokens"),
  completionTokens: integer("completion_tokens"),
  costUsd: real("cost_usd"),
  costBreakdown: jsonb("cost_breakdown").$type<AiCostEntry[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_aga_assignment").on(table.assignmentId),
  index("idx_aga_lesson").on(table.lessonId),
  index("idx_aga_topic_grade_type").on(table.topic, table.gradeLevel, table.assignmentType),
  index("idx_aga_created").on(table.createdAt),
]);
export type AssignmentGenerationAttribution = typeof assignmentGenerationAttribution.$inferSelect;

// Edit signals: diff between AI-generated lesson and what teacher actually saved.
// Per-section breakdown lets us learn which parts teachers consistently rewrite.
export const lessonEditSignals = pgTable("lesson_edit_signals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").notNull(),
  userId: varchar("user_id").notNull(),
  orgId: varchar("org_id"),
  sectionEdits: jsonb("section_edits").$type<Record<string, { before: string; after: string; charsChanged: number }>>(),
  totalCharsChanged: integer("total_chars_changed").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_les_lesson").on(table.lessonId),
  index("idx_les_user").on(table.userId),
]);
export type LessonEditSignal = typeof lessonEditSignals.$inferSelect;

// Org-level opt-out for AI training capture. Default-on for individuals (no row);
// orgs explicitly toggle via this table.
export const lessonAiOrgSettings = pgTable("lesson_ai_org_settings", {
  orgId: varchar("org_id").primaryKey(),
  editCaptureEnabled: boolean("edit_capture_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export type LessonAiOrgSettings = typeof lessonAiOrgSettings.$inferSelect;

// ============================================================================
// CURRICULUM DOCUMENT LIBRARY (Campus / Enterprise)
// Customer-uploaded scope-and-sequence, YAG, and pre-written lessons.
// ============================================================================

export const curriculumDocuments = pgTable("curriculum_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Ownership
  uploadedByUserId: varchar("uploaded_by_user_id").notNull(),
  uploaderRole: text("uploader_role").notNull(), // "admin" | "teacher"
  organizationId: varchar("organization_id"), // org scope; null = personal/teacher-only
  // Doc identity
  docType: text("doc_type").notNull(), // "scope_sequence" | "yag" | "lesson"
  title: text("title").notNull(),
  subject: text("subject"),
  gradeLevels: jsonb("grade_levels").$type<string[]>().default([]),
  country: text("country"),
  state: text("state"),
  schoolYear: text("school_year"),
  // File
  originalFilename: text("original_filename").notNull(),
  mimeType: text("mime_type"),
  fileSizeBytes: integer("file_size_bytes"),
  // Raw bytes of the original upload so sys-admins can compare the AI
  // extraction against the source in the moderation viewer (Task #6).
  // Capped at 20MB by the multer upload limit upstream.
  originalFileBytes: bytea("original_file_bytes"),
  // Extracted content (text only — no blob storage)
  extractedText: text("extracted_text"),
  // Extraction lifecycle
  extractionStatus: text("extraction_status").notNull().default("pending"),
  // "pending" | "processing" | "extracted" | "failed" | "skipped"
  extractionError: text("extraction_error"),
  standardsExtractedCount: integer("standards_extracted_count").default(0),
  // Linked artifacts created during extraction
  linkedLessonId: varchar("linked_lesson_id"), // for docType=lesson, pointer into the lessons table
  // Visibility / lifecycle
  isActive: boolean("is_active").notNull().default(true),
  // Sys-admin moderation lifecycle (Task #6). "pending" | "approved" | "rejected"
  moderationStatus: text("moderation_status").notNull().default("pending"),
  moderationReason: text("moderation_reason"),
  moderationReviewedByUserId: varchar("moderation_reviewed_by_user_id"),
  moderationReviewedAt: timestamp("moderation_reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_curriculum_docs_org").on(table.organizationId),
  index("idx_curriculum_docs_user").on(table.uploadedByUserId),
  index("idx_curriculum_docs_type_subject").on(table.docType, table.subject),
  index("idx_curriculum_docs_moderation").on(table.moderationStatus),
]);
export const insertCurriculumDocumentSchema = createInsertSchema(curriculumDocuments).omit({
  id: true, createdAt: true, updatedAt: true,
  extractionStatus: true, extractionError: true, standardsExtractedCount: true,
  extractedText: true, linkedLessonId: true,
  moderationStatus: true, moderationReason: true,
  moderationReviewedByUserId: true, moderationReviewedAt: true,
  originalFileBytes: true,
});
export type InsertCurriculumDocument = z.infer<typeof insertCurriculumDocumentSchema>;
export type CurriculumDocument = typeof curriculumDocuments.$inferSelect;

// Org-level admin toggle: do teachers in this org get to upload their own curriculum docs?
export const orgCurriculumSettings = pgTable("org_curriculum_settings", {
  organizationId: varchar("organization_id").primaryKey(),
  allowTeacherUploads: boolean("allow_teacher_uploads").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedByUserId: varchar("updated_by_user_id"),
});
export type OrgCurriculumSettings = typeof orgCurriculumSettings.$inferSelect;

// Per-(user, doc) opt-out of auto-aligned admin-uploaded YAG / scope-sequence.
// When present, the doc will not be injected into that user's lesson generations.
export const userCurriculumOptOuts = pgTable("user_curriculum_opt_outs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  curriculumDocumentId: varchar("curriculum_document_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_user_curriculum_opt_outs_user").on(table.userId),
]);
export type UserCurriculumOptOut = typeof userCurriculumOptOuts.$inferSelect;

// Org-private extracted standards. Result of AI extraction over a customer-uploaded doc.
// NEVER pooled into the public standards database — visible only to the uploading org.
export const orgExtractedStandards = pgTable("org_extracted_standards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  curriculumDocumentId: varchar("curriculum_document_id").notNull(),
  organizationId: varchar("organization_id").notNull(),
  code: text("code").notNull(),
  description: text("description").notNull(),
  subject: text("subject"),
  gradeLevel: text("grade_level"),
  strand: text("strand"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_org_extracted_std_doc").on(table.curriculumDocumentId),
  index("idx_org_extracted_std_org_subj_grade").on(table.organizationId, table.subject, table.gradeLevel),
]);
export type OrgExtractedStandard = typeof orgExtractedStandards.$inferSelect;

// ============================================================================
// PUBLIC STANDARDS INGESTION (Global Sweep — admin-approved)
// ============================================================================

// Customer-driven request for a country / state's standards to be ingested
export const standardsIngestionRequests = pgTable("standards_ingestion_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  country: text("country").notNull(),
  state: text("state"),
  requestedByUserId: varchar("requested_by_user_id").notNull(),
  requesterRole: text("requester_role").notNull(),
  requesterOrgId: varchar("requester_org_id"),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  // "pending" | "approved" | "in_progress" | "completed" | "rejected"
  assignedToUserId: varchar("assigned_to_user_id"),
  reviewedByUserId: varchar("reviewed_by_user_id"),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_standards_ing_req_country").on(table.country, table.state),
  index("idx_standards_ing_req_status").on(table.status),
]);
export type StandardsIngestionRequest = typeof standardsIngestionRequests.$inferSelect;

// Per-country source registry — what the annual sweep / on-demand sync targets.
// Seeded with 8 well-documented countries; system_admin can add more.
export const standardsSourceRegistry = pgTable("standards_source_registry", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  country: text("country").notNull(),
  state: text("state"),
  sourceName: text("source_name").notNull(), // e.g. "DepEd K-12"
  sourceUrl: text("source_url").notNull(),
  sourceType: text("source_type").notNull().default("html"), // "html" | "pdf"
  subject: text("subject"),
  gradeLevels: jsonb("grade_levels").$type<string[]>().default([]),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  lastSyncedAt: timestamp("last_synced_at"),
  lastSyncStatus: text("last_sync_status"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_standards_src_country").on(table.country, table.state),
]);
export type StandardsSourceRegistry = typeof standardsSourceRegistry.$inferSelect;

// Pending public standards extracted from a sync run; system_admin approves before they go live
export const pendingPublicStandards = pgTable("pending_public_standards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ingestionRequestId: varchar("ingestion_request_id"),
  sourceRegistryId: varchar("source_registry_id"),
  syncRunId: varchar("sync_run_id"),
  country: text("country").notNull(),
  state: text("state"),
  subject: text("subject"),
  gradeLevel: text("grade_level"),
  code: text("code"),
  description: text("description").notNull(),
  strand: text("strand"),
  sourceUrl: text("source_url"),
  confidenceScore: integer("confidence_score").default(0), // 0-100
  status: text("status").notNull().default("pending_review"),
  // "pending_review" | "approved" | "rejected"
  reviewedByUserId: varchar("reviewed_by_user_id"),
  reviewedAt: timestamp("reviewed_at"),
  publishedStandardId: varchar("published_standard_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_pending_pub_std_status").on(table.status),
  index("idx_pending_pub_std_country").on(table.country, table.state),
  index("idx_pending_pub_std_run").on(table.syncRunId),
]);
export type PendingPublicStandard = typeof pendingPublicStandards.$inferSelect;

// Drift tracker: every time the standards-catalog runtime cascade falls back
// past the live DB into the static curriculum file (or all the way to the
// generic international subject list), we log a row here. The annual July 1
// cleanup pass aggregates the last 12 months and surfaces the top countries
// in the admin dashboard so ingestion effort can be prioritized by actual
// teacher demand — not guesswork.
export const standardsFallbackMisses = pgTable("standards_fallback_misses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  country: text("country").notNull(),
  state: text("state"),
  subject: text("subject"),
  gradeLevel: text("grade_level"),
  // "static-curated-v1"   — served from the static curriculum file
  // "international-generic" — served from the universal last-resort subject list
  // "no-data"             — nothing in DB or static; user saw an empty result
  fallbackKind: text("fallback_kind").notNull(),
  userId: varchar("user_id"), // null for guest traffic
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_standards_fb_country").on(table.country, table.state),
  index("idx_standards_fb_created").on(table.createdAt),
  // Composite for the admin "coverage gaps" dashboard query — groups by
  // (country, state, subject) and filters by createdAt for the trailing
  // 12-month window. Without this, the dashboard scans the whole table.
  index("idx_standards_fb_gap").on(
    table.country,
    table.state,
    table.subject,
    table.createdAt,
  ),
]);
export type StandardsFallbackMiss = typeof standardsFallbackMisses.$inferSelect;

// One row per sync run for audit / annual sweep tracking
export const publicStandardsSyncRuns = pgTable("public_standards_sync_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  triggerType: text("trigger_type").notNull(), // "manual" | "request" | "annual_sweep"
  triggeredByUserId: varchar("triggered_by_user_id"),
  ingestionRequestId: varchar("ingestion_request_id"),
  country: text("country"),
  state: text("state"),
  status: text("status").notNull().default("running"),
  // "running" | "completed" | "failed"
  sourcesAttempted: integer("sources_attempted").default(0),
  sourcesSucceeded: integer("sources_succeeded").default(0),
  pendingCreated: integer("pending_created").default(0),
  // Number of AI-suggested standards that failed the verbatim-in-source
  // string check and were dropped before reaching the pending review queue.
  // Surfaced in the admin dashboard so admins can see how much hallucination
  // pressure each source produces.
  verbatimRejected: integer("verbatim_rejected").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  // Used by `hasCleanupRunThisYear` (annual cleanup year-lock) and by the
  // admin "Sync history" tab which lists most recent runs per trigger.
  index("idx_pssr_trigger_started").on(table.triggerType, table.startedAt),
]);
export type PublicStandardsSyncRun = typeof publicStandardsSyncRuns.$inferSelect;

// ============================================================================
// INGESTION AUDIT LOG (Task #6: Moderation tooling)
// One row per state transition on a moderation target (pending standard set
// or curriculum doc). Powers the audit-trail panel in the moderation queue.
// ============================================================================
export const ingestionAuditLog = pgTable("ingestion_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // "pending_standard" | "curriculum_doc"
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  // "created" | "edited" | "approved" | "rejected" | "reactivated"
  action: text("action").notNull(),
  actorUserId: varchar("actor_user_id"),
  reason: text("reason"),
  // Snapshot of fields that changed; freeform JSON.
  details: jsonb("details").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ingestion_audit_entity").on(table.entityType, table.entityId),
  index("idx_ingestion_audit_created").on(table.createdAt),
]);
export type IngestionAuditLog = typeof ingestionAuditLog.$inferSelect;

// Curriculum doc moderation state. Added in Task #6 so system admins can
// approve/reject AI-extracted curriculum docs in the moderation queue.
// Note: the column is added in-place via db:push; existing rows default to
// `pending` so admins can backfill review.
// (See `curriculumDocuments` table above — these are the supported values
// for the `moderationStatus` field.)
export const CURRICULUM_DOC_MODERATION_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;
export type CurriculumDocModerationStatus =
  typeof CURRICULUM_DOC_MODERATION_STATUSES[number];

// ─── Teacher Standards Quality-of-Life (Task #7) ──────────────────────────────
//
// Two narrow per-user tables that back the favorites star, the "Recently used"
// row in the standards picker, and the "Standards I've used" dashboard widget.
// Both are keyed by (userId, country, state, subject, code) so the picker can
// efficiently query the slice for the current cascade selection without
// scanning every code a teacher has ever touched.
//
// The favorite rows snapshot the human-readable description + source tier at
// time of starring so the pinned list keeps rendering even if the underlying
// catalog row is later edited or retired.
export const teacherStandardsFavorites = pgTable(
  "teacher_standards_favorites",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    country: text("country").notNull(),
    state: text("state").notNull(),
    subject: text("subject").notNull(),
    code: text("code").notNull(),
    description: text("description").notNull(),
    gradeLevel: text("grade_level"),
    standardsName: text("standards_name"),
    jurisdictionName: text("jurisdiction_name"),
    source: text("source"),
    sourceUrl: text("source_url"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("uniq_teacher_fav_code").on(
      table.userId,
      table.country,
      table.state,
      table.subject,
      table.code,
    ),
    index("idx_teacher_fav_user").on(table.userId),
  ],
);

export const insertTeacherStandardFavoriteSchema = createInsertSchema(
  teacherStandardsFavorites,
).omit({ id: true, createdAt: true });
export type InsertTeacherStandardFavorite = z.infer<
  typeof insertTeacherStandardFavoriteSchema
>;
export type TeacherStandardFavorite = typeof teacherStandardsFavorites.$inferSelect;

// One row per (code × lesson/assignment) usage. Derives both the picker's
// "Recently used" row (dedup by code, take the 10 most recent) and the
// dashboard "Standards I've used" widget (group by code, count + max(usedAt),
// link back to originating lesson/assignment ids).
export const teacherStandardsUsage = pgTable(
  "teacher_standards_usage",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    country: text("country").notNull(),
    state: text("state").notNull(),
    subject: text("subject").notNull(),
    code: text("code").notNull(),
    description: text("description").notNull(),
    gradeLevel: text("grade_level"),
    standardsName: text("standards_name"),
    source: text("source"),
    sourceUrl: text("source_url"),
    lessonId: varchar("lesson_id"),
    assignmentId: varchar("assignment_id"),
    usedAt: timestamp("used_at").defaultNow(),
  },
  (table) => [
    index("idx_teacher_usage_user_code").on(
      table.userId,
      table.country,
      table.state,
      table.subject,
      table.code,
    ),
    index("idx_teacher_usage_user_recent").on(table.userId, table.usedAt),
  ],
);

export const insertTeacherStandardsUsageSchema = createInsertSchema(
  teacherStandardsUsage,
).omit({ id: true, usedAt: true });
export type InsertTeacherStandardsUsage = z.infer<
  typeof insertTeacherStandardsUsageSchema
>;
export type TeacherStandardsUsage = typeof teacherStandardsUsage.$inferSelect;

// ============================================================================
// STANDARDS OBSERVABILITY (Task #8: digests + in-app notifications)
// One row per admin event. The in-app bell reads from here; the weekly digest
// summarizes the same underlying activity tables (ingestion requests / sync
// runs / fallback misses) into an email and also reuses these notifications
// for the "unread since last digest" rollup.
// ============================================================================
export const NOTIFICATION_KINDS = [
  "ingestion_request_submitted",
  "sync_run_failed",
  "verbatim_rejection_spike",
  "pending_standards_ready",
  "manual_standards_uploaded",
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const adminNotifications = pgTable(
  "admin_notifications",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    kind: text("kind").notNull().$type<NotificationKind>(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    link: text("link"),
    relatedEntityId: varchar("related_entity_id"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_admin_notif_user_unread").on(table.userId, table.isRead, table.createdAt),
  ],
);
export const insertAdminNotificationSchema = createInsertSchema(adminNotifications).omit({
  id: true,
  createdAt: true,
  isRead: true,
});
export type InsertAdminNotification = z.infer<typeof insertAdminNotificationSchema>;
export type AdminNotification = typeof adminNotifications.$inferSelect;

// Append-only audit of every weekly digest we've assembled. Persisting the
// rendered subject + body gives admins a paper trail when the real outbound
// transport (SMTP / SendGrid / etc.) is not configured in this environment.
export const standardsDigestLog = pgTable("standards_digest_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  email: text("email"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  // "sent" | "skipped_opted_out" | "logged_no_transport" | "failed"
  status: text("status").notNull(),
  errorMessage: text("error_message"),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
export type StandardsDigestLog = typeof standardsDigestLog.$inferSelect;

// Task #12 — daily moderation-queue backlog alert log. Append-only paper trail
// of every backlog digest we've assembled, with the backlog snapshot at send
// time. `periodDate` (YYYY-MM-DD UTC) gives us per-day idempotency so the
// daily cron never double-sends across process restarts or multi-tick races.
export const moderationBacklogDigestLog = pgTable("moderation_backlog_digest_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  email: text("email"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  // "sent" | "logged_no_transport" | "failed"
  status: text("status").notNull(),
  errorMessage: text("error_message"),
  // Backlog snapshot captured when the alert fired.
  totalPending: integer("total_pending").notNull(),
  periodDate: text("period_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
export type ModerationBacklogDigestLog = typeof moderationBacklogDigestLog.$inferSelect;

// Pre-billing reminder send log — append-only paper trail + idempotency for the
// trial-ending and annual-renewal notices. `kind` + `refId` (free-trial id or
// Stripe subscription id) + `periodKey` (YYYY-MM-DD of the target end date)
// uniquely identify one reminder so the daily scheduler never double-sends
// across restarts or multi-tick races.
export const billingReminderLog = pgTable(
  "billing_reminder_log",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    kind: text("kind").notNull(), // "trial_ending" | "renewal"
    refId: varchar("ref_id").notNull(),
    periodKey: text("period_key").notNull(),
    userId: varchar("user_id"),
    email: text("email"),
    subject: text("subject").notNull(),
    status: text("status").notNull(), // EmailSendStatus
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    uniqReminder: uniqueIndex("billing_reminder_unique").on(t.kind, t.refId, t.periodKey),
  }),
);
export type BillingReminderLog = typeof billingReminderLog.$inferSelect;

// Email-based one-time codes for second-factor verification. Used both for
// login-time 2FA (educators-and-up) and as an alternative to authenticator-app
// step-up. The plaintext code is never stored — only a SHA-256 hash. Codes are
// short-lived, single-use, and attempt-capped to resist guessing.
export const emailOtpCodes = pgTable(
  "email_otp_codes",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    codeHash: text("code_hash").notNull(),
    purpose: text("purpose").notNull().default("mfa"), // "mfa" | "login"
    expiresAt: timestamp("expires_at").notNull(),
    consumedAt: timestamp("consumed_at"),
    attempts: integer("attempts").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    byUser: index("email_otp_user_idx").on(t.userId),
  }),
);
export const insertEmailOtpCodeSchema = createInsertSchema(emailOtpCodes).omit({
  id: true,
  createdAt: true,
});
export type InsertEmailOtpCode = z.infer<typeof insertEmailOtpCodeSchema>;
export type EmailOtpCode = typeof emailOtpCodes.$inferSelect;

// ============================================================================
// TEAM HUB (Internal HR + Operations) — "Project Pulse"
// ----------------------------------------------------------------------------
// An internal-only HR/operations layer for LYS's own staff. This is kept
// DELIBERATELY SEPARATE from the platform login role hierarchy
// (student → system_admin in shared/models/auth.ts). A person's *job role*
// here (e.g. "Chief Marketing Officer") is org/HR metadata, not an app
// permission. Access to these surfaces is gated to staff/admins in the routes.
// Designed to start MANUAL and later be populated by HubSpot / Google Workspace
// (see `source` / `hubspotId` / `googleId` provenance columns).
// ============================================================================

// The 38-role company directory. Roles are flexible: they can be added,
// adapted, or archived (status="archived") without deleting history. Seeded
// from the company role directory but editable at runtime, so seeded rows are
// marked isSeed=true and given stable slug ids so `reportsToId` resolves.
export const hrRoles = pgTable(
  "hr_roles",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    title: text("title").notNull(),
    department: text("department").notNull(), // org section, e.g. "Executive & Administrative Leadership"
    horizon: text("horizon").notNull().default("active"), // "active" | "near_future" | "future"
    employmentType: text("employment_type").notNull().default("Full-time"), // e.g. "Full-time (W-2)", "Contractor (1099)", "Intern"
    reportsToId: varchar("reports_to_id"), // -> hr_roles.id (nullable for the top of the chart)
    summary: text("summary").notNull().default(""), // Executive Summary
    bkdBe: text("bkd_be").notNull().default(""), // BE-KNOW-DO framework
    bkdKnow: text("bkd_know").notNull().default(""),
    bkdDo: text("bkd_do").notNull().default(""),
    kpis: jsonb("kpis").notNull().default(sql`'[]'::jsonb`).$type<{ name: string; target?: string }[]>(),
    sops: jsonb("sops").notNull().default(sql`'{}'::jsonb`).$type<{
      daily: string[];
      weekly: string[];
      monthly: string[];
      semester: string[];
      yearly: string[];
    }>(),
    tools: jsonb("tools").notNull().default(sql`'[]'::jsonb`).$type<string[]>(),
    evaluationChecklist: jsonb("evaluation_checklist").notNull().default(sql`'[]'::jsonb`).$type<string[]>(),
    // Optional per-role onboarding template; when empty, onboarding tasks are
    // auto-derived from the role's tools + first SOP duties.
    onboardingTemplate: jsonb("onboarding_template").notNull().default(sql`'[]'::jsonb`).$type<
      { phase: string; category: string; title: string; description?: string; dueOffsetDays: number }[]
    >(),
    status: text("status").notNull().default("active"), // "active" | "archived"
    sortOrder: integer("sort_order").notNull().default(0),
    isSeed: boolean("is_seed").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    byDept: index("hr_roles_department_idx").on(t.department),
    byStatus: index("hr_roles_status_idx").on(t.status),
  }),
);
export const insertHrRoleSchema = createInsertSchema(hrRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertHrRole = z.infer<typeof insertHrRoleSchema>;
export type HrRole = typeof hrRoles.$inferSelect;

// Internal team members (employees). Optionally linked to a platform `users`
// account (userId) so a logged-in staffer can see their own focused view.
export const employees = pgTable(
  "employees",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id"), // -> users.id (nullable; set when they have an app login)
    name: text("name").notNull(),
    email: text("email").notNull(),
    roleId: varchar("role_id").notNull(), // -> hr_roles.id
    managerId: varchar("manager_id"), // -> employees.id (actual reporting person)
    startDate: timestamp("start_date"),
    status: text("status").notNull().default("onboarding"), // "onboarding" | "active" | "offboarding" | "inactive"
    employmentType: text("employment_type"),
    source: text("source").notNull().default("manual"), // "manual" | "hubspot" | "google_workspace"
    hubspotId: text("hubspot_id"),
    googleId: text("google_id"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    byRole: index("employees_role_idx").on(t.roleId),
    byManager: index("employees_manager_idx").on(t.managerId),
    byUser: index("employees_user_idx").on(t.userId),
  }),
);
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

// Per-employee onboarding tasks, auto-generated from their role on creation
// but fully editable afterward.
export const hrOnboardingTasks = pgTable(
  "hr_onboarding_tasks",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    employeeId: varchar("employee_id").notNull(), // -> employees.id
    title: text("title").notNull(),
    description: text("description"),
    phase: text("phase").notNull().default("Week 1"), // e.g. "Week 1: Orientation"
    category: text("category").notNull().default("General"), // "Accounts & Access" | "BE-KNOW-DO" | "Tools" | "First Deliverables"
    status: text("status").notNull().default("todo"), // "todo" | "in_progress" | "done"
    dueOffsetDays: integer("due_offset_days").notNull().default(0), // days after start date
    sortOrder: integer("sort_order").notNull().default(0),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    byEmployee: index("hr_onboarding_employee_idx").on(t.employeeId),
  }),
);
export const insertHrOnboardingTaskSchema = createInsertSchema(hrOnboardingTasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});
export type InsertHrOnboardingTask = z.infer<typeof insertHrOnboardingTaskSchema>;
export type HrOnboardingTask = typeof hrOnboardingTasks.$inferSelect;

// Team Hub membership approval. Holding the `staff` platform role is NOT
// enough to enter Team Hub — a user must also have an approved row here.
// Only site_admin / system_admin may approve or deny. Existing staff-role
// holders are grandfathered at boot (source="grandfathered").
export const staffAccessRequests = pgTable(
  "staff_access_requests",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().unique(),
    status: text("status").notNull().default("pending"), // "pending" | "approved" | "denied"
    message: text("message"), // optional note from the requester
    source: text("source").notNull().default("request"), // "request" | "grandfathered" | "admin_grant"
    requestedAt: timestamp("requested_at").defaultNow(),
    decidedById: varchar("decided_by_id"), // -> users.id (approving/denying admin)
    decidedAt: timestamp("decided_at"),
    // Set when approval elevated the user's platform role to `staff`; used to
    // restore their previous role if membership is later revoked.
    priorRole: text("prior_role"),
  },
  (t) => ({
    byStatus: index("staff_access_requests_status_idx").on(t.status),
  }),
);
export const insertStaffAccessRequestSchema = createInsertSchema(staffAccessRequests).omit({
  id: true,
  status: true,
  source: true,
  requestedAt: true,
  decidedById: true,
  decidedAt: true,
});
export type InsertStaffAccessRequest = z.infer<typeof insertStaffAccessRequestSchema>;
export type StaffAccessRequest = typeof staffAccessRequests.$inferSelect;
