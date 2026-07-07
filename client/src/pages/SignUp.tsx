import { SignUp } from "@clerk/clerk-react";
import { useSearch } from "wouter";

// Full-screen Clerk sign-up. New accounts are linked to (or created in) the
// local users table by email on their first authenticated request.
export default function SignUpPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const raw = params.get("returnTo") || "/";
  const returnTo = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

  return (
    <div
      className="flex items-center justify-center min-h-screen p-4 bg-background"
      data-testid="page-sign-up"
    >
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl={returnTo}
        fallbackRedirectUrl={returnTo}
      />
    </div>
  );
}
