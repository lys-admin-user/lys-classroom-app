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
  Edit3
} from "lucide-react";
import type { StudentJourneyProgress, StudentJourneyMilestone, Assignment, AssignmentRecipient, Student, StudentPortfolio, PortfolioItem, PortfolioComment } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";

interface JourneyData {
  progress: StudentJourneyProgress;
  milestones: StudentJourneyMilestone[];
  activities: any[];
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
  const assignments = assignmentsData || [];
  
  const pendingAssignments = assignments.filter(a => a.recipient.status === "assigned" || a.recipient.status === "in_progress");
  const completedAssignments = assignments.filter(a => a.recipient.status === "submitted" || a.recipient.status === "graded");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-md bg-lys-red/10 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-lys-red" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-marker">
              {student ? `${student.firstName}'s Dashboard` : "Student Dashboard"}
            </h1>
            <p className="text-muted-foreground font-roboto">
              Your Be-Know-Do learning journey
            </p>
          </div>
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
              <TabsList className="w-full justify-start mb-4">
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="assignments" data-testid="tab-assignments">
                  Assignments
                  {pendingAssignments.length > 0 && (
                    <Badge variant="destructive" className="ml-2">{pendingAssignments.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="milestones" data-testid="tab-milestones">Milestones</TabsTrigger>
                <TabsTrigger value="portfolio" data-testid="tab-portfolio">
                  <FolderOpen className="w-4 h-4 mr-1" />
                  Portfolio
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {progress ? (
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
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Start Your Journey</h3>
                      <p className="text-muted-foreground mb-4">
                        Take the Self-Discovery assessment to begin tracking your Be-Know-Do progress.
                      </p>
                      <Button asChild>
                        <Link href="/self-discovery">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Take Assessment
                        </Link>
                      </Button>
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
                    <CardTitle className="flex items-center gap-2 font-oswald">
                      <Trophy className="w-5 h-5 text-lys-yellow" />
                      Your Milestones
                    </CardTitle>
                    <CardDescription className="font-roboto">
                      Track your achievements across Be-Know-Do
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {milestones.length === 0 ? (
                      <div className="py-8 text-center">
                        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Complete assessments and assignments to earn milestones.
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
                          <Link href="/portfolio/builder">
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
                              <Link href="/portfolio/builder">
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
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
