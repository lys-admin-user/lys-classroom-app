import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
}

export function ScholarshipBkdBadge({ alignment, size = "sm" }: Props) {
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

  return (
    <div className="inline-flex items-center gap-0.5" title={total === 3 ? "BKD-Aligned Opportunity" : undefined}>
      {pill("B", a.being, a.beingReason, "bg-lys-yellow/20 text-lys-yellow border-lys-yellow/40")}
      {pill("K", a.knowing, a.knowingReason, "bg-lys-teal/20 text-lys-teal border-lys-teal/40")}
      {pill("D", a.doing, a.doingReason, "bg-lys-red/20 text-lys-red border-lys-red/40")}
    </div>
  );
}
