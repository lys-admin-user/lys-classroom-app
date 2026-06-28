import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
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
  Settings as SettingsIcon,
  type LucideIcon,
} from "lucide-react";

interface QuickLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface RoleConfig {
  greeting: string;
  subtitle: string;
  links: QuickLink[];
}

// Role-aware home band. Each staff/parent role lands on the same "/" home but
// sees a tailored greeting + the shortcuts that matter most to them. Students
// have their own dedicated dashboard, so they are not handled here.
function configForRole(role: string | undefined): RoleConfig {
  switch (role) {
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
        subtitle: "Your tools and resources, ready when you are.",
        links: [
          { label: "AI Lesson Planner", href: "/lesson-generator", icon: Sparkles },
          { label: "My Lessons", href: "/my-lessons", icon: BookOpen },
          { label: "Assignments", href: "/assignments", icon: ClipboardList },
          { label: "Resources", href: "/resources", icon: Library },
          { label: "Collaboration", href: "/collaboration", icon: Users },
          { label: "Analytics", href: "/analytics", icon: BarChart3 },
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

export function RoleQuickStart({ role }: { role: string | undefined }) {
  const { greeting, subtitle, links } = configForRole(role);

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 pt-8"
      data-testid="role-quick-start"
    >
      <div className="mb-4">
        <h2 className="font-oswald text-2xl sm:text-3xl text-foreground" data-testid="text-role-greeting">
          {greeting}
        </h2>
        <p className="font-roboto text-muted-foreground">{subtitle}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card
                className="hover-elevate active-elevate-2 cursor-pointer h-full"
                data-testid={`quick-link-${link.href.replace(/\//g, "-")}`}
              >
                <CardContent className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                  <Icon className="h-6 w-6 text-lys-red" />
                  <span className="font-oswald text-sm leading-tight">{link.label}</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
