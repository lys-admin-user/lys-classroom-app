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
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "My Journey", url: "/my-journey", icon: Compass, requiresAuth: true },
    ],
  },
  {
    label: "BE - Self Discovery",
    colorClass: "text-lys-red",
    items: [
      { title: "Self Discovery", url: "/self-discovery", icon: Heart },
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
    ],
  },
  {
    label: "DO - Take Action",
    colorClass: "text-lys-teal",
    items: [
      { title: "Action Plans", url: "/action-plans", icon: Target, requiresAuth: true },
      { title: "Assignments", url: "/assignments", icon: ClipboardList, requiresAuth: true, roles: ["educator", "campus_admin"] },
    ],
  },
  {
    label: "Educator Tools",
    roles: ["educator", "campus_admin"],
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
    roles: ["educator", "campus_admin"],
    items: [
      { title: "Analytics", url: "/analytics", icon: BarChart3, requiresAuth: true },
      { title: "Educator Influence", url: "/educator-influence", icon: Award, requiresAuth: true },
      { title: "Professional Dev", url: "/professional-development", icon: TrendingUp, requiresAuth: true },
    ],
  },
  {
    label: "Student Management",
    roles: ["educator", "campus_admin"],
    items: [
      { title: "Parent Portal", url: "/parent-portal", icon: Users, requiresAuth: true },
    ],
  },
  {
    label: "Administration",
    roles: ["campus_admin"],
    items: [
      { title: "Campus Admin", url: "/admin", icon: Shield, requiresAuth: true },
      { title: "Standards Admin", url: "/admin/standards", icon: Database, requiresAuth: true },
      { title: "System Admin", url: "/system-admin", icon: Settings, requiresAuth: true },
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
    if (group.roles) {
      if (!isAuthenticated) return false;
      return group.roles.includes(userRole);
    }
    return true;
  };

  const shouldShowItem = (item: NavItem) => {
    if (item.requiresAuth && !isAuthenticated) return false;
    if (item.roles) {
      return item.roles.includes(userRole);
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
                          <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
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
