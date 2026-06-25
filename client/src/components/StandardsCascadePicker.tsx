import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Globe, MapPin, FileText, ChevronRight, ExternalLink, Star, Clock, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { StandardCode } from "@shared/standards";

export interface CatalogCodeClient extends StandardCode {
  source?: "official" | "backup" | "curated" | "unverified" | "fallback";
  sourceUrl?: string | null;
  jurisdictionName?: string | null;
  standardsName?: string | null;
  authorityName?: string | null;
  lastVerifiedAt?: string | null;
  gradeLevel?: string | null;
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

interface FavoriteRow {
  id: string;
  country: string;
  state: string;
  subject: string;
  code: string;
  description: string;
  gradeLevel: string | null;
  standardsName: string | null;
  jurisdictionName: string | null;
  source: "official" | "backup" | "curated" | "unverified" | "fallback" | null;
  sourceUrl: string | null;
}

interface RecentRow {
  country: string;
  state: string;
  subject: string;
  code: string;
  description: string;
  gradeLevel: string | null;
  standardsName: string | null;
  source: "official" | "backup" | "curated" | "unverified" | "fallback" | null;
  sourceUrl: string | null;
  lastUsedAt: string | null;
}

function tierLabel(tier?: string | null): string {
  if (tier === "official") return "Official";
  if (tier === "backup") return "Backup";
  if (tier === "unverified") return "Unverified";
  if (tier === "curated") return "Curated";
  return "Starter";
}

function tierExplain(tier?: string | null): string {
  if (tier === "official") return "From the official Department of Education source for this state.";
  if (tier === "backup") return "From a trusted standards database (Common Standards Project). Used as a backup until the official source is confirmed.";
  if (tier === "unverified") return "Uploaded by an admin and waiting on a site admin to confirm the source. Use with care until it's verified.";
  if (tier === "curated") return "Admin-curated entry — not yet verified against an official source.";
  return "Starter library entry — used when no official source is available yet.";
}

// Clean, simple color treatment per trust tier.
function tierBadgeClass(tier?: string | null): string {
  if (tier === "official") return "border-lys-teal/40 text-lys-teal";
  if (tier === "backup") return "border-lys-blue/40 text-lys-blue";
  if (tier === "unverified") return "border-lys-red/40 text-lys-red";
  if (tier === "curated") return "border-lys-yellow/50 text-lys-yellow";
  return "border-muted-foreground/30 text-muted-foreground";
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
            className={`ml-2 text-[10px] font-roboto align-middle cursor-pointer hover-elevate ${tierBadgeClass(tier)}`}
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
            className={`text-[10px] ${tierBadgeClass(tier)}`}
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
        {code.authorityName && (
          <div>
            <p className="font-semibold text-foreground">Authority</p>
            <p className="text-muted-foreground" data-testid={testId ? `${testId}-authority` : undefined}>
              {code.authorityName}
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
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

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

  // Favorites (global per teacher across subjects/grades; pinned).
  const { data: favoritesData } = useQuery<FavoriteRow[]>({
    queryKey: ["/api/teacher-standards/favorites"],
    enabled: isAuthenticated,
  });
  const favorites = favoritesData || [];

  // Recents scoped to the current cascade selection so "what I picked last
  // time for this subject" appears at the top of the list.
  const { data: recentsData } = useQuery<RecentRow[]>({
    queryKey: [
      "/api/teacher-standards/recents",
      selectedCountry,
      selectedState,
      selectedSubject,
    ],
    enabled: isAuthenticated && !!selectedCountry && !!selectedState && !!selectedSubject,
    queryFn: async () => {
      const params = new URLSearchParams({
        country: selectedCountry,
        state: selectedState,
        subject: selectedSubject,
        limit: "10",
      });
      const res = await fetch(`/api/teacher-standards/recents?${params}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });
  const recents = recentsData || [];

  // Cross-grade search results.
  const trimmedQuery = searchQuery.trim();
  const { data: searchResults } = useQuery<CatalogCodeClient[]>({
    queryKey: [
      "/api/teacher-standards/search",
      selectedCountry,
      selectedState,
      selectedSubject,
      trimmedQuery,
    ],
    enabled:
      isAuthenticated &&
      !!selectedCountry &&
      !!selectedState &&
      !!selectedSubject &&
      trimmedQuery.length >= 2,
    queryFn: async () => {
      const params = new URLSearchParams({
        country: selectedCountry,
        state: selectedState,
        subject: selectedSubject,
        q: trimmedQuery,
      });
      const res = await fetch(`/api/teacher-standards/search?${params}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const addFavoriteMutation = useMutation({
    mutationFn: async (code: CatalogCodeClient) => {
      await apiRequest("POST", "/api/teacher-standards/favorites", {
        country: selectedCountry,
        state: selectedState,
        subject: selectedSubject,
        code: code.code,
        description: code.description,
        gradeLevel: code.gradeLevel ?? null,
        standardsName: code.standardsName ?? standardsName ?? null,
        jurisdictionName: code.jurisdictionName ?? null,
        source: code.source ?? null,
        sourceUrl: code.sourceUrl ?? null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-standards/favorites"] });
    },
    onError: () => toast({ title: "Couldn't save favorite", variant: "destructive" }),
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (fav: { country: string; state: string; subject: string; code: string }) => {
      await apiRequest("DELETE", "/api/teacher-standards/favorites", fav);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-standards/favorites"] });
    },
  });

  // Build composite keys for membership checks.
  const favoriteKeys = useMemo(
    () => new Set(favorites.map((f) => `${f.country}|${f.state}|${f.subject}|${f.code}`)),
    [favorites],
  );
  const codeKey = (c: { country?: string; state?: string; subject?: string; code: string }) =>
    `${c.country ?? selectedCountry}|${c.state ?? selectedState}|${c.subject ?? selectedSubject}|${c.code}`;

  const isFavorited = (code: string) =>
    favoriteKeys.has(`${selectedCountry}|${selectedState}|${selectedSubject}|${code}`);

  const toggleFavorite = (code: CatalogCodeClient) => {
    if (isFavorited(code.code)) {
      removeFavoriteMutation.mutate({
        country: selectedCountry,
        state: selectedState,
        subject: selectedSubject,
        code: code.code,
      });
    } else {
      addFavoriteMutation.mutate(code);
    }
  };

  // Subject-scoped favorites are pinned at the top of the picker for this
  // cascade selection. Favorites from other subjects are still listed in the
  // dedicated favorites panel below so teachers can jump back into them.
  const pinnedFavoritesForSubject = useMemo(
    () =>
      favorites.filter(
        (f) =>
          f.country === selectedCountry &&
          f.state === selectedState &&
          f.subject === selectedSubject,
      ),
    [favorites, selectedCountry, selectedState, selectedSubject],
  );

  // Dedup the main code list: drop entries already shown in pinned or recents.
  const pinnedKeySet = new Set(pinnedFavoritesForSubject.map((f) => f.code));
  const recentKeySet = new Set(recents.map((r) => r.code));
  const codesWithoutPinned = standardCodes.filter(
    (c) => !pinnedKeySet.has(c.code) && !recentKeySet.has(c.code),
  );
  const recentsNotPinned = recents.filter((r) => !pinnedKeySet.has(r.code));

  const tid = (suffix: string) => (testIdPrefix ? `${testIdPrefix}-${suffix}` : suffix);

  const renderCodeRow = (
    code: CatalogCodeClient,
    options: { showFavorite?: boolean; showGrade?: boolean; keyPrefix?: string } = {},
  ) => {
    const { showFavorite = true, showGrade = false, keyPrefix = "" } = options;
    const checked = selectedStandardCodes.some((c) => c.code === code.code);
    const favored = isFavorited(code.code);
    return (
      <div
        key={`${keyPrefix}${code.code}`}
        className="flex items-start gap-2 p-2 rounded-md hover-elevate cursor-pointer"
      >
        <Checkbox
          id={`${testIdPrefix}-${keyPrefix}${code.code}`}
          checked={checked}
          onCheckedChange={() => onToggleCode(code)}
          className="mt-0.5"
          data-testid={tid(`checkbox-standard-${keyPrefix}${code.code}`)}
        />
        <label
          htmlFor={`${testIdPrefix}-${keyPrefix}${code.code}`}
          className="font-roboto text-sm cursor-pointer leading-relaxed flex-1"
        >
          <span className="font-semibold text-lys-teal">{code.code}</span>
          {showGrade && code.gradeLevel && (
            <Badge variant="outline" className="ml-2 text-[10px] font-roboto">
              {code.gradeLevel}
            </Badge>
          )}
          <span className="text-muted-foreground ml-2">{code.description}</span>
          {showStandardSources && code.source && (
            <StandardsSourcePopover
              code={code}
              testId={tid(`badge-source-${keyPrefix}${code.code}`)}
            />
          )}
        </label>
        {showFavorite && isAuthenticated && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(code);
            }}
            className="mt-0.5 p-1 rounded hover-elevate"
            aria-label={favored ? "Unfavorite" : "Favorite"}
            data-testid={tid(`button-favorite-${code.code}`)}
          >
            <Star
              className={`h-3.5 w-3.5 ${favored ? "fill-lys-yellow text-lys-yellow" : "text-muted-foreground"}`}
            />
          </button>
        )}
      </div>
    );
  };

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

      {/* Cross-subject favorites bar — pinned codes for other subjects so a
          teacher can jump back to a starred code without re-cascading. */}
      {isAuthenticated && favorites.length > 0 && (
        <div className="space-y-1.5" data-testid={tid("favorites-bar")}>
          <Label className="font-roboto text-xs text-muted-foreground flex items-center gap-1">
            <Star className="h-3 w-3 fill-lys-yellow text-lys-yellow" />
            Your favorites
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {favorites.slice(0, 12).map((f) => (
              <button
                type="button"
                key={f.id}
                onClick={() => {
                  if (
                    f.country !== selectedCountry ||
                    f.state !== selectedState ||
                    f.subject !== selectedSubject
                  ) {
                    onCountryChange(f.country);
                    onStateChange(f.state);
                    onSubjectChange(f.subject);
                  }
                  onToggleCode({
                    code: f.code,
                    description: f.description,
                    gradeLevel: f.gradeLevel,
                    standardsName: f.standardsName ?? undefined,
                    jurisdictionName: f.jurisdictionName ?? undefined,
                    source: f.source ?? undefined,
                    sourceUrl: f.sourceUrl ?? undefined,
                  });
                }}
                className="text-xs font-roboto border border-lys-yellow/40 bg-lys-yellow/5 hover-elevate rounded-md px-2 py-1 inline-flex items-center gap-1"
                data-testid={tid(`button-favorite-pill-${f.code}`)}
              >
                <Star className="h-3 w-3 fill-lys-yellow text-lys-yellow" />
                <span className="font-semibold text-lys-teal">{f.code}</span>
                <span className="text-muted-foreground truncate max-w-[12rem]">{f.subject}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {standardCodes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Label className="font-roboto text-sm text-muted-foreground">
              {standardsName} Standard Codes (select all that apply)
            </Label>
          </div>

          {/* Cross-grade search. Hits a dedicated endpoint that returns codes
              across every grade of the currently selected subject. */}
          {isAuthenticated && (
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search all grades by code or description..."
                className="pl-7 h-8 text-sm font-roboto"
                data-testid={tid("input-search-codes")}
              />
            </div>
          )}

          <ScrollArea className={`${scrollHeight} rounded-md border bg-muted/30`}>
            <div className="p-3 space-y-3">
              {/* Search results take over the list when the user is searching. */}
              {trimmedQuery.length >= 2 ? (
                <div className="space-y-1" data-testid={tid("search-results")}>
                  <p className="text-[11px] uppercase tracking-wide font-roboto text-muted-foreground px-1">
                    Search results across all grades
                  </p>
                  {(searchResults ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground italic px-1">
                      No codes match "{trimmedQuery}".
                    </p>
                  ) : (
                    (searchResults ?? []).map((c) =>
                      renderCodeRow(c, { showGrade: true, keyPrefix: "search-" }),
                    )
                  )}
                </div>
              ) : (
                <>
                  {pinnedFavoritesForSubject.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-wide font-roboto text-lys-yellow px-1 flex items-center gap-1">
                        <Star className="h-3 w-3 fill-lys-yellow text-lys-yellow" />
                        Favorites
                      </p>
                      {pinnedFavoritesForSubject.map((f) =>
                        renderCodeRow(
                          {
                            code: f.code,
                            description: f.description,
                            gradeLevel: f.gradeLevel,
                            standardsName: f.standardsName ?? undefined,
                            jurisdictionName: f.jurisdictionName ?? undefined,
                            source: f.source ?? undefined,
                            sourceUrl: f.sourceUrl ?? undefined,
                          },
                          { keyPrefix: "fav-" },
                        ),
                      )}
                    </div>
                  )}

                  {recentsNotPinned.length > 0 && (
                    <div className="space-y-1" data-testid={tid("recents-row")}>
                      <p className="text-[11px] uppercase tracking-wide font-roboto text-muted-foreground px-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Recently used
                      </p>
                      {recentsNotPinned.map((r) =>
                        renderCodeRow(
                          {
                            code: r.code,
                            description: r.description,
                            gradeLevel: r.gradeLevel,
                            standardsName: r.standardsName ?? undefined,
                            source: r.source ?? undefined,
                            sourceUrl: r.sourceUrl ?? undefined,
                          },
                          { keyPrefix: "recent-" },
                        ),
                      )}
                    </div>
                  )}

                  {(pinnedFavoritesForSubject.length > 0 || recentsNotPinned.length > 0) && (
                    <p className="text-[11px] uppercase tracking-wide font-roboto text-muted-foreground px-1">
                      All standards
                    </p>
                  )}
                  {codesWithoutPinned.map((c) => renderCodeRow(c))}
                </>
              )}
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
