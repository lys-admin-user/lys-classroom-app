import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { NeedsAnalyzer } from "@/components/NeedsAnalyzer";
import { useAuth } from "@/hooks/use-auth";
import { hasSeenAnalyzer, markAnalyzerSeen } from "@/lib/needsAnalyzer";

/**
 * Auto-popup modal that fires once for first-time, unauthenticated visitors.
 * Gated by:
 *   - `hasSeenAnalyzer()`  (localStorage flag)
 *   - !isAuthenticated     (logged-in users have already self-segmented via onboarding)
 *   - not on /start, /onboarding, or /api routes
 *   - small delay so it doesn't blast on initial paint
 *
 * Always available manually via the "Find your fit" header button (which
 * routes to /start instead).
 */
export function NeedsAnalyzerModal() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    if (hasSeenAnalyzer()) return;
    if (location === "/start" || location.startsWith("/onboarding") || location.startsWith("/api/")) return;
    if (location.startsWith("/embed/") || location.startsWith("/shared/")) return;
    if (location.startsWith("/sign-in") || location.startsWith("/sign-up")) return;

    const t = window.setTimeout(() => setOpen(true), 4000);
    return () => window.clearTimeout(t);
  }, [isAuthenticated, isLoading, location]);

  const handleClose = (next: boolean) => {
    setOpen(next);
    if (!next) markAnalyzerSeen();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto" data-testid="modal-needs-analyzer">
        <DialogHeader>
          <DialogTitle className="font-oswald text-2xl">Find your fit in 60 seconds</DialogTitle>
          <DialogDescription className="font-roboto">
            Four quick questions and we'll route you to the right place.
          </DialogDescription>
        </DialogHeader>
        <NeedsAnalyzer onComplete={() => handleClose(false)} />
      </DialogContent>
    </Dialog>
  );
}
