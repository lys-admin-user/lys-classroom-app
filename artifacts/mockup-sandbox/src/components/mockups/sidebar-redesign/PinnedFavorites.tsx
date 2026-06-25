import React, { useState } from 'react';
import { 
  Search, LayoutDashboard, Compass, Sparkles, Wand2, BookOpen, 
  Map, FileText, ClipboardList, Share2, Folder, Link2, PenTool, 
  BarChart3, Award, TrendingUp, Heart, School, Users, UserCircle, 
  Milestone, Briefcase, Library, GraduationCap, UserPlus, Target, 
  Trophy, Settings, CreditCard, HelpCircle, ChevronDown, ChevronRight 
} from 'lucide-react';
import "./_group.css";

// ----------------------------------------------------------------------
// Types & Data
// ----------------------------------------------------------------------

type NavItemProps = {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  isPinned?: boolean;
  colorVar?: string; // e.g. "var(--lys-red)"
};

// ----------------------------------------------------------------------
// Components
// ----------------------------------------------------------------------

const NavItem = ({ icon: Icon, label, isActive, isPinned = false, colorVar }: NavItemProps) => {
  const activeBg = colorVar ? `hsla(${colorVar}, 0.1)` : 'hsla(var(--lys-red), 0.1)';
  const activeColor = colorVar ? `hsl(${colorVar})` : 'hsl(var(--lys-red))';
  
  return (
    <button 
      className={`
        w-full flex items-center gap-3 px-3 rounded-xl transition-all duration-200 text-sm outline-none
        focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1
        ${isPinned ? 'py-2.5' : 'py-2'}
        ${isActive 
          ? 'font-medium' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
      `}
      style={{
        backgroundColor: isActive ? activeBg : undefined,
        color: isActive ? activeColor : undefined,
      }}
    >
      <Icon 
        className={`w-4 h-4 transition-colors`} 
        style={{ color: isActive ? activeColor : (colorVar ? `hsl(${colorVar})` : 'inherit'), opacity: isActive ? 1 : (colorVar ? 0.8 : 0.6) }}
        strokeWidth={isActive ? 2.5 : 2}
      />
      <span className="truncate">{label}</span>
    </button>
  );
};

