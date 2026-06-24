import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PenTool, FileText, Plus, Trash2, Save, Heart, Brain, Target } from "lucide-react";

type Narrative = {
  id: string;
  title: string;
  narrativeType: string;
  content: string | null;
  bePillarContent: string | null;
  knowPillarContent: string | null;
  doPillarContent: string | null;
  createdAt: string | null;
};

const NARRATIVE_TYPES = [
  { value: "personal_journey", label: "Personal Journey" },
  { value: "strengths_story", label: "Strengths Story" },
  { value: "career_vision", label: "Career Vision" },
  { value: "scholarship_essay", label: "Scholarship Essay" },
  { value: "gratitude", label: "Gratitude" },
];

const BKD_SECTIONS = [
  {
    key: "be" as const,
    title: "BE",
    subtitle: "Who are you?",
    prompt: "Describe your personal identity, values, and character traits. What makes you who you are? What principles guide your decisions?",
    icon: Heart,
    field: "bePillarContent" as const,
  },
  {
    key: "know" as const,
    title: "KNOW",
    subtitle: "What have you learned?",
    prompt: "Share your academic achievements, knowledge areas, and career awareness. What skills and understanding have you gained through your education and experiences?",
    icon: Brain,
    field: "knowPillarContent" as const,
  },
  {
    key: "do" as const,
    title: "DO",
    subtitle: "What will you accomplish?",
    prompt: "Outline your goals, plans, and the community impact you intend to make. How will you use your education and values to create change?",
    icon: Target,
    field: "doPillarContent" as const,
  },
];

function wordCount(text: string | null): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function NarrativesSidebar({
  narratives,
  isLoading,
  selectedId,
  onSelect,
  onNew,
}: {
  narratives: Narrative[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-sm font-semibold" data-testid="text-sidebar-title">My Essays</h2>
        <Button size="sm" variant="ghost" onClick={onNew} data-testid="button-new-essay-sidebar">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-md" />)}
        </div>
      ) : narratives.length === 0 ? (
        <p className="text-sm text-muted-foreground" data-testid="text-no-essays">No essays yet. Start writing!</p>
      ) : (
        <div className="space-y-1">
          {narratives.map((n) => (
            <button
              key={n.id}
              onClick={() => onSelect(n.id)}
              className={`w-full text-left rounded-md p-2 text-sm transition-colors hover-elevate ${
                selectedId === n.id ? "bg-accent" : ""
              }`}
              data-testid={`button-narrative-${n.id}`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate font-medium">{n.title}</span>
              </div>
              <span className="text-xs text-muted-foreground ml-5.5">
                {NARRATIVE_TYPES.find((t) => t.value === n.narrativeType)?.label || n.narrativeType}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EssayForm({
  narrative,
  onSaved,
  onDeleted,
}: {
  narrative: Narrative | null;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const { toast } = useToast();
  const isEditing = !!narrative;

  const [title, setTitle] = useState(narrative?.title || "");
  const [narrativeType, setNarrativeType] = useState(narrative?.narrativeType || "scholarship_essay");
  const [beContent, setBeContent] = useState(narrative?.bePillarContent || "");
  const [knowContent, setKnowContent] = useState(narrative?.knowPillarContent || "");
  const [doContent, setDoContent] = useState(narrative?.doPillarContent || "");

  const combinedContent = [beContent, knowContent, doContent].filter(Boolean).join("\n\n");
  const totalWords = wordCount(beContent) + wordCount(knowContent) + wordCount(doContent);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/narratives", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/narratives"] });
      toast({ title: "Essay saved" });
      onSaved();
    },
    onError: () => toast({ title: "Failed to save essay", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("PATCH", `/api/narratives/${narrative?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/narratives"] });
      toast({ title: "Essay updated" });
      onSaved();
    },
    onError: () => toast({ title: "Failed to update essay", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/narratives/${narrative?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/narratives"] });
      toast({ title: "Essay deleted" });
      onDeleted();
    },
    onError: () => toast({ title: "Failed to delete essay", variant: "destructive" }),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: "Please enter a title", variant: "destructive" });
      return;
    }
    const payload = {
      title: title.trim(),
      narrativeType,
      content: combinedContent,
      bePillarContent: beContent,
      knowPillarContent: knowContent,
      doPillarContent: doContent,
    };
    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSave} className="space-y-6" data-testid="form-essay">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="essay-title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="essay-title"
            placeholder="My Scholarship Essay"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            data-testid="input-essay-title"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="narrative-type">Narrative Type</Label>
          <Select value={narrativeType} onValueChange={setNarrativeType}>
            <SelectTrigger id="narrative-type" data-testid="select-narrative-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NARRATIVE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {BKD_SECTIONS.map((section) => {
        const Icon = section.icon;
        const value = section.key === "be" ? beContent : section.key === "know" ? knowContent : doContent;
        const setter = section.key === "be" ? setBeContent : section.key === "know" ? setKnowContent : setDoContent;
        return (
          <Card key={section.key} data-testid={`card-section-${section.key}`}>
            <CardHeader className="flex flex-row items-center gap-2 flex-wrap pb-2">
              <Icon className="w-5 h-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">{section.title}: {section.subtitle}</CardTitle>
              </div>
              <span className="ml-auto text-xs text-muted-foreground" data-testid={`text-wordcount-${section.key}`}>
                {wordCount(value)} words
              </span>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{section.prompt}</p>
              <Textarea
                placeholder={`Write about ${section.subtitle.toLowerCase()}...`}
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="min-h-[120px] resize-y"
                data-testid={`textarea-${section.key}`}
              />
            </CardContent>
          </Card>
        );
      })}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <span className="text-sm text-muted-foreground" data-testid="text-total-wordcount">
          Total: {totalWords} words
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {isEditing && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-essay"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          )}
          <Button type="submit" disabled={isSaving} data-testid="button-save-essay">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : isEditing ? "Update Essay" : "Save Essay"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default function EssayBuilder() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const { data: narratives, isLoading } = useQuery<Narrative[]>({
    queryKey: ["/api/narratives"],
  });

  const list = narratives || [];
  const selected = selectedId ? list.find((n) => n.id === selectedId) || null : null;

  const handleNew = () => {
    setSelectedId(null);
    setFormKey((k) => k + 1);
  };

  const handleSaved = () => {
    setFormKey((k) => k + 1);
  };

  const handleDeleted = () => {
    setSelectedId(null);
    setFormKey((k) => k + 1);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <PenTool className="w-6 h-6" />Essay Builder
        </h1>
        <p className="text-muted-foreground mt-1" data-testid="text-page-subtitle">
          Craft your scholarship story using Be-Know-Do
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-64 shrink-0">
          <Card>
            <CardContent className="p-4">
              <NarrativesSidebar
                narratives={list}
                isLoading={isLoading}
                selectedId={selectedId}
                onSelect={(id) => {
                  setSelectedId(id);
                  setFormKey((k) => k + 1);
                }}
                onNew={handleNew}
              />
            </CardContent>
          </Card>
        </aside>

        <main className="flex-1 min-w-0">
          {!selected && !selectedId && (
            <div className="mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold" data-testid="text-new-essay-heading">New Essay</h2>
            </div>
          )}
          {selected && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold" data-testid="text-editing-heading">
                Editing: {selected.title}
              </h2>
            </div>
          )}
          <EssayForm
            key={formKey}
            narrative={selected}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
          />
        </main>
      </div>
    </div>
  );
}
