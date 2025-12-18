import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User tiers for feature gating
// free: basic features with ads
// paid: full features, no ads
// campus: school/district license with admin features
// enterprise: full organizational access with analytics
export type UserTier = "free" | "paid" | "campus" | "enterprise";

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  tier: varchar("tier").default("free").$type<UserTier>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Educator Profile - stores preferences for paid/enterprise users
export const educatorProfiles = pgTable("educator_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  country: varchar("country"),
  state: varchar("state"),
  standardsName: varchar("standards_name"),
  schoolDistrict: varchar("school_district"),
  schoolName: varchar("school_name"),
  gradeLevels: jsonb("grade_levels").$type<string[]>().default([]),
  subjects: jsonb("subjects").$type<string[]>().default([]),
  preferredStandardCodes: jsonb("preferred_standard_codes").$type<{ code: string; description: string }[]>().default([]),
  onboardingCompleted: timestamp("onboarding_completed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type InsertEducatorProfile = typeof educatorProfiles.$inferInsert;
export type EducatorProfile = typeof educatorProfiles.$inferSelect;
