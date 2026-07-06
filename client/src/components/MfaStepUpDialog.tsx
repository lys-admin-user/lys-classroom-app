import { useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ShieldCheck, Mail, Smartphone, KeyRound } from "lucide-react";
import {
  useMfaVerify,
  useMfaEnroll,
  useMfaActivate,
  useMfaEmailSend,
  useMfaEmailVerify,
  type MfaMethods,
  type OtpPurpose,
} from "@/hooks/use-mfa";
import { useToast } from "@/hooks/use-toast";

interface MfaStepUpDialogProps {
  open: boolean;
  // Set when the action failed because the user has no usable factor enrolled.
  enrollmentRequired: boolean;
  onClose: () => void;
  // Called after a successful verification so the caller can retry the action.
  onVerified: () => void;
  // Which second factors the server says are available for this user.
  methods?: MfaMethods;
  // Purpose passed to the email-code endpoints ("mfa" step-up vs "login" gate).
  purpose?: OtpPurpose;
  // When false, hides Cancel and prevents dismissal (used for the login gate).
  dismissable?: boolean;
  // Show the "remember this device for 30 days" checkbox (login gate only —
  // never for sensitive step-up, which must re-challenge every time).
  allowRememberDevice?: boolean;
  title?: string;
  description?: string;
}

