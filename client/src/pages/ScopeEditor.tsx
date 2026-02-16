import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Plus, ArrowLeft, Calendar, BookOpen, Target, Trash2, Edit, ChevronRight, Save, Clock, GraduationCap, CheckCircle, FileText, BookMarked, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import type { ScopeSequence, SequenceUnit } from "@shared/schema";
import { educationalStandards } from "@shared/standards";

const createUnitSchema = z.object({
  unitNumber: z.coerce.number().min(1),
  title: z.string().min(1, "Title is required"),
  summary: z.string().optional(),
  transferGoal: z.string().optional(),
  startWeek: z.coerce.number().min(1),
  endWeek: z.coerce.number().min(1),
  nineWeeksPeriod: z.coerce.number().min(1).max(4),
  studentsWillKnow: z.array(z.string()).optional().default([]),
  studentsWillBeSkilled: z.array(z.string()).optional().default([]),
  standardCodes: z.array(z.object({
    code: z.string(),
    description: z.string(),
  })).optional().default([]),
});

type CreateUnitFormData = z.infer<typeof createUnitSchema>;

interface ScopeWithUnits {
  scope: ScopeSequence;
  units: SequenceUnit[];
}

export default function ScopeEditor() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<SequenceUnit | null>(null);
  const [deleteUnitId, setDeleteUnitId] = useState<string | null>(null);
  const [knowledgeInput, setKnowledgeInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [selectedStandards, setSelectedStandards] = useState<{ code: string; description: string }[]>([]);

  const { data, isLoading, error } = useQuery<ScopeWithUnits>({
    queryKey: ["/api/scopes", id],
    enabled: isAuthenticated && !!id,
  });

  const form = useForm<CreateUnitFormData>({
    resolver: zodResolver(createUnitSchema),
    defaultValues: {
      unitNumber: (data?.units?.length || 0) + 1,
      title: "",
      summary: "",
      transferGoal: "",
      startWeek: 1,
      endWeek: 3,
      nineWeeksPeriod: 1,
      studentsWillKnow: [],
      studentsWillBeSkilled: [],
      standardCodes: [],
    },
  });

  const createUnitMutation = useMutation({
    mutationFn: async (unitData: CreateUnitFormData) => {
      const response = await apiRequest("POST", `/api/scopes/${id}/units`, {
        ...unitData,
        studentsWillKnow: form.getValues("studentsWillKnow"),
        studentsWillBeSkilled: form.getValues("studentsWillBeSkilled"),
        standardCodes: selectedStandards,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scopes", id] });
      toast({
        title: "Unit Created",
        description: "The unit has been added to your scope and sequence.",
      });
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create unit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateUnitMutation = useMutation({
    mutationFn: async ({ unitId, updates }: { unitId: string; updates: Partial<SequenceUnit> }) => {
      const response = await apiRequest("PATCH", `/api/units/${unitId}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scopes", id] });
      toast({
        title: "Unit Updated",
        description: "Your changes have been saved.",
      });
      setEditingUnit(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update unit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: async (unitId: string) => {
      return await apiRequest("DELETE", `/api/units/${unitId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scopes", id] });
      toast({
        title: "Unit Deleted",
        description: "The unit has been removed.",
      });
      setDeleteUnitId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete unit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/scopes/${id}`, { status: "published" });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scopes", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/scopes"] });
      toast({
        title: "Published!",
        description: "Your scope and sequence is now ready to use.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to publish. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    form.reset({
      unitNumber: (data?.units?.length || 0) + 2,
      title: "",
      summary: "",
      transferGoal: "",
      startWeek: 1,
      endWeek: 3,
      nineWeeksPeriod: 1,
      studentsWillKnow: [],
      studentsWillBeSkilled: [],
      standardCodes: [],
    });
    setKnowledgeInput("");
    setSkillInput("");
    setSelectedStandards([]);
  };

  const addKnowledge = () => {
    if (knowledgeInput.trim()) {
      const current = form.getValues("studentsWillKnow") || [];
      form.setValue("studentsWillKnow", [...current, knowledgeInput.trim()]);
      setKnowledgeInput("");
    }
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      const current = form.getValues("studentsWillBeSkilled") || [];
      form.setValue("studentsWillBeSkilled", [...current, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeKnowledge = (index: number) => {
    const current = form.getValues("studentsWillKnow") || [];
    form.setValue("studentsWillKnow", current.filter((_, i) => i !== index));
  };

  const removeSkill = (index: number) => {
    const current = form.getValues("studentsWillBeSkilled") || [];
    form.setValue("studentsWillBeSkilled", current.filter((_, i) => i !== index));
  };

  const toggleStandard = (code: string, description: string) => {
    const existing = selectedStandards.find(s => s.code === code);
    if (existing) {
      setSelectedStandards(selectedStandards.filter(s => s.code !== code));
    } else {
      setSelectedStandards([...selectedStandards, { code, description }]);
    }
  };

  const onSubmit = (formData: CreateUnitFormData) => {
    createUnitMutation.mutate(formData);
  };

  const availableStandards = data?.scope
    ? educationalStandards
        .find(c => c.country === data.scope.country)
        ?.states.find(s => s.state === data.scope.state)
        ?.subjects.find(sub => sub.subject === data.scope.subject)
        ?.standards || []
    : [];

  const syncStandardsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/scopes/${id}/sync-standards`);
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Standards synced to your profile",
        description: `${data.count || 0} standard codes saved to your profile settings.`,
      });
    },
    onError: () => {
      toast({ title: "Failed to sync standards", variant: "destructive" });
    },
  });

  const getSchoolYearDates = (schoolYear: string) => {
    const parts = schoolYear.split("-");
    const startYear = parseInt(parts[0]);
    if (isNaN(startYear)) return null;
    const start = new Date(startYear, 7, 12);
    const end = new Date(startYear + 1, 4, 23);
    return { start, end };
  };

  const getCurrentWeek = (scope: ScopeSequence): number | null => {
    const dates = getSchoolYearDates(scope.schoolYear);
    if (!dates) return null;
    const now = new Date();
    if (now < dates.start) return 0;
    if (now > dates.end) return (scope.totalWeeks || 36) + 1;
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeksSinceStart = Math.ceil((now.getTime() - dates.start.getTime()) / msPerWeek);
    return Math.min(weeksSinceStart, scope.totalWeeks || 36);
  };

  type UnitPacingStatus = "completed" | "current" | "upcoming";

  const getUnitStatus = (unit: SequenceUnit, currentWeek: number | null): UnitPacingStatus => {
    if (currentWeek === null || currentWeek === 0) return "upcoming";
    if (currentWeek >= unit.startWeek && currentWeek <= unit.endWeek) return "current";
    if (currentWeek > unit.endWeek) return "completed";
    return "upcoming";
  };

  const currentWeek = data?.scope ? getCurrentWeek(data.scope) : null;
  const totalWeeks = data?.scope?.totalWeeks || 36;
  const progressPercent = currentWeek !== null ? Math.min(100, Math.max(0, (currentWeek / totalWeeks) * 100)) : 0;

  const currentUnit = data?.units?.find(u => {
    const status = getUnitStatus(u, currentWeek);
    return status === "current";
  });

  const completedUnits = data?.units?.filter(u => getUnitStatus(u, currentWeek) === "completed").length || 0;
  const totalUnits = data?.units?.length || 0;

  const getOverallStatus = (): { label: string; color: string; icon: typeof CheckCircle } => {
    if (currentWeek === null || !data?.units?.length) return { label: "Not Started", color: "text-muted-foreground", icon: Clock };
    if (currentWeek === 0) return { label: "School Year Hasn't Started", color: "text-muted-foreground", icon: Clock };
    if (currentWeek > totalWeeks) return { label: "School Year Complete", color: "text-green-600", icon: CheckCircle };
    if (currentUnit) return { label: "On Track", color: "text-green-600", icon: CheckCircle };
    const upcomingUnits = data.units.filter(u => getUnitStatus(u, currentWeek) === "upcoming");
    if (upcomingUnits.length > 0 && completedUnits === totalUnits - upcomingUnits.length) {
      return { label: "On Track", color: "text-green-600", icon: CheckCircle };
    }
    return { label: "Review Pacing", color: "text-yellow-600", icon: AlertTriangle };
  };

  const overallStatus = getOverallStatus();
  const OverallIcon = overallStatus.icon;

  const allScopeStandards = data?.units?.flatMap(u => (u.standardCodes as { code: string; description: string }[]) || [])
    .filter((std, i, arr) => arr.findIndex(s => s.code === std.code) === i) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Scope and sequence not found.</p>
            <Button asChild>
              <Link href="/scope-sequence">Back to List</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { scope, units } = data;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/scope-sequence">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="font-permanent-marker text-2xl text-lys-red" data-testid="text-scope-editor-title">
              {scope.title}
            </h1>
            <p className="text-sm text-muted-foreground font-roboto">
              {scope.subject} | Grade {scope.gradeLevel} | {scope.standardsName}
            </p>
          </div>
          <Badge variant={scope.status === "published" ? "default" : "secondary"}>
            {scope.status}
          </Badge>
          {scope.status === "draft" && (
            <Button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending} data-testid="button-publish">
              <CheckCircle className="h-4 w-4 mr-2" />
              Publish
            </Button>
          )}
        </div>

        {units.length > 0 && currentWeek !== null && (
          <Card data-testid="card-pacing-tracker">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <CardTitle className="font-oswald flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-lys-teal" />
                  Pacing Tracker
                </CardTitle>
                <div className="flex items-center gap-2">
                  <OverallIcon className={`h-4 w-4 ${overallStatus.color}`} />
                  <span className={`text-sm font-medium ${overallStatus.color}`} data-testid="text-pacing-status">
                    {overallStatus.label}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Week {Math.min(currentWeek, totalWeeks)} of {totalWeeks}
                  </span>
                  <span className="font-medium">{Math.round(progressPercent)}% of school year</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-md border p-3 text-center">
                  <p className="text-2xl font-bold" data-testid="text-current-week">{Math.min(currentWeek, totalWeeks)}</p>
                  <p className="text-xs text-muted-foreground">Current Week</p>
                </div>
                <div className="rounded-md border p-3 text-center">
                  <p className="text-2xl font-bold text-green-600" data-testid="text-completed-units">{completedUnits}</p>
                  <p className="text-xs text-muted-foreground">Units Done</p>
                </div>
                <div className="rounded-md border p-3 text-center">
                  <p className="text-2xl font-bold text-lys-teal" data-testid="text-current-unit">
                    {currentUnit ? currentUnit.unitNumber : "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">Current Unit</p>
                </div>
                <div className="rounded-md border p-3 text-center">
                  <p className="text-2xl font-bold" data-testid="text-remaining-units">{totalUnits - completedUnits}</p>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                </div>
              </div>

              {currentUnit && (
                <div className="rounded-md bg-lys-teal/10 p-3 flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-lys-teal shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Now Teaching: Unit {currentUnit.unitNumber} - {currentUnit.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Weeks {currentUnit.startWeek}-{currentUnit.endWeek} ({currentUnit.endWeek - currentUnit.startWeek + 1} weeks)
                    </p>
                  </div>
                </div>
              )}

              {allScopeStandards.length > 0 && (
                <div className="flex items-center justify-between gap-4 pt-2 border-t flex-wrap">
                  <div className="text-sm text-muted-foreground">
                    {allScopeStandards.length} standard{allScopeStandards.length !== 1 ? "s" : ""} across all units
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncStandardsMutation.mutate()}
                    disabled={syncStandardsMutation.isPending}
                    data-testid="button-sync-standards"
                  >
                    {syncStandardsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <GraduationCap className="h-4 w-4 mr-2" />
                    )}
                    Sync Standards to Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="font-oswald">Units ({units.length})</CardTitle>
                <CardDescription>
                  {scope.totalWeeks} weeks total across 4 nine-week periods
                </CardDescription>
              </div>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-unit">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Unit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-oswald text-xl">Add New Unit</DialogTitle>
                    <DialogDescription>
                      Define what students will learn in this unit.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="unitNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit #</FormLabel>
                              <FormControl>
                                <Input type="number" min={1} {...field} data-testid="input-unit-number" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="nineWeeksPeriod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nine Weeks</FormLabel>
                              <Select onValueChange={field.onChange} value={String(field.value)}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-nine-weeks">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1">1st Nine Weeks</SelectItem>
                                  <SelectItem value="2">2nd Nine Weeks</SelectItem>
                                  <SelectItem value="3">3rd Nine Weeks</SelectItem>
                                  <SelectItem value="4">4th Nine Weeks</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name="startWeek"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start</FormLabel>
                                <FormControl>
                                  <Input type="number" min={1} max={52} {...field} data-testid="input-start-week" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="endWeek"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End</FormLabel>
                                <FormControl>
                                  <Input type="number" min={1} max={52} {...field} data-testid="input-end-week" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Natural Texas and Its People" {...field} data-testid="input-unit-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="summary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Summary</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Brief description of what this unit covers..."
                                className="min-h-[80px]"
                                {...field}
                                data-testid="input-unit-summary"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="transferGoal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Transfer Goal</FormLabel>
                            <FormDescription>
                              What should students be able to do independently after this unit?
                            </FormDescription>
                            <FormControl>
                              <Textarea
                                placeholder="e.g., Investigate places and regions and the connections among them."
                                className="min-h-[60px]"
                                {...field}
                                data-testid="input-transfer-goal"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <div>
                        <FormLabel>Students Will Know...</FormLabel>
                        <div className="flex gap-2 mt-2">
                          <Input
                            value={knowledgeInput}
                            onChange={(e) => setKnowledgeInput(e.target.value)}
                            placeholder="Add a knowledge item..."
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKnowledge())}
                            data-testid="input-knowledge"
                          />
                          <Button type="button" variant="outline" onClick={addKnowledge}>
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {form.watch("studentsWillKnow")?.map((item, i) => (
                            <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeKnowledge(i)}>
                              {item} x
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <FormLabel>Students Will Be Skilled At...</FormLabel>
                        <div className="flex gap-2 mt-2">
                          <Input
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            placeholder="Add a skill..."
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                            data-testid="input-skill"
                          />
                          <Button type="button" variant="outline" onClick={addSkill}>
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {form.watch("studentsWillBeSkilled")?.map((item, i) => (
                            <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(i)}>
                              {item} x
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <FormLabel>Standards ({scope.standardsName})</FormLabel>
                        <FormDescription>Select the standards covered in this unit</FormDescription>
                        <ScrollArea className="h-48 border rounded-md p-3 mt-2">
                          <div className="space-y-2">
                            {availableStandards.map((std) => (
                              <div
                                key={std.code}
                                className="flex items-start gap-2 p-2 rounded hover-elevate cursor-pointer"
                                onClick={() => toggleStandard(std.code, std.description)}
                              >
                                <Checkbox
                                  checked={selectedStandards.some(s => s.code === std.code)}
                                  className="mt-0.5"
                                />
                                <div className="flex-1">
                                  <span className="font-medium text-sm">{std.code}</span>
                                  <p className="text-xs text-muted-foreground">{std.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedStandards.map((std) => (
                            <Badge key={std.code} variant="outline" className="text-xs">
                              {std.code}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => { setCreateDialogOpen(false); resetForm(); }}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createUnitMutation.isPending} data-testid="button-submit-unit">
                          {createUnitMutation.isPending ? "Adding..." : "Add Unit"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {units.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookMarked className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No units yet. Add your first unit to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {units.map((unit) => {
                  const unitStatus = getUnitStatus(unit, currentWeek);
                  const accentColor = unitStatus === "current" ? "bg-lys-yellow" : unitStatus === "completed" ? "bg-green-500" : "bg-lys-teal";
                  return (
                  <Card key={unit.id} className="overflow-hidden" data-testid={`card-unit-${unit.id}`}>
                    <div className={`${accentColor} h-1 w-full`} />
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline" className="font-mono">
                              Unit {unit.unitNumber}
                            </Badge>
                            <Badge variant="secondary">
                              {unit.nineWeeksPeriod === 1 ? "1st" : unit.nineWeeksPeriod === 2 ? "2nd" : unit.nineWeeksPeriod === 3 ? "3rd" : "4th"} Nine Weeks
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Weeks {unit.startWeek}-{unit.endWeek}
                            </span>
                            {currentWeek !== null && (
                              <Badge
                                variant={unitStatus === "current" ? "default" : "outline"}
                                className={
                                  unitStatus === "current" ? "bg-lys-yellow text-black" :
                                  unitStatus === "completed" ? "text-green-600 border-green-500/30" :
                                  ""
                                }
                                data-testid={`badge-unit-status-${unit.id}`}
                              >
                                {unitStatus === "current" ? "Current" :
                                 unitStatus === "completed" ? "Done" :
                                 "Upcoming"}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="font-oswald text-lg">{unit.title}</CardTitle>
                          {unit.summary && (
                            <CardDescription className="mt-1">{unit.summary}</CardDescription>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteUnitId(unit.id)}
                            data-testid={`button-delete-unit-${unit.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      {unit.transferGoal && (
                        <div className="mb-3">
                          <span className="text-xs font-medium text-muted-foreground">Transfer Goal:</span>
                          <p className="text-sm">{unit.transferGoal}</p>
                        </div>
                      )}
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        {unit.studentsWillKnow && (unit.studentsWillKnow as string[]).length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Students Will Know:</span>
                            <ul className="list-disc list-inside mt-1 space-y-0.5">
                              {(unit.studentsWillKnow as string[]).map((item, i) => (
                                <li key={i} className="text-xs">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {unit.studentsWillBeSkilled && (unit.studentsWillBeSkilled as string[]).length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Students Will Be Skilled At:</span>
                            <ul className="list-disc list-inside mt-1 space-y-0.5">
                              {(unit.studentsWillBeSkilled as string[]).map((item, i) => (
                                <li key={i} className="text-xs">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      {unit.standardCodes && (unit.standardCodes as { code: string }[]).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {(unit.standardCodes as { code: string }[]).map((std) => (
                            <Badge key={std.code} variant="outline" className="text-xs font-mono">
                              {std.code}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={!!deleteUnitId} onOpenChange={() => setDeleteUnitId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Unit?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove this unit from your scope and sequence.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteUnitId && deleteUnitMutation.mutate(deleteUnitId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete-unit"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
