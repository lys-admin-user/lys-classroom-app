import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useViewAs } from "@/hooks/use-view-as";
import { ROLE_HIERARCHY, type UserRole } from "@shared/models/auth";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  useSidebar,
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
  HelpCircle,
  Wand2,
  KeyRound,
  type LucideIcon,
} from "lucide-react";

export function hasMinRole(userRole: string, minRole: UserRole): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as UserRole] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[minRole] ?? 0;
  return userLevel >= requiredLevel;
}

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  minRole?: UserRole;
  exactRole?: UserRole;
  requiresAuth?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
  minRole?: UserRole;
  exactRole?: UserRole;
  colorClass?: string;
  // Student-facing groups (Be-Know-Do). For educators+ these are moved below the
  // educator tools and collapsed by default so educators aren't scrolling past
  // student-only items — while still available for "I do / you do / we do"
  // modeling and the optional student view.
  studentFocused?: boolean;
}

export const navigationGroups: NavGroup[] = [
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
    studentFocused: true,
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
    colorClass: "text-[hsl(45,93%,38%)]",
    studentFocused: true,
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
    studentFocused: true,
    items: [
      { title: "Action Plans", url: "/action-plans", icon: Target, requiresAuth: true },
      { title: "Campus Activities", url: "/campus-activities", icon: Trophy, requiresAuth: true },
      { title: "Assignments", url: "/assignments", icon: ClipboardList, requiresAuth: true, exactRole: "homeschool_parent" },
    ],
  },
  {
    label: "Homeschool Tools",
    exactRole: "homeschool_parent",
    colorClass: "text-lys-teal",
    items: [
      { title: "AI Lesson Generator", url: "/lesson-generator", icon: Sparkles, requiresAuth: true },
      { title: "My Lessons", url: "/my-lessons", icon: BookOpen, requiresAuth: true },
      { title: "Curriculum Planning", url: "/curriculum-planning", icon: Map, requiresAuth: true },
      { title: "Gradebook", url: "/gradebook", icon: ClipboardList, requiresAuth: true },
      { title: "Assessments", url: "/assessments", icon: FileText, requiresAuth: true },
      { title: "Collaboration", url: "/collaboration", icon: Share2, requiresAuth: true },
      { title: "SIS Integration", url: "/sis-integration", icon: Link2, requiresAuth: true },
      { title: "Community Library", url: "/resource-library", icon: Folder, requiresAuth: true },
    ],
  },
  {
    label: "Educator Tools",
    minRole: "educator",
    items: [
      { title: "AI Lesson Generator", url: "/lesson-generator", icon: Sparkles, requiresAuth: true },
      { title: "AI Assignment Generator", url: "/assignments", icon: Wand2, requiresAuth: true },
      { title: "My Lessons", url: "/my-lessons", icon: BookOpen, requiresAuth: true },
      { title: "Curriculum Planning", url: "/curriculum-planning", icon: Map, requiresAuth: true },
      { title: "Assessments", url: "/assessments", icon: FileText, requiresAuth: true },
      { title: "Gradebook", url: "/gradebook", icon: ClipboardList, requiresAuth: true },
      { title: "Collaboration", url: "/collaboration", icon: Share2, requiresAuth: true },
      { title: "Community Library", url: "/resource-library", icon: Folder, requiresAuth: true },
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
      { title: "Self Assessment", url: "/professional-development?tab=bkd-assessment", icon: Heart, requiresAuth: true, minRole: "educator" as UserRole },
    ],
  },
  {
    label: "Students",
    minRole: "educator",
    items: [
      { title: "Classroom", url: "/classroom", icon: School, requiresAuth: true },
      { title: "Parent Portal", url: "/parent-portal", icon: Users, requiresAuth: true },
    ],
  },
  {
    label: "My Campus",
    minRole: "campus_admin",
    items: [
      { title: "Campus Admin", url: "/admin", icon: Shield, requiresAuth: true },
      { title: "Standards", url: "/admin/standards", icon: Database, requiresAuth: true },
      { title: "Enterprise SSO", url: "/sso-admin", icon: KeyRound, requiresAuth: true },
    ],
  },
  {
    label: "My District / Network",
    minRole: "district_admin",
    items: [
      { title: "District / Network Admin", url: "/district-admin", icon: Presentation, requiresAuth: true },
      { title: "Campuses", url: "/district-admin/campuses", icon: School, requiresAuth: true },
    ],
  },
  {
    label: "System Administration",
    minRole: "site_admin",
    items: [
      { title: "System Dashboard", url: "/system-admin", icon: Settings, requiresAuth: true },
      { title: "Manage Users", url: "/system-admin/users", icon: Users, requiresAuth: true },
      { title: "Standards Ingestion", url: "/admin/standards-ingestion", icon: BookOpen, requiresAuth: true },
      { title: "Standards Catalog", url: "/admin/standards", icon: Library, requiresAuth: true },
      { title: "Dev Docs", url: "/dev-docs", icon: FileText, requiresAuth: true, minRole: "site_admin" },
    ],
  },
];

