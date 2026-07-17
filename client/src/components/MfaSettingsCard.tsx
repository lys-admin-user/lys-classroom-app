import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ShieldAlert, Loader2, KeyRound, MonitorSmartphone, Copy, X } from "lucide-react";
import {
  useMfaStatus,
  useMfaEnroll,
  useMfaActivate,
  useMfaDisable,
  useMfaGenerateRecoveryCodes,
  useTrustedDevices,
  useRevokeTrustedDevice,
  useDismissMfaPrompt,
} from "@/hooks/use-mfa";
import { useToast } from "@/hooks/use-toast";

// Self-service card to manage two-factor authentication: enable/disable TOTP,
// generate one-time recovery codes, and manage "remembered" trusted devices.
// Shown to every signed-in user; optional-role users see a dismissible nudge.
export function MfaSettingsCard() {
  const { toast } = useToast();
  const { data: status, isLoading } = useMfaStatus();
  const enroll = useMfaEnroll();
  const activate = useMfaActivate();
  const disable = useMfaDisable();
  const genRecovery = useMfaGenerateRecoveryCodes();
  const dismissPrompt = useDismissMfaPrompt();

  const [enrollData, setEnrollData] = useState<{ qrDataUrl: string; secret: string } | null>(null);
  const [activateToken, setActivateToken] = useState("");
  const [disableToken, setDisableToken] = useState("");
  const [showDisable, setShowDisable] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  const startEnroll = async () => {
    try {
      const data = await enroll.mutateAsync();
      setEnrollData({ qrDataUrl: data.qrDataUrl, secret: data.secret });
    } catch (err: any) {
      toast({ title: "Could not start setup", description: err?.error || err?.message, variant: "destructive" });
    }
  };

  const confirmActivate = async () => {
    try {
      const res = await activate.mutateAsync(activateToken);
      setEnrollData(null);
      setActivateToken("");
      if (res.recoveryCodes?.length) {
        setRecoveryCodes(res.recoveryCodes);
        toast({ title: "Two-factor authentication enabled", description: "Save your recovery codes now — they won't be shown again." });
      } else {
        toast({ title: "Two-factor authentication enabled" });
      }
    } catch (err: any) {
      toast({ title: "Verification failed", description: err?.error || err?.message || "Invalid code", variant: "destructive" });
    }
  };

  const confirmDisable = async () => {
    try {
      await disable.mutateAsync(disableToken);
      setShowDisable(false);
      setDisableToken("");
      toast({ title: "Two-factor authentication disabled" });
    } catch (err: any) {
      toast({ title: "Could not disable", description: err?.error || err?.message || "Invalid code", variant: "destructive" });
    }
  };

  const generateRecovery = async () => {
    try {
      const res = await genRecovery.mutateAsync();
      setRecoveryCodes(res.codes);
      toast({ title: "Recovery codes generated", description: "Save them now — they won't be shown again." });
    } catch (err: any) {
      // A fresh step-up may be required; surface the message.
      toast({ title: "Could not generate codes", description: err?.error || err?.message, variant: "destructive" });
    }
  };

  const copyCodes = () => {
    if (!recoveryCodes) return;
    navigator.clipboard?.writeText(recoveryCodes.join("\n"));
    toast({ title: "Copied recovery codes" });
  };

  return (
    <Card data-testid="card-mfa-settings">
      <CardHeader>
        <div className="flex items-start gap-3">
          {status?.enabled ? (
            <ShieldCheck className="h-5 w-5 shrink-0 text-green-600 mt-1" />
          ) : (
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 mt-1" />
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="font-oswald">Two-Factor Authentication</CardTitle>
              {!isLoading && (
                <Badge variant={status?.enabled ? "default" : "secondary"} data-testid="badge-mfa-status">
                  {status?.enabled ? "Enabled" : "Disabled"}
                </Badge>
              )}
            </div>
            <CardDescription className="font-roboto">
              Add a second step at sign-in and protect sensitive actions (deleting users, changing roles, impersonation) with an authenticator app.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Optional-role nudge: encourage turning on 2FA, but let them dismiss. */}
        {!isLoading && status?.promptOptIn && (
          <div
            className="flex items-start justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-3"
            data-testid="banner-mfa-optin"
          >
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Two-factor authentication isn't required for your account, but turning
              it on makes it much harder for someone else to sign in as you.
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => dismissPrompt.mutate()}
              data-testid="button-mfa-optin-dismiss"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : status?.encryptionConfigured === false ? (
          <p className="text-sm text-destructive" data-testid="text-mfa-no-encryption">
            Two-factor authentication is unavailable until the server encryption key is configured.
          </p>
        ) : status?.enabled ? (
          <div className="space-y-3">
            {!showDisable ? (
              <Button variant="outline" onClick={() => setShowDisable(true)} data-testid="button-mfa-disable-start">
                Disable two-factor authentication
              </Button>
            ) : (
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="mfa-disable-code">Enter your authenticator code or a recovery code</Label>
                <Input
                  id="mfa-disable-code"
                  inputMode="text"
                  placeholder="6-digit code or XXXXX-XXXXX recovery code"
                  value={disableToken}
                  onChange={(e) => setDisableToken(e.target.value)}
                  data-testid="input-mfa-disable-code"
                />
                <p className="text-xs text-muted-foreground">
                  Lost access to your authenticator app? Enter one of the recovery codes you saved when you set up 2FA.
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => { setShowDisable(false); setDisableToken(""); }}>Cancel</Button>
                  <Button variant="destructive" onClick={confirmDisable} disabled={disable.isPending || disableToken.trim().length < 6} data-testid="button-mfa-disable-confirm">
                    {disable.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm disable
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : !enrollData ? (
          <Button onClick={startEnroll} disabled={enroll.isPending} data-testid="button-mfa-enroll-start">
            {enroll.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Set up two-factor authentication
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <img src={enrollData.qrDataUrl} alt="MFA QR code" className="h-44 w-44" data-testid="img-mfa-qr" />
              <p className="text-xs text-muted-foreground break-all text-center">
                Can't scan? Manual key: <span className="font-mono">{enrollData.secret}</span>
              </p>
            </div>
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="mfa-activate-code">Enter the 6-digit code to confirm</Label>
              <Input
                id="mfa-activate-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={activateToken}
                onChange={(e) => setActivateToken(e.target.value)}
                data-testid="input-mfa-activate-code"
              />
              <Button onClick={confirmActivate} disabled={activate.isPending || activateToken.trim().length < 6} data-testid="button-mfa-activate-confirm">
                {activate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify & enable
              </Button>
            </div>
          </div>
        )}

        {/* Recovery codes + trusted devices are only meaningful once a real
            second factor is in play. */}
        {!isLoading && status?.enabled && (
          <>
            <RecoverySection
              remaining={status?.recoveryCodesRemaining ?? 0}
              codes={recoveryCodes}
              generating={genRecovery.isPending}
              onGenerate={generateRecovery}
              onCopy={copyCodes}
              onDone={() => setRecoveryCodes(null)}
            />
            <TrustedDevicesSection />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function RecoverySection({
  remaining,
  codes,
  generating,
  onGenerate,
  onCopy,
  onDone,
}: {
  remaining: number;
  codes: string[] | null;
  generating: boolean;
  onGenerate: () => void;
  onCopy: () => void;
  onDone: () => void;
}) {
  return (
    <div className="space-y-3 border-t pt-4" data-testid="section-recovery-codes">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-muted-foreground" />
        <h4 className="font-medium">Recovery codes</h4>
      </div>
      <p className="text-sm text-muted-foreground">
        One-time codes you can use if you lose access to your authenticator.{" "}
        <span data-testid="text-recovery-remaining">{remaining} unused</span>.
      </p>
      {codes ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 rounded-md border bg-muted/40 p-3 font-mono text-sm" data-testid="list-recovery-codes">
            {codes.map((c) => (
              <span key={c} data-testid={`text-recovery-code-${c}`}>{c}</span>
            ))}
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Save these somewhere safe — they won't be shown again.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCopy} data-testid="button-copy-recovery-codes">
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
            <Button variant="ghost" size="sm" onClick={onDone} data-testid="button-recovery-done">
              I've saved them
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={onGenerate} disabled={generating} data-testid="button-generate-recovery-codes">
          {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {remaining > 0 ? "Regenerate recovery codes" : "Generate recovery codes"}
        </Button>
      )}
    </div>
  );
}

function TrustedDevicesSection() {
  const { toast } = useToast();
  const { data, isLoading } = useTrustedDevices();
  const revoke = useRevokeTrustedDevice();
  const devices = data?.devices ?? [];

  const doRevoke = async (input: { id?: string; all?: boolean }) => {
    try {
      await revoke.mutateAsync(input);
      toast({ title: input.all ? "Signed out of all remembered devices" : "Device removed" });
    } catch (err: any) {
      toast({ title: "Could not remove device", description: err?.error || err?.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3 border-t pt-4" data-testid="section-trusted-devices">
      <div className="flex items-center gap-2">
        <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
        <h4 className="font-medium">Remembered devices</h4>
      </div>
      <p className="text-sm text-muted-foreground">
        Devices where you chose "remember this device" skip the second step at
        sign-in for 30 days.
      </p>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : devices.length === 0 ? (
        <p className="text-sm text-muted-foreground" data-testid="text-no-trusted-devices">No remembered devices.</p>
      ) : (
        <div className="space-y-2">
          {devices.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-3 rounded-md border p-2 text-sm" data-testid={`row-trusted-device-${d.id}`}>
              <div>
                <div className="font-medium">
                  {d.label || "Unknown device"}{d.current && <span className="ml-2 text-xs text-green-600">(this device)</span>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {d.ipAddress || "unknown IP"} · expires {new Date(d.expiresAt).toLocaleDateString()}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => doRevoke({ id: d.id })}
                disabled={revoke.isPending}
                data-testid={`button-revoke-device-${d.id}`}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => doRevoke({ all: true })}
            disabled={revoke.isPending}
            data-testid="button-revoke-all-devices"
          >
            {revoke.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Remove all
          </Button>
        </div>
      )}
    </div>
  );
}
