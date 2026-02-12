import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Target, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Circle,
  Trash2,
  Edit,
  TrendingUp,
  Award,
  BookOpen,
  Heart,
  DollarSign,
  Users,
  Activity,
  Briefcase,
  ArrowRight,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTier } from "@/hooks/use-tier";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Goal, Career } from "@shared/schema";
import { Link } from "wouter";
import { AdBanner } from "@/components/AdBanner";

const categoryConfig = {
  academic: { label: "Academic", icon: BookOpen, color: "bg-blue-500/10 text-blue-600" },
  career: { label: "Career", icon: Target, color: "bg-lys-red/10 text-lys-red" },
  personal: { label: "Personal", icon: Heart, color: "bg-pink-500/10 text-pink-600" },
  financial: { label: "Financial", icon: DollarSign, color: "bg-green-500/10 text-green-600" },
  social: { label: "Social", icon: Users, color: "bg-purple-500/10 text-purple-600" },
  health: { label: "Health", icon: Activity, color: "bg-orange-500/10 text-orange-600" },
};

const bkdConfig = {
  be: { label: "BE", description: "Identity & Purpose", color: "bg-lys-yellow/10 text-lys-yellow border-lys-yellow/30" },
  know: { label: "KNOW", description: "Strategy & Resources", color: "bg-lys-red/10 text-lys-red border-lys-red/30" },
  do: { label: "DO", description: "Action & Impact", color: "bg-lys-teal/10 text-lys-teal border-lys-teal/30" },
};

