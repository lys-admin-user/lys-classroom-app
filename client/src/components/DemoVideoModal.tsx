import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
    description:
      "An AI-powered educational platform built on the Be-Know-Do methodology — bridging academic preparation with real-world success.",
    icon: <GraduationCap className="h-10 w-10" />,
    color: "text-lys-red",
    bgGradient: "from-lys-red/20 via-lys-yellow/10 to-lys-teal/20",
    features: [
      { icon: <Brain className="h-4 w-4" />, text: "AI-Powered Lesson Planning" },
      { icon: <Briefcase className="h-4 w-4" />, text: "40+ Career Pathways" },
      { icon: <Shield className="h-4 w-4" />, text: "Zero-Trust Data Governance" },
    ],
    visual: (
      <div className="flex items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-2 animate-fade-up">
          <div className="w-16 h-16 rounded-2xl bg-lys-yellow/20 flex items-center justify-center">
            <Heart className="h-8 w-8 text-lys-yellow" />
          </div>
          <span className="text-sm font-oswald text-lys-yellow">BE</span>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
        <div className="flex flex-col items-center gap-2 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="w-16 h-16 rounded-2xl bg-lys-teal/20 flex items-center justify-center">
            <Compass className="h-8 w-8 text-lys-teal" />
          </div>
          <span className="text-sm font-oswald text-lys-teal">KNOW</span>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
        <div className="flex flex-col items-center gap-2 animate-fade-up" style={{ animationDelay: "0.4s" }}>
          <div className="w-16 h-16 rounded-2xl bg-lys-red/20 flex items-center justify-center">
            <Target className="h-8 w-8 text-lys-red" />
          </div>
          <span className="text-sm font-oswald text-lys-red">DO</span>
        </div>
      </div>
    ),
  },
  {
    title: "BE — Discover Your Identity",
    subtitle: "Self-Discovery Assessments",
    description:
      "Students explore who they are through guided self-assessments. Discover strengths, values, and personality traits that shape their unique identity.",
    icon: <Heart className="h-10 w-10" />,
    color: "text-lys-yellow",
    bgGradient: "from-lys-yellow/20 via-lys-yellow/5 to-transparent",
    features: [
      { icon: <Lightbulb className="h-4 w-4" />, text: "Strengths & Values Assessment" },
      { icon: <Users className="h-4 w-4" />, text: "Digital Portfolio Builder" },
      { icon: <CheckCircle2 className="h-4 w-4" />, text: "Milestone Achievement Tracking" },
    ],
    visual: (
      <div className="space-y-3 w-full max-w-xs mx-auto">
        <div className="bg-card rounded-lg border p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-oswald">Identity Score</span>
            <span className="text-lg font-bold text-lys-yellow">78%</span>
          </div>
          <Progress value={78} className="h-2" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["Creative", "Empathetic", "Leader"].map((trait) => (
            <Badge key={trait} variant="secondary" className="justify-center text-xs py-1">
              {trait}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          <span>3 milestones completed this week</span>
        </div>
      </div>
    ),
  },
  {
    title: "KNOW — Explore Career Pathways",
    subtitle: "40+ Careers with Real Market Data",
    description:
      "Browse careers powered by Bureau of Labor Statistics data. Filter by education pathway — from trade school to bachelor's degrees — and see salary data by state.",
    icon: <Compass className="h-10 w-10" />,
    color: "text-lys-teal",
    bgGradient: "from-lys-teal/20 via-lys-teal/5 to-transparent",
    features: [
      { icon: <TrendingUp className="h-4 w-4" />, text: "Live BLS Market Data" },
      { icon: <Globe className="h-4 w-4" />, text: "State-by-State Salary Info" },
      { icon: <BarChart3 className="h-4 w-4" />, text: "BKD Career Alignment Matching" },
    ],
    visual: (
      <div className="space-y-2 w-full max-w-xs mx-auto">
        {[
          { title: "AI/ML Engineer", salary: "$112K–$189K", growth: "+23%", hot: true },
          { title: "Cybersecurity Analyst", salary: "$85K–$145K", growth: "+33%", hot: true },
          { title: "UX/UI Designer", salary: "$68K–$125K", growth: "+16%", hot: false },
        ].map((career) => (
          <div key={career.title} className="bg-card rounded-lg border p-2.5 flex items-center justify-between">
            <div>
              <p className="text-sm font-oswald">{career.title}</p>
              <p className="text-xs text-muted-foreground">{career.salary}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                {career.growth}
              </Badge>
              {career.hot && (
                <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-xs">Hot</Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "DO — AI Lesson Planning",
    subtitle: "Generate Rubric-Scored Lessons in Seconds",
    description:
      "Educators enter a topic and grade level — our AI generates a complete lesson plan scored against a 6-category rubric. Save 45+ minutes per lesson.",
    icon: <Target className="h-10 w-10" />,
    color: "text-lys-red",
    bgGradient: "from-lys-red/20 via-lys-red/5 to-transparent",
    features: [
      { icon: <Sparkles className="h-4 w-4" />, text: "AI-Generated Lesson Plans" },
      { icon: <BookOpen className="h-4 w-4" />, text: "6-Category Quality Rubric" },
      { icon: <CheckCircle2 className="h-4 w-4" />, text: "Standards-Aligned Curriculum" },
    ],
    visual: (
      <div className="w-full max-w-xs mx-auto space-y-3">
        <div className="bg-card rounded-lg border p-3">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-lys-red" />
            <span className="text-sm font-oswald">AI Lesson Generated</span>
            <Badge className="ml-auto bg-green-500/10 text-green-600 text-xs">
              Score: 92/100
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            "Growth Mindset for 9th Grade — Science"
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {["Objectives", "Activities", "Assessment", "Standards"].map((cat) => (
              <div key={cat} className="flex items-center gap-1 text-xs">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>{cat}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-green-600">
          <TrendingUp className="h-3 w-3" />
          <span className="font-roboto">Saved 45 minutes of planning time</span>
        </div>
      </div>
    ),
  },
  {
    title: "Scope & Sequence Builder",
    subtitle: "Plan Your Entire Curriculum",
    description:
      "Map out your school year with a drag-and-drop curriculum planner. Track pacing, align to standards, and share across your department or district.",
    icon: <BookOpen className="h-10 w-10" />,
    color: "text-lys-teal",
    bgGradient: "from-lys-teal/20 via-lys-yellow/5 to-transparent",
    features: [
      { icon: <BarChart3 className="h-4 w-4" />, text: "Pacing & Progress Tracking" },
      { icon: <Globe className="h-4 w-4" />, text: "Campus & District-Wide Sharing" },
      { icon: <CheckCircle2 className="h-4 w-4" />, text: "Automatic Standards Extraction" },
    ],
    visual: (
      <div className="w-full max-w-xs mx-auto space-y-2">
        {[
          { week: "Weeks 1–3", unit: "Introduction to Algebra", progress: 100 },
          { week: "Weeks 4–6", unit: "Linear Equations", progress: 65 },
          { week: "Weeks 7–9", unit: "Graphing & Functions", progress: 10 },
        ].map((item) => (
          <div key={item.unit} className="bg-card rounded-lg border p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{item.week}</span>
              <span className="text-xs font-oswald">{item.progress}%</span>
            </div>
            <p className="text-sm font-oswald mb-1.5">{item.unit}</p>
            <Progress value={item.progress} className="h-1.5" />
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Multi-Tenant & Secure",
    subtitle: "Built for Schools, Districts & Beyond",
    description:
      "7-role RBAC from student to system admin. COPPA compliance, PII protection, audit logging, and self-service org administration for campus and district admins.",
    icon: <Shield className="h-10 w-10" />,
    color: "text-lys-yellow",
    bgGradient: "from-lys-yellow/20 via-lys-red/5 to-transparent",
    features: [
      { icon: <Lock className="h-4 w-4" />, text: "Zero-Trust Data Governance" },
      { icon: <Users className="h-4 w-4" />, text: "7-Role Access Control" },
      { icon: <Shield className="h-4 w-4" />, text: "COPPA Compliance & PII Protection" },
    ],
    visual: (
      <div className="w-full max-w-xs mx-auto">
        <div className="bg-card rounded-lg border p-3 space-y-2">
          {[
            { role: "System Admin", level: 6, color: "bg-red-500" },
            { role: "Site Admin", level: 5, color: "bg-orange-500" },
            { role: "District Admin", level: 4, color: "bg-amber-500" },
            { role: "Campus Admin", level: 3, color: "bg-yellow-500" },
            { role: "Educator", level: 2, color: "bg-emerald-500" },
            { role: "Parent", level: 1, color: "bg-teal-500" },
            { role: "Student", level: 0, color: "bg-blue-500" },
          ].map((r) => (
            <div key={r.role} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${r.color}`} />
              <span className="text-xs font-roboto flex-1">{r.role}</span>
              <div className="h-1.5 rounded-full bg-muted" style={{ width: `${((r.level + 1) / 7) * 100}%`, minWidth: "20px" }}>
                <div className={`h-full rounded-full ${r.color}`} style={{ width: "100%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Real-Time Collaboration",
    subtitle: "Co-Create with Your Team",
    description:
      "Invite colleagues to co-edit lesson plans in real time. See live cursors, chat in context, and share templates through the community resource library.",
    icon: <Users className="h-10 w-10" />,
    color: "text-lys-teal",
    bgGradient: "from-lys-teal/20 via-lys-teal/5 to-transparent",
    features: [
      { icon: <Users className="h-4 w-4" />, text: "Live Cursor & Presence" },
      { icon: <BookOpen className="h-4 w-4" />, text: "Shared Template Library" },
      { icon: <Globe className="h-4 w-4" />, text: "Invite Codes for Quick Access" },
    ],
    visual: (
      <div className="w-full max-w-xs mx-auto space-y-3">
        <div className="bg-card rounded-lg border p-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex -space-x-2">
              {["A", "B", "C"].map((l, i) => (
                <div
                  key={l}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-background"
                  style={{
                    backgroundColor: ["#E53935", "#00897B", "#F9A825"][i],
                  }}
                >
                  {l}
                </div>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">3 editors active</span>
            <Badge className="ml-auto bg-green-500/10 text-green-600 text-xs">Live</Badge>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Ms. Johnson editing objectives...</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Mr. Davis reviewing standards...</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Start Your Journey Today",
    subtitle: "Join 10,000+ Educators",
    description:
      "LYS is free to get started. Create AI lesson plans, explore 40+ careers, and help your students discover their path to success.",
    icon: <GraduationCap className="h-10 w-10" />,
    color: "text-lys-red",
    bgGradient: "from-lys-red/20 via-lys-yellow/10 to-lys-teal/20",
    features: [
      { icon: <Sparkles className="h-4 w-4" />, text: "Free AI Lesson Planning" },
      { icon: <Briefcase className="h-4 w-4" />, text: "40+ Career Explorations" },
      { icon: <GraduationCap className="h-4 w-4" />, text: "Student Success Tracking" },
    ],
    visual: (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-3xl font-bold font-oswald text-lys-red">10K+</div>
            <div className="text-xs text-muted-foreground">Educators</div>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="text-center">
            <div className="text-3xl font-bold font-oswald text-lys-teal">40+</div>
            <div className="text-xs text-muted-foreground">Careers</div>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="text-center">
            <div className="text-3xl font-bold font-oswald text-lys-yellow">50</div>
            <div className="text-xs text-muted-foreground">States</div>
          </div>
        </div>
      </div>
    ),
  },
];

const SLIDE_DURATION = 15000;

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
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden [&>button]:hidden" data-testid="demo-video-modal">
        <div className="relative">
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-lys-red transition-all duration-100"
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          <div className="flex items-center gap-1 px-3 py-1.5 bg-muted/50">
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
            className={`bg-gradient-to-br ${slide.bgGradient} min-h-[420px] flex flex-col`}
            key={currentSlide}
          >
            <div className="flex-1 p-6 sm:p-8 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`${slide.color}`}>{slide.icon}</div>
                  <div>
                    <h2 className="font-marker text-xl sm:text-2xl">{slide.title}</h2>
                    <p className="font-oswald text-sm text-muted-foreground">{slide.subtitle}</p>
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

              <p className="font-roboto text-sm text-muted-foreground mb-6 max-w-md leading-relaxed animate-fade-in">
                {slide.description}
              </p>

              <div className="flex flex-wrap gap-3 mb-6">
                {slide.features.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-card/60 backdrop-blur rounded-full px-3 py-1.5 border text-xs font-roboto animate-fade-up"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  >
                    {f.icon}
                    {f.text}
                  </div>
                ))}
              </div>

              <div className="flex-1 flex items-center justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
                {slide.visual}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-3 bg-card border-t">
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
