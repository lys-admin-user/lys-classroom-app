import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Plus, Pencil, Trash2, Star, Award, Brain, Users, Lightbulb, Monitor, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Strength {
  id: string;
  strengthName: string;
  category: string;
  proficiencyLevel: number;
  evidence: string;
  endorsedBy?: string;
}

const categoryConfig: Record<string, { label: string; icon: typeof Star; color: string }> = {
  academic: { label: "Academic", icon: Award, color: "bg-teal-500/10 text-teal-600" },
  leadership: { label: "Leadership", icon: Star, color: "bg-amber-500/10 text-amber-600" },
  interpersonal: { label: "Interpersonal", icon: Users, color: "bg-teal-500/10 text-teal-600" },
  creative: { label: "Creative", icon: Lightbulb, color: "bg-red-500/10 text-red-600" },
  technical: { label: "Technical", icon: Monitor, color: "bg-emerald-500/10 text-emerald-600" },
  character: { label: "Character", icon: Heart, color: "bg-amber-500/10 text-amber-600" },
};

const categories = Object.keys(categoryConfig);

function ProficiencyDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1" data-testid="proficiency-dots">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${i <= level ? "bg-primary" : "bg-muted"}`}
          data-testid={`dot-${i}`}
        />
      ))}
    </div>
  );
}

export default function StrengthsInventory() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStrength, setEditingStrength] = useState<Strength | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [form, setForm] = useState({
    strengthName: "",
    category: "academic",
    proficiencyLevel: 3,
    evidence: "",
    endorsedBy: "",
  });

  const { data: strengths = [], isLoading } = useQuery<Strength[]>({
    queryKey: ["/api/strengths"],
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Strength, "id">) => apiRequest("POST", "/api/strengths", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strengths"] });
      toast({ title: "Strength added", description: "Your strength has been recorded." });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: Strength) => apiRequest("PATCH", `/api/strengths/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strengths"] });
      toast({ title: "Strength updated", description: "Your strength has been updated." });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/strengths/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strengths"] });
      toast({ title: "Strength removed", description: "The strength has been deleted." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  function resetForm() {
    setForm({ strengthName: "", category: "academic", proficiencyLevel: 3, evidence: "", endorsedBy: "" });
    setEditingStrength(null);
    setIsDialogOpen(false);
  }

  function openEdit(strength: Strength) {
    setEditingStrength(strength);
    setForm({
      strengthName: strength.strengthName,
      category: strength.category,
      proficiencyLevel: strength.proficiencyLevel,
      evidence: strength.evidence,
      endorsedBy: strength.endorsedBy || "",
    });
    setIsDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.strengthName.trim() || !form.evidence.trim()) {
      toast({ title: "Missing fields", description: "Name and evidence are required.", variant: "destructive" });
      return;
    }
    const payload = {
      strengthName: form.strengthName,
      category: form.category,
      proficiencyLevel: form.proficiencyLevel,
      evidence: form.evidence,
      endorsedBy: form.endorsedBy || undefined,
    };
    if (editingStrength) {
      updateMutation.mutate({ id: editingStrength.id, ...payload } as Strength);
    } else {
      createMutation.mutate(payload);
    }
  }

  const filtered = activeTab === "all" ? strengths : strengths.filter((s) => s.category === activeTab);
  const isBusy = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" data-testid="strengths-inventory-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="page-title">
            <Sparkles className="w-6 h-6 text-primary" />
            Strengths Inventory
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="page-subtitle">
            Discover and document your unique strengths
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-strength">
              <Plus className="w-4 h-4 mr-2" />
              Add Strength
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="strength-dialog">
            <DialogHeader>
              <DialogTitle>{editingStrength ? "Edit Strength" : "Add Strength"}</DialogTitle>
              <DialogDescription>Record a strength and provide evidence of how you demonstrate it.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="strengthName">Strength Name</Label>
                <Input
                  id="strengthName"
                  value={form.strengthName}
                  onChange={(e) => setForm({ ...form, strengthName: e.target.value })}
                  placeholder="e.g. Public Speaking"
                  data-testid="input-strength-name"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c} data-testid={`option-category-${c}`}>
                        {categoryConfig[c].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="proficiencyLevel">Proficiency Level</Label>
                <Select
                  value={String(form.proficiencyLevel)}
                  onValueChange={(v) => setForm({ ...form, proficiencyLevel: Number(v) })}
                >
                  <SelectTrigger data-testid="select-proficiency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)} data-testid={`option-proficiency-${n}`}>
                        {n} - {["Beginner", "Developing", "Competent", "Proficient", "Expert"][n - 1]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="evidence">Evidence</Label>
                <Textarea
                  id="evidence"
                  value={form.evidence}
                  onChange={(e) => setForm({ ...form, evidence: e.target.value })}
                  placeholder="Describe how you've demonstrated this strength"
                  data-testid="input-evidence"
                />
              </div>
              <div>
                <Label htmlFor="endorsedBy">Endorsed By (optional)</Label>
                <Input
                  id="endorsedBy"
                  value={form.endorsedBy}
                  onChange={(e) => setForm({ ...form, endorsedBy: e.target.value })}
                  placeholder="Who can vouch for this?"
                  data-testid="input-endorsed-by"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={isBusy}
                data-testid="button-submit-strength"
              >
                {isBusy ? "Saving..." : editingStrength ? "Update Strength" : "Add Strength"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1" data-testid="category-tabs">
          <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
          {categories.map((c) => {
            const Icon = categoryConfig[c].icon;
            return (
              <TabsTrigger key={c} value={c} data-testid={`tab-${c}`}>
                <Icon className="w-3.5 h-3.5 mr-1" />
                {categoryConfig[c].label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Brain className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground" data-testid="text-empty-state">
                  No strengths recorded yet. Add your first strength to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((strength) => {
                const cfg = categoryConfig[strength.category] || categoryConfig.academic;
                const Icon = cfg.icon;
                return (
                  <Card key={strength.id} data-testid={`card-strength-${strength.id}`}>
                    <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                      <div className="space-y-1 min-w-0">
                        <CardTitle className="text-base truncate" data-testid={`text-strength-name-${strength.id}`}>
                          {strength.strengthName}
                        </CardTitle>
                        <Badge variant="secondary" className={cfg.color} data-testid={`badge-category-${strength.id}`}>
                          <Icon className="w-3 h-3 mr-1" />
                          {cfg.label}
                        </Badge>
                      </div>
                      <div className="flex gap-1" style={{ visibility: "visible" }}>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(strength)}
                          data-testid={`button-edit-${strength.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(strength.id)}
                          data-testid={`button-delete-${strength.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="text-xs text-muted-foreground">Proficiency</span>
                        <ProficiencyDots level={strength.proficiencyLevel} />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`text-evidence-${strength.id}`}>
                        {strength.evidence}
                      </p>
                      {strength.endorsedBy && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid={`text-endorsed-${strength.id}`}>
                          <Award className="w-3 h-3" />
                          Endorsed by {strength.endorsedBy}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
