import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { useMfaStatus, useMfaEnroll, useMfaActivate, useMfaDisable } from "@/hooks/use-mfa";
import { useToast } from "@/hooks/use-toast";

// Admin-facing card to enable / disable TOTP two-factor authentication. Shown in
// Settings for roles that can perform sensitive admin actions.
export function MfaSettingsCard() {
  const { toast } = useToast();
  const { data: status, isLoading } = useMfaStatus();
  const enroll = useMfaEnroll();
  const activate = useMfaActivate();
  const disable = useMfaDisable();

  const [enrollData, setEnrollData] = useState<{ qrDataUrl: string; secret: string } | null>(null);
  const [activateToken, setActivateToken] = useState("");
  const [disableToken, setDisableToken] = useState("");
  const [showDisable, setShowDisable] = useState(false);

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
      await activate.mutateAsync(activateToken);
      setEnrollData(null);
      setActivateToken("");
      toast({ title: "Two-factor authentication enabled" });
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

  return (
    <Card data-testid="card-mfa-settings">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {status?.enabled ? (
              <ShieldCheck className="h-5 w-5 text-green-600" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-amber-600" />
            )}
            <div>
              <CardTitle className="font-oswald">Two-Factor Authentication</CardTitle>
              <CardDescription className="font-roboto">
                Protect sensitive admin actions (deleting users, changing roles, impersonation) with an authenticator app.
              </CardDescription>
            </div>
          </div>
          {!isLoading && (
            <Badge variant={status?.enabled ? "default" : "secondary"} data-testid="badge-mfa-status">
              {status?.enabled ? "Enabled" : "Disabled"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
                <Label htmlFor="mfa-disable-code">Enter a current code to confirm</Label>
                <Input
                  id="mfa-disable-code"
                  inputMode="numeric"
                  placeholder="123456"
                  value={disableToken}
                  onChange={(e) => setDisableToken(e.target.value)}
                  data-testid="input-mfa-disable-code"
                />
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
      </CardContent>
    </Card>
  );
}