function SidebarNavGroup({
  group,
  visibleItems,
  isActiveRoute,
  pendingCount,
  defaultOpen,
  isLast,
}: {
  group: NavGroup;
  visibleItems: NavItem[];
  isActiveRoute: (url: string) => boolean;
  pendingCount: number;
  defaultOpen: boolean;
  isLast: boolean;
}) {
  const { state } = useSidebar();
  const iconMode = state === "collapsed";
  const storageKey = `lys:nav-group:${group.label}`;

  const [userOpen, setUserOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return defaultOpen;
    const saved = window.localStorage.getItem(storageKey);
    return saved === null ? defaultOpen : saved === "true";
  });

  const handleOpenChange = (open: boolean) => {
    setUserOpen(open);
    try {
      window.localStorage.setItem(storageKey, String(open));
    } catch {
      /* ignore storage failures */
    }
  };

  // In icon (collapsed) mode group labels are hidden and items render as icons,
  // so always show the items there regardless of the collapse preference.
  const open = iconMode ? true : userOpen;

  return (
    <SidebarGroup>
      <Collapsible open={open} onOpenChange={handleOpenChange}>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel
            className={`group/label flex items-center justify-between cursor-pointer text-[10px] uppercase tracking-widest font-semibold ${group.colorClass ?? ""}`}
            data-testid={`nav-group-toggle-${group.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`}
          >
            <span>{group.label}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 opacity-60 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
              strokeWidth={2}
            />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
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
                      className="rounded-lg data-[active=true]:bg-lys-red/10 data-[active=true]:text-lys-red data-[active=true]:font-medium"
                    >
                      <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}>
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                        <span>{item.title}</span>
                        {item.title === "System Dashboard" && pendingCount > 0 && (
                          <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0" data-testid="badge-pending-rss-count">
                            {pendingCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
      {!isLast && <SidebarSeparator className="my-2" />}
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { viewAsStudent } = useViewAs();
  const actualRole = user?.role || "student";
  // When an educator+ turns on "student view", navigation is gated as if they
  // were a student. This never changes real permissions — only what's shown.
  const isEducatorPlus = hasMinRole(actualRole, "educator");
  const userRole = viewAsStudent && isEducatorPlus ? "student" : actualRole;

  const { data: pendingCountData } = useQuery<{ count: number }>({
    queryKey: ['/api/admin/rss-content/pending-count'],
    enabled: isAuthenticated && hasMinRole(userRole, 'site_admin'),
  });
  const pendingCount = pendingCountData?.count ?? 0;

  const isActiveRoute = (url: string) => {
    const path = url.split("?")[0];
    if (path === "/") return location === "/";
    return location.startsWith(path);
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

  // Build the visible groups, then (for educators+ not in student view) float
  // educator/admin tools above the student Be-Know-Do groups so the most-used
  // items are reachable without scrolling.
  const reorderForEducator =
    hasMinRole(userRole, "educator") && !(viewAsStudent && isEducatorPlus);

  const visibleGroups = navigationGroups.filter(
    (group) => shouldShowGroup(group) && group.items.some(shouldShowItem),
  );

  const orderedGroups = reorderForEducator
    ? [
        ...visibleGroups.filter((g) => g.label === "Overview"),
        ...visibleGroups.filter((g) => g.label !== "Overview" && !g.studentFocused),
        ...visibleGroups.filter((g) => g.label !== "Overview" && g.studentFocused),
      ]
    : visibleGroups;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3">
        <Link href="/" className="flex items-center gap-2.5 px-1 py-1" data-testid="link-home-brand">
          <div className="h-9 w-9 shrink-0 bg-lys-red rounded-xl flex items-center justify-center -rotate-6 shadow-sm">
            <span className="text-white font-marker text-lg leading-none">L</span>
          </div>
          <div className="leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-marker text-xl text-lys-red tracking-wider">LYS</span>
            <p className="font-oswald text-[10px] text-muted-foreground tracking-wide mt-1">
              Laddering Your Success
            </p>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        {orderedGroups.map((group, groupIndex) => (
          <SidebarNavGroup
            key={group.label}
            group={group}
            visibleItems={group.items.filter(shouldShowItem)}
            isActiveRoute={isActiveRoute}
            pendingCount={pendingCount}
            // Educators get the student Be-Know-Do groups collapsed by default so
            // their own tools sit up top; everyone else sees groups expanded.
            defaultOpen={!(reorderForEducator && group.studentFocused)}
            isLast={groupIndex === orderedGroups.length - 1}
          />
        ))}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem key="footer-settings">
            <SidebarMenuButton asChild tooltip="Settings" className="rounded-lg">
              <Link href="/settings" data-testid="nav-settings">
                <Settings className="h-4 w-4" strokeWidth={1.75} />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem key="footer-pricing">
            <SidebarMenuButton asChild tooltip="Plans & Pricing" className="rounded-lg">
              <Link href="/pricing" data-testid="nav-pricing">
                <CreditCard className="h-4 w-4" strokeWidth={1.75} />
                <span>Plans & Pricing</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem key="footer-help">
            <SidebarMenuButton asChild tooltip="Help Desk" className="rounded-lg">
              <Link href="/help" data-testid="nav-help-desk">
                <HelpCircle className="h-4 w-4" strokeWidth={1.75} />
                <span>Help Desk</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
