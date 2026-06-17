import crypto from "crypto";

// App-layer field encryption using AES-256-GCM.
//
// Keyed from the APP_ENCRYPTION_KEY secret (base64-encoded 32 bytes). The same
// key is reused for both the admin MFA secret (P1) and sensitive student PII at
// rest (P2). Ciphertext format is a single string:
//
//   enc:v1:<base64(iv[12] || authTag[16] || ciphertext)>
//
// We deliberately fail loudly when the key is missing rather than silently
// storing plaintext — callers that need encryption must surface a clear error.

const PREFIX = "enc:v1:";
const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

let cachedKey: Buffer | null = null;

function loadKey(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = process.env.APP_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "APP_ENCRYPTION_KEY is not set. App-layer encryption (MFA secrets / sensitive PII) is unavailable."
    );
  }
  let key: Buffer;
  try {
    key = Buffer.from(raw, "base64");
  } catch {
    throw new Error("APP_ENCRYPTION_KEY is not valid base64.");
  }
  if (key.length !== 32) {
    throw new Error(
      `APP_ENCRYPTION_KEY must decode to 32 bytes (got ${key.length}). Generate with: openssl rand -base64 32`
    );
  }
  cachedKey = key;
  return key;
}

export function isEncryptionConfigured(): boolean {
  try {
    loadKey();
    return true;
  } catch {
    return false;
  }
}

export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

export function encrypt(plaintext: string): string {
  const key = loadKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: TAG_LEN });
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, ct]).toString("base64");
}

export function decrypt(payload: string): string {
  if (!isEncrypted(payload)) {
    // Tolerate legacy plaintext values that predate encryption.
    return payload;
  }
  const key = loadKey();
  const buf = Buffer.from(payload.slice(PREFIX.length), "base64");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ct = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, key, iv, { authTagLength: TAG_LEN });
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

// Encrypt only if a key is configured and the value isn't already encrypted.
// Returns the original value untouched when encryption is unavailable.
export function encryptIfPossible(value: string | null | undefined): string | null {
  if (value == null || value === "") return value ?? null;
  if (isEncrypted(value)) return value;
  if (!isEncryptionConfigured()) return value;
  return encrypt(value);
}

// Safe decrypt: returns plaintext for legacy values, decrypts encrypted ones,
// and returns the raw value if decryption fails (avoids hard crashes on read).
export function decryptIfPossible(value: string | null | undefined): string | null {
  if (value == null) return null;
  if (!isEncrypted(value)) return value;
  try {
    return decrypt(value);
  } catch {
    return value;
  }
}
