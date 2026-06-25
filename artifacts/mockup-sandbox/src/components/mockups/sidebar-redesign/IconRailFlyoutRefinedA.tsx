import React, { useState } from "react";
import "./_group.css";
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
  MoreVertical,
  LogOut,
  ChevronRight
} from "lucide-react";

export function IconRailFlyoutRefinedA() {
  const [activeRail, setActiveRail] = useState("Teach");

  const railItems = [
    { id: "Home", icon: LayoutDashboard, label: "Overview" },
    { id: "Teach", icon: BookOpen, label: "Educator Tools" },
    { id: "Insights", icon: BarChart3, label: "Growth & Analytics" },
    { id: "Students", icon: Users, label: "Students" },
    { id: "BKD", icon: Layers, label: "Be · Know · Do" },
  ];

  const flyoutContent = {
    Home: [
      { icon: LayoutDashboard, label: "Dashboard", active: true },
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
    Insights: [
      { icon: BarChart3, label: "Analytics" },
      { icon: Award, label: "Educator Influence" },
      { icon: TrendingUp, label: "Professional Dev" },
      { icon: Heart, label: "Self Assessment" },
    ],
    Students: [
      { icon: School, label: "Classroom" },
      { icon: Users, label: "Parent Portal" },
    ],
    BKD: [
      { group: "BE – Self Discovery", color: "text-lys-red", items: [
        { icon: Heart, label: "Self Discovery" },
        { icon: Sparkles, label: "Strengths Inventory" },
        { icon: PenTool, label: "Essay Builder" },
        { icon: UserCircle, label: "My Portfolio" },
        { icon: Milestone, label: "Milestones" },
      ]},
      { group: "KNOW – Career Paths", color: "text-lys-yellow", items: [
        { icon: Briefcase, label: "Career Explorer" },
        { icon: Library, label: "Resources" },
        { icon: GraduationCap, label: "Scholarship Planner" },
        { icon: UserPlus, label: "Mentor Connect" },
      ]},
      { group: "DO – Take Action", color: "text-lys-teal", items: [
        { icon: Target, label: "Action Plans" },
        { icon: Trophy, label: "Campus Activities" },
      ]}
    ]
  };

  const activeRailItem = railItems.find(r => r.id === activeRail);
  const ActiveIcon = activeRailItem?.icon || LayoutDashboard;

  return (
    <div className="lys-scope min-h-screen w-full flex bg-[#F8FAFC] font-sans overflow-hidden">
      {/* 1. ICON RAIL (Polished Teal) */}
      <nav className="w-[72px] flex-shrink-0 flex flex-col items-center py-5 bg-[hsl(var(--lys-teal))] text-white/70 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.08)] relative">
        {/* Logo */}
        <div className="w-11 h-11 mb-8 rounded-xl bg-[hsl(var(--lys-red))] shadow-[0_4px_12px_rgba(0,0,0,0.2)] flex items-center justify-center transform -rotate-3 cursor-pointer hover:rotate-0 hover:scale-105 transition-all duration-300">
          <span className="font-['Permanent_Marker'] text-white text-2xl translate-y-[2px] -translate-x-[1px]">L</span>
        </div>

        {/* Top Rail Items */}
        <div className="flex flex-col gap-3 w-full px-3">
          {railItems.map((item) => {
            const isActive = activeRail === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveRail(item.id)}
                className={`relative group flex items-center justify-center w-full aspect-square rounded-xl transition-all duration-300
                  ${isActive 
                    ? "bg-white/15 text-white shadow-[0_2px_10px_rgba(0,0,0,0.1)] ring-1 ring-white/10" 
                    : "hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95"
                  }`}
              >
                {isActive && (
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-[4px] h-[22px] bg-[hsl(var(--lys-yellow))] rounded-r-full shadow-[1px_0_8px_rgba(250,204,21,0.5)]" />
                )}
                <item.icon className={`w-[22px] h-[22px] stroke-[1.75] transition-transform duration-300 ${isActive ? "scale-110" : ""}`} />
                
                {/* Tooltip */}
                <div className="absolute left-[calc(100%+12px)] px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-md opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-slate-700">
                  {item.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-auto flex flex-col gap-3 w-full px-3">
          {[
            { icon: Settings, label: "Settings" },
            { icon: CreditCard, label: "Plans & Pricing" },
            { icon: HelpCircle, label: "Help Desk" }
          ].map((action, i) => (
            <button key={i} className="relative group flex items-center justify-center w-full aspect-square rounded-xl hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95 transition-all duration-300">
              <action.icon className="w-5 h-5 stroke-[1.75]" />
              <div className="absolute left-[calc(100%+12px)] px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-md opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-slate-700">
                {action.label}
              </div>
            </button>
          ))}
        </div>
      </nav>

      {/* 2. SECONDARY FLYOUT */}
      <div className="w-[280px] flex-shrink-0 bg-white border-r border-slate-200/80 z-20 flex flex-col shadow-[2px_0_12px_rgba(0,0,0,0.03)] relative">
        {/* Flyout Header */}
        <div className="h-[72px] flex items-center gap-3 px-5 border-b border-slate-100 bg-slate-50/50 backdrop-blur-sm relative">
          {/* Subtle accent hairline at the top of the flyout */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[hsl(var(--lys-teal))] to-[hsl(var(--lys-teal))/10]" />
          
          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--lys-teal))] text-white flex items-center justify-center shadow-sm">
             <ActiveIcon className="w-[18px] h-[18px] stroke-[2]" />
          </div>
          <h2 className="text-[15px] font-bold text-slate-800 tracking-tight">
            {activeRailItem?.label}
          </h2>
        </div>

        {/* Flyout Scroll Area */}
        <div className="flex-1 overflow-y-auto px-3 py-3 custom-scrollbar">
          {activeRail !== "BKD" ? (
            <div className="flex flex-col gap-1">
              {(flyoutContent[activeRail as keyof typeof flyoutContent] as Array<any>).map((item, i) => (
                <button
                  key={i}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] transition-all duration-200 group
                    ${item.active 
                      ? "bg-[hsl(var(--lys-teal))] text-white shadow-md shadow-[hsl(var(--lys-teal))]/10" 
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                >
                  <item.icon className={`w-[18px] h-[18px] stroke-[1.75] transition-colors
                    ${item.active ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`} />
                  <span className="font-semibold tracking-wide">{item.label}</span>
                  {item.active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[hsl(var(--lys-yellow))] shadow-[0_0_4px_rgba(250,204,21,0.6)]" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-6 pt-1 pb-4">
              {(flyoutContent.BKD as Array<any>).map((section, sIdx) => (
                <div key={sIdx} className="flex flex-col gap-1.5">
                  <h3 className={`text-[10px] font-extrabold uppercase tracking-widest px-3 mb-1 ${section.color}`}>
                    {section.group}
                  </h3>
                  <div className="flex flex-col gap-1">
                    {section.items.map((item: any, i: number) => (
                      <button
                        key={i}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-[10px] text-[13px] text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 group"
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

        {/* Role identifier in flyout bottom - Single User Presence */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 mt-auto">
          <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all duration-200 group text-left">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 ring-2 ring-white shadow-sm flex-shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop" 
                alt="Elena Rivera" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-bold text-slate-900 truncate">Elena Rivera</span>
              <span className="text-[11px] text-slate-500 font-medium truncate">8th Grade Teacher</span>
            </div>
            <MoreVertical className="w-4 h-4 text-slate-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </button>
        </div>
      </div>

      {/* 3. MAIN CONTENT SHELL (Greeked - kept quiet) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#F8FAFC]">
        {/* Top Bar Skeleton */}
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
            <div className="h-6 w-px bg-slate-200" />
            <div className="w-24 h-8 bg-[hsl(var(--lys-red))] rounded-lg opacity-20" />
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
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100" />
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
                  {[1,2,3,4].map(i => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100" />
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 5px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
