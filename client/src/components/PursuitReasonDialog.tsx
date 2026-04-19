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
  /** When provided, dialog is in "edit" mode and pre-fills with this value. */
  initialValue?: string;
  mode?: "save" | "edit";
}

export function PursuitReasonDialog({ open, onClose, onConfirm, scholarshipTitle, isSaving, initialValue, mode = "save" }: Props) {
  const [reason, setReason] = useState(initialValue || "");
  useEffect(() => { if (open) setReason(initialValue || ""); }, [open, scholarshipTitle, initialValue]);

  const valid = reason.trim().length >= 5;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md" data-testid="dialog-pursuit-reason">
        <DialogHeader>
          <DialogTitle className="font-oswald flex items-center gap-2">
            <Heart className="h-5 w-5 text-lys-yellow" />
            {mode === "edit" ? "Edit your reason" : "Why are you pursuing this?"}
          </DialogTitle>
          <DialogDescription className="font-roboto text-sm">
            {mode === "edit" ? (
              <>Update why <strong>{scholarshipTitle || "this scholarship"}</strong> matters to you.</>
            ) : (
              <>Before saving <strong>{scholarshipTitle || "this scholarship"}</strong>, write one sentence about why this matters to you. Doing reflects your Being.</>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="pursuit-reason" className="font-roboto text-sm">My reason</Label>
          <Textarea
            id="pursuit-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Aligns with my goal of studying nursing, and the essay topic matches my story."
            className="min-h-[90px]"
            data-testid="input-pursuit-reason"
          />
          <p className="text-xs text-muted-foreground font-roboto">At least 5 characters. You'll see this in your Scholarship Planner.</p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-pursuit">Cancel</Button>
          <Button onClick={() => onConfirm(reason.trim())} disabled={!valid || isSaving} data-testid="button-confirm-pursuit">
            {isSaving ? "Saving..." : mode === "edit" ? "Save changes" : "Save to Planner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
