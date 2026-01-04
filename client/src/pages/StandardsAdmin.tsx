import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RefreshCw, Database, FileText, CheckCircle, XCircle, Clock, ChevronRight, AlertCircle, ClipboardCheck, Sparkles, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StandardsJurisdiction, StandardSet, EducationalStandard, SyncLog, StandardsStaging } from "@shared/schema";

const extractFormSchema = z.object({
  jurisdictionName: z.string().min(1, "Please select a jurisdiction"),
  rawText: z.string().min(10, "Please paste some text to extract standards from"),
});

interface SyncStatus {
  lastSync: string | null;
  totalJurisdictions: number;
  totalStandardSets: number;
  totalStandards: number;
  recentLogs: Array<{
    id: string;
    source: string;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
    newRecords: number | null;
    updatedRecords: number | null;
    errorCount: number | null;
  }>;
}

interface ImportProgress {
  status: "idle" | "syncing_jurisdictions" | "syncing_standard_sets" | "syncing_standards" | "completed" | "failed";
  currentJurisdiction?: string;
  currentStandardSet?: string;
  jurisdictionsTotal: number;
  jurisdictionsProcessed: number;
  standardSetsTotal: number;
  standardSetsProcessed: number;
  standardsTotal: number;
  standardsProcessed: number;
  errors: string[];
  startedAt?: string;
  completedAt?: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  return date.toLocaleString();
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle }> = {
    completed: { variant: "default", icon: CheckCircle },
    started: { variant: "secondary", icon: Clock },
    in_progress: { variant: "secondary", icon: RefreshCw },
    failed: { variant: "destructive", icon: XCircle },
  };
  
  const { variant, icon: Icon } = variants[status] || { variant: "outline" as const, icon: AlertCircle };
  
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  );
}

