import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Trash2, Globe, AlertCircle, CheckCircle2, Loader2, Map, BookOpen } from "lucide-react";

type Permissions = {
  canUpload: boolean;
  canUploadAsAdmin: boolean;
  reason?: string;
  orgIds: string[];
  userRole: string;
  isAdmin: boolean;
  isSystemAdmin: boolean;
};

type CurriculumDoc = {
  id: string;
  uploadedByUserId: string;
  uploaderRole: "admin" | "teacher";
  organizationId: string | null;
  docType: "scope_sequence" | "yag" | "lesson";
  title: string;
  subject: string | null;
  gradeLevels: string[];
  country: string | null;
  state: string | null;
  schoolYear: string | null;
  originalFilename: string;
  extractionStatus: "pending" | "processing" | "extracted" | "failed" | "skipped";
  extractionError: string | null;
  standardsExtractedCount: number | null;
  isOptedOut?: boolean;
  createdAt: string;
};

const DOC_TYPE_LABELS: Record<string, { label: string; icon: any; desc: string }> = {
  scope_sequence: { label: "Scope & Sequence", icon: Map, desc: "Course-level pacing & unit map" },
  yag: { label: "Year-at-a-Glance", icon: Globe, desc: "Annual curriculum overview" },
  lesson: { label: "Pre-written Lesson", icon: BookOpen, desc: "Lesson plans → My Lessons" },
};

function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: "Queued", className: "bg-slate-100 text-slate-700" },
    processing: { label: "Extracting…", className: "bg-blue-100 text-blue-700" },
    extracted: { label: "Ready", className: "bg-green-100 text-green-700" },
    failed: { label: "Failed", className: "bg-red-100 text-red-700" },
    skipped: { label: "Stored", className: "bg-slate-100 text-slate-600" },
  };
  const meta = map[status] ?? { label: status, className: "" };
  return <Badge className={meta.className} data-testid={`badge-status-${status}`}>{meta.label}</Badge>;
}

