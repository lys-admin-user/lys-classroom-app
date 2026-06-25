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

export function ThreeZonesRefinedB() {
  const [beKnowDoOpen, setBeKnowDoOpen] = useState(false);

  return (
    <div className="lys-scope flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-[280px] bg-white border-r border-slate-200 flex flex-col shrink-0 sticky top-0 h-screen">
        
        {/* Header / Brand */}
        <div className="p-6 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lys-red flex items-center justify-center -rotate-6 shadow-sm">
              <span className="font-['Permanent_Marker'] text-white text-xl translate-y-[2px] rotate-6">L</span>
            </div>
            <div className="flex flex-col">
              <span className="font-['Permanent_Marker'] text-slate-900 text-xl tracking-tight leading-none">LYS</span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Laddering Your Success</span>
            </div>
          </div>
        </div>

        {/* Scrollable Nav */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
          
          {/* Zone 1: Teach */}
          <nav className="bg-[hsl(var(--lys-red)_/_0.03)] rounded-xl p-2 pb-3 border border-[hsl(var(--lys-red)_/_0.05)]">
            <div className="flex items-center gap-2 px-3 mb-3 pt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-lys-red"></div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Teach</div>
            </div>
            
            <div className="space-y-0.5">
              <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active />
              <NavItem icon={<Compass size={18} />} label="My Journey" />
            </div>
            
            <div className="my-2 mx-3 border-t border-[hsl(var(--lys-red)_/_0.08)]"></div>
            
            <div className="space-y-0.5">
              <NavItem icon={<Sparkles size={18} />} label="AI Lesson Generator" />
              <NavItem icon={<Wand2 size={18} />} label="AI Assignment Generator" />
              <NavItem icon={<PenTool size={18} />} label="Lesson Authoring" />
              <NavItem icon={<BookOpen size={18} />} label="My Lessons" />
              <NavItem icon={<Map size={18} />} label="Curriculum Planning" />
            </div>

            <div className="my-2 mx-3 border-t border-[hsl(var(--lys-red)_/_0.08)]"></div>

            <div className="space-y-0.5">
              <NavItem icon={<FileText size={18} />} label="Assessments" />
              <NavItem icon={<ClipboardList size={18} />} label="Gradebook" />
              <NavItem icon={<Share2 size={18} />} label="Collaboration" />
              <NavItem icon={<Folder size={18} />} label="Community Library" />
              <NavItem icon={<Link2 size={18} />} label="SIS Integration" />
            </div>
          </nav>

          {/* Zone 2: Insights */}
          <nav className="bg-[hsl(var(--lys-yellow)_/_0.06)] rounded-xl p-2 pb-3 border border-[hsl(var(--lys-yellow)_/_0.15)]">
            <div className="flex items-center gap-2 px-3 mb-3 pt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-lys-yellow"></div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Insights</div>
            </div>
            
            <div className="space-y-0.5">
              <NavItem icon={<BarChart3 size={18} />} label="Analytics" />
              <NavItem icon={<Award size={18} />} label="Educator Influence" />
              <NavItem icon={<TrendingUp size={18} />} label="Professional Dev" />
              <NavItem icon={<Heart size={18} />} label="Self Assessment" />
            </div>
            
            <div className="my-2 mx-3 border-t border-[hsl(var(--lys-yellow)_/_0.15)]"></div>
            
            <div className="space-y-0.5">
              <NavItem icon={<School size={18} />} label="Classroom" />
              <NavItem icon={<Users size={18} />} label="Parent Portal" />
            </div>
          </nav>

          {/* Zone 3: Be Know Do */}
          <nav className="bg-[hsl(var(--lys-teal)_/_0.04)] rounded-xl p-2 pb-3 border border-[hsl(var(--lys-teal)_/_0.08)]">
            <div className="flex items-center gap-2 px-3 mb-3 pt-1">
              <div className="flex gap-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-lys-red"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-lys-yellow"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-lys-teal"></div>
              </div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Core Framework</div>
            </div>
            
            <button 
              onClick={() => setBeKnowDoOpen(!beKnowDoOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md text-slate-600 hover:bg-white/60 hover:text-slate-900 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="flex bg-white shadow-sm p-1 rounded-md border border-slate-100">
                  <Target size={16} className="text-lys-teal" />
                </div>
                <span className="text-sm font-medium">Be · Know · Do</span>
              </div>
              {beKnowDoOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600" />}
            </button>

            {beKnowDoOpen && (
              <div className="pl-5 pr-2 pt-3 pb-1 space-y-5 border-l border-[hsl(var(--lys-teal)_/_0.2)] ml-5 mt-1">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-lys-red"></div>
                    <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Be – Self Discovery</div>
                  </div>
                  <NavItem icon={<Heart size={16} />} label="Self Discovery" small />
                  <NavItem icon={<Sparkles size={16} />} label="Strengths Inventory" small />
                  <NavItem icon={<PenTool size={16} />} label="Essay Builder" small />
                  <NavItem icon={<UserCircle size={16} />} label="My Portfolio" small />
                  <NavItem icon={<Milestone size={16} />} label="Milestones" small />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-lys-yellow"></div>
                    <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Know – Career Paths</div>
                  </div>
                  <NavItem icon={<Briefcase size={16} />} label="Career Explorer" small />
                  <NavItem icon={<Library size={16} />} label="Resources" small />
                  <NavItem icon={<GraduationCap size={16} />} label="Scholarship Planner" small />
                  <NavItem icon={<UserPlus size={16} />} label="Mentor Connect" small />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-lys-teal"></div>
                    <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Do – Take Action</div>
                  </div>
                  <NavItem icon={<Target size={16} />} label="Action Plans" small />
                  <NavItem icon={<Trophy size={16} />} label="Campus Activities" small />
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* Footer Area */}
        <div className="p-4 pt-2 shrink-0 bg-white">
          <nav className="space-y-0.5">
            <NavItem icon={<Settings size={18} />} label="Settings" />
            <NavItem icon={<CreditCard size={18} />} label="Plans & Pricing" />
            <NavItem icon={<HelpCircle size={18} />} label="Help Desk" />
          </nav>
          
          <div className="h-px w-full bg-slate-100 my-4"></div>
          
          {/* User Chip */}
          <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors text-left group border border-transparent hover:border-slate-100">
            <div className="w-9 h-9 rounded-full bg-lys-teal text-white flex items-center justify-center font-medium shadow-sm">
              MR
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-semibold text-slate-900 truncate">Ms. Rivera</div>
              <div className="text-xs text-slate-500 truncate">Teacher</div>
            </div>
            <MoreVertical size={16} className="text-slate-400 group-hover:text-slate-600 shrink-0" />
          </button>
        </div>

      </aside>

      {/* Main Content Area (Scaffold) */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center px-8 shrink-0">
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
              <div className="h-32 bg-white border border-slate-200 rounded-xl shadow-sm"></div>
              <div className="h-32 bg-white border border-slate-200 rounded-xl shadow-sm"></div>
              <div className="h-32 bg-white border border-slate-200 rounded-xl shadow-sm"></div>
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 h-96 bg-white border border-slate-200 rounded-xl shadow-sm"></div>
              <div className="h-96 bg-white border border-slate-200 rounded-xl shadow-sm"></div>
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
      w-full flex items-center gap-3 rounded-md transition-all text-left
      ${small ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'}
      ${active 
        ? 'bg-lys-red text-white font-medium shadow-sm' 
        : 'text-slate-600 hover:bg-white/80 hover:text-slate-900 font-medium'
      }
    `}>
      <span className={`${active ? 'text-white/90' : 'text-slate-400'} shrink-0`}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}
