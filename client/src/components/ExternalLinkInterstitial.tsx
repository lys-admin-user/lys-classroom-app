import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, ExternalLink, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { markKnowingCheckSeen } from "@/lib/externalLinkPolicy";

export type ScholarshipKnowingPanel = {
  resourceId: string;
  title: string;
  url: string;
  trustLevel?: "verified" | "community" | "external" | string | null;
  lastVerifiedAt?: string | Date | null;
  requiresFee?: boolean | null;
  privacyConcern?: boolean | null;
  nextDeadline?: string | Date | null;
  scholarshipDeadline?: string | null;
};

interface Props {
  open: boolean;
  onClose: () => void;
  scholarship: ScholarshipKnowingPanel | null;
}

export function ExternalLinkInterstitial({ open, onClose, scholarship }: Props) {
  const [verifiedDeadline, setVerifiedDeadline] = useState(false);
  const [verifiedEligibility, setVerifiedEligibility] = useState(false);
  const [noFeePledge, setNoFeePledge] = useState(false);

  useEffect(() => {
    if (open) {
      setVerifiedDeadline(false);
      setVerifiedEligibility(false);
      setNoFeePledge(false);
    }
  }, [open, scholarship?.resourceId]);

  if (!scholarship) return null;
  const allChecked = verifiedDeadline && verifiedEligibility && noFeePledge;

  const verifiedDate = scholarship.lastVerifiedAt
    ? new Date(scholarship.lastVerifiedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "Not yet verified";

  const deadlineDate = scholarship.nextDeadline
    ? new Date(scholarship.nextDeadline)
    : null;
  const now = new Date();
  const deadlinePassed = deadlineDate ? deadlineDate < now : false;
  const daysLeft = deadlineDate ? Math.ceil((deadlineDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : null;

  const handleProceed = () => {
    if (!allChecked) return;
    markKnowingCheckSeen(scholarship.resourceId);
    window.open(scholarship.url, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg" data-testid="dialog-knowing-check">
        <DialogHeader>
          <DialogTitle className="font-oswald text-xl flex items-center gap-2">
            <Shield className="h-5 w-5 text-lys-teal" />
            Knowing Check
          </DialogTitle>
          <DialogDescription className="font-roboto">
            You're about to leave LYS for an external scholarship site. Take 10 seconds to verify before you go.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-md border bg-muted/30 p-3 space-y-2 text-sm">
            <div className="font-oswald text-base">{scholarship.title}</div>
            <div className="grid grid-cols-2 gap-2 text-xs font-roboto">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-lys-teal" />
                <span>LYS verified: <strong>{verifiedDate}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-xs capitalize">{scholarship.trustLevel || "external"}</Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Deadline: <strong>{scholarship.scholarshipDeadline || "Varies"}</strong></span>
              </div>
              <div>
                {deadlinePassed ? (
                  <Badge variant="destructive" className="text-xs">Deadline passed</Badge>
                ) : daysLeft != null ? (
                  <Badge variant="secondary" className="text-xs">{daysLeft} day{daysLeft === 1 ? "" : "s"} left</Badge>
                ) : null}
              </div>
            </div>
          </div>

          {scholarship.requiresFee && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>This listing reports an application fee</AlertTitle>
              <AlertDescription className="text-xs">
                LYS does not endorse paid scholarship applications. Legitimate scholarships are free to apply for.
              </AlertDescription>
            </Alert>
          )}
          {scholarship.privacyConcern && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Privacy heads-up</AlertTitle>
              <AlertDescription className="text-xs">
                This site may collect more data than is required to apply. Only share what's necessary.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 pt-1">
            <label className="flex items-start gap-2 text-sm font-roboto cursor-pointer">
              <Checkbox checked={verifiedDeadline} onCheckedChange={(v) => setVerifiedDeadline(!!v)} data-testid="check-verify-deadline" className="mt-0.5" />
              <span>I will verify the deadline on the official site before I begin.</span>
            </label>
            <label className="flex items-start gap-2 text-sm font-roboto cursor-pointer">
              <Checkbox checked={verifiedEligibility} onCheckedChange={(v) => setVerifiedEligibility(!!v)} data-testid="check-verify-eligibility" className="mt-0.5" />
              <span>I will confirm I meet the eligibility requirements before applying.</span>
            </label>
            <label className="flex items-start gap-2 text-sm font-roboto cursor-pointer">
              <Checkbox checked={noFeePledge} onCheckedChange={(v) => setNoFeePledge(!!v)} data-testid="check-no-fee-pledge" className="mt-0.5" />
              <span>I will <strong>never pay a fee</strong> to apply. Real scholarships are free.</span>
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-knowing">Cancel</Button>
          <Button
            onClick={handleProceed}
            disabled={!allChecked}
            className="gap-2"
            data-testid="button-proceed-external"
          >
            Continue to site <ExternalLink className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
