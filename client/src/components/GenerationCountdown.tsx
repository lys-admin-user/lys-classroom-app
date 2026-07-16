import { useEffect, useState } from "react";
import { Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type GenerationPhase =
  | "studying"
  | "channeling-voice"
  | "drafting"
  | "polishing"
  | "done";

export type FallbackSource = "cache" | "exemplar" | null;

const PHASES: { key: GenerationPhase; label: string; sublabel: string; etaSeconds: number }[] = [
  { key: "studying", label: "Studying your topic", sublabel: "Pulling standards, prior lessons, and context", etaSeconds: 2 },
  { key: "channeling-voice", label: "Channeling LYS voice", sublabel: "Retrieving Master Teacher exemplars", etaSeconds: 3 },
  { key: "drafting", label: "Drafting", sublabel: "Writing in real time — watch below", etaSeconds: 22 },
  { key: "polishing", label: "Polishing the voice", sublabel: "Critic pass for tone, rhythm, and intent", etaSeconds: 8 },
  { key: "done", label: "Ready", sublabel: "Done.", etaSeconds: 0 },
];

interface Props {
  phase: GenerationPhase;
  deltaTail: string;
  fallbackSource?: FallbackSource;
  fallbackWarning?: string | null;
  personalNote?: string | null;
  className?: string;
}

export function GenerationCountdown({ phase, deltaTail, fallbackSource, fallbackWarning, personalNote, className }: Props) {
  const phaseIndex = Math.max(0, PHASES.findIndex((p) => p.key === phase));
  const totalEta = PHASES.reduce((s, p) => s + p.etaSeconds, 0);
  const elapsedEta = PHASES.slice(0, phaseIndex).reduce((s, p) => s + p.etaSeconds, 0);
  const progressPct = Math.min(100, Math.max(2, (elapsedEta / totalEta) * 100));

  const [secondsLeft, setSecondsLeft] = useState(totalEta - elapsedEta);
  useEffect(() => {
    setSecondsLeft(Math.max(0, totalEta - elapsedEta));
    if (phase === "done") return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [phase, elapsedEta, totalEta]);

  const current = PHASES[phaseIndex];

  return (
    <div
      data-testid="generation-countdown"
      className={cn(
        "rounded-xl border bg-card p-6 shadow-sm",
        "border-primary/20",
        className,
      )}
    >
      {fallbackSource && (
        <div
          data-testid="fallback-warning-banner"
          className="mb-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-3 text-sm"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="text-amber-900 dark:text-amber-100">
            <strong>Heads up:</strong> {fallbackWarning ?? "Live AI was unavailable — showing the closest match we have on file."}
          </div>
        </div>
      )}

      {personalNote && (
        <div
          data-testid="text-personal-note"
          className="mb-4 flex items-start gap-2 rounded-lg border border-primary/25 bg-primary/5 p-3 text-sm"
        >
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="text-foreground">{personalNote}</div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
          <div className="relative rounded-full bg-primary p-2">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div
            key={current.key}
            data-testid="text-current-phase"
            className="font-semibold text-foreground transition-all duration-300 animate-in fade-in slide-in-from-left-2"
          >
            {current.label}
          </div>
          <div className="text-xs text-muted-foreground" data-testid="text-phase-sublabel">
            {current.sublabel}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-2xl font-bold text-primary tabular-nums" data-testid="text-eta-seconds">
            {phase === "done" ? "✓" : `${secondsLeft}s`}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {phase === "done" ? "ready" : "est. remaining"}
          </div>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-700 ease-out"
          style={{ width: `${progressPct}%` }}
          data-testid="progress-bar"
        />
      </div>

      <div className="mt-3 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        {PHASES.slice(0, -1).map((p, i) => (
          <span
            key={p.key}
            data-testid={`phase-marker-${p.key}`}
            className={cn(
              "transition-colors",
              i <= phaseIndex - 1 ? "text-primary font-semibold" : i === phaseIndex ? "text-foreground font-semibold" : "",
            )}
          >
            {p.label.split(" ")[0]}
          </span>
        ))}
      </div>

      {phase === "drafting" && deltaTail && (
        <div className="mt-4 relative">
          <div className="rounded-lg border border-primary/10 bg-muted/50 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Live thinking</div>
            <div
              data-testid="text-thinking-ticker"
              className="font-mono text-xs text-foreground/70 leading-relaxed h-12 overflow-hidden whitespace-pre-wrap break-all"
              style={{ maskImage: "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)" }}
            >
              {deltaTail.slice(-160)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
