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
  Library,
  Milestone,
  Shield,
  School,
  Presentation,
  Settings,
  FileText,
  Share2,
  Link2,
  TrendingUp,
  ClipboardList,
  HelpCircle,
  Award,
  Folder,
  Database,
  Home,
} from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  targetSelector?: string;
  navPath?: string;
  pillar?: "be" | "know" | "do" | "tools" | "general" | "admin";
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
    id: "be-essay",
    title: "BE - Essay Builder",
    description: "Craft compelling scholarship and college essays that showcase your unique story and achievements.",
    icon: PenTool,
    targetSelector: '[data-testid="nav-essay-builder"]',
    navPath: "/essay-builder",
    pillar: "be",
  },
  {
    id: "be-portfolio",
    title: "BE - Your Portfolio",
    description: "Build a digital portfolio to showcase your achievements, skills, and growth over time. Share it with colleges and employers.",
    icon: PenTool,
    targetSelector: '[data-testid="nav-my-portfolio"]',
    navPath: "/portfolio",
    pillar: "be",
  },
  {
    id: "be-milestones",
    title: "BE - Milestones",
    description: "Track your Be-Know-Do milestones and celebrate each achievement along your learning journey.",
    icon: Milestone,
    targetSelector: '[data-testid="nav-milestones"]',
    navPath: "/milestones",
    pillar: "be",
  },
  {
    id: "know-careers",
    title: "KNOW - Explore Careers",
    description: "Browse 40+ careers across tech, healthcare, trades, science, and more. See real salary data, education paths, and job growth — college isn't the only way!",
    icon: Briefcase,
    targetSelector: '[data-testid="nav-career-explorer"]',
    navPath: "/careers",
    pillar: "know",
  },
  {
    id: "know-resources",
    title: "KNOW - Resources",
    description: "Access curated educational resources, articles, and learning materials to expand your knowledge.",
    icon: Library,
    targetSelector: '[data-testid="nav-resources"]',
    navPath: "/resources",
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
  {
    id: "help-desk",
    title: "Need Help?",
    description: "Visit the Help Desk anytime for troubleshooting guides, FAQs, and step-by-step solutions to common questions.",
    icon: HelpCircle,
    targetSelector: '[data-testid="nav-help-desk"]',
    navPath: "/help",
    pillar: "general",
  },
];

const EDUCATOR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to LYS!",
    description: "Your educator toolkit is ready. Let's explore the features designed to help you create engaging, standards-aligned instruction.",
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
    id: "assessments",
    title: "Assessments",
    description: "Create and manage assessments aligned to your lessons and standards for measuring student understanding.",
    icon: FileText,
    targetSelector: '[data-testid="nav-assessments"]',
    navPath: "/assessments",
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
    id: "classroom",
    title: "Classroom Management",
    description: "Organize your classes, manage student rosters, and keep track of your teaching assignments.",
    icon: School,
    targetSelector: '[data-testid="nav-classroom"]',
    navPath: "/classroom",
    pillar: "tools",
  },
  {
    id: "gradebook",
    title: "Gradebook",
    description: "Manage student grades with automatic calculations, CSV export, and career alignment insights.",
    icon: ClipboardList,
    targetSelector: '[data-testid="nav-gradebook"]',
    navPath: "/gradebook",
    pillar: "tools",
  },
  {
    id: "collaboration",
    title: "Collaboration",
    description: "Co-create lesson plans with other educators in real time. Share invite codes, chat, and track edit history.",
    icon: Share2,
    targetSelector: '[data-testid="nav-collaboration"]',
    navPath: "/collaboration",
    pillar: "tools",
  },
  {
    id: "resource-library",
    title: "Resource Library",
    description: "Browse and share teaching resources with the educator community. Find templates, activities, and materials.",
    icon: Folder,
    targetSelector: '[data-testid="nav-resource-library"]',
    navPath: "/resource-library",
    pillar: "tools",
  },
  {
    id: "sis-integration",
    title: "SIS Integration",
    description: "Connect your Student Information System (Clever, PowerSchool, Canvas, etc.) to sync student rosters and course data.",
    icon: Link2,
    targetSelector: '[data-testid="nav-sis-integration"]',
    navPath: "/sis-integration",
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
    id: "professional-dev",
    title: "Professional Development",
    description: "Access professional development resources and track your growth as an educator.",
    icon: TrendingUp,
    targetSelector: '[data-testid="nav-professional-dev"]',
    navPath: "/professional-development",
    pillar: "tools",
  },
  {
    id: "educator-influence",
    title: "Educator Influence",
    description: "Earn rewards by sharing resources and growing the LYS community through the affiliate program.",
    icon: Award,
    targetSelector: '[data-testid="nav-educator-influence"]',
    navPath: "/educator-influence",
    pillar: "tools",
  },
  {
    id: "parent-portal",
    title: "Parent Portal",
    description: "Invite parents via a magic link, send class-wide announcements, set quiet hours so families aren't pinged at midnight, message parents 1-to-1, and oversee student portfolio activity — all from one Communications Hub.",
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
    description: "Help students explore 40+ career pathways — from AI to welding — with salary data, growth projections, and multiple education paths.",
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
  {
    id: "help-desk",
    title: "Need Help?",
    description: "Visit the Help Desk anytime for troubleshooting guides, FAQs, and step-by-step solutions to common questions.",
    icon: HelpCircle,
    targetSelector: '[data-testid="nav-help-desk"]',
    navPath: "/help",
    pillar: "general",
  },
];

