import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Heart, 
  Briefcase, 
  Target, 
  Sparkles, 
  BookOpen, 
  Map, 
  BarChart3,
  GraduationCap,
  Compass,
  Users,
  Trophy,
  PenTool,
  UserPlus,
} from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  targetSelector?: string;
  navPath?: string;
  pillar?: "be" | "know" | "do" | "tools" | "general";
}

const STUDENT_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to LYS!",
    description: "Your personalized learning journey is ready. Let's take a quick look at the sections built just for you.",
    icon: Sparkles,
    pillar: "general",
  },
  {
    id: "be-discovery",
    title: "BE - Discover Yourself",
    description: "Start with Self Discovery to understand your unique strengths, values, and identity. This is the foundation of your success journey.",
    icon: Heart,
    targetSelector: '[data-testid="nav-self-discovery"]',
    navPath: "/self-discovery",
    pillar: "be",
  },
  {
    id: "be-strengths",
    title: "BE - Your Strengths",
    description: "Document your personal strengths with evidence and proficiency levels in the Strengths Inventory.",
    icon: Sparkles,
    targetSelector: '[data-testid="nav-strengths-inventory"]',
    navPath: "/strengths-inventory",
    pillar: "be",
  },
  {
    id: "be-portfolio",
    title: "BE - Your Portfolio",
    description: "Build a digital portfolio to showcase your achievements, skills, and growth over time.",
    icon: PenTool,
    targetSelector: '[data-testid="nav-my-portfolio"]',
    navPath: "/portfolio",
    pillar: "be",
  },
  {
    id: "know-careers",
    title: "KNOW - Explore Careers",
    description: "Discover career pathways that match your interests and strengths. Explore salary data, education requirements, and growth outlook.",
    icon: Briefcase,
    targetSelector: '[data-testid="nav-career-explorer"]',
    navPath: "/careers",
    pillar: "know",
  },
  {
    id: "know-scholarships",
    title: "KNOW - Scholarships",
    description: "Plan your scholarship applications with a seasonal timeline, and use the Essay Builder to craft compelling narratives.",
    icon: GraduationCap,
    targetSelector: '[data-testid="nav-scholarship-planner"]',
    navPath: "/scholarship-planner",
    pillar: "know",
  },
  {
    id: "know-mentors",
    title: "KNOW - Find Mentors",
    description: "Connect with career mentors who can guide you on your path to success.",
    icon: UserPlus,
    targetSelector: '[data-testid="nav-mentor-connect"]',
    navPath: "/mentor-connect",
    pillar: "know",
  },
  {
    id: "do-action",
    title: "DO - Take Action",
    description: "Set goals, create action plans, and track your progress toward achieving them.",
    icon: Target,
    targetSelector: '[data-testid="nav-action-plans"]',
    navPath: "/action-plans",
    pillar: "do",
  },
  {
    id: "do-activities",
    title: "DO - Campus Activities",
    description: "Track your extracurricular involvement, leadership roles, and campus achievements.",
    icon: Trophy,
    targetSelector: '[data-testid="nav-campus-activities"]',
    navPath: "/campus-activities",
    pillar: "do",
  },
  {
    id: "journey",
    title: "Your Journey Dashboard",
    description: "Track your overall Be-Know-Do progress on the My Journey page. Watch your growth over time!",
    icon: Compass,
    targetSelector: '[data-testid="nav-my-journey"]',
    navPath: "/my-journey",
    pillar: "general",
  },
];

