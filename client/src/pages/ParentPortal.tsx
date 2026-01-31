import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  UserPlus, 
  Mail, 
  Eye,
  EyeOff,
  Target,
  Briefcase,
  BookOpen,
  MessageSquare,
  Send,
  Trash2,
  Check,
  Clock,
  AlertCircle,
  Shield,
  Heart,
  ChevronRight,
  TrendingUp,
  Calendar,
  Star,
  Award,
  Activity,
  FileText,
  GraduationCap,
  Milestone,
  Brain,
  Compass
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ParentStudentLink, ParentInvitation, Goal } from "@shared/schema";

type ParentPermissions = {
  viewGoals?: boolean;
  viewAssessments?: boolean;
  viewCareers?: boolean;
  viewLessons?: boolean;
  viewPortfolio?: boolean;
  viewMilestones?: boolean;
  viewActivities?: boolean;
  viewAssignments?: boolean;
  receiveNotifications?: boolean;
};

type EnrichedLink = ParentStudentLink & {
  linkedUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
};

type JourneyProgress = {
  beScore: number;
  knowScore: number;
  doScore: number;
  overallScore: number;
  totalAssessmentsCompleted: number;
  totalMilestonesAchieved: number;
  currentFocus: string;
  lastActivityDate: string;
};

type StudentActivity = {
  id: string;
  activityType: string;
  title: string;
  description: string;
  category: string;
  pointsEarned: number;
  createdAt: string;
};

type PortfolioItem = {
  id: string;
  title: string;
  description: string;
  itemType: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  displayOrder: number;
  createdAt: string;
};

type StudentPortfolio = {
  id: string;
  userId: string;
  title: string;
  bio: string;
  theme: string;
  visibility: string;
  items: PortfolioItem[];
};

type StudentAssignment = {
  id: string;
  title: string;
  type: string;
  status: string;
  grade?: number;
  submittedAt?: string;
  dueDate?: string;
  feedback?: string;
};

type StudentData = {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  journeyProgress?: JourneyProgress;
  goals?: Goal[];
  assessments?: any[];
  savedCareers?: any[];
  milestones?: any[];
  recentActivities?: StudentActivity[];
  portfolio?: StudentPortfolio;
  assignments?: StudentAssignment[];
  notes?: any[];
};

