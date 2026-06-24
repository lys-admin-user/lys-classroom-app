// Email-delivered one-time codes used as a second factor — both for login-time
// 2FA (educators-and-up) and as an alternative to authenticator-app step-up.
//
// Security properties:
//   - The plaintext 6-digit code is never stored; only a SHA-256 hash.
//   - Codes are single-use (consumedAt), short-lived (10 min), and attempt-capped.
//   - Verification is constant-time on the hash to avoid timing leaks.
//   - Re-sends are throttled with a short cooldown to limit email/abuse.
import { createHash, randomInt, timingSafeEqual } from "crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import { emailOtpCodes } from "@shared/schema";
import { sendEmail, type EmailSendStatus } from "./emailTransport";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 30 * 1000;

export type OtpPurpose = "mfa" | "login";

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function safeHexEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export type OtpSendResult = {
  ok: boolean;
  transport: EmailSendStatus | "no_email" | "cooldown";
};

export async function sendEmailOtp(
  userId: string,
  email: string | null | undefined,
  purpose: OtpPurpose = "mfa",
): Promise<OtpSendResult> {
  if (!email) return { ok: false, transport: "no_email" };

  // Throttle rapid re-sends: if an unconsumed code was issued very recently,
  // do not mint a new one (avoids email floods / enumeration timing).
  const [recent] = await db
    .select()
    .from(emailOtpCodes)
    .where(
      and(
        eq(emailOtpCodes.userId, userId),
        eq(emailOtpCodes.purpose, purpose),
        isNull(emailOtpCodes.consumedAt),
      ),
    )
    .orderBy(desc(emailOtpCodes.createdAt))
    .limit(1);
  if (
    recent?.createdAt &&
    Date.now() - new Date(recent.createdAt).getTime() < RESEND_COOLDOWN_MS
  ) {
    return { ok: true, transport: "cooldown" };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.insert(emailOtpCodes).values({
    userId,
    codeHash: hashCode(code),
    purpose,
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
    attempts: 0,
  });

  const { status } = await sendEmail(
    { email },
    "Your LYS verification code",
    `Your LYS verification code is ${code}\n\n` +
      `This code expires in 10 minutes and can be used once. ` +
      `If you did not request it, you can safely ignore this email — your account remains secure.`,
    { logPrefix: "mfa-otp" },
  );
  return { ok: status !== "failed", transport: status };
}

export async function verifyEmailOtp(
  userId: string,
  code: string,
  purpose: OtpPurpose = "mfa",
): Promise<boolean> {
  const cleaned = String(code || "").replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;

  const [row] = await db
    .select()
    .from(emailOtpCodes)
    .where(
      and(
        eq(emailOtpCodes.userId, userId),
        eq(emailOtpCodes.purpose, purpose),
        isNull(emailOtpCodes.consumedAt),
      ),
    )
    .orderBy(desc(emailOtpCodes.createdAt))
    .limit(1);

  if (!row) return false;
  if (new Date(row.expiresAt).getTime() < Date.now()) return false;
  if ((row.attempts ?? 0) >= MAX_ATTEMPTS) return false;

  if (!safeHexEqual(hashCode(cleaned), row.codeHash)) {
    await db
      .update(emailOtpCodes)
      .set({ attempts: (row.attempts ?? 0) + 1 })
      .where(eq(emailOtpCodes.id, row.id));
    return false;
  }

  await db
    .update(emailOtpCodes)
    .set({ consumedAt: new Date() })
    .where(eq(emailOtpCodes.id, row.id));
  return true;
}