export default function CurriculumLibrary() {
  const { toast } = useToast();
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data: perm } = useQuery<Permissions>({
    queryKey: ["/api/curriculum-library/permissions"],
  });

  const { data: docs = [], isLoading } = useQuery<CurriculumDoc[]>({
    queryKey: ["/api/curriculum-library/documents"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/curriculum-library/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/curriculum-library/documents"] });
      toast({ title: "Document removed" });
    },
  });

  const optOutMutation = useMutation({
    mutationFn: async ({ id, optOut }: { id: string; optOut: boolean }) => {
      return apiRequest("POST", `/api/curriculum-library/documents/${id}/opt-out`, { optOut });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/curriculum-library/documents"] });
    },
  });

  const adminDocs = docs.filter((d) => d.uploaderRole === "admin");
  const teacherDocs = docs.filter((d) => d.uploaderRole === "teacher");

  return (
    <div className="container mx-auto p-6 max-w-7xl" data-testid="page-curriculum-library">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-oswald font-bold" data-testid="text-page-title">Curriculum Library</h1>
          <p className="text-muted-foreground mt-1">
            Upload your school's scope-and-sequence, year-at-a-glance, and pre-written lessons.
            We'll keep the originals and extract structured standards so AI generation aligns to your curriculum.
          </p>
        </div>
        {perm?.canUpload && (
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-upload-curriculum">
                <Upload className="h-4 w-4" /> Upload document
              </Button>
            </DialogTrigger>
            <UploadDialogContent
              perm={perm}
              onSuccess={() => {
                setUploadOpen(false);
                queryClient.invalidateQueries({ queryKey: ["/api/curriculum-library/documents"] });
              }}
            />
          </Dialog>
        )}
      </div>

      {perm && !perm.canUpload && perm.reason && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-700" />
            <p className="text-sm text-amber-800" data-testid="text-permission-reason">{perm.reason}</p>
          </CardContent>
        </Card>
      )}

      {perm?.isAdmin && perm.orgIds.length > 0 && (
        <AdminOrgSettings orgId={perm.orgIds[0]} />
      )}

      {/* Locked product decision: the request-standards flow is open to all
          authenticated users (educators included). Only the curriculum
          *upload* path is admin-gated above. */}
      {perm && (
        <div className="mt-6">
          <RequestStandardsCard isSystemAdmin={perm.isSystemAdmin} />
        </div>
      )}

      <Tabs defaultValue="all" className="mt-8">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">All ({docs.length})</TabsTrigger>
          <TabsTrigger value="admin" data-testid="tab-admin">From admins ({adminDocs.length})</TabsTrigger>
          <TabsTrigger value="mine" data-testid="tab-mine">My uploads</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <DocList docs={docs} isLoading={isLoading} onDelete={(id) => deleteMutation.mutate(id)} onOptOut={(id, optOut) => optOutMutation.mutate({ id, optOut })} />
        </TabsContent>
        <TabsContent value="admin">
          <DocList docs={adminDocs} isLoading={isLoading} onDelete={(id) => deleteMutation.mutate(id)} onOptOut={(id, optOut) => optOutMutation.mutate({ id, optOut })} />
        </TabsContent>
        <TabsContent value="mine">
          <DocList docs={teacherDocs} isLoading={isLoading} onDelete={(id) => deleteMutation.mutate(id)} onOptOut={() => {}} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DocList({
  docs,
  isLoading,
  onDelete,
  onOptOut,
}: {
  docs: CurriculumDoc[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onOptOut: (id: string, optOut: boolean) => void;
}) {
  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading…</div>;
  if (docs.length === 0)
    return (
      <Card className="mt-4">
        <CardContent className="py-12 text-center text-muted-foreground" data-testid="text-no-docs">
          No documents yet. Upload your first scope-and-sequence or YAG to get started.
        </CardContent>
      </Card>
    );
  return (
    <div className="grid gap-3 mt-4">
      {docs.map((doc) => {
        const meta = DOC_TYPE_LABELS[doc.docType];
        const Icon = meta?.icon || FileText;
        return (
          <Card key={doc.id} data-testid={`card-doc-${doc.id}`}>
            <CardContent className="p-4 flex items-start gap-4">
              <div className="rounded-lg bg-lys-yellow/20 p-3">
                <Icon className="h-5 w-5 text-lys-yellow-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold truncate" data-testid={`text-doc-title-${doc.id}`}>{doc.title}</h3>
                  <Badge variant="outline">{meta?.label || doc.docType}</Badge>
                  {doc.uploaderRole === "admin" && <Badge className="bg-lys-blue/10 text-lys-blue">Admin</Badge>}
                  {statusBadge(doc.extractionStatus)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {doc.subject || "—"} · {doc.gradeLevels?.join(", ") || "All grades"} · {doc.originalFilename}
                </p>
                {doc.extractionStatus === "extracted" && (doc.standardsExtractedCount ?? 0) > 0 && (
                  <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {doc.standardsExtractedCount} standards extracted
                  </p>
                )}
                {doc.extractionError && (
                  <p className="text-xs text-red-600 mt-1">{doc.extractionError}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {doc.uploaderRole === "admin" && (doc.docType === "yag" || doc.docType === "scope_sequence") && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Use in lessons</span>
                    <Switch
                      checked={!doc.isOptedOut}
                      onCheckedChange={(checked) => onOptOut(doc.id, !checked)}
                      data-testid={`switch-opt-out-${doc.id}`}
                    />
                  </div>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Remove this document? This cannot be undone.")) onDelete(doc.id);
                  }}
                  data-testid={`button-delete-doc-${doc.id}`}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function UploadDialogContent({ perm, onSuccess }: { perm: Permissions; onSuccess: () => void }) {
  const { toast } = useToast();
  const [docType, setDocType] = useState<"scope_sequence" | "yag" | "lesson">("scope_sequence");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevels, setGradeLevels] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a file");
      if (!title.trim()) throw new Error("Title is required");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("docType", docType);
      fd.append("title", title);
      if (subject) fd.append("subject", subject);
      if (gradeLevels) fd.append("gradeLevels", gradeLevels);
      if (country) fd.append("country", country);
      if (state) fd.append("state", state);
      if (schoolYear) fd.append("schoolYear", schoolYear);
      if (perm.orgIds[0]) fd.append("organizationId", perm.orgIds[0]);
      const res = await fetch("/api/curriculum-library/documents", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Upload failed (${res.status})`);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Uploaded", description: "We'll extract standards in the background." });
      onSuccess();
    },
    onError: (err: any) => toast({ title: "Upload failed", description: err.message, variant: "destructive" }),
  });

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>Upload curriculum document</DialogTitle>
        <DialogDescription>
          PDF, DOCX, or TXT (up to 20MB). We'll keep the original for context and, for scope-and-sequence
          and YAG docs, extract real standards privately for your school.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Document type</Label>
          <Select value={docType} onValueChange={(v: any) => setDocType(v)}>
            <SelectTrigger data-testid="select-doc-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="scope_sequence">Scope &amp; Sequence</SelectItem>
              <SelectItem value="yag">Year-at-a-Glance (YAG)</SelectItem>
              <SelectItem value="lesson">Pre-written Lesson</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Grade 6 Math YAG 2025-26" data-testid="input-title" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Mathematics" data-testid="input-subject" />
          </div>
          <div>
            <Label>Grade levels (comma-separated)</Label>
            <Input value={gradeLevels} onChange={(e) => setGradeLevels(e.target.value)} placeholder="6, 7" data-testid="input-grades" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Country</Label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="United States" data-testid="input-country" />
          </div>
          <div>
            <Label>State / Region</Label>
            <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="TX" data-testid="input-state" />
          </div>
          <div>
            <Label>School year</Label>
            <Input value={schoolYear} onChange={(e) => setSchoolYear(e.target.value)} placeholder="2025-26" data-testid="input-school-year" />
          </div>
        </div>
        <div>
          <Label>File</Label>
          <Input type="file" accept=".pdf,.docx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} data-testid="input-file" />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending} data-testid="button-confirm-upload">
          {uploadMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading…</> : "Upload"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function AdminOrgSettings({ orgId }: { orgId: string }) {
  const { toast } = useToast();
  const { data: settings } = useQuery<{ allowTeacherUploads: boolean }>({
    queryKey: ["/api/curriculum-library/org-settings", orgId],
  });
  const mutation = useMutation({
    mutationFn: async (allow: boolean) =>
      apiRequest("PATCH", `/api/curriculum-library/org-settings/${orgId}`, { allowTeacherUploads: allow }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/curriculum-library/org-settings", orgId] });
      toast({ title: "Setting updated" });
    },
  });
  // Per the May 2026 policy change, curriculum uploads are admin-only
  // platform-wide and the `allowTeacherUploads` org flag is no longer
  // honored at the permission layer. We hide the toggle to avoid
  // misleading admins. (The DB field is preserved for backward-compat.)
  void settings; void mutation;
  return null;
}

function RequestStandardsCard({ isSystemAdmin }: { isSystemAdmin: boolean }) {
  const { toast } = useToast();
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [notes, setNotes] = useState("");

  const { data: requests = [] } = useQuery<any[]>({
    queryKey: ["/api/standards-ingestion/requests"],
  });

  const submit = useMutation({
    mutationFn: async () =>
      apiRequest("POST", "/api/standards-ingestion/requests", {
        country,
        state: state || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/standards-ingestion/requests"] });
      toast({ title: "Request submitted", description: isSystemAdmin ? "You can review & sync from the System Admin panel." : "A system administrator will review your request." });
      setCountry("");
      setState("");
      setNotes("");
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Request public standards for your country</CardTitle>
        <CardDescription>
          Don't see your country in our standards database? Request real public standards to be ingested
          from your ministry of education.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <Input placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} data-testid="input-request-country" />
          <Input placeholder="State / Region (optional)" value={state} onChange={(e) => setState(e.target.value)} data-testid="input-request-state" />
          <Button onClick={() => submit.mutate()} disabled={!country.trim() || submit.isPending} data-testid="button-submit-request">
            {submit.isPending ? "Submitting…" : "Request"}
          </Button>
        </div>
        <Input placeholder="Notes for the reviewer (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="input-request-notes" />
        {requests.length > 0 && (
          <div className="border-t pt-3 mt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Your recent requests</p>
            <div className="space-y-1">
              {requests.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between text-xs" data-testid={`row-request-${r.id}`}>
                  <span>{r.country}{r.state ? ` / ${r.state}` : ""}</span>
                  <Badge variant="outline">{r.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
