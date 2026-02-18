import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_HIERARCHY, type UserRole } from "@shared/models/auth";
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
  FileText,
  ClipboardList,
  Users,
  GraduationCap,
  Briefcase,
  Map,
  BarChart3,
  Award,
  Library,
  Share2,
  Settings,
  CreditCard,
  Database,
  Shield,
  School,
  Folder,
  UserCircle,
  TrendingUp,
  Milestone,
  Presentation,
  Link2,
  PenTool,
  Trophy,
  DollarSign,
  UserPlus,
} from "lucide-react";

function hasMinRole(userRole: string, minRole: UserRole): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as UserRole] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[minRole] ?? 0;
  return userLevel >= requiredLevel;
}

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  minRole?: UserRole;
  exactRole?: UserRole;
  requiresAuth?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  minRole?: UserRole;
  exactRole?: UserRole;
  colorClass?: string;
}

const navigationGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "My Journey", url: "/my-journey", icon: Compass, requiresAuth: true },
    ],
  },
  {
    label: "BE - Self Discovery",
    colorClass: "text-lys-red",
    items: [
      { title: "Self Discovery", url: "/self-discovery", icon: Heart },
      { title: "Strengths Inventory", url: "/strengths-inventory", icon: Sparkles, requiresAuth: true },
      { title: "Essay Builder", url: "/essay-builder", icon: PenTool, requiresAuth: true },
      { title: "My Portfolio", url: "/portfolio", icon: UserCircle, requiresAuth: true },
      { title: "Milestones", url: "/milestones", icon: Milestone, requiresAuth: true },
    ],
  },
  {
    label: "KNOW - Career Paths",
    colorClass: "text-lys-yellow",
    items: [
      { title: "Career Explorer", url: "/careers", icon: Briefcase },
      { title: "Resources", url: "/resources", icon: Library },
      { title: "Scholarship Planner", url: "/scholarship-planner", icon: GraduationCap, requiresAuth: true },
      { title: "Mentor Connect", url: "/mentor-connect", icon: UserPlus, requiresAuth: true },
    ],
  },
  {
    label: "DO - Take Action",
    colorClass: "text-lys-teal",
    items: [
      { title: "Action Plans", url: "/action-plans", icon: Target, requiresAuth: true },
      { title: "Campus Activities", url: "/campus-activities", icon: Trophy, requiresAuth: true },
      { title: "Assignments", url: "/assignments", icon: ClipboardList, requiresAuth: true, minRole: "homeschool_parent" },
    ],
  },
  {
    label: "Homeschool Tools",
    exactRole: "homeschool_parent",
    colorClass: "text-lys-teal",
    items: [
      { title: "AI Lesson Generator", url: "/lesson-generator", icon: Sparkles, requiresAuth: true },
      { title: "My Lessons", url: "/my-lessons", icon: BookOpen, requiresAuth: true },
      { title: "Scope & Sequence", url: "/scope-sequence", icon: Map, requiresAuth: true },
      { title: "Gradebook", url: "/gradebook", icon: ClipboardList, requiresAuth: true },
      { title: "Resource Library", url: "/resource-library", icon: Folder, requiresAuth: true },
    ],
  },
  {
    label: "Educator Tools",
    minRole: "educator",
    items: [
      { title: "AI Lesson Generator", url: "/lesson-generator", icon: Sparkles, requiresAuth: true },
      { title: "My Lessons", url: "/my-lessons", icon: BookOpen, requiresAuth: true },
      { title: "Assessments", url: "/assessments", icon: FileText, requiresAuth: true },
      { title: "Scope & Sequence", url: "/scope-sequence", icon: Map, requiresAuth: true },
      { title: "Classroom", url: "/classroom", icon: School, requiresAuth: true },
      { title: "Gradebook", url: "/gradebook", icon: ClipboardList, requiresAuth: true },
      { title: "Collaboration", url: "/collaboration", icon: Share2, requiresAuth: true },
      { title: "Resource Library", url: "/resource-library", icon: Folder, requiresAuth: true },
      { title: "SIS Integration", url: "/sis-integration", icon: Link2, requiresAuth: true },
      { title: "Lesson Authoring", url: "/lesson-authoring", icon: PenTool, requiresAuth: true },
    ],
  },
  {
    label: "Growth & Analytics",
    minRole: "homeschool_parent",
    items: [
      { title: "Analytics", url: "/analytics", icon: BarChart3, requiresAuth: true },
      { title: "Educator Influence", url: "/educator-influence", icon: Award, requiresAuth: true },
      { title: "Professional Dev", url: "/professional-development", icon: TrendingUp, requiresAuth: true },
    ],
  },
  {
    label: "Student Management",
    minRole: "homeschool_parent",
    items: [
      { title: "Parent Portal", url: "/parent-portal", icon: Users, requiresAuth: true },
    ],
  },
  {
    label: "My Campus",
    minRole: "campus_admin",
    items: [
      { title: "Campus Admin", url: "/admin", icon: Shield, requiresAuth: true },
      { title: "Standards", url: "/admin/standards", icon: Database, requiresAuth: true },
    ],
  },
  {
    label: "My District",
    minRole: "district_admin",
    items: [
      { title: "District Admin", url: "/district-admin", icon: Presentation, requiresAuth: true },
      { title: "Campuses", url: "/district-admin/campuses", icon: School, requiresAuth: true },
    ],
  },
  {
    label: "System Administration",
    minRole: "site_admin",
    items: [
      { title: "System Dashboard", url: "/system-admin", icon: Settings, requiresAuth: true },
      { title: "Manage Users", url: "/system-admin/users", icon: Users, requiresAuth: true },
    ],
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const userRole = user?.role || "student";

  const isActiveRoute = (url: string) => {
    if (url === "/") return location === "/";
    return location.startsWith(url);
  };

  const shouldShowGroup = (group: NavGroup) => {
    if (group.exactRole) {
      if (!isAuthenticated) return false;
      return userRole === group.exactRole;
    }
    if (group.minRole) {
      if (!isAuthenticated) return false;
      return hasMinRole(userRole, group.minRole);
    }
    return true;
  };

  const shouldShowItem = (item: NavItem) => {
    if (item.requiresAuth && !isAuthenticated) return false;
    if (item.exactRole) {
      return userRole === item.exactRole;
    }
    if (item.minRole) {
      return hasMinRole(userRole, item.minRole);
    }
    return true;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center">
            <span className="font-marker text-2xl text-lys-red">L</span>
            <div className="w-4 h-6 flex flex-col justify-center mx-0.5 group-data-[collapsible=icon]:hidden">
              <div className="w-3 h-0.5 bg-lys-yellow rounded-full mb-0.5"></div>
              <div className="w-3 h-0.5 bg-lys-yellow rounded-full mb-0.5"></div>
              <div className="w-3 h-0.5 bg-lys-yellow rounded-full"></div>
            </div>
            <span className="font-marker text-2xl text-lys-red group-data-[collapsible=icon]:hidden">S</span>
          </div>
          <span className="font-oswald text-sm text-muted-foreground font-medium group-data-[collapsible=icon]:hidden">
            Laddering Your Success
          </span>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        {navigationGroups.map((group, groupIndex) => {
          if (!shouldShowGroup(group)) return null;
          
          const visibleItems = group.items.filter(shouldShowItem);
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className={group.colorClass}>
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isActiveRoute(item.url);
                    return (
                      <SidebarMenuItem key={`${group.label}-${item.url}`}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                        >
                          <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}>
                            <Icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
              {groupIndex < navigationGroups.length - 1 && <SidebarSeparator className="my-2" />}
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem key="footer-settings">
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/settings" data-testid="nav-settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem key="footer-pricing">
            <SidebarMenuButton asChild tooltip="Plans & Pricing">
              <Link href="/pricing" data-testid="nav-pricing">
                <CreditCard className="h-4 w-4" />
                <span>Plans & Pricing</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
