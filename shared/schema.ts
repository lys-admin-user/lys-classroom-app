import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
});

export type Career = z.infer<typeof careerSchema>;

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
    })).min(1, "At least one standard code is required"),
  }),
  duration: z.string().optional().default("45 minutes"),
  lessonPart: z.string().optional(),
});

export type GenerateLessonRequest = z.infer<typeof generateLessonRequestSchema>;
