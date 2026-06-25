import React, { useState } from "react";
import "./_group.css";
import {
  LayoutDashboard,
  Compass,
  Sparkles,
  Wand2,
  BookOpen,
  Map,
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
  Settings,
  CreditCard,
  HelpCircle,
  Briefcase,
  Library,
  GraduationCap,
  UserPlus,
  Target,
  Trophy,
  UserCircle,
  Milestone,
  ChevronDown,
  ChevronRight,
  MoreVertical
} from "lucide-react";

export function ThreeZonesRefinedA() {
  const [beKnowDoOpen, setBeKnowDoOpen] = useState(false);

  return (
    <div className="lys-scope flex min-h-screen bg-[#FAFAFA] font-sans text-slate-900 selection:bg-[hsl(var(--lys-red)_/_0.2)]">
      {/* Sidebar */}
      <aside className="w-[280px] bg-white border-r border-slate-200/70 flex flex-col shrink-0 sticky top-0 h-screen">
        
        {/* Header / Brand */}
        <div className="p-6 pb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--lys-red))] flex items-center justify-center -rotate-6 shadow-sm">
              <span className="font-['Permanent_Marker'] text-white text-xl translate-y-[2px] rotate-6">L</span>
            </div>
            <div className="flex flex-col">
              <span className="font-['Permanent_Marker'] text-slate-900 text-xl tracking-tight leading-none">LYS</span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Laddering Your Success</span>
            </div>
          </div>
        </div>

        {/* Scrollable Nav */}
        <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
          
          <div className="space-y-10 pb-6">
            {/* Zone 1: Teach */}
            <section>
              <div className="px-3 mb-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Teach</div>
              
              <nav className="space-y-0.5">
                <NavItem icon={<LayoutDashboard size={18} strokeWidth={2} />} label="Dashboard" active />
                <NavItem icon={<Compass size={18} strokeWidth={2} />} label="My Journey" />
              </nav>
              
              <div className="h-5" />
              
              <nav className="space-y-0.5">
                <NavItem icon={<Sparkles size={18} strokeWidth={2} />} label="AI Lesson Generator" />
                <NavItem icon={<Wand2 size={18} strokeWidth={2} />} label="AI Assignment Generator" />
                <NavItem icon={<BookOpen size={18} strokeWidth={2} />} label="My Lessons" />
                <NavItem icon={<Map size={18} strokeWidth={2} />} label="Curriculum Planning" />
                <NavItem icon={<FileText size={18} strokeWidth={2} />} label="Assessments" />
                <NavItem icon={<ClipboardList size={18} strokeWidth={2} />} label="Gradebook" />
                <NavItem icon={<Share2 size={18} strokeWidth={2} />} label="Collaboration" />
                <NavItem icon={<Folder size={18} strokeWidth={2} />} label="Community Library" />
                <NavItem icon={<Link2 size={18} strokeWidth={2} />} label="SIS Integration" />
                <NavItem icon={<PenTool size={18} strokeWidth={2} />} label="Lesson Authoring" />
              </nav>
            </section>

            {/* Divider */}
            <div className="mx-3 h-px bg-slate-100" />

            {/* Zone 2: Insights */}
            <section>
              <div className="px-3 mb-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Insights</div>
              
              <nav className="space-y-0.5">
                <NavItem icon={<BarChart3 size={18} strokeWidth={2} />} label="Analytics" />
                <NavItem icon={<Award size={18} strokeWidth={2} />} label="Educator Influence" />
                <NavItem icon={<TrendingUp size={18} strokeWidth={2} />} label="Professional Dev" />
                <NavItem icon={<Heart size={18} strokeWidth={2} />} label="Self Assessment" />
              </nav>
              
              <div className="h-5" />
              
              <nav className="space-y-0.5">
                <NavItem icon={<School size={18} strokeWidth={2} />} label="Classroom" />
                <NavItem icon={<Users size={18} strokeWidth={2} />} label="Parent Portal" />
              </nav>
            </section>

            {/* Divider */}
            <div className="mx-3 h-px bg-slate-100" />

            {/* Zone 3: Be Know Do */}
            <section>
              <div className="px-3 mb-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Core Framework</div>
              
              <button 
                onClick={() => setBeKnowDoOpen(!beKnowDoOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--lys-red))]"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--lys-yellow))]"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--lys-teal))]"></div>
                  </div>
                  <span className="text-sm font-medium">Be · Know · Do</span>
                </div>
                {beKnowDoOpen ? (
                  <ChevronDown size={16} strokeWidth={2} className="text-slate-400" />
                ) : (
                  <ChevronRight size={16} strokeWidth={2} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                )}
              </button>

              {beKnowDoOpen && (
                <div className="pl-5 pr-2 pt-3 pb-2 space-y-5 border-l border-slate-100 ml-4 mt-1">
                  <div className="space-y-0.5">
                    <div className="text-[9px] font-bold text-[hsl(var(--lys-red))] uppercase tracking-widest mb-2 pl-2">Be – Self Discovery</div>
                    <NavItem icon={<Heart size={16} strokeWidth={2} />} label="Self Discovery" small />
                    <NavItem icon={<Sparkles size={16} strokeWidth={2} />} label="Strengths Inventory" small />
                    <NavItem icon={<PenTool size={16} strokeWidth={2} />} label="Essay Builder" small />
                    <NavItem icon={<UserCircle size={16} strokeWidth={2} />} label="My Portfolio" small />
                    <NavItem icon={<Milestone size={16} strokeWidth={2} />} label="Milestones" small />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[9px] font-bold text-[hsl(var(--lys-yellow))] uppercase tracking-widest mb-2 pl-2">Know – Career Paths</div>
                    <NavItem icon={<Briefcase size={16} strokeWidth={2} />} label="Career Explorer" small />
                    <NavItem icon={<Library size={16} strokeWidth={2} />} label="Resources" small />
                    <NavItem icon={<GraduationCap size={16} strokeWidth={2} />} label="Scholarship Planner" small />
                    <NavItem icon={<UserPlus size={16} strokeWidth={2} />} label="Mentor Connect" small />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[9px] font-bold text-[hsl(var(--lys-teal))] uppercase tracking-widest mb-2 pl-2">Do – Take Action</div>
                    <NavItem icon={<Target size={16} strokeWidth={2} />} label="Action Plans" small />
                    <NavItem icon={<Trophy size={16} strokeWidth={2} />} label="Campus Activities" small />
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Footer Area */}
        <div className="px-3 py-4 border-t border-slate-100 bg-white space-y-3 shrink-0">
          <nav className="space-y-0.5">
            <NavItem icon={<Settings size={18} strokeWidth={2} />} label="Settings" />
            <NavItem icon={<CreditCard size={18} strokeWidth={2} />} label="Plans & Pricing" />
            <NavItem icon={<HelpCircle size={18} strokeWidth={2} />} label="Help Desk" />
          </nav>
          
          <div className="mx-3 h-px bg-slate-100"></div>
          
          {/* User Chip */}
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-50 transition-colors text-left group">
            <div className="w-8 h-8 rounded-full bg-[hsl(var(--lys-teal))] text-white flex items-center justify-center text-xs font-semibold shadow-sm">
              MR
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-semibold text-slate-900 truncate">Ms. Rivera</div>
              <div className="text-xs text-slate-500 truncate">Teacher</div>
            </div>
            <MoreVertical size={16} strokeWidth={2} className="text-slate-400 group-hover:text-slate-600 shrink-0 transition-colors" />
          </button>
        </div>

      </aside>

      {/* Main Content Area (Scaffold) */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#FAFAFA]">
        <header className="h-16 border-b border-slate-200/70 bg-white flex items-center px-8 shrink-0 shadow-sm shadow-slate-100/50">
          <div className="h-6 w-48 bg-slate-100 rounded-md"></div>
          <div className="ml-auto flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-100"></div>
            <div className="w-8 h-8 rounded-full bg-slate-100"></div>
          </div>
        </header>
        
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="h-10 w-64 bg-slate-200 rounded-lg mb-8"></div>
            
            <div className="grid grid-cols-3 gap-6">
              <div className="h-32 bg-white border border-slate-200/70 rounded-xl shadow-sm"></div>
              <div className="h-32 bg-white border border-slate-200/70 rounded-xl shadow-sm"></div>
              <div className="h-32 bg-white border border-slate-200/70 rounded-xl shadow-sm"></div>
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 h-96 bg-white border border-slate-200/70 rounded-xl shadow-sm"></div>
              <div className="h-96 bg-white border border-slate-200/70 rounded-xl shadow-sm"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, small }: { icon: React.ReactNode, label: string, active?: boolean, small?: boolean }) {
  return (
    <button className={`
      group relative w-full flex items-center gap-3 rounded-md transition-all duration-200 text-left
      ${small ? 'px-3 py-1.5 text-xs' : 'px-3 py-2 text-sm'}
      ${active 
        ? 'bg-[hsl(var(--lys-red)_/_0.06)] text-[hsl(var(--lys-red))] font-medium' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
      }
    `}>
      {active && (
        <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[hsl(var(--lys-red))]" />
      )}
      <span className={`${active ? 'text-[hsl(var(--lys-red))]' : 'text-slate-400 group-hover:text-slate-500'} shrink-0 transition-colors`}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}