const HOMESCHOOL_PARENT_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to LYS!",
    description: "Your homeschool toolkit is ready. Let's explore the features designed to help you teach and guide your children effectively.",
    icon: Home,
    pillar: "general",
  },
  {
    id: "lesson-generator",
    title: "AI Lesson Generator",
    description: "Create engaging, standards-aligned lesson plans instantly with AI. Customize for your child's learning style and pace.",
    icon: Sparkles,
    targetSelector: '[data-testid="nav-ai-lesson-generator"]',
    navPath: "/lesson-generator",
    pillar: "tools",
  },
  {
    id: "my-lessons",
    title: "Your Lesson Library",
    description: "All your saved lesson plans organized in one place. Edit, duplicate, and build your curriculum over time.",
    icon: BookOpen,
    targetSelector: '[data-testid="nav-my-lessons"]',
    navPath: "/my-lessons",
    pillar: "tools",
  },
  {
    id: "scope-sequence",
    title: "Scope & Sequence Builder",
    description: "Plan your homeschool curriculum with pacing guides and unit organization for the entire year.",
    icon: Map,
    targetSelector: '[data-testid="nav-scope-sequence"]',
    navPath: "/scope-sequence",
    pillar: "tools",
  },
  {
    id: "gradebook",
    title: "Gradebook",
    description: "Track your child's grades with automatic calculations. Export records for compliance or portfolio reviews.",
    icon: ClipboardList,
    targetSelector: '[data-testid="nav-gradebook"]',
    navPath: "/gradebook",
    pillar: "tools",
  },
  {
    id: "resource-library",
    title: "Resource Library",
    description: "Browse community-shared teaching resources, templates, and activities to enrich your homeschool experience.",
    icon: Folder,
    targetSelector: '[data-testid="nav-resource-library"]',
    navPath: "/resource-library",
    pillar: "tools",
  },
  {
    id: "assignments",
    title: "Assignments",
    description: "Create and manage assignments aligned with your lesson plans and track completion.",
    icon: ClipboardList,
    targetSelector: '[data-testid="nav-assignments"]',
    navPath: "/assignments",
    pillar: "tools",
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "View learning analytics and progress reports to understand how your child is growing.",
    icon: BarChart3,
    targetSelector: '[data-testid="nav-analytics"]',
    navPath: "/analytics",
    pillar: "tools",
  },
  {
    id: "parent-portal",
    title: "Parent Portal",
    description: "Your central hub for tracking student progress, career readiness insights, and Be-Know-Do journey updates.",
    icon: Users,
    targetSelector: '[data-testid="nav-parent-portal"]',
    navPath: "/parent-portal",
    pillar: "tools",
  },
  {
    id: "be-discovery",
    title: "BE - Self Discovery",
    description: "Help your child discover their unique strengths, values, and identity through guided assessments.",
    icon: Heart,
    targetSelector: '[data-testid="nav-self-discovery"]',
    navPath: "/self-discovery",
    pillar: "be",
  },
  {
    id: "know-careers",
    title: "KNOW - Career Explorer",
    description: "Explore 40+ career pathways together — from robotics to healthcare — and connect learning with real-world opportunities.",
    icon: Briefcase,
    targetSelector: '[data-testid="nav-career-explorer"]',
    navPath: "/careers",
    pillar: "know",
  },
  {
    id: "do-action",
    title: "DO - Action Plans",
    description: "Set goals and create action plans to build discipline and track your child's achievements.",
    icon: Target,
    targetSelector: '[data-testid="nav-action-plans"]',
    navPath: "/action-plans",
    pillar: "do",
  },
  {
    id: "help-desk",
    title: "Need Help?",
    description: "Visit the Help Desk anytime for troubleshooting guides, FAQs, and step-by-step solutions.",
    icon: HelpCircle,
    targetSelector: '[data-testid="nav-help-desk"]',
    navPath: "/help",
    pillar: "general",
  },
];