const EDUCATOR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to LYS!",
    description: "Your educator toolkit is ready. Let's explore the features personalized for you.",
    icon: Sparkles,
    pillar: "general",
  },
  {
    id: "lesson-generator",
    title: "AI Lesson Generator",
    description: "Create standards-aligned, Be-Know-Do lesson plans instantly with AI. Just pick a topic, grade level, and focus area.",
    icon: Sparkles,
    targetSelector: '[data-testid="nav-ai-lesson-generator"]',
    navPath: "/lesson-generator",
    pillar: "tools",
  },
  {
    id: "my-lessons",
    title: "Your Lesson Library",
    description: "All your saved lesson plans in one place. Edit, share, and collaborate on lessons with other educators.",
    icon: BookOpen,
    targetSelector: '[data-testid="nav-my-lessons"]',
    navPath: "/my-lessons",
    pillar: "tools",
  },
  {
    id: "scope-sequence",
    title: "Scope & Sequence Builder",
    description: "Plan your curriculum from start to finish. Create from scratch or import existing plans with AI-powered unit extraction.",
    icon: Map,
    targetSelector: '[data-testid="nav-scope-sequence"]',
    navPath: "/scope-sequence",
    pillar: "tools",
  },
  {
    id: "gradebook",
    title: "Gradebook",
    description: "Manage student grades with automatic calculations, CSV export, and career alignment insights.",
    icon: BookOpen,
    targetSelector: '[data-testid="nav-gradebook"]',
    navPath: "/gradebook",
    pillar: "tools",
  },
  {
    id: "analytics",
    title: "Analytics & Growth",
    description: "Track your impact with detailed analytics on student progress, lesson effectiveness, and professional growth.",
    icon: BarChart3,
    targetSelector: '[data-testid="nav-analytics"]',
    navPath: "/analytics",
    pillar: "tools",
  },
  {
    id: "parent-portal",
    title: "Parent Portal",
    description: "Connect with parents to share student progress, career readiness insights, and Be-Know-Do journey updates.",
    icon: Users,
    targetSelector: '[data-testid="nav-parent-portal"]',
    navPath: "/parent-portal",
    pillar: "tools",
  },
  {
    id: "be-discovery",
    title: "BE - Self Discovery",
    description: "Guide your students through self-discovery assessments to understand their strengths and interests.",
    icon: Heart,
    targetSelector: '[data-testid="nav-self-discovery"]',
    navPath: "/self-discovery",
    pillar: "be",
  },
  {
    id: "know-careers",
    title: "KNOW - Career Explorer",
    description: "Help students explore career pathways with salary data, education requirements, and growth projections.",
    icon: Briefcase,
    targetSelector: '[data-testid="nav-career-explorer"]',
    navPath: "/careers",
    pillar: "know",
  },
  {
    id: "do-action",
    title: "DO - Action Plans",
    description: "Help students set and track goals with structured action plans tied to their aspirations.",
    icon: Target,
    targetSelector: '[data-testid="nav-action-plans"]',
    navPath: "/action-plans",
    pillar: "do",
  },
];

function getPillarColor(pillar?: string) {
  switch (pillar) {
    case "be": return "text-lys-red";
    case "know": return "text-lys-yellow";
    case "do": return "text-lys-teal";
    case "tools": return "text-primary";
    default: return "text-foreground";
  }
}

function getPillarBadge(pillar?: string) {
  switch (pillar) {
    case "be": return { label: "BE", className: "bg-lys-red/10 text-lys-red border-lys-red/20" };
    case "know": return { label: "KNOW", className: "bg-lys-yellow/10 text-lys-yellow border-lys-yellow/20" };
    case "do": return { label: "DO", className: "bg-lys-teal/10 text-lys-teal border-lys-teal/20" };
    case "tools": return { label: "TOOLS", className: "bg-primary/10 text-primary border-primary/20" };
    default: return null;
  }
}

function getStepsForRole(role: string, primaryGoal?: string): TourStep[] {
  const isEducator = role === "educator" || role === "campus_admin" || role === "homeschool_parent";
  let steps = isEducator ? [...EDUCATOR_STEPS] : [...STUDENT_STEPS];

  if (primaryGoal) {
    const goalPriority: Record<string, string[]> = {
      discover: ["be-discovery", "be-strengths", "be-portfolio"],
      career: ["know-careers", "know-scholarships", "know-mentors"],
      lessons: ["lesson-generator", "my-lessons", "scope-sequence"],
      curriculum: ["scope-sequence", "lesson-generator", "analytics"],
    };

    const prioritized = goalPriority[primaryGoal] || [];
    if (prioritized.length > 0) {
      const welcome = steps.find(s => s.id === "welcome")!;
      const prioritizedSteps = prioritized
        .map(id => steps.find(s => s.id === id))
        .filter(Boolean) as TourStep[];
      const remaining = steps.filter(s => s.id !== "welcome" && !prioritized.includes(s.id));
      steps = [welcome, ...prioritizedSteps, ...remaining];
    }
  }

  return steps;
}

