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
import { Sparkles, Save, Users, AlertCircle, Eye, EyeOff } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FoundationModule } from "@shared/schema";

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
            modules.map((m) => <ModuleEditor key={m.id} module={m} toast={toast} />)
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

function ModuleEditor({ module, toast }: { module: FoundationModule; toast: ReturnType<typeof useToast>["toast"] }) {
  const [title, setTitle] = useState(module.title);
  const [subtitle, setSubtitle] = useState(module.subtitle || "");
  const [videoUrl, setVideoUrl] = useState(module.videoUrl || "");
  const [body, setBody] = useState(module.body || "");
  const [isPublished, setIsPublished] = useState(module.isPublished);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setTitle(module.title);
    setSubtitle(module.subtitle || "");
    setVideoUrl(module.videoUrl || "");
    setBody(module.body || "");
    setIsPublished(module.isPublished);
    setDirty(false);
  }, [module.id, module.updatedAt]);

  const save = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/admin/foundation/modules/${module.slug}`, {
        title,
        subtitle: subtitle || null,
        videoUrl: videoUrl || null,
        body,
        isPublished,
      });
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
          <Label className="text-xs">Body (markdown-ish: ## headings, &gt; quotes, - bullets, **bold**)</Label>
          <Textarea
            value={body}
            onChange={(e) => onChange(setBody)(e.target.value)}
            rows={10}
            className="font-mono text-xs"
            data-testid={`input-body-${module.slug}`}
          />
        </div>
        {module.contentType === "quiz" && (
          <p className="text-xs text-muted-foreground italic">
            Quiz questions are seeded — to edit them, update <code>server/seedFoundation.ts</code> and run "Reset to defaults" (coming soon).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
