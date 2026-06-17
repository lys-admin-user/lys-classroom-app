import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import { encrypt, decrypt } from "./crypto";

// TOTP step-up MFA for sensitive admin actions.
//
// Secrets are generated server-side, returned ONCE during enrollment (as an
// otpauth URI + QR data URL), and persisted encrypted at rest. Verification
// allows a small window for clock drift via epochTolerance.

const ISSUER = "LYS Educational Platform";
// Tolerate +/- one 30s step for device clock drift.
const EPOCH_TOLERANCE_SECONDS = 30;

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
  try {
    const result = verifySync({
      secret,
      token: token.replace(/\s+/g, ""),
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