interface OnboardingTourProps {
  role: string;
  primaryGoal?: string;
  onComplete: () => void;
}

export function OnboardingTour({ role, primaryGoal, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  const steps = getStepsForRole(role, primaryGoal);
  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const highlightTarget = useCallback(() => {
    if (!step?.targetSelector) {
      setHighlightRect(null);
      return;
    }

    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setHighlightRect(rect);
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      setHighlightRect(null);
    }
  }, [step]);

  useEffect(() => {
    highlightTarget();
    const timer = setTimeout(highlightTarget, 300);
    return () => clearTimeout(timer);
  }, [currentStep, highlightTarget]);

  useEffect(() => {
    const handleResize = () => highlightTarget();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [highlightTarget]);

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    setIsVisible(false);
    localStorage.setItem("lys_tour_completed", "true");
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem("lys_tour_completed", "true");
    onComplete();
  };

  const handleGoToSection = () => {
    if (step?.navPath) {
      handleFinish();
      setLocation(step.navPath);
    }
  };

  if (!isVisible) return null;

  const Icon = step.icon;
  const pillarBadge = getPillarBadge(step.pillar);
  const pillarColor = getPillarColor(step.pillar);

  const tooltipStyle: React.CSSProperties = {};
  if (highlightRect) {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const tooltipWidth = 360;
    const padding = 16;

    let top = highlightRect.bottom + 12;
    let left = highlightRect.left;

    if (left + tooltipWidth > viewportWidth - padding) {
      left = viewportWidth - tooltipWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }

    if (top + 250 > viewportHeight) {
      top = highlightRect.top - 250 - 12;
      if (top < padding) {
        top = viewportHeight / 2 - 125;
        left = Math.max(padding, highlightRect.right + 16);
        if (left + tooltipWidth > viewportWidth - padding) {
          left = Math.max(padding, highlightRect.left - tooltipWidth - 16);
        }
      }
    }

    tooltipStyle.position = "fixed";
    tooltipStyle.top = `${top}px`;
    tooltipStyle.left = `${left}px`;
    tooltipStyle.zIndex = 10002;
  } else {
    tooltipStyle.position = "fixed";
    tooltipStyle.top = "50%";
    tooltipStyle.left = "50%";
    tooltipStyle.transform = "translate(-50%, -50%)";
    tooltipStyle.zIndex = 10002;
  }

  return (
    <div className="onboarding-tour" data-testid="onboarding-tour">
      <div
        className="fixed inset-0 bg-black/60 transition-opacity duration-300"
        style={{ zIndex: 10000 }}
        onClick={handleSkip}
        data-testid="tour-overlay"
      />

      {highlightRect && (
        <div
          className="fixed rounded-md ring-4 ring-lys-red/60 transition-all duration-300"
          style={{
            zIndex: 10001,
            top: `${highlightRect.top - 4}px`,
            left: `${highlightRect.left - 4}px`,
            width: `${highlightRect.width + 8}px`,
            height: `${highlightRect.height + 8}px`,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
            pointerEvents: "none",
          }}
          data-testid="tour-spotlight"
        />
      )}

      <div ref={tooltipRef} style={tooltipStyle} className="w-[360px] max-w-[calc(100vw-32px)]">
        <Card className="p-0 overflow-visible shadow-lg border-2 border-lys-red/30">
          <div className="p-1 bg-muted/50 flex items-center justify-between gap-2 rounded-t-md">
            <div className="flex items-center gap-2 px-2">
              <span className="text-xs text-muted-foreground font-medium">
                {currentStep + 1} of {steps.length}
              </span>
              <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-lys-red rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSkip}
              className="h-7 w-7"
              data-testid="tour-close"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className={`p-2 rounded-md bg-muted ${pillarColor}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-oswald text-base font-semibold leading-tight">
                    {step.title}
                  </h3>
                  {pillarBadge && (
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${pillarBadge.className}`}>
                      {pillarBadge.label}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handlePrev}
                  disabled={isFirst}
                  data-testid="tour-prev"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {step.navPath && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGoToSection}
                    data-testid="tour-go-to"
                  >
                    Go there
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleNext}
                  data-testid="tour-next"
                >
                  {isLast ? "Finish Tour" : "Next"}
                  {!isLast && <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