export default function StandardsAdmin() {
  const { toast } = useToast();
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string | null>(null);
  const [selectedSet, setSelectedSet] = useState<string | null>(null);

  const { data: status, isLoading: statusLoading } = useQuery<SyncStatus>({
    queryKey: ["/api/admin/standards/status"],
  });

  const { data: jurisdictions, isLoading: jurisdictionsLoading } = useQuery<StandardsJurisdiction[]>({
    queryKey: ["/api/admin/standards/jurisdictions"],
  });

  const { data: standardSets } = useQuery<StandardSet[]>({
    queryKey: ["/api/admin/standards/jurisdictions", selectedJurisdiction, "sets"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/standards/jurisdictions/${selectedJurisdiction}/sets`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch standard sets");
      return res.json();
    },
    enabled: !!selectedJurisdiction,
  });

  const { data: standards } = useQuery<EducationalStandard[]>({
    queryKey: ["/api/admin/standards/sets", selectedSet, "standards"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/standards/sets/${selectedSet}/standards`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch standards");
      return res.json();
    },
    enabled: !!selectedSet,
  });

  const { data: syncLogs } = useQuery<SyncLog[]>({
    queryKey: ["/api/admin/standards/sync-logs"],
  });

  const { data: stagingStandards } = useQuery<StandardsStaging[]>({
    queryKey: ["/api/admin/standards/staging"],
  });

  const [selectedStaging, setSelectedStaging] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const { data: importProgress, refetch: refetchProgress } = useQuery<ImportProgress>({
    queryKey: ["/api/admin/standards/import-progress"],
    refetchInterval: isImporting ? 2000 : false,
  });

  useEffect(() => {
    if (importProgress) {
      if (importProgress.status === "completed" || importProgress.status === "failed") {
        setIsImporting(false);
        queryClient.invalidateQueries({ queryKey: ["/api/admin/standards/status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/standards/jurisdictions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/standards/sync-logs"] });
        if (importProgress.status === "completed") {
          toast({
            title: "Full Import Complete",
            description: `Imported ${importProgress.jurisdictionsProcessed} jurisdictions, ${importProgress.standardSetsProcessed} standard sets, and ${importProgress.standardsProcessed} standards`,
          });
        } else if (importProgress.status === "failed") {
          toast({
            title: "Import Failed",
            description: importProgress.errors[0] || "Unknown error occurred",
            variant: "destructive",
          });
        }
      } else if (importProgress.status !== "idle" && !isImporting) {
        setIsImporting(true);
      }
    }
  }, [importProgress, isImporting, toast]);

  const fullImportMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/standards/sync/full-import"),
    onSuccess: () => {
      setIsImporting(true);
      refetchProgress();
      toast({
        title: "Full Import Started",
        description: "Importing all standards from all jurisdictions. This may take several minutes.",
      });
    },
    onError: () => {
      toast({
        title: "Import Failed",
        description: "Failed to start full import",
        variant: "destructive",
      });
    },
  });

  const extractForm = useForm<z.infer<typeof extractFormSchema>>({
    resolver: zodResolver(extractFormSchema),
    defaultValues: {
      jurisdictionName: "",
      rawText: "",
    },
  });

  const syncJurisdictionsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/standards/sync/jurisdictions"),
    onSuccess: (data: any) => {
      toast({
        title: "Sync Complete",
        description: `Added ${data.newCount} new, updated ${data.updatedCount} jurisdictions`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/standards/jurisdictions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/standards/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/standards/sync-logs"] });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync jurisdictions from CSP",
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/standards/staging/${id}/approve`),
    onSuccess: () => {
      toast({ title: "Standard Approved", description: "Standard has been moved to active standards" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/standards/staging"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/standards/status"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      apiRequest("POST", `/api/admin/standards/staging/${id}/reject`, { reason }),
    onSuccess: () => {
      toast({ title: "Standard Rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/standards/staging"] });
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: (ids: string[]) => apiRequest("POST", "/api/admin/standards/staging/bulk-approve", { ids }),
    onSuccess: (data: any) => {
      toast({ title: "Bulk Approval Complete", description: `${data.approved} standards approved` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/standards/staging"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/standards/status"] });
      setSelectedStaging([]);
    },
  });

  const extractMutation = useMutation({
    mutationFn: ({ rawText, jurisdictionName }: { rawText: string; jurisdictionName: string }) =>
      apiRequest("POST", "/api/admin/standards/extract", { rawText, jurisdictionName }),
    onSuccess: (data: any) => {
      toast({
        title: "Extraction Complete",
        description: `${data.extractedCount} standards extracted. ${data.validationMessage}`,
      });
    },
  });

  const pendingCount = stagingStandards?.filter(s => s.status === "pending").length || 0;

  return (
    <div className="container py-8 max-w-6xl">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-marker text-foreground">Standards Management</h1>
          <p className="text-muted-foreground">Sync and manage educational standards from external sources</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => syncJurisdictionsMutation.mutate()}
            disabled={syncJurisdictionsMutation.isPending || isImporting}
            variant="outline"
            data-testid="button-sync-jurisdictions"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncJurisdictionsMutation.isPending ? "animate-spin" : ""}`} />
            {syncJurisdictionsMutation.isPending ? "Syncing..." : "Sync Jurisdictions"}
          </Button>
          <Button
            onClick={() => fullImportMutation.mutate()}
            disabled={fullImportMutation.isPending || isImporting}
            data-testid="button-full-import"
          >
            <Download className={`h-4 w-4 mr-2 ${isImporting ? "animate-pulse" : ""}`} />
            {isImporting ? "Importing..." : "Import All Standards"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{status?.totalJurisdictions || 0}</div>
            <p className="text-sm text-muted-foreground">Jurisdictions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{status?.totalStandardSets || 0}</div>
            <p className="text-sm text-muted-foreground">Standard Sets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{status?.totalStandards || 0}</div>
            <p className="text-sm text-muted-foreground">Individual Standards</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-foreground">
              {status?.lastSync ? formatDate(status.lastSync) : "Never"}
            </div>
            <p className="text-sm text-muted-foreground">Last Sync</p>
          </CardContent>
        </Card>
      </div>

      {isImporting && importProgress && importProgress.status !== "idle" && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Import in Progress
            </CardTitle>
            <CardDescription>
              {importProgress.currentJurisdiction && (
                <span>Processing: {importProgress.currentJurisdiction}</span>
              )}
              {importProgress.currentStandardSet && (
                <span> / {importProgress.currentStandardSet}</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Jurisdictions</span>
                <span>{importProgress.jurisdictionsProcessed} / {importProgress.jurisdictionsTotal}</span>
              </div>
              <Progress 
                value={importProgress.jurisdictionsTotal > 0 
                  ? (importProgress.jurisdictionsProcessed / importProgress.jurisdictionsTotal) * 100 
                  : 0
                } 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Standard Sets</span>
                <span>{importProgress.standardSetsProcessed} / {importProgress.standardSetsTotal || "?"}</span>
              </div>
              <Progress 
                value={importProgress.standardSetsTotal > 0 
                  ? (importProgress.standardSetsProcessed / importProgress.standardSetsTotal) * 100 
                  : 0
                } 
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Standards imported: {importProgress.standardsProcessed}
            </div>
            {importProgress.errors.length > 0 && (
              <div className="text-sm text-destructive">
                Errors: {importProgress.errors.length}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse" data-testid="tab-browse">
            <Database className="h-4 w-4 mr-2" />
            Browse Standards
          </TabsTrigger>
          <TabsTrigger value="staging" data-testid="tab-staging">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Staging Queue
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="extract" data-testid="tab-extract">
            <Sparkles className="h-4 w-4 mr-2" />
            LLM Extract
          </TabsTrigger>
          <TabsTrigger value="logs" data-testid="tab-logs">
            <FileText className="h-4 w-4 mr-2" />
            Sync Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Browse Educational Standards</CardTitle>
              <CardDescription>
                Select a jurisdiction to view available standard sets and their individual standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Jurisdiction</label>
                  <Select
                    value={selectedJurisdiction || ""}
                    onValueChange={(value) => {
                      setSelectedJurisdiction(value);
                      setSelectedSet(null);
                    }}
                  >
                    <SelectTrigger data-testid="select-jurisdiction">
                      <SelectValue placeholder="Select jurisdiction..." />
                    </SelectTrigger>
                    <SelectContent>
                      {jurisdictions?.map((j) => (
                        <SelectItem key={j.id} value={j.id}>
                          {j.name} ({j.abbreviation})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Standard Set</label>
                  <Select
                    value={selectedSet || ""}
                    onValueChange={setSelectedSet}
                    disabled={!selectedJurisdiction || !standardSets?.length}
                  >
                    <SelectTrigger data-testid="select-standard-set">
                      <SelectValue placeholder="Select standard set..." />
                    </SelectTrigger>
                    <SelectContent>
                      {standardSets?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Standards Count</label>
                  <div className="h-9 flex items-center px-3 rounded-md border bg-muted text-muted-foreground">
                    {standards?.length || 0} standards
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedSet && standards && standards.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Standards</CardTitle>
                <CardDescription>
                  Showing {standards.length} standards from the selected set
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {standards.map((standard) => (
                      <div
                        key={standard.id}
                        className="p-3 rounded-md border bg-card hover-elevate"
                        data-testid={`standard-${standard.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="shrink-0 font-mono text-xs">
                            {standard.humanCoding}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">{standard.statement}</p>
                            {standard.statementLabel && (
                              <p className="text-xs text-muted-foreground mt-1">{standard.statementLabel}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {selectedJurisdiction && (!standardSets || standardSets.length === 0) && (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Standard Sets Found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This jurisdiction doesn't have any standard sets synced yet.
                </p>
                <p className="text-xs text-muted-foreground">
                  Standard sets need to be synced individually from the CSP API after jurisdictions are imported.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="staging" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Staging Queue</CardTitle>
                <CardDescription>
                  Review and approve new standards before they go live
                </CardDescription>
              </div>
              {selectedStaging.length > 0 && (
                <Button
                  onClick={() => bulkApproveMutation.mutate(selectedStaging)}
                  disabled={bulkApproveMutation.isPending}
                  data-testid="button-bulk-approve"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Selected ({selectedStaging.length})
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {stagingStandards && stagingStandards.filter(s => s.status === "pending").length > 0 ? (
                    stagingStandards
                      .filter(s => s.status === "pending")
                      .map((staging) => (
                        <div
                          key={staging.id}
                          className="p-4 rounded-md border bg-card"
                          data-testid={`staging-${staging.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedStaging.includes(staging.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedStaging([...selectedStaging, staging.id]);
                                } else {
                                  setSelectedStaging(selectedStaging.filter(id => id !== staging.id));
                                }
                              }}
                              data-testid={`checkbox-staging-${staging.id}`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {staging.humanCoding}
                                </Badge>
                                <Badge variant="secondary">
                                  {staging.sourceType}
                                </Badge>
                              </div>
                              <p className="text-sm text-foreground">{staging.statement}</p>
                              {staging.jurisdictionName && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {staging.jurisdictionName} {staging.subject && `• ${staging.subject}`}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => approveMutation.mutate(staging.id)}
                                disabled={approveMutation.isPending}
                                data-testid={`button-approve-${staging.id}`}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => rejectMutation.mutate({ id: staging.id, reason: "Rejected by admin" })}
                                disabled={rejectMutation.isPending}
                                data-testid={`button-reject-${staging.id}`}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No pending standards</p>
                      <p className="text-sm">All standards have been reviewed</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extract" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>LLM-Powered Extraction</CardTitle>
              <CardDescription>
                Extract standards from raw text using AI. Paste PDF text content below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...extractForm}>
                <form
                  onSubmit={extractForm.handleSubmit((data) => extractMutation.mutate(data))}
                  className="space-y-4"
                >
                  <FormField
                    control={extractForm.control}
                    name="jurisdictionName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jurisdiction Name</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-llm-jurisdiction">
                              <SelectValue placeholder="Select jurisdiction..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {jurisdictions?.map((j) => (
                              <SelectItem key={j.id} value={j.name}>
                                {j.name} ({j.abbreviation})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={extractForm.control}
                    name="rawText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Raw Text</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Paste raw text from PDF or document..."
                            className="min-h-[200px] font-mono text-sm"
                            data-testid="textarea-llm-text"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={extractMutation.isPending}
                    data-testid="button-extract"
                  >
                    <Sparkles className={`h-4 w-4 mr-2 ${extractMutation.isPending ? "animate-pulse" : ""}`} />
                    {extractMutation.isPending ? "Extracting..." : "Extract Standards"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sync Logs</CardTitle>
              <CardDescription>
                View the history of standards synchronization operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {syncLogs && syncLogs.length > 0 ? (
                    syncLogs.map((log: any) => (
                      <div
                        key={log.id}
                        className="p-4 rounded-md border bg-card"
                        data-testid={`log-${log.id}`}
                      >
                        <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary">{log.source}</Badge>
                            <StatusBadge status={log.status} />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(log.startedAt)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Total:</span>{" "}
                            <span className="text-foreground">{log.totalRecords || 0}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">New:</span>{" "}
                            <span className="text-foreground">{log.newRecords || 0}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Updated:</span>{" "}
                            <span className="text-foreground">{log.updatedRecords || 0}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Errors:</span>{" "}
                            <span className={log.errorCount ? "text-destructive" : "text-foreground"}>
                              {log.errorCount || 0}
                            </span>
                          </div>
                        </div>
                        {log.errorMessages && log.errorMessages.length > 0 && (
                          <div className="mt-2 text-xs text-destructive">
                            {log.errorMessages.slice(0, 3).map((msg: string, i: number) => (
                              <div key={i}>{msg}</div>
                            ))}
                            {log.errorMessages.length > 3 && (
                              <div>...and {log.errorMessages.length - 3} more errors</div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No sync logs yet</p>
                      <p className="text-sm">Click "Sync Jurisdictions" to start importing standards</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