const statusConfig = {
  not_started: { label: "Not Started", color: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", color: "bg-lys-yellow/20 text-lys-yellow" },
  completed: { label: "Completed", color: "bg-green-500/20 text-green-600" },
};

const categoryToCareerType: Record<string, string[]> = {
  academic: ["technology", "education"],
  career: ["technology", "business", "healthcare"],
  personal: ["healthcare", "creative"],
  financial: ["business", "technology"],
  social: ["healthcare", "education"],
  health: ["healthcare", "trades"],
};

export default function ActionPlans() {
  const { toast } = useToast();
  const { showAds } = useTier();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    category: "academic" as keyof typeof categoryConfig,
    bkdPillar: "do" as keyof typeof bkdConfig,
    targetDate: "",
    milestones: [] as { id: string; title: string; completed: boolean }[],
  });
  const [newMilestone, setNewMilestone] = useState("");

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const { data: careers = [] } = useQuery<Career[]>({
    queryKey: ["/api/careers"],
  });

  const getRelatedCareers = (category: string) => {
    const careerTypes = categoryToCareerType[category] || [];
    return careers.filter((c) => careerTypes.includes(c.category)).slice(0, 2);
  };

  const createGoalMutation = useMutation({
    mutationFn: async (goal: typeof newGoal) => {
      return await apiRequest("POST", "/api/goals", {
        ...goal,
        status: "not_started",
        progress: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setIsDialogOpen(false);
      setNewGoal({
        title: "",
        description: "",
        category: "academic",
        bkdPillar: "do",
        targetDate: "",
        milestones: [],
      });
      toast({
        title: "Goal Created!",
        description: "Your new goal is ready. Now let's make it happen!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Oops!",
        description: error.message || "Failed to create goal.",
        variant: "destructive",
      });
    },
  });

  const toggleMilestoneMutation = useMutation({
    mutationFn: async ({ goalId, milestoneId, completed }: { goalId: string; milestoneId: string; completed: boolean }) => {
      return await apiRequest("PATCH", `/api/goals/${goalId}/milestones/${milestoneId}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      return await apiRequest("DELETE", `/api/goals/${goalId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({
        title: "Goal Deleted",
        description: "The goal has been removed.",
      });
    },
  });

  const handleAddMilestone = () => {
    if (newMilestone.trim()) {
      setNewGoal((prev) => ({
        ...prev,
        milestones: [
          ...prev.milestones,
          { id: crypto.randomUUID(), title: newMilestone.trim(), completed: false },
        ],
      }));
      setNewMilestone("");
    }
  };

  const handleRemoveMilestone = (id: string) => {
    setNewGoal((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((m) => m.id !== id),
    }));
  };

  const handleCreateGoal = () => {
    if (!newGoal.title || !newGoal.targetDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in the goal title and target date.",
        variant: "destructive",
      });
      return;
    }
    createGoalMutation.mutate(newGoal);
  };

  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const inProgressGoals = goals.filter((g) => g.status === "in_progress").length;
  const overallProgress = goals.length > 0 
    ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-md bg-lys-teal/10 flex items-center justify-center">
              <Target className="h-6 w-6 text-lys-teal" />
            </div>
            <div>
              <h1 className="font-marker text-3xl sm:text-4xl text-foreground">
                DO: Action Plans
              </h1>
              <p className="font-roboto text-muted-foreground">
                Turn your dreams into reality, one milestone at a time
              </p>
            </div>
          </div>
          
          {showAds && <AdBanner position="inline" className="mb-6" />}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-lys-teal hover:bg-lys-teal/90 text-white font-oswald gap-2" data-testid="button-new-goal">
                <Plus className="h-5 w-5" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-oswald text-xl">Create New Goal</DialogTitle>
                <DialogDescription className="font-roboto">
                  Define your goal and break it down into achievable milestones.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="goal-title" className="font-oswald">Goal Title</Label>
                  <Input
                    id="goal-title"
                    placeholder="e.g., Apply to 5 colleges"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal((prev) => ({ ...prev, title: e.target.value }))}
                    className="font-roboto"
                    data-testid="input-goal-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-description" className="font-oswald">Description</Label>
                  <Textarea
                    id="goal-description"
                    placeholder="What does success look like?"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal((prev) => ({ ...prev, description: e.target.value }))}
                    className="font-roboto"
                    data-testid="input-goal-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-oswald">Be-Know-Do Pillar</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(bkdConfig).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setNewGoal((prev) => ({ ...prev, bkdPillar: key as any }))}
                        className={`p-2 rounded-md border-2 transition-all ${
                          newGoal.bkdPillar === key
                            ? `${config.color} ring-2 ring-offset-1`
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                        data-testid={`button-bkd-${key}`}
                      >
                        <p className="font-oswald text-sm font-semibold">{config.label}</p>
                        <p className="text-[10px] text-muted-foreground font-roboto">{config.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="goal-category" className="font-oswald">Category</Label>
                    <Select
                      value={newGoal.category}
                      onValueChange={(value) => setNewGoal((prev) => ({ ...prev, category: value as any }))}
                    >
                      <SelectTrigger className="font-roboto" data-testid="select-goal-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key} className="font-roboto">
                            <div className="flex items-center gap-2">
                              <config.icon className="h-4 w-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal-date" className="font-oswald">Target Date</Label>
                    <Input
                      id="goal-date"
                      type="date"
                      value={newGoal.targetDate}
                      onChange={(e) => setNewGoal((prev) => ({ ...prev, targetDate: e.target.value }))}
                      className="font-roboto"
                      data-testid="input-goal-date"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-oswald">Milestones</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a milestone..."
                      value={newMilestone}
                      onChange={(e) => setNewMilestone(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddMilestone()}
                      className="font-roboto"
                      data-testid="input-milestone"
                    />
                    <Button type="button" variant="secondary" onClick={handleAddMilestone} data-testid="button-add-milestone">
                      Add
                    </Button>
                  </div>
                  {newGoal.milestones.length > 0 && (
                    <ul className="space-y-2 mt-3">
                      {newGoal.milestones.map((milestone) => (
                        <li key={milestone.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                          <span className="font-roboto text-sm">{milestone.title}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMilestone(milestone.id)}
                            className="h-7 w-7"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <Button
                  onClick={handleCreateGoal}
                  disabled={createGoalMutation.isPending}
                  className="w-full bg-lys-teal hover:bg-lys-teal/90 text-white font-oswald"
                  data-testid="button-create-goal"
                >
                  {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-green-500/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-roboto">Completed</p>
                <p className="font-oswald text-2xl font-semibold">{completedGoals}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-lys-yellow/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-lys-yellow" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-roboto">In Progress</p>
                <p className="font-oswald text-2xl font-semibold">{inProgressGoals}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-lys-teal/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-lys-teal" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-roboto">Overall Progress</p>
                <div className="flex items-center gap-2">
                  <Progress value={overallProgress} className="w-16 h-2" />
                  <span className="font-oswald text-lg font-semibold">{overallProgress}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Target className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="font-oswald text-xl text-muted-foreground mb-2">No goals yet</h3>
            <p className="text-sm text-muted-foreground/70 font-roboto mb-6 max-w-sm mx-auto">
              Dreams become reality through action. Create your first goal and start climbing the ladder to success!
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-lys-teal hover:bg-lys-teal/90 text-white font-oswald gap-2"
              data-testid="button-create-first-goal"
            >
              <Plus className="h-5 w-5" />
              Create Your First Goal
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {goals.map((goal) => {
              const config = categoryConfig[goal.category as keyof typeof categoryConfig] || categoryConfig.academic;
              const status = statusConfig[goal.status as keyof typeof statusConfig] || statusConfig.not_started;
              const bkd = bkdConfig[(goal.bkdPillar as keyof typeof bkdConfig) || 'do'] || bkdConfig.do;
              const completedMilestones = goal.milestones.filter((m) => m.completed).length;

              return (
                <Card key={goal.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={bkd.color}>
                          {bkd.label}
                        </Badge>
                        <Badge className={config.color}>
                          <config.icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteGoalMutation.mutate(goal.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        data-testid={`button-delete-goal-${goal.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="font-oswald text-lg mt-2">{goal.title}</CardTitle>
                    {goal.description && (
                      <CardDescription className="font-roboto">{goal.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-roboto flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Target: {new Date(goal.targetDate).toLocaleDateString()}
                      </span>
                      <span className="font-oswald font-semibold">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />

                    {goal.milestones.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-roboto">
                          Milestones ({completedMilestones}/{goal.milestones.length})
                        </p>
                        <ul className="space-y-2">
                          {goal.milestones.map((milestone) => (
                            <li key={milestone.id} className="flex items-center gap-2">
                              <Checkbox
                                checked={milestone.completed}
                                onCheckedChange={(checked) =>
                                  toggleMilestoneMutation.mutate({
                                    goalId: goal.id,
                                    milestoneId: milestone.id,
                                    completed: checked as boolean,
                                  })
                                }
                                data-testid={`checkbox-milestone-${milestone.id}`}
                              />
                              <span
                                className={`font-roboto text-sm flex-1 ${
                                  milestone.completed ? "line-through text-muted-foreground" : ""
                                }`}
                              >
                                {milestone.title}
                              </span>
                              {(milestone as any).reflection && (
                                <MessageSquare className="h-3 w-3 text-lys-yellow" />
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(() => {
                      const relatedCareers = getRelatedCareers(goal.category);
                      if (relatedCareers.length === 0) return null;
                      return (
                        <div className="pt-3 border-t">
                          <p className="text-xs text-muted-foreground font-roboto mb-2 flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            Related Career Paths
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {relatedCareers.map((career) => (
                              <Link key={career.id} href={`/careers?id=${career.id}`}>
                                <Badge 
                                  variant="secondary" 
                                  className="font-roboto text-xs cursor-pointer hover-elevate"
                                  data-testid={`badge-career-${career.id}`}
                                >
                                  {career.title}
                                  <ArrowRight className="h-3 w-3 ml-1" />
                                </Badge>
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-12 p-6 rounded-lg bg-gradient-to-r from-lys-teal/10 to-lys-yellow/10 border border-lys-teal/20">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex-1 min-w-[200px]">
              <h2 className="font-oswald text-xl font-semibold mb-2">Make It Happen</h2>
              <p className="font-roboto text-muted-foreground text-sm">
                Knowledge without action is just wasted potential. Break down your dreams into 
                achievable milestones and track your progress. Every small step counts!
              </p>
            </div>
            <Badge className="bg-lys-teal/20 text-lys-teal font-oswald text-lg px-4 py-2">
              DO Phase
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
