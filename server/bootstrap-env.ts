if (!process.env.OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
}
if (!process.env.OPENAI_BASE_URL && process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
  process.env.OPENAI_BASE_URL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
}

// In development, prefer Clerk's DEVELOPMENT-instance keys when present so
// login works on the Replit preview domain (production keys are locked to
// lyslessonplanning.com). Production deployments never hit this branch, so
// the live site keeps using the production keys unchanged.
if (process.env.NODE_ENV !== "production") {
  if (process.env.CLERK_SECRET_KEY_DEV) {
    process.env.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY_DEV;
    console.log("[bootstrap-env] Clerk DEVELOPMENT-instance keys active (dev only)");
  }
  if (process.env.VITE_CLERK_PUBLISHABLE_KEY_DEV) {
    process.env.CLERK_PUBLISHABLE_KEY = process.env.VITE_CLERK_PUBLISHABLE_KEY_DEV;
    // Clerk's dev instance is served from *.clerk.accounts.dev, not the
    // first-party production domain — clear the prod frontend API override so
    // the CSP fallback wildcards apply.
    delete process.env.CLERK_FRONTEND_API_URL;
  }
}
