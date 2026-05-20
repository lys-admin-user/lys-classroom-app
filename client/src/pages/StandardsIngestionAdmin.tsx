import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Globe, RefreshCw, CheckCircle2, XCircle, Plus, Inbox, TrendingDown, History, ExternalLink } from "lucide-react";

export default function StandardsIngestionAdmin() {
  const { user } = useAuth();
  const isSysAdmin = (user as any)?.role === "system_admin" || (user as any)?.role === "site_admin";
  if (!isSysAdmin) {
    return <div className="p-8 text-center text-muted-foreground">System admin access required.</div>;
  }
  return (
    <div className="container mx-auto p-6 max-w-7xl" data-testid="page-standards-ingestion-admin">
      <h1 className="text-3xl font-oswald font-bold mb-2">Public Standards Ingestion</h1>
      <p className="text-muted-foreground mb-6">
        Review customer requests, ingest real public standards from ministry sources, and approve them
        before they go live across LYS.
      </p>
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending"><Inbox className="h-4 w-4 mr-1" />Pending review</TabsTrigger>
          <TabsTrigger value="requests" data-testid="tab-requests">Customer requests</TabsTrigger>
          <TabsTrigger value="sources" data-testid="tab-sources"><Globe className="h-4 w-4 mr-1" />Sources</TabsTrigger>
          <TabsTrigger value="gaps" data-testid="tab-gaps"><TrendingDown className="h-4 w-4 mr-1" />Coverage gaps</TabsTrigger>
          <TabsTrigger value="runs" data-testid="tab-runs"><History className="h-4 w-4 mr-1" />Sync history</TabsTrigger>
        </TabsList>
        <TabsContent value="pending"><PendingReview /></TabsContent>
        <TabsContent value="requests"><CustomerRequests /></TabsContent>
        <TabsContent value="sources"><SourcesPanel /></TabsContent>
        <TabsContent value="gaps"><CoverageGaps /></TabsContent>
        <TabsContent value="runs"><SyncHistory /></TabsContent>
      </Tabs>
    </div>
  );
}

