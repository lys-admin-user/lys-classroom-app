import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, Save, Users, AlertCircle, Eye, EyeOff, ChevronUp, ChevronDown, Plus, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FoundationModule } from "@shared/schema";

type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

interface RollupRow {
  slug: string;
  title: string;
  order: number;
  contentType: string;
  totalStaff: number;
  viewedCount: number;
  completedCount: number;
  completionPct: number;
  avgQuizScore: number | null;
}

const ADMIN_ROLES = ["site_admin", "system_admin"];

export default function AdminFoundation() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && (!user || !ADMIN_ROLES.includes(user.role || ""))) {
      setLocation("/");
    }
  }, [authLoading, user, setLocation]);

  const { data: modules = [], isLoading: modulesLoading } = useQuery<FoundationModule[]>({
    queryKey: ["/api/foundation/modules"],
    enabled: !!user,
  });
  const { data: rollup = [], isLoading: rollupLoading } = useQuery<RollupRow[]>({
    queryKey: ["/api/admin/foundation/rollup"],
    enabled: !!user && ADMIN_ROLES.includes(user.role || ""),
  });

  if (authLoading || !user || !ADMIN_ROLES.includes(user.role || "")) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-lys-yellow" />
          <h1 className="font-oswald text-3xl font-bold" data-testid="text-page-title">Foundation Admin</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage the staff onboarding modules and see how the team is engaging with them.
        </p>
      </div>

      <Tabs defaultValue="edit" className="w-full">
        <TabsList>
          <TabsTrigger value="edit" data-testid="tab-edit-modules">Edit Modules</TabsTrigger>
          <TabsTrigger value="rollup" data-testid="tab-rollup">Team Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-4 space-y-4">
          {modulesLoading ? (
            <p className="text-sm text-muted-foreground">Loading modules…</p>
          ) : (
            modules.map((m, idx) => (
              <ModuleEditor
                key={m.id}
                module={m}
                isFirst={idx === 0}
                isLast={idx === modules.length - 1}
                neighborAbove={idx > 0 ? modules[idx - 1] : null}
                neighborBelow={idx < modules.length - 1 ? modules[idx + 1] : null}
                toast={toast}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="rollup" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Team Engagement
              </CardTitle>
              <CardDescription>
                Per-module roll-up across all staff and site / system administrators.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rollupLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : rollup.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      <TableHead className="text-right">Viewed</TableHead>
                      <TableHead className="text-right">Completed</TableHead>
                      <TableHead className="w-[200px]">Completion %</TableHead>
                      <TableHead className="text-right">Avg Quiz Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rollup.map((r) => (
                      <TableRow key={r.slug} data-testid={`row-rollup-${r.slug}`}>
                        <TableCell>
                          <div className="font-medium">
                            {String(r.order).padStart(2, "0")} · {r.title}
                          </div>
                          <Badge variant="outline" className="text-[10px] mt-1">{r.contentType}</Badge>
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-viewed-${r.slug}`}>
                          {r.viewedCount} / {r.totalStaff}
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-completed-${r.slug}`}>
                          {r.completedCount} / {r.totalStaff}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={r.completionPct} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground w-10 text-right">{r.completionPct}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-avg-quiz-${r.slug}`}>
                          {r.avgQuizScore !== null ? `${r.avgQuizScore}%` : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <p className="mt-4 text-xs text-muted-foreground flex items-center gap-1.5">
                <AlertCircle className="h-3 w-3" />
                "Total Staff" counts users with role <code>staff</code>, <code>site_admin</code>, or <code>system_admin</code>.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ModuleEditorProps {
  module: FoundationModule;
  isFirst: boolean;
  isLast: boolean;
  neighborAbove: FoundationModule | null;
  neighborBelow: FoundationModule | null;
  toast: ReturnType<typeof useToast>["toast"];
}

function ModuleEditor({ module, isFirst, isLast, neighborAbove, neighborBelow, toast }: ModuleEditorProps) {
  const [title, setTitle] = useState(module.title);
  const [subtitle, setSubtitle] = useState(module.subtitle || "");
  const [videoUrl, setVideoUrl] = useState(module.videoUrl || "");
  const [body, setBody] = useState(module.body || "");
  const [isPublished, setIsPublished] = useState(module.isPublished);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(
    Array.isArray(module.quizJson) ? (module.quizJson as QuizQuestion[]) : []
  );
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setTitle(module.title);
    setSubtitle(module.subtitle || "");
    setVideoUrl(module.videoUrl || "");
    setBody(module.body || "");
    setIsPublished(module.isPublished);
    setQuizQuestions(Array.isArray(module.quizJson) ? (module.quizJson as QuizQuestion[]) : []);
    setDirty(false);
  }, [module.id, module.updatedAt]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title,
        subtitle: subtitle || null,
        videoUrl: videoUrl || null,
        body,
        isPublished,
      };
      if (module.contentType === "quiz") payload.quizJson = quizQuestions;
      const res = await apiRequest("PATCH", `/api/admin/foundation/modules/${module.slug}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/foundation/modules"] });
      setDirty(false);
      toast({ title: "Saved", description: `"${title}" updated.` });
    },
    onError: (err: any) => {
      toast({ title: "Couldn't save", description: err?.message || "Try again.", variant: "destructive" });
    },
  });

  const reorder = useMutation({
    mutationFn: async (direction: "up" | "down") => {
      const swap = direction === "up" ? neighborAbove : neighborBelow;
      if (!swap) return;
      // Swap the two `order` values atomically (well, sequentially — both are admin-only so race is fine).
      await apiRequest("PATCH", `/api/admin/foundation/modules/${module.slug}`, { order: swap.order });
      await apiRequest("PATCH", `/api/admin/foundation/modules/${swap.slug}`, { order: module.order });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/foundation/modules"] });
    },
    onError: () => {
      toast({ title: "Couldn't reorder", variant: "destructive" });
    },
  });

  const updateQuestion = (qi: number, patch: Partial<QuizQuestion>) => {
    setQuizQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, ...patch } : q)));
    setDirty(true);
  };
  const updateOption = (qi: number, oi: number, value: string) => {
    setQuizQuestions((qs) =>
      qs.map((q, i) => (i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? value : o)) } : q))
    );
    setDirty(true);
  };
  const addOption = (qi: number) => {
    setQuizQuestions((qs) =>
      qs.map((q, i) => (i === qi && q.options.length < 6 ? { ...q, options: [...q.options, ""] } : q))
    );
    setDirty(true);
  };
  const removeOption = (qi: number, oi: number) => {
    setQuizQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qi || q.options.length <= 2) return q;
        const newOpts = q.options.filter((_, j) => j !== oi);
        let newCorrect = q.correctIndex;
        if (oi === q.correctIndex) newCorrect = 0;
        else if (oi < q.correctIndex) newCorrect = q.correctIndex - 1;
        return { ...q, options: newOpts, correctIndex: newCorrect };
      })
    );
    setDirty(true);
  };
  const addQuestion = () => {
    setQuizQuestions((qs) => [
      ...qs,
      { question: "New question", options: ["Option A", "Option B"], correctIndex: 0, explanation: "" },
    ]);
    setDirty(true);
  };
  const removeQuestion = (qi: number) => {
    setQuizQuestions((qs) => qs.filter((_, i) => i !== qi));
    setDirty(true);
  };

  const onChange = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setDirty(true); };

  return (
    <Card data-testid={`card-edit-${module.slug}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">{String(module.order).padStart(2, "0")}</Badge>
              <span>{module.title}</span>
              {!isPublished && (
                <Badge variant="secondary" className="text-[10px]" data-testid={`badge-draft-${module.slug}`}>Draft</Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs mt-1">slug: <code>{module.slug}</code> · type: <code>{module.contentType}</code></CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => reorder.mutate("up")}
              disabled={isFirst || reorder.isPending || dirty}
              title={dirty ? "Save changes first" : "Move up"}
              data-testid={`button-move-up-${module.slug}`}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => reorder.mutate("down")}
              disabled={isLast || reorder.isPending || dirty}
              title={dirty ? "Save changes first" : "Move down"}
              data-testid={`button-move-down-${module.slug}`}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => save.mutate()}
              disabled={!dirty || save.isPending}
              data-testid={`button-save-${module.slug}`}
            >
              <Save className="h-4 w-4 mr-1" />
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-md border p-2.5 bg-muted/30">
          <div className="flex items-center gap-2 text-sm">
            {isPublished ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
            <div>
              <div className="font-medium">
                {isPublished ? "Published" : "Draft (hidden from staff)"}
              </div>
              <div className="text-xs text-muted-foreground">
                {isPublished
                  ? "This module is visible to staff in the Foundation widget."
                  : "Only admins see this module. Staff won't see it in the widget."}
              </div>
            </div>
          </div>
          <Switch
            checked={isPublished}
            onCheckedChange={(v) => onChange(setIsPublished)(v)}
            data-testid={`switch-published-${module.slug}`}
          />
        </div>
        <div>
          <Label className="text-xs">Title</Label>
          <Input value={title} onChange={(e) => onChange(setTitle)(e.target.value)} data-testid={`input-title-${module.slug}`} />
        </div>
        <div>
          <Label className="text-xs">Subtitle</Label>
          <Input value={subtitle} onChange={(e) => onChange(setSubtitle)(e.target.value)} data-testid={`input-subtitle-${module.slug}`} />
        </div>
        <div>
          <Label className="text-xs">Video URL (YouTube or Vimeo, optional)</Label>
          <Input value={videoUrl} onChange={(e) => onChange(setVideoUrl)(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" data-testid={`input-video-${module.slug}`} />
        </div>
        <div>
          <Label className="text-xs">Body (full markdown — headings, lists, links, tables, **bold**, &gt; quotes)</Label>
          <Textarea
            value={body}
            onChange={(e) => onChange(setBody)(e.target.value)}
            rows={10}
            className="font-mono text-xs"
            data-testid={`input-body-${module.slug}`}
          />
        </div>
        {module.contentType === "quiz" && (
          <div className="space-y-3 rounded-md border p-3 bg-muted/20">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider">Quiz Questions ({quizQuestions.length})</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={addQuestion}
                disabled={quizQuestions.length >= 20}
                data-testid={`button-add-question-${module.slug}`}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Question
              </Button>
            </div>
            {quizQuestions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No questions yet. Click "Add Question" to start.</p>
            ) : (
              quizQuestions.map((q, qi) => (
                <div key={qi} className="rounded border bg-background p-3 space-y-2" data-testid={`editor-question-${qi}`}>
                  <div className="flex items-start justify-between gap-2">
                    <Label className="text-xs pt-2">Q{qi + 1}</Label>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeQuestion(qi)}
                      data-testid={`button-remove-question-${qi}`}
                      title="Delete question"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                  <Textarea
                    value={q.question}
                    onChange={(e) => updateQuestion(qi, { question: e.target.value })}
                    rows={2}
                    className="text-sm"
                    placeholder="Question text"
                    data-testid={`input-question-text-${qi}`}
                  />
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Options (radio = correct answer)</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addOption(qi)}
                        disabled={q.options.length >= 6}
                        className="h-6 text-xs"
                        data-testid={`button-add-option-${qi}`}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Option
                      </Button>
                    </div>
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`q-${module.slug}-${qi}-correct`}
                          checked={q.correctIndex === oi}
                          onChange={() => updateQuestion(qi, { correctIndex: oi })}
                          className="h-4 w-4 accent-lys-teal"
                          data-testid={`radio-correct-${qi}-${oi}`}
                        />
                        <Input
                          value={opt}
                          onChange={(e) => updateOption(qi, oi, e.target.value)}
                          className="text-sm flex-1"
                          placeholder={`Option ${oi + 1}`}
                          data-testid={`input-option-${qi}-${oi}`}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeOption(qi, oi)}
                          disabled={q.options.length <= 2}
                          className="h-7 w-7"
                          title={q.options.length <= 2 ? "Need at least 2 options" : "Remove option"}
                          data-testid={`button-remove-option-${qi}-${oi}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Explanation (shown after submit)</Label>
                    <Textarea
                      value={q.explanation || ""}
                      onChange={(e) => updateQuestion(qi, { explanation: e.target.value })}
                      rows={2}
                      className="text-xs"
                      placeholder="Why this is the right answer…"
                      data-testid={`input-explanation-${qi}`}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
