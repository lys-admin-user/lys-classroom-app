import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Compass, Lock, Mail, Sparkles } from "lucide-react";
import {
  STUDENT_PAIN_POINT_OPTIONS,
  STUDENT_MOTIVATION_OPTIONS,
  STUDENT_GRADE_OPTIONS,
  PAIN_POINT_TO_FEATURE,
  FEATURE_SPOTLIGHTS,
  getOrCreateStudentSignupSessionId,
  saveStudentSignupAnswers,
  loadStudentSignupAnswers,
  type StudentPainPoint,
  type StudentMotivation,
  type StudentSignupAnswers,
} from "@/lib/studentSignup";
import { TurnstileWidget } from "@/components/TurnstileWidget";

const SIGNUP_DEST = "/sign-up";

// Best-effort background save — never blocks or breaks the flow.
function submitToServer(answers: StudentSignupAnswers, skipped: boolean, captchaToken?: string): void {
  try {
    const sessionId = getOrCreateStudentSignupSessionId();
    void fetch("/api/student-signup/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      keepalive: true,
      body: JSON.stringify({
        sessionId,
        captchaToken: captchaToken || undefined,
        email: answers.email || null,
        painPoint: answers.painPoint || null,
        motivation: answers.motivation || null,
        gradeLevel: answers.gradeLevel || null,
        state: answers.state || null,
        skipped,
      }),
    });
  } catch {
    /* best-effort */
  }
}

type Step = 1 | 2 | 3 | 4;

