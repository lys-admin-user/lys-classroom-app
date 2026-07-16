import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Mail, PenTool, Sparkles } from "lucide-react";
import { US_GRADE_OPTIONS } from "@shared/gradeLevels";
import {
  FRUSTRATION_OPTIONS,
  PLANNING_STYLE_OPTIONS,
  getOrCreateTeacherSignupSessionId,
  saveTeacherSignupAnswers,
  loadTeacherSignupAnswers,
  type TeacherFrustration,
  type TeacherPlanningStyle,
  type TeacherSignupAnswers,
} from "@/lib/teacherSignup";

const DEST = "/lesson-generator";

// Best-effort background save — never blocks or breaks the flow.
function submitToServer(answers: TeacherSignupAnswers, skipped: boolean): void {
  try {
    const sessionId = getOrCreateTeacherSignupSessionId();
    void fetch("/api/teacher-signup/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      keepalive: true,
      body: JSON.stringify({
        sessionId,
        email: answers.email || null,
        frustration: answers.frustration || null,
        planningStyle: answers.planningStyle || null,
        country: answers.country || null,
        state: answers.state || null,
        subject: answers.subject || null,
        gradeLevel: answers.gradeLevel || null,
        skipped,
      }),
    });
  } catch {
    /* best-effort */
  }
}

type Step = 1 | 2 | 3 | 4;

