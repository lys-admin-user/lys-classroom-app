import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./index.css";

// Clerk identity. The publishable key is safe to expose to the browser. When it
// isn't set (e.g. very first local boot before keys are configured), we render
// the app without ClerkProvider so the dev-login switcher still works.
// In dev builds (Replit preview), prefer the Clerk DEVELOPMENT-instance key —
// production keys are domain-locked to lyslessonplanning.com and render a
// blank login screen on the preview domain. Production builds ignore the dev
// key entirely.
const clerkPublishableKey = (import.meta.env.DEV &&
(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_DEV as string | undefined)
  ? import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_DEV
  : import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) as string | undefined;

const root = createRoot(document.getElementById("root")!);

if (clerkPublishableKey) {
  root.render(
    // signInUrl/signUpUrl point Clerk at our EMBEDDED <SignIn>/<SignUp> pages.
    // Without them Clerk falls back to its hosted Account Portal (accounts.dev)
    // for the OAuth flow, which then crashes on the redirect back to the app
    // ("You're signing back in to Clerk" → client-side exception).
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/sign-in"
    >
      <App />
    </ClerkProvider>,
  );
} else {
  root.render(<App />);
}
