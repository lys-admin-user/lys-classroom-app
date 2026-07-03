import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check, ChevronLeft, ChevronRight, PlayCircle, Sparkles } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FoundationModule, FoundationProgress } from "@shared/schema";

interface FoundationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

/** Render module body using full GitHub-flavored markdown (headings, lists, links, tables, etc.). */
function renderBody(body: string) {
  return (
    <div className="text-sm leading-relaxed text-foreground/90 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_ol]:mb-3 [&_a]:text-lys-teal [&_a]:underline [&_a:hover]:opacity-80 [&_strong]:font-semibold [&_strong]:text-foreground [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_img]:rounded-md [&_img]:my-3 [&_img]:max-w-full [&_table]:w-full [&_table]:my-3 [&_th]:border [&_th]:px-2 [&_th]:py-1 [&_th]:bg-muted [&_th]:text-left [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_hr]:my-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2 className="font-oswald text-xl font-bold mt-5 mb-2 text-lys-teal dark:text-lys-yellow">{children}</h2>,
          h2: ({ children }) => <h3 className="font-oswald text-lg font-semibold mt-5 mb-2 text-lys-teal dark:text-lys-yellow">{children}</h3>,
          h3: ({ children }) => <h4 className="font-oswald text-base font-semibold mt-4 mb-1 text-foreground">{children}</h4>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-lys-yellow pl-4 italic text-foreground/80 my-3">{children}</blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}

/** Convert a video URL to a safe embeddable iframe src.
 *  STRICT ALLOWLIST: returns null for any URL that is not https + a known provider
 *  or a direct video file. Unknown URLs must NEVER be passed through to an iframe
 *  src — that would let an admin store a javascript: / data: / arbitrary-origin
 *  URL and XSS every staff member who opens the drawer. */
function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  const u = url.trim();

  // Reject anything that isn't https up front.
  let parsed: URL;
  try {
    parsed = new URL(u);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;

  // YouTube — watch / youtu.be / shorts / embed
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;

  // Vimeo — vimeo.com/123456789
  const vimeo = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

  // Loom — loom.com/share/<id>
  const loom = u.match(/loom\.com\/(?:share|embed)\/([\w-]+)/);
  if (loom) return `https://www.loom.com/embed/${loom[1]}`;

  // Wistia — fast.wistia.com/embed/medias/<id> or <something>.wistia.com/medias/<id>
  const wistia = u.match(/wistia\.com\/(?:embed\/)?medias\/([\w-]+)/);
  if (wistia) return `https://fast.wistia.net/embed/iframe/${wistia[1]}`;

  // Google Drive — drive.google.com/file/d/<id>/view
  const gdrive = u.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (gdrive) return `https://drive.google.com/file/d/${gdrive[1]}/preview`;

  // Direct video file (will be rendered via <video>, not iframe).
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(parsed.pathname)) return u;

  return null;
}

function isDirectVideoFile(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:") return false;
    return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

export function FoundationDrawer({ open, onOpenChange }: FoundationDrawerProps) {
  const { toast } = useToast();
  const [activeIdx, setActiveIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const { data: modules = [], isLoading: modulesLoading } = useQuery<FoundationModule[]>({
    queryKey: ["/api/foundation/modules"],
    enabled: open,
  });

  const { data: progress = [] } = useQuery<FoundationProgress[]>({
    queryKey: ["/api/foundation/progress"],
    enabled: open,
  });

  const progressMap = useMemo(() => {
    const m: Record<string, FoundationProgress> = {};
    for (const p of progress) m[p.moduleSlug] = p;
    return m;
  }, [progress]);

  const activeModule = modules[activeIdx];

  const recordProgress = useMutation({
    mutationFn: async (payload: { moduleSlug: string; action: "viewed" | "completed"; quizScore?: number }) => {
      const res = await apiRequest("POST", "/api/foundation/progress", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/foundation/progress"] });
      // Completing all modules unlocks the "Join the Team" (Team Hub) request,
      // so refresh access status too — the sidebar tab appears immediately.
      queryClient.invalidateQueries({ queryKey: ["/api/team/access/me"] });
    },
  });

  // Mark module viewed after 2s on screen
  useEffect(() => {
    if (!open || !activeModule) return;
    setQuizSubmitted(false);
    setQuizAnswers({});
    const slug = activeModule.slug;
    if (progressMap[slug]?.viewedAt) return; // already viewed
    const t = setTimeout(() => {
      recordProgress.mutate({ moduleSlug: slug, action: "viewed" });
    }, 2000);
    return () => clearTimeout(t);
  }, [open, activeModule?.slug]);

  const completedCount = modules.filter((m) => progressMap[m.slug]?.completedAt).length;
  const totalCount = modules.length || 1;
  const pct = Math.round((completedCount / totalCount) * 100);

  const handleMarkComplete = () => {
    if (!activeModule) return;
    recordProgress.mutate(
      { moduleSlug: activeModule.slug, action: "completed" },
      {
        onSuccess: () => {
          toast({
            title: "Module complete",
            description: `Nicely done. You've finished "${activeModule.title}".`,
          });
        },
      }
    );
  };

  const handleSubmitQuiz = () => {
    if (!activeModule || activeModule.contentType !== "quiz") return;
    const questions = (activeModule.quizJson || []) as QuizQuestion[];
    if (questions.length === 0) return;
    let correct = 0;
    questions.forEach((q, i) => {
      if (quizAnswers[i] === q.correctIndex) correct += 1;
    });
    const score = Math.round((correct / questions.length) * 100);
    setQuizSubmitted(true);
    const passed = score >= 60;
    recordProgress.mutate(
      {
        moduleSlug: activeModule.slug,
        action: passed ? "completed" : "viewed",
        quizScore: score,
      },
      {
        onSuccess: () => {
          toast({
            title: passed ? `You scored ${score}%` : `You scored ${score}% — try again`,
            description: passed
              ? "Module marked complete. Onward."
              : "Review the material and re-take the quiz when you're ready.",
          });
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 flex flex-col"
        data-testid="drawer-foundation"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-lys-yellow" />
            <SheetTitle className="font-oswald text-2xl">Our Foundation</SheetTitle>
          </div>
          <SheetDescription className="text-left">
            The story of who we are, what we stand for, and how we win — in six short modules.
          </SheetDescription>
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span data-testid="text-foundation-progress-count">
                {completedCount} of {totalCount} explored
              </span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} className="h-2" data-testid="progress-foundation" />
          </div>
        </SheetHeader>

        {modulesLoading ? (
          <div className="flex-1 p-6 text-sm text-muted-foreground">Loading modules…</div>
        ) : modules.length === 0 ? (
          <div className="flex-1 p-6 text-sm text-muted-foreground">No modules published yet.</div>
        ) : (
          <>
            {/* Module strip */}
            <div className="flex gap-1.5 overflow-x-auto px-6 py-3 border-b bg-muted/30">
              {modules.map((m, i) => {
                const isActive = i === activeIdx;
                const isDone = !!progressMap[m.slug]?.completedAt;
                return (
                  <button
                    key={m.slug}
                    onClick={() => setActiveIdx(i)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors hover-elevate ${
                      isActive
                        ? "bg-lys-teal text-white border-lys-teal"
                        : "bg-background text-foreground border-border"
                    }`}
                    data-testid={`tab-module-${m.slug}`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {isDone && <Check className="h-3 w-3" />}
                      <span>{String(m.order).padStart(2, "0")} · {m.title}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active module body */}
            <div className="flex-1 overflow-y-auto px-6 py-5" data-testid={`content-module-${activeModule?.slug}`}>
              {activeModule && (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                      Module {String(activeModule.order).padStart(2, "0")}
                    </Badge>
                    {progressMap[activeModule.slug]?.completedAt && (
                      <Badge className="bg-green-600 text-white text-[10px]" data-testid={`badge-completed-${activeModule.slug}`}>
                        <Check className="h-3 w-3 mr-1" /> Complete
                      </Badge>
                    )}
                  </div>
                  <h2 className="font-oswald text-2xl font-bold mb-1" data-testid={`text-module-title-${activeModule.slug}`}>
                    {activeModule.title}
                  </h2>
                  {activeModule.subtitle && (
                    <p className="text-sm text-muted-foreground mb-4">{activeModule.subtitle}</p>
                  )}

                  {activeModule.videoUrl && (() => {
                    const safeSrc = getEmbedUrl(activeModule.videoUrl);
                    if (!safeSrc) {
                      return (
                        <div className="mb-5 rounded-lg border border-dashed bg-muted/30 p-4 text-center text-xs text-muted-foreground" data-testid={`video-unsupported-${activeModule.slug}`}>
                          This video URL isn't from a supported provider (YouTube, Vimeo, Loom, Wistia, Google Drive, or a direct .mp4/.webm/.ogg/.mov file). Ask HR to update it.
                        </div>
                      );
                    }
                    return (
                      <div className="mb-5 rounded-lg overflow-hidden border bg-black/5 aspect-video">
                        {isDirectVideoFile(activeModule.videoUrl) ? (
                          <video
                            src={safeSrc}
                            controls
                            preload="metadata"
                            className="w-full h-full"
                            data-testid={`video-${activeModule.slug}`}
                          />
                        ) : (
                          <iframe
                            src={safeSrc}
                            title={activeModule.title}
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                            data-testid={`video-${activeModule.slug}`}
                          />
                        )}
                      </div>
                    );
                  })()}

                  {!activeModule.videoUrl && activeModule.contentType === "video" && (
                    <div className="mb-5 rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                      <PlayCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      Video coming soon. HR can add a URL in the Admin Foundation page.
                    </div>
                  )}

                  {renderBody(activeModule.body || "")}

                  {/* Quiz */}
                  {activeModule.contentType === "quiz" && (activeModule.quizJson || []).length > 0 && (
                    <div className="mt-6 rounded-lg border bg-card p-5">
                      <h3 className="font-oswald text-lg font-semibold mb-4 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-lys-yellow" /> Values in Action — Quick Check
                      </h3>
                      <div className="space-y-5">
                        {(activeModule.quizJson as QuizQuestion[]).map((q, qi) => (
                          <div key={qi} data-testid={`quiz-question-${qi}`}>
                            <p className="font-medium text-sm mb-2">{qi + 1}. {q.question}</p>
                            <RadioGroup
                              value={quizAnswers[qi]?.toString() ?? ""}
                              onValueChange={(v) => !quizSubmitted && setQuizAnswers((a) => ({ ...a, [qi]: parseInt(v, 10) }))}
                            >
                              {q.options.map((opt, oi) => {
                                const isSelected = quizAnswers[qi] === oi;
                                const isCorrectChoice = oi === q.correctIndex;
                                let cls = "";
                                if (quizSubmitted) {
                                  if (isCorrectChoice) cls = "text-green-700 dark:text-green-400 font-medium";
                                  else if (isSelected) cls = "text-red-600 dark:text-red-400 line-through";
                                }
                                return (
                                  <div key={oi} className="flex items-start space-x-2">
                                    <RadioGroupItem
                                      value={oi.toString()}
                                      id={`q${qi}-o${oi}`}
                                      disabled={quizSubmitted}
                                      data-testid={`radio-q${qi}-o${oi}`}
                                    />
                                    <Label htmlFor={`q${qi}-o${oi}`} className={`text-sm leading-snug cursor-pointer ${cls}`}>
                                      {opt}
                                    </Label>
                                  </div>
                                );
                              })}
                            </RadioGroup>
                            {quizSubmitted && q.explanation && (
                              <p className="mt-1.5 text-xs text-muted-foreground italic">{q.explanation}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      {!quizSubmitted ? (
                        <Button
                          onClick={handleSubmitQuiz}
                          disabled={Object.keys(quizAnswers).length !== (activeModule.quizJson as QuizQuestion[]).length}
                          className="mt-5 w-full"
                          data-testid="button-submit-quiz"
                        >
                          Submit Quiz
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}
                          className="mt-5 w-full"
                          data-testid="button-retake-quiz"
                        >
                          Retake Quiz
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer nav */}
            <div className="border-t px-6 py-3 flex items-center justify-between gap-2 bg-muted/30">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                disabled={activeIdx === 0}
                data-testid="button-prev-module"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>

              {activeModule && activeModule.contentType !== "quiz" && (
                <Button
                  size="sm"
                  onClick={handleMarkComplete}
                  disabled={!!progressMap[activeModule.slug]?.completedAt || recordProgress.isPending}
                  className="bg-lys-teal hover:bg-lys-teal/90 text-white"
                  data-testid="button-mark-complete"
                >
                  {progressMap[activeModule.slug]?.completedAt ? (
                    <><Check className="h-4 w-4 mr-1" /> Completed</>
                  ) : (
                    <>Mark Complete</>
                  )}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveIdx((i) => Math.min(modules.length - 1, i + 1))}
                disabled={activeIdx >= modules.length - 1}
                data-testid="button-next-module"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
