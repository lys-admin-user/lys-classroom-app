import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Compass,
  Heart,
  Brain,
  Target,
  Sparkles,
  BookOpen,
  ClipboardList,
  Users,
  GraduationCap,
  Briefcase,
  BarChart3,
  Award,
  Library,
  Settings,
  School,
  UserCircle,
  Milestone,
  Presentation,
  PenTool,
} from "lucide-react";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  requiresAuth?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  roles?: string[];
  colorClass?: string;
}

const navigationGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/embed/full/dashboard", icon: LayoutDashboard },
      { title: "My Journey", url: "/embed/full/my-journey", icon: Compass, requiresAuth: true },
    ],
  },
  {
    label: "BE - Self Discovery",
    colorClass: "text-lys-red",
    items: [
      { title: "Self Discovery", url: "/embed/full/self-discovery", icon: Heart },
      { title: "My Portfolio", url: "/embed/full/portfolio", icon: UserCircle, requiresAuth: true },
      { title: "Milestones", url: "/embed/full/milestones", icon: Milestone, requiresAuth: true },
    ],
  },
  {
    label: "KNOW - Career Exploration",
    colorClass: "text-lys-yellow",
    items: [
      { title: "Career Explorer", url: "/embed/full/careers", icon: Briefcase },
      { title: "Action Plans", url: "/embed/full/action-plans", icon: Target, requiresAuth: true },
    ],
  },
  {
    label: "DO - Teaching & Learning",
    colorClass: "text-lys-teal",
    items: [
      { title: "Lesson Generator", url: "/embed/full/lesson-generator", icon: Sparkles },
      { title: "My Lessons", url: "/embed/full/my-lessons", icon: BookOpen, requiresAuth: true },
      { title: "Assignments", url: "/embed/full/assignments", icon: ClipboardList, requiresAuth: true },
      { title: "Assessments", url: "/embed/full/assessments", icon: Brain, requiresAuth: true },
    ],
  },
  {
    label: "Classroom",
    items: [
      { title: "My Classes", url: "/embed/full/classroom", icon: Users, requiresAuth: true, roles: ["educator", "campus_admin"] },
      { title: "Gradebook", url: "/embed/full/gradebook", icon: GraduationCap, requiresAuth: true, roles: ["educator", "campus_admin"] },
      { title: "Scope & Sequence", url: "/embed/full/scope-sequence", icon: Library, requiresAuth: true, roles: ["educator", "campus_admin"] },
    ],
  },
  {
    label: "Resources",
    items: [
      { title: "Resource Library", url: "/embed/full/resource-library", icon: Library },
      { title: "Analytics", url: "/embed/full/analytics", icon: BarChart3, requiresAuth: true },
    ],
  },
  {
    label: "Professional",
    items: [
      { title: "Development", url: "/embed/full/professional-development", icon: Presentation, requiresAuth: true, roles: ["educator", "campus_admin"] },
      { title: "Educator Influence", url: "/embed/full/educator-influence", icon: Award, requiresAuth: true, roles: ["educator", "campus_admin"] },
    ],
  },
  {
    label: "For Parents",
    items: [
      { title: "Parent Portal", url: "/embed/full/parent-portal", icon: School },
    ],
  },
  {
    label: "Administration",
    roles: ["campus_admin", "site_admin", "system_admin"],
    items: [
      { title: "Site Admin", url: "/embed/full/admin", icon: Settings, roles: ["campus_admin", "site_admin"] },
      { title: "Lesson Authoring", url: "/embed/full/lesson-authoring", icon: PenTool, roles: ["campus_admin", "site_admin", "system_admin"] },
    ],
  },
];

export function EmbedSidebar() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const userRole = user?.role || "";

  const hasAccess = (item: NavItem) => {
    if (item.requiresAuth && !isAuthenticated) return false;
    if (item.roles && item.roles.length > 0 && !item.roles.includes(userRole)) return false;
    return true;
  };

  const hasGroupAccess = (group: NavGroup) => {
    if (group.roles && group.roles.length > 0 && !group.roles.includes(userRole)) return false;
    return group.items.some(hasAccess);
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lys-red text-white font-bold text-sm">
            LYS
          </div>
          <span className="font-heading text-lg font-semibold group-data-[collapsible=icon]:hidden">
            LYS
          </span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        {navigationGroups.map((group, groupIndex) => {
          if (!hasGroupAccess(group)) return null;
          const visibleItems = group.items.filter(hasAccess);
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={groupIndex}>
              <SidebarGroupLabel className={group.colorClass}>
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.url || (item.url === "/embed/full/dashboard" && location === "/embed/full")}
                        tooltip={item.title}
                      >
                        <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <SidebarSeparator />
        <div className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden text-center pt-2">
          Powered by LYS
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
