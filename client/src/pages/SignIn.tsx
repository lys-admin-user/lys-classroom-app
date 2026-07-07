import { SignIn } from "@clerk/clerk-react";
import { useSearch } from "wouter";

// Full-screen Clerk sign-in. Reached via /api/login (server redirect) or direct
// navigation. `returnTo` is a server-validated same-origin path passed through
// so the user lands back where they started after signing in.
export default function SignInPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const raw = params.get("returnTo") || "/";
  const returnTo = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

  return (
    <div
      className="flex items-center justify-center min-h-screen p-4 bg-background"
      data-testid="page-sign-in"
    >
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl={returnTo}
        fallbackRedirectUrl={returnTo}
      />
    </div>
  );
}
