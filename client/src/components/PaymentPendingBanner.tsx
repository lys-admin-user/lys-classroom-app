import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Landmark, X } from "lucide-react";
import type { User } from "@shared/models/auth";

const DISMISS_KEY = "lys-payment-pending-banner-dismissed";

function isDismissedThisSession(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function PaymentPendingBanner() {
  const [dismissed, setDismissed] = useState(isDismissedThisSession);

  const { data: user } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    // While the bank payment is clearing, poll so the banner disappears on
    // its own once the Stripe webhook flips the status to active.
    refetchInterval: (query) =>
      query.state.data?.subscriptionStatus === "payment_pending" ? 60_000 : false,
  });

  const isPending = user?.subscriptionStatus === "payment_pending";

  if (!isPending || dismissed) return null;

  const tierName = user?.tier && user.tier !== "free"
    ? user.tier.charAt(0).toUpperCase() + user.tier.slice(1)
    : null;

  return (
    <div
      className="relative border-b px-4 py-3 bg-gradient-to-r from-lys-yellow/10 via-background to-lys-teal/10"
      data-testid="banner-payment-pending"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-lys-yellow/20 shrink-0">
            <Landmark className="w-4 h-4 text-lys-yellow" />
          </div>
          <div>
            <p className="font-oswald text-sm font-medium" data-testid="text-payment-pending-title">
              Your bank payment is processing
            </p>
            <p className="text-xs text-muted-foreground font-roboto" data-testid="text-payment-pending-detail">
              Bank (ACH) payments usually take about 4 business days to clear.
              {tierName ? ` Your ${tierName} plan will unlock automatically once it does` : " Your plan will unlock automatically once it does"} — no action needed.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/pricing">
            <Button size="sm" variant="outline" data-testid="button-payment-pending-details">
              View plan details
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setDismissed(true);
              try {
                sessionStorage.setItem(DISMISS_KEY, "1");
              } catch {
                // Ignore storage errors — the banner just reappears next visit.
              }
            }}
            data-testid="button-dismiss-payment-pending"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
