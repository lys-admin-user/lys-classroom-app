import {
  Sparkles,
  BookOpen,
  CalendarRange,
  ClipboardList,
  GraduationCap,
  BarChart3,
  Users,
  Database,
  Library,
  Building2,
  ShieldCheck,
  Briefcase,
  Settings as SettingsIcon,
  Compass,
  Heart,
  Target,
  type LucideIcon,
} from "lucide-react";

/**
 * Persona layer — single source of truth for the persona-first UI.
 *
 * A persona is a presentation profile derived from the user's role. It decides:
 *  - which navigation groups are always visible vs tucked into "More"
 *  - the accent color identity (via the `data-persona` attribute + CSS vars)
 *  - the home-page greeting + quick links
 *
 * IMPORTANT: personas are UX only. They never grant or remove access — all
 * role gating still runs through minRole/exactRole checks (sidebar + palette)
 * and, authoritatively, on the server.
 */
export type Persona =
  | "student"
  | "homeschool"
  | "educator"
  | "school_admin"
  | "staff"
  | "platform_admin";

export function personaForRole(role: string | undefined | null): Persona {
  switch (role) {
    case "homeschool_parent":
      return "homeschool";
    case "educator":
      return "educator";
    case "staff":
      return "staff";
    case "campus_admin":
    case "district_admin":
      return "school_admin";
    case "site_admin":
    case "system_admin":
      return "platform_admin";
    case "student":
    default:
      return "student";
  }
}

export interface PersonaQuickLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface PersonaConfig {
  id: Persona;
  label: string;
  /**
   * Navigation group labels (from AppSidebar's navigationGroups) that stay
   * always visible for this persona, in display order. Any other group the
   * role can see is tucked into the collapsed "More" section instead.
   */
  primaryGroups: string[];
}

export const PERSONA_CONFIGS: Record<Persona, PersonaConfig> = {
  student: {
    id: "student",
    label: "Student",
    primaryGroups: [
      "Overview",
      "BE - Self Discovery",
      "KNOW - Career Paths",
      "DO - Take Action",
    ],
  },
  homeschool: {
    id: "homeschool",
    label: "Homeschool Parent",
    primaryGroups: ["Overview", "Homeschool Tools", "DO - Take Action"],
  },
  educator: {
    id: "educator",
    label: "Educator",
    primaryGroups: ["Overview", "Educator Tools", "Students"],
  },
  school_admin: {
    id: "school_admin",
    label: "School Admin",
    primaryGroups: [
      "Overview",
      "My Campus",
      "My District / Network",
      "Students",
      "Growth & Analytics",
    ],
  },
  staff: {
    id: "staff",
    label: "Internal Staff",
    primaryGroups: ["Overview", "Team Hub"],
  },
  platform_admin: {
    id: "platform_admin",
    label: "Platform Admin",
    primaryGroups: [
      "Overview",
      "System Administration",
      "My District / Network",
      "My Campus",
    ],
  },
};

export interface PersonaHomeConfig {
  greeting: string;
  subtitle: string;
  links: PersonaQuickLink[];
}

/**
 * Home-band config per role (absorbed from the old RoleQuickStart component).
 * Kept role-keyed (not persona-keyed) because sibling roles inside one persona
 * still deserve different shortcuts (campus vs district, site vs system).
 */
