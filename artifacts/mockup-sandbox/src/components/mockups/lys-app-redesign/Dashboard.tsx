import React from "react";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sparkles,
  BookOpen,
  CalendarRange,
  ClipboardList,
  GraduationCap,
  BarChart3,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Heart,
  Compass,
  Target,
  FileText,
  Clock,
  ArrowRight,
  Bell,
  Menu,
  ChevronRight
} from "lucide-react";
import "./_group.css";

const MOCK_DEADLINES = [
  { id: 1, title: "Photosynthesis Quiz", due: "Tomorrow", type: "assignment", overdue: false },
  { id: 2, title: "Essay drafts due", due: "In 3 days", type: "assignment", overdue: false },
  { id: 3, title: "Q3 Parent Updates", due: "Overdue", type: "goal", overdue: true },
];

const MOCK_STANDARDS = [
  { code: "TEKS 5.6A", uses: 12, time: "2d ago", desc: "Explore the uses of energy, including mechanical, light, thermal, electrical, and sound energy." },
  { code: "TEKS 5.6B", uses: 8, time: "1w ago", desc: "Demonstrate that the flow of electricity in closed circuits requires a complete path." },
  { code: "TEKS 5.6C", uses: 5, time: "2w ago", desc: "Demonstrate that light travels in a straight line until it strikes an object and is reflected or refracted." },
  { code: "TEKS 5.5A", uses: 15, time: "3w ago", desc: "Classify matter based on measurable, testable, and observable physical properties." },
];

const MOCK_GAPS = [
  { code: "TEKS 5.7A", desc: "Explore the processes that led to the formation of sedimentary rocks and fossil fuels." },
  { code: "TEKS 5.7B", desc: "Recognize how landforms such as deltas, canyons, and sand dunes are the result of changes to Earth's surface by wind, water, or ice." },
  { code: "TEKS 5.8C", desc: "Demonstrate that Earth rotates on its axis once approximately every 24 hours causing the day/night cycle." },
];

