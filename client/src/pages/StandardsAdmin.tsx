import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Database, FileText, CheckCircle, XCircle, Clock, ChevronRight, AlertCircle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StandardsJurisdiction, StandardSet, EducationalStandard, SyncLog } from "@shared/schema";

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

  return (
    <div className="container py-8 max-w-6xl">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-marker text-foreground">Standards Management</h1>
          <p className="text-muted-foreground">Sync and manage educational standards from external sources</p>
        </div>
        <Button
          onClick={() => syncJurisdictionsMutation.mutate()}
          disabled={syncJurisdictionsMutation.isPending}
          data-testid="button-sync-jurisdictions"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncJurisdictionsMutation.isPending ? "animate-spin" : ""}`} />
          {syncJurisdictionsMutation.isPending ? "Syncing..." : "Sync Jurisdictions"}
        </Button>
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

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse" data-testid="tab-browse">
            <Database className="h-4 w-4 mr-2" />
            Browse Standards
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
