import React, { useState } from "react";
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
  UserCircle,
  Milestone,
  Briefcase,
  Library,
  GraduationCap,
  UserPlus,
  Target,
  Trophy,
  Settings,
  CreditCard,
  HelpCircle,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import "./_group.css";

// --- Data ---

const OVERVIEW_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Compass, label: "My Journey" },
];

const EDUCATOR_TOOLS_ITEMS = [
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
];

const GROWTH_ITEMS = [
  { icon: BarChart3, label: "Analytics" },
  { icon: Award, label: "Educator Influence" },
  { icon: TrendingUp, label: "Professional Dev" },
  { icon: Heart, label: "Self Assessment" },
];

const STUDENTS_ITEMS = [
  { icon: School, label: "Classroom" },
  { icon: Users, label: "Parent Portal" },
];

const PILLARS = [
  {
    id: "be",
    title: "BE",
    subtitle: "Self Discovery",
    colorClass: "lys-red",
    bgClass: "bg-[hsl(var(--lys-red)/0.04)]",
    borderClass: "border-[hsl(var(--lys-red)/0.2)]",
    hoverBgClass: "hover:bg-[hsl(var(--lys-red)/0.08)]",
    activeTextClass: "text-[hsl(var(--lys-red))]",
    items: [
      { icon: Heart, label: "Self Discovery" },
      { icon: Sparkles, label: "Strengths Inventory" },
      { icon: PenTool, label: "Essay Builder" },
      { icon: UserCircle, label: "My Portfolio" },
      { icon: Milestone, label: "Milestones" },
    ],
  },
  {
    id: "know",
    title: "KNOW",
    subtitle: "Career Paths",
    colorClass: "lys-yellow",
    bgClass: "bg-[hsl(var(--lys-yellow)/0.06)]",
    borderClass: "border-[hsl(var(--lys-yellow)/0.3)]",
    hoverBgClass: "hover:bg-[hsl(var(--lys-yellow)/0.15)]",
    activeTextClass: "text-[hsl(45_93%_38%)]", // Darker yellow for text
    items: [
      { icon: Briefcase, label: "Career Explorer" },
      { icon: Library, label: "Resources" },
      { icon: GraduationCap, label: "Scholarship Planner" },
      { icon: UserPlus, label: "Mentor Connect" },
    ],
  },
  {
    id: "do",
    title: "DO",
    subtitle: "Take Action",
    colorClass: "lys-teal",
    bgClass: "bg-[hsl(var(--lys-teal)/0.04)]",
    borderClass: "border-[hsl(var(--lys-teal)/0.2)]",
    hoverBgClass: "hover:bg-[hsl(var(--lys-teal)/0.08)]",
    activeTextClass: "text-[hsl(var(--lys-teal))]",
    items: [
      { icon: Target, label: "Action Plans" },
      { icon: Trophy, label: "Campus Activities" },
    ],
  },
];

// --- Components ---

function NavItem({
  icon: Icon,
  label,
  active = false,
  badge,
  className = "",
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  badge?: string;
  className?: string;
}) {
  return (
    <a
      href="#"
      className={`group flex items-center justify-between px-3 py-2 text-sm rounded-md transition-all duration-200 ${
        active
          ? "bg-[hsl(var(--lys-red)/0.08)] text-[hsl(var(--lys-red))] font-medium"
          : "text-muted-foreground hover:bg-black/5 hover:text-foreground"
      } ${className}`}
    >
      <div className="flex items-center gap-3">
        <Icon
          size={18}
          strokeWidth={active ? 2.5 : 2}
          className={
            active
              ? "text-[hsl(var(--lys-red))]"
              : "text-muted-foreground/70 group-hover:text-foreground/80 transition-colors"
          }
        />
        <span>{label}</span>
      </div>
      {badge && (
        <span className="text-[10px] uppercase tracking-wider font-semibold bg-black/5 text-muted-foreground px-1.5 py-0.5 rounded">
          {badge}
        </span>
      )}
    </a>
  );
}