export default function StudentSignupQuiz() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>(1);
  const [painPoint, setPainPoint] = useState<StudentPainPoint | undefined>();
  const [motivation, setMotivation] = useState<StudentMotivation | undefined>();
  const [gradeLevel, setGradeLevel] = useState("");
  const [stateAbbr, setStateAbbr] = useState("");
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    document.title = "Find your path — LYS";
    const prior = loadStudentSignupAnswers();
    if (prior) {
      if (prior.painPoint) setPainPoint(prior.painPoint);
      if (prior.motivation) setMotivation(prior.motivation);
      if (prior.gradeLevel) setGradeLevel(prior.gradeLevel);
      if (prior.state) setStateAbbr(prior.state);
      if (prior.email) {
        setEmail(prior.email);
        setUnlocked(true);
      }
    }
  }, []);

  const { data: statesData } = useQuery<{ state: string; abbreviation: string; standardsName: string }[]>({
    queryKey: ["/api/standards/states", "United States"],
  });
  const states = statesData || [];

  const recommendedFeature = painPoint ? PAIN_POINT_TO_FEATURE[painPoint] : "careers";
  const spotlight = FEATURE_SPOTLIGHTS[recommendedFeature];

  const answers: StudentSignupAnswers = useMemo(
    () => ({
      painPoint,
      motivation,
      gradeLevel: gradeLevel || undefined,
      state: stateAbbr || undefined,
      email: email.trim() || undefined,
      recommendedFeature: painPoint ? PAIN_POINT_TO_FEATURE[painPoint] : undefined,
    }),
    [painPoint, motivation, gradeLevel, stateAbbr, email],
  );

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const persist = (skippedAll: boolean) => {
    const final = { ...answers, completedAt: new Date().toISOString() };
    saveStudentSignupAnswers(final);
    submitToServer(final, skippedAll, captchaToken);
  };

  const skipEverything = () => {
    persist(true);
    setLocation(SIGNUP_DEST);
  };

  const unlock = () => {
    setUnlocked(true);
    persist(false);
  };

  const goSignUp = () => {
    persist(false);
    setLocation(SIGNUP_DEST);
  };

  const progress = ((step - 1) / 4) * 100;

  return (
    <div className="min-h-screen bg-background" data-testid="page-student-signup-quiz">
      <div className="max-w-xl mx-auto px-4 py-10 sm:py-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3 text-lys-teal">
            <Compass className="h-5 w-5" />
            <span className="text-xs font-medium uppercase tracking-wide font-roboto">For students</span>
          </div>
          <h1 className="font-oswald text-3xl mb-2" data-testid="text-student-quiz-title">
            Let's find your path
          </h1>
          <p className="text-muted-foreground font-roboto text-sm max-w-md mx-auto">
            Three quick questions — then we'll point you at the tool built for exactly what you need.
          </p>
        </div>

        <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground font-roboto">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as Step)}
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                data-testid="button-student-quiz-back"
              >
                <ArrowLeft className="h-3 w-3" />
                Back
              </button>
            )}
            <span data-testid="text-student-quiz-step">Step {step} of 4</span>
          </div>
          <button
            type="button"
            onClick={skipEverything}
            className="hover:text-foreground transition-colors underline-offset-2 underline"
            data-testid="button-student-quiz-skip-all"
          >
            Skip — just sign me up
          </button>
        </div>
        <Progress value={progress} className="h-1.5 mb-6" />

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-oswald text-2xl">What's your biggest challenge right now?</CardTitle>
              <CardDescription>Be honest — this is how we pick your starting point.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {STUDENT_PAIN_POINT_OPTIONS.map((o) => (
                <Button
                  key={o.value}
                  variant={painPoint === o.value ? "default" : "outline"}
                  className="w-full h-auto justify-start py-3 px-4 text-left whitespace-normal hover-elevate active-elevate-2"
                  onClick={() => {
                    setPainPoint(o.value);
                    setStep(2);
                  }}
                  data-testid={`button-pain-${o.value}`}
                >
                  <span className="font-roboto">{o.label}</span>
                </Button>
              ))}
              <div className="text-center pt-1">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 font-roboto"
                  onClick={() => setStep(2)}
                  data-testid="button-skip-pain"
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
              <CardTitle className="font-oswald text-2xl">What grade are you in, and where?</CardTitle>
              <CardDescription>So everything you see fits your grade and your state.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="font-roboto">Grade</Label>
                <Select value={gradeLevel} onValueChange={setGradeLevel}>
                  <SelectTrigger data-testid="select-student-quiz-grade">
                    <SelectValue placeholder="Choose your grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {STUDENT_GRADE_OPTIONS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-roboto">State</Label>
                <Select value={stateAbbr} onValueChange={setStateAbbr}>
                  <SelectTrigger data-testid="select-student-quiz-state">
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
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 font-roboto"
                  onClick={() => setStep(3)}
                  data-testid="button-skip-grade-state"
                >
                  Skip this question
                </button>
                <Button onClick={() => setStep(3)} data-testid="button-student-quiz-continue">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-oswald text-2xl">What would make school feel more worth it?</CardTitle>
              <CardDescription>There's no wrong answer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {STUDENT_MOTIVATION_OPTIONS.map((o) => (
                <Button
                  key={o.value}
                  variant={motivation === o.value ? "default" : "outline"}
                  className="w-full h-auto justify-start py-3 px-4 text-left whitespace-normal hover-elevate active-elevate-2"
                  onClick={() => {
                    setMotivation(o.value);
                    setStep(4);
                  }}
                  data-testid={`button-motivation-${o.value}`}
                >
                  <span className="font-roboto">{o.label}</span>
                </Button>
              ))}
              <div className="text-center pt-1">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 font-roboto"
                  onClick={() => setStep(4)}
                  data-testid="button-skip-motivation"
                >
                  Skip this question
                </button>
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
                  Your starting point
                </span>
              </div>
              <CardTitle className="font-oswald text-2xl" data-testid="text-student-quiz-reveal-title">
                {unlocked ? spotlight.title : "We found where you should start"}
              </CardTitle>
              <CardDescription>
                {unlocked
                  ? spotlight.description
                  : "Drop your email and we'll show you the tool matched to your answers (plus save your spot)."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!unlocked ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="font-roboto">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        className="pl-9"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        data-testid="input-student-quiz-email"
                      />
                    </div>
                  </div>
                  <TurnstileWidget onToken={setCaptchaToken} />
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 font-roboto"
                      onClick={goSignUp}
                      data-testid="button-student-quiz-no-email"
                    >
                      No thanks — sign me up anyway
                    </button>
                    <Button onClick={unlock} disabled={!emailLooksValid} data-testid="button-student-quiz-unlock">
                      <Lock className="mr-2 h-4 w-4" />
                      Show my match
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="rounded-lg border bg-muted/40 p-4 font-roboto text-sm"
                    data-testid="text-student-quiz-spotlight"
                  >
                    <p className="font-medium mb-1">{spotlight.title}</p>
                    <p className="text-muted-foreground">{spotlight.description}</p>
                  </div>
                  <p className="text-xs text-muted-foreground font-roboto">
                    Create your free account and we'll take you straight there — with everything already set to your
                    grade{stateAbbr ? " and state" : ""}.
                  </p>
                  <div className="flex justify-end">
                    <Button onClick={goSignUp} data-testid="button-student-quiz-signup">
                      Create my free account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