// Reusable dialog that satisfies an MFA challenge. Supports two factors:
//   - Authenticator app (TOTP): enroll (QR + confirm) if needed, else verify.
//   - Email code: send a one-time code to the account email, then verify.
// Either path marks the session as freshly verified so the original action (or
// the login gate) can proceed immediately afterwards.
export function MfaStepUpDialog({
  open,
  enrollmentRequired,
  onClose,
  onVerified,
  methods,
  purpose = "mfa",
  dismissable = true,
  allowRememberDevice = false,
  title,
  description,
}: MfaStepUpDialogProps) {
  const { toast } = useToast();
  const [token, setToken] = useState("");
  const [enrollData, setEnrollData] = useState<{ qrDataUrl: string; secret: string } | null>(null);
  const [mode, setMode] = useState<"app" | "email" | "recovery">("app");
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);
  const [rememberDevice, setRememberDevice] = useState(false);
  // Recovery codes returned once at enrollment; shown until the user confirms.
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  const enroll = useMfaEnroll();
  const activate = useMfaActivate();
  const verify = useMfaVerify();
  const emailSend = useMfaEmailSend();
  const emailVerify = useMfaEmailVerify();

  const hasTotp = methods ? methods.totp : !enrollmentRequired;
  const hasEmail = methods ? methods.email : false;

  // Choose a sensible default factor whenever the dialog (re)opens.
  useEffect(() => {
    if (!open) return;
    if (enrollmentRequired) {
      setMode("app");
    } else if (hasTotp) {
      setMode("app");
    } else if (hasEmail) {
      setMode("email");
    }
    setToken("");
    setEnrollData(null);
    setEmailSentTo(null);
    setRememberDevice(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const startEnroll = async () => {
    try {
      const data = await enroll.mutateAsync();
      setEnrollData({ qrDataUrl: data.qrDataUrl, secret: data.secret });
    } catch (err: any) {
      toast({ title: "Could not start setup", description: err?.error || err?.message, variant: "destructive" });
    }
  };

  const sendEmailCode = async () => {
    try {
      const res = await emailSend.mutateAsync(purpose);
      setEmailSentTo(res.sentTo || "your email");
      toast({ title: "Code sent", description: `We emailed a 6-digit code to ${res.sentTo || "your account email"}.` });
    } catch (err: any) {
      toast({ title: "Could not send code", description: err?.error || err?.message, variant: "destructive" });
    }
  };

  const handleConfirm = async () => {
    try {
      const remember = allowRememberDevice && rememberDevice;
      if (mode === "email") {
        await emailVerify.mutateAsync({ code: token, purpose, rememberDevice: remember });
      } else if (mode === "recovery") {
        await verify.mutateAsync({ token, rememberDevice: remember });
      } else if (enrollmentRequired) {
        if (!enrollData) {
          await startEnroll();
          return;
        }
        const res = await activate.mutateAsync(token);
        // Show recovery codes once before finishing enrollment.
        if (res.recoveryCodes?.length) {
          setRecoveryCodes(res.recoveryCodes);
          setToken("");
          setEnrollData(null);
          setEmailSentTo(null);
          return;
        }
      } else {
        await verify.mutateAsync({ token, rememberDevice: remember });
      }
      setToken("");
      setEnrollData(null);
      setEmailSentTo(null);
      onVerified();
    } catch (err: any) {
      toast({ title: "Verification failed", description: err?.error || err?.message || "Invalid code", variant: "destructive" });
    }
  };

  const busy =
    enroll.isPending || activate.isPending || verify.isPending || emailSend.isPending || emailVerify.isPending;
  const needsEnrollStart = mode === "app" && enrollmentRequired && !enrollData;
  const needsEmailSend = mode === "email" && !emailSentTo;

  const close = () => {
    setToken("");
    setEnrollData(null);
    setEmailSentTo(null);
    onClose();
  };

  const computedTitle =
    title ?? (mode === "app" && enrollmentRequired ? "Set up two-factor authentication" : "Verify it's you");
  const computedDescription =
    description ??
    (mode === "email"
      ? "We'll email a 6-digit code to your account address. Enter it below to continue."
      : enrollmentRequired
      ? "This action requires two-factor authentication. Scan the code with an authenticator app, then enter the 6-digit code to continue."
      : "Enter the 6-digit code from your authenticator app to continue.");

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          if (dismissable) close();
        }
      }}
    >
      <DialogContent
        data-testid="dialog-mfa-stepup"
        onInteractOutside={(e) => { if (!dismissable) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (!dismissable) e.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {computedTitle}
          </DialogTitle>
          <DialogDescription>{computedDescription}</DialogDescription>
        </DialogHeader>

        {recoveryCodes ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Save these one-time recovery codes somewhere safe. Each works only
              once and they won't be shown again.
            </p>
            <div className="grid grid-cols-2 gap-2 rounded-md border p-3 font-mono text-sm" data-testid="list-recovery-codes">
              {recoveryCodes.map((code) => (
                <span key={code} data-testid={`text-recovery-code-${code}`}>{code}</span>
              ))}
            </div>
          </div>
        ) : (
        <>
        {/* Factor switch. Recovery codes are always offered as a fallback so a
            user who lost their authenticator/email can still get in. */}
        {!enrollmentRequired && (hasTotp || hasEmail) && (
          <div className="flex flex-wrap gap-2">
            {hasTotp && (
              <Button
                type="button"
                size="sm"
                variant={mode === "app" ? "default" : "outline"}
                onClick={() => { setMode("app"); setToken(""); }}
                data-testid="button-mfa-method-app"
              >
                <Smartphone className="mr-2 h-4 w-4" /> Authenticator
              </Button>
            )}
            {hasEmail && (
              <Button
                type="button"
                size="sm"
                variant={mode === "email" ? "default" : "outline"}
                onClick={() => { setMode("email"); setToken(""); }}
                data-testid="button-mfa-method-email"
              >
                <Mail className="mr-2 h-4 w-4" /> Email code
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant={mode === "recovery" ? "default" : "outline"}
              onClick={() => { setMode("recovery"); setToken(""); }}
              data-testid="button-mfa-method-recovery"
            >
              <KeyRound className="mr-2 h-4 w-4" /> Recovery code
            </Button>
          </div>
        )}

        {needsEnrollStart ? (
          <div className="py-2 text-sm text-muted-foreground">
            Click “Start setup” to generate your authenticator QR code.
          </div>
        ) : needsEmailSend ? (
          <div className="py-2 text-sm text-muted-foreground">
            Click “Send code” and we'll email you a 6-digit verification code.
          </div>
        ) : (
          <div className="space-y-4">
            {enrollData && mode === "app" && (
              <div className="flex flex-col items-center gap-2">
                <img src={enrollData.qrDataUrl} alt="MFA QR code" className="h-44 w-44" data-testid="img-mfa-qr" />
                <p className="text-xs text-muted-foreground break-all text-center">
                  Manual key: <span className="font-mono">{enrollData.secret}</span>
                </p>
              </div>
            )}
            {mode === "email" && emailSentTo && (
              <p className="text-xs text-muted-foreground">
                Code sent to <span className="font-medium">{emailSentTo}</span>.{" "}
                <button type="button" className="underline" onClick={sendEmailCode} data-testid="button-mfa-email-resend">
                  Resend
                </button>
              </p>
            )}
            {mode === "recovery" && (
              <p className="text-xs text-muted-foreground">
                Enter one of the one-time recovery codes you saved when you set up
                two-factor authentication. Each code works only once.
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="mfa-stepup-code">
                {mode === "email" ? "Email code" : mode === "recovery" ? "Recovery code" : "Authentication code"}
              </Label>
              <Input
                id="mfa-stepup-code"
                inputMode={mode === "recovery" ? "text" : "numeric"}
                autoComplete="one-time-code"
                placeholder={mode === "recovery" ? "ABCDE-FGHJK" : "123456"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                data-testid="input-mfa-code"
              />
            </div>
            {allowRememberDevice && !enrollmentRequired && (
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={rememberDevice}
                  onCheckedChange={(v) => setRememberDevice(v === true)}
                  data-testid="checkbox-remember-device"
                />
                Remember this device for 30 days
              </label>
            )}
          </div>
        )}
        </>
        )}

        <DialogFooter>
          {recoveryCodes ? (
            <Button
              onClick={() => { setRecoveryCodes(null); onVerified(); }}
              data-testid="button-mfa-recovery-done"
            >
              I've saved my codes
            </Button>
          ) : (
            <>
              {dismissable && (
                <Button variant="ghost" onClick={close} data-testid="button-mfa-cancel">
                  Cancel
                </Button>
              )}
              <Button
                onClick={needsEnrollStart ? startEnroll : needsEmailSend ? sendEmailCode : handleConfirm}
                disabled={busy || (!needsEnrollStart && !needsEmailSend && token.trim().length < 6)}
                data-testid="button-mfa-confirm"
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {needsEnrollStart ? "Start setup" : needsEmailSend ? "Send code" : "Verify"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
