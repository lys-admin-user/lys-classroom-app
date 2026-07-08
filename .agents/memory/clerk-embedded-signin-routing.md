---
name: Clerk embedded SignIn requires signInUrl/signUpUrl
description: Why embedded Clerk <SignIn>/<SignUp> must have signInUrl/signUpUrl set on ClerkProvider, or OAuth crashes via the hosted Account Portal.
---

# Clerk embedded sign-in falls back to hosted Account Portal without signInUrl/signUpUrl

When using Clerk's **embedded** `<SignIn>`/`<SignUp>` components (`routing="path"`),
`<ClerkProvider>` MUST also be given `signInUrl` and `signUpUrl` (or the
`VITE_CLERK_SIGN_IN_URL` / `VITE_CLERK_SIGN_UP_URL` env vars). Otherwise Clerk
defaults to its **hosted Account Portal** (`*.accounts.dev`) for parts of the
OAuth flow.

**Symptom (Google/social login):** click "Continue with Google" → popup shows the
Account Portal page "You're signing back in to Clerk" on `<slug>.accounts.dev` →
clicking Continue throws **"Application error: a client-side exception has
occurred"**. That exact wording is Clerk's hosted (Next.js) portal error, NOT our
app's ErrorBoundary ("Something went wrong") and NOT the Vite dev overlay — so the
crash is on Clerk's side during the handoff back, which is the tell that the flow
was bounced to the Account Portal.

**Why:** the embedded components construct callbacks against your app paths, but
without `signInUrl`/`signUpUrl` Clerk's global routing still points at the Account
Portal, producing an inconsistent handoff that crashes on redirect back.

**How to apply:** set both on ClerkProvider — `signInUrl="/sign-in"`,
`signUpUrl="/sign-up"` (kept in `client/src/main.tsx`). App must also render the
`/sign-in/sso-callback` sub-route inside the embedded `<SignIn>` (AppShell already
routes any `/sign-in*` / `/sign-up*` path full-screen to the Clerk pages).

**Ruled out for this crash:** React `StrictMode` double-invoking the callback
(main.tsx does not use StrictMode); Clerk SDK version (5.61.8 / express 2.1.36 are
fine); server-side auth (the establisher/`/api/login` are correct — crash is
purely client/Clerk-hosted).