const CollapsibleSection = ({ 
  title, 
  children, 
  defaultOpen = false,
  colorVar
}: { 
  title: string; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
  colorVar?: string;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-1">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-800 transition-colors group outline-none"
        style={{ color: colorVar ? `hsl(${colorVar})` : undefined }}
      >
        <span>{title}</span>
        <ChevronRight 
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} 
        />
      </button>
      <div 
        className={`grid transition-all duration-200 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <div className="space-y-0.5 pt-1 pb-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export function PinnedFavorites() {
  return (
    <div className="lys-scope min-h-screen bg-slate-50/50 flex text-slate-900 font-sans selection:bg-[hsl(var(--lys-red))/20] selection:text-[hsl(var(--lys-red))]">
      
      {/* ------------------------------------------------------------------
          SIDEBAR
          ------------------------------------------------------------------ */}
      <aside className="w-[280px] bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 shrink-0">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 p-5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[hsl(var(--lys-red))] rotate-[-4deg] flex items-center justify-center shadow-sm shadow-[hsl(var(--lys-red))/20]">
            <span className="font-['Permanent_Marker'] text-white text-xl leading-none translate-x-[1px]">L</span>
          </div>
          <div>
            <h1 className="font-['Permanent_Marker'] text-2xl leading-none tracking-tight text-slate-900">LYS</h1>
            <p className="text-[0.6rem] text-slate-500 uppercase tracking-[0.2em] font-semibold mt-0.5">Laddering Your Success</p>
          </div>
        </div>

        {/* Global Search / Command */}
        <div className="px-4 pb-5 shrink-0">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[hsl(var(--lys-red))] transition-colors" />
            <input 
              type="text" 
              placeholder="Jump to..." 
              className="w-full bg-slate-100 hover:bg-slate-200/70 border border-transparent rounded-xl pl-9 pr-12 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-[hsl(var(--lys-red))/30] focus:ring-4 focus:ring-[hsl(var(--lys-red))/10] transition-all placeholder:text-slate-400 shadow-sm" 
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
              <kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[0.6rem] font-medium font-sans text-slate-400 shadow-sm">⌘</kbd>
              <kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[0.6rem] font-medium font-sans text-slate-400 shadow-sm">K</kbd>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar">
          
          {/* Pinned / Favorites */}
          <div className="mb-6 px-2 space-y-1">
            <NavItem icon={LayoutDashboard} label="Dashboard" isActive={true} isPinned />
            <NavItem icon={Sparkles} label="AI Lesson Generator" isPinned />
            <NavItem icon={ClipboardList} label="Gradebook" isPinned />
            <NavItem icon={BookOpen} label="My Lessons" isPinned />
            <NavItem icon={School} label="Classroom" isPinned />
          </div>

          <div className="w-full h-px bg-slate-100 mx-2 mb-4 max-w-[calc(100%-1rem)]"></div>

          {/* Collapsed Sections */}
          <CollapsibleSection title="Overview">
            <NavItem icon={Compass} label="My Journey" />
          </CollapsibleSection>

          <CollapsibleSection title="Educator Tools">
            <NavItem icon={Wand2} label="AI Assignment Generator" />
            <NavItem icon={Map} label="Curriculum Planning" />
            <NavItem icon={FileText} label="Assessments" />
            <NavItem icon={Share2} label="Collaboration" />
            <NavItem icon={Folder} label="Community Library" />
            <NavItem icon={Link2} label="SIS Integration" />
            <NavItem icon={PenTool} label="Lesson Authoring" />
          </CollapsibleSection>

          <CollapsibleSection title="Growth & Analytics">
            <NavItem icon={BarChart3} label="Analytics" />
            <NavItem icon={Award} label="Educator Influence" />
            <NavItem icon={TrendingUp} label="Professional Dev" />
            <NavItem icon={Heart} label="Self Assessment" />
          </CollapsibleSection>

          <CollapsibleSection title="Students">
            <NavItem icon={Users} label="Parent Portal" />
          </CollapsibleSection>

          <div className="w-full h-px bg-slate-100 mx-2 my-4 max-w-[calc(100%-1rem)]"></div>

          {/* Pillars */}
          <CollapsibleSection title="BE • Self Discovery" colorVar="var(--lys-red)">
            <NavItem icon={Heart} label="Self Discovery" colorVar="var(--lys-red)" />
            <NavItem icon={Sparkles} label="Strengths Inventory" colorVar="var(--lys-red)" />
            <NavItem icon={PenTool} label="Essay Builder" colorVar="var(--lys-red)" />
            <NavItem icon={UserCircle} label="My Portfolio" colorVar="var(--lys-red)" />
            <NavItem icon={Milestone} label="Milestones" colorVar="var(--lys-red)" />
          </CollapsibleSection>

          <CollapsibleSection title="KNOW • Career Paths" colorVar="var(--lys-yellow)">
            <NavItem icon={Briefcase} label="Career Explorer" colorVar="var(--lys-yellow)" />
            <NavItem icon={Library} label="Resources" colorVar="var(--lys-yellow)" />
            <NavItem icon={GraduationCap} label="Scholarship Planner" colorVar="var(--lys-yellow)" />
            <NavItem icon={UserPlus} label="Mentor Connect" colorVar="var(--lys-yellow)" />
          </CollapsibleSection>

          <CollapsibleSection title="DO • Take Action" colorVar="var(--lys-teal)">
            <NavItem icon={Target} label="Action Plans" colorVar="var(--lys-teal)" />
            <NavItem icon={Trophy} label="Campus Activities" colorVar="var(--lys-teal)" />
          </CollapsibleSection>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-white/50 shrink-0">
          <div className="space-y-0.5 mb-4">
            <NavItem icon={Settings} label="Settings" />
            <NavItem icon={CreditCard} label="Plans & Pricing" />
            <NavItem icon={HelpCircle} label="Help Desk" />
          </div>
          
          {/* User Chip */}
          <button className="w-full flex items-center gap-3 p-2 hover:bg-slate-100 rounded-xl transition-colors text-left outline-none focus-visible:ring-2 focus-visible:ring-slate-400">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[hsl(var(--lys-red))] to-[hsl(var(--lys-yellow))] p-[2px]">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center border border-white">
                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Maria&backgroundColor=transparent" alt="Avatar" className="w-full h-full rounded-full" />
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 truncate">Maria Rivera</p>
              <p className="text-xs text-slate-500 truncate">Educator</p>
            </div>
          </button>
        </div>
      </aside>

      {/* ------------------------------------------------------------------
          SCAFFOLDING / CONTENT AREA
          ------------------------------------------------------------------ */}
      <main className="flex-1 p-8 flex flex-col gap-6 opacity-30 pointer-events-none bg-slate-100/50">
        <header className="flex justify-between items-center mb-2">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 rounded-lg"></div>
            <div className="h-4 w-96 bg-slate-200 rounded-md"></div>
          </div>
          <div className="flex gap-4">
            <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
            <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-6">
          <div className="h-64 bg-white rounded-2xl border border-slate-200 shadow-sm col-span-2 p-6 flex flex-col gap-4">
            <div className="h-6 w-48 bg-slate-200 rounded-md"></div>
            <div className="h-40 w-full bg-slate-100 rounded-xl border border-slate-100"></div>
          </div>
          <div className="h-64 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
            <div className="h-6 w-32 bg-slate-200 rounded-md"></div>
            <div className="space-y-3">
              <div className="h-10 w-full bg-slate-100 rounded-lg"></div>
              <div className="h-10 w-full bg-slate-100 rounded-lg"></div>
              <div className="h-10 w-full bg-slate-100 rounded-lg"></div>
            </div>
          </div>
        </div>

        <div className="h-96 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
           <div className="h-6 w-48 bg-slate-200 rounded-md mb-2"></div>
           <div className="h-12 w-full bg-slate-100 rounded-lg"></div>
           <div className="h-12 w-full bg-slate-100 rounded-lg"></div>
           <div className="h-12 w-full bg-slate-100 rounded-lg"></div>
           <div className="h-12 w-full bg-slate-100 rounded-lg"></div>
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
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
