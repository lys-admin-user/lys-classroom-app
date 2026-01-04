import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
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
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Star,
  BookOpen,
  Briefcase,
  Sparkles,
  ArrowRight
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
    color: "text-yellow-500", 
    bgColor: "bg-yellow-500",
    description: "Self-awareness and identity" 
  },
  know: { 
    label: "Knowing", 
    icon: Compass, 
    color: "text-teal-500", 
    bgColor: "bg-teal-500",
    description: "Knowledge and exploration" 
  },
  do: { 
    label: "Doing", 
    icon: Target, 
    color: "text-red-500", 
    bgColor: "bg-red-500",
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
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center`} data-testid={`score-ring-${category}`}>
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

function MilestoneCard({ milestone, onUpdate }: { milestone: StudentJourneyMilestone; onUpdate: (id: string, updates: Partial<StudentJourneyMilestone>) => void }) {
  const config = categoryConfig[milestone.category as keyof typeof categoryConfig] || categoryConfig.do;
  
  const statusConfig = {
    not_started: { icon: Circle, label: "Not Started", color: "text-muted-foreground" },
    in_progress: { icon: Clock, label: "In Progress", color: "text-amber-500" },
    completed: { icon: CheckCircle2, label: "Completed", color: "text-emerald-500" },
    mastered: { icon: Star, label: "Mastered", color: "text-yellow-500" },
  };
  
  const status = statusConfig[milestone.status as keyof typeof statusConfig] || statusConfig.not_started;
  const StatusIcon = status.icon;
  const progressPercent = milestone.targetValue ? (milestone.currentValue / milestone.targetValue) * 100 : 0;
  
  return (
    <Card className="hover-elevate" data-testid={`milestone-card-${milestone.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={config.color}>
              {config.label}
            </Badge>
            <Badge variant="outline" className={status.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
          </div>
          {milestone.pointsEarned > 0 && (
            <Badge variant="secondary">+{milestone.pointsEarned} pts</Badge>
          )}
        </div>
        <CardTitle className="text-base mt-2">{milestone.title}</CardTitle>
        {milestone.description && (
          <CardDescription>{milestone.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{milestone.currentValue}/{milestone.targetValue}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
          
          {milestone.status === "not_started" && (
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              onClick={() => onUpdate(milestone.id, { status: "in_progress", startedAt: new Date() })}
              data-testid={`button-start-milestone-${milestone.id}`}
            >
              Start Working
            </Button>
          )}
          
          {milestone.status === "in_progress" && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                className="flex-1"
                onClick={() => onUpdate(milestone.id, { 
                  currentValue: Math.min((milestone.currentValue || 0) + 10, milestone.targetValue || 100)
                })}
                data-testid={`button-progress-milestone-${milestone.id}`}
              >
                +10 Progress
              </Button>
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => onUpdate(milestone.id, { 
                  status: "completed", 
                  currentValue: milestone.targetValue || 100,
                  completedAt: new Date(),
                  pointsEarned: 25
                })}
                data-testid={`button-complete-milestone-${milestone.id}`}
              >
                Complete
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityItem({ activity }: { activity: StudentJourneyActivity }) {
  const config = activity.category ? categoryConfig[activity.category as keyof typeof categoryConfig] : null;
  
  const typeConfig = {
    assessment: { icon: BookOpen, label: "Assessment" },
    lesson: { icon: BookOpen, label: "Lesson" },
    career_exploration: { icon: Briefcase, label: "Career Exploration" },
    goal_progress: { icon: Target, label: "Goal Progress" },
    reflection: { icon: Sparkles, label: "Reflection" },
    milestone_achieved: { icon: Trophy, label: "Milestone" },
  };
  
  const typeInfo = typeConfig[activity.activityType as keyof typeof typeConfig] || typeConfig.goal_progress;
  const TypeIcon = typeInfo.icon;
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30" data-testid={`activity-item-${activity.id}`}>
      <div className={`p-2 rounded-full ${config?.bgColor || "bg-muted"}`}>
        <TypeIcon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{activity.title}</p>
        {activity.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        {activity.pointsEarned > 0 && (
          <Badge variant="secondary" className="text-xs">
            +{activity.pointsEarned} points
          </Badge>
        )}
        <span className="text-xs text-muted-foreground">
          {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString() : "Today"}
        </span>
      </div>
    </div>
  );
}

export default function MyJourney() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    category: "do" as "be" | "know" | "do",
  });

  const { data: journeyData, isLoading, error } = useQuery<JourneyData>({
    queryKey: ["/api/my-journey"],
    enabled: isAuthenticated,
  });

  const addMilestoneMutation = useMutation({
    mutationFn: (milestone: { title: string; description: string; category: string }) =>
      apiRequest("POST", "/api/my-journey/milestones", milestone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-journey"] });
      setIsAddMilestoneOpen(false);
      setNewMilestone({ title: "", description: "", category: "do" });
      toast({ title: "Milestone added", description: "Keep working toward your goal!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add milestone", variant: "destructive" });
    },
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<StudentJourneyMilestone> }) =>
      apiRequest("PATCH", `/api/student-journey/milestones/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-journey"] });
      toast({ title: "Milestone updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update milestone", variant: "destructive" });
    },
  });

  const handleUpdateMilestone = (id: string, updates: Partial<StudentJourneyMilestone>) => {
    updateMilestoneMutation.mutate({ id, updates });
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to view your Be-Know-Do journey.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild data-testid="button-signin">
              <Link href="/">Go to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !journeyData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Unable to Load Journey</CardTitle>
            <CardDescription>Please try again later.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { progress, milestones, activities } = journeyData;

  return (
    <div className="container mx-auto px-4 py-8" data-testid="my-journey-page">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold">My Be-Know-Do Journey</h1>
        <p className="text-muted-foreground">
          Track your personal growth across Being, Knowing, and Doing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Progress Overview
            </CardTitle>
            <CardDescription>
              Your current Be-Know-Do competency scores
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
                <span className="text-2xl font-bold" data-testid="overall-score">{progress.overallScore}%</span>
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
              <Badge variant="secondary" data-testid="stat-assessments">{progress.totalAssessmentsCompleted}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Milestones Achieved</span>
              <Badge variant="secondary" data-testid="stat-milestones">{progress.totalMilestonesAchieved}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Journey Started</span>
              <Badge variant="outline">
                {progress.journeyStartDate 
                  ? new Date(progress.journeyStartDate).toLocaleDateString() 
                  : "Today"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Focus</span>
              <Badge className={categoryConfig[progress.currentFocus as keyof typeof categoryConfig]?.bgColor || "bg-muted"}>
                {categoryConfig[progress.currentFocus as keyof typeof categoryConfig]?.label || "Being"}
              </Badge>
            </div>
            
            <div className="pt-4 border-t">
              <Button asChild className="w-full" data-testid="button-take-assessment">
                <Link href="/self-discovery">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Take Self-Discovery Assessment
                </Link>
              </Button>
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
        </TabsList>

        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>Your Milestones</CardTitle>
                  <CardDescription>Personal goals and achievements</CardDescription>
                </div>
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
                        Create a personal goal to track your progress
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="milestone-title">Title</Label>
                        <Input
                          id="milestone-title"
                          placeholder="e.g., Complete career research"
                          value={newMilestone.title}
                          onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                          data-testid="input-milestone-title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="milestone-category">Category</Label>
                        <Select
                          value={newMilestone.category}
                          onValueChange={(value: "be" | "know" | "do") => 
                            setNewMilestone(prev => ({ ...prev, category: value }))
                          }
                        >
                          <SelectTrigger data-testid="select-milestone-category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="be">Being - Self-awareness</SelectItem>
                            <SelectItem value="know">Knowing - Exploration</SelectItem>
                            <SelectItem value="do">Doing - Achievement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="milestone-description">Description (optional)</Label>
                        <Textarea
                          id="milestone-description"
                          placeholder="Describe what you want to achieve..."
                          value={newMilestone.description}
                          onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                          data-testid="input-milestone-description"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => addMilestoneMutation.mutate(newMilestone)}
                        disabled={!newMilestone.title.trim() || addMilestoneMutation.isPending}
                        data-testid="button-save-milestone"
                      >
                        {addMilestoneMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4 mr-2" />
                        )}
                        Add Milestone
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {milestones.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No milestones yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your first milestone to start tracking your journey
                  </p>
                  <Button variant="outline" onClick={() => setIsAddMilestoneOpen(true)} data-testid="button-add-first-milestone">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Milestone
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {milestones.map((milestone) => (
                    <MilestoneCard 
                      key={milestone.id} 
                      milestone={milestone}
                      onUpdate={handleUpdateMilestone}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your journey timeline</CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No activities yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete assessments and milestones to build your activity history
                  </p>
                  <Button variant="outline" asChild data-testid="button-start-discovery">
                    <Link href="/self-discovery">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Start with Self-Discovery
                    </Link>
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
