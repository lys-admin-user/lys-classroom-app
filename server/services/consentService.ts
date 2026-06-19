import { db } from "../db";
import { consentEvents, type InsertConsentEvent } from "@shared/schema";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";
import {
  POLICIES,
  CURRENT_POLICY_BUNDLE_VERSION,
  type ConsentContext,
  type ConsentPolicyKey,
} from "@shared/legal";
import type { Request } from "express";

// Extracts a best-effort client IP + user agent from an Express request for the
// consent ledger. Trusts the platform proxy's x-forwarded-for first entry.
export function consentRequestMeta(req: Request): { ipAddress: string | null; userAgent: string | null } {
  const fwd = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim();
  const ipAddress = fwd || req.ip || req.socket?.remoteAddress || null;
  const userAgent = (req.headers["user-agent"] as string | undefined) || null;
  return { ipAddress, userAgent };
}

interface RecordConsentArgs {
  userId?: string | null;
  email?: string | null;
  policyType: ConsentPolicyKey;
  policyVersion: string;
  policyUuid?: string | null;
  action?: "accept" | "withdraw";
  context: ConsentContext;
  ipAddress?: string | null;
  userAgent?: string | null;
}

// Appends a single immutable consent event. Never updates/deletes prior rows.
export async function recordConsent(args: RecordConsentArgs): Promise<void> {
  const row: InsertConsentEvent = {
    userId: args.userId ?? null,
    email: args.email ?? null,
    policyType: args.policyType,
    policyVersion: args.policyVersion,
    policyUuid: args.policyUuid ?? null,
    action: args.action ?? "accept",
    context: args.context,
    ipAddress: args.ipAddress ?? null,
    userAgent: args.userAgent ?? null,
  };
  await db.insert(consentEvents).values(row);
}

// Records affirmative acceptance of the full policy bundle (ToS + Privacy + AI):
// one ledger row per policy plus a "bundle" row, then advances the user's
// accepted version so the re-acceptance modal stops prompting.
export async function recordBundleAcceptance(opts: {
  userId: string;
  email?: string | null;
  context: ConsentContext;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  const base = {
    userId: opts.userId,
    email: opts.email ?? null,
    context: opts.context,
    ipAddress: opts.ipAddress ?? null,
    userAgent: opts.userAgent ?? null,
    action: "accept" as const,
  };

  for (const policy of [POLICIES.tos, POLICIES.privacy, POLICIES.ai]) {
    await recordConsent({ ...base, policyType: policy.type, policyVersion: policy.version, policyUuid: policy.uuid });
  }
  await recordConsent({ ...base, policyType: "bundle", policyVersion: CURRENT_POLICY_BUNDLE_VERSION });

  await db
    .update(users)
    .set({ acceptedPolicyVersion: CURRENT_POLICY_BUNDLE_VERSION, acceptedPolicyAt: new Date() })
    .where(eq(users.id, opts.userId));
}

// Records the de-coupled, standalone authorization for recurring billing,
// separate from the Terms acceptance (ROSCA / FTC requirement).
export async function recordBillingAuthorization(opts: {
  userId: string;
  email?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  await recordConsent({
    userId: opts.userId,
    email: opts.email ?? null,
    policyType: "recurring_billing",
    policyVersion: POLICIES.tos.version,
    policyUuid: POLICIES.tos.uuid,
    context: "checkout",
    ipAddress: opts.ipAddress ?? null,
    userAgent: opts.userAgent ?? null,
  });
}
