import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Plus, Calendar, BookOpen, Target, Trash2, Edit, ChevronRight, FileText, Upload, GraduationCap, LayoutList, Clock, CheckCircle, ArrowRight, FileUp, Sparkles, Building2, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link } from "wouter";
import type { ScopeSequence, SequenceUnit, ScopeChangeRequest } from "@shared/schema";
import { educationalStandards } from "@shared/standards";
import { useTier } from "@/hooks/use-tier";

const createScopeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subject: z.string().min(1, "Subject is required"),
  gradeLevel: z.string().min(1, "Grade level is required"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  standardsName: z.string().min(1, "Standards name is required"),
  schoolYear: z.string().min(1, "School year is required"),
  totalWeeks: z.coerce.number().min(1).max(52).default(36),
});

type CreateScopeFormData = z.infer<typeof createScopeSchema>;

// ---------------------------------------------------------------------------
// MyPlansPanel — structured scope & sequence plans (create, import, open,
// delete). Self-contained so it can be embedded inside the Curriculum
// Planning hub as well as the standalone Scope & Sequence page (embeds).
// ---------------------------------------------------------------------------
export function MyPlansPanel() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [wizardStep, setWizardStep] = useState(1);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: scopes = [], isLoading } = useQuery<ScopeSequence[]>({
    queryKey: ["/api/scopes"],
    enabled: isAuthenticated,
  });

  const form = useForm<CreateScopeFormData>({
    resolver: zodResolver(createScopeSchema),
    defaultValues: {
      title: "",
      subject: "",
      gradeLevel: "",
      country: "United States",
      state: "",
      standardsName: "",
      schoolYear: "2024-2025",
      totalWeeks: 36,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateScopeFormData) => {
      const response = await apiRequest("POST", "/api/scopes", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scopes"] });
      toast({
        title: "Scope Created",
        description: "Your scope and sequence has been created. Now add your units.",
      });
      setCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create scope and sequence. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/scopes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scopes"] });
      toast({
        title: "Scope Deleted",
        description: "The scope and sequence has been removed.",
      });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete scope. Please try again.",
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      setImportProgress(10);

      const formData = new FormData();
      formData.append("file", file);

      const params = new URLSearchParams();
      params.set("country", selectedCountry || "United States");
      params.set("state", selectedState || "Texas");

      setImportProgress(30);

      const response = await fetch(`/api/scopes/import?${params.toString()}`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      setImportProgress(70);
      if (!response.ok) {
        throw new Error("Import failed");
      }

      setImportProgress(100);
      return await response.json();
    },
    onSuccess: (data: { message?: string; unitsCreated?: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/scopes"] });
      toast({
        title: "Import Complete",
        description: data.message || "Your document has been processed.",
      });
      setImportDialogOpen(false);
      setUploadFile(null);
      setImportProgress(0);
    },
    onError: () => {
      toast({
        title: "Import Failed",
        description: "We couldn't process that file. Try a different format or build from scratch.",
        variant: "destructive",
      });
      setImportProgress(0);
    },
  });

  const onSubmit = (data: CreateScopeFormData) => {
    createMutation.mutate(data);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleImport = () => {
    if (uploadFile) {
      importMutation.mutate(uploadFile);
    }
  };

  const resetWizard = () => {
    setWizardStep(1);
    setSelectedCountry("");
    setSelectedState("");
    form.reset();
  };

  const countries = educationalStandards.map((c) => c.country);
  const states = selectedCountry
    ? educationalStandards.find((c) => c.country === selectedCountry)?.states || []
    : [];
  const subjects = selectedState
    ? states.find((s) => s.state === selectedState)?.subjects.map((sub) => sub.subject) || []
    : [];
  const standardsName = selectedState
    ? states.find((s) => s.state === selectedState)?.standardsName || ""
    : "";

  const gradeLevels = ["6", "7", "8", "9", "10", "11", "12"];

  return (
    <div className="space-y-6" data-testid="panel-my-plans">
      <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="ghost" asChild data-testid="button-skip-to-lessons">
          <Link href="/lesson-generator">
            <Sparkles className="h-4 w-4 mr-2" />
            Skip to Lessons
          </Link>
        </Button>
        <Button variant="outline" onClick={() => setImportDialogOpen(true)} data-testid="button-import-scope">
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
        <Dialog open={createDialogOpen} onOpenChange={(open) => { setCreateDialogOpen(open); if (!open) resetWizard(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-scope">
              <Plus className="h-4 w-4 mr-2" />
              Build New
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-oswald text-xl">Create Scope & Sequence</DialogTitle>
              <DialogDescription>
                Set up the foundation for your year-long curriculum plan.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 7th Grade Texas History 2024-25" {...field} data-testid="input-scope-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select
                          onValueChange={(val) => {
                            field.onChange(val);
                            setSelectedCountry(val);
                            setSelectedState("");
                            form.setValue("state", "");
                            form.setValue("standardsName", "");
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-country">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <Select
                          onValueChange={(val) => {
                            field.onChange(val);
                            setSelectedState(val);
                            const stateData = states.find((s) => s.state === val);
                            if (stateData) {
                              form.setValue("standardsName", stateData.standardsName);
                            }
                          }}
                          value={field.value}
                          disabled={!selectedCountry}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-state">
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {states.map((s) => (
                              <SelectItem key={s.state} value={s.state}>{s.state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedState}>
                          <FormControl>
                            <SelectTrigger data-testid="select-subject">
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjects.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gradeLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-grade">
                              <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {gradeLevels.map((g) => (
                              <SelectItem key={g} value={g}>Grade {g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="standardsName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Standards Framework</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className="bg-muted" data-testid="input-standards-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="schoolYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School Year</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2024-2025" {...field} data-testid="input-school-year" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalWeeks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Weeks</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={52} {...field} data-testid="input-total-weeks" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-scope">
                    {createMutation.isPending ? "Creating..." : "Create Scope"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : scopes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutList className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="font-oswald text-xl mb-2">No Scope & Sequence Yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Start by creating a new scope and sequence to plan your curriculum for the year.
              You can also skip this and go straight to creating individual lessons.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-scope">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Scope
              </Button>
              <Button variant="outline" asChild>
                <Link href="/lesson-generator">
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Skip to Lesson Generator
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {scopes.map((scope) => (
            <Card key={scope.id} className="hover-elevate" data-testid={`card-scope-${scope.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="secondary" className="font-roboto">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      Grade {scope.gradeLevel}
                    </Badge>
                    <Badge variant="outline" className="font-roboto">
                      {scope.subject}
                    </Badge>
                    <Badge
                      variant={scope.status === "published" ? "default" : "outline"}
                      className={scope.status === "published" ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}
                    >
                      {scope.status}
                    </Badge>
                  </div>
                  <CardTitle className="font-oswald text-xl">{scope.title}</CardTitle>
                  <CardDescription className="font-roboto mt-1">
                    {scope.standardsName} | {scope.schoolYear} | {scope.totalWeeks} weeks
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/scope/${scope.id}`} data-testid={`button-edit-scope-${scope.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(scope.id)}
                    data-testid={`button-delete-scope-${scope.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 border-t pt-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {scope.state}, {scope.country}
                  </span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/scope/${scope.id}`}>
                    View & Edit Units
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scope & Sequence?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this scope and sequence along with all its units.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-oswald text-xl">Import Scope & Sequence</DialogTitle>
            <DialogDescription>
              Upload an existing scope and sequence document (PDF, DOCX, or TXT).
              We'll extract the units and standards for you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Country</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger data-testid="import-select-country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>State</Label>
                <Select value={selectedState} onValueChange={setSelectedState} disabled={!selectedCountry}>
                  <SelectTrigger data-testid="import-select-state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((s) => (
                      <SelectItem key={s.state} value={s.state}>{s.state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div
              className="border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover-elevate"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileSelect}
                data-testid="input-import-file"
              />
              {uploadFile ? (
                <div className="space-y-2">
                  <FileUp className="h-8 w-8 mx-auto text-lys-teal" />
                  <p className="font-medium">{uploadFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOCX, or TXT (max 10MB)
                  </p>
                </div>
              )}
            </div>

            {importMutation.isPending && (
              <div className="space-y-2">
                <Progress value={importProgress} />
                <p className="text-sm text-center text-muted-foreground">
                  Processing document...
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setImportDialogOpen(false); setUploadFile(null); }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!uploadFile || !selectedCountry || !selectedState || importMutation.isPending}
              data-testid="button-start-import"
            >
              {importMutation.isPending ? "Importing..." : "Import Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CampusAdminPanel — campus-wide scope assignments + teacher change-request
// review queue. Gated internally for non campus/enterprise tiers.
// ---------------------------------------------------------------------------
export function CampusAdminPanel() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { tier } = useTier();
  const isCampusAdmin = tier === "campus" || tier === "enterprise";

  const { data: scopes = [] } = useQuery<ScopeSequence[]>({
    queryKey: ["/api/scopes"],
    enabled: isAuthenticated,
  });

  const { data: pendingRequests = [] } = useQuery<ScopeChangeRequest[]>({
    queryKey: ["/api/admin/change-requests"],
    enabled: isAuthenticated && isCampusAdmin,
  });

  const reviewRequestMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: "approved" | "rejected"; adminNotes?: string }) => {
      const response = await apiRequest("PATCH", `/api/requests/${id}`, { status, adminNotes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/change-requests"] });
      toast({
        title: "Request Updated",
        description: "The change request has been reviewed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update request. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <Card data-testid="panel-campus-admin">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-lys-teal" />
          <CardTitle className="font-oswald">Campus Administration</CardTitle>
        </div>
        <CardDescription>
          Manage campus-wide scope assignments and review teacher change requests
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isCampusAdmin ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Building2 className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground text-sm">
                Campus administration features are available for campus and enterprise tier users.
                Contact your administrator to upgrade your account.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div>
              <h3 className="font-oswald text-lg mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Default Scope Assignments
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Set default scopes that all teachers in your campus will use as their starting point.
              </p>
              <div className="grid gap-4">
                {scopes.filter(s => s.status === "published").length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center">
                      <LayoutList className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground text-sm">
                        Create and publish a scope & sequence first to assign it as a campus default.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  scopes.filter(s => s.status === "published").map((scope) => (
                    <Card key={scope.id} className="hover-elevate">
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-oswald">{scope.title}</p>
                          <p className="text-sm text-muted-foreground font-roboto">
                            {scope.subject} - Grade {scope.gradeLevel}
                          </p>
                        </div>
                        <Badge variant="secondary">Published</Badge>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="font-oswald text-lg mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Pending Change Requests
                {pendingRequests.length > 0 && (
                  <Badge variant="destructive" className="ml-2">{pendingRequests.length}</Badge>
                )}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Review and approve teacher requests to modify campus-assigned scopes.
              </p>
              {pendingRequests.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <CheckCircle className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground text-sm">
                      No pending change requests. Teachers can submit requests when they want to
                      customize the campus-assigned scope for their classroom.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <Badge variant="outline" className="mb-2 capitalize">{request.changeType.replace("_", " ")}</Badge>
                            <p className="font-oswald text-sm">Scope ID: {request.scopeId}</p>
                            {request.reason && (
                              <p className="text-sm text-muted-foreground font-roboto mt-1">
                                Reason: {request.reason}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => reviewRequestMutation.mutate({ id: request.id, status: "rejected" })}
                              disabled={reviewRequestMutation.isPending}
                              data-testid={`button-reject-request-${request.id}`}
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              className="bg-lys-teal hover:bg-lys-teal/90 text-white"
                              onClick={() => reviewRequestMutation.mutate({ id: request.id, status: "approved" })}
                              disabled={reviewRequestMutation.isPending}
                              data-testid={`button-approve-request-${request.id}`}
                            >
                              Approve
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Standalone Scope & Sequence page — preserved for embeds
// (/embed/scope-sequence). The primary in-app entry point is the merged
// Curriculum Planning hub, which composes MyPlansPanel + CampusAdminPanel.
// ---------------------------------------------------------------------------
export default function ScopeSequencePage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <LayoutList className="h-12 w-12 mx-auto text-lys-red mb-4" />
            <CardTitle className="font-permanent-marker text-2xl text-lys-red">
              Scope & Sequence
            </CardTitle>
            <CardDescription className="font-roboto">
              Plan your entire year's curriculum. Sign in to create and manage your scope and sequence.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild>
              <a href="/api/login">Sign In to Continue</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="font-permanent-marker text-3xl text-lys-red mb-2" data-testid="text-scope-title">
            Scope & Sequence
          </h1>
          <p className="font-roboto text-muted-foreground">
            Plan your year's curriculum by organizing units, standards, and pacing
          </p>
        </div>

        <Tabs defaultValue="my-scopes" className="w-full">
          <TabsList>
            <TabsTrigger value="my-scopes" data-testid="tab-my-scopes">
              <LayoutList className="h-4 w-4 mr-2" />
              My Scopes
            </TabsTrigger>
            <TabsTrigger value="admin" data-testid="tab-admin">
              <Building2 className="h-4 w-4 mr-2" />
              Campus Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-scopes" className="mt-4">
            <MyPlansPanel />
          </TabsContent>

          <TabsContent value="admin" className="mt-4">
            <CampusAdminPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
