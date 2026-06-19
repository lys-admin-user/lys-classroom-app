import type { Express } from "express";
import { isAuthenticated, authStorage } from "../replit_integrations/auth";
import { recordBundleAcceptance, consentRequestMeta } from "../services/consentService";
import { CURRENT_POLICY_BUNDLE_VERSION, POLICY_LIST } from "@shared/legal";

export function registerConsentRoutes(app: Express): void {
  // Public: current policy metadata + bundle version (drives client display and
  // the re-acceptance check).
  app.get("/api/legal/policies", (_req, res) => {
    res.json({ bundleVersion: CURRENT_POLICY_BUNDLE_VERSION, policies: POLICY_LIST });
  });

  // Record affirmative acceptance of the policy bundle. Used by the
  // re-acceptance intercept modal (context "reaccept") and any explicit
  // in-app acceptance (context "onboarding").
  app.post("/api/legal/accept", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      const { ipAddress, userAgent } = consentRequestMeta(req);
      const context = req.body?.context === "onboarding" ? "onboarding" : "reaccept";
      await recordBundleAcceptance({
        userId,
        email: user?.email ?? null,
        context,
        ipAddress,
        userAgent,
      });
      res.json({ success: true, acceptedPolicyVersion: CURRENT_POLICY_BUNDLE_VERSION });
    } catch (error) {
      console.error("Consent accept error:", error);
      res.status(500).json({ error: "Failed to record acceptance" });
    }
  });
}
