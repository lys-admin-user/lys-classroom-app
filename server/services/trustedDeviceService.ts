// "Remember this device for 30 days" — a server-side trusted-device record.
//
// The plaintext token lives only in a signed, httpOnly cookie on the browser;
// the server persists a SHA-256 hash, so a DB leak cannot mint valid device
// cookies. A valid trusted device satisfies the LOGIN-time second factor only —
// it never satisfies the fresh step-up required for sensitive actions.
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import type { Request, Response } from "express";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db } from "../db";
import { trustedDevices } from "@shared/schema";
import { logAuditEvent, getClientIP } from "./auditLog";
import { isProductionDeployment } from "../lib/hosting";

export const TRUSTED_DEVICE_COOKIE = "lys_td";
export const TRUSTED_DEVICE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Secure cookies in any production deployment. Hosting-agnostic so it holds on
// Render (NODE_ENV=production) as well as the legacy Replit deployment flag.
function useSecureCookie(): boolean {
  return isProductionDeployment();
}

// --- Pure helpers (unit-tested; no DB) -------------------------------------

export function generateDeviceToken(): string {
  return randomBytes(32).toString("hex"); // 256-bit
}

export function hashDeviceToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function deviceExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + TRUSTED_DEVICE_TTL_MS);
}

// Coarse, non-identifying label from the user-agent for the "your devices" list.
export function deviceLabelFromUserAgent(ua: string | undefined | null): string {
  const s = String(ua || "");
  const browser =
    /Edg\//.test(s) ? "Edge" :
    /OPR\/|Opera/.test(s) ? "Opera" :
    /Chrome\//.test(s) ? "Chrome" :
    /Firefox\//.test(s) ? "Firefox" :
    /Safari\//.test(s) ? "Safari" :
    "Browser";
  const os =
    /Windows/.test(s) ? "Windows" :
    /Mac OS X|Macintosh/.test(s) ? "macOS" :
    /Android/.test(s) ? "Android" :
    /iPhone|iPad|iOS/.test(s) ? "iOS" :
    /Linux/.test(s) ? "Linux" :
    "device";
  return `${browser} on ${os}`;
}

function safeHexEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

function readCookieToken(req: Request): string | null {
  const raw = (req as any).signedCookies?.[TRUSTED_DEVICE_COOKIE];
  // cookie-parser returns `false` for a tampered signed cookie.
  if (!raw || typeof raw !== "string") return null;
  return raw;
}

// --- DB-backed operations --------------------------------------------------

// Mint a trusted device for the user and set the signed cookie on the response.
export async function issueTrustedDevice(userId: string, req: Request, res: Response): Promise<void> {
  const token = generateDeviceToken();
  const label = deviceLabelFromUserAgent(req.get("user-agent"));
  await db.insert(trustedDevices).values({
    userId,
    tokenHash: hashDeviceToken(token),
    label,
    ipAddress:
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      null,
    expiresAt: deviceExpiry(),
  });
  res.cookie(TRUSTED_DEVICE_COOKIE, token, {
    httpOnly: true,
    signed: true,
    sameSite: "lax",
    secure: useSecureCookie(),
    maxAge: TRUSTED_DEVICE_TTL_MS,
    path: "/",
  });
  await logAuditEvent({
    userId,
    action: "mfa.trusted_device_created",
    category: "security",
    severity: "info",
    resourceType: "user",
    resourceId: userId,
    ipAddress: getClientIP(req),
    userAgent: req.get("user-agent"),
    details: { label },
  });
}

// Whether the request carries a valid (non-revoked, unexpired) trusted device
// for this user. Refreshes lastUsedAt on a hit.
export async function hasValidTrustedDevice(userId: string, req: Request): Promise<boolean> {
  const token = readCookieToken(req);
  if (!token) return false;
  const [row] = await db
    .select()
    .from(trustedDevices)
    .where(
      and(
        eq(trustedDevices.userId, userId),
        eq(trustedDevices.tokenHash, hashDeviceToken(token)),
        isNull(trustedDevices.revokedAt),
        gt(trustedDevices.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!row) return false;
  db.update(trustedDevices)
    .set({ lastUsedAt: new Date() })
    .where(eq(trustedDevices.id, row.id))
    .catch(() => {});
  return true;
}

export async function listTrustedDevices(userId: string) {
  const rows = await db
    .select()
    .from(trustedDevices)
    .where(and(eq(trustedDevices.userId, userId), isNull(trustedDevices.revokedAt)))
    .orderBy(desc(trustedDevices.lastUsedAt));
  const now = Date.now();
  return rows
    .filter((r) => new Date(r.expiresAt).getTime() > now)
    .map((r) => ({
      id: r.id,
      label: r.label,
      ipAddress: r.ipAddress,
      lastUsedAt: r.lastUsedAt,
      createdAt: r.createdAt,
      expiresAt: r.expiresAt,
      current: false,
    }));
}

// Revoke a single device (only if it belongs to the user). Returns true if a row
// was affected.
export async function revokeTrustedDevice(userId: string, id: string): Promise<boolean> {
  const rows = await db
    .update(trustedDevices)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(trustedDevices.id, id),
        eq(trustedDevices.userId, userId),
        isNull(trustedDevices.revokedAt),
      ),
    )
    .returning({ id: trustedDevices.id });
  return rows.length > 0;
}

export async function revokeAllTrustedDevices(userId: string): Promise<number> {
  const rows = await db
    .update(trustedDevices)
    .set({ revokedAt: new Date() })
    .where(and(eq(trustedDevices.userId, userId), isNull(trustedDevices.revokedAt)))
    .returning({ id: trustedDevices.id });
  return rows.length;
}

export function clearTrustedDeviceCookie(res: Response): void {
  res.clearCookie(TRUSTED_DEVICE_COOKIE, { path: "/" });
}

// Revoke the specific device tied to the current request's cookie (used when a
// user disables MFA entirely).
export async function revokeCurrentTrustedDevice(userId: string, req: Request): Promise<void> {
  const token = readCookieToken(req);
  if (!token) return;
  await db
    .update(trustedDevices)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(trustedDevices.userId, userId),
        eq(trustedDevices.tokenHash, hashDeviceToken(token)),
        isNull(trustedDevices.revokedAt),
      ),
    );
}
