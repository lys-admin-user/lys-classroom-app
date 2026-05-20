import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock, BookOpen, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

export interface GuestSignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formContext: {
    topic?: string;
    selectedCountry?: string;
    selectedState?: string;
    selectedSubject?: string;
    gradeLevel?: string;
    bkdFocus?: string;
    duration?: string;
    unit?: string;
    lessonPart?: string;
  };
  lastLessonContent?: unknown;
  // True when the user has just exhausted their 5 free generations (hard
  // wall). False when the modal is opened proactively from the soft paywall
  // card.
  hardWall: boolean;
  returnTo?: string;
}

// Modal shown when a guest hits the free-tier wall or proactively decides to
// sign up. Persists the in-flight form values + last generated lesson against
// their guestId cookie before redirecting to /api/login so the values can be
// rehydrated after auth completes.
export function GuestSignupModal({
  open,
  onOpenChange,
  formContext,
  lastLessonContent,
  hardWall,
  returnTo = "/lesson-generator?restore=1",
}: GuestSignupModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const handoffAndRedirect = async (path: string) => {
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/guest/handoff", {
        formContext,
        lastLessonContent: lastLessonContent ?? null,
      });
    } catch {
      // Best-effort — proceed to auth even if handoff fails so the user
      // isn't stuck.
    }
    const url = `${path}?returnTo=${encodeURIComponent(returnTo)}`;
    window.location.href = url;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" data-testid="modal-guest-signup">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            {hardWall ? (
              <Lock className="h-5 w-5 text-lys-red" />
            ) : (
              <Sparkles className="h-5 w-5 text-lys-yellow" />
            )}
            <DialogTitle className="font-oswald text-xl">
              {hardWall ? "You've used all 5 free lessons" : "Save this lesson — sign up free"}
            </DialogTitle>
          </div>
          <DialogDescription className="font-roboto">
            {hardWall
              ? "Create a free account to keep generating lessons. We'll save your work and pick up right where you left off."
              : "A free account lets you save your lessons, generate aligned assignments, and unlock the full LYS toolkit."}
          </DialogDescription>
        </DialogHeader>

        {(formContext.topic || formContext.gradeLevel || formContext.selectedSubject) && (
          <div className="rounded-md border bg-muted/40 p-3 space-y-1.5">
            <p className="text-xs font-oswald uppercase tracking-wide text-muted-foreground">
              We'll restore after sign-up:
            </p>
            {formContext.topic && (
              <p className="text-sm font-roboto" data-testid="text-handoff-topic">
                <span className="font-medium">Topic:</span> {formContext.topic}
              </p>
            )}
            {(formContext.selectedSubject || formContext.gradeLevel) && (
              <p className="text-sm font-roboto" data-testid="text-handoff-grade-subject">
                <span className="font-medium">For:</span>{" "}
                {[formContext.gradeLevel, formContext.selectedSubject].filter(Boolean).join(" · ")}
              </p>
            )}
            {(formContext.selectedCountry || formContext.selectedState) && (
              <p className="text-sm font-roboto text-muted-foreground" data-testid="text-handoff-location">
                {[formContext.selectedState, formContext.selectedCountry].filter(Boolean).join(", ")}
              </p>
            )}
            {!!lastLessonContent && (
              <p className="text-xs font-roboto text-lys-teal flex items-center gap-1 mt-2">
                <BookOpen className="h-3 w-3" /> Your generated lesson will be saved to your library.
              </p>
            )}
          </div>
        )}

        <ul className="space-y-1.5 text-sm font-roboto text-muted-foreground">
          <li className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-lys-teal" /> Save lessons to your personal library
          </li>
          <li className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-lys-teal" /> Generate aligned quizzes & assignments
          </li>
          <li className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-lys-teal" /> 5 free lessons every month
          </li>
        </ul>

        <DialogFooter className="gap-2 sm:gap-2">
          {!hardWall && (
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              data-testid="button-modal-dismiss"
            >
              Not now
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => handoffAndRedirect("/api/login")}
            disabled={submitting}
            data-testid="button-modal-signin"
          >
            Sign in
          </Button>
          <Button
            onClick={() => handoffAndRedirect("/api/login")}
            disabled={submitting}
            className="bg-lys-red hover:bg-lys-red/90 text-white"
            data-testid="button-modal-signup"
          >
            Sign up free
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
