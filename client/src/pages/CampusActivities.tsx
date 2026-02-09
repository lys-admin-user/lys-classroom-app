import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Plus, Pencil, Trash2, Clock, Users, Award, Calendar } from "lucide-react";

type CampusActivity = {
  id: string;
  activityName: string;
  category: string;
  role: string;
  organization: string;
  startDate: string;
  endDate: string | null;
  hoursPerWeek: number;
  description: string | null;
  achievements: string[];
  careerFields: string[];
  isActive: boolean;
};

const CATEGORIES: Record<string, { label: string; className: string }> = {
  honor_society: { label: "Honor Society", className: "bg-yellow-500/10 text-yellow-600" },
  club: { label: "Club", className: "bg-blue-500/10 text-blue-600" },
  sports: { label: "Sports", className: "bg-green-500/10 text-green-600" },
  volunteer: { label: "Volunteer", className: "bg-pink-500/10 text-pink-600" },
  leadership: { label: "Leadership", className: "bg-purple-500/10 text-purple-600" },
  arts: { label: "Arts", className: "bg-orange-500/10 text-orange-600" },
  academic: { label: "Academic", className: "bg-cyan-500/10 text-cyan-600" },
  other: { label: "Other", className: "bg-muted text-muted-foreground" },
};

const CAREER_FIELDS = ["STEM", "Healthcare", "Business", "Arts", "Education", "Technology"];

const LEADERSHIP_ROLES = ["president", "vice president", "captain", "chair", "lead", "director", "founder", "officer", "treasurer", "secretary"];

const emptyForm = {
  activityName: "", category: "club", role: "", organization: "",
  startDate: "", endDate: "", hoursPerWeek: 2, description: "",
  achievements: [] as string[], careerFields: [] as string[], isActive: true,
};

