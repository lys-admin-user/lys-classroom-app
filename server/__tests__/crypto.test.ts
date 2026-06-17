import { describe, it, expect } from "vitest";
import {
  encrypt,
  decrypt,
  isEncrypted,
  encryptIfPossible,
  decryptIfPossible,
} from "../services/crypto";

describe("crypto (AES-256-GCM field encryption)", () => {
  it("round-trips plaintext through encrypt/decrypt", () => {
    const plain = "Sensitive student note: needs reading support.";
    const ct = encrypt(plain);
    expect(ct).not.toEqual(plain);
    expect(isEncrypted(ct)).toBe(true);
    expect(decrypt(ct)).toEqual(plain);
  });

  it("produces a different ciphertext each call (random IV)", () => {
    const a = encrypt("same");
    const b = encrypt("same");
    expect(a).not.toEqual(b);
    expect(decrypt(a)).toEqual("same");
    expect(decrypt(b)).toEqual("same");
  });

  it("decrypt tolerates legacy plaintext", () => {
    expect(decrypt("legacy-plain")).toEqual("legacy-plain");
    expect(isEncrypted("legacy-plain")).toBe(false);
  });

  it("encryptIfPossible is idempotent and decryptIfPossible reverses it", () => {
    const once = encryptIfPossible("hello");
    expect(once).not.toBeNull();
    const twice = encryptIfPossible(once);
    expect(twice).toEqual(once); // already encrypted, untouched
    expect(decryptIfPossible(once!)).toEqual("hello");
  });

  it("tampering with ciphertext is rejected by the auth tag", () => {
    const ct = encrypt("integrity");
    // Flip a character in the base64 body.
    const body = ct.slice("enc:v1:".length);
    const flipped =
      "enc:v1:" + (body[0] === "A" ? "B" : "A") + body.slice(1);
    expect(() => decrypt(flipped)).toThrow();
    // decryptIfPossible swallows the error and returns the raw value.
    expect(decryptIfPossible(flipped)).toEqual(flipped);
  });
});
