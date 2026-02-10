import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, Calendar, CheckCircle, Clock, Plus, Trash2, DollarSign } from "lucide-react";

type ScholarshipApplication = {
  id: string;
  scholarshipName: string;
  amount: string | null;
  deadline: string | null;
  season: string | null;
  status: string;
  essayRequired: boolean | null;
  notes: string | null;
  resourceId: string | null;
};


const STATUS_CONFIG: Record<string, { label: string; variant?: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  planned: { label: "Planned", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "default" },
  submitted: { label: "Submitted", variant: "outline" },
  awarded: { label: "Awarded", className: "bg-green-600 text-white no-default-hover-elevate" },
  rejected: { label: "Rejected", variant: "destructive" },
  waitlisted: { label: "Waitlisted", className: "bg-yellow-500 text-white no-default-hover-elevate" },
};

const SEASONS = [
  { value: "early_fall", label: "Early Fall (Aug-Oct)", months: "Aug - Oct", color: "bg-orange-500/10 text-orange-600" },
  { value: "late_fall", label: "Late Fall (Nov-Dec)", months: "Nov - Dec", color: "bg-red-500/10 text-red-600" },
  { value: "spring", label: "Spring (Jan-Apr)", months: "Jan - Apr", color: "bg-green-500/10 text-green-600" },
];

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.planned;
  return (
    <Badge variant={config.variant} className={config.className} data-testid={`badge-status-${status}`}>
      {config.label}
    </Badge>
  );
}

function AddApplicationDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ scholarshipName: "", amount: "", deadline: "", season: "early_fall", essayRequired: false, notes: "" });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/scholarship-applications", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scholarship-applications"] });
      toast({ title: "Application added" });
      setOpen(false);
      setForm({ scholarshipName: "", amount: "", deadline: "", season: "early_fall", essayRequired: false, notes: "" });
      onClose();
    },
    onError: () => toast({ title: "Failed to add application", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      scholarshipName: form.scholarshipName,
      amount: form.amount || null,
      deadline: form.deadline || null,
      season: form.season,
      status: "planned",
      essayRequired: form.essayRequired,
      notes: form.notes || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-application"><Plus className="w-4 h-4 mr-2" />Add Application</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Scholarship Application</DialogTitle>
          <DialogDescription>Track a new scholarship application</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scholarshipName">Scholarship Name</Label>
            <Input id="scholarshipName" value={form.scholarshipName} onChange={(e) => setForm({ ...form, scholarshipName: e.target.value })} required data-testid="input-scholarship-name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input id="amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} data-testid="input-amount" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} data-testid="input-deadline" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="season">Season</Label>
            <Select value={form.season} onValueChange={(v) => setForm({ ...form, season: v })}>
              <SelectTrigger data-testid="select-season"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEASONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="essayRequired" checked={form.essayRequired} onChange={(e) => setForm({ ...form, essayRequired: e.target.checked })} data-testid="checkbox-essay-required" />
            <Label htmlFor="essayRequired">Essay Required</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} data-testid="input-notes" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-application">
              {createMutation.isPending ? "Adding..." : "Add Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TimelineTab({ applications }: { applications: ScholarshipApplication[] }) {
  return (
    <div className="space-y-6">
      {SEASONS.map((season) => {
        const seasonApps = applications.filter((a) => a.season === season.value);
        return (
          <Card key={season.value} data-testid={`card-season-${season.value}`}>
            <CardHeader className="flex flex-row items-center gap-2 flex-wrap">
              <Badge className={season.color} data-testid={`badge-season-${season.value}`}>{season.label}</Badge>
              <span className="text-sm text-muted-foreground">{season.months}</span>
              <span className="text-sm text-muted-foreground ml-auto">{seasonApps.length} application{seasonApps.length !== 1 ? "s" : ""}</span>
            </CardHeader>
            <CardContent>
              {seasonApps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No applications for this season yet.</p>
              ) : (
                <div className="space-y-3">
                  {seasonApps.map((app) => (
                    <div key={app.id} className="flex items-center justify-between gap-2 flex-wrap p-3 rounded-md bg-muted/50" data-testid={`timeline-app-${app.id}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <GraduationCap className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{app.scholarshipName}</span>
                        {app.amount && <span className="text-sm text-muted-foreground">${app.amount}</span>}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {app.deadline && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />{new Date(app.deadline).toLocaleDateString()}
                          </span>
                        )}
                        <StatusBadge status={app.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ApplicationsTab({ applications }: { applications: ScholarshipApplication[] }) {
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => apiRequest("PATCH", `/api/scholarship-applications/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scholarship-applications"] });
      toast({ title: "Application updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/scholarship-applications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scholarship-applications"] });
      toast({ title: "Application deleted" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddApplicationDialog onClose={() => {}} />
      </div>
      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <GraduationCap className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No applications yet. Add your first scholarship application!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {applications.map((app) => (
            <Card key={app.id} data-testid={`card-application-${app.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="text-base">{app.scholarshipName}</CardTitle>
                  {app.amount && <p className="text-sm text-muted-foreground mt-1"><DollarSign className="w-3 h-3 inline" />{app.amount}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <StatusBadge status={app.status} />
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(app.id)} disabled={deleteMutation.isPending} data-testid={`button-delete-${app.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {app.deadline && (
                  <p className="text-sm flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-3 h-3" />Deadline: {new Date(app.deadline).toLocaleDateString()}
                  </p>
                )}
                {app.essayRequired && (
                  <p className="text-sm flex items-center gap-1 text-muted-foreground">
                    <CheckCircle className="w-3 h-3" />Essay required
                  </p>
                )}
                {app.notes && <p className="text-sm text-muted-foreground italic">{app.notes}</p>}
                <div className="pt-2">
                  <Label className="text-xs">Update Status</Label>
                  <Select value={app.status} onValueChange={(v) => updateMutation.mutate({ id: app.id, data: { status: v } })}>
                    <SelectTrigger data-testid={`select-status-${app.id}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScholarshipPlanner() {
  const { data: applications, isLoading } = useQuery<ScholarshipApplication[]>({
    queryKey: ["/api/scholarship-applications"],
  });

  const apps = applications || [];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <GraduationCap className="w-6 h-6" />Scholarship Planner
        </h1>
        <p className="text-muted-foreground mt-1" data-testid="text-page-subtitle">Plan your scholarship applications by season</p>
      </div>

      <Tabs defaultValue="timeline" data-testid="tabs-scholarship">
        <TabsList>
          <TabsTrigger value="timeline" data-testid="tab-timeline"><Calendar className="w-4 h-4 mr-1" />Timeline</TabsTrigger>
          <TabsTrigger value="applications" data-testid="tab-applications"><CheckCircle className="w-4 h-4 mr-1" />My Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4">
          {isLoading ? (
            <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-md" />)}</div>
          ) : (
            <TimelineTab applications={apps} />
          )}
        </TabsContent>

        <TabsContent value="applications" className="mt-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">{[1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-md" />)}</div>
          ) : (
            <ApplicationsTab applications={apps} />
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}
