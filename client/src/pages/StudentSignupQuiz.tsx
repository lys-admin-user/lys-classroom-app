import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Compass, Mail, Sparkles } from "lucide-react";
import {
  STUDENT_PAIN_POINT_OPTIONS,
  STUDENT_MOTIVATION_OPTIONS,
  STUDENT_GRADE_OPTIONS,
  PAIN_POINT_TO_FEATURE,
  FEATURE_SPOTLIGHTS,
  CAREER_TEASERS,
  STRENGTH_TEASER_QUESTIONS,
  STRENGTH_RESULTS,
  SAMPLE_WEEK_PLANS,
  SAMPLE_PORTFOLIO_ITEMS,
  getOrCreateStudentSignupSessionId,
  saveStudentSignupAnswers,
  loadStudentSignupAnswers,
  type StudentPainPoint,
  type StudentMotivation,
  type StudentRecommendedFeature,
  type StudentSignupAnswers,
} from "@/lib/studentSignup";
import { TurnstileWidget, isCaptchaEnabled } from "@/components/TurnstileWidget";

const SIGNUP_DEST = "/sign-up";

// Background save. Resolves true only when the server accepted the submission,
// so callers can distinguish best-effort analytics from a user-facing "saved".
async function submitToServer(
  answers: StudentSignupAnswers,
  skipped: boolean,
  captchaToken?: string,
): Promise<boolean> {
  try {
    const sessionId = getOrCreateStudentSignupSessionId();
    const res = await fetch("/api/student-signup/submit", {
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
    return res.ok;
  } catch {
    return false;
  }
}

// Stable fingerprint of the answers a snapshot was saved with, so the "Saved"
// state only shows while the current answers still match what was persisted.
function answersFingerprint(a: StudentSignupAnswers): string {
  return JSON.stringify([a.painPoint, a.motivation, a.gradeLevel, a.state, a.email]);
}

type Step = 1 | 2 | 3 | 4;

// The "first win" — a real taste of the matched feature, shown BEFORE any
// email or signup ask so students feel the value first.
function FeatureWin({
  feature,
  motivation,
}: {
  feature: StudentRecommendedFeature;
  motivation?: StudentMotivation;
}) {
  const [strengthPicks, setStrengthPicks] = useState<string[]>([]);

  if (feature === "careers") {
    const teasers = CAREER_TEASERS[motivation ?? "real_world"];
    return (
      <div className="space-y-2" data-testid="win-careers">
        <p className="text-sm font-roboto text-muted-foreground">
          Based on your answers, here are 3 careers worth a look:
        </p>
        {teasers.map((c) => (
          <div key={c.title} className="rounded-lg border p-3 font-roboto" data-testid={`card-career-teaser-${c.title.replace(/\s+/g, "-").toLowerCase()}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm">{c.title}</p>
              <span className="text-xs text-lys-teal font-medium shrink-0">{c.pay}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{c.path}</p>
            <p className="text-xs mt-1">{c.hook}</p>
          </div>
        ))}
        <p className="text-xs text-muted-foreground font-roboto pt-1">
          That's 3 of 800+ in the Career Explorer — each with full pay, path, and day-in-the-life details.
        </p>
      </div>
    );
  }

  if (feature === "self_discovery") {
    const done = strengthPicks.length >= STRENGTH_TEASER_QUESTIONS.length;
    if (!done) {
      const q = STRENGTH_TEASER_QUESTIONS[strengthPicks.length];
      return (
        <div className="space-y-2" data-testid="win-strengths">
          <p className="text-xs text-muted-foreground font-roboto">
            Quick taste — {strengthPicks.length + 1} of {STRENGTH_TEASER_QUESTIONS.length}
          </p>
          <p className="font-medium text-sm font-roboto">{q.question}</p>
          {q.options.map((o) => (
            <Button
              key={o.label}
              variant="outline"
              className="w-full h-auto justify-start py-2.5 px-3 text-left whitespace-normal hover-elevate active-elevate-2"
              onClick={() => setStrengthPicks((p) => [...p, o.strength])}
              data-testid={`button-strength-${o.strength.toLowerCase()}-${strengthPicks.length}`}
            >
              <span className="font-roboto text-sm">{o.label}</span>
            </Button>
          ))}
        </div>
      );
    }
    const counts = strengthPicks.reduce<Record<string, number>>((acc, s) => ({ ...acc, [s]: (acc[s] ?? 0) + 1 }), {});
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    const result = STRENGTH_RESULTS[top];
    return (
      <div className="rounded-lg border bg-muted/40 p-4 font-roboto space-y-1.5" data-testid="win-strength-result">
        <p className="text-xs uppercase tracking-wide text-lys-teal font-medium">Your top strength</p>
        <p className="font-medium">{result.title}</p>
        <p className="text-sm text-muted-foreground">{result.meaning}</p>
        <p className="text-xs text-muted-foreground pt-1">{result.nextStep}</p>
      </div>
    );
  }

  if (feature === "goals") {
    const plan = SAMPLE_WEEK_PLANS[motivation ?? "clear_plan"];
    return (
      <div className="space-y-2" data-testid="win-goals">
        <p className="text-sm font-roboto text-muted-foreground">
          Here's what your first week could look like:
        </p>
        <div className="rounded-lg border p-3 space-y-2">
          {plan.map((line, i) => (
            <div key={i} className="flex items-start gap-2 font-roboto text-sm" data-testid={`text-plan-step-${i}`}>
              <span className="mt-0.5 h-4 w-4 rounded-full border border-lys-teal text-lys-teal text-[10px] flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span>{line}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground font-roboto pt-1">
          My Journey tracks every check-off — the streak is the secret.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="win-portfolio">
      <p className="text-sm font-roboto text-muted-foreground">
        Here's what your portfolio could look like by the end of the semester:
      </p>
      <div className="rounded-lg border divide-y">
        {SAMPLE_PORTFOLIO_ITEMS.map((item) => (
          <div key={item.title} className="p-3 font-roboto" data-testid={`card-portfolio-sample-${item.type.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm">{item.title}</p>
              <span className="text-[10px] uppercase tracking-wide text-lys-teal shrink-0">{item.type}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{item.note}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground font-roboto pt-1">
        Every item is shareable with colleges, employers, and mentors — one link.
      </p>
    </div>
  );
}

export default function StudentSignupQuiz() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>(1);
  const [painPoint, setPainPoint] = useState<StudentPainPoint | undefined>();
  const [motivation, setMotivation] = useState<StudentMotivation | undefined>();
  const [gradeLevel, setGradeLevel] = useState("");
  const [stateAbbr, setStateAbbr] = useState("");
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [savedFingerprint, setSavedFingerprint] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const autoRecordedRef = useRef(false);

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
        setSavedFingerprint(answersFingerprint(prior));
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

  // "Saved" only shows while the current answers still match the last
  // successfully-persisted snapshot — editing answers clears it.
  const saved = savedFingerprint !== null && savedFingerprint === answersFingerprint(answers);

  const persist = (skippedAll: boolean): Promise<boolean> => {
    const final = { ...answers, completedAt: new Date().toISOString() };
    saveStudentSignupAnswers(final);
    return submitToServer(final, skippedAll, captchaToken);
  };

  const skipEverything = () => {
    persist(true);
    setLocation(SIGNUP_DEST);
  };

  const saveResults = async () => {
    setSaveError(false);
    setSaving(true);
    const ok = await persist(false);
    setSaving(false);
    if (ok) {
      setSavedFingerprint(answersFingerprint(answers));
    } else {
      setSaveError(true);
    }
  };

  // Record the (email-less) result as soon as the win is revealed, so the
  // funnel is measurable even for students who never leave an email. Only when
  // captcha is OFF — Turnstile tokens are single-use, so with captcha on the
  // token is reserved for the user-initiated save/signup submit instead.
  useEffect(() => {
    if (step === 4 && !autoRecordedRef.current && !isCaptchaEnabled()) {
      autoRecordedRef.current = true;
      void persist(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const goSignUp = () => {
    // Don't re-submit if the exact current answers were already persisted —
    // avoids burning an already-consumed captcha token on a no-op update.
    if (!saved) void persist(false);
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
                {spotlight.title}
              </CardTitle>
              <CardDescription>{spotlight.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <FeatureWin feature={recommendedFeature} motivation={motivation} />

              <div className="rounded-lg border border-dashed p-4 space-y-3">
                {!saved ? (
                  <>
                    <p className="text-sm font-roboto font-medium">Want to keep this?</p>
                    <p className="text-xs text-muted-foreground font-roboto">
                      Drop your email and we'll save your results — totally optional.
                    </p>
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
                    <TurnstileWidget onToken={setCaptchaToken} />
                    {saveError && (
                      <p className="text-xs text-destructive font-roboto" data-testid="text-student-quiz-save-error">
                        Couldn't save right now — please try again.
                      </p>
                    )}
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={saveResults}
                        disabled={!emailLooksValid || saving || (isCaptchaEnabled() && !captchaToken)}
                        data-testid="button-student-quiz-save"
                      >
                        {saving ? "Saving…" : "Save my results"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm font-roboto text-lys-teal" data-testid="text-student-quiz-saved">
                    Saved — your results will be waiting for you.
                  </p>
                )}
              </div>

              <p className="text-xs text-muted-foreground font-roboto">
                Create your free account and we'll take you straight to {spotlight.title} — with everything already
                set to your grade{stateAbbr ? " and state" : ""}.
              </p>
              <div className="flex justify-end">
                <Button onClick={goSignUp} data-testid="button-student-quiz-signup">
                  {spotlight.cta} — free account
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
