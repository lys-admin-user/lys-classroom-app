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
import { Plus, ArrowLeft, Calendar, BookOpen, Target, Trash2, Edit, ChevronRight, Save, Clock, GraduationCap, CheckCircle, FileText, BookMarked } from "lucide-react";
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
                {units.map((unit) => (
                  <Card key={unit.id} className="border-l-4 border-l-lys-teal" data-testid={`card-unit-${unit.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="font-mono">
                              Unit {unit.unitNumber}
                            </Badge>
                            <Badge variant="secondary">
                              {unit.nineWeeksPeriod === 1 ? "1st" : unit.nineWeeksPeriod === 2 ? "2nd" : unit.nineWeeksPeriod === 3 ? "3rd" : "4th"} Nine Weeks
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Weeks {unit.startWeek}-{unit.endWeek}
                            </span>
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
                ))}
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
