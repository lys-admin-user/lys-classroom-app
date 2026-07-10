import crypto from "node:crypto";

// Provide a deterministic encryption key for crypto tests when one is not
// already present (e.g. in CI). Must be set before any module reads it.
if (!process.env.APP_ENCRYPTION_KEY) {
  process.env.APP_ENCRYPTION_KEY = crypto.randomBytes(32).toString("base64");
}

// Provide a placeholder DATABASE_URL when one is not present (e.g. in CI).
// server/db.ts throws at import time if this is unset. The unit tests are
// self-contained and never open a real connection, so a dummy value is enough
// to let the modules load. Must be set before any module reads it.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/test";
}