function BeKnowDoProgress({ beScore, knowScore, doScore, overallScore }: { beScore: number; knowScore: number; doScore: number; overallScore: number }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="relative inline-flex items-center justify-center">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${overallScore * 3.52} 352`}
              className="text-lys-teal"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{overallScore}%</span>
            <span className="text-xs text-muted-foreground">Overall</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-lys-red/10 flex items-center justify-center">
            <Heart className="w-6 h-6 text-lys-red" />
          </div>
          <div>
            <p className="text-2xl font-bold text-lys-red">{beScore}%</p>
            <p className="text-xs text-muted-foreground font-oswald uppercase tracking-wide">BE</p>
          </div>
          <Progress value={beScore} className="h-2 bg-lys-red/20 [&>div]:bg-lys-red" />
        </div>
        
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-lys-yellow/10 flex items-center justify-center">
            <Brain className="w-6 h-6 text-lys-yellow" />
          </div>
          <div>
            <p className="text-2xl font-bold text-lys-yellow">{knowScore}%</p>
            <p className="text-xs text-muted-foreground font-oswald uppercase tracking-wide">KNOW</p>
          </div>
          <Progress value={knowScore} className="h-2 bg-lys-yellow/20 [&>div]:bg-lys-yellow" />
        </div>
        
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-lys-teal/10 flex items-center justify-center">
            <Target className="w-6 h-6 text-lys-teal" />
          </div>
          <div>
            <p className="text-2xl font-bold text-lys-teal">{doScore}%</p>
            <p className="text-xs text-muted-foreground font-oswald uppercase tracking-wide">DO</p>
          </div>
          <Progress value={doScore} className="h-2 bg-lys-teal/20 [&>div]:bg-lys-teal" />
        </div>
      </div>
    </div>
  );
}

function ActivityTimeline({ activities }: { activities: StudentActivity[] }) {
  const getActivityIcon = (type: string, category: string) => {
    if (category === 'be') return <Heart className="w-4 h-4 text-lys-red" />;
    if (category === 'know') return <Brain className="w-4 h-4 text-lys-yellow" />;
    if (category === 'do') return <Target className="w-4 h-4 text-lys-teal" />;
    
    switch (type) {
      case 'assessment': return <FileText className="w-4 h-4 text-primary" />;
      case 'goal': return <Target className="w-4 h-4 text-primary" />;
      case 'career': return <Briefcase className="w-4 h-4 text-primary" />;
      case 'milestone': return <Milestone className="w-4 h-4 text-primary" />;
      default: return <Activity className="w-4 h-4 text-primary" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'be': return 'border-l-lys-red bg-lys-red/5';
      case 'know': return 'border-l-lys-yellow bg-lys-yellow/5';
      case 'do': return 'border-l-lys-teal bg-lys-teal/5';
      default: return 'border-l-primary bg-primary/5';
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No recent activities</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-3 pr-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className={`p-3 rounded-md border-l-4 ${getCategoryColor(activity.category)}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {getActivityIcon(activity.activityType, activity.category)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{activity.title}</p>
                {activity.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </span>
                  {activity.pointsEarned > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      +{activity.pointsEarned} pts
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function StudentDashboard({ studentData, isLoading }: { studentData: StudentData | undefined; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!studentData) {
    return null;
  }

  const { student, journeyProgress, goals, savedCareers, milestones, recentActivities, portfolio, assignments } = studentData;
  const hasJourneyData = journeyProgress && journeyProgress.overallScore > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-oswald">
            {student.firstName}'s Journey
          </h2>
          <p className="text-muted-foreground">
            {hasJourneyData && journeyProgress.lastActivityDate && (
              <>Last active: {new Date(journeyProgress.lastActivityDate).toLocaleDateString()}</>
            )}
          </p>
        </div>
        {hasJourneyData && (
          <Badge variant="outline" className="gap-1">
            <Compass className="w-3 h-3" />
            Focus: {journeyProgress.currentFocus?.toUpperCase() || 'Exploring'}
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Be-Know-Do Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasJourneyData ? (
              <BeKnowDoProgress
                beScore={journeyProgress.beScore}
                knowScore={journeyProgress.knowScore}
                doScore={journeyProgress.doScore}
                overallScore={journeyProgress.overallScore}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No assessment data yet</p>
                <p className="text-xs mt-1">Progress will appear after completing assessments</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your student's learning journey updates</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityTimeline activities={recentActivities || []} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-lys-red/10">
                <FileText className="w-6 h-6 text-lys-red" />
              </div>
              <div>
                <p className="text-2xl font-bold">{hasJourneyData ? journeyProgress.totalAssessmentsCompleted : 0}</p>
                <p className="text-sm text-muted-foreground">Assessments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-lys-yellow/10">
                <Target className="w-6 h-6 text-lys-yellow" />
              </div>
              <div>
                <p className="text-2xl font-bold">{goals?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Active Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-lys-teal/10">
                <Award className="w-6 h-6 text-lys-teal" />
              </div>
              <div>
                <p className="text-2xl font-bold">{hasJourneyData ? journeyProgress.totalMilestonesAchieved : 0}</p>
                <p className="text-sm text-muted-foreground">Milestones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{savedCareers?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Saved Careers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="goals" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="goals" data-testid="tab-goals">
            <Target className="w-4 h-4 mr-2" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="careers" data-testid="tab-careers">
            <Briefcase className="w-4 h-4 mr-2" />
            Careers
          </TabsTrigger>
          <TabsTrigger value="milestones" data-testid="tab-milestones">
            <Award className="w-4 h-4 mr-2" />
            Milestones
          </TabsTrigger>
          <TabsTrigger value="portfolio" data-testid="tab-portfolio">
            <GraduationCap className="w-4 h-4 mr-2" />
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-assignments">
            <FileText className="w-4 h-4 mr-2" />
            Assignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="space-y-4">
          {!goals ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <EyeOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Goal viewing is not permitted</p>
              </CardContent>
            </Card>
          ) : goals.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No goals set yet</p>
                <p className="text-xs mt-1">Goals will appear here once created</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {goals.map((goal) => (
                <Card key={goal.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium">{goal.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">{goal.description}</p>
                        </div>
                        <Badge variant={goal.status === 'completed' ? 'default' : 'outline'}>
                          {goal.status}
                        </Badge>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                      </div>
                      {goal.targetDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          Target: {new Date(goal.targetDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="careers" className="space-y-4">
          {!savedCareers ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <EyeOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Career viewing is not permitted</p>
              </CardContent>
            </Card>
          ) : savedCareers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No careers saved yet</p>
                <p className="text-xs mt-1">Saved careers will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Career Readiness Overview */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-primary" />
                    Career Readiness Insights
                  </CardTitle>
                  <CardDescription>
                    How academic progress aligns with career interests
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="text-center p-3 rounded-md bg-background">
                      <p className="text-2xl font-bold text-primary">{savedCareers.length}</p>
                      <p className="text-xs text-muted-foreground">Careers Explored</p>
                    </div>
                    <div className="text-center p-3 rounded-md bg-background">
                      <p className="text-2xl font-bold text-green-600">{journeyProgress?.overallScore || 0}%</p>
                      <p className="text-xs text-muted-foreground">Learning Progress</p>
                    </div>
                    <div className="text-center p-3 rounded-md bg-background">
                      <p className="text-2xl font-bold text-blue-600">
                        {journeyProgress?.overallScore && journeyProgress.overallScore >= 80 ? "On Track" : 
                         journeyProgress?.overallScore && journeyProgress.overallScore >= 60 ? "Developing" : "Getting Started"}
                      </p>
                      <p className="text-xs text-muted-foreground">Readiness Status</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Strong academic performance helps prepare students for their career interests. 
                    Encourage exploration of careers that align with their strengths and interests.
                  </p>
                </CardContent>
              </Card>

              {/* Saved Careers Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {savedCareers.map((career, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-md bg-primary/10">
                          <Briefcase className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{career.careerTitle}</p>
                          <p className="text-sm text-muted-foreground capitalize">{career.careerCategory}</p>
                          {career.savedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Saved: {new Date(career.savedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          {!milestones ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <EyeOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Milestone viewing is not permitted</p>
              </CardContent>
            </Card>
          ) : milestones.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No milestones achieved yet</p>
                <p className="text-xs mt-1">Milestones will appear here as they're completed</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {milestones.map((milestone, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-lys-teal/10">
                        <Award className="w-5 h-5 text-lys-teal" />
                      </div>
                      <div>
                        <p className="font-medium">{milestone.title}</p>
                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                        {milestone.achievedAt && (
                          <Badge variant="secondary" className="mt-2">
                            <Check className="w-3 h-3 mr-1" />
                            Achieved {new Date(milestone.achievedAt).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-4">
          {portfolio === undefined ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <EyeOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Portfolio viewing is not permitted</p>
              </CardContent>
            </Card>
          ) : portfolio === null || !portfolio ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No portfolio created yet</p>
                <p className="text-xs mt-1">Portfolio items will appear here once created</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-primary" />
                        {portfolio.title || `${student.firstName}'s Portfolio`}
                      </CardTitle>
                      {portfolio.bio && (
                        <CardDescription className="mt-1">{portfolio.bio}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="capitalize">{portfolio.theme}</Badge>
                      <Badge variant={portfolio.visibility === 'public' ? 'default' : 'secondary'}>
                        {portfolio.visibility === 'public' ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                        {portfolio.visibility}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>
              
              {portfolio.items && portfolio.items.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {portfolio.items.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      {item.thumbnailUrl && (
                        <div className="aspect-video bg-muted overflow-hidden">
                          <img 
                            src={item.thumbnailUrl} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className={item.thumbnailUrl ? "pt-4" : "pt-6"}>
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium line-clamp-1">{item.title}</h4>
                            <Badge variant="secondary" className="text-xs capitalize shrink-0">
                              {item.itemType.replace('_', ' ')}
                            </Badge>
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Added {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No portfolio items yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          {assignments === undefined ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <EyeOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Assignment viewing is not permitted</p>
              </CardContent>
            </Card>
          ) : !assignments || assignments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No assignments yet</p>
                <p className="text-xs mt-1">Assignments will appear here once assigned</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-md ${
                          assignment.status === 'completed' || assignment.status === 'graded' 
                            ? 'bg-green-500/10' 
                            : assignment.status === 'submitted'
                            ? 'bg-blue-500/10'
                            : 'bg-muted'
                        }`}>
                          <FileText className={`w-5 h-5 ${
                            assignment.status === 'completed' || assignment.status === 'graded'
                              ? 'text-green-600'
                              : assignment.status === 'submitted'
                              ? 'text-blue-600'
                              : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs capitalize">{assignment.type}</Badge>
                            <Badge 
                              variant={
                                assignment.status === 'completed' || assignment.status === 'graded' ? 'default' :
                                assignment.status === 'submitted' ? 'secondary' : 'outline'
                              }
                              className="text-xs capitalize"
                            >
                              {assignment.status === 'graded' && assignment.grade !== undefined ? (
                                <><Star className="w-3 h-3 mr-1" />{assignment.grade}%</>
                              ) : (
                                assignment.status
                              )}
                            </Badge>
                          </div>
                          {assignment.dueDate && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </p>
                          )}
                          {assignment.submittedAt && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Submitted: {new Date(assignment.submittedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      {assignment.grade !== undefined && assignment.grade !== null && (
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">{assignment.grade}%</p>
                          <p className="text-xs text-muted-foreground">Grade</p>
                        </div>
                      )}
                    </div>
                    {assignment.feedback && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Feedback:</span> {assignment.feedback}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ParentPortal() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [relationship, setRelationship] = useState("parent");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState("encouragement");
  const [activeTab, setActiveTab] = useState("dashboard");
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const userRole = user?.role;
  const isStudent = userRole === 'student';

  const { data: parentLinks = [], isLoading: parentLinksLoading } = useQuery<EnrichedLink[]>({
    queryKey: ["/api/parent-portal/links", "parent"],
    queryFn: async () => {
      const res = await fetch(`/api/parent-portal/links?role=parent`);
      if (!res.ok) {
        if (res.status === 403) return [];
        throw new Error("Failed to fetch parent links");
      }
      return res.json();
    },
    enabled: isAuthenticated && !isStudent,
  });

  const hasParentLinks = parentLinks.length > 0;
  const isParent = !isStudent && hasParentLinks;
  const isUnrelatedRole = !isStudent && !parentLinksLoading && !hasParentLinks;

  const { data: links = [], isLoading: linksLoading } = useQuery<EnrichedLink[]>({
    queryKey: ["/api/parent-portal/links", "student"],
    queryFn: async () => {
      const res = await fetch(`/api/parent-portal/links?role=student`);
      if (!res.ok) throw new Error("Failed to fetch links");
      return res.json();
    },
    enabled: isAuthenticated && isStudent,
  });

  const { data: invitations = [], isLoading: invitationsLoading } = useQuery<ParentInvitation[]>({
    queryKey: ["/api/parent-portal/invitations"],
    enabled: isAuthenticated && isStudent,
  });

  const { data: studentData, isLoading: studentDataLoading } = useQuery<StudentData>({
    queryKey: ["/api/parent-portal/student", selectedStudent],
    queryFn: async () => {
      const res = await fetch(`/api/parent-portal/student/${selectedStudent}`);
      if (!res.ok) throw new Error("Failed to fetch student data");
      return res.json();
    },
    enabled: isAuthenticated && hasParentLinks && !!selectedStudent,
  });

  const inviteParentMutation = useMutation({
    mutationFn: async (data: { parentEmail: string; relationship: string }) => {
      const response = await apiRequest("POST", "/api/parent-portal/invitations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parent-portal/invitations"] });
      setInviteEmail("");
      setIsInviteDialogOpen(false);
      toast({
        title: "Invitation Sent",
        description: "Your parent/guardian will receive an invitation link.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ linkId, permissions }: { linkId: string; permissions: ParentPermissions }) => {
      const response = await apiRequest("PATCH", `/api/parent-portal/links/${linkId}`, { permissions });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parent-portal/links"] });
      toast({
        title: "Permissions Updated",
        description: "Parent access permissions have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update permissions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const revokeLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      await apiRequest("DELETE", `/api/parent-portal/links/${linkId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parent-portal/links"] });
      toast({
        title: "Access Revoked",
        description: "Parent access has been revoked.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to revoke access. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      await apiRequest("DELETE", `/api/parent-portal/invitations/${invitationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parent-portal/invitations"] });
      toast({
        title: "Invitation Cancelled",
        description: "The invitation has been cancelled.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (data: { linkId: string; studentUserId: string; noteType: string; content: string }) => {
      const response = await apiRequest("POST", "/api/parent-portal/notes", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parent-portal/student", selectedStudent] });
      setNoteContent("");
      toast({
        title: "Note Added",
        description: "Your note has been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePermissionToggle = (link: EnrichedLink, permission: keyof ParentPermissions) => {
    const currentPermissions = (link.permissions || {}) as ParentPermissions;
    updatePermissionsMutation.mutate({
      linkId: link.id,
      permissions: {
        ...currentPermissions,
        [permission]: !currentPermissions[permission],
      },
    });
  };

  const handleAddNote = () => {
    if (!noteContent.trim() || !selectedStudent) return;
    const link = parentLinks.find(l => l.studentUserId === selectedStudent);
    if (!link) return;
    addNoteMutation.mutate({
      linkId: link.id,
      studentUserId: selectedStudent,
      noteType,
      content: noteContent,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default"><Check className="w-3 h-3 mr-1" /> Active</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'revoked':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Revoked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Parent Portal</CardTitle>
            <CardDescription>
              Please sign in to access the Parent Portal
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (linksLoading || parentLinksLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (isUnrelatedRole) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>Parent Portal</CardTitle>
            <CardDescription>
              This feature is designed for students to share their progress with family members, 
              and for parents/guardians to view their children's educational journey.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            <p>As an educator or administrator, you can encourage your students to use this feature 
            to engage their families in their educational success.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-oswald flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Parent Portal
          </h1>
          <p className="text-muted-foreground mt-1">
            {isStudent 
              ? "Manage which family members can view your progress"
              : "Track your student's educational journey and celebrate their achievements"}
          </p>
        </div>
        
        {isStudent && (
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-invite-parent">
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Parent/Guardian
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Parent or Guardian</DialogTitle>
                <DialogDescription>
                  Send an invitation to your parent or guardian so they can view your progress and celebrate your achievements.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="parent-email">Email Address</Label>
                  <Input
                    id="parent-email"
                    type="email"
                    placeholder="parent@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    data-testid="input-parent-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship</Label>
                  <Select value={relationship} onValueChange={setRelationship}>
                    <SelectTrigger data-testid="select-relationship">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="family_member">Family Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={() => inviteParentMutation.mutate({ parentEmail: inviteEmail, relationship })}
                  disabled={!inviteEmail || inviteParentMutation.isPending}
                  data-testid="button-send-invitation"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {inviteParentMutation.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isStudent ? (
        <Tabs defaultValue="linked" className="space-y-4">
          <TabsList>
            <TabsTrigger value="linked" data-testid="tab-linked-parents">
              <Users className="mr-2 h-4 w-4" />
              Linked Parents ({links.length})
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending-invitations">
              <Mail className="mr-2 h-4 w-4" />
              Pending ({invitations.filter(i => i.status === 'pending').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="linked" className="space-y-4">
            {links.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">No Linked Parents</h3>
                  <p className="text-muted-foreground max-w-sm mt-2">
                    Invite your parents or guardians so they can track your progress and support your journey.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setIsInviteDialogOpen(true)}
                    data-testid="button-invite-parent-empty"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Parent/Guardian
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {links.map((link) => (
                  <Card key={link.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {link.linkedUser?.firstName} {link.linkedUser?.lastName}
                            </CardTitle>
                            <CardDescription>{link.linkedUser?.email}</CardDescription>
                          </div>
                        </div>
                        {getStatusBadge(link.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Access Permissions
                        </Label>
                        <div className="space-y-2">
                          {[
                            { key: 'viewGoals' as const, label: 'Goals & Progress', icon: Target },
                            { key: 'viewAssessments' as const, label: 'Assessments', icon: BookOpen },
                            { key: 'viewCareers' as const, label: 'Saved Careers', icon: Briefcase },
                            { key: 'viewMilestones' as const, label: 'Milestones', icon: Award },
                            { key: 'viewActivities' as const, label: 'Activity Feed', icon: Activity },
                            { key: 'viewPortfolio' as const, label: 'Portfolio', icon: GraduationCap },
                            { key: 'viewAssignments' as const, label: 'Assignments', icon: FileText },
                            { key: 'receiveNotifications' as const, label: 'Email Updates', icon: Mail },
                          ].map(({ key, label, icon: Icon }) => (
                            <div key={key} className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                {label}
                              </div>
                              <Switch
                                checked={((link.permissions || {}) as ParentPermissions)[key] ?? false}
                                onCheckedChange={() => handlePermissionToggle(link, key)}
                                data-testid={`switch-permission-${key}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => revokeLinkMutation.mutate(link.id)}
                        disabled={revokeLinkMutation.isPending}
                        data-testid={`button-revoke-${link.id}`}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Revoke Access
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {invitationsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            ) : invitations.filter(i => i.status === 'pending').length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No Pending Invitations</h3>
                  <p className="text-muted-foreground">All your invitations have been accepted or expired.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {invitations.filter(i => i.status === 'pending').map((invitation) => (
                  <Card key={invitation.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{invitation.parentEmail}</p>
                          <p className="text-sm text-muted-foreground">
                            Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteInvitationMutation.mutate(invitation.id)}
                        disabled={deleteInvitationMutation.isPending}
                        data-testid={`button-cancel-invite-${invitation.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Students</CardTitle>
                <CardDescription>Select to view progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {parentLinks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="h-12 w-12 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">No linked students</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your student needs to send you an invitation.
                    </p>
                  </div>
                ) : (
                  parentLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => setSelectedStudent(link.studentUserId)}
                      className={`w-full p-3 rounded-md text-left flex items-center justify-between transition-colors ${
                        selectedStudent === link.studentUserId
                          ? "bg-primary/10 border border-primary/20"
                          : "hover-elevate"
                      }`}
                      data-testid={`button-select-student-${link.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          selectedStudent === link.studentUserId ? 'bg-primary/20' : 'bg-muted'
                        }`}>
                          <GraduationCap className={`h-5 w-5 ${
                            selectedStudent === link.studentUserId ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">
                            {link.linkedUser?.firstName} {link.linkedUser?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {link.relationship}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            {selectedStudent && studentData && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Send a Note
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={noteType} onValueChange={setNoteType}>
                    <SelectTrigger data-testid="select-note-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="encouragement">
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-lys-red" />
                          Encouragement
                        </div>
                      </SelectItem>
                      <SelectItem value="milestone_celebration">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-lys-yellow" />
                          Celebration
                        </div>
                      </SelectItem>
                      <SelectItem value="general">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          General
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Write an encouraging note..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="min-h-[80px]"
                    data-testid="textarea-note-content"
                  />
                  <Button
                    onClick={handleAddNote}
                    disabled={!noteContent.trim() || addNoteMutation.isPending}
                    className="w-full"
                    data-testid="button-add-note"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {addNoteMutation.isPending ? "Sending..." : "Send"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-3">
            {!selectedStudent ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Eye className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Select a Student</h3>
                  <p className="text-muted-foreground max-w-sm mt-2">
                    Choose a student from the list to view their progress, goals, and achievements in their Be-Know-Do journey.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <StudentDashboard studentData={studentData} isLoading={studentDataLoading} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
