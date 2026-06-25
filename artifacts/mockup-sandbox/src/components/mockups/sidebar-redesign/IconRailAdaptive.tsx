import React, { useState, useEffect } from "react";
import "./_group.css";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Compass,
  Sparkles,
  Wand2,
  BookOpen,
  Map as MapIcon,
  FileText,
  ClipboardList,
  Share2,
  Folder,
  Link2,
  PenTool,
  BarChart3,
  Award,
  TrendingUp,
  Heart,
  School,
  Users,
  Briefcase,
  Library,
  GraduationCap,
  UserPlus,
  Target,
  Trophy,
  UserCircle,
  Milestone,
  Settings,
  HelpCircle,
  CreditCard,
  Layers,
  Search,
  Bell,
  ChevronDown,
  Shield,
  Database,
  KeyRound,
  Presentation,
  Home as HomeIcon,
} from "lucide-react";

type RoleKey =
  | "Student"
  | "Homeschool Parent"
  | "Educator"
  | "Campus Admin"
  | "District Admin";

type FlyoutItem = { icon: any; label: string };
type RailItem = { id: string; icon: any; label: string };

export function IconRailAdaptive() {
  const [activeRole, setActiveRole] = useState<RoleKey>("Educator");
  const [activeRail, setActiveRail] = useState("Home");
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const roles: RoleKey[] = [
    "Student",
    "Homeschool Parent",
    "Educator",
    "Campus Admin",
    "District Admin",
  ];

  const roleUsers: Record<RoleKey, { name: string; subtitle: string; img: string }> = {
    Student: { name: "Jordan Lee", subtitle: "8th Grade", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop" },
    "Homeschool Parent": { name: "Sam Carter", subtitle: "Homeschool Parent", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop" },
    Educator: { name: "Elena Rivera", subtitle: "8th Grade Teacher", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop" },
    "Campus Admin": { name: "Elena Rivera", subtitle: "Campus Admin", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop" },
    "District Admin": { name: "Elena Rivera", subtitle: "District Admin", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop" },
  };

  const currentUser = roleUsers[activeRole];

  // Admin tiers get the serious charcoal rail; everyone else gets the warm light rail.
  const isDark = activeRole === "Campus Admin" || activeRole === "District Admin";

  // --- Role-aware rail (mirrors the real AppSidebar minRole / exactRole gating) ---
  const RAIL = {
    home: { id: "Home", icon: LayoutDashboard, label: "Overview" },
    bkd: { id: "BKD", icon: Layers, label: "Be · Know · Do" },
    homeschool: { id: "Homeschool", icon: HomeIcon, label: "Homeschool Tools" },
    teach: { id: "Teach", icon: BookOpen, label: "Educator Tools" },
    insights: { id: "Insights", icon: BarChart3, label: "Growth & Analytics" },
    students: { id: "Students", icon: Users, label: "Students" },
    campus: { id: "Campus", icon: Shield, label: "My Campus" },
    district: { id: "District", icon: Presentation, label: "My District / Network" },
  };

  const getRailItems = (role: RoleKey): RailItem[] => {
    switch (role) {
      case "Student":
        // BKD rides at the top, right under Overview.
        return [RAIL.home, RAIL.bkd];
      case "Homeschool Parent":
        return [RAIL.home, RAIL.bkd, RAIL.homeschool, RAIL.insights];
      case "Educator":
        return [RAIL.home, RAIL.teach, RAIL.insights, RAIL.students, RAIL.bkd];
      case "Campus Admin":
        return [RAIL.home, RAIL.teach, RAIL.insights, RAIL.students, RAIL.campus, RAIL.bkd];
      case "District Admin":
        return [RAIL.home, RAIL.teach, RAIL.insights, RAIL.students, RAIL.campus, RAIL.district, RAIL.bkd];
    }
  };

  const railItems = getRailItems(activeRole);

  // Keep the selected category valid when the role (and thus the rail) changes.
  useEffect(() => {
    if (!railItems.some((r) => r.id === activeRail)) {
      setActiveRail("Home");
    }
    setIsRoleDropdownOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRole]);

  const flyoutContent: Record<string, FlyoutItem[]> = {
    Home: [
      { icon: LayoutDashboard, label: "Dashboard" },
      { icon: Compass, label: "My Journey" },
    ],
    Teach: [
      { icon: Sparkles, label: "AI Lesson Generator" },
      { icon: Wand2, label: "AI Assignment Generator" },
      { icon: BookOpen, label: "My Lessons" },
      { icon: MapIcon, label: "Curriculum Planning" },
      { icon: FileText, label: "Assessments" },
      { icon: ClipboardList, label: "Gradebook" },
      { icon: Share2, label: "Collaboration" },
      { icon: Folder, label: "Community Library" },
      { icon: Link2, label: "SIS Integration" },
      { icon: PenTool, label: "Lesson Authoring" },
    ],
    Homeschool: [
      { icon: Sparkles, label: "AI Lesson Generator" },
      { icon: BookOpen, label: "My Lessons" },
      { icon: MapIcon, label: "Curriculum Planning" },
      { icon: ClipboardList, label: "Gradebook" },
      { icon: FileText, label: "Assessments" },
      { icon: Share2, label: "Collaboration" },
      { icon: Link2, label: "SIS Integration" },
      { icon: Folder, label: "Community Library" },
    ],
    Insights: [
      { icon: BarChart3, label: "Analytics" },
      { icon: Award, label: "Educator Influence" },
      { icon: TrendingUp, label: "Professional Dev" },
      // Self Assessment is educator+, so it's filtered out for Homeschool Parent below.
      { icon: Heart, label: "Self Assessment" },
    ],
    Students: [
      { icon: School, label: "Classroom" },
      { icon: Users, label: "Parent Portal" },
    ],
    Campus: [
      { icon: Shield, label: "Campus Admin" },
      { icon: Database, label: "Standards" },
      { icon: KeyRound, label: "Enterprise SSO" },
    ],
    District: [
      { icon: Presentation, label: "District / Network Admin" },
      { icon: School, label: "Campuses" },
    ],
  };

  // Role-aware item filtering within a category.
  const getFlyoutItems = (railId: string): FlyoutItem[] => {
    let items = flyoutContent[railId] ?? [];
    if (railId === "Insights" && activeRole === "Homeschool Parent") {
      items = items.filter((i) => i.label !== "Self Assessment");
    }
    return items;
  };

  // Be · Know · Do triad. Homeschool parents also get an "Assignments" action (exactRole).
  const bkdSections = [
    {
      group: "BE – Self Discovery",
      color: "text-lys-red",
      items: [
        { icon: Heart, label: "Self Discovery" },
        { icon: Sparkles, label: "Strengths Inventory" },
        { icon: PenTool, label: "Essay Builder" },
        { icon: UserCircle, label: "My Portfolio" },
        { icon: Milestone, label: "Milestones" },
      ],
    },
    {
      group: "KNOW – Career Paths",
      color: "text-lys-yellow",
      items: [
        { icon: Briefcase, label: "Career Explorer" },
        { icon: Library, label: "Resources" },
        { icon: GraduationCap, label: "Scholarship Planner" },
        { icon: UserPlus, label: "Mentor Connect" },
      ],
    },
    {
      group: "DO – Take Action",
      color: "text-lys-teal",
      items: [
        { icon: Target, label: "Action Plans" },
        { icon: Trophy, label: "Campus Activities" },
        ...(activeRole === "Homeschool Parent"
          ? [{ icon: ClipboardList, label: "Assignments" }]
          : []),
      ],
    },
  ];

  const activeRailItem = railItems.find((r) => r.id === activeRail) ?? railItems[0];
  const ActiveIcon = activeRailItem?.icon || LayoutDashboard;

  // --- Theme tokens (only the icon rail flips; the flyout stays light for readability) ---
  const navClass = isDark
    ? "bg-[#0B1220] border-r border-white/5 shadow-[2px_0_18px_rgba(0,0,0,0.35)]"
    : "bg-white border-r border-slate-200/80 shadow-[2px_0_12px_rgba(0,0,0,0.02)]";
  const railBtnActive = isDark
    ? "bg-white/10 text-white border border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.25)]"
    : "bg-[hsl(var(--lys-yellow))]/15 text-slate-800 border border-[hsl(var(--lys-yellow))]/30 shadow-[0_2px_8px_rgba(0,0,0,0.03)]";
  const railBtnIdle = isDark
    ? "text-slate-400 hover:bg-white/10 hover:text-white border border-transparent hover:scale-105 active:scale-95"
    : "text-slate-400 hover:bg-slate-100 hover:text-slate-700 border border-transparent hover:scale-105 active:scale-95";
  const activeIconColor = isDark ? "text-[hsl(var(--lys-yellow))]" : "text-[hsl(45,93%,38%)]";

  const flyoutItems = getFlyoutItems(activeRail);

  return (
    <div className="lys-scope min-h-screen w-full flex bg-[#F8FAFC] font-sans overflow-hidden">
      {/* 1. ICON RAIL (adapts: charcoal for admins, warm/light for everyone else) */}
      <nav className={`w-[72px] flex-shrink-0 flex flex-col items-center py-5 z-30 relative transition-colors duration-500 ${navClass}`}>
        {/* Logo — matches the current LYS design's mark (clean, centered, -rotate-6) */}
        <div className="h-9 w-9 mb-8 shrink-0 rounded-xl bg-[hsl(var(--lys-red))] shadow-sm flex items-center justify-center transform -rotate-6 cursor-pointer hover:rotate-0 transition-transform duration-300">
          <span className="text-white font-['Permanent_Marker'] text-lg leading-none">L</span>
        </div>

        {/* Top Rail Items */}
        <div className="flex flex-col gap-3 w-full px-3">
          {railItems.map((item) => {
            const isActive = activeRail === item.id;
            return (
              <motion.button
                layout
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                key={item.id}
                onClick={() => setActiveRail(item.id)}
                className={`relative group flex items-center justify-center w-full aspect-square rounded-xl transition-colors duration-300 ${isActive ? railBtnActive : railBtnIdle}`}
              >
                {isActive && (
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-[4px] h-[22px] bg-[hsl(var(--lys-yellow))] rounded-r-full shadow-[1px_0_8px_rgba(250,204,21,0.5)]" />
                )}
                <item.icon className={`w-[22px] h-[22px] stroke-[1.75] transition-transform duration-300 ${isActive ? `scale-110 ${activeIconColor}` : ""}`} />

                {/* Tooltip */}
                <div className="absolute left-[calc(100%+12px)] px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-md opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50 shadow-lg border border-slate-700">
                  {item.label}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-auto flex flex-col gap-3 w-full px-3">
          {[
            { icon: Settings, label: "Settings" },
            { icon: CreditCard, label: "Plans & Pricing" },
            { icon: HelpCircle, label: "Help Desk" },
          ].map((action, i) => (
            <button key={i} className={`relative group flex items-center justify-center w-full aspect-square rounded-xl transition-colors duration-300 ${railBtnIdle}`}>
              <action.icon className="w-5 h-5 stroke-[1.75]" />
              <div className="absolute left-[calc(100%+12px)] px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-md opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50 shadow-lg border border-slate-700">
                {action.label}
              </div>
            </button>
          ))}
        </div>
      </nav>

      {/* 2. SECONDARY FLYOUT (stays light for readability across both themes) */}
      <div className="w-[280px] flex-shrink-0 bg-white border-r border-slate-200/80 z-20 flex flex-col shadow-[2px_0_12px_rgba(0,0,0,0.03)] relative">
        {/* Flyout Header */}
        <div className="h-[72px] flex items-center gap-3 px-5 border-b border-slate-100 bg-slate-50/50 relative">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[hsl(var(--lys-yellow))] to-[hsl(var(--lys-yellow))]/20" />
          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--lys-yellow))]/15 border border-[hsl(var(--lys-yellow))]/30 flex items-center justify-center shadow-sm">
            <ActiveIcon className="w-[18px] h-[18px] stroke-[2] text-[hsl(45,93%,38%)]" />
          </div>
          <h2 className="text-[15px] font-bold text-slate-800 tracking-tight">{activeRailItem?.label}</h2>
        </div>

        {/* Flyout Scroll Area */}
        <div className="flex-1 overflow-y-auto px-3 py-3 custom-scrollbar">
          {activeRail !== "BKD" ? (
            <div className="flex flex-col gap-1">
              {flyoutItems.map((item, i) => {
                const isItemActive = i === 0;
                return (
                  <button
                    key={item.label}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] transition-all duration-200 group
                      ${isItemActive
                        ? "bg-[hsl(var(--lys-yellow))]/15 text-slate-900 shadow-sm border border-[hsl(var(--lys-yellow))]/30"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"}`}
                  >
                    <item.icon className={`w-[18px] h-[18px] stroke-[1.75] transition-colors ${isItemActive ? "text-[hsl(45,93%,38%)]" : "text-slate-400 group-hover:text-slate-600"}`} />
                    <span className={isItemActive ? "font-bold tracking-wide" : "font-semibold tracking-wide"}>{item.label}</span>
                    {isItemActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[hsl(var(--lys-yellow))] shadow-[0_0_4px_rgba(250,204,21,0.6)]" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-6 pt-1 pb-4">
              {bkdSections.map((section, sIdx) => (
                <div key={sIdx} className="flex flex-col gap-1.5">
                  <h3 className={`text-[10px] font-extrabold uppercase tracking-widest px-3 mb-1 ${section.color}`}>
                    {section.group}
                  </h3>
                  <div className="flex flex-col gap-1">
                    {section.items.map((item) => (
                      <button
                        key={item.label}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-[10px] text-[13px] text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 group border border-transparent"
                      >
                        <item.icon className="w-[18px] h-[18px] text-slate-400 stroke-[1.75] group-hover:text-slate-600 transition-colors" />
                        <span className="font-semibold tracking-wide">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Single user presence — also the quiet view switcher. In the real app a
            person has one role, so this lives in the account/settings menu here,
            not as a prominent global toggle. */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 mt-auto relative">
          {isRoleDropdownOpen && (
            <div className="absolute bottom-[calc(100%-4px)] left-4 right-4 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Preview as · demo
              </div>
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    setActiveRole(role);
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 mx-0 text-[13px] rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between
                    ${activeRole === role ? "font-bold text-[hsl(45,93%,38%)] bg-[hsl(var(--lys-yellow))]/10" : "font-medium text-slate-600"}`}
                >
                  {role}
                  {(role === "Campus Admin" || role === "District Admin") && (
                    <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">Dark</span>
                  )}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all duration-200 group text-left"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 ring-2 ring-white shadow-sm flex-shrink-0">
              <img src={currentUser.img} alt={currentUser.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-bold text-slate-900 truncate">{currentUser.name}</span>
              <span className="text-[11px] text-slate-500 font-medium truncate">{currentUser.subtitle}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 ml-auto transition-transform flex-shrink-0 ${isRoleDropdownOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* 3. MAIN CONTENT SHELL (greeked, quiet) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#F8FAFC]">
        {/* Top Bar (clean — view switching lives in the profile menu, not here) */}
        <header className="h-[72px] border-b border-slate-200/60 bg-white/70 backdrop-blur-md flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <div className="w-64 h-9 bg-slate-100 rounded-lg flex items-center px-3 border border-slate-200/60 transition-colors hover:bg-slate-100/80 cursor-text">
              <Search className="w-4 h-4 text-slate-400" />
              <div className="w-24 h-2 bg-slate-200 rounded-full ml-3" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors">
              <Bell className="w-4 h-4 text-slate-400" />
            </div>
            <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 ring-2 ring-white shadow-sm cursor-pointer">
              <img src={currentUser.img} alt={currentUser.name} className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* Dashboard Skeleton */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="w-48 h-8 bg-slate-200/80 rounded-md mb-2" />
                <div className="w-72 h-4 bg-slate-100 rounded-md" />
              </div>
              <div className="w-32 h-10 bg-slate-100 rounded-lg" />
            </div>

            <div className="grid grid-cols-3 gap-6 pt-4">
              {[1, 2, 3].map((card) => (
                <div key={card} className="h-32 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-[hsl(var(--lys-yellow))]/10 border border-[hsl(var(--lys-yellow))]/20" />
                  <div className="space-y-2.5">
                    <div className="w-24 h-2.5 bg-slate-100 rounded-full" />
                    <div className="w-16 h-6 bg-slate-200 rounded-md" />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 h-96 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="w-32 h-5 bg-slate-100 rounded-md mb-8" />
                <div className="h-56 w-full bg-slate-50 rounded-xl border border-slate-100/50" />
              </div>
              <div className="col-span-1 h-96 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="w-24 h-5 bg-slate-100 rounded-md mb-6" />
                <div className="space-y-5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[hsl(var(--lys-yellow))]/5 border border-slate-100" />
                      <div className="space-y-2.5 flex-1">
                        <div className="w-3/4 h-2 bg-slate-200 rounded-full" />
                        <div className="w-1/2 h-2 bg-slate-100 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 5px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
      `}</style>
    </div>
  );
}
