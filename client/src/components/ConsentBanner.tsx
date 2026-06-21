import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { getConsent, setConsent } from "@/lib/consent";
import { applyConsent, hasAnyTrackerConfigured } from "@/lib/analytics";

// Cookie/tracking consent banner. Shows once until the visitor makes a choice,
// and only when at least one tracker is actually configured (otherwise there is
// nothing to gate). Hidden on /embed surfaces. Necessary cookies are always on.
export default function ConsentBanner() {
  const [location] = useLocation();
  const [visible, setVisible] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    const existing = getConsent();
    if (existing) {
      applyConsent(existing);
      return;
    }
    if (hasAnyTrackerConfigured()) setVisible(true);
  }, []);

  if (location.startsWith("/embed")) return null;
  if (!visible) return null;

  const decide = (a: boolean, m: boolean) => {
    const state = setConsent({ analytics: a, marketing: m });
    applyConsent(state);
    setVisible(false);
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4"
      role="dialog"
      aria-label="Cookie consent"
      data-testid="banner-consent"
    >
      <div className="mx-auto max-w-3xl rounded-lg border bg-background p-4 shadow-lg">
        <p className="text-sm text-foreground">
          We use strictly necessary cookies to keep you signed in and secure. With your
          permission, we also use optional analytics and marketing technologies (such as Google
          Analytics, the Meta Pixel, and HubSpot) to understand usage and improve LYS. You can
          accept, decline, or customize your choice.
        </p>

        {customize && (
          <div className="mt-4 space-y-3 border-t pt-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Strictly necessary</p>
                <p className="text-xs text-muted-foreground">Required for sign-in and security.</p>
              </div>
              <Switch checked disabled aria-label="Strictly necessary cookies (always on)" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Analytics</p>
                <p className="text-xs text-muted-foreground">Helps us measure and improve usage.</p>
              </div>
              <Switch
                checked={analytics}
                onCheckedChange={setAnalytics}
                data-testid="switch-consent-analytics"
                aria-label="Analytics cookies"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Marketing</p>
                <p className="text-xs text-muted-foreground">
                  Supports advertising and outreach (Meta Pixel, HubSpot).
                </p>
              </div>
              <Switch
                checked={marketing}
                onCheckedChange={setMarketing}
                data-testid="switch-consent-marketing"
                aria-label="Marketing cookies"
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          {!customize ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCustomize(true)}
                data-testid="button-consent-customize"
              >
                Customize
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => decide(false, false)}
                data-testid="button-consent-reject"
              >
                Decline optional
              </Button>
              <Button size="sm" onClick={() => decide(true, true)} data-testid="button-consent-accept">
                Accept all
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => decide(false, false)}
                data-testid="button-consent-reject"
              >
                Decline optional
              </Button>
              <Button
                size="sm"
                onClick={() => decide(analytics, marketing)}
                data-testid="button-consent-save"
              >
                Save choices
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
