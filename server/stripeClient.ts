import Stripe from 'stripe';

// Standard, hosting-agnostic Stripe credentials. Reads plain env vars
// (STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY) instead of fetching credentials
// through Replit's connector proxy, so the same code runs on Render or anywhere.

function getSecretKeyOrThrow(): string {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Add your Stripe secret key to the environment ' +
      '(Replit Secrets in dev, Render env vars in production).',
    );
  }
  return secretKey;
}

// WARNING: Never cache this client.
// Always call this function again to get a fresh client.
export async function getUncachableStripeClient() {
  return new Stripe(getSecretKeyOrThrow(), {
    apiVersion: '2025-08-27.basil' as any,
  });
}

export async function getStripePublishableKey() {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error(
      'STRIPE_PUBLISHABLE_KEY is not set. Add your Stripe publishable key to the environment.',
    );
  }
  return publishableKey;
}

export async function getStripeSecretKey() {
  return getSecretKeyOrThrow();
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

// StripeSync singleton for webhook processing and data sync. The library is a
// generic Stripe→Postgres sync tool (uses a plain secret key + DATABASE_URL);
// it has no Replit runtime dependency once fed a standard secret key.
let stripeSync: any = null;

export async function getStripeSync() {
  if (!stripeSync) {
    const { StripeSync } = await import('stripe-replit-sync');
    const secretKey = getSecretKeyOrThrow();

    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: process.env.DATABASE_URL!,
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}
