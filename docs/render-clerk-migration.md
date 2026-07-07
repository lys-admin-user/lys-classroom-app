# Migration Runbook — Replit Auth → Clerk, Replit hosting → Render

This app was originally built on Replit (Replit Auth for identity, Replit
connectors for Stripe, and Replit-only env vars for production behaviour). It has
been made **hosting-agnostic**: it still runs on Replit for development, but can
be deployed to Render (or any Node host) without code changes — only environment
variables differ.

See `.env.example` for the full variable list.

---

## What changed

### Identity: Replit Auth → Clerk
- Identity is now **Clerk** (`@clerk/express` on the server, `@clerk/clerk-react`
  in the browser).
- The existing `express-session` + Passport **session machinery is preserved**.
  A middleware turns a verified Clerk session into the app's normal session on
  the first request, so everything downstream (`req.user.claims.sub`,
  `isAuthenticated`, admin impersonation, MFA freshness, the dev-login switcher)
  works unchanged.
- **User linking:** on first Clerk login, the local `users` row is matched by
  **email** and the Clerk id is stored on it (`users.clerk_id`). Existing user
  ids, roles, MFA/recovery/trusted-device state are all preserved — no id ever
  changes. Brand-new emails create a new user.
- Endpoints kept at the same paths: `GET /api/login` now redirects to the
  client `/sign-in` page; `GET /api/logout` revokes the Clerk session and
  destroys the local session. `/api/auth/user` response shape is unchanged.
- New client routes: `/sign-in` and `/sign-up` (Clerk components, full-screen).

### Payments: Replit connector → standard Stripe keys
- Stripe now reads plain `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` env
  vars instead of fetching credentials through the Replit connector proxy.
- The webhook is registered against `PUBLIC_BASE_URL` (or `RENDER_EXTERNAL_URL`).
  If neither is set, automatic registration is skipped and you configure the
  webhook manually in the Stripe dashboard (see below). The receiving endpoint
  verifies the Stripe signature either way.

### Hosting flags: Replit-only → hosting-agnostic
- `server/lib/hosting.ts` centralises two helpers:
  - `isProductionDeployment()` — true on `NODE_ENV=production` **or** the legacy
    `REPLIT_DEPLOYMENT=1`. Drives secure cookies, CSP, indexability, and disables
    dev-only auth bypasses.
  - `getPublicBaseUrl()` — resolves `PUBLIC_BASE_URL` → `RENDER_EXTERNAL_URL` →
    legacy `REPLIT_DOMAINS`/`REPLIT_DEV_DOMAIN`.
- The server already binds `process.env.PORT` on `0.0.0.0`.

### Still on Replit (out of scope)
- **HubSpot** (`server/services/hubspotService.ts`) still uses the Replit
  connector proxy. If you need HubSpot off-Replit, migrate it to a standard
  private-app access token separately.
- **OpenAI**: on Replit the managed integration provisions
  `AI_INTEGRATIONS_OPENAI_API_KEY` and `server/bootstrap-env.ts` bridges it to
  `OPENAI_API_KEY`. Off-Replit, just set `OPENAI_API_KEY` directly.

---

## One-time setup

### 1. Clerk
1. Create a Clerk application (clerk.com).
2. Copy the **Publishable key** and **Secret key** from Dashboard → API Keys.
3. Set `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, and
   `VITE_CLERK_PUBLISHABLE_KEY` (the last two are the same value).
4. In Clerk, enable the sign-in methods you want (email/password, Google, etc.).
5. **Email match matters:** for existing users to keep their accounts/roles, the
   email they sign in with via Clerk must equal their current `users.email`.

### 2. Stripe
1. Set `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`.
2. Set `PUBLIC_BASE_URL` so the app can self-register the webhook, **or** add the
   webhook manually: Dashboard → Developers → Webhooks → Add endpoint →
   `https://<your-domain>/api/stripe/webhook`, then set `STRIPE_WEBHOOK_SECRET`.

### 3. Database
- Point `DATABASE_URL` at your Postgres. Apply schema with `npm run db:push`
  (adds the `users.clerk_id` column + unique constraint; safe on existing data).

---

## Deploying to Render

1. **New Web Service** → connect the repo.
2. **Build command:** `npm install && npm run build`
3. **Start command:** `npm run start`
4. **Environment:** set everything from `.env.example` that applies, with
   `NODE_ENV=production` and `PUBLIC_BASE_URL=https://<your-render-domain>`.
   (`RENDER_EXTERNAL_URL` is provided automatically as a fallback.)
5. Attach a Postgres instance and set `DATABASE_URL`.
6. Deploy. On first boot, confirm the logs show Stripe init and no auth errors.

---

## Local development (Replit or laptop)

- Without Clerk keys, the app **still boots** and the dev-login switcher works;
  protected routes just return 401 until Clerk is configured.
- With Clerk keys set, `/sign-in` and `/sign-up` work end-to-end.
- The dev-only MFA behaviour (fixed code, dev bypass) is automatically disabled
  in any production deployment.

---

## Verification checklist
- [ ] `npm run check` (typecheck) passes.
- [ ] `npx vitest run` passes.
- [ ] App boots with and without Clerk keys.
- [ ] Existing user can sign in via Clerk and keeps their role/data.
- [ ] `/api/logout` signs the user out (Clerk + local session).
- [ ] Stripe webhook receives events (test event from the dashboard).
- [ ] Secure cookies + CSP active when `NODE_ENV=production`.
