import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  X,
  Sparkles,
  BookOpen,
  GraduationCap,
  Users,
  Briefcase,
  FileText,
  Activity,
  Lightbulb,
  ClipboardList,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface Step {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  done: boolean;
}

function StudentGuide({ userId }: { userId: string }) {
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem(`lys_guide_dismissed_${userId}`) === "1"
  );

  const { data: narratives = [] } = useQuery<any[]>({ queryKey: ["/api/narratives"] });
  const { data: activities = [] } = useQuery<any[]>({ queryKey: ["/api/campus-activities"] });
  const { data: savedCareers = [] } = useQuery<any[]>({ queryKey: ["/api/careers/saved"] });
  const { data: strengths = [] } = useQuery<any[]>({ queryKey: ["/api/strengths"] });
  const { data: milestones = [] } = useQuery<any[]>({ queryKey: ["/api/lyse-milestones"] });

  const steps: Step[] = [
    {
      id: "strengths",
      icon: <Lightbulb className="h-5 w-5" />,
      title: "Discover Your Strengths",
      description: "Take the strengths inventory to understand what makes you unique",
      href: "/self-discovery",
      done: strengths.length > 0,
    },
    {
      id: "careers",
      icon: <Briefcase className="h-5 w-5" />,
      title: "Explore Career Paths",
      description: "Browse careers aligned with your interests and save the ones that excite you",
      href: "/resources?tab=careers",
      done: savedCareers.length > 0,
    },
    {
      id: "activities",
      icon: <Activity className="h-5 w-5" />,
      title: "Log a Campus Activity",
      description: "Track extracurriculars, clubs, and volunteer work for your college applications",
      href: "/campus-activities",
      done: activities.length > 0,
    },
    {
      id: "essay",
      icon: <FileText className="h-5 w-5" />,
      title: "Start Your Essay Builder",
      description: "Draft and refine your personal narratives with AI-guided prompts",
      href: "/essay-builder",
      done: narratives.length > 0,
    },
    {
      id: "milestones",
      icon: <GraduationCap className="h-5 w-5" />,
      title: "Set Your First Milestone",
      description: "Break your big goals into achievable steps on your journey",
      href: "/milestones",
      done: milestones.length > 0,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  const handleDismiss = () => {
    localStorage.setItem(`lys_guide_dismissed_${userId}`, "1");
    setDismissed(true);
  };

  useEffect(() => {
    if (allDone) {
      const timer = setTimeout(handleDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [allDone]);

  if (dismissed) return null;

  return (
    <Card className="border-lys-yellow/40 bg-gradient-to-br from-lys-yellow/5 to-lys-teal/5" data-testid="card-getting-started">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-lys-yellow" />
            <CardTitle className="font-oswald text-lg">Your Getting Started Guide</CardTitle>
            {allDone ? (
              <Badge className="bg-green-500 text-white text-xs">Complete!</Badge>
            ) : (
              <Badge variant="outline" className="text-xs font-roboto">
                {completedCount}/{steps.length} done
              </Badge>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-dismiss-guide"
            aria-label="Dismiss guide"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <Progress value={(completedCount / steps.length) * 100} className="h-1.5 mt-2" />
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step) => (
          <Link key={step.id} href={step.done ? "#" : step.href}>
            <div
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                step.done
                  ? "bg-green-500/10 border border-green-500/20"
                  : "bg-background hover:bg-muted border border-border"
              }`}
              data-testid={`step-${step.id}`}
            >
              <div className={`shrink-0 ${step.done ? "text-green-500" : "text-muted-foreground"}`}>
                {step.done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
              </div>
              <div className={`shrink-0 p-1.5 rounded-md ${step.done ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                {step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-oswald text-sm font-medium ${step.done ? "line-through text-muted-foreground" : ""}`}>
                  {step.title}
                </p>
                <p className="font-roboto text-xs text-muted-foreground truncate">{step.description}</p>
              </div>
              {!step.done && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
            </div>
          </Link>
        ))}
        {allDone && (
          <p className="text-center text-sm text-green-600 font-oswald pt-1">
            You're all set! This guide will close in a moment.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function EducatorGuide({ userId }: { userId: string }) {
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem(`lys_guide_dismissed_${userId}`) === "1"
  );

  const { data: lessons = [] } = useQuery<any[]>({ queryKey: ["/api/lessons"] });
  const { data: classes = [] } = useQuery<any[]>({ queryKey: ["/api/classes"] });
  const { data: assignments = [] } = useQuery<any[]>({ queryKey: ["/api/assignments"] });
  const { data: profile } = useQuery<any>({ queryKey: ["/api/mentors/me"] });

  const steps: Step[] = [
    {
      id: "lesson",
      icon: <BookOpen className="h-5 w-5" />,
      title: "Generate Your First Lesson",
      description: "Use the AI lesson planner to create a standards-aligned lesson in under 2 minutes",
      href: "/lesson-generator",
      done: lessons.length > 0,
    },
    {
      id: "classroom",
      icon: <GraduationCap className="h-5 w-5" />,
      title: "Set Up a Classroom",
      description: "Create a class to roster students and distribute assignments",
      href: "/classroom",
      done: classes.length > 0,
    },
    {
      id: "assignment",
      icon: <ClipboardList className="h-5 w-5" />,
      title: "Generate an Assignment",
      description: "Turn any saved lesson into a fully formed assessment with one click",
      href: "/assignments",
      done: assignments.length > 0,
    },
    {
      id: "mentor",
      icon: <Users className="h-5 w-5" />,
      title: "Build Your Mentor Profile",
      description: "Connect with students and share your professional expertise",
      href: "/mentor-connect",
      done: !!profile,
    },
    {
      id: "resources",
      icon: <Lightbulb className="h-5 w-5" />,
      title: "Explore the Resource Library",
      description: "Browse scholarships, career resources, and shared lesson templates",
      href: "/resources",
      done: false,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  const handleDismiss = () => {
    localStorage.setItem(`lys_guide_dismissed_${userId}`, "1");
    setDismissed(true);
  };

  useEffect(() => {
    if (allDone) {
      const timer = setTimeout(handleDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [allDone]);

  if (dismissed) return null;

  return (
    <Card className="border-lys-red/30 bg-gradient-to-br from-lys-red/5 to-lys-yellow/5" data-testid="card-getting-started">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-lys-red" />
            <CardTitle className="font-oswald text-lg">Your Getting Started Guide</CardTitle>
            {allDone ? (
              <Badge className="bg-green-500 text-white text-xs">Complete!</Badge>
            ) : (
              <Badge variant="outline" className="text-xs font-roboto">
                {completedCount}/{steps.length} done
              </Badge>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-dismiss-guide"
            aria-label="Dismiss guide"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <Progress value={(completedCount / steps.length) * 100} className="h-1.5 mt-2" />
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step) => (
          <Link key={step.id} href={step.done ? "#" : step.href}>
            <div
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                step.done
                  ? "bg-green-500/10 border border-green-500/20"
                  : "bg-background hover:bg-muted border border-border"
              }`}
              data-testid={`step-${step.id}`}
            >
              <div className={`shrink-0 ${step.done ? "text-green-500" : "text-muted-foreground"}`}>
                {step.done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
              </div>
              <div className={`shrink-0 p-1.5 rounded-md ${step.done ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                {step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-oswald text-sm font-medium ${step.done ? "line-through text-muted-foreground" : ""}`}>
                  {step.title}
                </p>
                <p className="font-roboto text-xs text-muted-foreground truncate">{step.description}</p>
              </div>
              {!step.done && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
            </div>
          </Link>
        ))}
        {allDone && (
          <p className="text-center text-sm text-green-600 font-oswald pt-1">
            You're all set! This guide will close in a moment.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function GettingStartedGuide() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) return null;

  const userId = (user as any).id || "unknown";
  const isStudent = user.role === "student";

  return isStudent ? (
    <StudentGuide userId={userId} />
  ) : (
    <EducatorGuide userId={userId} />
  );
}
