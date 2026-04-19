import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Heart } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  scholarshipTitle?: string;
  isSaving?: boolean;
}

export function PursuitReasonDialog({ open, onClose, onConfirm, scholarshipTitle, isSaving }: Props) {
  const [reason, setReason] = useState("");
  useEffect(() => { if (open) setReason(""); }, [open, scholarshipTitle]);

  const valid = reason.trim().length >= 5;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md" data-testid="dialog-pursuit-reason">
        <DialogHeader>
          <DialogTitle className="font-oswald flex items-center gap-2">
            <Heart className="h-5 w-5 text-lys-yellow" />
            Why are you pursuing this?
          </DialogTitle>
          <DialogDescription className="font-roboto text-sm">
            Before saving <strong>{scholarshipTitle || "this scholarship"}</strong>, write one sentence about why this matters to you.
            Doing reflects your Being.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="pursuit-reason" className="font-roboto text-sm">My reason</Label>
          <Textarea
            id="pursuit-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. This honors my family's sacrifice and matches the future I'm building."
            className="min-h-[90px]"
            data-testid="input-pursuit-reason"
          />
          <p className="text-xs text-muted-foreground font-roboto">At least 5 characters. You'll see this in your Scholarship Planner.</p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-pursuit">Cancel</Button>
          <Button onClick={() => onConfirm(reason.trim())} disabled={!valid || isSaving} data-testid="button-confirm-pursuit">
            {isSaving ? "Saving..." : "Save to Planner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
