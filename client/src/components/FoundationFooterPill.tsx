import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Sparkles } from "lucide-react";
import { FoundationDrawer } from "./FoundationDrawer";
import type { FoundationModule, FoundationProgress } from "@shared/schema";

const FOUNDATION_ROLES = ["staff", "site_admin", "system_admin"];

export function FoundationFooterPill() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  // Gate: only staff and system-level admins see this widget.
  const role = user?.role || "";
  const canSee = FOUNDATION_ROLES.includes(role);

  const { data: modules = [] } = useQuery<FoundationModule[]>({
    queryKey: ["/api/foundation/modules"],
    enabled: canSee,
  });
  const { data: progress = [] } = useQuery<FoundationProgress[]>({
    queryKey: ["/api/foundation/progress"],
    enabled: canSee,
  });

  if (!canSee) return null;

  const completedSlugs = new Set(progress.filter((p) => p.completedAt).map((p) => p.moduleSlug));
  const total = modules.length || 6;
  const completed = modules.filter((m) => completedSlugs.has(m.slug)).length;
  const pct = Math.round((completed / total) * 100);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-colors hover-elevate"
        data-testid="button-foundation-pill"
        aria-label="Open Our Foundation onboarding"
      >
        <Sparkles className="h-4 w-4 text-lys-yellow" />
        <span className="font-oswald text-sm font-medium text-white">
          Our Foundation: <span className="text-lys-yellow" data-testid="text-foundation-pill-pct">{pct}%</span> Explored
        </span>
        <span className="hidden sm:inline-flex items-center gap-0.5">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${i < completed ? "bg-lys-yellow" : "bg-white/30"}`}
            />
          ))}
        </span>
      </button>

      <FoundationDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}
