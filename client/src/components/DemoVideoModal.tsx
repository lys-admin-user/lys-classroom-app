import { useState, useEffect, useCallback } from "react";
import { PLAN_PRICES } from "@/lib/pricing";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  Heart,
  Compass,
  Target,
  BookOpen,
  Users,
  TrendingUp,
  GraduationCap,
  Shield,
  Brain,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  X,
  CheckCircle2,
  Lightbulb,
  BarChart3,
  Globe,
  Lock,
  Award,
  DollarSign,
  ClipboardList,
  HelpCircle,
  MessageSquare,
  Layers,
  Star,
  FileText,
  Building2,
  ShoppingBag,
  Bookmark,
  BookmarkCheck,
  Rss,
  Calendar,
} from "lucide-react";

interface DemoSlide {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  features: { icon: React.ReactNode; text: string }[];
  visual: React.ReactNode;
}

const slides: DemoSlide[] = [
  {
    title: "Welcome to LYS",
    subtitle: "Laddering Your Success",
    description: "AI-powered education built on Be-Know-Do — bridging academics with real-world success.",
    icon: <GraduationCap className="h-10 w-10" />,
    color: "text-lys-red",
    bgGradient: "from-lys-red/20 via-lys-yellow/10 to-lys-teal/20",
    features: [
      { icon: <Brain className="h-4 w-4" />, text: "AI Lesson Planning" },
      { icon: <Briefcase className="h-4 w-4" />, text: "40+ Careers" },
      { icon: <Shield className="h-4 w-4" />, text: "Zero-Trust Security" },
    ],
    visual: (
      <div className="flex items-center justify-center gap-6">
        {[
          { icon: <Heart className="h-8 w-8 text-lys-yellow" />, label: "BE", bg: "bg-lys-yellow/20" },
          { icon: <Compass className="h-8 w-8 text-lys-teal" />, label: "KNOW", bg: "bg-lys-teal/20" },
          { icon: <Target className="h-8 w-8 text-lys-red" />, label: "DO", bg: "bg-lys-red/20" },
        ].map((item, i) => (
          <div key={item.label} className="flex flex-col items-center gap-2 animate-fade-up" style={{ animationDelay: `${i * 0.15}s` }}>
            <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center`}>{item.icon}</div>
            <span className="text-sm font-oswald">{item.label}</span>
            {i < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground absolute" style={{ display: "none" }} />}
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "BE — Self-Discovery",
    subtitle: "Explore Identity & Strengths",
    description: "Students discover strengths, values, and personality traits through guided assessments.",
    icon: <Heart className="h-10 w-10" />,
    color: "text-lys-yellow",
    bgGradient: "from-lys-yellow/20 via-lys-yellow/5 to-transparent",
    features: [
      { icon: <Lightbulb className="h-4 w-4" />, text: "Strengths Assessment" },
      { icon: <CheckCircle2 className="h-4 w-4" />, text: "Milestone Tracking" },
    ],
    visual: (
      <div className="space-y-2 w-full max-w-xs mx-auto">
        <div className="bg-card rounded-lg border p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-oswald">Identity Score</span>
            <span className="text-lg font-bold text-lys-yellow">78%</span>
          </div>
          <Progress value={78} className="h-2" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["Creative", "Empathetic", "Leader"].map((trait) => (
            <Badge key={trait} variant="secondary" className="justify-center text-xs py-1">{trait}</Badge>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Digital Portfolios",
    subtitle: "Showcase Student Growth",
    description: "Customizable portfolios with privacy controls and shareable links for college applications.",
    icon: <FileText className="h-10 w-10" />,
    color: "text-lys-yellow",
    bgGradient: "from-lys-yellow/20 via-lys-red/5 to-transparent",
    features: [
      { icon: <Lock className="h-4 w-4" />, text: "Privacy Controls" },
      { icon: <Globe className="h-4 w-4" />, text: "Shareable Links" },
    ],
    visual: (
      <div className="w-full max-w-xs mx-auto">
        <div className="bg-card rounded-lg border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-lys-yellow/20 flex items-center justify-center text-xs font-bold">JS</div>
            <div>
              <p className="text-sm font-oswald">Jamie's Portfolio</p>
              <p className="text-xs text-muted-foreground">Grade 10 — Science & Tech</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {[{ n: "12", l: "Projects" }, { n: "3", l: "Awards" }, { n: "85%", l: "BE Score" }].map((s) => (
              <div key={s.l} className="bg-muted/50 rounded p-1.5">
                <div className="text-sm font-bold font-oswald">{s.n}</div>
                <div className="text-[10px] text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "KNOW — Career Explorer",
    subtitle: "40+ Careers, Real Data",
    description: "Browse careers with BLS salary data, growth rates, and education pathways by state.",
    icon: <Compass className="h-10 w-10" />,
    color: "text-lys-teal",
    bgGradient: "from-lys-teal/20 via-lys-teal/5 to-transparent",
    features: [
      { icon: <TrendingUp className="h-4 w-4" />, text: "BLS Market Data" },
      { icon: <Globe className="h-4 w-4" />, text: "State Salaries" },
    ],
    visual: (
      <div className="space-y-2 w-full max-w-xs mx-auto">
        {[
          { title: "AI/ML Engineer", salary: "$112K–$189K", growth: "+40%" },
          { title: "Cybersecurity Analyst", salary: "$85K–$145K", growth: "+33%" },
          { title: "EV/Battery Tech", salary: "$40K–$85K", growth: "+25%" },
        ].map((c) => (
          <div key={c.title} className="bg-card rounded-lg border p-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-oswald">{c.title}</p>
              <p className="text-xs text-muted-foreground">{c.salary}</p>
            </div>
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">{c.growth}</Badge>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "BKD Career Matching",
    subtitle: "Personalized Recommendations",
    description: "AI matches student profiles to careers based on their Be-Know-Do assessment scores.",
    icon: <BarChart3 className="h-10 w-10" />,
    color: "text-lys-teal",
    bgGradient: "from-lys-teal/20 via-lys-yellow/5 to-transparent",
    features: [
      { icon: <Target className="h-4 w-4" />, text: "Score Matching" },
      { icon: <Briefcase className="h-4 w-4" />, text: "Career Fit %" },
    ],
    visual: (
      <div className="w-full max-w-xs mx-auto space-y-2">
        {[
          { career: "Software Developer", match: 94, pillar: "DO" },
          { career: "Data Scientist", match: 87, pillar: "KNOW" },
          { career: "Product Manager", match: 82, pillar: "DO" },
        ].map((r) => (
          <div key={r.career} className="bg-card rounded-lg border p-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-oswald">{r.career}</p>
              <Badge variant="secondary" className="text-[10px]">{r.pillar} Focus</Badge>
            </div>
            <span className="font-oswald text-lg text-lys-teal">{r.match}%</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "DO — AI Lesson Planner",
    subtitle: "Rubric-Scored in Seconds",
    description: "Enter a topic — AI generates a complete lesson plan scored across 6 quality categories.",
    icon: <Target className="h-10 w-10" />,
    color: "text-lys-red",
    bgGradient: "from-lys-red/20 via-lys-red/5 to-transparent",
    features: [
      { icon: <Sparkles className="h-4 w-4" />, text: "AI Generation" },
      { icon: <BookOpen className="h-4 w-4" />, text: "6-Category Rubric" },
    ],
    visual: (
      <div className="w-full max-w-xs mx-auto">
        <div className="bg-card rounded-lg border p-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-lys-red" />
            <span className="text-sm font-oswald">AI Lesson Generated</span>
            <Badge className="ml-auto bg-green-500/10 text-green-600 text-xs">92/100</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-2">"Growth Mindset for 9th Grade"</p>
          <div className="grid grid-cols-2 gap-1">
            {["Objectives", "Activities", "Assessment", "Standards"].map((c) => (
              <div key={c} className="flex items-center gap-1 text-xs">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Scope & Sequence",
    subtitle: "Full Curriculum Planner",
    description: "Map your school year with pacing, standards alignment, and department-wide sharing.",
    icon: <BookOpen className="h-10 w-10" />,
    color: "text-lys-teal",
    bgGradient: "from-lys-teal/20 via-lys-yellow/5 to-transparent",
    features: [
      { icon: <Layers className="h-4 w-4" />, text: "Pacing Tracker" },
      { icon: <CheckCircle2 className="h-4 w-4" />, text: "Standards Extraction" },
    ],
    visual: (
      <div className="w-full max-w-xs mx-auto space-y-2">
        {[
          { week: "Weeks 1–3", unit: "Intro to Algebra", progress: 100 },
          { week: "Weeks 4–6", unit: "Linear Equations", progress: 65 },
          { week: "Weeks 7–9", unit: "Graphing", progress: 10 },
        ].map((item) => (
          <div key={item.unit} className="bg-card rounded-lg border p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{item.week}</span>
              <span className="text-xs font-oswald">{item.progress}%</span>
            </div>
            <p className="text-sm font-oswald mb-1">{item.unit}</p>
            <Progress value={item.progress} className="h-1.5" />
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "AI Assignments",
    subtitle: "Aligned to Lesson Rubric",
    description: "Generate assignments that align with lesson objectives and BKD principles automatically.",
    icon: <ClipboardList className="h-10 w-10" />,
    color: "text-lys-red",
    bgGradient: "from-lys-red/20 via-lys-yellow/5 to-transparent",
    features: [
      { icon: <Sparkles className="h-4 w-4" />, text: "AI-Generated" },
      { icon: <Target className="h-4 w-4" />, text: "BKD Aligned" },
    ],
    visual: (
      <div className="w-full max-w-xs mx-auto">
        <div className="bg-card rounded-lg border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-lys-red" />
            <span className="text-sm font-oswald">Assignment Created</span>
          </div>
          {["Research Essay — Growth Mindset", "Lab Report — Scientific Method", "Group Project — Real-World Application"].map((a) => (
            <div key={a} className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span>{a}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Gradebook",
    subtitle: "Track & Export Grades",
    description: "Manage grades, calculate letter grades, export CSV, and integrate with your SIS.",
    icon: <ClipboardList className="h-10 w-10" />,
    color: "text-lys-yellow",
    bgGradient: "from-lys-yellow/20 via-lys-teal/5 to-transparent",
    features: [
      { icon: <BarChart3 className="h-4 w-4" />, text: "Auto Letter Grades" },
      { icon: <Globe className="h-4 w-4" />, text: "SIS Integration" },
    ],
    visual: (
      <div className="w-full max-w-xs mx-auto">
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="grid grid-cols-4 text-xs font-oswald bg-muted/50 p-2 border-b">
            <span>Student</span><span className="text-center">Score</span><span className="text-center">Grade</span><span className="text-center">Career</span>
          </div>
          {[
            { name: "Alex M.", score: 94, grade: "A", career: "92%" },
            { name: "Sam R.", score: 87, grade: "B+", career: "85%" },
            { name: "Jamie L.", score: 78, grade: "C+", career: "71%" },
          ].map((s) => (
            <div key={s.name} className="grid grid-cols-4 text-xs p-2 border-b last:border-0">
              <span className="font-roboto">{s.name}</span>
              <span className="text-center">{s.score}</span>
              <span className="text-center font-bold">{s.grade}</span>
              <span className="text-center text-lys-teal">{s.career}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Real-Time Collaboration",
    subtitle: "Co-Create with Your Team",
    description: "Co-edit lesson plans live with invite codes, chat, and shared templates.",
    icon: <Users className="h-10 w-10" />,
    color: "text-lys-teal",
    bgGradient: "from-lys-teal/20 via-lys-teal/5 to-transparent",
    features: [
      { icon: <MessageSquare className="h-4 w-4" />, text: "Live Chat" },
      { icon: <Users className="h-4 w-4" />, text: "Cursor Presence" },
    ],
    visual: (
      <div className="w-full max-w-xs mx-auto">
        <div className="bg-card rounded-lg border p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex -space-x-2">
              {["A", "B", "C"].map((l, i) => (
                <div key={l} className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-background" style={{ backgroundColor: ["#E53935", "#00897B", "#F9A825"][i] }}>{l}</div>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">3 active</span>
            <Badge className="ml-auto bg-green-500/10 text-green-600 text-xs">Live</Badge>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-muted-foreground">Ms. Johnson editing objectives...</span></div>
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /><span className="text-muted-foreground">Mr. Davis reviewing standards...</span></div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Parent Portal v2",
    subtitle: "Free for Every Family · Now with Family Connect",
    description: "Parents connect via magic invite links, read teacher announcements, track their child's Be-Know-Do journey, and message teachers securely — all in one place.",
    icon: <Users className="h-10 w-10" />,
    color: "text-lys-yellow",
    bgGradient: "from-lys-yellow/20 via-lys-yellow/5 to-transparent",
    features: [
      { icon: <Heart className="h-4 w-4" />, text: "BKD Journey View" },
      { icon: <Briefcase className="h-4 w-4" />, text: "Career Readiness" },
      { icon: <MessageSquare className="h-4 w-4" />, text: "1-to-1 Secure Messaging" },
      { icon: <Layers className="h-4 w-4" />, text: "Magic Invite Links" },
    ],
    visual: (
      <div className="w-full max-w-xs mx-auto space-y-2">
        <div className="bg-card rounded-lg border p-3 space-y-2">
          <p className="text-xs text-muted-foreground font-roboto">Your Child's Progress</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Being", value: "82%", color: "text-lys-yellow" },
              { label: "Knowing", value: "75%", color: "text-lys-teal" },
              { label: "Doing", value: "88%", color: "text-lys-red" },
            ].map((p) => (
              <div key={p.label}>
                <div className={`text-lg font-bold font-oswald ${p.color}`}>{p.value}</div>
                <div className="text-[10px] text-muted-foreground">{p.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-lg border p-2 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-lys-teal flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">Ms. Johnson</p>
            <p className="text-[10px] text-muted-foreground truncate">Field trip forms due Friday!</p>
          </div>
          <span className="text-[10px] bg-lys-yellow/20 text-lys-yellow px-1.5 py-0.5 rounded-full">New</span>
        </div>
        <div className="bg-card rounded-lg border p-2 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-lys-red flex-shrink-0" />
          <p className="text-[10px] text-muted-foreground">Top match: Software Developer (94%)</p>
        </div>
      </div>
    ),
  },
  {
    title: "Teacher Communications Hub",
    subtitle: "Quiet Hours · Announcements · Portfolio Oversight",
    description: "Teachers set quiet hours so families aren't notified at midnight, post class-wide announcements to parents and students, and flag inappropriate portfolio items for review.",
    icon: <Layers className="h-10 w-10" />,
    color: "text-lys-teal",
    bgGradient: "from-lys-teal/20 via-lys-teal/5 to-transparent",
    features: [
      { icon: <Shield className="h-4 w-4" />, text: "Portfolio Oversight" },
      { icon: <FileText className="h-4 w-4" />, text: "Class Announcements" },
      { icon: <Brain className="h-4 w-4" />, text: "Quiet Hours Scheduling" },
    ],
    visual: (
      <div className="w-full max-w-xs mx-auto space-y-2">
        <div className="bg-card rounded-lg border p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <p className="text-xs font-medium">Field Trip Reminder</p>
          </div>
          <span className="text-[10px] text-muted-foreground">Parents</span>
        </div>
        <div className="bg-card rounded-lg border p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <p className="text-xs font-medium">Quiet Hours: 9pm–7am</p>
          </div>
          <span className="text-[10px] text-green-600">Active</span>
        </div>
        <div className="bg-card rounded-lg border p-2 flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-red-400" />
          <p className="text-xs text-muted-foreground">0 flagged portfolio items</p>
        </div>
      </div>
    ),
  },
  {
    title: "Scholarships & Mentors",
    subtitle: "Plan for the Future",
    description: "Scholarship planning, essay builder, strengths inventory, and mentor connections.",
    icon: <Award className="h-10 w-10" />,
    color: "text-lys-red",
    bgGradient: "from-lys-red/20 via-lys-yellow/5 to-transparent",
    features: [
      { icon: <DollarSign className="h-4 w-4" />, text: "Scholarship Finder" },
      { icon: <Users className="h-4 w-4" />, text: "Mentor Matching" },
    ],
    visual: (
      <div className="w-full max-w-xs mx-auto space-y-2">
        {[
          { name: "STEM Leaders Fund", amt: "$5,000", deadline: "Mar 2026" },
          { name: "First-Gen Scholars", amt: "$10,000", deadline: "Apr 2026" },
          { name: "Trade Skills Award", amt: "$3,000", deadline: "May 2026" },
        ].map((s) => (
          <div key={s.name} className="bg-card rounded-lg border p-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-oswald">{s.name}</p>
              <p className="text-xs text-muted-foreground">Due {s.deadline}</p>
            </div>
            <Badge className="bg-lys-yellow/10 text-lys-yellow border-lys-yellow/20 text-xs">{s.amt}</Badge>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "LYS Marketplace",
    subtitle: "eBooks, Courses & Educator Tools",
    description: "Browse and save educator resources — lesson plan packs, mini-courses, guides, and more — with category filters, wishlisting, and one-click access.",
    icon: <ShoppingBag className="h-10 w-10" />,
    color: "text-lys-teal",
    bgGradient: "from-lys-teal/20 via-lys-yellow/5 to-transparent",
    features: [
      { icon: <Bookmark className="h-4 w-4" />, text: "Personal Wishlist" },
      { icon: <Star className="h-4 w-4" />, text: "Category Filters" },
      { icon: <ShoppingBag className="h-4 w-4" />, text: "Free & Paid Items" },
    ],
    visual: (
      <div className="w-full max-w-xs mx-auto space-y-2">
        <div className="flex flex-wrap gap-1 mb-1">
          {["All", "Lesson Plans", "SEL", "STEM"].map((cat, i) => (
            <span key={cat} className={`text-[10px] font-oswald px-2 py-0.5 rounded-full border ${i === 0 ? "bg-lys-teal text-white border-lys-teal" : "text-muted-foreground border-border"}`}>{cat}</span>
          ))}
        </div>
        {[
          { title: "Growth Mindset Toolkit", type: "Resource Pack", price: "Free", wishlisted: true },
          { title: "Career Readiness eBook", type: "eBook", price: "$12.99", wishlisted: false },
          { title: "SEL Lesson Bundle", type: "Mini Course", price: "$29.99", wishlisted: false },
        ].map((item) => (
          <div key={item.title} className="bg-card rounded-lg border p-2 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-oswald truncate">{item.title}</p>
              <Badge variant="secondary" className="text-[10px]">{item.type}</Badge>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <span className={`text-xs font-oswald ${item.price === "Free" ? "text-green-600" : "text-lys-yellow"}`}>{item.price}</span>
              {item.wishlisted
                ? <BookmarkCheck className="h-3.5 w-3.5 text-lys-yellow" />
                : <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Professional Development",
    subtitle: "Courses + Curated Live Articles",
    description: "AI-recommended courses, certification tracking, and a live feed of curated educator articles pulled from the Content Hub RSS engine.",
    icon: <Star className="h-10 w-10" />,
    color: "text-lys-teal",
    bgGradient: "from-lys-teal/20 via-lys-teal/5 to-transparent",
    features: [
      { icon: <Brain className="h-4 w-4" />, text: "AI Recommendations" },
      { icon: <Rss className="h-4 w-4" />, text: "Live RSS Articles" },
      { icon: <Award className="h-4 w-4" />, text: "Cert Tracking" },
    ],
    visual: (
      <div className="w-full max-w-xs mx-auto space-y-2">
        <div className="bg-card rounded-lg border p-2">
          <p className="text-[10px] text-muted-foreground mb-1.5 font-oswald">LYS Courses</p>
          {[
            { course: "AI in the Classroom", hours: "6 hrs", status: "Complete" },
            { course: "SEL Strategies", hours: "3 hrs", status: "In Progress" },
          ].map((c) => (
            <div key={c.course} className="flex items-center justify-between text-xs py-0.5">
              <span className="font-roboto">{c.course}</span>
              <Badge variant="secondary" className="text-[10px]">{c.status}</Badge>
            </div>
          ))}
        </div>
        <div className="bg-card rounded-lg border p-2">
          <div className="flex items-center gap-1 mb-1.5">
            <Rss className="h-3 w-3 text-lys-yellow" />
            <p className="text-[10px] font-oswald text-muted-foreground">Curated Articles</p>
          </div>
          {["Edu-Steps: Vision to Reality", "Dealing with Pressure in Teaching"].map((a) => (
            <div key={a} className="flex items-center gap-1.5 text-xs py-0.5">
              <div className="w-1 h-1 rounded-full bg-lys-yellow shrink-0" />
              <span className="text-muted-foreground truncate">{a}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Multi-Tenant Security",
    subtitle: "7-Role RBAC & COPPA",
    description: "7-role hierarchy with support for ISDs, charter networks (CMO/EMO), and single-campus charters. PII protection, audit logging, and self-service org admin.",
    icon: <Shield className="h-10 w-10" />,
    color: "text-lys-yellow",
    bgGradient: "from-lys-yellow/20 via-lys-red/5 to-transparent",
    features: [
      { icon: <Lock className="h-4 w-4" />, text: "Zero-Trust" },
      { icon: <Shield className="h-4 w-4" />, text: "COPPA Compliant" },
    ],
    visual: (
      <div className="w-full max-w-xs mx-auto">
        <div className="bg-card rounded-lg border p-3 space-y-1.5">
          {[
            { role: "System Admin", color: "bg-red-500" },
            { role: "Site Admin", color: "bg-orange-500" },
            { role: "Network / ISD Admin", color: "bg-amber-500" },
            { role: "Campus Admin", color: "bg-yellow-500" },
            { role: "Educator", color: "bg-emerald-500" },
            { role: "Parent", color: "bg-teal-500" },
            { role: "Student", color: "bg-blue-500" },
          ].map((r, i) => (
            <div key={r.role} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${r.color}`} />
              <span className="text-xs font-roboto flex-1">{r.role}</span>
              <div className="h-1 rounded-full bg-muted" style={{ width: `${((7 - i) / 7) * 100}%`, minWidth: "16px" }}>
                <div className={`h-full rounded-full ${r.color}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Three Client Structures",
    subtitle: "Charter, ISD & Network",
    description: "LYS supports Single-Campus Charters, Traditional ISDs, and Multi-State Charter Networks (CMO/EMO) — each with tailored tiers and admin tools.",
    icon: <Building2 className="h-10 w-10" />,
    color: "text-lys-teal",
    bgGradient: "from-lys-teal/20 via-lys-yellow/5 to-transparent",
    features: [
      { icon: <Layers className="h-4 w-4" />, text: "Flexible Hierarchy" },
      { icon: <Globe className="h-4 w-4" />, text: "Multi-State Support" },
    ],
    visual: (
      <div className="w-full max-w-xs mx-auto space-y-2">
        {[
          { type: "Single-Campus Charter", tier: `Campus — $${PLAN_PRICES.campus}/mo`, desc: "Independent school, full customization", color: "bg-lys-yellow" },
          { type: "Traditional ISD", tier: `Enterprise — $${PLAN_PRICES.enterprise}/mo`, desc: "Multi-campus district, elected board", color: "bg-lys-teal" },
          { type: "Charter Network (CMO/EMO)", tier: `Enterprise — $${PLAN_PRICES.enterprise}/mo`, desc: "Multi-state HQ with master dashboard", color: "bg-lys-red" },
        ].map((s) => (
          <div key={s.type} className="bg-card rounded-lg border p-2 flex items-center gap-2">
            <div className={`w-2 h-full min-h-[2rem] rounded-full ${s.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-oswald">{s.type}</p>
              <p className="text-[10px] text-muted-foreground truncate">{s.desc}</p>
            </div>
            <Badge variant="secondary" className="text-[10px] shrink-0">{s.tier}</Badge>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Org Admin Self-Service",
    subtitle: "Campus, ISD & Charter Network Management",
    description: "Manage members, roles, invitations, and org settings for campuses, ISDs, and charter networks without needing system admin help.",
    icon: <Layers className="h-10 w-10" />,
    color: "text-lys-teal",
    bgGradient: "from-lys-teal/20 via-lys-yellow/5 to-transparent",
    features: [
      { icon: <Users className="h-4 w-4" />, text: "Member Management" },
      { icon: <Shield className="h-4 w-4" />, text: "Role Assignment" },
    ],
    visual: (
      <div className="w-full max-w-xs mx-auto">
        <div className="bg-card rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-oswald">KIPP Charter Network</span>
            <Badge variant="secondary" className="text-[10px]">CMO</Badge>
          </div>
          {[
            { action: "New campus added: KIPP Austin", time: "2m ago" },
            { action: "Role changed: Mr. Chen \u2192 Campus Admin", time: "1h ago" },
            { action: "Per-state compliance updated (TX)", time: "3h ago" },
          ].map((a) => (
            <div key={a.action} className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
              <span className="text-muted-foreground truncate">{a.action}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "SIS Integration",
    subtitle: "Clever Live · 5 More Coming Soon",
    description: "Sync students and classes with Clever today. PowerSchool, Canvas LMS, Infinite Campus, Skyward, and OneRoster integrations are in development.",
    icon: <Globe className="h-10 w-10" />,
    color: "text-lys-red",
    bgGradient: "from-lys-red/20 via-lys-teal/5 to-transparent",
    features: [
      { icon: <CheckCircle2 className="h-4 w-4" />, text: "Clever — Live Now" },
      { icon: <Layers className="h-4 w-4" />, text: "5 More Coming Soon" },
    ],
    visual: (
      <div className="w-full max-w-xs mx-auto">
        <div className="bg-card rounded-lg border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="bg-muted/50 rounded p-1.5 flex-1 text-center border border-green-500/30">
              <p className="text-[10px] font-oswald text-green-600">✓ Clever</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {["PowerSchool", "Canvas", "Infinite Campus", "Skyward", "OneRoster"].map((p) => (
              <div key={p} className="bg-muted/30 rounded p-1 text-center border border-amber-500/20">
                <p className="text-[9px] font-oswald text-muted-foreground">{p}</p>
                <p className="text-[8px] text-amber-500">Soon</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Help Desk",
    subtitle: "40+ Knowledge Articles",
    description: "Searchable help with troubleshooting guides, admin docs, and developer reference.",
    icon: <HelpCircle className="h-10 w-10" />,
    color: "text-lys-yellow",
    bgGradient: "from-lys-yellow/20 via-lys-yellow/5 to-transparent",
    features: [
      { icon: <BookOpen className="h-4 w-4" />, text: "Searchable KB" },
      { icon: <FileText className="h-4 w-4" />, text: "Admin Guides" },
    ],
    visual: (
      <div className="w-full max-w-xs mx-auto space-y-2">
        {["How do I create an AI lesson plan?", "Managing campus members", "Setting up SIS integration"].map((q) => (
          <div key={q} className="bg-card rounded-lg border p-2 flex items-center gap-2">
            <HelpCircle className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-xs font-roboto">{q}</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto shrink-0" />
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Global Pricing",
    subtitle: "Equitable Access Worldwide",
    description: "Country Affordability Index ensures fair pricing based on local purchasing power.",
    icon: <DollarSign className="h-10 w-10" />,
    color: "text-lys-teal",
    bgGradient: "from-lys-teal/20 via-lys-red/5 to-transparent",
    features: [
      { icon: <Globe className="h-4 w-4" />, text: "190+ Countries" },
      { icon: <DollarSign className="h-4 w-4" />, text: "Purchasing Power Pricing" },
    ],
    visual: (
      <div className="w-full max-w-xs mx-auto">
        <div className="bg-card rounded-lg border p-3 space-y-2">
          {[
            { country: "United States", price: "$19.99/mo", idx: "1.00" },
            { country: "Brazil", price: "$6.99/mo", idx: "0.35" },
            { country: "India", price: "$3.99/mo", idx: "0.20" },
          ].map((c) => (
            <div key={c.country} className="flex items-center justify-between text-xs">
              <span className="font-roboto">{c.country}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">CAI: {c.idx}</span>
                <Badge variant="secondary" className="text-[10px]">{c.price}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Start Your Journey",
    subtitle: "Join 10,000+ Educators",
    description: "Free to start. AI lessons, 40+ careers, and student success tracking — all in one platform.",
    icon: <GraduationCap className="h-10 w-10" />,
    color: "text-lys-red",
    bgGradient: "from-lys-red/20 via-lys-yellow/10 to-lys-teal/20",
    features: [
      { icon: <Sparkles className="h-4 w-4" />, text: "Free AI Tools" },
      { icon: <Briefcase className="h-4 w-4" />, text: "40+ Careers" },
      { icon: <GraduationCap className="h-4 w-4" />, text: "Success Tracking" },
    ],
    visual: (
      <div className="flex items-center justify-center gap-4">
        {[
          { val: "10K+", label: "Educators", color: "text-lys-red" },
          { val: "40+", label: "Careers", color: "text-lys-teal" },
          { val: "50", label: "States", color: "text-lys-yellow" },
        ].map((s, i) => (
          <div key={s.label} className="text-center animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className={`text-2xl font-bold font-oswald ${s.color}`}>{s.val}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    ),
  },
];

const SLIDE_DURATION = 4000;

interface DemoVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoVideoModal({ open, onOpenChange }: DemoVideoModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [slideProgress, setSlideProgress] = useState(0);

  const totalSlides = slides.length;
  const slide = slides[currentSlide];

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    setSlideProgress(0);
  }, []);

  const nextSlide = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      goToSlide(currentSlide + 1);
    } else {
      setIsPlaying(false);
      setSlideProgress(100);
    }
  }, [currentSlide, totalSlides, goToSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  }, [currentSlide, goToSlide]);

  useEffect(() => {
    if (!open) {
      setCurrentSlide(0);
      setSlideProgress(0);
      setIsPlaying(true);
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!isPlaying || !open) return;

    const interval = setInterval(() => {
      setSlideProgress((prev) => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + 100 / (SLIDE_DURATION / 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, open, nextSlide]);

  const totalDuration = totalSlides * SLIDE_DURATION;
  const overallProgress =
    ((currentSlide * SLIDE_DURATION + (slideProgress / 100) * SLIDE_DURATION) / totalDuration) * 100;

  const elapsed = Math.floor(overallProgress * (totalDuration / 100000));
  const totalSec = Math.floor(totalDuration / 1000);
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden [&>button]:hidden" data-testid="demo-video-modal" aria-describedby={undefined}>
        <VisuallyHidden><DialogTitle>LYS Platform Demo</DialogTitle></VisuallyHidden>
        <div className="relative">
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-lys-red transition-all duration-100"
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          <div className="flex items-center gap-0.5 px-3 py-1.5 bg-muted/50">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className="flex-1 h-1 rounded-full transition-all cursor-pointer"
                style={{
                  backgroundColor:
                    i < currentSlide
                      ? "hsl(var(--lys-red))"
                      : i === currentSlide
                        ? "hsl(var(--lys-yellow))"
                        : "hsl(var(--muted))",
                  opacity: i <= currentSlide ? 1 : 0.4,
                }}
                data-testid={`demo-slide-indicator-${i}`}
              />
            ))}
          </div>

          <div
            className={`bg-gradient-to-br ${slide.bgGradient} min-h-[380px] flex flex-col`}
            key={currentSlide}
          >
            <div className="flex-1 p-5 sm:p-6 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`${slide.color}`}>{slide.icon}</div>
                  <div>
                    <h2 className="font-marker text-lg sm:text-xl">{slide.title}</h2>
                    <p className="font-oswald text-xs text-muted-foreground">{slide.subtitle}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => onOpenChange(false)}
                  data-testid="demo-close-button"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <p className="font-roboto text-sm text-muted-foreground mb-4 max-w-md leading-relaxed animate-fade-in">
                {slide.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {slide.features.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 bg-card/60 backdrop-blur rounded-full px-2.5 py-1 border text-xs font-roboto animate-fade-up"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {f.icon}
                    {f.text}
                  </div>
                ))}
              </div>

              <div className="flex-1 flex items-center justify-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
                {slide.visual}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-2.5 bg-card border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsPlaying(!isPlaying)}
                data-testid="demo-play-pause"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <span className="text-xs text-muted-foreground font-roboto tabular-nums">
                {formatTime(elapsed)} / {formatTime(totalSec)}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={prevSlide}
                disabled={currentSlide === 0}
                data-testid="demo-prev-slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground font-roboto min-w-[3rem] text-center">
                {currentSlide + 1} / {totalSlides}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={nextSlide}
                disabled={currentSlide === totalSlides - 1}
                data-testid="demo-next-slide"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
