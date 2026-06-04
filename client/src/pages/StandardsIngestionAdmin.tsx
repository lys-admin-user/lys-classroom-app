import { useState, useEffect } from "react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Globe, RefreshCw, CheckCircle2, XCircle, Plus, Inbox, TrendingDown, History, ExternalLink, ShieldCheck, FileText, ChevronDown, ChevronUp } from "lucide-react";

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
      <Tabs defaultValue="moderation">
        <TabsList>
          <TabsTrigger value="moderation" data-testid="tab-moderation"><ShieldCheck className="h-4 w-4 mr-1" />Moderation queue</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending"><Inbox className="h-4 w-4 mr-1" />Pending review</TabsTrigger>
          <TabsTrigger value="requests" data-testid="tab-requests">Customer requests</TabsTrigger>
          <TabsTrigger value="sources" data-testid="tab-sources"><Globe className="h-4 w-4 mr-1" />Sources</TabsTrigger>
          <TabsTrigger value="gaps" data-testid="tab-gaps"><TrendingDown className="h-4 w-4 mr-1" />Coverage gaps</TabsTrigger>
          <TabsTrigger value="runs" data-testid="tab-runs"><History className="h-4 w-4 mr-1" />Sync history</TabsTrigger>
        </TabsList>
        <TabsContent value="moderation"><ModerationQueue /></TabsContent>
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

// ===== Task #6: Moderation queue =====

type BacklogStats = {
  total: number;
  threshold: number;
  pendingStandards: { total: number; over24h: number; over7d: number };
  pendingDocs: { total: number; over24h: number; over7d: number };
};

// Task #12 — shows current queue depth (by age) + lets an admin fire the daily
// backlog email on demand. The daily cron sends the same email automatically
// when the total exceeds the configured threshold.
function BacklogAlertBanner() {
  const { toast } = useToast();
  const { data } = useQuery<BacklogStats>({
    queryKey: ["/api/admin/moderation-backlog/stats"],
  });

  const sendNow = useMutation({
    mutationFn: async () =>
      apiRequest("POST", "/api/admin/moderation-backlog/run-now", {}),
    onSuccess: async (res: any) => {
      const body = await res.json().catch(() => ({}));
      toast({
        title: "Backlog alert sent",
        description: `Emailed ${body.sent ?? 0} admin(s) · ${body.total ?? 0} item(s) pending.`,
      });
    },
    onError: (err: any) =>
      toast({ title: "Failed to send alert", description: err?.message || "Try again.", variant: "destructive" }),
  });

  if (!data) return null;
  const overThreshold = data.total > data.threshold;

  return (
    <Card data-testid="card-backlog-banner">
      <CardContent className="p-3 flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold" data-testid="text-backlog-total">{data.total} item(s) awaiting review</span>
            <Badge variant={overThreshold ? "default" : "secondary"} data-testid="badge-backlog-threshold">
              Alert threshold: {data.threshold}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1" data-testid="text-backlog-breakdown">
            Standards: {data.pendingStandards.total} ({data.pendingStandards.over24h} &gt;24h, {data.pendingStandards.over7d} &gt;7d)
            {" · "}
            Docs: {data.pendingDocs.total} ({data.pendingDocs.over24h} &gt;24h, {data.pendingDocs.over7d} &gt;7d)
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={sendNow.isPending}
          onClick={() => sendNow.mutate()}
          data-testid="button-send-backlog-alert"
        >
          {sendNow.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ExternalLink className="h-4 w-4 mr-1" />}
          Send backlog alert now
        </Button>
      </CardContent>
    </Card>
  );
}

type ModerationQueueItem = {
  kind: "pending_standard" | "curriculum_doc";
  id: string;
  createdAt?: string;
  // pending_standard fields
  country?: string;
  state?: string;
  subject?: string;
  gradeLevel?: string;
  code?: string;
  description?: string;
  sourceName?: string;
  sourceUrl?: string;
  // curriculum_doc fields
  title?: string;
  docType?: string;
  originalFilename?: string;
  uploaderRole?: string;
  organizationId?: string;
  extractionStatus?: string;
};