const CAMPUS_ADMIN_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to LYS!",
    description: "Your campus administration tools are ready. Whether you manage a single-campus charter school, a campus within an ISD, or a site in a charter network (CMO/EMO), let's explore how to run your school effectively.",
    icon: Shield,
    pillar: "general",
  },
  {
    id: "campus-admin",
    title: "Campus Admin Dashboard",
    description: "Your central hub for managing campus operations, reviewing safety metrics, and overseeing educator activity. Single-campus charters get full autonomy here; campuses within an ISD or charter network inherit district- or network-level policies.",
    icon: Shield,
    targetSelector: '[data-testid="nav-campus-admin"]',
    navPath: "/admin",
    pillar: "admin",
  },
  {
    id: "standards",
    title: "Educational Standards",
    description: "Manage and configure educational standards for your campus. Independent charters set their own standards; ISD and charter network campuses align with district or network requirements.",
    icon: Database,
    targetSelector: '[data-testid="nav-standards"]',
    navPath: "/admin/standards",
    pillar: "admin",
  },
  {
    id: "lesson-generator",
    title: "AI Lesson Generator",
    description: "Create standards-aligned lesson plans with AI, or review and approve lessons created by your educators.",
    icon: Sparkles,
    targetSelector: '[data-testid="nav-ai-lesson-generator"]',
    navPath: "/lesson-generator",
    pillar: "tools",
  },
  {
    id: "scope-sequence",
    title: "Scope & Sequence",
    description: "Review and manage curriculum plans across your campus. Ensure consistent pacing and standards coverage aligned with your charter, ISD, or network guidelines.",
    icon: Map,
    targetSelector: '[data-testid="nav-scope-sequence"]',
    navPath: "/scope-sequence",
    pillar: "tools",
  },
  {
    id: "gradebook",
    title: "Gradebook",
    description: "Access gradebook data across your campus. Review student performance and career alignment metrics.",
    icon: ClipboardList,
    targetSelector: '[data-testid="nav-gradebook"]',
    navPath: "/gradebook",
    pillar: "tools",
  },
  {
    id: "analytics",
    title: "Analytics & Reports",
    description: "View campus-wide analytics including student progress, standards coverage, and educator performance.",
    icon: BarChart3,
    targetSelector: '[data-testid="nav-analytics"]',
    navPath: "/analytics",
    pillar: "tools",
  },
  {
    id: "sis-integration",
    title: "SIS Integration",
    description: "Connect your Student Information System to automatically sync student rosters and course data.",
    icon: Link2,
    targetSelector: '[data-testid="nav-sis-integration"]',
    navPath: "/sis-integration",
    pillar: "tools",
  },
  {
    id: "parent-portal",
    title: "Parent Portal",
    description: "Manage parent communications and review how families are engaging with student progress data.",
    icon: Users,
    targetSelector: '[data-testid="nav-parent-portal"]',
    navPath: "/parent-portal",
    pillar: "tools",
  },
  {
    id: "help-desk",
    title: "Need Help?",
    description: "Visit the Help Desk anytime for troubleshooting guides, FAQs, and step-by-step solutions.",
    icon: HelpCircle,
    targetSelector: '[data-testid="nav-help-desk"]',
    navPath: "/help",
    pillar: "general",
  },
];

