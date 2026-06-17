import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";
import { useMfaVerify, useMfaEnroll, useMfaActivate } from "@/hooks/use-mfa";
import { useToast } from "@/hooks/use-toast";

interface MfaStepUpDialogProps {
  open: boolean;
  // Set when the action failed because the admin has not enrolled MFA yet.
  enrollmentRequired: boolean;
  onClose: () => void;
  // Called after a successful verification so the caller can retry the action.
  onVerified: () => void;
}

// Reusable dialog that satisfies a `requireFreshMfa` challenge. When the admin
// has not enrolled, it walks them through enrollment (QR + confirm) first; the
// activation also marks the session as freshly verified, so the original action
// can proceed immediately afterwards.
export function MfaStepUpDialog({ open, enrollmentRequired, onClose, onVerified }: MfaStepUpDialogProps) {
  const { toast } = useToast();
  const [token, setToken] = useState("");
  const [enrollData, setEnrollData] = useState<{ qrDataUrl: string; secret: string } | null>(null);

  const enroll = useMfaEnroll();
  const activate = useMfaActivate();
  const verify = useMfaVerify();

  const startEnroll = async () => {
    try {
      const data = await enroll.mutateAsync();
      setEnrollData({ qrDataUrl: data.qrDataUrl, secret: data.secret });
    } catch (err: any) {
      toast({ title: "Could not start setup", description: err?.error || err?.message, variant: "destructive" });
    }
  };

  const handleConfirm = async () => {
    try {
      if (enrollmentRequired) {
        if (!enrollData) {
          await startEnroll();
          return;
        }
        await activate.mutateAsync(token);
      } else {
        await verify.mutateAsync(token);
      }
      setToken("");
      setEnrollData(null);
      onVerified();
    } catch (err: any) {
      toast({ title: "Verification failed", description: err?.error || err?.message || "Invalid code", variant: "destructive" });
    }
  };

  const busy = enroll.isPending || activate.isPending || verify.isPending;
  const needsEnrollStart = enrollmentRequired && !enrollData;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setToken(""); setEnrollData(null); onClose(); } }}>
      <DialogContent data-testid="dialog-mfa-stepup">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {enrollmentRequired ? "Set up two-factor authentication" : "Verify it's you"}
          </DialogTitle>
          <DialogDescription>
            {enrollmentRequired
              ? "This sensitive action requires two-factor authentication. Scan the code with an authenticator app, then enter the 6-digit code to continue."
              : "Enter the 6-digit code from your authenticator app to continue."}
          </DialogDescription>
        </DialogHeader>

        {needsEnrollStart ? (
          <div className="py-2 text-sm text-muted-foreground">
            Click “Start setup” to generate your authenticator QR code.
          </div>
        ) : (
          <div className="space-y-4">
            {enrollData && (
              <div className="flex flex-col items-center gap-2">
                <img src={enrollData.qrDataUrl} alt="MFA QR code" className="h-44 w-44" data-testid="img-mfa-qr" />
                <p className="text-xs text-muted-foreground break-all text-center">
                  Manual key: <span className="font-mono">{enrollData.secret}</span>
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="mfa-stepup-code">Authentication code</Label>
              <Input
                id="mfa-stepup-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                data-testid="input-mfa-code"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => { setToken(""); setEnrollData(null); onClose(); }} data-testid="button-mfa-cancel">
            Cancel
          </Button>
          <Button
            onClick={needsEnrollStart ? startEnroll : handleConfirm}
            disabled={busy || (!needsEnrollStart && token.trim().length < 6)}
            data-testid="button-mfa-confirm"
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {needsEnrollStart ? "Start setup" : "Verify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
