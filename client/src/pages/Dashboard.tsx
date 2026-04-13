import { useState } from "react";
import { BKDCard } from "@/components/BKDCard";
import { GettingStartedGuide } from "@/components/GettingStartedGuide";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sparkles, 
  Heart, 
  Compass, 
  Target,
  BookOpen,
  Users,
  TrendingUp,
  ArrowRight,
  Clock,
  Star,
  Trophy,
  Briefcase,
  GraduationCap,
  Flame,
  Award,
  FolderOpen,
  Play,
  Calendar,
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  Send,
  CheckSquare,
  Circle
} from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { DemoVideoModal } from "@/components/DemoVideoModal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StudentJourneyProgress, StudentJourneyMilestone, StudentJourneyActivity, Career } from "@shared/schema";

interface JourneyData {
  progress: StudentJourneyProgress;
  milestones: StudentJourneyMilestone[];
  activities: StudentJourneyActivity[];
}

function JourneyProgressCard() {
  const { isAuthenticated } = useAuth();
  
  const { data: journeyData, isLoading } = useQuery<JourneyData>({
    queryKey: ["/api/my-journey"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated || isLoading || !journeyData) {
    return null;
  }

  const { progress, milestones } = journeyData;
  if (!progress) return null;
  
  const activeMilestones = (milestones || []).filter(m => m.status === "in_progress").slice(0, 2);

  return (
    <Card className="border-2 border-lys-yellow/30 bg-gradient-to-br from-lys-yellow/5 to-background">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="font-oswald flex items-center gap-2">
              <Trophy className="w-5 h-5 text-lys-yellow" />
              Your Be-Know-Do Journey
            </CardTitle>
            <CardDescription className="font-roboto">Track your progress across all areas</CardDescription>
          </div>
          <Button asChild size="sm" variant="outline" data-testid="button-view-journey">
            <Link href="/my-journey">
              View Full Journey <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
          <div className="text-center p-2 sm:p-3 rounded-lg bg-lys-yellow/10">
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-lys-yellow mb-1" />
            <div className="text-2xl font-bold text-lys-yellow">{progress.beScore || 0}%</div>
            <div className="text-xs text-muted-foreground font-roboto">Being</div>
          </div>
          <div className="text-center p-2 sm:p-3 rounded-lg bg-lys-teal/10">
            <Compass className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-lys-teal mb-1" />
            <div className="text-2xl font-bold text-lys-teal">{progress.knowScore || 0}%</div>
            <div className="text-xs text-muted-foreground font-roboto">Knowing</div>
          </div>
          <div className="text-center p-2 sm:p-3 rounded-lg bg-lys-red/10">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-lys-red mb-1" />
            <div className="text-2xl font-bold text-lys-red">{progress.doScore || 0}%</div>
            <div className="text-xs text-muted-foreground font-roboto">Doing</div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-roboto text-muted-foreground">Overall Progress</span>
            <span className="font-bold">{progress.overallScore || 0}%</span>
          </div>
          <Progress value={progress.overallScore || 0} className="h-2" />
        </div>
        
        {activeMilestones.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Active Milestones</p>
            {activeMilestones.map(milestone => (
              <div key={milestone.id} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/30">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="flex-1 truncate">{milestone.title}</span>
                <Badge variant="outline" className="text-xs">
                  {milestone.currentValue}/{milestone.targetValue}
                </Badge>
              </div>
            ))}
          </div>
        )}
        
        {progress.totalAssessmentsCompleted === 0 && (
          <div className="mt-4 p-3 rounded-lg bg-lys-yellow/10 border border-lys-yellow/20">
            <p className="text-sm font-medium mb-2">Get Started</p>
            <p className="text-xs text-muted-foreground mb-3">
              Take the self-discovery assessment to see your Be-Know-Do profile!
            </p>
            <Button asChild size="sm" className="bg-lys-yellow text-black hover:bg-lys-yellow/90" data-testid="button-start-assessment">
              <Link href="/self-discovery">
                <Sparkles className="w-4 h-4 mr-1" />
                Start Assessment
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Upcoming Deadlines Widget (shared) ───────────────────────────────────────

function UpcomingDeadlines({ role }: { role: "educator" | "student" }) {
  const { isAuthenticated } = useAuth();

  const { data: assignments = [] } = useQuery<any[]>({
    queryKey: ["/api/my-assignments"],
    enabled: isAuthenticated,
  });

  const { data: goals = [] } = useQuery<any[]>({
    queryKey: ["/api/goals"],
    enabled: isAuthenticated && role === "educator",
  });

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const upcomingAssignments = (assignments as any[])
    .filter((a: any) => a.dueDate && !a.completed && new Date(a.dueDate) >= now)
    .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  const upcomingGoals = (goals as any[])
    .filter((g: any) => g.targetDate && g.status !== "completed" && new Date(g.targetDate) >= now && new Date(g.targetDate) <= nextWeek)
    .sort((a: any, b: any) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
    .slice(0, 3);

  const items = [
    ...upcomingAssignments.map((a: any) => ({
      id: a.id, title: a.title, date: a.dueDate, type: "assignment" as const,
      overdue: new Date(a.dueDate) < now,
    })),
    ...upcomingGoals.map((g: any) => ({
      id: g.id, title: g.title || g.goal, date: g.targetDate, type: "goal" as const,
      overdue: false,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff <= 7) return `In ${diff} days`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Card data-testid="card-upcoming-deadlines">
      <CardHeader className="pb-2">
        <CardTitle className="font-oswald flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4 text-lys-yellow" />
          Upcoming Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground font-roboto">You're all caught up! No upcoming deadlines.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className={`flex items-center gap-3 p-2 rounded-md text-sm ${item.overdue ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800" : "bg-muted/30"}`}>
                <div className={`flex-shrink-0 ${item.type === "assignment" ? "text-lys-teal" : "text-lys-yellow"}`}>
                  {item.type === "assignment" ? <BookOpen className="h-4 w-4" /> : <Target className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate font-oswald">{item.title}</p>
                  <p className={`text-xs font-roboto ${item.overdue ? "text-red-500" : "text-muted-foreground"}`}>
                    {item.overdue ? "Overdue" : formatDate(item.date)}
                  </p>
                </div>
                <Badge variant="outline" className={`text-xs flex-shrink-0 ${item.type === "assignment" ? "border-lys-teal/40 text-lys-teal" : "border-lys-yellow/40 text-lys-yellow"}`}>
                  {item.type === "assignment" ? "Assignment" : "Goal"}
                </Badge>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 pt-3 border-t flex gap-2">
          <Button asChild variant="ghost" size="sm" className="flex-1 font-roboto text-xs">
            <Link href="/assignments"><BookOpen className="h-3 w-3 mr-1" />Assignments</Link>
          </Button>
          {role === "educator" && (
            <Button asChild variant="ghost" size="sm" className="flex-1 font-roboto text-xs">
              <Link href="/action-plans"><Target className="h-3 w-3 mr-1" />Goals</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Student Messaging Widget ──────────────────────────────────────────────────

function StudentMessagingWidget() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [replyContent, setReplyContent] = useState("");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["/api/parent-messages/unread-count"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await fetch("/api/parent-messages/unread-count");
      if (!res.ok) return 0;
      const d = await res.json();
      return typeof d === "number" ? d : (d?.count ?? 0);
    },
  });

  const { data: threads = [] } = useQuery<any[]>({
    queryKey: ["/api/parent-messages/threads"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await fetch("/api/parent-messages/threads");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: activeMessages = [] } = useQuery<any[]>({
    queryKey: ["/api/parent-messages/thread", activeThreadId],
    enabled: !!activeThreadId,
    queryFn: async () => {
      const res = await fetch(`/api/parent-messages/thread/${activeThreadId}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/parent-messages/send", { threadId: activeThreadId, content: replyContent }),
    onSuccess: () => {
      setReplyContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/parent-messages/thread", activeThreadId] });
      queryClient.invalidateQueries({ queryKey: ["/api/parent-messages/threads"] });
    },
    onError: () => toast({ title: "Failed to send message", variant: "destructive" }),
  });

  return (
    <Card data-testid="card-student-messaging">
      <CardHeader className="pb-2">
        <CardTitle className="font-oswald flex items-center gap-2 text-base">
          <MessageCircle className="h-4 w-4 text-lys-teal" />
          Messages
          {unreadCount > 0 && (
            <Badge className="bg-lys-red text-white text-xs ml-1">{unreadCount}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!activeThreadId ? (
          <>
            {(threads as any[]).length === 0 ? (
              <div className="text-center py-4">
                <MessageCircle className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground font-roboto">No messages yet.</p>
                <p className="text-xs text-muted-foreground font-roboto mt-1">Your teacher can message you here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(threads as any[]).slice(0, 3).map((thread: any) => (
                  <button
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 text-left transition-colors"
                    data-testid={`button-thread-${thread.id}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-lys-teal/10 flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 text-lys-teal" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium font-oswald truncate">Teacher</p>
                      <p className="text-xs text-muted-foreground font-roboto truncate">
                        {thread.lastMessageAt ? new Date(thread.lastMessageAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setActiveThreadId(null)} className="font-roboto text-xs -ml-2">
              ← Back
            </Button>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {(activeMessages as any[]).map((msg: any) => (
                <div key={msg.id} className="text-sm p-2 rounded-md bg-muted/30">
                  <p className="font-roboto">{msg.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type a message..."
                className="text-sm min-h-[60px] resize-none"
                data-testid="input-message-reply"
              />
              <Button
                size="sm"
                className="self-end"
                disabled={!replyContent.trim() || sendMutation.isPending}
                onClick={() => sendMutation.mutate()}
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── New Educator Checklist ────────────────────────────────────────────────────

function NewEducatorChecklist({ lessonsCount, goalsCount }: { lessonsCount: number; goalsCount: number }) {
  const { data: classesData } = useQuery<any[]>({ queryKey: ["/api/classes"] });
  const classes = classesData ?? [];

  const steps = [
    {
      id: "lesson",
      label: "Create your first AI lesson",
      done: lessonsCount > 0,
      href: "/lesson-generator",
      cta: "Build Lesson",
    },
    {
      id: "class",
      label: "Set up a class",
      done: classes.length > 0,
      href: "/classroom",
      cta: "Create Class",
    },
    {
      id: "goal",
      label: "Set a teaching goal",
      done: goalsCount > 0,
      href: "/action-plans",
      cta: "Add Goal",
    },
    {
      id: "assessment",
      label: "Run a student assessment",
      done: false,
      href: "/assessments",
      cta: "Start Assessment",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  if (completedCount === steps.length) return null;

  return (
    <Card className="border-lys-yellow/30 bg-gradient-to-br from-lys-yellow/5 to-background" data-testid="card-new-educator-checklist">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-oswald flex items-center gap-2 text-base">
            <CheckSquare className="h-4 w-4 text-lys-yellow" />
            Getting Started
          </CardTitle>
          <Badge variant="secondary" className="text-xs">{completedCount}/{steps.length} done</Badge>
        </div>
        <Progress value={(completedCount / steps.length) * 100} className="h-1.5 mt-2" />
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step) => (
          <div key={step.id} className={`flex items-center gap-3 p-2 rounded-md transition-colors ${step.done ? "opacity-50" : "bg-muted/20 hover:bg-muted/40"}`}>
            <div className="flex-shrink-0">
              {step.done ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
            </div>
            <p className={`flex-1 text-sm font-roboto ${step.done ? "line-through text-muted-foreground" : ""}`}>{step.label}</p>
            {!step.done && (
              <Button asChild size="sm" variant="outline" className="text-xs h-7 font-roboto" data-testid={`button-checklist-${step.id}`}>
                <Link href={step.href}>{step.cta}</Link>
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Student Dashboard ─────────────────────────────────────────────────────────

function StudentDashboard() {
  const { user, isAuthenticated } = useAuth();
  
  const { data: journeyData, isLoading: journeyLoading } = useQuery<JourneyData>({
    queryKey: ["/api/my-journey"],
    enabled: isAuthenticated,
  });

  const { data: savedCareers = [] } = useQuery<Career[]>({
    queryKey: ["/api/careers/saved"],
    enabled: isAuthenticated,
  });

  const progress = journeyData?.progress;
  const milestones = journeyData?.milestones || [];
  const activities = journeyData?.activities || [];
  
  const completedMilestones = milestones.filter(m => m.status === "completed" || m.status === "mastered");
  const activeMilestones = milestones.filter(m => m.status === "in_progress");
  const recentActivities = activities.slice(0, 3);

  return (
    <div className="min-h-screen bg-background" data-testid="student-dashboard">
      <section className="relative overflow-hidden bg-gradient-to-br from-lys-yellow/20 via-background to-lys-teal/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <Badge className="bg-lys-yellow/10 text-lys-yellow border-lys-yellow/20 mb-4 font-roboto">
                <Flame className="w-3 h-3 mr-1" />
                Welcome Back
              </Badge>
              <h1 className="font-marker text-3xl sm:text-4xl lg:text-5xl text-foreground mb-3 leading-tight">
                Hey {user?.firstName || "there"}!
              </h1>
              <p className="font-oswald text-lg text-muted-foreground mb-6">
                Ready to continue your journey? Your future is being built one step at a time.
              </p>
              
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                <div className="text-center p-2 sm:p-4 rounded-lg bg-lys-yellow/10 border border-lys-yellow/20">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-lys-yellow mb-2" />
                  <div className="text-2xl font-bold text-lys-yellow">{progress?.beScore || 0}%</div>
                  <div className="text-xs text-muted-foreground font-roboto">Being</div>
                </div>
                <div className="text-center p-2 sm:p-4 rounded-lg bg-lys-teal/10 border border-lys-teal/20">
                  <Compass className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-lys-teal mb-2" />
                  <div className="text-2xl font-bold text-lys-teal">{progress?.knowScore || 0}%</div>
                  <div className="text-xs text-muted-foreground font-roboto">Knowing</div>
                </div>
                <div className="text-center p-2 sm:p-4 rounded-lg bg-lys-red/10 border border-lys-red/20">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-lys-red mb-2" />
                  <div className="text-2xl font-bold text-lys-red">{progress?.doScore || 0}%</div>
                  <div className="text-xs text-muted-foreground font-roboto">Doing</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link href="/self-discovery">
                  <Button 
                    size="lg" 
                    className="bg-lys-yellow hover:bg-lys-yellow/90 text-black font-oswald gap-2"
                    data-testid="button-self-discovery"
                  >
                    <Sparkles className="h-5 w-5" />
                    Self-Discovery
                  </Button>
                </Link>
                <Link href="/my-journey">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="font-oswald gap-2"
                    data-testid="button-my-journey"
                  >
                    <Trophy className="h-5 w-5" />
                    My Journey
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-lys-yellow/30 to-lys-teal/30 rounded-2xl blur-3xl"></div>
              <Card className="relative border-2 border-lys-yellow/20">
                <CardHeader className="pb-2">
                  <CardTitle className="font-oswald text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-lys-yellow" />
                    Your Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-roboto text-muted-foreground">Overall Journey</span>
                      <span className="font-bold text-lg">{progress?.overallScore || 0}%</span>
                    </div>
                    <Progress value={progress?.overallScore || 0} className="h-3" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <Award className="w-5 h-5 mx-auto text-amber-500 mb-1" />
                      <div className="font-bold text-lg">{completedMilestones.length}</div>
                      <div className="text-xs text-muted-foreground">Milestones Done</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <Briefcase className="w-5 h-5 mx-auto text-lys-teal mb-1" />
                      <div className="font-bold text-lg">{savedCareers.length}</div>
                      <div className="text-xs text-muted-foreground">Saved Careers</div>
                    </div>
                  </div>

                  {activeMilestones.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Clock className="w-4 h-4 text-amber-500" />
                        In Progress
                      </p>
                      {activeMilestones.slice(0, 2).map(milestone => (
                        <div key={milestone.id} className="flex items-center gap-2 text-sm p-2 rounded bg-amber-500/10 border border-amber-500/20">
                          <span className="flex-1 truncate">{milestone.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {milestone.currentValue}/{milestone.targetValue}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 lg:py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <GettingStartedGuide />
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 mt-6">
            <div>
              <h2 className="font-marker text-2xl sm:text-3xl text-foreground mb-1">
                What's Next?
              </h2>
              <p className="font-roboto text-muted-foreground text-sm">
                Quick actions to keep your journey moving
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/self-discovery">
              <Card className="hover-elevate cursor-pointer group" data-testid="card-self-discovery">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-lys-yellow/10 flex items-center justify-center text-lys-yellow group-hover:scale-105 transition-transform">
                    <Heart className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-oswald font-semibold truncate">Self-Discovery</p>
                    <p className="text-xs text-muted-foreground font-roboto">Know yourself better</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/careers">
              <Card className="hover-elevate cursor-pointer group" data-testid="card-careers">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-lys-teal/10 flex items-center justify-center text-lys-teal group-hover:scale-105 transition-transform">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-oswald font-semibold truncate">Explore Careers</p>
                    <p className="text-xs text-muted-foreground font-roboto">Find your path</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/action-plans">
              <Card className="hover-elevate cursor-pointer group" data-testid="card-goals">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-lys-red/10 flex items-center justify-center text-lys-red group-hover:scale-105 transition-transform">
                    <Target className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-oswald font-semibold truncate">Set Goals</p>
                    <p className="text-xs text-muted-foreground font-roboto">Take action today</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/portfolio">
              <Card className="hover-elevate cursor-pointer group" data-testid="card-portfolio">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                    <FolderOpen className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-oswald font-semibold truncate">My Portfolio</p>
                    <p className="text-xs text-muted-foreground font-roboto">Showcase your work</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="font-oswald">Recent Activity</CardTitle>
                  <p className="text-sm text-muted-foreground font-roboto">What you've been working on</p>
                </div>
                <Button variant="ghost" size="sm" className="font-roboto gap-1" asChild>
                  <Link href="/my-journey">
                    View All <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="font-medium mb-2">No activities yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start exploring to build your activity history
                    </p>
                    <Button asChild data-testid="button-start-exploring">
                      <Link href="/self-discovery">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Start Exploring
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-4 p-3 rounded-md bg-muted/30 hover-elevate">
                        <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                          activity.category === "be" ? "bg-lys-yellow/10 text-lys-yellow" :
                          activity.category === "know" ? "bg-lys-teal/10 text-lys-teal" :
                          "bg-lys-red/10 text-lys-red"
                        }`}>
                          {activity.category === "be" ? <Heart className="h-5 w-5" /> :
                           activity.category === "know" ? <Compass className="h-5 w-5" /> :
                           <Target className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-oswald font-medium truncate">{activity.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-roboto">
                            <Clock className="h-3 w-3" />
                            <span>{activity.createdAt ? new Date(activity.createdAt).toLocaleDateString() : "Today"}</span>
                          </div>
                        </div>
                        {activity.pointsEarned > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            +{activity.pointsEarned} pts
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-oswald flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-lys-teal" />
                  Saved Careers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {savedCareers.length === 0 ? (
                  <div className="text-center py-6">
                    <Compass className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Explore careers and save the ones that interest you
                    </p>
                    <Button variant="outline" size="sm" asChild data-testid="button-explore-careers">
                      <Link href="/careers">
                        Explore Careers <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedCareers.slice(0, 4).map((career) => (
                      <Link key={career.id} href={`/careers/${career.id}`}>
                        <div className="flex items-center gap-3 p-2 rounded-md bg-muted/30 hover-elevate cursor-pointer">
                          <GraduationCap className="w-5 h-5 text-lys-teal" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{career.title}</p>
                            <p className="text-xs text-muted-foreground">{career.category}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {savedCareers.length > 4 && (
                      <Button variant="ghost" size="sm" className="w-full" asChild>
                        <Link href="/careers?tab=saved">
                          View all {savedCareers.length} careers
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <UpcomingDeadlines role="student" />
            <StudentMessagingWidget />
          </div>
        </div>
      </section>

      <section className="py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="font-marker text-2xl sm:text-3xl text-foreground mb-2">
              The Be-Know-Do Method
            </h2>
            <p className="font-roboto text-muted-foreground max-w-2xl mx-auto">
              Discover who you are, explore what's possible, and take action toward your dreams.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <BKDCard
              type="be"
              title="Discover Yourself"
              description="Understand your unique strengths, values, and personality to build confidence in who you are."
              icon={<Heart className="h-6 w-6" />}
              href="/self-discovery"
            />
            <BKDCard
              type="know"
              title="Explore Possibilities"
              description="Research careers, education paths, and opportunities that match your interests and goals."
              icon={<Compass className="h-6 w-6" />}
              href="/careers"
            />
            <BKDCard
              type="do"
              title="Take Action"
              description="Set goals, track progress, and celebrate achievements as you build your future."
              icon={<Target className="h-6 w-6" />}
              href="/action-plans"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function EducatorDashboard() {
  const { isAuthenticated } = useAuth();
  const [showDemo, setShowDemo] = useState(false);

  const { data: lessonsData } = useQuery<any[]>({
    queryKey: ["/api/lessons"],
    enabled: isAuthenticated,
  });

  const { data: goalsData } = useQuery<any[]>({
    queryKey: ["/api/goals"],
    enabled: isAuthenticated,
  });

  const { data: communityStats } = useQuery<{ educators: number; students: number }>({
    queryKey: ["/api/stats/community"],
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const res = await fetch("/api/stats/community");
      if (!res.ok) return { educators: 0, students: 0 };
      return res.json();
    },
  });

  const lessons = lessonsData || [];
  const goals = goalsData || [];
  const totalLessons = lessons.length;
  const totalGoals = goals.length;

  const recentLessons = lessons.slice(0, 3).map((l: any) => ({
    title: l.title || l.topic,
    type: "Lesson",
    time: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : "Recently",
    badge: (l.bkdFocus || "know").toUpperCase(),
  }));

  return (
    <div className="min-h-screen bg-background" data-testid="educator-dashboard">
      <section className="relative overflow-hidden bg-gradient-to-br from-lys-yellow/20 via-background to-lys-teal/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <Badge className="bg-lys-red/10 text-lys-red border-lys-red/20 mb-4 font-roboto">
                For Educators Who Inspire
              </Badge>
              <h1 className="font-marker text-4xl sm:text-5xl lg:text-6xl text-foreground mb-4 leading-tight">
                Your Students' Success Starts Here
              </h1>
              <p className="font-oswald text-lg sm:text-xl text-muted-foreground mb-6">
                AI-powered tools that handle the busywork so you can focus on what matters: inspiring young minds.
              </p>
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <Link href="/lesson-generator">
                  <Button 
                    size="lg" 
                    className="bg-lys-red hover:bg-lys-red/90 text-white font-oswald gap-2"
                    data-testid="button-try-ai-lesson"
                  >
                    <Sparkles className="h-5 w-5" />
                    Try AI Lesson Planner
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="font-oswald gap-2 border-lys-yellow text-lys-yellow hover:bg-lys-yellow/10"
                  onClick={() => setShowDemo(true)}
                  data-testid="button-watch-demo"
                >
                  <Play className="h-4 w-4" />
                  Watch 2min Demo
                </Button>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-lys-yellow to-lys-red flex items-center justify-center text-white text-xs font-bold border-2 border-background"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span className="font-roboto">
                  {communityStats && communityStats.educators > 0
                    ? <>Join <strong>{communityStats.educators.toLocaleString()}+</strong> educators on LYS</>
                    : <>Join educators transforming student futures</>}
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-lys-yellow/30 to-lys-teal/30 rounded-2xl blur-3xl"></div>
              <div className="relative bg-card rounded-2xl border shadow-lg p-6 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <div className="w-10 h-10 rounded-full bg-lys-red/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-lys-red" />
                  </div>
                  <div>
                    <p className="font-oswald font-semibold">AI Lesson Generated</p>
                    <p className="text-xs text-muted-foreground font-roboto">Just now</p>
                  </div>
                  <Badge className="ml-auto bg-green-500/10 text-green-600 border-green-500/20">
                    <Star className="h-3 w-3 mr-1" />
                    Saved 45 min
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-roboto">Growth Mindset for 9th Grade</span>
                    <Badge variant="secondary" className="text-xs">BE Focus</Badge>
                  </div>
                  <Progress value={100} className="h-2" />
                  <p className="text-xs text-muted-foreground font-roboto italic">
                    "Great job! This lesson aligns with SEL standards and your BE-KNOW-DO framework."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isAuthenticated && (
        <>
          <section className="py-6 pb-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <GettingStartedGuide />
            </div>
          </section>
          <section className="py-8 lg:py-12 bg-muted/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <JourneyProgressCard />
            </div>
          </section>
        </>
      )}

      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="font-marker text-3xl sm:text-4xl text-foreground mb-2">
              The Be-Know-Do Method
            </h2>
            <p className="font-roboto text-muted-foreground max-w-2xl mx-auto">
              Our proven framework helps students discover their purpose, build essential knowledge, and take meaningful action.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <BKDCard
              type="be"
              title="Identity Assessments"
              description="Help students discover their unique strengths, values, and personality traits to build unshakeable confidence."
              icon={<Heart className="h-6 w-6" />}
              href="/assessments"
              stats={{ label: "Students Assessed", value: "2,847" }}
            />
            <BKDCard
              type="know"
              title="Career Pathways"
              description="Explore 500+ careers with salary data, education requirements, and clear pathways to success."
              icon={<Compass className="h-6 w-6" />}
              href="/careers"
              stats={{ label: "Careers Explored", value: "12,394" }}
            />
            <BKDCard
              type="do"
              title="Action Planning"
              description="Transform goals into achievements with milestone tracking and progress visualization."
              icon={<Target className="h-6 w-6" />}
              href="/action-plans"
              stats={{ label: "Goals Completed", value: "8,521" }}
            />
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="font-marker text-2xl sm:text-3xl text-foreground mb-1">
                Quick Actions
              </h2>
              <p className="font-roboto text-muted-foreground text-sm">
                Your most-used tools, one click away
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/lesson-generator">
              <Card className="hover-elevate cursor-pointer group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-lys-red/10 flex items-center justify-center text-lys-red group-hover:scale-105 transition-transform">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-oswald font-semibold truncate">New AI Lesson</p>
                    <p className="text-xs text-muted-foreground font-roboto">Generate in seconds</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/assessments">
              <Card className="hover-elevate cursor-pointer group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-lys-yellow/10 flex items-center justify-center text-lys-yellow group-hover:scale-105 transition-transform">
                    <Heart className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-oswald font-semibold truncate">Start Assessment</p>
                    <p className="text-xs text-muted-foreground font-roboto">Discover strengths</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/careers">
              <Card className="hover-elevate cursor-pointer group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-lys-teal/10 flex items-center justify-center text-lys-teal group-hover:scale-105 transition-transform">
                    <Compass className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-oswald font-semibold truncate">Explore Careers</p>
                    <p className="text-xs text-muted-foreground font-roboto">500+ pathways</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/resources">
              <Card className="hover-elevate cursor-pointer group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-oswald font-semibold truncate">Resources</p>
                    <p className="text-xs text-muted-foreground font-roboto">Scholarships & more</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {isAuthenticated && (
        <section className="py-6 lg:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <UpcomingDeadlines role="educator" />
              <NewEducatorChecklist lessonsCount={totalLessons} goalsCount={totalGoals} />
            </div>
          </div>
        </section>
      )}

      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="font-oswald">Recent Activity</CardTitle>
                  <p className="text-sm text-muted-foreground font-roboto">Your latest lessons and assessments</p>
                </div>
                <Button variant="ghost" size="sm" className="font-roboto gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(recentLessons.length > 0 ? recentLessons : [
                    { title: "No lessons yet", type: "Lesson", time: "Create your first!", badge: "BE" },
                  ]).map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-md bg-muted/30 hover-elevate">
                      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                        {item.type === "Lesson" ? (
                          <BookOpen className="h-5 w-5 text-primary" />
                        ) : (
                          <Users className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-oswald font-medium truncate">{item.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-roboto">
                          <Clock className="h-3 w-3" />
                          <span>{item.time}</span>
                        </div>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          item.badge === "BE" ? "bg-lys-yellow/20 text-lys-yellow" :
                          item.badge === "KNOW" ? "bg-lys-teal/20 text-lys-teal" :
                          "bg-lys-red/20 text-lys-red"
                        }`}
                      >
                        {item.badge}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-oswald flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-lys-red" />
                  Your Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <p className="font-marker text-4xl text-lys-red mb-1" data-testid="text-total-lessons">{totalLessons}</p>
                  <p className="text-sm text-muted-foreground font-roboto">Lessons Created</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-lys-yellow/10 rounded-md">
                    <p className="font-oswald text-xl font-semibold text-lys-yellow" data-testid="text-total-goals">{totalGoals}</p>
                    <p className="text-xs text-muted-foreground font-roboto">Goals Set</p>
                  </div>
                  <div className="text-center p-3 bg-lys-teal/10 rounded-md">
                    <p className="font-oswald text-xl font-semibold text-lys-teal" data-testid="text-goal-completion">{goals.filter((g: any) => g.status === "completed").length}</p>
                    <p className="text-xs text-muted-foreground font-roboto">Goals Completed</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground font-roboto text-center italic">
                    "Every student you guide is a future transformed."
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <DemoVideoModal open={showDemo} onOpenChange={setShowDemo} />
    </div>
  );
}

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();
  const isStudent = user?.role === "student";

  if (isAuthenticated && isStudent) {
    return <StudentDashboard />;
  }

  return <EducatorDashboard />;
}
