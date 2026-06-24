// Cloudflare Turnstile verification.
//
// A privacy-respecting captcha (no cross-site tracking — appropriate for the
// COPPA-sensitive student/parent signup flows) used to slow automated/bot
// account creation and guest-generation abuse.
//
// Graceful degradation: when TURNSTILE_SECRET_KEY is not configured the verify
// helper and middleware become a no-op so the app keeps working without keys.
// Once the key is added, enforcement turns on automatically.
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isCaptchaConfigured(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY;
}

export type CaptchaResult = { ok: boolean; reason?: string };

export async function verifyCaptcha(
  token: string | undefined | null,
  ip?: string,
): Promise<CaptchaResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, reason: "not_configured" }; // graceful no-op
  if (!token) return { ok: false, reason: "missing_token" };

  try {
    const form = new URLSearchParams();
    form.append("secret", secret);
    form.append("response", token);
    if (ip) form.append("remoteip", ip);

    const resp = await fetch(VERIFY_URL, { method: "POST", body: form });
    const data: any = await resp.json().catch(() => ({}));
    if (data?.success) return { ok: true };
    const codes = Array.isArray(data?.["error-codes"]) ? data["error-codes"].join(",") : "verify_failed";
    return { ok: false, reason: codes };
  } catch (err: any) {
    // If Cloudflare is unreachable, fail OPEN (don't block legitimate signups)
    // but log so the outage is visible.
    console.error("[captcha] Turnstile verify error:", err?.message || err);
    return { ok: true, reason: "verifier_error" };
  }
}

function clientIp(req: any): string {
  const fwd = req.headers?.["x-forwarded-for"];
  const first = typeof fwd === "string" ? fwd.split(",")[0] : Array.isArray(fwd) ? fwd[0] : "";
  return (first || req.ip || "").trim();
}

// Express middleware. Enforces captcha only when configured; otherwise no-op.
// Reads the token from a fixed body field or the standard Turnstile header.
export function requireCaptcha(opts: { tokenField?: string } = {}) {
  const field = opts.tokenField || "captchaToken";
  return async (req: any, res: any, next: any) => {
    if (!isCaptchaConfigured()) return next();
    const token = req.body?.[field] ?? req.headers?.["cf-turnstile-response"];
    const result = await verifyCaptcha(token, clientIp(req));
    if (!result.ok) {
      return res
        .status(400)
        .json({ error: "Captcha verification failed. Please try again.", captchaFailed: true });
    }
    next();
  };
}
