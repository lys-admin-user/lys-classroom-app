import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HelpCircle } from "lucide-react";

export type BkdAlignment = {
  being: boolean;
  knowing: boolean;
  doing: boolean;
  beingReason?: string;
  knowingReason?: string;
  doingReason?: string;
};

interface Props {
  alignment: BkdAlignment | null | undefined;
  size?: "sm" | "md";
  /** When true, clicking the badge opens a "Why this rating?" panel showing each pillar's reason. */
  interactive?: boolean;
}

export function ScholarshipBkdBadge({ alignment, size = "sm", interactive = true }: Props) {
  const [open, setOpen] = useState(false);
  const a = alignment || { being: false, knowing: false, doing: false };
  const total = (a.being ? 1 : 0) + (a.knowing ? 1 : 0) + (a.doing ? 1 : 0);
  const pillBase = size === "sm" ? "text-[10px] h-5 px-1.5" : "text-xs h-6 px-2";

  const pill = (label: string, on: boolean, reason: string | undefined, color: string) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center justify-center rounded font-oswald font-semibold border ${pillBase} ${
            on ? color : "bg-muted text-muted-foreground border-muted-foreground/20 opacity-50"
          }`}
          data-testid={`bkd-pill-${label.toLowerCase()}`}
        >
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] text-xs">
        <strong>{label}: {on ? "Yes" : "No"}</strong>
        {reason && <div className="opacity-80 mt-0.5">{reason}</div>}
      </TooltipContent>
    </Tooltip>
  );

  const inner = (
    <div
      className="inline-flex items-center gap-0.5 cursor-pointer"
      title={total === 3 ? "BKD-Aligned Opportunity" : "Click for rating details"}
      data-testid="bkd-badge"
    >
      {pill("B", a.being, a.beingReason, "bg-lys-yellow/20 text-lys-yellow border-lys-yellow/40")}
      {pill("K", a.knowing, a.knowingReason, "bg-lys-teal/20 text-lys-teal border-lys-teal/40")}
      {pill("D", a.doing, a.doingReason, "bg-lys-red/20 text-lys-red border-lys-red/40")}
    </div>
  );

  if (!interactive) return inner;

  const row = (label: string, key: "Being" | "Knowing" | "Doing", on: boolean, reason: string | undefined, color: string) => (
    <div className="flex items-start gap-2">
      <span className={`inline-flex items-center justify-center rounded font-oswald font-semibold border ${pillBase} ${
        on ? color : "bg-muted text-muted-foreground border-muted-foreground/20 opacity-50"
      }`}>{label}</span>
      <div className="text-xs">
        <div className="font-semibold">{key}: {on ? "Yes" : "No"}</div>
        {reason && <div className="text-muted-foreground">{reason}</div>}
      </div>
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(true); }} className="hover:opacity-80">
          {inner}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" data-testid="popover-bkd-why">
        <div className="space-y-2">
          <div className="font-oswald text-sm font-semibold flex items-center gap-1">
            <HelpCircle className="h-4 w-4 text-muted-foreground" /> Why this rating?
          </div>
          <p className="text-xs text-muted-foreground">
            BKD = <strong>Being, Knowing, Doing</strong> — our framework for evaluating opportunities.
          </p>
          <div className="space-y-2 pt-1">
            {row("B", "Being", a.being, a.beingReason, "bg-lys-yellow/20 text-lys-yellow border-lys-yellow/40")}
            {row("K", "Knowing", a.knowing, a.knowingReason, "bg-lys-teal/20 text-lys-teal border-lys-teal/40")}
            {row("D", "Doing", a.doing, a.doingReason, "bg-lys-red/20 text-lys-red border-lys-red/40")}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function BkdLegend() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
          aria-label="What does BKD mean?"
          data-testid="button-bkd-legend"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 text-xs" data-testid="popover-bkd-legend">
        <div className="font-oswald text-sm font-semibold mb-1">What do B / K / D mean?</div>
        <p className="text-muted-foreground mb-2">
          Every scholarship is rated on three pillars from the LYS framework:
        </p>
        <ul className="space-y-1.5">
          <li><span className="inline-block w-5 text-center font-oswald font-semibold rounded bg-lys-yellow/20 text-lys-yellow border border-lys-yellow/40">B</span> <strong>Being</strong> — does it grow your character or identity?</li>
          <li><span className="inline-block w-5 text-center font-oswald font-semibold rounded bg-lys-teal/20 text-lys-teal border border-lys-teal/40">K</span> <strong>Knowing</strong> — is the listing transparent, recent, and trustworthy?</li>
          <li><span className="inline-block w-5 text-center font-oswald font-semibold rounded bg-lys-red/20 text-lys-red border border-lys-red/40">D</span> <strong>Doing</strong> — does the work behind it move you forward?</li>
        </ul>
      </PopoverContent>
    </Popover>
  );
}