export function Dashboard() {
  return (
    <div className="min-h-screen bg-[#ffffff] font-['Roboto'] text-[hsl(0,0%,9%)] selection:bg-[hsl(7,84%,54%)] selection:text-white">
      {/* App Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[hsl(0,0%,92%)] h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden text-[hsl(0,0%,35%)]">
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-[hsl(7,84%,54%)] rounded-lg flex items-center justify-center transform -rotate-6 shadow-sm shadow-[hsl(7,84%,54%)]/20">
              <span className="text-white font-['Permanent_Marker'] text-lg">L</span>
            </div>
            <span className="font-['Permanent_Marker'] text-xl text-[hsl(7,84%,54%)] tracking-wider">LYS</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-[hsl(0,0%,35%)] relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[hsl(7,84%,54%)] rounded-full border border-white"></span>
          </Button>
          <div className="flex items-center gap-3 pl-4 border-l border-[hsl(0,0%,92%)]">
            <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Rivera&backgroundColor=f8fafc" />
              <AvatarFallback className="bg-[hsl(186,98%,23%)]/10 text-[hsl(186,98%,23%)] font-medium">MR</AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-sm">
              <p className="font-medium">Ms. Rivera</p>
              <p className="text-[10px] text-[hsl(0,0%,35%)]">5th Grade Science</p>
            </div>
          </div>
        </div>
      </header>

      <main className="pb-24">
        {/* Hero Band */}
        <section className="relative pt-12 pb-16 px-6 overflow-hidden">
          {/* Background decorative shapes */}
          <div className="absolute inset-0 bg-slate-50 z-0"></div>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[hsl(7,84%,54%)]/5 -skew-x-12 transform origin-top right-[-10%] blur-xl z-0"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-[hsl(45,93%,62%)]/10 rounded-tr-full blur-2xl z-0"></div>

          <div className="relative z-10 max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(186,98%,23%)]/10 text-[hsl(186,98%,23%)] text-xs font-medium mb-4 border border-[hsl(186,98%,23%)]/20">
                <Target className="w-3.5 h-3.5" />
                <span>Week 4 of Semester 2</span>
              </div>
              <h1 className="font-['Oswald'] text-4xl md:text-5xl font-semibold tracking-tight text-[hsl(0,0%,9%)] mb-2">
                Welcome back, educator
              </h1>
              <p className="text-lg text-[hsl(0,0%,35%)] max-w-xl">
                Pick up where you left off — your tools are ready.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-white/80 backdrop-blur border border-[hsl(0,0%,92%)] rounded-2xl p-3 flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-[hsl(45,93%,62%)]/20 flex items-center justify-center text-[hsl(45,93%,45%)]">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-[hsl(0,0%,35%)] uppercase tracking-wider font-semibold">Current Streak</p>
                  <p className="font-['Oswald'] text-xl leading-none">12 Days</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 -mt-8 relative z-20 space-y-8">
          
          {/* Quick Shortcuts */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {[
              { icon: Sparkles, label: "AI Lesson Planner", color: "hsl(7,84%,54%)" },
              { icon: BookOpen, label: "My Lessons", color: "hsl(186,98%,23%)" },
              { icon: CalendarRange, label: "Curriculum Planning", color: "hsl(45,93%,45%)" },
              { icon: ClipboardList, label: "Assignments", color: "hsl(7,84%,54%)" },
              { icon: GraduationCap, label: "Gradebook", color: "hsl(186,98%,23%)" },
              { icon: BarChart3, label: "Analytics", color: "hsl(45,93%,45%)" },
            ].map((shortcut, idx) => {
              const Icon = shortcut.icon;
              return (
                <button
                  key={idx}
                  className="bg-white rounded-2xl p-4 border border-[hsl(0,0%,92%)] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col items-center justify-center gap-3 text-center group"
                  style={{ boxShadow: `0 4px 14px 0 ${shortcut.color.replace('hsl', 'hsla').replace(')', ', 0.05)')}` }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: `${shortcut.color.replace('hsl', 'hsla').replace(')', ', 0.1)')}`, color: shortcut.color }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-['Oswald'] text-[15px] font-medium leading-tight text-[hsl(0,0%,9%)] group-hover:text-[hsl(7,84%,54%)] transition-colors">
                    {shortcut.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Standards I've used */}
              <Card className="rounded-3xl border border-[hsl(0,0%,92%)] shadow-sm overflow-hidden bg-white">
                <CardHeader className="pb-3 border-b border-[hsl(0,0%,92%)]/50 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-['Oswald'] text-xl flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[hsl(186,98%,23%)]" />
                      Standards I've used
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-[hsl(0,0%,35%)] text-xs h-8">View all</Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-[hsl(0,0%,92%)]/60">
                    {MOCK_STANDARDS.map((std, i) => (
                      <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4 cursor-pointer group">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-['Oswald'] text-[hsl(186,98%,23%)] font-medium text-base tracking-wide">{std.code}</span>
                            <Badge variant="outline" className="text-[10px] uppercase font-semibold text-[hsl(0,0%,35%)] border-[hsl(0,0%,92%)] bg-white">
                              {std.uses}× used
                            </Badge>
                          </div>
                          <p className="text-sm text-[hsl(0,0%,35%)] truncate">{std.desc}</p>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end">
                          <span className="text-xs text-[hsl(0,0%,35%)] mb-2">{std.time}</span>
                          <ArrowRight className="w-4 h-4 text-[hsl(0,0%,92%)] group-hover:text-[hsl(186,98%,23%)] transition-colors transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Gaps to cover */}
              <Card className="rounded-3xl border border-[hsl(0,0%,92%)] shadow-sm bg-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(7,84%,54%)]/5 rounded-bl-[100px] pointer-events-none"></div>
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="font-['Oswald'] text-xl flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-[hsl(7,84%,54%)]" />
                    Gaps to cover
                  </CardTitle>
                  <CardDescription className="text-sm text-[hsl(0,0%,35%)]">
                    5th Grade Science (TEKS)
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-sm mb-2 font-medium">
                      <span>Curriculum Coverage</span>
                      <span className="text-[hsl(7,84%,54%)] font-bold">18/24 (75%)</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[hsl(7,84%,54%)] rounded-full w-[75%]"></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-[hsl(0,0%,35%)] uppercase tracking-wider">Recommended next</p>
                    {MOCK_GAPS.map((gap, i) => (
                      <button key={i} className="w-full text-left p-3 rounded-xl border border-[hsl(0,0%,92%)] hover:border-[hsl(7,84%,54%)]/30 hover:bg-[hsl(7,84%,54%)]/5 transition-all group flex gap-3 items-start">
                        <div className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-white border border-[hsl(0,0%,92%)] flex items-center justify-center group-hover:border-[hsl(7,84%,54%)] group-hover:text-[hsl(7,84%,54%)] transition-colors">
                          <Sparkles className="w-3 h-3" />
                        </div>
                        <div className="flex-1">
                          <span className="font-['Oswald'] text-[hsl(0,0%,9%)] font-medium text-sm block mb-0.5">{gap.code}</span>
                          <span className="text-xs text-[hsl(0,0%,35%)] line-clamp-2">{gap.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Right Column */}
            <div className="lg:col-span-5 space-y-8">
              
              {/* Upcoming Deadlines */}
              <Card className="rounded-3xl border border-[hsl(0,0%,92%)] shadow-sm bg-white overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="font-['Oswald'] text-xl flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[hsl(45,93%,45%)]" />
                    Upcoming Deadlines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {MOCK_DEADLINES.map((item) => (
                      <div key={item.id} className={`p-3 rounded-2xl flex items-center gap-3 border ${item.overdue ? 'bg-[hsl(7,84%,54%)]/5 border-[hsl(7,84%,54%)]/20' : 'bg-slate-50 border-transparent hover:border-[hsl(0,0%,92%)] hover:bg-white'} transition-colors`}>
                        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'assignment' ? 'bg-[hsl(186,98%,23%)]/10 text-[hsl(186,98%,23%)]' : 'bg-[hsl(45,93%,62%)]/20 text-[hsl(45,93%,45%)]'}`}>
                          {item.type === 'assignment' ? <BookOpen className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate text-[hsl(0,0%,9%)]">{item.title}</p>
                          <p className={`text-xs ${item.overdue ? 'text-[hsl(7,84%,54%)] font-medium' : 'text-[hsl(0,0%,35%)]'}`}>
                            {item.due}
                          </p>
                        </div>
                        <Badge variant="outline" className={`shrink-0 text-[10px] capitalize border ${item.type === 'assignment' ? 'border-[hsl(186,98%,23%)]/20 text-[hsl(186,98%,23%)] bg-white' : 'border-[hsl(45,93%,45%)]/20 text-[hsl(45,93%,45%)] bg-white'}`}>
                          {item.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Be-Know-Do Journey */}
              <Card className="rounded-3xl border-2 border-[hsl(45,93%,62%)]/30 bg-gradient-to-br from-[hsl(45,93%,62%)]/5 to-white shadow-sm overflow-hidden" style={{ boxShadow: '0 8px 30px -4px hsla(45, 93%, 62%, 0.1)' }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-['Oswald'] text-xl flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-[hsl(45,93%,45%)]" />
                      Class Journey
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full bg-white border border-[hsl(0,0%,92%)]">
                      <ChevronRight className="w-4 h-4 text-[hsl(0,0%,35%)]" />
                    </Button>
                  </div>
                  <CardDescription className="text-sm">Overall cohort progress snapshot</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3 mb-6 mt-2">
                    <div className="bg-white rounded-2xl p-3 text-center border border-[hsl(45,93%,62%)]/20 shadow-sm shadow-[hsl(45,93%,62%)]/5">
                      <Heart className="w-5 h-5 mx-auto text-[hsl(45,93%,45%)] mb-1.5" />
                      <div className="text-2xl font-bold font-['Oswald'] text-[hsl(45,93%,45%)]">82%</div>
                      <div className="text-[10px] uppercase font-bold text-[hsl(0,0%,35%)] mt-1 tracking-widest">Being</div>
                    </div>
                    <div className="bg-white rounded-2xl p-3 text-center border border-[hsl(186,98%,23%)]/20 shadow-sm shadow-[hsl(186,98%,23%)]/5">
                      <Compass className="w-5 h-5 mx-auto text-[hsl(186,98%,23%)] mb-1.5" />
                      <div className="text-2xl font-bold font-['Oswald'] text-[hsl(186,98%,23%)]">68%</div>
                      <div className="text-[10px] uppercase font-bold text-[hsl(0,0%,35%)] mt-1 tracking-widest">Knowing</div>
                    </div>
                    <div className="bg-white rounded-2xl p-3 text-center border border-[hsl(7,84%,54%)]/20 shadow-sm shadow-[hsl(7,84%,54%)]/5">
                      <Target className="w-5 h-5 mx-auto text-[hsl(7,84%,54%)] mb-1.5" />
                      <div className="text-2xl font-bold font-['Oswald'] text-[hsl(7,84%,54%)]">45%</div>
                      <div className="text-[10px] uppercase font-bold text-[hsl(0,0%,35%)] mt-1 tracking-widest">Doing</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium mb-2">
                      <span className="text-[hsl(0,0%,35%)]">Composite Mastery</span>
                      <span>65%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div className="h-full bg-[hsl(45,93%,45%)] w-[82%] opacity-90 border-r border-white/50" style={{ width: '33.33%' }}></div>
                      <div className="h-full bg-[hsl(186,98%,23%)] w-[68%] opacity-90 border-r border-white/50" style={{ width: '22%' }}></div>
                      <div className="h-full bg-[hsl(7,84%,54%)] w-[45%] opacity-90" style={{ width: '10%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Getting Started */}
              <Card className="rounded-3xl border border-[hsl(0,0%,92%)] shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="font-['Oswald'] text-lg">Quick Setup</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { title: "Set up your classes", desc: "Import from SIS or add manually", done: true },
                      { title: "Generate first lesson", desc: "Try the AI lesson planner", done: true },
                      { title: "Review standards", desc: "Map your curriculum for the term", done: false },
                    ].map((step, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center border ${step.done ? 'bg-[hsl(186,98%,23%)] border-[hsl(186,98%,23%)] text-white' : 'bg-white border-[hsl(0,0%,92%)] text-transparent'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${step.done ? 'text-[hsl(0,0%,35%)] line-through' : 'text-[hsl(0,0%,9%)]'}`}>{step.title}</p>
                          <p className="text-xs text-[hsl(0,0%,35%)]">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Flame(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  )
}