export default function CampusActivities() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [achievementInput, setAchievementInput] = useState("");

  const { data: activities = [], isLoading } = useQuery<CampusActivity[]>({
    queryKey: ["/api/campus-activities"],
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/campus-activities", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campus-activities"] });
      toast({ title: "Activity added" });
      closeDialog();
    },
    onError: () => toast({ title: "Failed to add activity", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/campus-activities/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campus-activities"] });
      toast({ title: "Activity updated" });
      closeDialog();
    },
    onError: () => toast({ title: "Failed to update activity", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/campus-activities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campus-activities"] });
      toast({ title: "Activity deleted" });
    },
    onError: () => toast({ title: "Failed to delete activity", variant: "destructive" }),
  });

  function closeDialog() {
    setDialogOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setAchievementInput("");
  }

  function openEdit(activity: CampusActivity) {
    setEditingId(activity.id);
    setForm({
      activityName: activity.activityName,
      category: activity.category,
      role: activity.role,
      organization: activity.organization,
      startDate: activity.startDate,
      endDate: activity.endDate || "",
      hoursPerWeek: activity.hoursPerWeek,
      description: activity.description || "",
      achievements: activity.achievements || [],
      careerFields: activity.careerFields || [],
      isActive: activity.isActive,
    });
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.activityName || !form.role || !form.organization || !form.startDate) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }
    const payload = { ...form, endDate: form.endDate || null, description: form.description || null };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function addAchievement() {
    if (achievementInput.trim()) {
      setForm(f => ({ ...f, achievements: [...f.achievements, achievementInput.trim()] }));
      setAchievementInput("");
    }
  }

  function removeAchievement(index: number) {
    setForm(f => ({ ...f, achievements: f.achievements.filter((_, i) => i !== index) }));
  }

  function toggleCareerField(field: string) {
    setForm(f => ({
      ...f,
      careerFields: f.careerFields.includes(field)
        ? f.careerFields.filter(cf => cf !== field)
        : [...f.careerFields, field],
    }));
  }

  const totalHours = activities.reduce((sum, a) => sum + (a.hoursPerWeek || 0), 0);
  const leadershipCount = activities.filter(a =>
    LEADERSHIP_ROLES.some(r => a.role.toLowerCase().includes(r))
  ).length;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" data-testid="loading-campus-activities">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="page-campus-activities">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-campus-activities">
            <Trophy className="h-6 w-6" /> Campus Activities
          </h1>
          <p className="text-muted-foreground" data-testid="text-subtitle">
            Track your involvement, leadership, and achievements
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-activity">
          <Plus className="h-4 w-4 mr-1" /> Add Activity
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card data-testid="stat-total-activities">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold" data-testid="text-total-activities">{activities.length}</div></CardContent>
        </Card>
        <Card data-testid="stat-total-hours">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours / Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold" data-testid="text-total-hours">{totalHours}</div></CardContent>
        </Card>
        <Card data-testid="stat-leadership-roles">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leadership Roles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold" data-testid="text-leadership-roles">{leadershipCount}</div></CardContent>
        </Card>
      </div>

      {activities.length === 0 ? (
        <Card data-testid="empty-state">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No activities yet</p>
            <p className="text-muted-foreground mb-4">Start tracking your campus involvement</p>
            <Button onClick={() => setDialogOpen(true)} data-testid="button-add-first-activity">
              <Plus className="h-4 w-4 mr-1" /> Add Your First Activity
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activities.map(activity => (
            <Card key={activity.id} data-testid={`card-activity-${activity.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                <div className="space-y-1 min-w-0">
                  <CardTitle className="text-base" data-testid={`text-name-${activity.id}`}>{activity.activityName}</CardTitle>
                  <p className="text-sm text-muted-foreground" data-testid={`text-org-${activity.id}`}>{activity.organization}</p>
                </div>
                <Badge className={CATEGORIES[activity.category]?.className} data-testid={`badge-category-${activity.id}`}>
                  {CATEGORIES[activity.category]?.label || activity.category}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1" data-testid={`text-role-${activity.id}`}>
                    <Users className="h-3.5 w-3.5" /> {activity.role}
                  </span>
                  <span className="flex items-center gap-1" data-testid={`text-dates-${activity.id}`}>
                    <Calendar className="h-3.5 w-3.5" />
                    {activity.startDate} — {activity.endDate || "Present"}
                  </span>
                  <span className="flex items-center gap-1" data-testid={`text-hours-${activity.id}`}>
                    <Clock className="h-3.5 w-3.5" /> {activity.hoursPerWeek} hrs/wk
                  </span>
                </div>

                {activity.achievements?.length > 0 && (
                  <div className="space-y-1" data-testid={`list-achievements-${activity.id}`}>
                    {activity.achievements.map((ach, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-sm">
                        <Award className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                        <span data-testid={`text-achievement-${activity.id}-${i}`}>{ach}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activity.careerFields?.length > 0 && (
                  <div className="flex flex-wrap gap-1" data-testid={`list-career-fields-${activity.id}`}>
                    {activity.careerFields.map(field => (
                      <Badge key={field} variant="outline" className="text-xs" data-testid={`badge-career-${activity.id}-${field}`}>
                        {field}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(activity)} data-testid={`button-edit-${activity.id}`}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(activity.id)} data-testid={`button-delete-${activity.id}`}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) closeDialog(); else setDialogOpen(true); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg" data-testid="dialog-add-activity">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Activity" : "Add Activity"}</DialogTitle>
            <DialogDescription>Track a campus activity, club, or involvement</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="activityName">Activity Name *</Label>
              <Input id="activityName" value={form.activityName} onChange={e => setForm(f => ({ ...f, activityName: e.target.value }))} placeholder="e.g. National Honor Society" data-testid="input-activity-name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger data-testid="select-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIES).map(([k, v]) => (
                      <SelectItem key={k} value={k} data-testid={`option-category-${k}`}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Input id="role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. President" data-testid="input-role" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">Organization *</Label>
              <Input id="organization" value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} placeholder="e.g. Lincoln High School" data-testid="input-organization" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input id="startDate" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} data-testid="input-start-date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} data-testid="input-end-date" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hoursPerWeek">Hours per Week</Label>
              <Input id="hoursPerWeek" type="number" min={0} value={form.hoursPerWeek} onChange={e => setForm(f => ({ ...f, hoursPerWeek: Number(e.target.value) }))} data-testid="input-hours-per-week" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe your involvement..." data-testid="input-description" />
            </div>
            <div className="space-y-2">
              <Label>Achievements</Label>
              <div className="flex gap-2">
                <Input value={achievementInput} onChange={e => setAchievementInput(e.target.value)} placeholder="Add an achievement" onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addAchievement(); } }} data-testid="input-achievement" />
                <Button type="button" variant="outline" onClick={addAchievement} data-testid="button-add-achievement">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {form.achievements.length > 0 && (
                <div className="space-y-1 mt-2">
                  {form.achievements.map((ach, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-sm bg-muted rounded-md px-2 py-1">
                      <span data-testid={`text-form-achievement-${i}`}>{ach}</span>
                      <Button size="icon" variant="ghost" onClick={() => removeAchievement(i)} data-testid={`button-remove-achievement-${i}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Career Fields</Label>
              <div className="flex flex-wrap gap-2">
                {CAREER_FIELDS.map(field => (
                  <Badge
                    key={field}
                    variant={form.careerFields.includes(field) ? "default" : "outline"}
                    className="cursor-pointer toggle-elevate"
                    onClick={() => toggleCareerField(field)}
                    data-testid={`badge-select-career-${field}`}
                  >
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="isActive" checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} data-testid="switch-is-active" />
              <Label htmlFor="isActive">Currently Active</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog} data-testid="button-cancel">Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
              {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : editingId ? "Update" : "Add Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
