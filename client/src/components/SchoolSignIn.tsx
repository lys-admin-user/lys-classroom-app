import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { KeyRound, Loader2 } from "lucide-react";

interface SchoolSignInProps {
  trigger: React.ReactNode;
}

// "Sign in with your school" — looks up the email domain against the configured
// enterprise SSO connections and, when matched, redirects into that provider's
// OIDC flow. Degrades gracefully (clear message) when no connection matches.
export function SchoolSignIn({ trigger }: SchoolSignInProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiRequest("GET", `/api/sso/lookup?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.found && data.connectionId) {
        window.location.href = `/api/sso/login/${data.connectionId}`;
        return;
      }
      setError(
        "We couldn't find single sign-on for that email. Ask your school admin to set it up, or use the standard sign-in.",
      );
    } catch (e: any) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" /> Sign in with your school
          </DialogTitle>
          <DialogDescription>
            Enter your school email and we'll route you to your school's sign-in.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Input
            type="email"
            placeholder="you@yourschool.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && email && handleContinue()}
            data-testid="input-school-email"
          />
          {error && (
            <p className="text-sm text-destructive" data-testid="text-sso-error">
              {error}
            </p>
          )}
          <Button
            className="w-full"
            onClick={handleContinue}
            disabled={!email || loading}
            data-testid="button-sso-continue"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
