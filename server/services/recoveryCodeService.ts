// One-time recovery codes: a fallback second factor accepted anywhere a TOTP or
// email code is. Codes are high-entropy, generated in a batch, shown to the user
// exactly once, and stored ONLY as a SHA-256 hash. Each code is single-use; the
// whole set can be regenerated (which invalidates any remaining old codes).
import { createHash, randomInt } from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import { mfaRecoveryCodes } from "@shared/schema";

// How many codes to mint per batch.
export const RECOVERY_CODE_COUNT = 10;
// Character set excludes ambiguous glyphs (0/O, 1/I/L) for easy transcription.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
// Length of each half of the "XXXXX-XXXXX" code (10 chars total = ~50 bits).
const HALF_LEN = 5;

// --- Pure helpers (unit-tested; no DB) -------------------------------------

// Generate a single formatted recovery code, e.g. "ABCDE-FGHJK".
export function generateRecoveryCodeString(): string {
  const pick = () => ALPHABET[randomInt(0, ALPHABET.length)];
  const group = () => Array.from({ length: HALF_LEN }, pick).join("");
  return `${group()}-${group()}`;
}

// Generate a batch of unique codes.
export function generateRecoveryCodeStrings(n: number = RECOVERY_CODE_COUNT): string[] {
  const set = new Set<string>();
  while (set.size < n) set.add(generateRecoveryCodeString());
  return Array.from(set);
}

// Normalize user input so formatting/casing differences don't matter: strip all
// non-alphanumerics and uppercase.
export function normalizeRecoveryCode(code: string): string {
  return String(code || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function hashRecoveryCode(code: string): string {
  return createHash("sha256").update(normalizeRecoveryCode(code)).digest("hex");
}

// --- DB-backed operations --------------------------------------------------

// Replace the user's recovery-code set with a fresh batch. Returns the plaintext
// codes ONCE for display; only hashes are persisted.
export async function regenerateRecoveryCodes(userId: string): Promise<string[]> {
  const codes = generateRecoveryCodeStrings();
  await db.delete(mfaRecoveryCodes).where(eq(mfaRecoveryCodes.userId, userId));
  await db.insert(mfaRecoveryCodes).values(
    codes.map((code) => ({ userId, codeHash: hashRecoveryCode(code) })),
  );
  return codes;
}

// Delete all of a user's recovery codes (e.g. when MFA is disabled). Returns the
// number removed so callers can decide whether to audit.
export async function invalidateRecoveryCodes(userId: string): Promise<number> {
  const removed = await db
    .delete(mfaRecoveryCodes)
    .where(eq(mfaRecoveryCodes.userId, userId))
    .returning({ id: mfaRecoveryCodes.id });
  return removed.length;
}

export async function countRemainingRecoveryCodes(userId: string): Promise<number> {
  const rows = await db
    .select({ id: mfaRecoveryCodes.id })
    .from(mfaRecoveryCodes)
    .where(and(eq(mfaRecoveryCodes.userId, userId), isNull(mfaRecoveryCodes.consumedAt)));
  return rows.length;
}

// Consume a recovery code if it matches an unused one for this user. The consume
// is a single conditional UPDATE (…WHERE code_hash = ? AND consumed_at IS NULL)
// so it is atomic: two concurrent requests with the same code can't both win —
// exactly one UPDATE affects a row. This enforces true single-use semantics.
export async function verifyRecoveryCode(userId: string, code: string): Promise<boolean> {
  const normalized = normalizeRecoveryCode(code);
  if (normalized.length < 6) return false;
  const target = hashRecoveryCode(normalized);

  const updated = await db
    .update(mfaRecoveryCodes)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(mfaRecoveryCodes.userId, userId),
        eq(mfaRecoveryCodes.codeHash, target),
        isNull(mfaRecoveryCodes.consumedAt),
      ),
    )
    .returning({ id: mfaRecoveryCodes.id });

  return updated.length === 1;
}