function ModerationQueue() {
  const { toast } = useToast();
  const [kind, setKind] = useState<"all" | "pending_standard" | "curriculum_doc">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set()); // composite "kind:id"
  const [activeItem, setActiveItem] = useState<ModerationQueueItem | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const { data, isLoading } = useQuery<{ items: ModerationQueueItem[]; total: number }>({
    queryKey: ["/api/standards-ingestion/moderation-queue", kind, page],
    queryFn: async () => {
      const r = await fetch(
        `/api/standards-ingestion/moderation-queue?kind=${kind}&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`,
        { credentials: "include" },
      );
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
  });
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const compositeKey = (i: ModerationQueueItem) => `${i.kind}:${i.id}`;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/standards-ingestion/moderation-queue"] });
    queryClient.invalidateQueries({ queryKey: ["/api/standards-ingestion/pending"] });
    setSelected(new Set());
  };

  // Atomic bulk action — sends a single request so the server can run
  // every change (mixed kinds) in one DB transaction and roll back on any
  // partial failure.
  const selectedItems = () =>
    items.filter((i) => selected.has(compositeKey(i))).map((i) => ({ kind: i.kind, id: i.id }));

  const bulkApprove = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/standards-ingestion/moderation/bulk", {
        action: "approve",
        items: selectedItems(),
      });
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Approved", description: `${selected.size} item(s) approved.` });
    },
    onError: (err: any) =>
      toast({ title: "Bulk approve failed", description: err?.message || "Partial failures were rolled back.", variant: "destructive" }),
  });

  const bulkReject = useMutation({
    mutationFn: async () => {
      if (!rejectReason.trim()) throw new Error("Reason is required");
      await apiRequest("POST", "/api/standards-ingestion/moderation/bulk", {
        action: "reject",
        reason: rejectReason,
        items: selectedItems(),
      });
    },
    onSuccess: () => {
      invalidate();
      setRejectOpen(false);
      setRejectReason("");
      toast({ title: "Rejected", description: `${selected.size} item(s) rejected.` });
    },
    onError: (err: any) =>
      toast({ title: "Bulk reject failed", description: err?.message || "Partial failures were rolled back.", variant: "destructive" }),
  });

  const toggle = (k: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  const toggleAll = (on: boolean) => setSelected(on ? new Set(items.map(compositeKey)) : new Set());

  if (isLoading) return <div className="py-8 text-center text-muted-foreground" data-testid="text-moderation-loading">Loading moderation queue…</div>;

  return (
    <div className="mt-4 space-y-3">
      <BacklogAlertBanner />
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <Button size="sm" variant={kind === "all" ? "default" : "outline"} onClick={() => { setKind("all"); setPage(0); }} data-testid="button-filter-all">All</Button>
          <Button size="sm" variant={kind === "pending_standard" ? "default" : "outline"} onClick={() => { setKind("pending_standard"); setPage(0); }} data-testid="button-filter-standards">Standards</Button>
          <Button size="sm" variant={kind === "curriculum_doc" ? "default" : "outline"} onClick={() => { setKind("curriculum_doc"); setPage(0); }} data-testid="button-filter-docs">Curriculum docs</Button>
        </div>
        <div className="flex-1" />
        <Checkbox
          checked={items.length > 0 && selected.size === items.length}
          onCheckedChange={(c) => toggleAll(!!c)}
          data-testid="checkbox-mod-select-all"
        />
        <span className="text-sm text-muted-foreground" data-testid="text-mod-selected-count">{selected.size} selected · {total} pending total</span>
        <Button size="sm" disabled={selected.size === 0 || bulkApprove.isPending} onClick={() => bulkApprove.mutate()} data-testid="button-mod-bulk-approve">
          {bulkApprove.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
          Approve selected
        </Button>
        <Button size="sm" variant="outline" disabled={selected.size === 0 || bulkReject.isPending} onClick={() => setRejectOpen(true)} data-testid="button-mod-bulk-reject">
          <XCircle className="h-4 w-4 mr-1" />Reject…
        </Button>
      </div>

      {items.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground" data-testid="text-no-moderation-items">Nothing pending moderation.</CardContent></Card>
      ) : (
        items.map((item) => {
          const k = compositeKey(item);
          return (
            <Card key={k} data-testid={`card-mod-${item.kind}-${item.id}`}>
              <CardContent className="p-3 flex items-start gap-3">
                <Checkbox checked={selected.has(k)} onCheckedChange={() => toggle(k)} data-testid={`checkbox-mod-${item.id}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={item.kind === "pending_standard" ? "default" : "secondary"} data-testid={`badge-mod-kind-${item.id}`}>
                      {item.kind === "pending_standard" ? "Standard" : "Curriculum doc"}
                    </Badge>
                    {item.country && <Badge variant="outline">{item.country}{item.state ? `/${item.state}` : ""}</Badge>}
                    {item.subject && <Badge variant="secondary">{item.subject}</Badge>}
                    {item.gradeLevel && <Badge variant="secondary">Grade {item.gradeLevel}</Badge>}
                    {item.docType && <Badge variant="secondary">{item.docType}</Badge>}
                    {item.code && <span className="font-mono text-xs text-lys-teal">{item.code}</span>}
                  </div>
                  <p className="text-sm mt-1 truncate" data-testid={`text-mod-summary-${item.id}`}>
                    {item.kind === "pending_standard" ? item.description : item.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {item.kind === "pending_standard"
                      ? `Source: ${item.sourceName || item.sourceUrl || "—"}`
                      : `File: ${item.originalFilename || "—"} · uploaded by ${item.uploaderRole || "?"}`}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setActiveItem(item)} data-testid={`button-mod-view-${item.id}`}>
                  View
                </Button>
              </CardContent>
            </Card>
          );
        })
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-2" data-testid="pagination-moderation">
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages} · showing {items.length} of {total}
          </span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => { setPage((p) => Math.max(0, p - 1)); setSelected(new Set()); }} data-testid="button-page-prev">
              Previous
            </Button>
            <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => { setPage((p) => p + 1); setSelected(new Set()); }} data-testid="button-page-next">
              Next
            </Button>
          </div>
        </div>
      )}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent data-testid="dialog-bulk-reject">
          <DialogHeader>
            <DialogTitle>Reject {selected.size} item(s)</DialogTitle>
            <DialogDescription>Provide a single reason that applies to every selected item. This will be saved to the audit log.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Source URL no longer resolves — re-run sync first."
            rows={3}
            data-testid="textarea-reject-reason"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)} data-testid="button-cancel-reject">Cancel</Button>
            <Button onClick={() => bulkReject.mutate()} disabled={!rejectReason.trim() || bulkReject.isPending} data-testid="button-confirm-reject">
              {bulkReject.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
              Reject all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeItem && <ModerationViewer item={activeItem} onClose={() => setActiveItem(null)} onActed={invalidate} />}
    </div>
  );
}

type EditableStandardFields = {
  code: string;
  description: string;
  subject: string;
  gradeLevel: string;
  strand: string;
};

function ModerationViewer({ item, onClose, onActed }: { item: ModerationQueueItem; onClose: () => void; onActed: () => void }) {
  const { toast } = useToast();
  const scrollKey = `mod-scroll:${item.kind}:${item.id}`;
  const [auditOpen, setAuditOpen] = useState(true);
  // Inline edit state for pending standards (Task #13). Seeded from the
  // extracted source once it loads; admins can fix typos / wrong grade / etc.
  // before approving without a reject + re-ingest round trip.
  const [fields, setFields] = useState<EditableStandardFields | null>(null);

  const { data: src } = useQuery<any>({
    queryKey: ["/api/standards-ingestion/moderation-source", item.kind, item.id],
    queryFn: async () => {
      const r = await fetch(`/api/standards-ingestion/moderation-source/${item.kind}/${item.id}`, { credentials: "include" });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
  });

  useEffect(() => {
    if (item.kind === "pending_standard" && src?.extracted && fields === null) {
      setFields({
        code: src.extracted.code ?? "",
        description: src.extracted.description ?? "",
        subject: src.extracted.subject ?? "",
        gradeLevel: src.extracted.gradeLevel ?? "",
        strand: src.extracted.strand ?? "",
      });
    }
  }, [src, item.kind, fields]);
  const { data: audit = [] } = useQuery<any[]>({
    queryKey: ["/api/standards-ingestion/audit-log", item.kind, item.id],
    queryFn: async () => {
      const r = await fetch(`/api/standards-ingestion/audit-log/${item.kind}/${item.id}`, { credentials: "include" });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
  });

  const [reason, setReason] = useState("");

  // For pending standards we always go through edit-approve so any inline
  // fixes are persisted + audited in the same step. The server only logs the
  // fields that actually changed, so an untouched form behaves like a plain
  // approve. Curriculum docs keep the original approve path.
  const approve = useMutation({
    mutationFn: async () => {
      if (item.kind === "pending_standard") {
        await apiRequest("POST", "/api/standards-ingestion/pending/edit-approve", {
          id: item.id,
          edits: {
            code: fields?.code ?? "",
            description: fields?.description ?? "",
            subject: fields?.subject ?? "",
            gradeLevel: fields?.gradeLevel ?? "",
            strand: fields?.strand ?? "",
          },
          reason: reason || undefined,
        });
      } else {
        await apiRequest("POST", "/api/standards-ingestion/curriculum-docs/approve", { ids: [item.id] });
      }
    },
    onSuccess: () => { toast({ title: "Approved" }); onActed(); onClose(); },
    onError: (err: any) => toast({ title: "Approve failed", description: err?.message, variant: "destructive" }),
  });
  const reject = useMutation({
    mutationFn: async () => {
      const path = item.kind === "pending_standard"
        ? "/api/standards-ingestion/pending/reject"
        : "/api/standards-ingestion/curriculum-docs/reject";
      await apiRequest("POST", path, { ids: [item.id], reason: reason || (item.kind === "curriculum_doc" ? "Rejected by sys admin" : undefined) });
    },
    onSuccess: () => { toast({ title: "Rejected" }); onActed(); onClose(); },
    onError: (err: any) => toast({ title: "Reject failed", description: err?.message, variant: "destructive" }),
  });

  // Persist scroll position per item (left/right panes).
  const onScroll = (side: "l" | "r") => (e: React.UIEvent<HTMLDivElement>) => {
    try { sessionStorage.setItem(`${scrollKey}:${side}`, String((e.target as HTMLDivElement).scrollTop)); } catch {}
  };
  const restoreScroll = (side: "l" | "r") => (el: HTMLDivElement | null) => {
    if (!el) return;
    try {
      const v = sessionStorage.getItem(`${scrollKey}:${side}`);
      if (v) el.scrollTop = Number(v);
    } catch {}
  };

  return (
    <Dialog open={true} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col" data-testid="dialog-moderation-viewer">
        <DialogHeader>
          <DialogTitle data-testid="text-viewer-title">
            {item.kind === "pending_standard" ? "Review pending standard" : "Review curriculum doc"}
          </DialogTitle>
          <DialogDescription>
            Compare the AI-extracted content (left) against the original source (right). Use the audit trail below to see every state transition.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
          <div className="border rounded-md flex flex-col min-h-0" data-testid="pane-extracted">
            <div className="px-3 py-2 border-b bg-muted text-xs font-semibold flex items-center gap-2">
              <FileText className="h-3 w-3" />
              {item.kind === "pending_standard" ? "Extracted (AI) — editable" : "Extracted (AI)"}
            </div>
            <div ref={restoreScroll("l")} onScroll={onScroll("l")} className="overflow-auto p-3 text-sm flex-1">
              {!src ? (
                <div className="text-muted-foreground">Loading…</div>
              ) : item.kind === "pending_standard" ? (
                !fields ? (
                  <div className="text-muted-foreground">Loading…</div>
                ) : (
                  <div className="space-y-3" data-testid="form-edit-standard">
                    <p className="text-xs text-muted-foreground">
                      Fix any AI errors before approving. Changes are saved and logged when you click “Save &amp; approve”.
                    </p>
                    <div className="space-y-1">
                      <Label htmlFor="edit-code" className="text-xs">Code</Label>
                      <Input
                        id="edit-code"
                        value={fields.code}
                        onChange={(e) => setFields({ ...fields, code: e.target.value })}
                        placeholder="e.g. MATH.K.CC.1"
                        data-testid="input-edit-code"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-description" className="text-xs">Description <span className="text-destructive">*</span></Label>
                      <Textarea
                        id="edit-description"
                        value={fields.description}
                        onChange={(e) => setFields({ ...fields, description: e.target.value })}
                        rows={5}
                        data-testid="textarea-edit-description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="edit-subject" className="text-xs">Subject</Label>
                        <Input
                          id="edit-subject"
                          value={fields.subject}
                          onChange={(e) => setFields({ ...fields, subject: e.target.value })}
                          data-testid="input-edit-subject"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="edit-grade" className="text-xs">Grade level</Label>
                        <Input
                          id="edit-grade"
                          value={fields.gradeLevel}
                          onChange={(e) => setFields({ ...fields, gradeLevel: e.target.value })}
                          data-testid="input-edit-grade"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-strand" className="text-xs">Strand</Label>
                      <Input
                        id="edit-strand"
                        value={fields.strand}
                        onChange={(e) => setFields({ ...fields, strand: e.target.value })}
                        data-testid="input-edit-strand"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Country/state and source URL stay locked to preserve provenance.
                    </p>
                  </div>
                )
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-xs" data-testid="text-extracted-content">
                  {src.extracted?.text || "(no extracted text)"}
                </pre>
              )}
            </div>
          </div>
          <div className="border rounded-md flex flex-col min-h-0" data-testid="pane-source">
            <div className="px-3 py-2 border-b bg-muted text-xs font-semibold flex items-center gap-2">
              <ExternalLink className="h-3 w-3" />Original source
              {src?.source?.url && (
                <a href={src.source.url} target="_blank" rel="noreferrer" className="ml-auto text-lys-blue underline truncate max-w-[60%]" data-testid="link-source-url">
                  {src.source.url}
                </a>
              )}
            </div>
            <div ref={restoreScroll("r")} onScroll={onScroll("r")} className="flex-1 min-h-0">
              {!src ? (
                <div className="p-3 text-muted-foreground">Loading…</div>
              ) : src.kind === "pending_standard" && src.source?.url ? (
                // External HTML source — sandboxed (no same-origin, no scripts).
                <iframe
                  src={src.source.url}
                  title="Source document"
                  sandbox=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full border-0"
                  data-testid="iframe-source-html"
                />
              ) : src.kind === "curriculum_doc" && src.source?.fileUrl ? (
                // Browsers render PDFs natively in iframes; HTML uploads are
                // sandboxed and served with a strict CSP from the backend.
                <iframe
                  src={src.source.fileUrl}
                  title={src.source.filename || "Original document"}
                  sandbox={src.source.type === "pdf" ? "allow-scripts allow-same-origin" : ""}
                  className="w-full h-full border-0"
                  data-testid={`iframe-source-${src.source.type}`}
                />
              ) : src.kind === "curriculum_doc" ? (
                <div className="p-3 text-sm space-y-2">
                  <p className="text-muted-foreground">
                    Original file: <strong className="text-foreground">{src.source?.filename}</strong> ({(src.source?.type || "").toUpperCase()}).
                    Size: {src.source?.sizeBytes ? `${Math.round(src.source.sizeBytes / 1024)} KB` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid="text-no-original">
                    This file was uploaded before original-file storage was enabled, so only the extracted text is available for comparison.
                  </p>
                </div>
              ) : (
                <div className="p-3 text-muted-foreground">No source available.</div>
              )}
            </div>
          </div>
        </div>

        <Collapsible open={auditOpen} onOpenChange={setAuditOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between" data-testid="button-toggle-audit">
              <span className="flex items-center gap-2"><History className="h-4 w-4" />Audit trail ({audit.length})</span>
              {auditOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="max-h-40 overflow-auto border rounded-md p-2 mt-1">
            {audit.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2" data-testid="text-no-audit">No transitions recorded yet.</p>
            ) : (
              <ul className="text-xs space-y-1">
                {audit.map((a) => {
                  const changes = a.action === "edited" ? (a.details?.changes as Record<string, { from: unknown; to: unknown }> | undefined) : undefined;
                  return (
                    <li key={a.id} className="space-y-1" data-testid={`audit-row-${a.id}`}>
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="text-[10px]">{a.action}</Badge>
                        <span className="text-muted-foreground">{a.createdAt ? new Date(a.createdAt).toLocaleString() : "—"}</span>
                        <span>by {a.actorUserId || "system"}</span>
                        {a.reason && <span className="italic text-muted-foreground">— {a.reason}</span>}
                      </div>
                      {changes && Object.keys(changes).length > 0 && (
                        <ul className="ml-6 space-y-0.5" data-testid={`audit-diff-${a.id}`}>
                          {Object.entries(changes).map(([field, diff]) => (
                            <li key={field} className="flex flex-wrap items-baseline gap-1" data-testid={`audit-diff-field-${field}-${a.id}`}>
                              <span className="font-medium">{field}:</span>
                              <span className="line-through text-destructive/80 break-all">{diff.from === null || diff.from === "" ? "∅" : String(diff.from)}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-lys-teal break-all">{diff.to === null || diff.to === "" ? "∅" : String(diff.to)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CollapsibleContent>
        </Collapsible>

        <DialogFooter className="flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <Input
            placeholder="Reason (required to reject)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="flex-1"
            data-testid="input-single-reason"
          />
          <Button variant="outline" disabled={(item.kind === "curriculum_doc" && !reason.trim()) || reject.isPending} onClick={() => reject.mutate()} data-testid="button-viewer-reject">
            {reject.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}Reject
          </Button>
          <Button
            disabled={approve.isPending || (item.kind === "pending_standard" && (!fields || !fields.description.trim()))}
            onClick={() => approve.mutate()}
            data-testid="button-viewer-approve"
          >
            {approve.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
            {item.kind === "pending_standard" ? "Save & approve" : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