const DISTRICT_ADMIN_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to LYS!",
    description: "Your administration tools are ready. Whether you manage a traditional ISD, a multi-state charter network (CMO/EMO), or another multi-campus organization, let's explore your management capabilities.",
    icon: Presentation,
    pillar: "general",
  },
  {
    id: "district-admin",
    title: "District / Network Admin Dashboard",
    description: "Your command center for organization-wide operations. ISDs manage geographically bound campuses; charter networks (CMOs/EMOs) oversee schools across multiple states from a unified master dashboard or per-state view.",
    icon: Presentation,
    targetSelector: '[data-testid="nav-district-admin"]',
    navPath: "/district-admin",
    pillar: "admin",
  },
  {
    id: "campuses",
    title: "Campus Management",
    description: "View and manage all campuses in your district or charter network. Monitor performance across sites, transfer students, and configure campus settings. Multi-state networks can organize campuses by state or region.",
    icon: School,
    targetSelector: '[data-testid="nav-campuses"]',
    navPath: "/district-admin/campuses",
    pillar: "admin",
  },
  {
    id: "campus-admin",
    title: "Campus Admin Tools",
    description: "Access campus-level administration including standards management and educator oversight for any campus in your ISD or charter network.",
    icon: Shield,
    targetSelector: '[data-testid="nav-campus-admin"]',
    navPath: "/admin",
    pillar: "admin",
  },
  {
    id: "analytics",
    title: "Organization-Wide Analytics",
    description: "Review performance analytics across your entire ISD or charter network, including student progress, standards coverage, and educator metrics across all campuses and states.",
    icon: BarChart3,
    targetSelector: '[data-testid="nav-analytics"]',
    navPath: "/analytics",
    pillar: "tools",
  },
  {
    id: "scope-sequence",
    title: "Scope & Sequence",
    description: "Oversee curriculum planning across your district or charter network. Ensure alignment and consistency across all campuses, whether in one region or spanning multiple states.",
    icon: Map,
    targetSelector: '[data-testid="nav-scope-sequence"]',
    navPath: "/scope-sequence",
    pillar: "tools",
  },
  {
    id: "sis-integration",
    title: "SIS Integration",
    description: "Configure organization-level SIS connections that automatically cascade to all campuses in your ISD or charter network.",
    icon: Link2,
    targetSelector: '[data-testid="nav-sis-integration"]',
    navPath: "/sis-integration",
    pillar: "tools",
  },
  {
    id: "help-desk",
    title: "Need Help?",
    description: "Visit the Help Desk anytime for troubleshooting guides, FAQs, and step-by-step solutions.",
    icon: HelpCircle,
    targetSelector: '[data-testid="nav-help-desk"]',
    navPath: "/help",
    pillar: "general",
  },
];

