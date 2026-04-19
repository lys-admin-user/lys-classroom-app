import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  resourceId: string | null;
  resourceTitle?: string;
}

const REASONS = [
  { value: "scam_or_fee", label: "Asks for a fee" },
  { value: "scam_or_fee_other", label: "Looks like a scam" },
  { value: "expired", label: "Deadline already passed" },
  { value: "broken_link", label: "Broken link" },
  { value: "misleading", label: "Misleading or inaccurate info" },
  { value: "privacy_concern", label: "Asks for too much personal data" },
  { value: "other", label: "Other" },
];

export function ReportScholarshipDialog({ open, onClose, resourceId, resourceTitle }: Props) {
  const [reason, setReason] = useState("broken_link");
  const [details, setDetails] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (open) { setReason("broken_link"); setDetails(""); }
  }, [open, resourceId]);

  const mutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/resource-reports", { resourceId, reason, details: details || undefined }),
    onSuccess: () => {
      toast({
        title: "Thanks for the heads-up",
        description: "Our team reviews flags within 7 days. If 3 students report the same listing, it auto-hides while we investigate.",
      });
      onClose();
    },
    onError: () => {
      toast({ title: "Couldn't submit", description: "Please try again.", variant: "destructive" });
    },
  });

  if (!resourceId) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md" data-testid="dialog-report-scholarship">
        <DialogHeader>
          <DialogTitle className="font-oswald">Report this scholarship</DialogTitle>
          <DialogDescription className="font-roboto text-sm">
            {resourceTitle ? <>Help us keep <strong>{resourceTitle}</strong> safe and accurate.</> : "Help us keep our listings safe and accurate."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={reason} onValueChange={setReason}>
            {REASONS.map((r) => (
              <div key={r.value} className="flex items-center space-x-2">
                <RadioGroupItem value={r.value} id={`reason-${r.value}`} data-testid={`radio-reason-${r.value}`} />
                <Label htmlFor={`reason-${r.value}`} className="font-roboto text-sm cursor-pointer">{r.label}</Label>
              </div>
            ))}
          </RadioGroup>
          <div>
            <Label htmlFor="report-details" className="font-roboto text-sm">Optional details</Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Anything an admin should know?"
              data-testid="input-report-details"
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-report">Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} data-testid="button-submit-report">
            {mutation.isPending ? "Submitting..." : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
