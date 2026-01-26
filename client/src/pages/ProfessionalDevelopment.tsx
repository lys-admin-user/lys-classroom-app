import { useState } from "react";
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
  Trash2
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
  const [activeTab, setActiveTab] = useState("overview");
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
          <TabsList className="bg-muted/50" data-testid="tabs-pd-navigation">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="goals" data-testid="tab-goals">Career Goals</TabsTrigger>
            <TabsTrigger value="skills" data-testid="tab-skills">Skills</TabsTrigger>
            <TabsTrigger value="recommendations" data-testid="tab-recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="progress" data-testid="tab-progress">My Progress</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  );
}