const SYSTEM_ADMIN_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to LYS Administration!",
    description: "You have system-level access. Let's explore your platform management tools, safety systems, and governance controls.",
    icon: Settings,
    pillar: "general",
  },
  {
    id: "system-dashboard",
    title: "System Dashboard",
    description: "Your platform-wide command center with performance analytics, user metrics, safety monitoring, governance status, and audit logs.",
    icon: Settings,
    targetSelector: '[data-testid="nav-system-dashboard"]',
    navPath: "/system-admin",
    pillar: "admin",
  },
  {
    id: "manage-users",
    title: "User Management",
    description: "Manage all platform users, assign roles, handle invitations, and review user analytics including engagement and retention metrics.",
    icon: Users,
    targetSelector: '[data-testid="nav-manage-users"]',
    navPath: "/system-admin/users",
    pillar: "admin",
  },
  {
    id: "district-admin",
    title: "District & Network Management",
    description: "Oversee all organization types across the platform: single-campus charters, traditional ISDs, and multi-state charter networks (CMOs/EMOs). Manage campus hierarchies and network structures.",
    icon: Presentation,
    targetSelector: '[data-testid="nav-district-admin"]',
    navPath: "/district-admin",
    pillar: "admin",
  },
  {
    id: "campus-admin",
    title: "Campus Administration",
    description: "Access campus-level tools including standards management and educator oversight for any campus across ISDs, charter networks, or independent schools.",
    icon: Shield,
    targetSelector: '[data-testid="nav-campus-admin"]',
    navPath: "/admin",
    pillar: "admin",
  },
  {
    id: "analytics",
    title: "Platform Analytics",
    description: "Review platform-wide analytics including DAU/MAU ratios, churn rates, feature adoption, and cohort retention data.",
    icon: BarChart3,
    targetSelector: '[data-testid="nav-analytics"]',
    navPath: "/analytics",
    pillar: "tools",
  },
  {
    id: "help-desk",
    title: "Help Desk",
    description: "The Help Desk provides searchable troubleshooting guides and FAQs available to all users from the sidebar.",
    icon: HelpCircle,
    targetSelector: '[data-testid="nav-help-desk"]',
    navPath: "/help",
    pillar: "general",
  },
];

function getPillarColor(pillar?: string) {
  switch (pillar) {
    case "be": return "text-lys-red";
    case "know": return "text-lys-yellow";
    case "do": return "text-lys-teal";
    case "tools": return "text-primary";
    case "admin": return "text-orange-600 dark:text-orange-400";
    default: return "text-foreground";
  }
}

function getPillarBadge(pillar?: string) {
  switch (pillar) {
    case "be": return { label: "BE", className: "bg-lys-red/10 text-lys-red border-lys-red/20" };
    case "know": return { label: "KNOW", className: "bg-lys-yellow/10 text-lys-yellow border-lys-yellow/20" };
    case "do": return { label: "DO", className: "bg-lys-teal/10 text-lys-teal border-lys-teal/20" };
    case "tools": return { label: "TOOLS", className: "bg-primary/10 text-primary border-primary/20" };
    case "admin": return { label: "ADMIN", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" };
    default: return null;
  }
}

function getStepsForRole(role: string, primaryGoal?: string): TourStep[] {
  let steps: TourStep[];

  switch (role) {
    case "system_admin":
    case "site_admin":
      steps = [...SYSTEM_ADMIN_STEPS];
      break;
    case "district_admin":
      steps = [...DISTRICT_ADMIN_STEPS];
      break;
    case "campus_admin":
      steps = [...CAMPUS_ADMIN_STEPS];
      break;
    case "homeschool_parent":
      steps = [...HOMESCHOOL_PARENT_STEPS];
      break;
    case "educator":
      steps = [...EDUCATOR_STEPS];
      break;
    default:
      steps = [...STUDENT_STEPS];
      break;
  }

  if (primaryGoal) {
    const goalPriority: Record<string, string[]> = {
      discover: ["be-discovery", "be-strengths", "be-portfolio", "be-essay", "be-milestones"],
      career: ["know-careers", "know-scholarships", "know-mentors", "know-resources"],
      lessons: ["lesson-generator", "my-lessons", "scope-sequence", "assessments"],
      curriculum: ["scope-sequence", "lesson-generator", "analytics", "gradebook"],
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
