import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Sparkles, 
  Target, 
  TrendingUp,
  BookOpen,
  Award,
  Clock,
  Plus,
  X,
  ChevronRight,
  Star,
  GraduationCap,
  Users,
  Zap,
  CheckCircle2,
  PlayCircle,
  Trash2,
  ShoppingBag,
  Search,
  Download,
  ExternalLink,
  Heart,
  Compass,
  RotateCcw,
  Trophy,
  Brain,
  Lightbulb,
  Rss
} from "lucide-react";
import type { EducatorCareerGoal, EducatorSkill, PDRecommendation, EducatorPDProgress } from "@shared/schema";

const goalTypes = [
  { value: "career_advancement", label: "Career Advancement" },
  { value: "leadership", label: "Leadership Role" },
  { value: "specialization", label: "Subject Specialization" },
  { value: "certification", label: "New Certification" },
  { value: "skill_development", label: "Skill Development" },
];

const skillCategories = [
  { value: "instruction", label: "Instruction & Pedagogy" },
  { value: "technology", label: "Educational Technology" },
  { value: "leadership", label: "Leadership & Mentoring" },
  { value: "assessment", label: "Assessment & Data" },
  { value: "communication", label: "Communication" },
  { value: "classroom", label: "Classroom Management" },
];

const resourceTypeIcons: Record<string, typeof BookOpen> = {
  course: GraduationCap,
  workshop: Users,
  certification: Award,
  self_study: BookOpen,
  peer_learning: Users,
};

