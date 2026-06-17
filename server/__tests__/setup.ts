import crypto from "node:crypto";

// Provide a deterministic encryption key for crypto tests when one is not
// already present (e.g. in CI). Must be set before any module reads it.
if (!process.env.APP_ENCRYPTION_KEY) {
  process.env.APP_ENCRYPTION_KEY = crypto.randomBytes(32).toString("base64");
}
