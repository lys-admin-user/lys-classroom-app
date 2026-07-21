import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { US_GRADE_OPTIONS } from "@shared/gradeLevels";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { GuestEmailModal } from "@/components/GuestEmailModal";
import { GuestSignupModal } from "@/components/GuestSignupModal";
import { AiGeneratedLabel, AiAgentNotice } from "@/components/AiDisclosure";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Home,
  Loader2,
  Clock,
  CheckCircle2,
  CalendarDays,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import type {
  GeneratedHomeschoolPlan,
  HomeschoolDayPlan,
} from "@shared/schema";

const GRADE_OPTIONS = US_GRADE_OPTIONS;

const SUBJECT_OPTIONS = [
  "Math",
  "Reading & Language Arts",
  "Science",
  "Social Studies",
  "Writing",
  "Art",
  "Music",
  "Physical Education",
  "Life Skills",
  "Foreign Language",
];

interface HomeschoolForm {
  gradeLevel: string;
  subjects: string[];
  daysPerWeek: number;
  interests: string;
  notes: string;
}

interface DayCardProps {
  day: HomeschoolDayPlan;
  index: number;
  gradeLevel: string;
  onExpandActivity: (subject: string, focus: string, gradeLevel: string) => void;
}

function DayCard({ day, index, gradeLevel, onExpandActivity }: DayCardProps) {
  return (
    <Card data-testid={`card-day-${index}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-8 items-center justify-center rounded-full bg-lys-teal/15 px-3 font-oswald text-sm font-semibold text-lys-teal">
            {day.day}
          </span>
          {day.theme && (
            <CardTitle className="font-roboto text-base font-medium" data-testid={`text-day-theme-${index}`}>
              {day.theme}
            </CardTitle>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {day.activities.map((act, i) => (
          <div
            key={i}
            className="rounded-md border border-border p-3"
            data-testid={`activity-${index}-${i}`}
          >
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" data-testid={`badge-subject-${index}-${i}`}>
                {act.subject}
              </Badge>
              {act.estimatedMinutes && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {act.estimatedMinutes} min
                </span>
              )}
            </div>
            {act.focus && (
              <p className="font-roboto text-sm font-medium">{act.focus}</p>
            )}
            {act.activity && (
              <p className="mt-1 font-roboto text-sm text-muted-foreground">{act.activity}</p>
            )}
            {act.materials && act.materials.length > 0 && (
              <p className="mt-2 font-roboto text-xs text-muted-foreground">
                <span className="font-semibold">Materials:</span> {act.materials.join(", ")}
              </p>
            )}
            <div className="mt-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-lys-teal hover:text-lys-teal hover:bg-lys-teal/10"
                onClick={() => onExpandActivity(act.subject, act.focus || act.activity || "", gradeLevel)}
                data-testid={`button-expand-lesson-${index}-${i}`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Expand to Lesson Plan
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function HomeschoolPlanner() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [form, setForm] = useState<HomeschoolForm>({
    gradeLevel: "",
    subjects: [],
    daysPerWeek: 5,
    interests: "",
    notes: "",
  });
  const [result, setResult] = useState<GeneratedHomeschoolPlan | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [guestModalOpen, setGuestModalOpen] = useState(false);

  const toggleSubject = (subject: string) => {
    setForm((f) => ({
      ...f,
      subjects: f.subjects.includes(subject)
        ? f.subjects.filter((s) => s !== subject)
        : [...f.subjects, subject],
    }));
  };

  const handleExpandActivity = (subject: string, focus: string, gradeLevel: string) => {
    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (focus) params.set("topic", focus);
    if (gradeLevel) params.set("gradeLevel", gradeLevel);
    setLocation(`/lesson-generator?${params.toString()}`);
  };

  const generate = useMutation({
    mutationFn: async () => {
      const endpoint = isAuthenticated
        ? "/api/homeschool/generate"
        : "/api/homeschool/generate-guest";
      const res = await apiRequest("POST", endpoint, form);
      return (await res.json()) as GeneratedHomeschoolPlan;
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error: any) => {
      if (error?.requiresEmail) {
        setEmailModalOpen(true);
        return;
      }
      if (error?.requiresSignup) {
        setGuestModalOpen(true);
        return;
      }
      toast({
        title: "Couldn't build your plan",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const canSubmit =
    form.gradeLevel.trim().length > 0 &&
    form.subjects.length > 0 &&
    !generate.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    generate.mutate();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lys-red/10">
          <Home className="h-6 w-6 text-lys-red" />
        </div>
        <div>
          <h1 className="font-oswald text-2xl font-semibold" data-testid="text-page-title">
            Plan your homeschool week
          </h1>
          <p className="font-roboto text-sm text-muted-foreground">
            Tell us about your child and get a ready-to-teach, day-by-day plan across every subject.
          </p>
        </div>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <AiAgentNotice />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="grade" className="font-roboto">Child's grade level</Label>
                <Select
                  value={form.gradeLevel}
                  onValueChange={(v) => setForm((f) => ({ ...f, gradeLevel: v }))}
                >
                  <SelectTrigger id="grade" data-testid="select-grade">
                    <SelectValue placeholder="Choose a grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled} data-testid={`option-grade-${opt.value}`}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="days" className="font-roboto">School days per week</Label>
                <Select
                  value={String(form.daysPerWeek)}
                  onValueChange={(v) => setForm((f) => ({ ...f, daysPerWeek: Number(v) }))}
                >
                  <SelectTrigger id="days" data-testid="select-days">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 4, 5, 6, 7].map((n) => (
                      <SelectItem key={n} value={String(n)} data-testid={`option-days-${n}`}>
                        {n} days
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-roboto">Subjects to cover</Label>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_OPTIONS.map((subject) => {
                  const selected = form.subjects.includes(subject);
                  return (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => toggleSubject(subject)}
                      data-testid={`toggle-subject-${subject}`}
                      className={`rounded-full border px-3 py-1.5 font-roboto text-sm transition-colors ${
                        selected
                          ? "border-lys-red bg-lys-red/10 text-lys-red"
                          : "border-border text-muted-foreground hover:border-lys-yellow"
                      }`}
                    >
                      {selected && <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5" />}
                      {subject}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="interests" className="font-roboto">
                Your child's interests <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="interests"
                placeholder="e.g. dinosaurs, space, soccer, drawing"
                value={form.interests}
                onChange={(e) => setForm((f) => ({ ...f, interests: e.target.value }))}
                data-testid="input-interests"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="font-roboto">
                Anything else? <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="notes"
                placeholder="e.g. shorter sessions in the morning, needs extra reading support"
                className="resize-none"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                data-testid="input-notes"
              />
            </div>

            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-lys-red text-white hover:bg-lys-red/90"
              data-testid="button-generate-plan"
            >
              {generate.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Building your week…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Build my week plan
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {generate.isPending && (
        <div className="flex flex-col items-center gap-3 py-10 text-center" data-testid="status-loading">
          <Loader2 className="h-8 w-8 animate-spin text-lys-teal" />
          <p className="font-roboto text-sm text-muted-foreground">
            Putting together a balanced week tailored to your child…
          </p>
        </div>
      )}

      {result && !generate.isPending && (
        <div className="space-y-4" data-testid="section-plan-results">
          <AiGeneratedLabel />
          <div className="rounded-lg border border-lys-teal/30 bg-lys-teal/5 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <CalendarDays className="h-5 w-5 text-lys-teal" />
              <h2 className="font-oswald text-xl font-semibold" data-testid="text-result-title">
                {result.title}
              </h2>
            </div>
            {result.weeklyTheme && (
              <Badge variant="secondary" className="mt-2" data-testid="badge-weekly-theme">
                Theme: {result.weeklyTheme}
              </Badge>
            )}
            {result.overview && (
              <p className="mt-2 font-roboto text-sm text-muted-foreground" data-testid="text-overview">
                {result.overview}
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center font-roboto">
            Tip: click <strong>Expand to Lesson Plan</strong> on any activity to build a full lesson from it.
          </p>
          {result.days.map((day, i) => (
            <DayCard
              key={day.id}
              day={day}
              index={i}
              gradeLevel={form.gradeLevel}
              onExpandActivity={handleExpandActivity}
            />
          ))}
        </div>
      )}

      <GuestEmailModal
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
        onCaptured={() => generate.mutate()}
      />
      <GuestSignupModal
        open={guestModalOpen}
        onOpenChange={setGuestModalOpen}
        formContext={{
          topic: form.subjects.join(", "),
          gradeLevel: form.gradeLevel,
        }}
        hardWall
        returnTo="/homeschool"
      />
    </div>
  );
}
