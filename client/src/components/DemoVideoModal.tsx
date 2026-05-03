import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PLAN_PRICES, SEAT_PRICES, SEAT_MINIMUMS, FREE_LESSON_LIMIT } from "@/lib/pricing";
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
  Brain,
  GraduationCap,
  Play,
  Pause,
  X,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Building2,
  Briefcase,
  ClipboardList,
  CheckCircle2,
  Globe,
  Wand2,
} from "lucide-react";
import pricingScreenshot from "@assets/demo/pricing.jpg";

interface DemoSlide {
  id: string;
  duration: number; // ms
  narration: string;
  eyebrow: string;
  title: string;
  body: string;
  accent: string; // tailwind text class
  accentBg: string; // tailwind bg class
  bg: string; // background gradient
  visual: React.ReactNode;
}

const slides: DemoSlide[] = [
  {
    id: "hook",
    duration: 9000,
    narration:
      "Welcome to LYS — Laddering Your Success. Education that connects who you are to where you're going.",
    eyebrow: "LYS — Laddering Your Success",
    title: "Education that ladders to real life.",
    body: "AI-powered learning built on Be, Know, Do — bridging academics with real-world success.",
    accent: "text-lys-red",
    accentBg: "bg-lys-red",
    bg: "from-lys-red/30 via-lys-yellow/15 to-lys-teal/25",
    visual: (
      <div className="flex items-center justify-center gap-6 sm:gap-10">
        {[
          { Icon: Heart, label: "BE", color: "text-lys-yellow", bg: "bg-lys-yellow/20", desc: "Identity" },
          { Icon: Compass, label: "KNOW", color: "text-lys-teal", bg: "bg-lys-teal/20", desc: "Careers" },
          { Icon: Target, label: "DO", color: "text-lys-red", bg: "bg-lys-red/20", desc: "Action" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: 24, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.18, type: "spring", stiffness: 220, damping: 18 }}
          >
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl ${item.bg} flex items-center justify-center shadow-lg ring-1 ring-white/20`}>
              <item.Icon className={`h-10 w-10 sm:h-12 sm:w-12 ${item.color}`} />
            </div>
            <span className="font-marker text-xl sm:text-2xl">{item.label}</span>
            <span className="text-[11px] sm:text-xs text-muted-foreground font-roboto">{item.desc}</span>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: "be",
    duration: 9000,
    narration:
      "It starts with BE — students discover their strengths, values, and identity through guided assessments.",
    eyebrow: "BE — Self-Discovery",
    title: "Discover who you are first.",
    body: "Guided assessments help students name their strengths, values, and personality before choosing a path.",
    accent: "text-lys-yellow",
    accentBg: "bg-lys-yellow",
    bg: "from-lys-yellow/30 via-lys-yellow/10 to-background",
    visual: (
      <div className="w-full max-w-md mx-auto space-y-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border p-4 shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-oswald text-sm">Identity Score</span>
            <span className="font-oswald text-2xl font-bold text-lys-yellow">78%</span>
          </div>
          <Progress value={78} className="h-2.5" />
        </motion.div>
        <div className="grid grid-cols-3 gap-2">
          {["Creative", "Empathetic", "Leader", "Resilient", "Curious", "Collaborative"].map((trait, i) => (
            <motion.div
              key={trait}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 + i * 0.06 }}
            >
              <Badge variant="secondary" className="w-full justify-center py-1.5 text-xs">
                {trait}
              </Badge>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "know",
    duration: 10000,
    narration:
      "Then KNOW — 40-plus career paths, matched to each student using our Be-Know-Do model.",
    eyebrow: "KNOW — Career Explorer",
    title: "40+ careers, matched to every student.",
    body: "Our BKD matching engine recommends careers based on identity, strengths, and interests — not just test scores.",
    accent: "text-lys-teal",
    accentBg: "bg-lys-teal",
    bg: "from-lys-teal/25 via-lys-teal/10 to-background",
    visual: (
      <div className="w-full max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: "Software Engineer", match: 94, icon: Brain, color: "text-lys-teal" },
            { name: "UX Designer", match: 89, icon: Sparkles, color: "text-lys-yellow" },
            { name: "Data Scientist", match: 85, icon: Briefcase, color: "text-lys-red" },
            { name: "Product Manager", match: 81, icon: Compass, color: "text-lys-teal" },
          ].map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-card rounded-xl border p-3 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <c.icon className={`h-4 w-4 ${c.color}`} />
                <span className="text-xs font-oswald truncate">{c.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <Progress value={c.match} className="h-1.5 flex-1 mr-2" />
                <span className={`text-xs font-bold ${c.color}`}>{c.match}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "do",
    duration: 10000,
    narration:
      "And DO — educators generate standards-aligned lessons in seconds with our AI lesson planner.",
    eyebrow: "DO — AI Lesson Planner",
    title: "Standards-aligned lessons in seconds.",
    body: "Generate full lesson plans, scope & sequence, and assignments — aligned to your state's standards.",
    accent: "text-lys-red",
    accentBg: "bg-lys-red",
    bg: "from-lys-red/25 via-lys-yellow/10 to-background",
    visual: (
      <div className="w-full max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border p-4 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-3">
            <Wand2 className="h-4 w-4 text-lys-red" />
            <span className="font-oswald text-sm">AI Lesson Generator</span>
            <Badge variant="secondary" className="ml-auto text-[10px]">TEKS</Badge>
          </div>
          <div className="text-xs font-roboto text-muted-foreground mb-2">
            Algebra I · Linear Functions · 9th grade
          </div>
          <div className="space-y-1.5">
            {[
              "Objectives: Solve y = mx + b",
              "Warm-up: 5-min slope review",
              "Activity: Real-world data plotting",
              "Assessment: 10-question exit ticket",
            ].map((line, i) => (
              <motion.div
                key={line}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.15 }}
                className="flex items-start gap-2 text-xs font-roboto"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-lys-teal flex-shrink-0 mt-0.5" />
                <span>{line}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    ),
  },
  {
    id: "educators",
    duration: 10000,
    narration:
      "Built for educators — assignments, gradebook, parent portal, and real-time collaboration in one place.",
    eyebrow: "For Educators",
    title: "One platform. Every classroom tool.",
    body: "Assignments, gradebook, parent portal, scope & sequence, and real-time collaboration — all integrated.",
    accent: "text-lys-teal",
    accentBg: "bg-lys-teal",
    bg: "from-lys-teal/20 via-lys-red/10 to-background",
    visual: (
      <div className="w-full max-w-lg mx-auto grid grid-cols-3 gap-2.5">
        {[
          { label: "Assignments", icon: ClipboardList, color: "bg-lys-red/20 text-lys-red" },
          { label: "Gradebook", icon: CheckCircle2, color: "bg-lys-teal/20 text-lys-teal" },
          { label: "Parent Portal", icon: Heart, color: "bg-lys-yellow/20 text-lys-yellow" },
          { label: "Scope & Sequence", icon: Compass, color: "bg-lys-teal/20 text-lys-teal" },
          { label: "Collaboration", icon: Sparkles, color: "bg-lys-red/20 text-lys-red" },
          { label: "Mentors", icon: GraduationCap, color: "bg-lys-yellow/20 text-lys-yellow" },
        ].map((tool, i) => (
          <motion.div
            key={tool.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="bg-card rounded-xl border p-3 flex flex-col items-center gap-1.5 shadow-sm"
          >
            <div className={`w-10 h-10 rounded-lg ${tool.color} flex items-center justify-center`}>
              <tool.icon className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-oswald text-center">{tool.label}</span>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: "schools",
    duration: 10000,
    narration:
      "Built for schools too — single campuses, full districts, and multi-state charter networks all run on LYS.",
    eyebrow: "For Schools, Districts & Networks",
    title: "Scales from one campus to a national network.",
    body: "Multi-tenant architecture supports single-campus charters, traditional ISDs, and multi-state CMOs/EMOs like KIPP and IDEA.",
    accent: "text-lys-yellow",
    accentBg: "bg-lys-yellow",
    bg: "from-lys-yellow/20 via-lys-teal/10 to-background",
    visual: (
      <div className="w-full max-w-md mx-auto space-y-2">
        {[
          { type: "Single-Campus Charter", tier: "Campus tier", icon: Building2, color: "text-lys-yellow", barColor: "bg-lys-yellow" },
          { type: "Traditional ISD", tier: "Enterprise tier", icon: Building2, color: "text-lys-teal", barColor: "bg-lys-teal" },
          { type: "Multi-State Charter Network", tier: "Enterprise tier", icon: Globe, color: "text-lys-red", barColor: "bg-lys-red" },
        ].map((s, i) => (
          <motion.div
            key={s.type}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.15 }}
            className="bg-card rounded-xl border p-3 flex items-center gap-3 shadow-sm"
          >
            <div className={`w-1.5 self-stretch rounded-full ${s.barColor}`} />
            <s.icon className={`h-5 w-5 ${s.color} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-oswald truncate">{s.type}</div>
              <div className="text-[11px] text-muted-foreground font-roboto">{s.tier}</div>
            </div>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: "pricing",
    duration: 10000,
    narration:
      "Simple, equitable pricing. Free to start. Pro for individuals. Campus and Enterprise plans for teams — with global income-adjusted pricing.",
    eyebrow: "Simple, Equitable Pricing",
    title: "Free to start. Built to scale.",
    body: `Pro at $${PLAN_PRICES.pro}/mo. Campus from $${PLAN_PRICES.campus}/mo + $${SEAT_PRICES.campus}/seat. Enterprise from $${PLAN_PRICES.enterprise}/mo + $${SEAT_PRICES.enterprise}/seat.`,
    accent: "text-lys-red",
    accentBg: "bg-lys-red",
    bg: "from-lys-red/20 via-lys-yellow/10 to-lys-teal/15",
    visual: (
      <div className="w-full max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border overflow-hidden shadow-lg bg-card"
        >
          <img
            src={pricingScreenshot}
            alt="LYS pricing page"
            className="w-full h-auto block"
            data-testid="img-demo-pricing-screenshot"
          />
        </motion.div>
        <div className="space-y-2">
          {[
            { name: "Free", price: "$0", note: `${FREE_LESSON_LIMIT} AI lessons/mo`, color: "border-l-muted" },
            { name: "Pro", price: `$${PLAN_PRICES.pro}/mo`, note: "Unlimited, no ads", color: "border-l-lys-red" },
            { name: "Campus", price: `$${PLAN_PRICES.campus}/mo + $${SEAT_PRICES.campus}/seat`, note: `${SEAT_MINIMUMS.campus} seat min`, color: "border-l-lys-teal" },
            { name: "Enterprise", price: `$${PLAN_PRICES.enterprise}/mo + $${SEAT_PRICES.enterprise}/seat`, note: `${SEAT_MINIMUMS.enterprise} seat min`, color: "border-l-lys-yellow" },
          ].map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.1 }}
              className={`bg-card rounded-lg border border-l-4 ${tier.color} p-2.5`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-oswald text-sm">{tier.name}</span>
                <span className="font-oswald text-xs font-bold text-right">{tier.price}</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-roboto">{tier.note}</div>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "cta",
    duration: 8000,
    narration:
      "Start free today. Join 10,000-plus educators laddering students to success.",
    eyebrow: "Start Your Journey",
    title: "Free to start. No card required.",
    body: "Join 10,000+ educators using LYS to ladder students from identity to action.",
    accent: "text-lys-red",
    accentBg: "bg-lys-red",
    bg: "from-lys-red/30 via-lys-yellow/15 to-lys-teal/25",
    visual: (
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center justify-center gap-8 sm:gap-12">
          {[
            { val: "10K+", label: "Educators", color: "text-lys-red" },
            { val: "40+", label: "Careers", color: "text-lys-teal" },
            { val: "50", label: "States", color: "text-lys-yellow" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.15, type: "spring", stiffness: 200 }}
              className="text-center"
            >
              <div className={`text-4xl sm:text-5xl font-bold font-oswald ${s.color}`}>{s.val}</div>
              <div className="text-xs text-muted-foreground font-roboto mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            size="lg"
            className="bg-lys-red hover:bg-lys-red/90 text-white font-oswald text-base px-8 shadow-lg"
            onClick={() => {
              window.location.href = "/api/login";
            }}
            data-testid="button-demo-cta-start"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Start Free Today
          </Button>
        </motion.div>
      </div>
    ),
  },
];

const TOTAL_MS = slides.reduce((sum, s) => sum + s.duration, 0);
const TICK_MS = 50;

interface DemoVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoVideoModal({ open, onOpenChange }: DemoVideoModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [slideElapsed, setSlideElapsed] = useState(0);
  const [audioOn, setAudioOn] = useState(false);
  const lastNarratedRef = useRef<number>(-1);

  const slide = slides[currentSlide];
  const totalSlides = slides.length;

  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.05;
    utt.pitch = 1.0;
    utt.volume = 1.0;
    window.speechSynthesis.speak(utt);
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      stopSpeech();
      lastNarratedRef.current = -1;
      setCurrentSlide(index);
      setSlideElapsed(0);
    },
    [stopSpeech],
  );

  const nextSlide = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      goToSlide(currentSlide + 1);
    } else {
      stopSpeech();
      setIsPlaying(false);
    }
  }, [currentSlide, totalSlides, goToSlide, stopSpeech]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) goToSlide(currentSlide - 1);
  }, [currentSlide, goToSlide]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      stopSpeech();
      setCurrentSlide(0);
      setSlideElapsed(0);
      setIsPlaying(true);
      lastNarratedRef.current = -1;
    }
  }, [open, stopSpeech]);

  // Unconditional speech cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Tick timer — pure increment; auto-advance is handled in a separate effect
  useEffect(() => {
    if (!isPlaying || !open) return;
    const interval = setInterval(() => {
      setSlideElapsed((prev) => prev + TICK_MS);
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [isPlaying, open]);

  // Auto-advance when current slide's elapsed reaches its duration
  useEffect(() => {
    if (!isPlaying || !open) return;
    if (slideElapsed < slide.duration) return;
    nextSlide();
  }, [slideElapsed, slide.duration, isPlaying, open, nextSlide]);

  // Trigger narration when slide changes (only if audio is on and playing)
  useEffect(() => {
    if (!open || !audioOn || !isPlaying) return;
    if (lastNarratedRef.current === currentSlide) return;
    lastNarratedRef.current = currentSlide;
    speak(slide.narration);
  }, [currentSlide, open, audioOn, isPlaying, slide.narration, speak]);

  // Stop speech on pause / audio off
  useEffect(() => {
    if (!isPlaying || !audioOn) stopSpeech();
  }, [isPlaying, audioOn, stopSpeech]);

  const elapsedMs =
    slides.slice(0, currentSlide).reduce((s, x) => s + x.duration, 0) + slideElapsed;
  const overallProgress = (elapsedMs / TOTAL_MS) * 100;
  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  const toggleAudio = () => {
    if (audioOn) {
      stopSpeech();
      setAudioOn(false);
    } else {
      // Mark current slide as already narrated so the effect doesn't double-fire,
      // then speak immediately if currently playing.
      lastNarratedRef.current = currentSlide;
      setAudioOn(true);
      if (isPlaying) speak(slide.narration);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl p-0 gap-0 overflow-hidden [&>button]:hidden border-0 sm:rounded-2xl"
        data-testid="demo-video-modal"
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>LYS Platform Demo</DialogTitle>
        </VisuallyHidden>

        <div className="relative">
          {/* Top progress bar */}
          <div className="h-1 bg-muted">
            <motion.div
              className={`h-full ${slide.accentBg}`}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.05, ease: "linear" }}
            />
          </div>

          {/* Per-slide indicators */}
          <div className="flex items-center gap-1 px-4 py-2 bg-muted/40">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goToSlide(i)}
                className="flex-1 h-1 rounded-full overflow-hidden bg-muted-foreground/20 cursor-pointer"
                data-testid={`demo-slide-indicator-${i}`}
                aria-label={`Go to slide ${i + 1}`}
              >
                <div
                  className={`h-full ${slide.accentBg} transition-all duration-100`}
                  style={{
                    width:
                      i < currentSlide ? "100%" : i === currentSlide ? `${(slideElapsed / s.duration) * 100}%` : "0%",
                  }}
                />
              </button>
            ))}
          </div>

          {/* Slide stage */}
          <div className="relative min-h-[440px] sm:min-h-[480px] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={`absolute inset-0 bg-gradient-to-br ${slide.bg} flex flex-col`}
              >
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-card/60 backdrop-blur z-10 hover-elevate"
                  onClick={() => onOpenChange(false)}
                  data-testid="demo-close-button"
                  aria-label="Close demo"
                >
                  <X className="h-4 w-4" />
                </Button>

                <div className="flex-1 px-6 sm:px-10 py-8 sm:py-10 flex flex-col">
                  {/* Header */}
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="mb-5 sm:mb-6"
                  >
                    <div className={`text-xs sm:text-sm font-oswald uppercase tracking-wider ${slide.accent} mb-2`}>
                      {slide.eyebrow}
                    </div>
                    <h2 className="font-marker text-2xl sm:text-4xl leading-tight mb-2">
                      {slide.title}
                    </h2>
                    <p className="font-roboto text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
                      {slide.body}
                    </p>
                  </motion.div>

                  {/* Visual */}
                  <div className="flex-1 flex items-center justify-center">
                    {slide.visual}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-card border-t">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover-elevate"
                onClick={() => setIsPlaying(!isPlaying)}
                data-testid="demo-play-pause"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover-elevate"
                onClick={toggleAudio}
                data-testid="demo-audio-toggle"
                aria-label={audioOn ? "Turn narration off" : "Turn narration on"}
                title={audioOn ? "Turn narration off" : "Turn narration on"}
              >
                {audioOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <span className="text-xs text-muted-foreground font-roboto tabular-nums ml-2">
                {formatTime(elapsedMs)} / {formatTime(TOTAL_MS)}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover-elevate"
                onClick={prevSlide}
                disabled={currentSlide === 0}
                data-testid="demo-prev-slide"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground font-roboto min-w-[3rem] text-center tabular-nums">
                {currentSlide + 1} / {totalSlides}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover-elevate"
                onClick={nextSlide}
                disabled={currentSlide === totalSlides - 1 && !isPlaying}
                data-testid="demo-next-slide"
                aria-label="Next slide"
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
