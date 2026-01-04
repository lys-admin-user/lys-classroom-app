import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, 
  Compass, 
  Target, 
  TrendingUp, 
  Calendar,
  Trophy,
  Loader2,
  ArrowLeft,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Star,
  BookOpen,
  Briefcase,
  Users,
  Sparkles
} from "lucide-react";
import type { StudentJourneyProgress, StudentJourneyMilestone, StudentJourneyActivity } from "@shared/schema";

interface JourneyData {
  progress: StudentJourneyProgress;
  milestones: StudentJourneyMilestone[];
  activities: StudentJourneyActivity[];
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
    md: "w-28 h-28",
    lg: "w-36 h-36",
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
        <Icon className={`w-6 h-6 ${config.color}`} />
        <span className="text-lg font-bold mt-1">{score}</span>
      </div>
    </div>
  );
}

function MilestoneCard({ milestone }: { milestone: StudentJourneyMilestone }) {
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
    <Card className="hover-elevate">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-md ${config.bgColor}/10`}>
            <config.icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium truncate">{milestone.title}</h4>
              <Badge variant="outline" className={status.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            {milestone.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {milestone.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <Progress value={milestone.currentValue || 0} className="flex-1 h-2" />
              <span className="text-xs text-muted-foreground">
                {milestone.currentValue || 0}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityItem({ activity }: { activity: StudentJourneyActivity }) {
  const activityTypeConfig: Record<string, { icon: typeof BookOpen; color: string }> = {
    assessment: { icon: Sparkles, color: "text-violet-500" },
    lesson: { icon: BookOpen, color: "text-blue-500" },
    career_exploration: { icon: Briefcase, color: "text-amber-500" },
    goal_progress: { icon: TrendingUp, color: "text-emerald-500" },
    reflection: { icon: Heart, color: "text-rose-500" },
    milestone_achieved: { icon: Trophy, color: "text-primary" },
  };
  
  const config = activityTypeConfig[activity.activityType] || activityTypeConfig.lesson;
  const Icon = config.icon;
  
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className={`p-2 rounded-full bg-muted`}>
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

export default function StudentJourney() {
  const { studentId } = useParams<{ studentId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    category: "do" as "be" | "know" | "do",
  });

  const { data: journeyData, isLoading, error } = useQuery<JourneyData>({
    queryKey: ["/api/student-journey", studentId],
    enabled: !!studentId,
  });

  const createJourneyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/student-journey", { studentId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student-journey", studentId] });
      toast({ title: "Journey started", description: "Student journey has been created successfully." });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !journeyData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Journey Not Started</h2>
            <p className="text-muted-foreground mb-4">
              This student's Be-Know-Do journey hasn't been started yet. Create a journey to begin tracking their progress.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button 
                onClick={() => createJourneyMutation.mutate()}
                disabled={createJourneyMutation.isPending}
                data-testid="button-create-journey"
              >
                {createJourneyMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Sparkles className="w-4 h-4 mr-2" />
                Start Journey
              </Button>
              <Button variant="outline" onClick={() => setLocation("/classroom")} data-testid="button-back-classroom">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Classroom
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { progress, milestones, activities } = journeyData;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setLocation("/classroom")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Student Journey</h1>
          <p className="text-muted-foreground">Be-Know-Do progress tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Progress Overview
            </CardTitle>
            <CardDescription>
              Current Be-Know-Do competency scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-around flex-wrap gap-4">
              <div className="flex flex-col items-center">
                <ScoreRing score={progress.beScore} category="be" />
                <span className="font-medium mt-2">Being</span>
                <span className="text-xs text-muted-foreground">Self-awareness</span>
              </div>
              <div className="flex flex-col items-center">
                <ScoreRing score={progress.knowScore} category="know" />
                <span className="font-medium mt-2">Knowing</span>
                <span className="text-xs text-muted-foreground">Exploration</span>
              </div>
              <div className="flex flex-col items-center">
                <ScoreRing score={progress.doScore} category="do" />
                <span className="font-medium mt-2">Doing</span>
                <span className="text-xs text-muted-foreground">Achievement</span>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Overall Progress</span>
                <span className="text-2xl font-bold">{progress.overallScore}%</span>
              </div>
              <Progress value={progress.overallScore} className="h-3" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Journey Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Assessments</span>
              <Badge variant="secondary">{progress.totalAssessmentsCompleted}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Milestones</span>
              <Badge variant="secondary">{progress.totalMilestonesAchieved}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Focus</span>
              <Badge className={categoryConfig[progress.currentFocus as keyof typeof categoryConfig]?.bgColor || "bg-muted"}>
                {categoryConfig[progress.currentFocus as keyof typeof categoryConfig]?.label || "Being"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last Activity</span>
              <span className="text-sm">
                {progress.lastActivityDate 
                  ? new Date(progress.lastActivityDate).toLocaleDateString() 
                  : "Today"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Journey Started</span>
              <span className="text-sm">
                {progress.journeyStartDate 
                  ? new Date(progress.journeyStartDate).toLocaleDateString() 
                  : "Today"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="milestones" className="space-y-6">
        <TabsList>
          <TabsTrigger value="milestones" data-testid="tab-milestones">
            <Trophy className="w-4 h-4 mr-2" />
            Milestones ({milestones.length})
          </TabsTrigger>
          <TabsTrigger value="activities" data-testid="tab-activities">
            <Clock className="w-4 h-4 mr-2" />
            Recent Activity ({activities.length})
          </TabsTrigger>
          <TabsTrigger value="careers" data-testid="tab-careers">
            <Briefcase className="w-4 h-4 mr-2" />
            Saved Careers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="milestones" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Journey Milestones</h3>
            <Dialog open={isAddMilestoneOpen} onOpenChange={setIsAddMilestoneOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-milestone">
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
          </div>

          {milestones.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No Milestones Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add milestones to track important achievements in the student's journey.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {milestones.map((milestone) => (
                <MilestoneCard key={milestone.id} milestone={milestone} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Recent learning activities and achievements</CardDescription>
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

        <TabsContent value="careers">
          <Card>
            <CardHeader>
              <CardTitle>Saved Career Interests</CardTitle>
              <CardDescription>Careers this student has explored and saved</CardDescription>
            </CardHeader>
            <CardContent>
              {(!progress.savedCareerIds || progress.savedCareerIds.length === 0) ? (
                <div className="py-8 text-center">
                  <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No saved careers yet.</p>
                  <Link href="/careers">
                    <Button variant="outline" data-testid="button-explore-careers">
                      Explore Careers
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {progress.savedCareerIds.map((careerId, index) => (
                    <div key={careerId} className="flex items-center gap-3 p-3 bg-muted/30 rounded-md">
                      <Briefcase className="w-5 h-5 text-muted-foreground" />
                      <span>Career #{index + 1}</span>
                      <Link href={`/careers?id=${careerId}`}>
                        <Button variant="ghost" size="sm">View Details</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
