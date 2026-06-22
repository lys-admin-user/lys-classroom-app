import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { GuestEmailModal } from "@/components/GuestEmailModal";
import { GuestSignupModal } from "@/components/GuestSignupModal";
import { AiGeneratedLabel, AiAgentNotice } from "@/components/AiDisclosure";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Lightbulb,
  CheckCircle2,
  GraduationCap,
  Loader2,
  BookOpen,
  HeartHandshake,
  ShieldAlert,
} from "lucide-react";
import type { GeneratedPracticeSet, PracticeQuestion } from "@shared/schema";

interface SafetyNotice {
  crisis: boolean;
  message?: string;
  resources?: {
    headline: string;
    lines: string[];
    note?: string;
  };
}

const GRADE_LEVELS = [
  "Kindergarten",
  "1st Grade",
  "2nd Grade",
  "3rd Grade",
  "4th Grade",
  "5th Grade",
  "6th Grade",
  "7th Grade",
  "8th Grade",
  "9th Grade",
  "10th Grade",
  "11th Grade",
  "12th Grade",
  "College",
];

const DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

interface PracticeForm {
  subject: string;
  gradeLevel: string;
  topic: string;
  questionCount: number;
  difficulty: "easy" | "medium" | "hard";
}

function QuestionCard({ question, index }: { question: PracticeQuestion; index: number }) {
  const [hintsShown, setHintsShown] = useState(0);
  const [answerRevealed, setAnswerRevealed] = useState(false);

  return (
    <Card data-testid={`card-question-${index}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lys-teal/15 font-oswald text-sm font-semibold text-lys-teal">
            {index + 1}
          </span>
          <div className="flex-1">
            <CardTitle className="font-roboto text-base font-medium leading-relaxed">
              {question.question}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {question.type === "multiple_choice" && question.options && (
          <ul className="space-y-2">
            {question.options.map((opt, i) => (
              <li
                key={i}
                className="rounded-md border border-border px-3 py-2 font-roboto text-sm"
                data-testid={`text-option-${index}-${i}`}
              >
                <span className="mr-2 font-semibold text-muted-foreground">
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
              </li>
            ))}
          </ul>
        )}

        {question.hints.slice(0, hintsShown).map((hint, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-md bg-lys-yellow/10 px-3 py-2"
            data-testid={`text-hint-${index}-${i}`}
          >
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-lys-yellow" />
            <p className="font-roboto text-sm">
              <span className="font-semibold">Hint {i + 1}:</span> {hint}
            </p>
          </div>
        ))}

        <div className="flex flex-wrap gap-2">
          {hintsShown < question.hints.length && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHintsShown((n) => n + 1)}
              data-testid={`button-show-hint-${index}`}
            >
              <Lightbulb className="mr-1.5 h-4 w-4" />
              {hintsShown === 0 ? "Show a hint" : "Next hint"}
            </Button>
          )}
          {!answerRevealed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAnswerRevealed(true)}
              data-testid={`button-reveal-answer-${index}`}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              Reveal answer
            </Button>
          )}
        </div>

        {answerRevealed && (
          <div className="rounded-md border border-lys-teal/30 bg-lys-teal/5 p-3" data-testid={`text-answer-${index}`}>
            <p className="font-roboto text-sm">
              <span className="font-semibold text-lys-teal">Answer:</span> {question.answer}
            </p>
            {question.explanation && (
              <p className="mt-2 font-roboto text-sm text-muted-foreground">
                {question.explanation}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PracticeGenerator() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState<PracticeForm>({
    subject: "",
    gradeLevel: "",
    topic: "",
    questionCount: 5,
    difficulty: "medium",
  });
  const [result, setResult] = useState<GeneratedPracticeSet | null>(null);
  const [safetyNotice, setSafetyNotice] = useState<SafetyNotice | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [guestModalOpen, setGuestModalOpen] = useState(false);

  const generate = useMutation({
    mutationFn: async () => {
      const endpoint = isAuthenticated
        ? "/api/practice/generate"
        : "/api/practice/generate-guest";
      const res = await apiRequest("POST", endpoint, form);
      return (await res.json()) as GeneratedPracticeSet & {
        blocked?: boolean;
        crisis?: boolean;
        message?: string;
        resources?: SafetyNotice["resources"];
      };
    },
    onSuccess: (data) => {
      // A crisis verdict comes back as a 200 with a supportive payload instead
      // of a practice set — surface resources, never questions.
      if (data?.blocked || data?.crisis) {
        setResult(null);
        setSafetyNotice({
          crisis: !!data.crisis,
          message: data.message,
          resources: data.resources,
        });
        return;
      }
      setSafetyNotice(null);
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
      // A content-block verdict comes back as a 422 — show an inline notice
      // rather than a generic error toast.
      if (error?.blocked) {
        setResult(null);
        setSafetyNotice({ crisis: !!error.crisis, message: error.message });
        return;
      }
      toast({
        title: "Couldn't create practice",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const canSubmit =
    form.subject.trim().length > 0 &&
    form.gradeLevel.trim().length > 0 &&
    form.topic.trim().length > 0 &&
    !generate.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSafetyNotice(null);
    generate.mutate();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lys-red/10">
          <GraduationCap className="h-6 w-6 text-lys-red" />
        </div>
        <div>
          <h1 className="font-oswald text-2xl font-semibold" data-testid="text-page-title">
            Practice that helps you learn
          </h1>
          <p className="font-roboto text-sm text-muted-foreground">
            Pick a topic and get practice questions with step-by-step hints — not just answers.
          </p>
        </div>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <AiAgentNotice />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="font-roboto">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g. Math, Biology, History"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  data-testid="input-subject"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="grade" className="font-roboto">Grade level</Label>
                <Select
                  value={form.gradeLevel}
                  onValueChange={(v) => setForm((f) => ({ ...f, gradeLevel: v }))}
                >
                  <SelectTrigger id="grade" data-testid="select-grade">
                    <SelectValue placeholder="Choose a grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_LEVELS.map((g) => (
                      <SelectItem key={g} value={g} data-testid={`option-grade-${g}`}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="topic" className="font-roboto">What do you want to practice?</Label>
              <Input
                id="topic"
                placeholder="e.g. Fractions, Photosynthesis, The American Revolution"
                value={form.topic}
                onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                data-testid="input-topic"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="count" className="font-roboto">Number of questions</Label>
                <Select
                  value={String(form.questionCount)}
                  onValueChange={(v) => setForm((f) => ({ ...f, questionCount: Number(v) }))}
                >
                  <SelectTrigger id="count" data-testid="select-count">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 5, 8, 10].map((n) => (
                      <SelectItem key={n} value={String(n)} data-testid={`option-count-${n}`}>
                        {n} questions
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="difficulty" className="font-roboto">Difficulty</Label>
                <Select
                  value={form.difficulty}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, difficulty: v as PracticeForm["difficulty"] }))
                  }
                >
                  <SelectTrigger id="difficulty" data-testid="select-difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d.value} value={d.value} data-testid={`option-difficulty-${d.value}`}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-lys-red text-white hover:bg-lys-red/90"
              data-testid="button-generate-practice"
            >
              {generate.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Building your practice set…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start practicing
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
            Creating questions and step-by-step hints just for you…
          </p>
        </div>
      )}

      {safetyNotice && !generate.isPending && (
        safetyNotice.crisis ? (
          <Card
            className="mb-8 border-lys-red/40 bg-lys-red/5"
            data-testid="notice-crisis"
          >
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-center gap-2">
                <HeartHandshake className="h-5 w-5 shrink-0 text-lys-red" />
                <h2 className="font-oswald text-lg font-semibold">
                  {safetyNotice.resources?.headline ?? "Help is available right now."}
                </h2>
              </div>
              <ul className="space-y-2">
                {(safetyNotice.resources?.lines ?? []).map((line, i) => (
                  <li
                    key={i}
                    className="rounded-md border border-lys-red/20 bg-background px-3 py-2 font-roboto text-sm"
                    data-testid={`text-crisis-resource-${i}`}
                  >
                    {line}
                  </li>
                ))}
              </ul>
              {safetyNotice.resources?.note && (
                <p className="font-roboto text-sm text-muted-foreground">
                  {safetyNotice.resources.note}
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8 border-border" data-testid="notice-blocked">
            <CardContent className="flex items-start gap-2 pt-6">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <p className="font-roboto text-sm" data-testid="text-blocked-message">
                {safetyNotice.message ||
                  "We can't create practice for that. Please try an academic topic."}
              </p>
            </CardContent>
          </Card>
        )
      )}

      {result && !generate.isPending && (
        <div className="space-y-4" data-testid="section-practice-results">
          <AiGeneratedLabel />
          <div className="flex flex-wrap items-center gap-3">
            <BookOpen className="h-5 w-5 text-lys-teal" />
            <h2 className="font-oswald text-xl font-semibold" data-testid="text-result-title">
              {result.title}
            </h2>
            <Badge variant="secondary" className="capitalize" data-testid="badge-difficulty">
              {result.difficulty}
            </Badge>
          </div>
          {result.questions.map((q, i) => (
            <QuestionCard key={q.id} question={q} index={i} />
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
          topic: form.topic,
          selectedSubject: form.subject,
          gradeLevel: form.gradeLevel,
        }}
        hardWall
        returnTo="/practice"
      />
    </div>
  );
}
