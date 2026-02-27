import type { EducatorAffiliate } from "@shared/schema";

export interface ExternalAffiliateResult {
  success: boolean;
  externalId?: string;
  message: string;
  demoMode: boolean;
}

export interface PayoutResult {
  success: boolean;
  transactionId?: string;
  message: string;
  demoMode: boolean;
}

const REWARDFUL_API_KEY = process.env.REWARDFUL_API_KEY;
const PARTNERSTACK_API_KEY = process.env.PARTNERSTACK_API_KEY;
const STRIPE_CONNECT_SECRET = process.env.STRIPE_CONNECT_SECRET;

function isRewardfulConfigured(): boolean {
  return !!REWARDFUL_API_KEY;
}

function isPartnerstackConfigured(): boolean {
  return !!PARTNERSTACK_API_KEY;
}

function isStripeConnectConfigured(): boolean {
  return !!STRIPE_CONNECT_SECRET;
}

export async function registerRewardfulAffiliate(affiliate: EducatorAffiliate): Promise<ExternalAffiliateResult> {
  if (!isRewardfulConfigured()) {
    console.log(`[Rewardful DEMO] Would register affiliate ${affiliate.referralCode} with Rewardful API`);
    return {
      success: true,
      externalId: `rfl_demo_${affiliate.id.slice(0, 8)}`,
      message: "Demo mode: Rewardful integration not configured. Set REWARDFUL_API_KEY to enable.",
      demoMode: true,
    };
  }

  try {
    const response = await fetch("https://api.getrewardful.com/v1/affiliates", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${REWARDFUL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        first_name: affiliate.displayName || "Educator",
        email: `affiliate-${affiliate.userId}@lys.edu`,
        token: affiliate.referralCode,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, message: `Rewardful API error: ${errText}`, demoMode: false };
    }

    const data = await response.json() as { id: string };
    return { success: true, externalId: data.id, message: "Registered with Rewardful", demoMode: false };
  } catch (error) {
    return { success: false, message: `Rewardful connection failed: ${error}`, demoMode: false };
  }
}

export async function registerPartnerstackAffiliate(affiliate: EducatorAffiliate): Promise<ExternalAffiliateResult> {
  if (!isPartnerstackConfigured()) {
    console.log(`[PartnerStack DEMO] Would register affiliate ${affiliate.referralCode} with PartnerStack API`);
    return {
      success: true,
      externalId: `ps_demo_${affiliate.id.slice(0, 8)}`,
      message: "Demo mode: PartnerStack integration not configured. Set PARTNERSTACK_API_KEY to enable.",
      demoMode: true,
    };
  }

  try {
    const response = await fetch("https://api.partnerstack.com/api/v2/partners", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PARTNERSTACK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: affiliate.displayName || "Educator",
        key: affiliate.referralCode,
        group_key: "educators",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, message: `PartnerStack API error: ${errText}`, demoMode: false };
    }

    const data = await response.json() as { key: string };
    return { success: true, externalId: data.key, message: "Registered with PartnerStack", demoMode: false };
  } catch (error) {
    return { success: false, message: `PartnerStack connection failed: ${error}`, demoMode: false };
  }
}

export async function requestStripeConnectPayout(
  affiliate: EducatorAffiliate,
  amountCents: number
): Promise<PayoutResult> {
  if (!isStripeConnectConfigured()) {
    console.log(`[Stripe Connect DEMO] Would pay $${(amountCents / 100).toFixed(2)} to affiliate ${affiliate.referralCode}`);
    return {
      success: true,
      transactionId: `txn_demo_${Date.now()}`,
      message: `Demo mode: Would transfer $${(amountCents / 100).toFixed(2)} via Stripe Connect. Set STRIPE_CONNECT_SECRET to enable real payouts.`,
      demoMode: true,
    };
  }

  try {
    if (!affiliate.stripeConnectAccountId) {
      return { success: false, message: "No Stripe Connect account linked. Affiliate must onboard first.", demoMode: false };
    }

    // @ts-ignore - stripe is optionally available at runtime when STRIPE_CONNECT_SECRET is set
    const stripeModule = await import("stripe") as any;
    const stripe = stripeModule.default || stripeModule;
    const stripeClient = new stripe(STRIPE_CONNECT_SECRET!);

    const transfer = await stripeClient.transfers.create({
      amount: amountCents,
      currency: "usd",
      destination: affiliate.stripeConnectAccountId,
      description: `LYS Affiliate payout for ${affiliate.referralCode}`,
    });

    return { success: true, transactionId: transfer.id, message: "Payout initiated via Stripe Connect", demoMode: false };
  } catch (error) {
    return { success: false, message: `Stripe Connect error: ${error}`, demoMode: false };
  }
}

export function getIntegrationStatus() {
  return {
    rewardful: {
      configured: isRewardfulConfigured(),
      status: isRewardfulConfigured() ? "connected" : "demo",
    },
    partnerstack: {
      configured: isPartnerstackConfigured(),
      status: isPartnerstackConfigured() ? "connected" : "demo",
    },
    stripeConnect: {
      configured: isStripeConnectConfigured(),
      status: isStripeConnectConfigured() ? "connected" : "demo",
    },
  };
}

export async function syncExternalCommissions(affiliate: EducatorAffiliate): Promise<{
  commissions: Array<{ amount: number; source: string; date: string }>;
  demoMode: boolean;
}> {
  if (!isRewardfulConfigured() && !isPartnerstackConfigured()) {
    return {
      commissions: [
        { amount: 2500, source: "Rewardful (Demo)", date: new Date().toISOString() },
        { amount: 1500, source: "PartnerStack (Demo)", date: new Date(Date.now() - 86400000).toISOString() },
      ],
      demoMode: true,
    };
  }

  const commissions: Array<{ amount: number; source: string; date: string }> = [];

  if (isRewardfulConfigured() && affiliate.externalRewardfulId) {
    try {
      const response = await fetch(
        `https://api.getrewardful.com/v1/affiliates/${affiliate.externalRewardfulId}/commissions`,
        { headers: { "Authorization": `Bearer ${REWARDFUL_API_KEY}` } }
      );
      if (response.ok) {
        const data = await response.json() as Array<{ amount: number; created_at: string }>;
        for (const c of data) {
          commissions.push({ amount: c.amount, source: "Rewardful", date: c.created_at });
        }
      }
    } catch (e) {
      console.error("Rewardful commission sync error:", e);
    }
  }

  return { commissions, demoMode: false };
}
