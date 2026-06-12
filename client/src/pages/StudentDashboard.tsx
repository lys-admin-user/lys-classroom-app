import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Heart, 
  Compass, 
  Target, 
  TrendingUp, 
  Calendar,
  Trophy,
  Loader2,
  ClipboardList,
  Clock,
  CheckCircle2,
  Circle,
  Star,
  BookOpen,
  Briefcase,
  FileText,
  AlertCircle,
  GraduationCap,
  Sparkles,
  Map,
  FolderOpen,
  MessageSquare,
  Send,
  Trash2,
  Edit3,
  Activity,
  Plus,
  ArrowLeft
} from "lucide-react";
import type { StudentJourneyProgress, StudentJourneyMilestone, StudentJourneyActivity, Assignment, AssignmentRecipient, Student, StudentPortfolio, PortfolioItem, PortfolioComment } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { hasRolePrivilege } from "@shared/models/auth";

interface JourneyData {
  progress: StudentJourneyProgress;
  milestones: StudentJourneyMilestone[];
  activities: StudentJourneyActivity[];
}

interface StudentAssignment {
  assignment: Assignment;
  recipient: AssignmentRecipient;
}

const categoryConfig = {
  be: { 
    label: "Being", 
    icon: Heart, 
    color: "text-rose-500", 
    bgColor: "bg-rose-500",
    description: "Self-awareness and identity" 
  },
  know: { 
    label: "Knowing", 
    icon: Compass, 
    color: "text-blue-500", 
    bgColor: "bg-blue-500",
    description: "Knowledge and exploration" 
  },
  do: { 
    label: "Doing", 
    icon: Target, 
    color: "text-emerald-500", 
    bgColor: "bg-emerald-500",
    description: "Action and achievement" 
  },
};

function ScoreRing({ score, category, size = "md" }: { score: number; category: "be" | "know" | "do"; size?: "sm" | "md" | "lg" }) {
  const config = categoryConfig[category];
  const Icon = config.icon;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  
  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };
  
  return (
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-muted/30"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={config.color}
          style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Icon className={`w-5 h-5 ${config.color}`} />
        <span className="text-lg font-bold mt-1">{score}</span>
      </div>
    </div>
  );
}

