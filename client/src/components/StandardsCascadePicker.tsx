import { useQuery } from "@tanstack/react-query";
import { Globe, MapPin, FileText, ChevronRight, ExternalLink } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StandardCode } from "@shared/standards";

export interface CatalogCodeClient extends StandardCode {
  source?: "official" | "curated" | "fallback";
  sourceUrl?: string | null;
  jurisdictionName?: string | null;
  standardsName?: string | null;
  lastVerifiedAt?: string | null;
}

interface Props {
  selectedCountry: string;
  selectedState: string;
  selectedSubject: string;
  selectedStandardCodes: CatalogCodeClient[];
  onCountryChange: (country: string) => void;
  onStateChange: (state: string) => void;
  onSubjectChange: (subject: string) => void;
  onToggleCode: (code: CatalogCodeClient) => void;
  showStandardSources?: boolean;
  showRequestCurriculum?: boolean;
  testIdPrefix?: string;
  scrollHeight?: string;
}

function tierLabel(tier?: string): string {
  if (tier === "official") return "Official";
  if (tier === "curated") return "Curated";
  return "Starter";
}

function tierExplain(tier?: string): string {
  if (tier === "official") return "Sourced from an official ministry or standards-consortium feed.";
  if (tier === "curated") return "Admin-curated entry — not yet verified against an official ministry feed.";
  return "Starter library entry — used when no official source is available yet.";
}

function formatVerified(ts?: string | null): string {
  if (!ts) return "Not yet verified";
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "Not yet verified";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "Not yet verified";
  }
}

