import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import { encrypt, decrypt } from "./crypto";
import { isProductionDeployment } from "../lib/hosting";

// TOTP step-up MFA for sensitive admin actions.
//
// Secrets are generated server-side, returned ONCE during enrollment (as an
// otpauth URI + QR data URL), and persisted encrypted at rest. Verification
// allows a small window for clock drift via epochTolerance.

const ISSUER = "LYS Educational Platform";
// Tolerate +/- one 30s step for device clock drift.
const EPOCH_TOLERANCE_SECONDS = 30;

// DEV-ONLY MFA bypass: until transactional email is wired up, accept a fixed
// code so the team can work through MFA-gated admin flows. This is hard-gated
// to NON-production: it is disabled in any production deployment
// (isProductionDeployment(): NODE_ENV=production or the legacy REPLIT_DEPLOYMENT=1
// flag), so it can never weaken the live site's step-up control.
export const DEV_BYPASS_MFA_CODE = "123456";
export function isDevBypassEnabled(): boolean {
  return !isProductionDeployment();
}

// Master MFA code: a single fixed code accepted for EVERY user in EVERY
// environment. DISABLED 2026-07-23 by product-owner request ("implement best
// practices") — real per-user TOTP/email/recovery-code verification is now
// required. Locked-out users are handled by the admin MFA-reset action
// (POST /api/admin/users/:id/reset-mfa). Re-enable only on explicit request.
export const MASTER_MFA_CODE = "123456";
export const MASTER_MFA_CODE_ENABLED = false;
export function isMasterMfaCode(code: string): boolean {
  return MASTER_MFA_CODE_ENABLED && code.replace(/\s+/g, "") === MASTER_MFA_CODE;
}

export function generateMfaSecret(): string {
  return generateSecret();
}

export function buildOtpAuthUri(accountLabel: string, secret: string): string {
  return generateURI({ issuer: ISSUER, label: accountLabel, secret });
}

export async function buildQrDataUrl(otpauthUri: string): Promise<string> {
  return QRCode.toDataURL(otpauthUri);
}

export function verifyToken(token: string, secret: string): boolean {
  const normalized = token.replace(/\s+/g, "");
  // Master MFA code: accepted for every user in every environment until
  // disabled (MASTER_MFA_CODE_ENABLED). Product-owner override.
  if (isMasterMfaCode(normalized)) {
    return true;
  }
  try {
    const result = verifySync({
      secret,
      token: normalized,
      epochTolerance: EPOCH_TOLERANCE_SECONDS,
    });
    return !!result.valid;
  } catch {
    return false;
  }
}

// Convenience: verify a token against an encrypted secret from the DB.
export function verifyTokenAgainstEncrypted(token: string, encryptedSecret: string): boolean {
  let secret: string;
  try {
    secret = decrypt(encryptedSecret);
  } catch {
    return false;
  }
  return verifyToken(token, secret);
}

export function encryptSecret(secret: string): string {
  return encrypt(secret);
}
