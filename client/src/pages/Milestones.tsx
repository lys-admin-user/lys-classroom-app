import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { 
  Target, 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  Heart, 
  Brain, 
  Zap,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock
} from "lucide-react";
import type { LyseMilestone } from "@shared/schema";

const CATEGORY_CONFIG = {
  being: {
    label: "Being",
    description: "Who you are becoming - identity, values, character",
    icon: Heart,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20"
  },
  knowing: {
    label: "Knowing",
    description: "What you need to learn - knowledge, skills, understanding",
    icon: Brain,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20"
  },
  doing: {
    label: "Doing",
    description: "Actions to take - tasks, projects, achievements",
    icon: Zap,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20"
  }
};

export default function MilestonesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"being" | "knowing" | "doing">("being");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<LyseMilestone | null>(null);
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    category: "being" as "being" | "knowing" | "doing",
    status: "not_started" as const,
    isGatekeeper: false,
    dueDate: null as string | null,
    weight: 1
  });

  const { data: milestones = [], isLoading } = useQuery<LyseMilestone[]>({
    queryKey: ["/api/lyse-milestones"],
    enabled: !!user,
  });

  const { data: gatekeepers = [] } = useQuery<LyseMilestone[]>({
    queryKey: ["/api/lyse-milestones/gatekeepers"],
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newMilestone) => {
      return await apiRequest("POST", "/api/lyse-milestones", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lyse-milestones"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lyse-milestones/gatekeepers"] });
      setIsCreateOpen(false);
      setNewMilestone({
        title: "",
        description: "",
        category: "being",
        status: "not_started",
        isGatekeeper: false,
        dueDate: null,
        weight: 1
      });
      toast({ title: "Milestone created" });
    },
    onError: () => {
      toast({ title: "Failed to create milestone", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<LyseMilestone> }) => {
      return await apiRequest("PATCH", `/api/lyse-milestones/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lyse-milestones"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lyse-milestones/gatekeepers"] });
      setEditingMilestone(null);
      toast({ title: "Milestone updated" });
    },
    onError: () => {
      toast({ title: "Failed to update milestone", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/lyse-milestones/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lyse-milestones"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lyse-milestones/gatekeepers"] });
      toast({ title: "Milestone deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete milestone", variant: "destructive" });
    },
  });

  const getMilestonesByCategory = (category: string) => 
    milestones.filter(m => m.category === category);

  const getCompletedWeight = (category: string) => 
    getMilestonesByCategory(category)
      .filter(m => m.status === "completed")
      .reduce((sum, m) => sum + (m.weight || 1), 0);

  const getTotalWeight = (category: string) =>
    getMilestonesByCategory(category)
      .reduce((sum, m) => sum + (m.weight || 1), 0);

  const getCompletedCount = (category: string) => 
    getMilestonesByCategory(category).filter(m => m.status === "completed").length;

  const getCategoryProgress = (category: string) => {
    const totalWeight = getTotalWeight(category);
    if (totalWeight === 0) return 0;
    return Math.round((getCompletedWeight(category) / totalWeight) * 100);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      not_started: { label: "Not Started", variant: "outline" },
      in_progress: { label: "In Progress", variant: "secondary" },
      completed: { label: "Completed", variant: "default" },
      blocked: { label: "Blocked", variant: "destructive" }
    };
    return config[status] || { label: status, variant: "outline" };
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-oswald text-xl mb-2">Sign in to track your milestones</h2>
        <p className="text-muted-foreground">Your Be-Know-Do journey starts here</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-lys-red/10 flex items-center justify-center">
            <Target className="h-6 w-6 text-lys-red" />
          </div>
          <div>
            <h1 className="font-oswald font-semibold tracking-tight text-3xl sm:text-4xl text-foreground">
              My Milestones
            </h1>
            <p className="font-roboto text-muted-foreground">
              Track your Be-Know-Do journey
            </p>
          </div>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-lys-teal hover:bg-lys-teal/90" data-testid="button-create-milestone">
              <Plus className="h-4 w-4 mr-2" />
              New Milestone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Milestone</DialogTitle>
              <DialogDescription>Add a new milestone to your Be-Know-Do journey.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="milestone-title">Title</Label>
                <Input
                  id="milestone-title"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                  placeholder="Complete leadership training"
                  data-testid="input-milestone-title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="milestone-description">Description</Label>
                <Textarea
                  id="milestone-description"
                  value={newMilestone.description || ""}
                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                  placeholder="What does this milestone involve?"
                  data-testid="input-milestone-description"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="milestone-category">Category</Label>
                <Select
                  value={newMilestone.category}
                  onValueChange={(value: any) => setNewMilestone({ ...newMilestone, category: value })}
                >
                  <SelectTrigger data-testid="select-milestone-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="being">Being - Identity & Values</SelectItem>
                    <SelectItem value="knowing">Knowing - Skills & Knowledge</SelectItem>
                    <SelectItem value="doing">Doing - Actions & Achievements</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="milestone-due">Due Date (Optional)</Label>
                <Input
                  id="milestone-due"
                  type="date"
                  value={newMilestone.dueDate || ""}
                  onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value || null })}
                  data-testid="input-milestone-due"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="milestone-weight">Weight (1-10)</Label>
                <Input
                  id="milestone-weight"
                  type="number"
                  min={1}
                  max={10}
                  value={newMilestone.weight}
                  onChange={(e) => setNewMilestone({ ...newMilestone, weight: parseInt(e.target.value) || 1 })}
                  data-testid="input-milestone-weight"
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label>Gatekeeper Milestone</Label>
                  <p className="text-sm text-muted-foreground">Block progress until completed</p>
                </div>
                <Switch
                  checked={newMilestone.isGatekeeper}
                  onCheckedChange={(checked) => setNewMilestone({ ...newMilestone, isGatekeeper: checked })}
                  data-testid="switch-milestone-gatekeeper"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} data-testid="button-cancel-milestone">
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate(newMilestone)}
                disabled={!newMilestone.title || createMutation.isPending}
                data-testid="button-submit-milestone"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {(Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>).map((category) => {
          const config = CATEGORY_CONFIG[category];
          const Icon = config.icon;
          const categoryMilestones = getMilestonesByCategory(category);
          const completedCount = getCompletedCount(category);
          const progress = getCategoryProgress(category);

          const completedWeight = getCompletedWeight(category);
          const totalWeight = getTotalWeight(category);
          
          return (
            <Card key={category} className={`${config.borderColor} border-2`}>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-md ${config.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{completedCount}/{categoryMilestones.length}</Badge>
                  <Badge variant="secondary" className="text-xs">{completedWeight}/{totalWeight} pts</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {gatekeepers.length > 0 && gatekeepers.some(g => g.status !== "completed") && (
        <Card className="mb-6 border-amber-500/50 bg-amber-500/5">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <Lock className="h-5 w-5 text-amber-500" />
            <div>
              <CardTitle className="text-base">Gatekeeper Milestones</CardTitle>
              <CardDescription>Complete these to unlock further progress</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {gatekeepers.filter(g => g.status !== "completed").map((gk) => (
                <Badge key={gk.id} variant="outline" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {gk.title}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="flex-wrap">
          {(Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>).map((category) => {
            const config = CATEGORY_CONFIG[category];
            const Icon = config.icon;
            return (
              <TabsTrigger key={category} value={category} data-testid={`tab-${category}`}>
                <Icon className="h-4 w-4 mr-2" />
                {config.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>).map((category) => {
          const categoryMilestones = getMilestonesByCategory(category);

          return (
            <TabsContent key={category} value={category} className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : categoryMilestones.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    {(() => {
                      const Icon = CATEGORY_CONFIG[category].icon;
                      return <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />;
                    })()}
                    <p className="text-muted-foreground">No {category} milestones yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {CATEGORY_CONFIG[category].description}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setNewMilestone({ ...newMilestone, category });
                        setIsCreateOpen(true);
                      }}
                      data-testid={`button-add-${category}-milestone`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add {CATEGORY_CONFIG[category].label} Milestone
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {categoryMilestones.map((milestone) => {
                    const statusConfig = getStatusBadge(milestone.status || "not_started");
                    return (
                      <Card key={milestone.id} data-testid={`card-milestone-${milestone.id}`}>
                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-md ${CATEGORY_CONFIG[category].bgColor} flex items-center justify-center shrink-0`}>
                              {milestone.status === "completed" ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : milestone.isGatekeeper ? (
                                <Lock className="h-5 w-5 text-amber-500" />
                              ) : (
                                <Target className={`h-5 w-5 ${CATEGORY_CONFIG[category].color}`} />
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{milestone.title}</CardTitle>
                              {milestone.description && (
                                <CardDescription className="mt-1">{milestone.description}</CardDescription>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                            {milestone.isGatekeeper && (
                              <Badge variant="outline" className="gap-1">
                                <Lock className="h-3 w-3" />
                                Gatekeeper
                              </Badge>
                            )}
                            <Badge variant="secondary">Weight: {milestone.weight || 1}</Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditingMilestone(milestone)}
                              data-testid={`button-edit-milestone-${milestone.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteMutation.mutate(milestone.id)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-delete-milestone-${milestone.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        {milestone.dueDate && (
                          <CardContent>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Due: {format(new Date(milestone.dueDate.toString()), "MMM d, yyyy")}</span>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <Dialog open={!!editingMilestone} onOpenChange={(open) => !open && setEditingMilestone(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Milestone</DialogTitle>
            <DialogDescription>Update your milestone details.</DialogDescription>
          </DialogHeader>
          {editingMilestone && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-milestone-title">Title</Label>
                <Input
                  id="edit-milestone-title"
                  value={editingMilestone.title}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, title: e.target.value })}
                  data-testid="input-edit-milestone-title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-milestone-description">Description</Label>
                <Textarea
                  id="edit-milestone-description"
                  value={editingMilestone.description || ""}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, description: e.target.value })}
                  data-testid="input-edit-milestone-description"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-milestone-status">Status</Label>
                <Select
                  value={editingMilestone.status || "not_started"}
                  onValueChange={(value: any) => setEditingMilestone({ ...editingMilestone, status: value })}
                >
                  <SelectTrigger data-testid="select-edit-milestone-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-milestone-weight">Weight (1-10)</Label>
                <Input
                  id="edit-milestone-weight"
                  type="number"
                  min={1}
                  max={10}
                  value={editingMilestone.weight || 1}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, weight: parseInt(e.target.value) || 1 })}
                  data-testid="input-edit-milestone-weight"
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label>Gatekeeper Milestone</Label>
                <Switch
                  checked={editingMilestone.isGatekeeper ?? false}
                  onCheckedChange={(checked) => setEditingMilestone({ ...editingMilestone, isGatekeeper: checked })}
                  data-testid="switch-edit-milestone-gatekeeper"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMilestone(null)} data-testid="button-cancel-edit-milestone">
              Cancel
            </Button>
            <Button
              onClick={() => editingMilestone && updateMutation.mutate({
                id: editingMilestone.id,
                updates: {
                  title: editingMilestone.title,
                  description: editingMilestone.description,
                  status: editingMilestone.status,
                  weight: editingMilestone.weight,
                  isGatekeeper: editingMilestone.isGatekeeper,
                }
              })}
              disabled={updateMutation.isPending}
              data-testid="button-submit-edit-milestone"
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
