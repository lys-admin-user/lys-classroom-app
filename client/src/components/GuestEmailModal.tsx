import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, BookOpen, FileText, Mail } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export interface GuestEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Called after the email is successfully captured so the caller can proceed
  // with the action the user was trying to take (e.g. generate the lesson).
  onCaptured: () => void;
}

// Email gate shown the first time an anonymous visitor tries to generate a
// free lesson. Capturing an email (not a full signup) unlocks the 5 free
// monthly lessons and adds them to the contact list. Browser tracking still
// enforces the monthly ceiling server-side.
export function GuestEmailModal({ open, onOpenChange, onCaptured }: GuestEmailModalProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/lessons/guest-email", { email: trimmed });
      onOpenChange(false);
      setEmail("");
      onCaptured();
    } catch (e: any) {
      toast({
        title: "Something went wrong",
        description: e?.message || "Could not save your email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]" data-testid="modal-guest-email">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-lys-yellow" />
            <DialogTitle className="font-oswald text-xl">Get 5 free lessons</DialogTitle>
          </div>
          <DialogDescription className="font-roboto">
            Enter your email to unlock 5 free AI-generated lessons this month — no account needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="guest-email" className="font-roboto">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="guest-email"
              type="email"
              autoFocus
              placeholder="you@school.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              className="pl-9"
              disabled={submitting}
              data-testid="input-guest-email"
            />
          </div>
        </div>

        <ul className="space-y-1.5 text-sm font-roboto text-muted-foreground">
          <li className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-lys-teal" /> 5 free lessons every month
          </li>
          <li className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-lys-teal" /> Full standards-aligned lesson plans
          </li>
          <li className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-lys-teal" /> Sign up later to save them to your library
          </li>
        </ul>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            data-testid="button-email-dismiss"
          >
            Not now
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-lys-red hover:bg-lys-red/90 text-white"
            data-testid="button-email-submit"
          >
            {submitting ? "Unlocking…" : "Unlock free lessons"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
