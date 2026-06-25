import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useViewAs } from "@/hooks/use-view-as";
import { ROLE_HIERARCHY, type UserRole } from "@shared/models/auth";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sidebar, useSidebar } from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Compass,
  Heart,
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
  Settings2,
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
  UserPlus,
  HelpCircle,
  Wand2,
  KeyRound,
  Home,
  Layers,
  ChevronRight,
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
  // Icon shown for this group's category button on the rail.
  icon?: LucideIcon;
  // Student-facing groups (Be-Know-Do). For educators+ these are moved below the
  // educator tools so educators aren't scrolling past student-only items — while
  // still available for "I do / you do / we do" modeling and the student view.
  studentFocused?: boolean;
}

export const navigationGroups: NavGroup[] = [
  {
    label: "Overview",
    icon: LayoutDashboard,
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
    icon: Home,
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
    icon: BookOpen,
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
    icon: BarChart3,
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
    icon: Users,
    items: [
      { title: "Classroom", url: "/classroom", icon: School, requiresAuth: true },
      { title: "Parent Portal", url: "/parent-portal", icon: Users, requiresAuth: true },
    ],
  },
  {
    label: "My Campus",
    minRole: "campus_admin",
    icon: Shield,
    items: [
      { title: "Campus Admin", url: "/admin", icon: Shield, requiresAuth: true },
      { title: "Standards", url: "/admin/standards", icon: Database, requiresAuth: true },
      { title: "Enterprise SSO", url: "/sso-admin", icon: KeyRound, requiresAuth: true },
    ],
  },
  {
    label: "My District / Network",
    minRole: "district_admin",
    icon: Presentation,
    items: [
      { title: "District / Network Admin", url: "/district-admin", icon: Presentation, requiresAuth: true },
      { title: "Campuses", url: "/district-admin/campuses", icon: School, requiresAuth: true },
    ],
  },
  {
    label: "System Administration",
    minRole: "site_admin",
    icon: Settings2,
    items: [
      { title: "System Dashboard", url: "/system-admin", icon: Settings, requiresAuth: true },
      { title: "Manage Users", url: "/system-admin/users", icon: Users, requiresAuth: true },
      { title: "Standards Ingestion", url: "/admin/standards-ingestion", icon: BookOpen, requiresAuth: true },
      { title: "Standards Catalog", url: "/admin/standards", icon: Library, requiresAuth: true },
      { title: "Dev Docs", url: "/dev-docs", icon: FileText, requiresAuth: true, minRole: "site_admin" },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  student: "Student",
  homeschool_parent: "Homeschool Parent",
  educator: "Educator",
  staff: "Staff",
  campus_admin: "Campus Admin",
  district_admin: "District Admin",
  site_admin: "Site Admin",
  system_admin: "System Admin",
};

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// A rail entry: either a single nav group, or the combined Be-Know-Do bucket.
interface RailCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  groups: NavGroup[];
  isBKD?: boolean;
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { viewAsStudent } = useViewAs();
  const { state, isMobile, setOpenMobile, setOpen } = useSidebar();

  const actualRole = user?.role || "student";
  // When an educator+ turns on "student view", navigation is gated as if they
  // were a student. This never changes real permissions — only what's shown.
  const isEducatorPlus = hasMinRole(actualRole, "educator");
  const userRole = viewAsStudent && isEducatorPlus ? "student" : actualRole;

  // The flyout is hidden when the sidebar is collapsed to the icon rail (desktop
  // header toggle). On mobile the whole thing lives in a sheet, so always show it.
  const showFlyout = isMobile || state === "expanded";

  // Admin tiers get the focused charcoal rail; everyone else gets the warm light one.
  const isDark = hasMinRole(userRole, "campus_admin");

  const { data: pendingCountData } = useQuery<{ count: number }>({
    queryKey: ["/api/admin/rss-content/pending-count"],
    enabled: isAuthenticated && hasMinRole(userRole, "site_admin"),
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
    if (item.exactRole) return userRole === item.exactRole;
    if (item.minRole) return hasMinRole(userRole, item.minRole);
    return true;
  };

  const visibleGroups = navigationGroups.filter(
    (group) => shouldShowGroup(group) && group.items.some(shouldShowItem),
  );

  // Build rail categories: the three Be-Know-Do groups collapse into one rail
  // entry (color-coded sections in the flyout); every other group is its own.
  const studentFocusedGroups = visibleGroups.filter((g) => g.studentFocused);
  const overview = visibleGroups.find((g) => g.label === "Overview");
  const otherGroups = visibleGroups.filter(
    (g) => !g.studentFocused && g.label !== "Overview",
  );

  const bkdCategory: RailCategory | null = studentFocusedGroups.length
    ? { id: "bkd", label: "Be · Know · Do", icon: Layers, groups: studentFocusedGroups, isBKD: true }
    : null;

  const toCategory = (g: NavGroup): RailCategory => ({
    id: g.label,
    label: g.label,
    icon: g.icon ?? LayoutDashboard,
    groups: [g],
  });

  // Educators+ (not previewing as a student) get their tools first and the
  // student Be-Know-Do bucket at the bottom; everyone else sees it up top.
  const reorderForEducator =
    hasMinRole(userRole, "educator") && !(viewAsStudent && isEducatorPlus);

  const categories: RailCategory[] = [];
  if (overview) categories.push(toCategory(overview));
  if (reorderForEducator) {
    categories.push(...otherGroups.map(toCategory));
    if (bkdCategory) categories.push(bkdCategory);
  } else {
    if (bkdCategory) categories.push(bkdCategory);
    categories.push(...otherGroups.map(toCategory));
  }

  // Which rail category's flyout is open. Defaults to the one matching the route,
  // but a rail click can preview another category without navigating.
  const routeCategoryId =
    categories.find((cat) =>
      cat.groups.some((g) => g.items.filter(shouldShowItem).some((it) => isActiveRoute(it.url))),
    )?.id ?? categories[0]?.id;

  const [activeCat, setActiveCat] = useState<string | undefined>(routeCategoryId);
  const categoryKey = categories.map((c) => c.id).join("|");

  // Follow the route when it changes.
  useEffect(() => {
    setActiveCat(routeCategoryId);
  }, [routeCategoryId]);

  // If a role change removed the active category, fall back to the first one.
  useEffect(() => {
    setActiveCat((prev) =>
      prev && categoryKey.split("|").includes(prev) ? prev : categoryKey.split("|")[0],
    );
  }, [categoryKey]);

  const activeCategory =
    categories.find((c) => c.id === activeCat) ?? categories[0];

  const navClass = isDark
    ? "bg-[#0B1220] border-r border-white/5 shadow-[2px_0_18px_rgba(0,0,0,0.35)]"
    : "bg-white border-r border-slate-200/80 shadow-[2px_0_12px_rgba(0,0,0,0.02)]";
  const railBtnActive = isDark
    ? "bg-white/10 text-white border border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.25)]"
    : "bg-lys-yellow/15 text-slate-800 border border-lys-yellow/30 shadow-[0_2px_8px_rgba(0,0,0,0.03)]";
  const railBtnIdle = isDark
    ? "text-slate-400 hover:bg-white/10 hover:text-white border border-transparent hover:scale-105 active:scale-95"
    : "text-slate-400 hover:bg-slate-100 hover:text-slate-700 border border-transparent hover:scale-105 active:scale-95";
  const activeIconColor = isDark ? "text-lys-yellow" : "text-[hsl(45,93%,38%)]";
  const tooltipClass =
    "absolute left-[calc(100%+12px)] px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-md opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-200 whitespace-nowrap z-50 shadow-lg border border-slate-700";

  // When collapsed to the rail (desktop), a category click can't reveal its
  // flyout (it's unmounted), so expand the sidebar first; otherwise just preview.
  const handleCategoryClick = (id: string) => {
    setActiveCat(id);
    if (!isMobile && state === "collapsed") setOpen(true);
  };

  const footerActions = [
    { icon: Settings, label: "Settings", url: "/settings" },
    { icon: CreditCard, label: "Plans & Pricing", url: "/pricing" },
    { icon: HelpCircle, label: "Help Desk", url: "/help" },
  ];

  const displayName =
    user?.firstName || user?.lastName
      ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
      : user?.email ?? "Account";
  const initials =
    ((user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "")).toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";
  const roleLabel = ROLE_LABELS[actualRole] ?? "Member";

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = isActiveRoute(item.url);
    const showBadge = item.title === "System Dashboard" && pendingCount > 0;
    return (
      <Link
        key={`${item.title}-${item.url}`}
        href={item.url}
        onClick={() => isMobile && setOpenMobile(false)}
        className={`group/item w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] transition-all duration-200 ${
          isActive
            ? "bg-lys-yellow/15 text-slate-900 border border-lys-yellow/30 shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
        }`}
        data-testid={`nav-${slug(item.title)}`}
      >
        <Icon
          className={`w-[18px] h-[18px] stroke-[1.75] shrink-0 ${
            isActive ? "text-[hsl(45,93%,38%)]" : "text-slate-400 group-hover/item:text-slate-600"
          }`}
        />
        <span className={isActive ? "font-bold tracking-wide" : "font-semibold tracking-wide"}>
          {item.title}
        </span>
        {showBadge && (
          <Badge
            variant="destructive"
            className="ml-auto text-xs px-1.5 py-0"
            data-testid="badge-pending-rss-count"
          >
            {pendingCount}
          </Badge>
        )}
        {isActive && !showBadge && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-lys-yellow shadow-[0_0_4px_rgba(250,204,21,0.6)]" />
        )}
      </Link>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0 [&_[data-sidebar=sidebar]]:!bg-transparent">
      <div className="flex h-full w-full">
        {/* ICON RAIL */}
        <nav
          className={`w-[72px] shrink-0 h-full flex flex-col items-center py-4 ${navClass}`}
          data-testid="sidebar-rail"
        >
          <Link
            href="/"
            className="h-9 w-9 mb-6 shrink-0 rounded-xl bg-lys-red shadow-sm flex items-center justify-center -rotate-6 hover:rotate-0 transition-transform duration-300"
            data-testid="link-home-brand"
          >
            <span className="text-white font-marker text-lg leading-none">L</span>
          </Link>

          <div className="flex-1 w-full px-3 flex flex-col gap-1.5 overflow-y-auto no-scrollbar">
            {categories.map((cat) => {
              const isActive = cat.id === activeCat;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryClick(cat.id)}
                  aria-label={cat.label}
                  aria-current={isActive ? "true" : undefined}
                  title={cat.label}
                  className={`relative group flex items-center justify-center w-full aspect-square rounded-xl transition-colors duration-300 ${
                    isActive ? railBtnActive : railBtnIdle
                  }`}
                  data-testid={`rail-${slug(cat.label)}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="rail-active-indicator"
                      className="absolute -left-3 top-1/2 -translate-y-1/2 w-[4px] h-[22px] bg-lys-yellow rounded-r-full shadow-[1px_0_8px_rgba(250,204,21,0.5)]"
                      transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    />
                  )}
                  <Icon
                    className={`w-[22px] h-[22px] stroke-[1.75] transition-transform duration-300 ${
                      isActive ? `scale-110 ${activeIconColor}` : ""
                    }`}
                  />
                  <span className={tooltipClass}>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="w-full px-3 flex flex-col gap-1.5 pt-2">
            {footerActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.url}
                  href={action.url}
                  onClick={() => isMobile && setOpenMobile(false)}
                  aria-label={action.label}
                  title={action.label}
                  className={`relative group flex items-center justify-center w-full aspect-square rounded-xl transition-colors duration-300 ${railBtnIdle}`}
                  data-testid={`rail-${slug(action.label)}`}
                >
                  <Icon className="w-5 h-5 stroke-[1.75]" />
                  <span className={tooltipClass}>{action.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* CATEGORY FLYOUT */}
        {showFlyout && (
          <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden bg-white border-r border-slate-200/80 shadow-[2px_0_12px_rgba(0,0,0,0.03)]">
            <div className="h-[72px] shrink-0 flex items-center px-5 border-b border-slate-100 bg-slate-50/50 relative">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[hsl(var(--lys-yellow))] to-transparent" />
              <Link href="/" className="leading-none" data-testid="link-home-wordmark">
                <span className="font-marker text-xl text-lys-red tracking-wider">LYS</span>
                <p className="font-oswald text-[10px] text-muted-foreground tracking-wide mt-1">
                  Laddering Your Success
                </p>
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-4">
              {activeCategory?.isBKD ? (
                activeCategory.groups.map((group) => {
                  const items = group.items.filter(shouldShowItem);
                  if (!items.length) return null;
                  return (
                    <div key={group.label} className="flex flex-col gap-1">
                      <h3
                        className={`text-[10px] font-extrabold uppercase tracking-widest px-3 mb-1 ${
                          group.colorClass ?? "text-slate-400"
                        }`}
                      >
                        {group.label}
                      </h3>
                      {items.map(renderItem)}
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col gap-1">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-widest px-3 mb-1 text-slate-400">
                    {activeCategory?.label}
                  </h3>
                  {activeCategory?.groups
                    .flatMap((g) => g.items.filter(shouldShowItem))
                    .map(renderItem)}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
              {isAuthenticated ? (
                <Link
                  href="/settings"
                  onClick={() => isMobile && setOpenMobile(false)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl border border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all duration-200"
                  data-testid="link-profile"
                >
                  <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm shrink-0">
                    <AvatarImage src={user?.profileImageUrl ?? undefined} alt={displayName} />
                    <AvatarFallback className="bg-lys-red/10 text-lys-red text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-bold text-slate-900 truncate" data-testid="text-profile-name">
                      {displayName}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium truncate" data-testid="text-profile-role">
                      {roleLabel}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-auto shrink-0" />
                </Link>
              ) : (
                <a
                  href="/api/login"
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-lys-red text-white text-[13px] font-bold hover:bg-lys-red/90 transition-colors"
                  data-testid="link-login"
                >
                  Sign in
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