export default function TeacherSignupQuiz() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>(1);
  const [frustration, setFrustration] = useState<TeacherFrustration | undefined>();
  const [planningStyle, setPlanningStyle] = useState<TeacherPlanningStyle | undefined>();
  const [stateAbbr, setStateAbbr] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    document.title = "Quick questions — LYS";
    const prior = loadTeacherSignupAnswers();
    if (prior) {
      if (prior.frustration) setFrustration(prior.frustration);
      if (prior.planningStyle) setPlanningStyle(prior.planningStyle);
      if (prior.state) setStateAbbr(prior.state);
      if (prior.subject) setSubject(prior.subject);
      if (prior.gradeLevel) setGradeLevel(prior.gradeLevel);
      if (prior.email) setEmail(prior.email);
    }
  }, []);

  const { data: statesData } = useQuery<{ state: string; abbreviation: string; standardsName: string }[]>({
    queryKey: ["/api/standards/states", "United States"],
  });
  const states = statesData || [];

  const { data: subjectsData } = useQuery<{ subject: string }[]>({
    queryKey: ["/api/standards/subjects", "United States", stateAbbr],
    queryFn: async () => {
      const res = await fetch(
        `/api/standards/subjects/${encodeURIComponent("United States")}/${encodeURIComponent(stateAbbr)}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    enabled: !!stateAbbr,
  });
  const subjects = subjectsData || [];

  const answers: TeacherSignupAnswers = useMemo(
    () => ({
      frustration,
      planningStyle,
      country: stateAbbr ? "United States" : undefined,
      state: stateAbbr || undefined,
      subject: subject || undefined,
      gradeLevel: gradeLevel || undefined,
      email: email || undefined,
    }),
    [frustration, planningStyle, stateAbbr, subject, gradeLevel, email],
  );

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const finish = (skippedAll: boolean) => {
    const final = { ...answers, completedAt: new Date().toISOString() };
    saveTeacherSignupAnswers(final);
    submitToServer(final, skippedAll);
    setLocation(DEST);
  };

  const skipEverything = () => finish(true);

  const progress = ((step - 1) / 4) * 100;

  return (
    <div className="min-h-screen bg-background" data-testid="page-teacher-signup-quiz">
      <div className="max-w-xl mx-auto px-4 py-10 sm:py-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3 text-lys-teal">
            <PenTool className="h-5 w-5" />
            <span className="text-xs font-medium uppercase tracking-wide font-roboto">For teachers</span>
          </div>
          <h1 className="font-oswald text-3xl mb-2" data-testid="text-quiz-title">
            Three quick questions
          </h1>
          <p className="text-muted-foreground font-roboto text-sm max-w-md mx-auto">
            Totally optional — but they make your first lesson instantly relevant to your classroom.
          </p>
        </div>

        <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground font-roboto">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as Step)}
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                data-testid="button-quiz-back"
              >
                <ArrowLeft className="h-3 w-3" />
                Back
              </button>
            )}
            <span data-testid="text-quiz-step">Step {step} of 4</span>
          </div>
          <button
            type="button"
            onClick={skipEverything}
            className="hover:text-foreground transition-colors underline-offset-2 underline"
            data-testid="button-quiz-skip-all"
          >
            Skip — take me to my free lesson
          </button>
        </div>
        <Progress value={progress} className="h-1.5 mb-6" />

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-oswald text-2xl">What's your biggest classroom frustration?</CardTitle>
              <CardDescription>We'll show you how your free lesson tackles it.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {FRUSTRATION_OPTIONS.map((o) => (
                <Button
                  key={o.value}
                  variant={frustration === o.value ? "default" : "outline"}
                  className="w-full h-auto justify-start py-3 px-4 text-left whitespace-normal hover-elevate active-elevate-2"
                  onClick={() => {
                    setFrustration(o.value);
                    setStep(2);
                  }}
                  data-testid={`button-frustration-${o.value}`}
                >
                  <span className="font-roboto">{o.label}</span>
                </Button>
              ))}
              <div className="text-center pt-1">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 font-roboto"
                  onClick={() => setStep(2)}
                  data-testid="button-skip-frustration"
                >
                  Skip this question
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-oswald text-2xl">How do you plan lessons today?</CardTitle>
              <CardDescription>No wrong answers — it helps us meet you where you are.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {PLANNING_STYLE_OPTIONS.map((o) => (
                <Button
                  key={o.value}
                  variant={planningStyle === o.value ? "default" : "outline"}
                  className="w-full h-auto justify-start py-3 px-4 text-left whitespace-normal hover-elevate active-elevate-2"
                  onClick={() => {
                    setPlanningStyle(o.value);
                    setStep(3);
                  }}
                  data-testid={`button-planning-${o.value}`}
                >
                  <span className="font-roboto">{o.label}</span>
                </Button>
              ))}
              <div className="text-center pt-1">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 font-roboto"
                  onClick={() => setStep(3)}
                  data-testid="button-skip-planning"
                >
                  Skip this question
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-oswald text-2xl">Where and what do you teach?</CardTitle>
              <CardDescription>So your free lesson is aligned to YOUR standards on the first try.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="font-roboto">State</Label>
                <Select value={stateAbbr} onValueChange={(v) => { setStateAbbr(v); setSubject(""); }}>
                  <SelectTrigger data-testid="select-quiz-state">
                    <SelectValue placeholder="Choose your state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((s) => (
                      <SelectItem key={s.abbreviation} value={s.abbreviation}>
                        {s.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-roboto">Grade level</Label>
                <Select value={gradeLevel} onValueChange={setGradeLevel}>
                  <SelectTrigger data-testid="select-quiz-grade">
                    <SelectValue placeholder="Choose a grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_GRADE_OPTIONS.filter((g) => !g.disabled).map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-roboto">Subject</Label>
                {subjects.length > 0 ? (
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger data-testid="select-quiz-subject">
                      <SelectValue placeholder="Choose a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.subject} value={s.subject}>
                          {s.subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={stateAbbr ? "e.g. Math, English, Science" : "Pick a state first (or type a subject)"}
                    data-testid="input-quiz-subject"
                  />
                )}
              </div>
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 font-roboto"
                  onClick={() => setStep(4)}
                  data-testid="button-skip-location"
                >
                  Skip this question
                </button>
                <Button onClick={() => setStep(4)} data-testid="button-quiz-continue">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-1 text-lys-yellow">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground font-roboto">
                  Last step
                </span>
              </div>
              <CardTitle className="font-oswald text-2xl">Where should we send your free lesson tips?</CardTitle>
              <CardDescription>
                Optional. We'll use it to follow up with teaching resources — no spam, ever.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="font-roboto">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@school.org"
                    data-testid="input-quiz-email"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 font-roboto"
                  onClick={() => finish(false)}
                  data-testid="button-skip-email"
                >
                  No thanks
                </button>
                <Button
                  onClick={() => finish(false)}
                  disabled={email.trim().length > 0 && !emailLooksValid}
                  data-testid="button-quiz-finish"
                >
                  Generate my free lesson
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