export function homeConfigForRole(role: string | undefined): PersonaHomeConfig {
  switch (role) {
    case "student":
      return {
        greeting: "Welcome back",
        subtitle: "Keep climbing — your journey is waiting.",
        links: [
          { label: "My Journey", href: "/my-journey", icon: Compass },
          { label: "Self Discovery", href: "/self-discovery", icon: Heart },
          { label: "Action Plans", href: "/action-plans", icon: Target },
          { label: "Careers", href: "/careers", icon: Briefcase },
          { label: "My Portfolio", href: "/portfolio", icon: GraduationCap },
          { label: "Resources", href: "/resources", icon: Library },
        ],
      };
    case "homeschool_parent":
      return {
        greeting: "Welcome back, teacher-parent",
        subtitle: "Everything you need to run your homeschool, in one place.",
        links: [
          { label: "AI Lesson Planner", href: "/lesson-generator", icon: Sparkles },
          { label: "My Lessons", href: "/my-lessons", icon: BookOpen },
          { label: "Assessments", href: "/assessments", icon: ClipboardList },
          { label: "Collaboration", href: "/collaboration", icon: Users },
          { label: "Records (SIS)", href: "/sis-integration", icon: Database },
          { label: "Resources", href: "/resources", icon: Library },
        ],
      };
    case "campus_admin":
      return {
        greeting: "Welcome back, admin",
        subtitle: "Manage your campus, curriculum, and team from here.",
        links: [
          { label: "Admin Dashboard", href: "/admin", icon: ShieldCheck },
          { label: "Analytics", href: "/analytics", icon: BarChart3 },
          { label: "Curriculum Planning", href: "/curriculum-planning", icon: CalendarRange },
          { label: "Standards", href: "/admin/standards", icon: ClipboardList },
          { label: "Resource Library", href: "/resource-library", icon: Library },
          { label: "Settings", href: "/settings", icon: SettingsIcon },
        ],
      };
    case "district_admin":
      return {
        greeting: "Welcome back, district leader",
        subtitle: "Oversee campuses, alignment, and district-wide data.",
        links: [
          { label: "District Dashboard", href: "/district-admin", icon: Building2 },
          { label: "Campuses", href: "/district-admin/campuses", icon: ShieldCheck },
          { label: "Analytics", href: "/analytics", icon: BarChart3 },
          { label: "Alignment", href: "/alignment-dashboard", icon: CalendarRange },
          { label: "Curriculum Planning", href: "/curriculum-planning", icon: ClipboardList },
          { label: "Settings", href: "/settings", icon: SettingsIcon },
        ],
      };
    case "site_admin":
      return {
        greeting: "Welcome back, site admin",
        subtitle: "Platform controls and organization management.",
        links: [
          { label: "Site Admin", href: "/admin", icon: Building2 },
          { label: "System Admin", href: "/system-admin", icon: ShieldCheck },
          { label: "Analytics", href: "/analytics", icon: BarChart3 },
          { label: "Standards", href: "/admin/standards", icon: ClipboardList },
          { label: "Resource Library", href: "/resource-library", icon: Library },
          { label: "Settings", href: "/settings", icon: SettingsIcon },
        ],
      };
    case "system_admin":
      return {
        greeting: "Welcome back, system admin",
        subtitle: "Platform controls and organization management.",
        links: [
          { label: "System Admin", href: "/system-admin", icon: ShieldCheck },
          { label: "Site Admin", href: "/admin", icon: Building2 },
          { label: "Analytics", href: "/analytics", icon: BarChart3 },
          { label: "Standards", href: "/admin/standards", icon: ClipboardList },
          { label: "Resource Library", href: "/resource-library", icon: Library },
          { label: "Settings", href: "/settings", icon: SettingsIcon },
        ],
      };
    case "staff":
      return {
        greeting: "Welcome back",
        subtitle: "Your team tools and resources, ready when you are.",
        links: [
          { label: "Team Hub", href: "/team", icon: Building2 },
          { label: "Role Directory", href: "/team/roles", icon: Briefcase },
          { label: "People", href: "/team/people", icon: Users },
          { label: "My Onboarding", href: "/team/onboarding", icon: ClipboardList },
          { label: "Resources", href: "/resources", icon: Library },
          { label: "Collaboration", href: "/collaboration", icon: Users },
        ],
      };
    case "educator":
    default:
      return {
        greeting: "Welcome back, educator",
        subtitle: "Pick up where you left off — your tools are ready.",
        links: [
          { label: "AI Lesson Planner", href: "/lesson-generator", icon: Sparkles },
          { label: "My Lessons", href: "/my-lessons", icon: BookOpen },
          { label: "Curriculum Planning", href: "/curriculum-planning", icon: CalendarRange },
          { label: "Assignments", href: "/assignments", icon: ClipboardList },
          { label: "Gradebook", href: "/gradebook", icon: GraduationCap },
          { label: "Analytics", href: "/analytics", icon: BarChart3 },
        ],
      };
  }
}