function PendingReview() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { data: pending = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/standards-ingestion/pending"],
  });

  const approve = useMutation({
    mutationFn: async (ids: string[]) => apiRequest("POST", "/api/standards-ingestion/pending/approve", { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/standards-ingestion/pending"] });
      setSelected(new Set());
      toast({ title: "Approved", description: "Standards are now live." });
    },
  });
  const reject = useMutation({
    mutationFn: async (ids: string[]) => apiRequest("POST", "/api/standards-ingestion/pending/reject", { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/standards-ingestion/pending"] });
      setSelected(new Set());
      toast({ title: "Rejected" });
    },
  });

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Loading…</div>;
  if (pending.length === 0)
    return <Card className="mt-4"><CardContent className="py-12 text-center text-muted-foreground" data-testid="text-no-pending">No standards pending review.</CardContent></Card>;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2">
        <Checkbox checked={selected.size === pending.length && pending.length > 0} onCheckedChange={(c) => setSelected(c ? new Set(pending.map((p: any) => p.id)) : new Set())} data-testid="checkbox-select-all" />
        <span className="text-sm text-muted-foreground">{selected.size} selected</span>
        <Button size="sm" disabled={selected.size === 0 || approve.isPending} onClick={() => approve.mutate(Array.from(selected))} data-testid="button-approve-selected">
          {approve.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
          Approve selected
        </Button>
        <Button size="sm" variant="outline" disabled={selected.size === 0 || reject.isPending} onClick={() => reject.mutate(Array.from(selected))} data-testid="button-reject-selected">
          <XCircle className="h-4 w-4 mr-1" />Reject
        </Button>
      </div>
      {pending.map((p: any) => (
        <Card key={p.id} data-testid={`card-pending-${p.id}`}>
          <CardContent className="p-3 flex items-start gap-3">
            <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} data-testid={`checkbox-pending-${p.id}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{p.country}{p.state ? `/${p.state}` : ""}</Badge>
                <Badge variant="secondary">{p.subject || "—"}</Badge>
                {p.gradeLevel && <Badge variant="secondary">Grade {p.gradeLevel}</Badge>}
                <span className="font-mono text-xs text-lys-teal">{p.code || "(no code)"}</span>
              </div>
              <p className="text-sm mt-1" data-testid={`text-pending-desc-${p.id}`}>{p.description}</p>
              <p className="text-xs text-muted-foreground mt-1">Source: {p.sourceName} · {p.sourceUrl}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CustomerRequests() {
  const { toast } = useToast();
  const { data: requests = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/standards-ingestion/requests"],
  });
  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/standards-ingestion/requests/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/standards-ingestion/requests"] });
      toast({ title: "Updated" });
    },
  });
  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Loading…</div>;
  if (requests.length === 0) return <Card className="mt-4"><CardContent className="py-12 text-center text-muted-foreground">No requests yet.</CardContent></Card>;
  return (
    <div className="mt-4 space-y-2">
      {requests.map((r: any) => (
        <Card key={r.id} data-testid={`card-request-${r.id}`}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{r.country}{r.state ? ` / ${r.state}` : ""}</span>
                <Badge variant="outline">{r.status}</Badge>
              </div>
              {r.notes && <p className="text-xs text-muted-foreground mt-1">{r.notes}</p>}
            </div>
            <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: r.id, status: "approved" })} disabled={r.status === "approved" || r.status === "completed"} data-testid={`button-approve-request-${r.id}`}>Approve</Button>
            <Button size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: r.id, status: "rejected" })} disabled={r.status === "rejected"} data-testid={`button-reject-request-${r.id}`}>Reject</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SourcesPanel() {
  const { toast } = useToast();
  const { data: sources = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/standards-ingestion/sources"],
  });
  const sweep = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/standards-ingestion/sweep", {}),
    onSuccess: () => toast({ title: "Annual sweep started", description: "Running in background. Check the Pending tab in a few minutes." }),
  });
  const sync = useMutation({
    mutationFn: async (id: string) => apiRequest("POST", `/api/standards-ingestion/sources/${id}/sync`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/standards-ingestion/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/standards-ingestion/sources"] });
      toast({ title: "Sync complete" });
    },
    onError: (err: any) => toast({ title: "Sync failed", description: err.message, variant: "destructive" }),
  });

  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const add = useMutation({
    mutationFn: async () =>
      apiRequest("POST", "/api/standards-ingestion/sources", {
        country, state: state || undefined, sourceName, sourceUrl, notes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/standards-ingestion/sources"] });
      toast({ title: "Source added" });
      setCountry(""); setState(""); setSourceName(""); setSourceUrl(""); setNotes("");
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{sources.length} ministry sources registered.</p>
        <Button onClick={() => sweep.mutate()} disabled={sweep.isPending} data-testid="button-run-sweep">
          {sweep.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
          Run annual sweep
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4" />Add new source</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} data-testid="input-source-country" />
            <Input placeholder="State (optional)" value={state} onChange={(e) => setState(e.target.value)} data-testid="input-source-state" />
            <Input placeholder="Source name (e.g. Ministry of Education)" value={sourceName} onChange={(e) => setSourceName(e.target.value)} data-testid="input-source-name" />
          </div>
          <Input placeholder="Source URL (https://...)" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} data-testid="input-source-url" />
          <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} data-testid="textarea-source-notes" />
          <Button onClick={() => add.mutate()} disabled={!country || !sourceName || !sourceUrl || add.isPending} data-testid="button-add-source">Add source</Button>
        </CardContent>
      </Card>

      {isLoading ? <div className="text-center text-muted-foreground py-6" data-testid="text-sources-loading">Loading…</div> : sources.map((s: any) => (
        <Card key={s.id} data-testid={`card-source-${s.id}`}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{s.country}{s.state ? `/${s.state}` : ""}</Badge>
                <span className="font-semibold truncate">{s.sourceName}</span>
                {s.lastSyncedAt && <span className="text-xs text-muted-foreground">Last synced: {new Date(s.lastSyncedAt).toLocaleDateString()}</span>}
              </div>
              <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-lys-blue truncate block">{s.sourceUrl}</a>
            </div>
            <Button size="sm" variant="outline" onClick={() => sync.mutate(s.id)} disabled={sync.isPending} data-testid={`button-sync-source-${s.id}`}>
              {sync.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sync now"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// === Track B #2 + #3 ===

function CoverageGaps() {
  const { data: gaps = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/standards-ingestion/coverage-gaps"],
  });
  if (isLoading) return <div className="py-8 text-center text-muted-foreground" data-testid="text-gaps-loading">Loading…</div>;
  if (gaps.length === 0)
    return (
      <Card className="mt-4">
        <CardContent className="py-12 text-center text-muted-foreground" data-testid="text-no-gaps">
          No coverage gaps in the last 12 months — every teacher request matched a real standard set.
        </CardContent>
      </Card>
    );
  return (
    <div className="mt-4 space-y-2">
      <p className="text-sm text-muted-foreground">
        Top {gaps.length} (country, state, subject) combinations where teachers hit our fallback path in the last 12 months. Highest counts = biggest unmet demand.
      </p>
      {gaps.map((g: any, i: number) => (
        <Card key={`${g.country}-${g.state}-${g.subject}-${i}`} data-testid={`card-gap-${i}`}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{g.country}{g.state ? `/${g.state}` : ""}</Badge>
                <span className="font-semibold" data-testid={`text-gap-subject-${i}`}>{g.subject || "(no subject)"}</span>
                <Badge variant="secondary" className="text-[10px]">{g.fallbackKind}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last seen: {g.lastSeen ? new Date(g.lastSeen).toLocaleDateString() : "—"}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-lys-teal" data-testid={`text-gap-count-${i}`}>{g.missCount}</div>
              <div className="text-[10px] text-muted-foreground uppercase">misses</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SyncHistory() {
  const { data: runs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/standards-ingestion/runs"],
  });
  if (isLoading) return <div className="py-8 text-center text-muted-foreground" data-testid="text-runs-loading">Loading…</div>;
  if (runs.length === 0)
    return (
      <Card className="mt-4">
        <CardContent className="py-12 text-center text-muted-foreground" data-testid="text-no-runs">
          No sync runs yet. Run a sync from the Sources tab to get started.
        </CardContent>
      </Card>
    );
  const statusColor = (s: string) =>
    s === "completed" ? "bg-green-100 text-green-800" : s === "failed" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800";
  return (
    <div className="mt-4 space-y-2">
      <p className="text-sm text-muted-foreground">{runs.length} most recent runs.</p>
      {runs.map((r: any) => (
        <Card key={r.id} data-testid={`card-run-${r.id}`}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={statusColor(r.status)} data-testid={`badge-run-status-${r.id}`}>{r.status}</Badge>
              <Badge variant="outline">{r.triggerType}</Badge>
              {r.country && <span className="text-sm font-semibold">{r.country}{r.state ? ` / ${r.state}` : ""}</span>}
              <span className="text-xs text-muted-foreground ml-auto">
                {r.startedAt ? new Date(r.startedAt).toLocaleString() : "—"}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>Sources: <strong className="text-foreground">{r.sourcesSucceeded ?? 0}</strong>/{r.sourcesAttempted ?? 0}</span>
              <span>Pending created: <strong className="text-foreground">{r.pendingCreated ?? 0}</strong></span>
              <span data-testid={`text-run-rejected-${r.id}`}>
                Verbatim rejected:{" "}
                <strong className={(r.verbatimRejected ?? 0) > 0 ? "text-amber-700" : "text-foreground"}>
                  {r.verbatimRejected ?? 0}
                </strong>
              </span>
            </div>
            {r.errorMessage && (
              <p className="text-xs text-red-700 mt-1" data-testid={`text-run-error-${r.id}`}>
                <ExternalLink className="h-3 w-3 inline mr-1" />{r.errorMessage}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
