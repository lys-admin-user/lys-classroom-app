import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, RotateCcw, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import {
  SEGMENTS,
  URGENCY_OPTIONS,
  getOrCreateAnalyzerSessionId,
  markAnalyzerSeen,
  saveAnalyzerDraft,
  loadAnalyzerDraft,
  clearAnalyzerDraft,
  postKeepalive,
  type AnalyzerIdentity,
  type AnalyzerUrgency,
} from "@/lib/needsAnalyzer";

interface NeedsAnalyzerProps {
  onComplete?: () => void;
  className?: string;
}

type Step = 1 | 2 | 3 | 4 | "result";

export function NeedsAnalyzer({ onComplete, className }: NeedsAnalyzerProps) {
  const [step, setStep] = useState<Step>(1);
  const [identity, setIdentity] = useState<AnalyzerIdentity | null>(null);
  const [corePain, setCorePain] = useState<string>("");
  const [urgency, setUrgency] = useState<AnalyzerUrgency | null>(null);
  const [desiredOutcome, setDesiredOutcome] = useState<string>("");
  const hydrated = useRef(false);

  // Hydrate from localStorage draft on first mount so a visitor can pick up
  // where they left off after a refresh / closed modal.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const draft = loadAnalyzerDraft();
    if (!draft) return;
    if (draft.identity && SEGMENTS[draft.identity]) setIdentity(draft.identity);
    if (typeof draft.corePain === "string") setCorePain(draft.corePain);
    if (draft.urgency) setUrgency(draft.urgency);
    if (typeof draft.desiredOutcome === "string") setDesiredOutcome(draft.desiredOutcome);
    if (draft.step === "result" || (typeof draft.step === "number" && draft.step >= 1 && draft.step <= 4)) {
      setStep(draft.step as Step);
    }
  }, []);

  // Persist draft on every state change after hydration.
  useEffect(() => {
    if (!hydrated.current) return;
    if (step === "result") return; // result-state draft handled at submit/clear time
    saveAnalyzerDraft({
      step,
      identity: identity ?? undefined,
      corePain: corePain || undefined,
      urgency: urgency ?? undefined,
      desiredOutcome: desiredOutcome || undefined,
    });
  }, [step, identity, corePain, urgency, desiredOutcome]);

  const segment = identity ? SEGMENTS[identity] : null;
  const totalSteps = 4;
  const progressValue = step === "result" ? 100 : ((Number(step) - 1) / totalSteps) * 100;

  const submitResponse = async (final: {
    identity: AnalyzerIdentity;
    corePain: string;
    urgency: AnalyzerUrgency;
    desiredOutcome: string;
  }) => {
    try {
      const sessionId = getOrCreateAnalyzerSessionId();
      const seg = SEGMENTS[final.identity];
      await apiRequest("POST", "/api/needs-analyzer/submit", {
        sessionId,
        identity: final.identity,
        corePain: final.corePain,
        urgency: final.urgency,
        desiredOutcome: final.desiredOutcome,
        ctaShown: seg.cta.type,
      });
      markAnalyzerSeen();
      clearAnalyzerDraft();
    } catch (e) {
      // Non-fatal: still show the result so the visitor gets value even if
      // analytics logging fails. Draft remains so we can retry on next visit.
      console.warn("Needs analyzer submit failed:", e);
    }
  };

  const trackCtaClick = (cta: string) => {
    // Use keepalive POST so the request survives the imminent navigation.
    const sessionId = getOrCreateAnalyzerSessionId();
    postKeepalive("/api/needs-analyzer/cta-click", { sessionId, ctaClicked: cta });
  };

  const goToResult = (urg: AnalyzerUrgency, outcome: string) => {
    if (!identity) return;
    setUrgency(urg);
    setDesiredOutcome(outcome);
    setStep("result");
    submitResponse({ identity, corePain, urgency: urg, desiredOutcome: outcome }).catch(() => {});
  };

  const goBack = () => {
    if (step === "result") { setStep(4); return; }
    if (typeof step === "number" && step > 1) setStep((step - 1) as Step);
  };

  const startOver = () => {
    setIdentity(null);
    setCorePain("");
    setUrgency(null);
    setDesiredOutcome("");
    clearAnalyzerDraft();
    setStep(1);
  };

  return (
    <div className={className} data-testid="needs-analyzer">
      {/* Step header */}
      {step !== "result" && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 font-roboto">
            <div className="flex items-center gap-2">
              {Number(step) > 1 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  data-testid="button-analyzer-back"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back
                </button>
              )}
              <span data-testid="text-step-counter">Question {Number(step)} of {totalSteps}</span>
            </div>
            <span>About 60 seconds total</span>
          </div>
          <Progress value={progressValue} className="h-1.5" />
        </div>
      )}

      {/* Q1 — Identity */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-oswald text-2xl">Who are you?</CardTitle>
            <CardDescription>So we can show you what LYS does for your situation specifically.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.keys(SEGMENTS) as AnalyzerIdentity[]).map(id => {
              const s = SEGMENTS[id];
              const Icon = s.icon;
              return (
                <Button
                  key={id}
                  variant="outline"
                  className="h-auto justify-start py-4 px-4 text-left hover-elevate active-elevate-2"
                  onClick={() => {
                    setIdentity(id);
                    setStep(2);
                  }}
                  data-testid={`button-identity-${id}`}
                >
                  <Icon className="h-5 w-5 mr-3 flex-shrink-0 text-lys-teal" />
                  <span className="font-medium font-roboto">{s.label}</span>
                </Button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Q2 — Core Pain (segment-driven) */}
      {step === 2 && segment && (
        <Card>
          <CardHeader>
            <CardTitle className="font-oswald text-2xl">What's your biggest challenge right now?</CardTitle>
            <CardDescription>Pick the one that fits closest. There are no wrong answers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {segment.pains.map(p => (
              <Button
                key={p}
                variant="outline"
                className="w-full h-auto justify-start py-3 px-4 text-left whitespace-normal hover-elevate active-elevate-2"
                onClick={() => {
                  setCorePain(p);
                  setStep(3);
                }}
                data-testid={`button-pain-${p.slice(0, 20).replace(/\s+/g, "-").toLowerCase()}`}
              >
                <span className="font-roboto">{p}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Q3 — Urgency */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-oswald text-2xl">Where are you in the journey?</CardTitle>
            <CardDescription>Helps us show the right next step.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {URGENCY_OPTIONS.map(u => (
              <Button
                key={u.value}
                variant="outline"
                className="w-full h-auto justify-start py-3 px-4 text-left hover-elevate active-elevate-2"
                onClick={() => {
                  setUrgency(u.value);
                  setStep(4);
                }}
                data-testid={`button-urgency-${u.value}`}
              >
                <span className="font-roboto">{u.label}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Q4 — Desired Outcome (segment-driven) */}
      {step === 4 && segment && urgency && (
        <Card>
          <CardHeader>
            <CardTitle className="font-oswald text-2xl">What does success look like for you?</CardTitle>
            <CardDescription>The outcome that matters most.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {segment.outcomes.map(o => (
              <Button
                key={o}
                variant="outline"
                className="w-full h-auto justify-start py-3 px-4 text-left whitespace-normal hover-elevate active-elevate-2"
                onClick={() => goToResult(urgency, o)}
                data-testid={`button-outcome-${o.slice(0, 20).replace(/\s+/g, "-").toLowerCase()}`}
              >
                <span className="font-roboto">{o}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {step === "result" && segment && (
        <Card className="border-2 border-lys-teal/40 bg-gradient-to-br from-lys-teal/5 to-background">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-lys-yellow" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide font-roboto">
                Your personalized fit
              </span>
            </div>
            <CardTitle className="font-oswald text-2xl">
              Based on what you shared, here's what LYS can do for you.
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-md border bg-background/60 p-3 space-y-1.5 text-sm font-roboto" data-testid="text-result-summary">
              <div><span className="text-muted-foreground">You said you're </span><span className="font-medium">{segment.label.toLowerCase()}</span><span className="text-muted-foreground">.</span></div>
              {corePain && <div><span className="text-muted-foreground">Biggest challenge: </span><span className="font-medium">{corePain}</span></div>}
              {desiredOutcome && <div><span className="text-muted-foreground">What success looks like: </span><span className="font-medium">{desiredOutcome}</span></div>}
            </div>

            <p className="text-base font-roboto leading-relaxed text-foreground" data-testid="text-segment-vp">
              {segment.valueProp}
            </p>

            <div className="pt-2">
              <Button
                asChild
                size="lg"
                className="w-full bg-lys-red hover:bg-lys-red/90 text-white font-oswald gap-2"
                data-testid="button-result-cta"
              >
                <a
                  href={segment.cta.href}
                  onClick={() => {
                    trackCtaClick(segment.cta.type);
                    if (onComplete) onComplete();
                  }}
                >
                  {segment.cta.label}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2 font-roboto">
                <Check className="h-3 w-3 inline mr-1" />
                One next step. No menus. No confusion.
              </p>
              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={startOver}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-roboto"
                  data-testid="button-analyzer-start-over"
                >
                  <RotateCcw className="h-3 w-3" />
                  Not quite right? Start over
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