export function StandardsSourcePopover({
  code,
  testId,
}: {
  code: CatalogCodeClient;
  testId?: string;
}) {
  const tier = code.source;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex"
          data-testid={testId}
        >
          <Badge
            variant="outline"
            className={`ml-2 text-[10px] font-roboto align-middle cursor-pointer hover-elevate ${
              tier === "official"
                ? "border-lys-teal/40 text-lys-teal"
                : tier === "curated"
                ? "border-lys-yellow/50 text-lys-yellow"
                : "border-muted-foreground/30 text-muted-foreground"
            }`}
          >
            {tierLabel(tier).toLowerCase()}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 text-xs space-y-2"
        onClick={(e) => e.stopPropagation()}
        data-testid={testId ? `${testId}-content` : undefined}
      >
        <div className="flex items-center justify-between">
          <span className="font-oswald text-sm font-semibold">{tierLabel(tier)}</span>
          <Badge
            variant="outline"
            className={
              tier === "official"
                ? "border-lys-teal/40 text-lys-teal text-[10px]"
                : tier === "curated"
                ? "border-lys-yellow/50 text-lys-yellow text-[10px]"
                : "border-muted-foreground/30 text-muted-foreground text-[10px]"
            }
          >
            {tier ?? "fallback"}
          </Badge>
        </div>
        <p className="text-muted-foreground">{tierExplain(tier)}</p>
        {(code.jurisdictionName || code.standardsName) && (
          <div>
            <p className="font-semibold text-foreground">Jurisdiction</p>
            <p className="text-muted-foreground">
              {[code.jurisdictionName, code.standardsName].filter(Boolean).join(" — ")}
            </p>
          </div>
        )}
        <div>
          <p className="font-semibold text-foreground">Last verified</p>
          <p className="text-muted-foreground" data-testid={testId ? `${testId}-verified` : undefined}>
            {formatVerified(code.lastVerifiedAt)}
          </p>
        </div>
        {code.sourceUrl ? (
          <a
            href={code.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-lys-teal hover:underline break-all"
            data-testid={testId ? `${testId}-link` : undefined}
          >
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{code.sourceUrl}</span>
          </a>
        ) : (
          <p className="text-muted-foreground italic">No source URL on file.</p>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function StandardsCascadePicker({
  selectedCountry,
  selectedState,
  selectedSubject,
  selectedStandardCodes,
  onCountryChange,
  onStateChange,
  onSubjectChange,
  onToggleCode,
  showStandardSources = true,
  showRequestCurriculum = true,
  testIdPrefix = "",
  scrollHeight = "h-48",
}: Props) {
  const { toast } = useToast();

  const { data: countriesData } = useQuery<string[]>({
    queryKey: ["/api/standards/countries"],
  });
  const countries = countriesData || [];

  const { data: statesData } = useQuery<{ state: string; abbreviation: string; standardsName: string }[]>({
    queryKey: ["/api/standards/states", selectedCountry],
    enabled: !!selectedCountry,
  });
  const states = statesData || [];

  const { data: subjectsData } = useQuery<{ subject: string }[]>({
    queryKey: ["/api/standards/subjects", selectedCountry, selectedState],
    enabled: !!selectedCountry && !!selectedState,
  });
  const subjects = subjectsData || [];

  const { data: standardCodesData } = useQuery<CatalogCodeClient[]>({
    queryKey: ["/api/standards/codes", selectedCountry, selectedState, selectedSubject],
    enabled: !!selectedCountry && !!selectedState && !!selectedSubject,
  });
  const standardCodes = standardCodesData || [];
  const standardsName = states.find((s) => s.abbreviation === selectedState)?.standardsName || "";

  const tid = (suffix: string) => (testIdPrefix ? `${testIdPrefix}-${suffix}` : suffix);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="font-roboto text-sm text-muted-foreground flex items-center gap-1">
            <Globe className="h-3 w-3" />
            Country
          </Label>
          <Select value={selectedCountry} onValueChange={onCountryChange}>
            <SelectTrigger className="font-roboto" data-testid={tid("select-country")}>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country} value={country} className="font-roboto">
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="font-roboto text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            State/Region
          </Label>
          <Select value={selectedState} onValueChange={onStateChange} disabled={!selectedCountry}>
            <SelectTrigger className="font-roboto" data-testid={tid("select-state")}>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state.abbreviation} value={state.abbreviation} className="font-roboto">
                  {state.state} ({state.standardsName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="font-roboto text-sm text-muted-foreground flex items-center gap-1">
          <FileText className="h-3 w-3" />
          Subject Area
        </Label>
        <Select value={selectedSubject} onValueChange={onSubjectChange} disabled={!selectedState}>
          <SelectTrigger className="font-roboto" data-testid={tid("select-subject")}>
            <SelectValue placeholder="Select subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((subject) => (
              <SelectItem key={subject.subject} value={subject.subject} className="font-roboto">
                {subject.subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(selectedCountry || selectedState || selectedSubject) && (
        <div
          className="flex items-center gap-1 text-xs font-roboto text-muted-foreground bg-muted/50 rounded-md px-3 py-2"
          data-testid={tid("breadcrumb-selection")}
        >
          {selectedCountry && (
            <>
              <Globe className="h-3 w-3" />
              <span>{selectedCountry}</span>
            </>
          )}
          {selectedState && (
            <>
              <ChevronRight className="h-3 w-3" />
              <MapPin className="h-3 w-3" />
              <span>{states.find((s) => s.abbreviation === selectedState)?.state || selectedState}</span>
            </>
          )}
          {selectedSubject && (
            <>
              <ChevronRight className="h-3 w-3" />
              <FileText className="h-3 w-3" />
              <span>{selectedSubject}</span>
            </>
          )}
        </div>
      )}

      {showRequestCurriculum && selectedSubject && standardCodes.length === 0 && (
        <div
          className="rounded-md border border-dashed border-lys-yellow/50 bg-lys-yellow/5 p-4 text-sm"
          data-testid={tid("empty-state-no-codes")}
        >
          <p className="font-semibold mb-1">No standard codes available for this subject yet.</p>
          <p className="text-muted-foreground mb-3">
            You can still proceed — outcomes will be inferred from the country's curriculum. Want us to add code-level standards for {selectedCountry}?
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-testid={tid("button-request-curriculum")}
            onClick={async () => {
              try {
                await apiRequest("POST", "/api/standards-ingestion/requests", {
                  country: selectedCountry,
                  state: selectedState || undefined,
                  notes: `Requested from standards picker: ${selectedSubject}`,
                });
                toast({ title: "Request sent", description: "A system administrator will review your request." });
              } catch (err: any) {
                toast({ title: "Request failed", description: err.message, variant: "destructive" });
              }
            }}
          >
            Request this curriculum
          </Button>
        </div>
      )}

      {standardCodes.length > 0 && (
        <div className="space-y-2">
          <Label className="font-roboto text-sm text-muted-foreground">
            {standardsName} Standard Codes (select all that apply)
          </Label>
          <ScrollArea className={`${scrollHeight} rounded-md border bg-muted/30`}>
            <div className="p-3 space-y-1">
              {standardCodes.map((code) => (
                <div
                  key={code.code}
                  className="flex items-start gap-3 p-2 rounded-md hover-elevate cursor-pointer"
                >
                  <Checkbox
                    id={`${testIdPrefix}-${code.code}`}
                    checked={selectedStandardCodes.some((c) => c.code === code.code)}
                    onCheckedChange={() => onToggleCode(code)}
                    className="mt-0.5"
                    data-testid={tid(`checkbox-standard-${code.code}`)}
                  />
                  <label
                    htmlFor={`${testIdPrefix}-${code.code}`}
                    className="font-roboto text-sm cursor-pointer leading-relaxed flex-1"
                  >
                    <span className="font-semibold text-lys-teal">{code.code}</span>
                    <span className="text-muted-foreground ml-2">{code.description}</span>
                    {showStandardSources && code.source && (
                      <StandardsSourcePopover
                        code={code}
                        testId={tid(`badge-source-${code.code}`)}
                      />
                    )}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
          {selectedStandardCodes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedStandardCodes.map((code) => (
                <Badge
                  key={code.code}
                  variant="secondary"
                  className="font-roboto text-xs cursor-pointer"
                  onClick={() => onToggleCode(code)}
                  data-testid={tid(`badge-selected-${code.code}`)}
                >
                  {code.code}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
