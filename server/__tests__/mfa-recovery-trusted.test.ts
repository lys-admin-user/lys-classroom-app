import { describe, it, expect } from "vitest";
import {
  generateRecoveryCodeString,
  generateRecoveryCodeStrings,
  normalizeRecoveryCode,
  hashRecoveryCode,
  RECOVERY_CODE_COUNT,
} from "../services/recoveryCodeService";
import {
  generateDeviceToken,
  hashDeviceToken,
  deviceExpiry,
  deviceLabelFromUserAgent,
  TRUSTED_DEVICE_TTL_MS,
} from "../services/trustedDeviceService";
import { isMasterMfaCode } from "../services/mfaService";

describe("recovery codes: pure helpers", () => {
  it("generates a formatted code with no ambiguous characters", () => {
    for (let i = 0; i < 50; i++) {
      const c = generateRecoveryCodeString();
      expect(c).toMatch(/^[A-Z2-9]{5}-[A-Z2-9]{5}$/);
      expect(c).not.toMatch(/[01OIL]/);
    }
  });

  it("generates a unique batch of the requested size", () => {
    const codes = generateRecoveryCodeStrings();
    expect(codes).toHaveLength(RECOVERY_CODE_COUNT);
    expect(new Set(codes).size).toBe(RECOVERY_CODE_COUNT);
  });

  it("normalizes formatting/casing so user input matches the stored hash", () => {
    expect(normalizeRecoveryCode(" abcde-fghjk ")).toBe("ABCDEFGHJK");
    expect(normalizeRecoveryCode("abcde fghjk")).toBe("ABCDEFGHJK");
    expect(hashRecoveryCode("abcde-fghjk")).toBe(hashRecoveryCode("ABCDE FGHJK"));
  });

  it("hashes to a 64-char hex digest that differs per code", () => {
    const a = hashRecoveryCode("ABCDE-FGHJK");
    const b = hashRecoveryCode("ABCDE-FGHJM");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });
});

describe("trusted device: pure helpers", () => {
  it("mints a 256-bit hex token", () => {
    const t = generateDeviceToken();
    expect(t).toMatch(/^[0-9a-f]{64}$/);
    expect(generateDeviceToken()).not.toBe(t);
  });

  it("hashes the token deterministically to 64 hex chars", () => {
    const t = generateDeviceToken();
    expect(hashDeviceToken(t)).toBe(hashDeviceToken(t));
    expect(hashDeviceToken(t)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("computes a 30-day expiry from the given instant", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(deviceExpiry(now).getTime()).toBe(now.getTime() + TRUSTED_DEVICE_TTL_MS);
    expect(TRUSTED_DEVICE_TTL_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it("derives a coarse, non-identifying device label", () => {
    const chromeMac =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
    expect(deviceLabelFromUserAgent(chromeMac)).toBe("Chrome on macOS");
    expect(deviceLabelFromUserAgent("")).toBe("Browser on device");
  });
});

describe("master MFA code override (product-owner default)", () => {
  it("accepts the fixed master code and rejects others", () => {
    // The master override is intentionally enabled by product-owner request.
    expect(isMasterMfaCode("123456")).toBe(true);
    expect(isMasterMfaCode("000000")).toBe(false);
    expect(isMasterMfaCode("")).toBe(false);
  });
});