function PillarSection({
  pillar,
  defaultExpanded = false,
}: {
  pillar: typeof PILLARS[0];
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={`mb-3 overflow-hidden rounded-xl border ${pillar.borderClass} ${pillar.bgClass} transition-colors duration-300`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-3 text-left transition-colors ${pillar.hoverBgClass}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white shadow-sm border ${pillar.borderClass}`}
          >
            <span
              className={`font-['Permanent_Marker'] text-lg leading-none mt-1 ${
                pillar.id === "be"
                  ? "text-[hsl(var(--lys-red))]"
                  : pillar.id === "know"
                  ? "text-[hsl(45_93%_45%)]"
                  : "text-[hsl(var(--lys-teal))]"
              }`}
            >
              {pillar.title.charAt(0)}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-['Permanent_Marker'] text-base tracking-wide text-foreground/90">
                {pillar.title}
              </span>
            </div>
            <div className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground/80 mt-0.5">
              {pillar.subtitle}
            </div>
          </div>
        </div>
        <ChevronRight
          size={16}
          className={`text-muted-foreground/50 transition-transform duration-300 ${
            expanded ? "rotate-90" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-2 pt-0 pl-12">
            {pillar.items.map((item, idx) => (
              <a
                key={idx}
                href="#"
                className={`group flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-muted-foreground hover:text-foreground ${pillar.hoverBgClass}`}
              >
                <item.icon size={16} strokeWidth={2} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BeKnowDoEditorial() {
  return (
    <div className="lys-scope min-h-screen bg-[#f7f7f8] flex font-sans text-foreground selection:bg-[hsl(var(--lys-red)/0.2)] selection:text-[hsl(var(--lys-red))]">
      {/* SIDEBAR - The Hero */}
      <aside className="w-[320px] h-screen sticky top-0 flex flex-col bg-[#fafafa] border-r border-border/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] overflow-hidden z-10">
        
        {/* Decorative Top Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[hsl(var(--lys-red))] via-[hsl(var(--lys-yellow))] to-[hsl(var(--lys-teal))] opacity-80" />

        {/* Header / Brand */}
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 bg-[hsl(var(--lys-red))] rounded-[10px] shadow-sm transform -rotate-3 transition-transform hover:rotate-0 duration-300">
              <span className="font-['Permanent_Marker'] text-white text-2xl leading-none mt-1 ml-0.5">
                L
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-['Permanent_Marker'] text-2xl tracking-wide leading-none text-foreground">
                LYS
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/70 mt-1">
                Laddering Your Success
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-8">
          
          {/* Section: Overview */}
          <div className="mb-8">
            <div className="px-3 mb-2 flex items-center gap-2">
              <div className="h-px bg-border/80 flex-1" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                Core
              </span>
              <div className="h-px bg-border/80 flex-1" />
            </div>
            <div className="space-y-0.5">
              {OVERVIEW_ITEMS.map((item, i) => (
                <NavItem key={i} {...item} />
              ))}
            </div>
          </div>

          {/* Section: Educator Tools */}
          <div className="mb-8">
            <div className="px-3 mb-3">
              <h3 className="text-xs font-semibold tracking-wide text-foreground/80 uppercase">
                Educator Tools
              </h3>
            </div>
            <div className="space-y-0.5 border-l-2 border-border/40 ml-4 pl-2">
              {EDUCATOR_TOOLS_ITEMS.map((item, i) => (
                <NavItem key={i} {...item} />
              ))}
            </div>
          </div>

          {/* Section: The Pillars (Be Know Do) */}
          <div className="mb-8 relative">
            <div className="px-3 mb-4">
              <h3 className="font-['Permanent_Marker'] text-lg text-foreground/90 tracking-wide">
                The Pillars
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Student development framework</p>
            </div>
            
            {/* The Ladder Line */}
            <div className="absolute left-[33px] top-[60px] bottom-4 w-px bg-gradient-to-b from-[hsl(var(--lys-red)/0.3)] via-[hsl(var(--lys-yellow)/0.3)] to-[hsl(var(--lys-teal)/0.3)] pointer-events-none hidden sm:block" />

            <div className="px-2 relative">
              <PillarSection pillar={PILLARS[0]} defaultExpanded={true} />
              <PillarSection pillar={PILLARS[1]} />
              <PillarSection pillar={PILLARS[2]} />
            </div>
          </div>

          {/* Section: Growth & Analytics */}
          <div className="mb-8">
            <div className="px-3 mb-3">
              <h3 className="text-xs font-semibold tracking-wide text-foreground/80 uppercase">
                Growth & Insights
              </h3>
            </div>
            <div className="space-y-0.5 border-l-2 border-border/40 ml-4 pl-2">
              {GROWTH_ITEMS.map((item, i) => (
                <NavItem key={i} {...item} />
              ))}
            </div>
          </div>

          {/* Section: Students */}
          <div className="mb-4">
            <div className="px-3 mb-3">
              <h3 className="text-xs font-semibold tracking-wide text-foreground/80 uppercase">
                Community
              </h3>
            </div>
            <div className="space-y-0.5 border-l-2 border-border/40 ml-4 pl-2">
              {STUDENTS_ITEMS.map((item, i) => (
                <NavItem key={i} {...item} />
              ))}
            </div>
          </div>

        </div>

        {/* Footer Area */}
        <div className="mt-auto p-4 bg-[#f4f4f5] border-t border-border/50">
          <div className="flex items-center gap-3 p-2 mb-3 bg-white rounded-lg border border-border shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[hsl(var(--lys-teal)/0.1)] text-[hsl(var(--lys-teal))] flex items-center justify-center font-bold text-sm">
              ER
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">Elena Rivera</p>
              <p className="text-[11px] text-muted-foreground truncate">Educator · 8th Grade</p>
            </div>
            <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-black/5 rounded-md transition-colors">
              <MoreVertical size={16} />
            </button>
          </div>

          <div className="flex items-center justify-around text-muted-foreground">
            <button className="p-2 hover:text-foreground hover:bg-black/5 rounded-md transition-colors" title="Settings">
              <Settings size={18} />
            </button>
            <button className="p-2 hover:text-foreground hover:bg-black/5 rounded-md transition-colors" title="Plans & Pricing">
              <CreditCard size={18} />
            </button>
            <button className="p-2 hover:text-foreground hover:bg-black/5 rounded-md transition-colors" title="Help Desk">
              <HelpCircle size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* MOCK DASHBOARD CONTENT (Scaffolding) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f7f7f8]">
        {/* Mock Topbar */}
        <header className="h-16 flex items-center px-8 border-b border-border/40 bg-white/50 backdrop-blur-sm sticky top-0 z-0">
          <div className="w-64 h-6 bg-muted/40 rounded-md" />
          <div className="ml-auto flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-muted/40" />
            <div className="w-8 h-8 rounded-full bg-muted/40" />
          </div>
        </header>

        {/* Mock Content */}
        <div className="p-8 max-w-5xl w-full mx-auto space-y-6">
          <div className="w-48 h-8 bg-muted/50 rounded-md mb-8" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-white rounded-xl border border-border/40 shadow-sm" />
            <div className="h-32 bg-white rounded-xl border border-border/40 shadow-sm" />
            <div className="h-32 bg-white rounded-xl border border-border/40 shadow-sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="md:col-span-2 h-96 bg-white rounded-xl border border-border/40 shadow-sm" />
            <div className="h-96 bg-white rounded-xl border border-border/40 shadow-sm" />
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.4);
        }
      `}</style>
    </div>
  );
}