export default function ProfessionalDevelopment() {
  const { toast } = useToast();
  const search = useSearch();
  const initialTab = new URLSearchParams(search).get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = new URLSearchParams(search).get("tab");
    if (tab) setActiveTab(tab);
  }, [search]);

  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: "", goalType: "", targetRole: "", description: "", timeframe: "", priority: 1 });
  const [newSkill, setNewSkill] = useState({ skillName: "", category: "", proficiencyLevel: 3 });

  const { data: goals = [], isLoading: goalsLoading } = useQuery<EducatorCareerGoal[]>({
    queryKey: ["/api/pd/career-goals"],
  });

  const { data: skills = [], isLoading: skillsLoading } = useQuery<EducatorSkill[]>({
    queryKey: ["/api/pd/skills"],
  });

  const { data: recommendations = [], isLoading: recsLoading } = useQuery<PDRecommendation[]>({
    queryKey: ["/api/pd/recommendations"],
  });

  const { data: progress = [], isLoading: progressLoading } = useQuery<EducatorPDProgress[]>({
    queryKey: ["/api/pd/progress"],
  });

  const createGoalMutation = useMutation({
    mutationFn: (goal: Partial<EducatorCareerGoal>) => 
      apiRequest("POST", "/api/pd/career-goals", goal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pd/career-goals"] });
      setIsGoalDialogOpen(false);
      setNewGoal({ title: "", goalType: "", targetRole: "", description: "", timeframe: "", priority: 1 });
      toast({ title: "Goal added", description: "Your career goal has been saved." });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest("DELETE", `/api/pd/career-goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pd/career-goals"] });
      toast({ title: "Goal removed" });
    },
  });

  const createSkillMutation = useMutation({
    mutationFn: (skill: Partial<EducatorSkill>) => 
      apiRequest("POST", "/api/pd/skills", skill),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pd/skills"] });
      setIsSkillDialogOpen(false);
      setNewSkill({ skillName: "", category: "", proficiencyLevel: 3 });
      toast({ title: "Skill added", description: "Your skill has been tracked." });
    },
  });

  const deleteSkillMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest("DELETE", `/api/pd/skills/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pd/skills"] });
      toast({ title: "Skill removed" });
    },
  });

  const generateRecsMutation = useMutation({
    mutationFn: () => 
      apiRequest("POST", "/api/pd/recommendations/generate"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pd/recommendations"] });
      toast({ title: "Recommendations generated", description: "AI has analyzed your profile and created personalized suggestions." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate recommendations.", variant: "destructive" });
    },
  });

  const startProgressMutation = useMutation({
    mutationFn: (data: { recommendationId: string; title: string }) => 
      apiRequest("POST", "/api/pd/progress", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pd/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pd/recommendations"] });
      toast({ title: "Activity started", description: "Good luck with your professional development!" });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<EducatorPDProgress> }) => 
      apiRequest("PATCH", `/api/pd/progress/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pd/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pd/recommendations"] });
      toast({ title: "Progress updated" });
    },
  });

  const lowSkills = skills.filter(s => s.proficiencyLevel < 3);
  const activeProgress = progress.filter(p => p.status === "in_progress");
  const completedProgress = progress.filter(p => p.status === "completed");
  
  // Calculate skill gap analysis
  const skillGapAnalysis = skills.map(s => {
    const targetLevel = Math.min(s.proficiencyLevel + 2, 5);
    const gap = targetLevel - s.proficiencyLevel;
    return { ...s, targetLevel, gap };
  }).sort((a, b) => b.gap - a.gap);
  
  // Match recommendations to goals
  const getMatchingGoals = (rec: PDRecommendation) => {
    if (!rec.relatedGoalIds || rec.relatedGoalIds.length === 0) return [];
    return goals.filter(g => rec.relatedGoalIds?.includes(g.id));
  };

  // Priority labels
  const priorityLabels = ["", "Critical", "High", "Medium", "Low", "Optional"];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="font-marker text-3xl sm:text-4xl text-foreground mb-2" data-testid="text-page-title">
            Professional Development
          </h1>
          <p className="font-roboto text-muted-foreground">
            Set career goals, track skills, and get personalized recommendations for growth.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 flex-wrap h-auto gap-1" data-testid="tabs-pd-navigation">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="goals" data-testid="tab-goals">Career Goals</TabsTrigger>
            <TabsTrigger value="skills" data-testid="tab-skills">Skills</TabsTrigger>
            <TabsTrigger value="recommendations" data-testid="tab-recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="progress" data-testid="tab-progress">My Progress</TabsTrigger>
            <TabsTrigger value="bkd-assessment" data-testid="tab-bkd-assessment">
              <Heart className="h-4 w-4 mr-1.5" />
              BKD Self-Assessment
            </TabsTrigger>
            <TabsTrigger value="courses" data-testid="tab-courses">
              <ShoppingBag className="h-4 w-4 mr-1.5" />
              LYS Courses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-lys-yellow/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-oswald flex items-center gap-2">
                    <Target className="h-5 w-5 text-lys-yellow" />
                    Career Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {goalsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold">{goals.length}</p>
                      <p className="text-sm text-muted-foreground">Active goals set</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-lys-teal/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-oswald flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-lys-teal" />
                    Skill Gaps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {skillsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold">{lowSkills.length}</p>
                      <p className="text-sm text-muted-foreground">Areas to develop</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-lys-red/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-oswald flex items-center gap-2">
                    <Award className="h-5 w-5 text-lys-red" />
                    Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {progressLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold">{completedProgress.length}</p>
                      <p className="text-sm text-muted-foreground">Activities finished</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Skill Gap Analysis Section */}
            {skillGapAnalysis.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-oswald flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-lys-teal" />
                    Skill Gap Analysis
                  </CardTitle>
                  <CardDescription>
                    Based on your current skills and career goals, here are your priority development areas.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {skillGapAnalysis.slice(0, 4).map((skill, index) => (
                      <div key={skill.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                        <Badge 
                          variant={index === 0 ? "default" : "secondary"} 
                          className={`w-8 h-8 rounded-full flex items-center justify-center p-0 ${index === 0 ? "bg-lys-red" : ""}`}
                        >
                          {index + 1}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">{skill.skillName}</p>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {skillCategories.find(c => c.value === skill.category)?.label || skill.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Current: Level {skill.proficiencyLevel}/5</span>
                            <ChevronRight className="h-3 w-3" />
                            <span className="text-lys-teal font-medium">Target: Level {skill.targetLevel}/5</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-lys-red">+{skill.gap} levels</p>
                          <p className="text-xs text-muted-foreground">to develop</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {skillGapAnalysis.length > 4 && (
                    <p className="text-sm text-muted-foreground mt-3 text-center">
                      +{skillGapAnalysis.length - 4} more skills to develop
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="font-oswald flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-lys-red" />
                  AI-Powered Recommendations
                </CardTitle>
                <CardDescription>
                  Get personalized professional development suggestions based on your career goals and identified skill gaps.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Button 
                    onClick={() => generateRecsMutation.mutate()}
                    disabled={generateRecsMutation.isPending}
                    className="bg-lys-red hover:bg-lys-red/90 text-white gap-2"
                    data-testid="button-generate-recommendations"
                  >
                    {generateRecsMutation.isPending ? (
                      <>Analyzing your profile...</>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Recommendations
                      </>
                    )}
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    {goals.length > 0 && skills.length > 0 ? (
                      <p>Ready to analyze {goals.length} career goal{goals.length !== 1 ? "s" : ""} and {skills.length} skill{skills.length !== 1 ? "s" : ""}.</p>
                    ) : goals.length === 0 && skills.length === 0 ? (
                      <p>Add career goals and skills first for personalized recommendations.</p>
                    ) : goals.length === 0 ? (
                      <p>Add career goals for better recommendations.</p>
                    ) : (
                      <p>Add skills for comprehensive gap analysis.</p>
                    )}
                  </div>
                </div>
                {recommendations.length > 0 && (
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium">
                      You have {recommendations.length} personalized recommendation{recommendations.length !== 1 ? "s" : ""} ready.
                    </p>
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto text-lys-teal hover:text-lys-teal/80"
                      onClick={() => setActiveTab("recommendations")}
                    >
                      View recommendations
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {activeProgress.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-oswald flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-lys-teal" />
                    Currently In Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeProgress.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.title}</p>
                        <Progress value={item.progress || 0} className="h-2 mt-2" />
                      </div>
                      <Badge variant="secondary">{item.progress || 0}%</Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateProgressMutation.mutate({ 
                          id: item.id, 
                          updates: { status: "completed", progress: 100 } 
                        })}
                        data-testid={`button-complete-${item.id}`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-oswald text-xl">Your Career Goals</h2>
                <p className="text-sm text-muted-foreground">Define where you want to be in your career</p>
              </div>
              <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2" data-testid="button-add-goal">
                    <Plus className="h-4 w-4" />
                    Add Goal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-oswald">Add Career Goal</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Goal Type</Label>
                      <Select 
                        value={newGoal.goalType} 
                        onValueChange={(v) => setNewGoal({ ...newGoal, goalType: v })}
                      >
                        <SelectTrigger data-testid="select-goal-type">
                          <SelectValue placeholder="Select goal type" />
                        </SelectTrigger>
                        <SelectContent>
                          {goalTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Target Role (optional)</Label>
                      <Input 
                        placeholder="e.g., Department Head, Curriculum Coordinator"
                        value={newGoal.targetRole}
                        onChange={(e) => setNewGoal({ ...newGoal, targetRole: e.target.value })}
                        data-testid="input-target-role"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea 
                        placeholder="Describe your goal..."
                        value={newGoal.description}
                        onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                        data-testid="input-goal-description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input 
                        placeholder="e.g., Become Department Chair"
                        value={newGoal.title}
                        onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                        data-testid="input-goal-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Timeframe</Label>
                      <Select 
                        value={newGoal.timeframe} 
                        onValueChange={(v) => setNewGoal({ ...newGoal, timeframe: v })}
                      >
                        <SelectTrigger data-testid="select-timeframe">
                          <SelectValue placeholder="Select timeframe" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6_months">6 Months</SelectItem>
                          <SelectItem value="1_year">1 Year</SelectItem>
                          <SelectItem value="2_years">2 Years</SelectItem>
                          <SelectItem value="5_years">5 Years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsGoalDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => createGoalMutation.mutate(newGoal)}
                      disabled={!newGoal.goalType || !newGoal.title || !newGoal.timeframe || createGoalMutation.isPending}
                      data-testid="button-save-goal"
                    >
                      Save Goal
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {goalsLoading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <Skeleton className="h-6 w-40 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : goals.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center py-12">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No career goals set yet.</p>
                  <p className="text-sm text-muted-foreground">Add your first goal to start your development journey.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {goals.map((goal) => (
                  <Card key={goal.id} data-testid={`card-goal-${goal.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Badge variant="secondary" className="mb-2">
                            {goalTypes.find(t => t.value === goal.goalType)?.label || goal.goalType}
                          </Badge>
                          <CardTitle className="text-lg font-oswald">
                            {goal.targetRole || "Career Goal"}
                          </CardTitle>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => deleteGoalMutation.mutate(goal.id)}
                          data-testid={`button-delete-goal-${goal.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        {goal.timeframe && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {goal.timeframe.replace("_", " ")}
                          </span>
                        )}
                        <Badge variant="outline" className="capitalize">
                          {goal.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-oswald text-xl">Skills Assessment</h2>
                <p className="text-sm text-muted-foreground">Track your current skills and set targets for growth</p>
              </div>
              <Dialog open={isSkillDialogOpen} onOpenChange={setIsSkillDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2" data-testid="button-add-skill">
                    <Plus className="h-4 w-4" />
                    Add Skill
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-oswald">Track a Skill</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Skill Name</Label>
                      <Input 
                        placeholder="e.g., Differentiated Instruction"
                        value={newSkill.skillName}
                        onChange={(e) => setNewSkill({ ...newSkill, skillName: e.target.value })}
                        data-testid="input-skill-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select 
                        value={newSkill.category} 
                        onValueChange={(v) => setNewSkill({ ...newSkill, category: v })}
                      >
                        <SelectTrigger data-testid="select-skill-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {skillCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Proficiency Level: {newSkill.proficiencyLevel}/5</Label>
                      <Slider 
                        value={[newSkill.proficiencyLevel]}
                        onValueChange={([v]) => setNewSkill({ ...newSkill, proficiencyLevel: v })}
                        min={1}
                        max={5}
                        step={1}
                        data-testid="slider-proficiency-level"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Beginner</span>
                        <span>Expert</span>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsSkillDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => createSkillMutation.mutate(newSkill)}
                      disabled={!newSkill.skillName || !newSkill.category || createSkillMutation.isPending}
                      data-testid="button-save-skill"
                    >
                      Save Skill
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {skillsLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-2 w-full mb-2" />
                      <Skeleton className="h-4 w-20" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : skills.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center py-12">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No skills tracked yet.</p>
                  <p className="text-sm text-muted-foreground">Add skills to identify areas for growth.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {skills.map((skill) => {
                  const proficiencyLabels = ["", "Beginner", "Developing", "Proficient", "Advanced", "Expert"];
                  const progressPercent = (skill.proficiencyLevel / 5) * 100;
                  const isLowSkill = skill.proficiencyLevel < 3;
                  return (
                    <Card key={skill.id} data-testid={`card-skill-${skill.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Badge variant="outline" className="mb-2 text-xs">
                              {skillCategories.find(c => c.value === skill.category)?.label || skill.category}
                            </Badge>
                            <CardTitle className="text-base font-medium">
                              {skill.skillName}
                            </CardTitle>
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => deleteSkillMutation.mutate(skill.id)}
                            data-testid={`button-delete-skill-${skill.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span>{proficiencyLabels[skill.proficiencyLevel]}</span>
                          {isLowSkill && (
                            <Badge variant="secondary" className="text-xs">
                              Needs Growth
                            </Badge>
                          )}
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-oswald text-xl">Personalized Recommendations</h2>
                <p className="text-sm text-muted-foreground">AI-powered suggestions based on your goals and skills</p>
              </div>
              <Button 
                onClick={() => generateRecsMutation.mutate()}
                disabled={generateRecsMutation.isPending}
                className="gap-2"
                data-testid="button-refresh-recommendations"
              >
                <Sparkles className="h-4 w-4" />
                {generateRecsMutation.isPending ? "Generating..." : "Refresh"}
              </Button>
            </div>

            {recsLoading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-8 w-24 mt-4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : recommendations.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center py-12">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No recommendations yet.</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add goals and skills, then generate personalized recommendations.
                  </p>
                  <Button 
                    onClick={() => generateRecsMutation.mutate()}
                    disabled={generateRecsMutation.isPending}
                    className="gap-2"
                    data-testid="button-generate-first-recommendations"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate Recommendations
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {recommendations.map((rec) => {
                  const resourceType = rec.resourceType || "course";
                  const IconComponent = resourceTypeIcons[resourceType] || BookOpen;
                  const isStarted = rec.status === "started" || rec.status === "completed";
                  return (
                    <Card key={rec.id} className={rec.status === "completed" ? "opacity-70" : ""} data-testid={`card-recommendation-${rec.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <IconComponent className="h-5 w-5 text-lys-teal" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Badge variant="outline" className="text-xs capitalize">
                                {resourceType.replace("_", " ")}
                              </Badge>
                              {rec.provider && (
                                <span className="text-xs text-muted-foreground">{rec.provider}</span>
                              )}
                              {rec.status === "completed" && (
                                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-base font-medium">{rec.title}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                        {rec.reason && (
                          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2 mb-3">
                            <Zap className="h-4 w-4 shrink-0 mt-0.5 text-lys-yellow" />
                            <span>{rec.reason}</span>
                          </div>
                        )}
                        {/* Skill Gaps Being Addressed */}
                        {rec.skillGaps && rec.skillGaps.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Skills this develops:</p>
                            <div className="flex flex-wrap gap-1">
                              {rec.skillGaps.map((gap, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {String(gap).replace(/_/g, " ")}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Priority Indicator */}
                        {rec.priority && rec.priority <= 3 && (
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`flex items-center gap-1 text-xs ${rec.priority === 1 ? "text-lys-red" : rec.priority === 2 ? "text-lys-yellow" : "text-lys-teal"}`}>
                              {[...Array(4 - rec.priority)].map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-current" />
                              ))}
                              <span className="ml-1 font-medium">{priorityLabels[rec.priority]} Priority</span>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2">
                          {rec.estimatedDuration && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {rec.estimatedDuration}
                            </span>
                          )}
                          {!isStarted && (
                            <Button 
                              size="sm" 
                              className="ml-auto gap-1"
                              onClick={() => startProgressMutation.mutate({ 
                                recommendationId: rec.id, 
                                title: rec.title 
                              })}
                              data-testid={`button-start-${rec.id}`}
                            >
                              <PlayCircle className="h-4 w-4" />
                              Start
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <div>
              <h2 className="font-oswald text-xl">Your Progress</h2>
              <p className="text-sm text-muted-foreground">Track your professional development activities</p>
            </div>

            {progressLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-2 w-full mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : progress.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center py-12">
                  <PlayCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No activities started yet.</p>
                  <p className="text-sm text-muted-foreground">
                    Start a recommended activity to track your progress.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeProgress.length > 0 && (
                  <div>
                    <h3 className="font-oswald text-lg mb-3 flex items-center gap-2">
                      <PlayCircle className="h-5 w-5 text-lys-teal" />
                      In Progress
                    </h3>
                    <div className="space-y-3">
                      {activeProgress.map((item) => (
                        <Card key={item.id} data-testid={`card-progress-${item.id}`}>
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <p className="font-medium mb-2">{item.title}</p>
                                <Progress value={item.progress || 0} className="h-2" />
                              </div>
                              <div className="flex items-center gap-2">
                                <Input 
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={item.progress || 0}
                                  onChange={(e) => {
                                    const newProgress = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                    updateProgressMutation.mutate({ 
                                      id: item.id, 
                                      updates: { progress: newProgress } 
                                    });
                                  }}
                                  className="w-16 text-center"
                                  data-testid={`input-progress-${item.id}`}
                                />
                                <span className="text-sm text-muted-foreground">%</span>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateProgressMutation.mutate({ 
                                    id: item.id, 
                                    updates: { status: "completed", progress: 100 } 
                                  })}
                                  className="gap-1"
                                  data-testid={`button-mark-complete-${item.id}`}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  Complete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {completedProgress.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-oswald text-lg mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Completed
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {completedProgress.map((item) => (
                        <Card key={item.id} className="bg-muted/30" data-testid={`card-completed-${item.id}`}>
                          <CardContent className="pt-4 pb-4 flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{item.title}</p>
                              {item.completedAt && (
                                <p className="text-xs text-muted-foreground">
                                  Completed {new Date(item.completedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                              Done
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bkd-assessment" className="space-y-6">
            <EducatorBKDAssessment />
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <PDCoursesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function PDCoursesTab() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const { data: items = [], isLoading } = useQuery<Array<{
    id: string;
    title: string;
    description: string;
    itemType: string;
    audience: string;
    bkdTargets: string[];
    price: number;
    coverImageUrl: string | null;
    author: string | null;
    authorBio: string | null;
    tags: string[];
    pageCount: number | null;
    durationMinutes: number | null;
    featured: boolean;
    owned: boolean;
    contentUrl: string | null;
    externalUrl: string | null;
  }>>({
    queryKey: ["/api/marketplace", { audience: "educators" }],
    queryFn: async () => {
      const res = await fetch("/api/marketplace?audience=educators");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: rssArticles = [], isLoading: loadingRss } = useQuery<Array<{
    id: string;
    title: string;
    description: string | null;
    url: string;
    sourceName: string | null;
    imageUrl: string | null;
    publishedAt: string | null;
    category: string | null;
  }>>({
    queryKey: ["/api/pd-content"],
    queryFn: async () => {
      const res = await fetch("/api/pd-content");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const claimMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/marketplace/${id}/claim`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace"] });
      toast({ title: "Claimed!", description: "This course has been added to your library." });
    },
  });

  const formatPrice = (cents: number) => {
    if (cents === 0) return "Free";
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(cents / 100);
  };

  const filtered = items.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
  });

  const filteredRss = rssArticles.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.title.toLowerCase().includes(q) || (a.description ?? "").toLowerCase().includes(q);
  });

  const hasContent = filtered.length > 0 || filteredRss.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-oswald text-xl">LYS Courses & Resources</h2>
          <p className="text-sm text-muted-foreground">eBooks, mini courses, guides, and curated professional development articles</p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses and articles..." className="pl-9" data-testid="input-search-pd-courses" />
        </div>
      </div>

      {(isLoading || loadingRss) ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Card key={i}><CardContent className="pt-6"><Skeleton className="h-5 w-3/4 mb-2" /><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-8 w-24 mt-4" /></CardContent></Card>)}
        </div>
      ) : !hasContent ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center py-16">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="font-oswald text-lg text-muted-foreground mb-1">Educator Courses Coming Soon</p>
            <p className="text-sm text-muted-foreground font-roboto max-w-sm mx-auto">
              LYS eBooks and courses for educators will appear here once published. Check back soon!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {filtered.length > 0 && (
            <section>
              <h3 className="font-oswald text-lg mb-3 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-lys-teal" />
                LYS Courses & eBooks
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((item) => (
                  <Card key={item.id} className="hover-elevate flex flex-col" data-testid={`card-pd-course-${item.id}`}>
                    {item.coverImageUrl && <img src={item.coverImageUrl} alt={item.title} className="w-full h-36 object-cover rounded-t-lg" />}
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs capitalize">{item.itemType.replace("_", " ")}</Badge>
                        <span className="text-sm font-oswald">
                          {item.price === 0 ? <span className="text-green-600">Free</span> : <span className="text-lys-yellow">{formatPrice(item.price)}</span>}
                        </span>
                      </div>
                      <CardTitle className="font-oswald text-base mt-2 leading-snug">{item.title}</CardTitle>
                      {item.author && <p className="text-xs text-muted-foreground">by {item.author}</p>}
                      <CardDescription className="text-xs line-clamp-2 mt-1">{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto">
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.durationMinutes && <Badge variant="secondary" className="text-xs"><Clock className="h-3 w-3 mr-1" />{item.durationMinutes} min</Badge>}
                      </div>
                      {item.owned ? (
                        <Button className="w-full font-oswald gap-2" onClick={() => item.contentUrl ? window.open(item.contentUrl, "_blank") : null} data-testid={`button-access-course-${item.id}`}>
                          <Download className="h-4 w-4" />Access Content
                        </Button>
                      ) : item.price === 0 ? (
                        <Button className="w-full font-oswald gap-2 bg-lys-teal hover:bg-lys-teal/90" onClick={() => claimMutation.mutate(item.id)} disabled={claimMutation.isPending} data-testid={`button-claim-course-${item.id}`}>
                          <Download className="h-4 w-4" />{claimMutation.isPending ? "Claiming..." : "Get for Free"}
                        </Button>
                      ) : (
                        <Button className="w-full font-oswald gap-2" onClick={() => window.open("mailto:purchase@ladderingyoursuccess.com?subject=Purchase: " + encodeURIComponent(item.title), "_blank")} data-testid={`button-buy-course-${item.id}`}>
                          <ExternalLink className="h-4 w-4" />Purchase — {formatPrice(item.price)}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {filteredRss.length > 0 && (
            <section>
              <h3 className="font-oswald text-lg mb-3 flex items-center gap-2">
                <Rss className="h-5 w-5 text-lys-yellow" />
                Curated Professional Development Articles
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRss.map((article) => (
                  <Card key={article.id} className="hover-elevate flex flex-col" data-testid={`card-pd-article-${article.id}`}>
                    {article.imageUrl && (
                      <img src={article.imageUrl} alt={article.title} className="w-full h-36 object-cover rounded-t-lg" />
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs text-lys-yellow border-lys-yellow/30">Article</Badge>
                        {article.sourceName && <span className="text-xs text-muted-foreground truncate">{article.sourceName}</span>}
                      </div>
                      <CardTitle className="font-oswald text-base mt-2 leading-snug line-clamp-2">{article.title}</CardTitle>
                      {article.publishedAt && (
                        <p className="text-xs text-muted-foreground">{new Date(article.publishedAt).toLocaleDateString()}</p>
                      )}
                      <CardDescription className="text-xs line-clamp-3 mt-1">{article.description ?? "Professional development resource for educators."}</CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto">
                      <Button variant="outline" className="w-full font-oswald gap-2" onClick={() => window.open(article.url, "_blank")} data-testid={`button-read-article-${article.id}`}>
                        <ExternalLink className="h-4 w-4" />Read Article
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

// Educator-specific BKD questions — framed around professional teaching identity
const educatorBKDQuestions = [
  // BE — Teaching Identity & Values
  {
    id: "be-1",
    text: "How clearly can you articulate your personal teaching philosophy and core values as an educator?",
    category: "be" as const,
    options: [
      { value: "a", label: "I have a well-defined philosophy I actively share with students and colleagues", score: 3 },
      { value: "b", label: "I have a general sense of my values but haven't formalized them", score: 2 },
      { value: "c", label: "I haven't yet spent much time developing a personal teaching identity", score: 1 },
    ],
  },
  {
    id: "be-2",
    text: "How well does your teaching practice reflect who you are as a person — your authentic self?",
    category: "be" as const,
    options: [
      { value: "a", label: "I bring my genuine personality into every lesson and relationship with students", score: 3 },
      { value: "b", label: "Sometimes I feel I'm playing a role rather than being fully myself", score: 2 },
      { value: "c", label: "I often feel disconnected between who I am and how I teach", score: 1 },
    ],
  },
  {
    id: "be-3",
    text: "How connected do you feel to your long-term purpose as an educator?",
    category: "be" as const,
    options: [
      { value: "a", label: "I am deeply grounded in my 'why' — my students and community drive everything I do", score: 3 },
      { value: "b", label: "I feel connected on good days but sometimes lose sight of the bigger picture", score: 2 },
      { value: "c", label: "I'm still figuring out what my deeper purpose is in education", score: 1 },
    ],
  },
  // KNOW — Subject & Pedagogical Mastery
  {
    id: "know-1",
    text: "How confident are you in your mastery of the subject matter you teach?",
    category: "know" as const,
    options: [
      { value: "a", label: "Highly confident — I stay current, go deep, and can answer most questions", score: 3 },
      { value: "b", label: "Fairly confident but there are gaps I know I need to address", score: 2 },
      { value: "c", label: "I often feel I need to strengthen my subject-matter knowledge", score: 1 },
    ],
  },
  {
    id: "know-2",
    text: "How well do you understand different instructional strategies and when to use each one?",
    category: "know" as const,
    options: [
      { value: "a", label: "I draw from a wide repertoire of strategies and match them to student needs", score: 3 },
      { value: "b", label: "I have a few go-to methods but could expand my toolkit", score: 2 },
      { value: "c", label: "I tend to rely on one or two approaches regardless of the student or context", score: 1 },
    ],
  },
  {
    id: "know-3",
    text: "How well do you understand your students' learning needs, backgrounds, and circumstances?",
    category: "know" as const,
    options: [
      { value: "a", label: "I actively learn about each student and use that knowledge to differentiate instruction", score: 3 },
      { value: "b", label: "I know my students generally but could invest more in truly understanding them", score: 2 },
      { value: "c", label: "I find it hard to find time to learn much beyond academic performance data", score: 1 },
    ],
  },
  // DO — Classroom Impact & Professional Action
  {
    id: "do-1",
    text: "How consistently do you set measurable goals for your students and track their progress?",
    category: "do" as const,
    options: [
      { value: "a", label: "I use data regularly to set goals, monitor progress, and adjust my teaching", score: 3 },
      { value: "b", label: "I track progress informally but don't always have clear measurable targets", score: 2 },
      { value: "c", label: "I haven't built a consistent system for goal-setting and progress monitoring", score: 1 },
    ],
  },
  {
    id: "do-2",
    text: "How actively do you pursue your own professional development and continuous growth?",
    category: "do" as const,
    options: [
      { value: "a", label: "I regularly seek PD opportunities, reflect on my practice, and implement what I learn", score: 3 },
      { value: "b", label: "I engage in PD when it's provided but rarely seek it out on my own", score: 2 },
      { value: "c", label: "Professional development doesn't feel like a high priority right now", score: 1 },
    ],
  },
  {
    id: "do-3",
    text: "How effectively do you collaborate with colleagues, families, and the broader community to support your students?",
    category: "do" as const,
    options: [
      { value: "a", label: "I build strong relationships with families and colleagues and actively co-create student success", score: 3 },
      { value: "b", label: "I collaborate when required but could be more proactive about reaching out", score: 2 },
      { value: "c", label: "Collaboration outside my classroom is limited right now", score: 1 },
    ],
  },
];

function EducatorBKDAssessment() {
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { value: string; score: number }>>({});
  const [showResults, setShowResults] = useState(false);
  const [resultsSaved, setResultsSaved] = useState(false);

  const { data: previousResults = [] } = useQuery<any[]>({
    queryKey: ["/api/educator/bkd-assessment"],
  });

  const saveResultsMutation = useMutation({
    mutationFn: async (results: any) => {
      const res = await apiRequest("POST", "/api/educator/bkd-assessment", results);
      return res.json();
    },
    onSuccess: (data) => {
      setResultsSaved(true);
      queryClient.invalidateQueries({ queryKey: ["/api/pd/career-goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pd/recommendations"] });
      const goalsCreated = data?.suggestedGoals?.length || 0;
      toast({
        title: "BKD Assessment Saved",
        description: goalsCreated > 0
          ? `Results saved! ${goalsCreated} PD goal${goalsCreated > 1 ? "s" : ""} were automatically added to your Career Goals based on areas for growth.`
          : "Your assessment results have been saved to your profile.",
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save results.", variant: "destructive" });
    },
  });

  const question = educatorBKDQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / educatorBKDQuestions.length) * 100;

  const handleAnswer = (value: string, score: number) => {
    setAnswers(prev => ({ ...prev, [question.id]: { value, score } }));
  };

  const calculateResults = () => {
    const scores = { be: 0, know: 0, do: 0 };
    const maxScores = { be: 0, know: 0, do: 0 };
    educatorBKDQuestions.forEach(q => {
      maxScores[q.category] += 3;
      const answer = answers[q.id];
      if (answer) scores[q.category] += answer.score;
    });
    const bePercent = Math.round((scores.be / maxScores.be) * 100);
    const knowPercent = Math.round((scores.know / maxScores.know) * 100);
    const doPercent = Math.round((scores.do / maxScores.do) * 100);
    const total = Math.round(((scores.be + scores.know + scores.do) / (maxScores.be + maxScores.know + maxScores.do)) * 100);

    const strengths: string[] = [];
    const growthAreas: string[] = [];

    if (bePercent >= 70) strengths.push("Strong teaching identity and clear personal values");
    else if (bePercent < 50) growthAreas.push("Develop a clearer sense of teaching identity and purpose");
    if (knowPercent >= 70) strengths.push("Deep subject expertise and pedagogical range");
    else if (knowPercent < 50) growthAreas.push("Strengthen subject-matter knowledge and instructional strategies");
    if (doPercent >= 70) strengths.push("Consistent classroom impact and professional action");
    else if (doPercent < 50) growthAreas.push("Build habits for goal-setting, data use, and professional collaboration");

    return { be: bePercent, know: knowPercent, do: doPercent, total, strengths, growthAreas };
  };

  const pillars = [
    { key: "be" as const, icon: Heart, color: "text-lys-yellow", bg: "bg-lys-yellow/10", bar: "bg-lys-yellow", label: "BE", subtitle: "Teaching Identity & Values" },
    { key: "know" as const, icon: Brain, color: "text-lys-red", bg: "bg-lys-red/10", bar: "bg-lys-red", label: "KNOW", subtitle: "Subject & Pedagogical Mastery" },
    { key: "do" as const, icon: Zap, color: "text-lys-teal", bg: "bg-lys-teal/10", bar: "bg-lys-teal", label: "DO", subtitle: "Classroom Impact & Action" },
  ];

  const categoryPillar = pillars.find(p => p.key === question?.category) || pillars[0];

  if (showResults) {
    const results = calculateResults();
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-lys-yellow/10 flex items-center justify-center mx-auto mb-3">
            <Trophy className="h-7 w-7 text-lys-yellow" />
          </div>
          <h2 className="font-marker text-2xl sm:text-3xl text-foreground mb-1">Your Educator BKD Profile</h2>
          <p className="font-roboto text-muted-foreground text-sm">
            This reflects your professional identity, knowledge, and classroom impact.
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
            <Badge variant="secondary" className="font-oswald gap-1">
              <Heart className="h-3 w-3" /> Educator Assessment
            </Badge>
            <Badge variant="outline" className="font-roboto text-xs gap-1">
              <Lightbulb className="h-3 w-3" /> Results connect to your PD goals
            </Badge>
          </div>
        </div>

        {/* Pillar Scores */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {pillars.map(pillar => {
            const Icon = pillar.icon;
            const score = results[pillar.key];
            return (
              <Card key={pillar.key} className={`${pillar.bg} border-none`}>
                <CardContent className="p-5 text-center">
                  <Icon className={`h-7 w-7 ${pillar.color} mx-auto mb-2`} />
                  <p className="font-oswald text-xl font-bold">{pillar.label}</p>
                  <p className="text-xs text-muted-foreground mb-3">{pillar.subtitle}</p>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-2">
                    <div className={`absolute left-0 top-0 h-full ${pillar.bar}`} style={{ width: `${score}%` }} />
                  </div>
                  <p className="font-oswald text-2xl">{score}%</p>
                  {score < 60 && (
                    <Badge variant="outline" className="text-xs mt-1 font-roboto">Growth area → PD goal added</Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Strengths + Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="font-oswald text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-lys-red" />
              Overall Score: {results.total}%
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.strengths.length > 0 && (
              <div>
                <p className="font-oswald text-sm mb-2 text-green-700 dark:text-green-400">Your Strengths</p>
                <div className="flex flex-wrap gap-2">
                  {results.strengths.map((s, i) => (
                    <Badge key={i} variant="secondary" className="font-roboto">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {results.growthAreas.length > 0 && (
              <div>
                <p className="font-oswald text-sm mb-2 text-amber-700 dark:text-amber-400">Areas for Growth</p>
                <div className="flex flex-wrap gap-2">
                  {results.growthAreas.map((g, i) => (
                    <Badge key={i} variant="outline" className="font-roboto">{g}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => { setCurrentQuestion(0); setAnswers({}); setShowResults(false); setResultsSaved(false); }} className="gap-2" data-testid="button-retake-educator-bkd">
            <RotateCcw className="h-4 w-4" /> Retake Assessment
          </Button>
          {!resultsSaved && (
            <Button
              onClick={() => saveResultsMutation.mutate({ beScore: results.be, knowScore: results.know, doScore: results.do, totalScore: results.total, strengths: results.strengths, growthAreas: results.growthAreas, answers })}
              disabled={saveResultsMutation.isPending}
              className="gap-2 bg-lys-teal hover:bg-lys-teal/90 text-white"
              data-testid="button-save-educator-bkd"
            >
              <Sparkles className="h-4 w-4" />
              {saveResultsMutation.isPending ? "Saving & Creating Goals..." : "Save Results & Create PD Goals"}
            </Button>
          )}
          {resultsSaved && (
            <Badge variant="secondary" className="font-roboto py-2 px-4">
              <CheckCircle2 className="h-4 w-4 mr-1" /> Saved — Check Career Goals tab
            </Badge>
          )}
        </div>

        {/* Previous Results */}
        {previousResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-oswald text-base">Assessment History</CardTitle>
              <CardDescription className="font-roboto">Your past educator BKD assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {previousResults.slice(0, 5).map((r: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-3 border rounded-md">
                    <div className="text-xs text-muted-foreground font-roboto w-24">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                    </div>
                    <div className="flex gap-3 flex-1">
                      {[{ label: "BE", val: r.beScore, color: "text-lys-yellow" }, { label: "KNOW", val: r.knowScore, color: "text-lys-red" }, { label: "DO", val: r.doScore, color: "text-lys-teal" }].map(p => (
                        <div key={p.label} className="text-center">
                          <p className={`font-oswald text-sm font-bold ${p.color}`}>{p.label}</p>
                          <p className="font-roboto text-sm">{p.val ?? "—"}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Context Banner */}
      <Card className="border-lys-yellow/30 bg-lys-yellow/5">
        <CardContent className="py-4 flex gap-4 items-start">
          <Heart className="h-6 w-6 text-lys-yellow shrink-0 mt-0.5" />
          <div>
            <p className="font-oswald text-base font-semibold">Educator Be-Know-Do Self-Assessment</p>
            <p className="font-roboto text-sm text-muted-foreground mt-1">
              This assessment is <strong>only for you</strong> — it measures your professional identity (<span className="text-lys-yellow font-semibold">BE</span>), pedagogical knowledge (<span className="text-lys-red font-semibold">KNOW</span>), and classroom impact (<span className="text-lys-teal font-semibold">DO</span>). Results automatically suggest Professional Development goals where you have room to grow.
            </p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="font-roboto text-xs">For Educators Only</Badge>
              <Badge variant="outline" className="font-roboto text-xs">Not visible to students</Badge>
              <Badge variant="outline" className="font-roboto text-xs">Connects to your PD goals</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pillar Legend */}
      <div className="grid grid-cols-3 gap-3">
        {pillars.map(pillar => {
          const Icon = pillar.icon;
          return (
            <div key={pillar.key} className={`${pillar.bg} rounded-lg p-3 text-center`}>
              <Icon className={`h-5 w-5 ${pillar.color} mx-auto mb-1`} />
              <p className={`font-oswald text-sm font-bold ${pillar.color}`}>{pillar.label}</p>
              <p className="font-roboto text-xs text-muted-foreground">{pillar.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground font-roboto mb-1">
          <span>Question {currentQuestion + 1} of {educatorBKDQuestions.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div className="absolute left-0 top-0 h-full bg-lys-teal transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader className={`${categoryPillar.bg} border-b`}>
          <div className="flex items-center gap-2">
            {(() => { const Icon = categoryPillar.icon; return <Icon className={`h-5 w-5 ${categoryPillar.color}`} />; })()}
            <Badge variant="secondary" className="font-oswald">
              {categoryPillar.label}: {categoryPillar.subtitle}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="font-roboto text-lg mb-6">{question.text}</p>
          <div className="space-y-3">
            {question.options.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleAnswer(option.value, option.score)}
                data-testid={`radio-edu-${question.id}-${option.value}`}
                className={`w-full text-left flex items-start gap-3 p-4 rounded-md border transition-all ${
                  answers[question.id]?.value === option.value
                    ? "border-lys-teal bg-lys-teal/5"
                    : "border-border hover:border-lys-teal/50"
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${answers[question.id]?.value === option.value ? "border-lys-teal" : "border-muted-foreground"}`}>
                  {answers[question.id]?.value === option.value && <div className="w-2 h-2 rounded-full bg-lys-teal" />}
                </div>
                <span className="font-roboto text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentQuestion(p => p - 1)} disabled={currentQuestion === 0} className="gap-2" data-testid="button-edu-bkd-prev">
          Previous
        </Button>
        <Button
          onClick={() => {
            if (currentQuestion < educatorBKDQuestions.length - 1) setCurrentQuestion(p => p + 1);
            else setShowResults(true);
          }}
          disabled={!answers[question.id]}
          className="gap-2 bg-lys-teal hover:bg-lys-teal/90 text-white"
          data-testid="button-edu-bkd-next"
        >
          {currentQuestion === educatorBKDQuestions.length - 1 ? "See My Results" : "Next"}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