function AssignmentCard({ assignment, recipient }: { assignment: Assignment; recipient: AssignmentRecipient }) {
  const statusConfig = {
    assigned: { icon: Circle, label: "Not Started", color: "text-muted-foreground", bg: "bg-muted" },
    in_progress: { icon: Clock, label: "In Progress", color: "text-amber-500", bg: "bg-amber-500/10" },
    submitted: { icon: CheckCircle2, label: "Submitted", color: "text-blue-500", bg: "bg-blue-500/10" },
    graded: { icon: Star, label: "Graded", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  };
  
  const status = statusConfig[recipient.status as keyof typeof statusConfig] || statusConfig.assigned;
  const StatusIcon = status.icon;
  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date() && recipient.status === "assigned";
  
  return (
    <Card className="hover-elevate" data-testid={`card-assignment-${assignment.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-md ${status.bg}`}>
            <FileText className={`w-5 h-5 ${status.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium">{assignment.title}</h4>
              <Badge variant="outline" className={status.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Overdue
                </Badge>
              )}
            </div>
            {assignment.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {assignment.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {assignment.dueDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                {assignment.totalPoints} points
              </span>
              {recipient.score !== null && recipient.score !== undefined && (
                <span className="flex items-center gap-1 text-emerald-500">
                  Score: {recipient.score}/{assignment.totalPoints}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const activityTypeConfig: Record<string, { icon: typeof BookOpen; color: string }> = {
  assessment: { icon: Sparkles, color: "text-violet-500" },
  lesson: { icon: BookOpen, color: "text-blue-500" },
  career_exploration: { icon: Briefcase, color: "text-amber-500" },
  goal_progress: { icon: TrendingUp, color: "text-emerald-500" },
  reflection: { icon: Heart, color: "text-rose-500" },
  milestone_achieved: { icon: Trophy, color: "text-primary" },
};

function ActivityItem({ activity }: { activity: StudentJourneyActivity }) {
  const config = activityTypeConfig[activity.activityType] || activityTypeConfig.lesson;
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="p-2 rounded-full bg-muted">
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{activity.title}</p>
        {activity.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
        )}
        {activity.pointsEarned > 0 && (
          <Badge variant="secondary" className="mt-1 text-xs">
            +{activity.pointsEarned} points
          </Badge>
        )}
      </div>
      <span className="text-xs text-muted-foreground">
        {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString() : "Today"}
      </span>
    </div>
  );
}

const studentFeatures = [
  { id: "journey", name: "My Journey", icon: TrendingUp, path: "#journey", description: "Track your Be-Know-Do progress" },
  { id: "assignments", name: "Assignments", icon: ClipboardList, path: "#assignments", description: "View and complete your assignments" },
  { id: "milestones", name: "Milestones", icon: Trophy, path: "#milestones", description: "Celebrate your achievements" },
  { id: "portfolio", name: "Portfolio", icon: FolderOpen, path: "#portfolio", description: "Showcase your best work" },
  { id: "careers", name: "Career Explorer", icon: Briefcase, path: "/careers", description: "Discover career pathways" },
  { id: "discovery", name: "Self-Discovery", icon: Sparkles, path: "/self-discovery", description: "Learn about yourself" },
];

interface PortfolioData {
  portfolio: StudentPortfolio;
  items: PortfolioItem[];
}

export default function StudentDashboard() {
  const { studentId } = useParams<{ studentId: string }>();
  const [activeTab, setActiveTab] = useState("overview");
  const [newComment, setNewComment] = useState("");
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const isEducatorView = !!currentUser && hasRolePrivilege((currentUser.role ?? "student"), "educator");
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    category: "do" as "be" | "know" | "do",
  });

  const { data: student, isLoading: studentLoading } = useQuery<Student>({
    queryKey: ["/api/students", studentId],
    enabled: !!studentId,
  });

  const { data: journeyData, isLoading: journeyLoading } = useQuery<JourneyData>({
    queryKey: ["/api/student-journey", studentId],
    enabled: !!studentId,
  });

  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery<StudentAssignment[]>({
    queryKey: ["/api/student-assignments", studentId],
    enabled: !!studentId,
  });

  const { data: portfolio } = useQuery<StudentPortfolio | null>({
    queryKey: ["/api/portfolio"],
  });

  const { data: portfolioItems } = useQuery<PortfolioItem[]>({
    queryKey: ["/api/portfolio", portfolio?.id, "items"],
    enabled: !!portfolio?.id,
  });

  const { data: portfolioComments } = useQuery<PortfolioComment[]>({
    queryKey: ["/api/portfolio", portfolio?.id, "comments"],
    enabled: !!portfolio?.id,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/portfolio/${portfolio?.id}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio", portfolio?.id, "comments"] });
      setNewComment("");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return apiRequest("DELETE", `/api/portfolio/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio", portfolio?.id, "comments"] });
    },
  });

  const createJourneyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/student-journey", { studentId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student-journey", studentId] });
      toast({ title: "Journey started", description: "This student's journey has been created." });
    },
    onError: () => {
      toast({ title: "Failed to create journey", variant: "destructive" });
    },
  });

  const addMilestoneMutation = useMutation({
    mutationFn: async (milestone: typeof newMilestone) => {
      if (!journeyData?.progress.id) throw new Error("No journey progress");
      const res = await apiRequest(
        "POST",
        `/api/student-journey/${journeyData.progress.id}/milestone`,
        { ...milestone, studentId }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student-journey", studentId] });
      setIsAddMilestoneOpen(false);
      setNewMilestone({ title: "", description: "", category: "do" });
      toast({ title: "Milestone added", description: "New milestone has been created for this journey." });
    },
    onError: () => {
      toast({ title: "Failed to add milestone", variant: "destructive" });
    },
  });

  const isLoading = studentLoading || journeyLoading || assignmentsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const progress = journeyData?.progress;
  const milestones = journeyData?.milestones || [];
  const activities = journeyData?.activities || [];
  const assignments = assignmentsData || [];

  const studentInitials = student
    ? (`${student.firstName?.[0] ?? ""}${student.lastName?.[0] ?? ""}`.toUpperCase() || "ST")
    : "ST";
  const focusLabel = progress
    ? ({ be: "Being", know: "Knowing", do: "Doing" } as const)[progress.currentFocus ?? "be"]
    : "";
  const statusBadge = (progress?.overallScore ?? 0) >= 50
    ? { label: "On track", className: "bg-emerald-100 text-emerald-700" }
    : { label: "Getting started", className: "bg-amber-100 text-amber-800" };
  
  const pendingAssignments = assignments.filter(a => a.recipient.status === "assigned" || a.recipient.status === "in_progress");
  const completedAssignments = assignments.filter(a => a.recipient.status === "submitted" || a.recipient.status === "graded");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {isEducatorView && (
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground" data-testid="button-back-classroom">
            <Link href="/classroom">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Classroom roster
            </Link>
          </Button>
        )}

        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-lys-red to-blue-500 flex items-center justify-center text-white text-xl font-bold font-oswald shrink-0" data-testid="avatar-student">
            {studentInitials}
          </div>
          <div>
            <h1 className="text-2xl font-bold font-oswald tracking-tight" data-testid="text-student-name">
              {student ? `${student.firstName} ${student.lastName}` : "Student Dashboard"}
            </h1>
            <p className="text-muted-foreground font-roboto text-sm">
              {[student?.gradeLevel ? `Grade ${student.gradeLevel}` : null, "Be-Know-Do Pathway"].filter(Boolean).join(" · ")}
            </p>
          </div>
          {progress && (
            <div className="ml-auto">
              <Badge className={statusBadge.className} data-testid="badge-status">{statusBadge.label}</Badge>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-oswald">
                  <Map className="w-4 h-4" />
                  Quick Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {studentFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <Button
                      key={feature.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        if (feature.path.startsWith("#")) {
                          setActiveTab(feature.id === "journey" ? "overview" : feature.id);
                        }
                      }}
                      asChild={!feature.path.startsWith("#")}
                      data-testid={`button-feature-${feature.id}`}
                    >
                      {feature.path.startsWith("#") ? (
                        <>
                          <Icon className="w-4 h-4 mr-2" />
                          <span className="font-roboto text-sm">{feature.name}</span>
                        </>
                      ) : (
                        <Link href={feature.path}>
                          <Icon className="w-4 h-4 mr-2" />
                          <span className="font-roboto text-sm">{feature.name}</span>
                        </Link>
                      )}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            {progress && (
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-oswald">Journey Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Assessments</span>
                    <Badge variant="secondary">{progress.totalAssessmentsCompleted}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Milestones</span>
                    <Badge variant="secondary">{progress.totalMilestonesAchieved}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Assignments</span>
                    <Badge variant="secondary">{assignments.length}</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Score</span>
                    <span className="text-lg font-bold">{progress.overallScore}%</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full flex flex-wrap h-auto justify-start gap-1 mb-4">
                <TabsTrigger value="overview" data-testid="tab-overview">
                  <Star className="w-4 h-4 mr-1" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="assignments" data-testid="tab-assignments">
                  <ClipboardList className="w-4 h-4 mr-1" />
                  Assignments
                  {pendingAssignments.length > 0 && (
                    <Badge variant="destructive" className="ml-2">{pendingAssignments.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="milestones" data-testid="tab-milestones">
                  <Trophy className="w-4 h-4 mr-1" />
                  Milestones
                </TabsTrigger>
                <TabsTrigger value="portfolio" data-testid="tab-portfolio">
                  <FolderOpen className="w-4 h-4 mr-1" />
                  Portfolio
                </TabsTrigger>
                <TabsTrigger value="activity" data-testid="tab-activity">
                  <Activity className="w-4 h-4 mr-1" />
                  Activity
                </TabsTrigger>
                <TabsTrigger value="careers" data-testid="tab-careers">
                  <Briefcase className="w-4 h-4 mr-1" />
                  Careers
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {progress ? (
                  <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 font-oswald">
                        <TrendingUp className="w-5 h-5" />
                        Be-Know-Do Progress
                      </CardTitle>
                      <CardDescription className="font-roboto">
                        Your growth across all three dimensions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-around flex-wrap gap-6">
                        <div className="flex flex-col items-center">
                          <ScoreRing score={progress.beScore} category="be" />
                          <span className="font-medium mt-2 font-oswald">Being</span>
                          <span className="text-xs text-muted-foreground">Who you are</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <ScoreRing score={progress.knowScore} category="know" />
                          <span className="font-medium mt-2 font-oswald">Knowing</span>
                          <span className="text-xs text-muted-foreground">What you learn</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <ScoreRing score={progress.doScore} category="do" />
                          <span className="font-medium mt-2 font-oswald">Doing</span>
                          <span className="text-xs text-muted-foreground">What you achieve</span>
                        </div>
                      </div>
                      
                      <div className="mt-8 p-4 bg-muted/30 rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium font-oswald">Overall Progress</span>
                          <span className="text-2xl font-bold">{progress.overallScore}%</span>
                        </div>
                        <Progress value={progress.overallScore} className="h-3" />
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: "Current Focus", value: focusLabel, icon: Compass },
                      { label: "Milestones Earned", value: `${progress.totalMilestonesAchieved} of ${milestones.length}`, icon: Trophy },
                      { label: "Assessments Completed", value: String(progress.totalAssessmentsCompleted), icon: CheckCircle2 },
                    ].map((s) => (
                      <Card key={s.label} data-testid={`stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>
                        <CardContent className="pt-5">
                          <s.icon className="h-5 w-5 text-muted-foreground mb-2" />
                          <p className="text-lg font-semibold">{s.value}</p>
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        {isEducatorView ? "Journey Not Started" : "Start Your Journey"}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {isEducatorView
                          ? "This student's Be-Know-Do journey hasn't been started yet. Create a journey to begin tracking their progress."
                          : "Take the Self-Discovery assessment to begin tracking your Be-Know-Do progress."}
                      </p>
                      {isEducatorView ? (
                        <Button
                          onClick={() => createJourneyMutation.mutate()}
                          disabled={createJourneyMutation.isPending}
                          data-testid="button-create-journey"
                        >
                          {createJourneyMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4 mr-2" />
                          )}
                          Start Journey
                        </Button>
                      ) : (
                        <Button asChild>
                          <Link href="/self-discovery">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Take Assessment
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {pendingAssignments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 font-oswald">
                        <ClipboardList className="w-5 h-5" />
                        Upcoming Assignments
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {pendingAssignments.slice(0, 3).map((item) => (
                        <AssignmentCard 
                          key={item.recipient.id} 
                          assignment={item.assignment} 
                          recipient={item.recipient} 
                        />
                      ))}
                      {pendingAssignments.length > 3 && (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setActiveTab("assignments")}
                        >
                          View All ({pendingAssignments.length} total)
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="assignments" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-oswald">
                      <Clock className="w-5 h-5 text-amber-500" />
                      Pending Assignments
                    </CardTitle>
                    <CardDescription className="font-roboto">
                      Assignments you need to complete
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingAssignments.length === 0 ? (
                      <div className="py-8 text-center">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                        <p className="text-muted-foreground">All caught up! No pending assignments.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingAssignments.map((item) => (
                          <AssignmentCard 
                            key={item.recipient.id} 
                            assignment={item.assignment} 
                            recipient={item.recipient} 
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {completedAssignments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 font-oswald">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        Completed Assignments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-[400px]">
                        <div className="space-y-3 pr-4">
                          {completedAssignments.map((item) => (
                            <AssignmentCard 
                              key={item.recipient.id} 
                              assignment={item.assignment} 
                              recipient={item.recipient} 
                            />
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="milestones" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <CardTitle className="flex items-center gap-2 font-oswald">
                          <Trophy className="w-5 h-5 text-lys-yellow" />
                          {isEducatorView ? "Journey Milestones" : "Your Milestones"}
                        </CardTitle>
                        <CardDescription className="font-roboto">
                          Track your achievements across Be-Know-Do
                        </CardDescription>
                      </div>
                      {isEducatorView && progress && (
                        <Dialog open={isAddMilestoneOpen} onOpenChange={setIsAddMilestoneOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" data-testid="button-add-milestone">
                              <Plus className="w-4 h-4 mr-2" />
                              Add Milestone
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add New Milestone</DialogTitle>
                              <DialogDescription>
                                Create a new milestone to track progress in the Be-Know-Do journey.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="milestone-title">Title</Label>
                                <Input
                                  id="milestone-title"
                                  value={newMilestone.title}
                                  onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                                  placeholder="e.g., Complete self-reflection journal"
                                  data-testid="input-milestone-title"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="milestone-category">Category</Label>
                                <Select
                                  value={newMilestone.category}
                                  onValueChange={(value: "be" | "know" | "do") =>
                                    setNewMilestone({ ...newMilestone, category: value })
                                  }
                                >
                                  <SelectTrigger data-testid="select-milestone-category">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="be">
                                      <div className="flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-rose-500" />
                                        Being
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="know">
                                      <div className="flex items-center gap-2">
                                        <Compass className="w-4 h-4 text-blue-500" />
                                        Knowing
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="do">
                                      <div className="flex items-center gap-2">
                                        <Target className="w-4 h-4 text-emerald-500" />
                                        Doing
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="milestone-description">Description (optional)</Label>
                                <Textarea
                                  id="milestone-description"
                                  value={newMilestone.description}
                                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                                  placeholder="Describe what this milestone represents..."
                                  data-testid="input-milestone-description"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsAddMilestoneOpen(false)}>
                                Cancel
                              </Button>
                              <Button
                                onClick={() => addMilestoneMutation.mutate(newMilestone)}
                                disabled={!newMilestone.title || addMilestoneMutation.isPending}
                                data-testid="button-save-milestone"
                              >
                                {addMilestoneMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Save Milestone
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {milestones.length === 0 ? (
                      <div className="py-8 text-center">
                        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          {isEducatorView
                            ? "No milestones yet. Add milestones to track important achievements."
                            : "Complete assessments and assignments to earn milestones."}
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {milestones.map((milestone) => {
                          const config = categoryConfig[milestone.category as keyof typeof categoryConfig] || categoryConfig.do;
                          const statusConfig = {
                            not_started: { icon: Circle, label: "Not Started", color: "text-muted-foreground" },
                            in_progress: { icon: Clock, label: "In Progress", color: "text-amber-500" },
                            completed: { icon: CheckCircle2, label: "Completed", color: "text-emerald-500" },
                            mastered: { icon: Star, label: "Mastered", color: "text-primary" },
                          };
                          const status = statusConfig[milestone.status as keyof typeof statusConfig] || statusConfig.not_started;
                          const StatusIcon = status.icon;
                          
                          return (
                            <div 
                              key={milestone.id} 
                              className="flex items-start gap-3 p-3 rounded-md bg-muted/30"
                              data-testid={`milestone-${milestone.id}`}
                            >
                              <div className={`p-2 rounded-md ${config.bgColor}/10`}>
                                <config.icon className={`w-5 h-5 ${config.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-medium">{milestone.title}</h4>
                                  <Badge variant="outline" className={status.color}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {status.label}
                                  </Badge>
                                </div>
                                {milestone.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {milestone.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="portfolio" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-oswald">
                      <FolderOpen className="w-5 h-5 text-lys-teal" />
                      My Portfolio
                    </CardTitle>
                    <CardDescription className="font-roboto">
                      Showcase your best work to colleges, employers, and scholarship committees
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!portfolio ? (
                      <div className="py-8 text-center">
                        <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">
                          You haven't created a portfolio yet. Start showcasing your best work!
                        </p>
                        <Button asChild>
                          <Link href="/portfolio">
                            <FolderOpen className="w-4 h-4 mr-2" />
                            Create Portfolio
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div>
                            <h3 className="font-medium">{portfolio.title}</h3>
                            <p className="text-sm text-muted-foreground">{portfolio.bio || "No bio added"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{portfolio.privacy}</Badge>
                            <Badge variant="secondary">{portfolio.viewCount || 0} views</Badge>
                            <Button variant="outline" size="sm" asChild>
                              <Link href="/portfolio">
                                <Edit3 className="w-4 h-4 mr-1" />
                                Edit
                              </Link>
                            </Button>
                          </div>
                        </div>
                        <Separator />
                        
                        {portfolioItems && portfolioItems.length > 0 ? (
                          <div className="grid gap-3">
                            {portfolioItems.map((item) => {
                              const bkdConfig = {
                                be: { color: "text-lys-yellow", bg: "bg-lys-yellow/10" },
                                know: { color: "text-lys-teal", bg: "bg-lys-teal/10" },
                                do: { color: "text-lys-red", bg: "bg-lys-red/10" },
                              };
                              const bkd = bkdConfig[item.bkdFocus as keyof typeof bkdConfig] || bkdConfig.do;
                              
                              return (
                                <div 
                                  key={item.id} 
                                  className="p-4 rounded-md bg-muted/30"
                                  data-testid={`portfolio-item-${item.id}`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-md ${bkd.bg}`}>
                                      <FileText className={`w-5 h-5 ${bkd.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-medium">{item.customTitle}</h4>
                                        <Badge variant="outline" className="capitalize">{item.itemType}</Badge>
                                        {item.bkdFocus && (
                                          <Badge className={bkd.bg + " " + bkd.color + " border-0"}>
                                            {item.bkdFocus.toUpperCase()}
                                          </Badge>
                                        )}
                                      </div>
                                      {item.customDescription && (
                                        <p className="text-sm text-muted-foreground mt-1">{item.customDescription}</p>
                                      )}
                                      {item.skills && item.skills.length > 0 && (
                                        <div className="flex gap-1 mt-2 flex-wrap">
                                          {item.skills.map((skill, i) => (
                                            <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-4 text-center text-muted-foreground">
                            <p>No items in your portfolio yet. Add your best work!</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {portfolio && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 font-oswald">
                        <MessageSquare className="w-5 h-5" />
                        Feedback & Comments
                      </CardTitle>
                      <CardDescription className="font-roboto">
                        Comments from teachers, parents, and yourself
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Add a comment or note about your portfolio..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="min-h-[80px]"
                            data-testid="input-portfolio-comment"
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button 
                            onClick={() => createCommentMutation.mutate(newComment)}
                            disabled={!newComment.trim() || createCommentMutation.isPending}
                            data-testid="button-submit-comment"
                          >
                            {createCommentMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Send className="w-4 h-4 mr-2" />
                            )}
                            Post Comment
                          </Button>
                        </div>
                        
                        <Separator />
                        
                        {portfolioComments && portfolioComments.length > 0 ? (
                          <div className="space-y-3">
                            {portfolioComments.map((comment) => {
                              const roleColors: Record<string, string> = {
                                student: "bg-blue-500/10 text-blue-600",
                                educator: "bg-emerald-500/10 text-emerald-600",
                                campus_admin: "bg-purple-500/10 text-purple-600",
                                parent: "bg-amber-500/10 text-amber-600",
                              };
                              const roleColor = roleColors[comment.authorRole] || roleColors.student;
                              
                              return (
                                <div 
                                  key={comment.id} 
                                  className="p-3 rounded-md bg-muted/30"
                                  data-testid={`comment-${comment.id}`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">{comment.authorName}</span>
                                      <Badge className={roleColor + " border-0 text-xs capitalize"}>
                                        {comment.authorRole.replace("_", " ")}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ""}
                                      </span>
                                    </div>
                                    {currentUser && comment.authorId === currentUser.id && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => deleteCommentMutation.mutate(comment.id)}
                                        data-testid={`button-delete-comment-${comment.id}`}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                  <p className="text-sm mt-2">{comment.content}</p>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-4 text-center text-muted-foreground">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No comments yet. Be the first to add one!</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-oswald">
                      <Activity className="w-5 h-5" />
                      Activity Timeline
                    </CardTitle>
                    <CardDescription className="font-roboto">
                      Recent learning activities and achievements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activities.length === 0 ? (
                      <div className="py-8 text-center">
                        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No activities recorded yet.</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px] pr-4">
                        {activities.map((activity) => (
                          <ActivityItem key={activity.id} activity={activity} />
                        ))}
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="careers" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-oswald">
                      <Briefcase className="w-5 h-5" />
                      Saved Career Interests
                    </CardTitle>
                    <CardDescription className="font-roboto">
                      Careers you have explored and saved
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(!progress?.savedCareerIds || progress.savedCareerIds.length === 0) ? (
                      <div className="py-8 text-center">
                        <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">No saved careers yet.</p>
                        <Button variant="outline" asChild data-testid="button-explore-careers">
                          <Link href="/careers">Explore Careers</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {progress.savedCareerIds.map((careerId, index) => (
                          <div
                            key={careerId}
                            className="flex items-center gap-3 p-3 bg-muted/30 rounded-md"
                            data-testid={`career-${careerId}`}
                          >
                            <Briefcase className="w-5 h-5 text-muted-foreground" />
                            <span>Career #{index + 1}</span>
                            <Button variant="ghost" size="sm" asChild className="ml-auto">
                              <Link href={`/careers?id=${careerId}`}>View Details</Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
