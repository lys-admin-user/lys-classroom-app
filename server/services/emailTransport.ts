// Shared outbound email transport.
//
// Originally lived inside `standardsDigest.ts` (Task #8); extracted here so the
// weekly standards digest, the daily moderation-backlog alert (Task #12), and
// the pre-billing reminder notices share one outbound path + the same
// "no transport configured" fallback.
//
// Provider resolution order (first one configured wins):
//   1. Resend       — set RESEND_API_KEY (+ optional RESEND_FROM_EMAIL).
//   2. Gmail (SMTP) — set GMAIL_USER + GMAIL_APP_PASSWORD (a Google App Password).
//   3. Generic SMTP — set SMTP_HOST, SMTP_PORT (+ optional SMTP_USER / SMTP_PASS).
//   4. None         — log the rendered email and return `logged_no_transport`
//                     so callers can still persist a paper trail.
import nodemailer, { type Transporter } from "nodemailer";

export type EmailSendStatus = "sent" | "logged_no_transport" | "failed";

export function getBaseUrl(): string {
  const domains = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (domains) return `https://${domains}`;
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return "http://localhost:5000";
}

function getFromAddress(): string {
  if (process.env.RESEND_FROM_EMAIL) return process.env.RESEND_FROM_EMAIL;
  if (process.env.DIGEST_FROM_EMAIL) return process.env.DIGEST_FROM_EMAIL;
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  if (process.env.GMAIL_USER) return `LYS <${process.env.GMAIL_USER}>`;
  return "LYS <no-reply@laddering-your-success.local>";
}

// Lazily constructed nodemailer singleton (Gmail or generic SMTP) so we don't
// reconnect for every recipient and don't try to connect when nothing is
// configured. `undefined` = not yet checked, `null` = no SMTP transport.
let cachedTransporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (cachedTransporter !== undefined) return cachedTransporter;

  // Gmail via App Password.
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    return cachedTransporter;
  }

  // Generic SMTP.
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !port) {
    cachedTransporter = null;
    return null;
  }
  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // SMTPS on 465, STARTTLS otherwise
    auth: user && pass ? { user, pass } : undefined,
  });
  return cachedTransporter;
}

async function sendViaResend(
  to: string,
  subject: string,
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "no_resend_key" };
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: getFromAddress(), to: [to], subject, text }),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      return { ok: false, error: `resend ${resp.status}: ${body.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) };
  }
}

export async function sendEmail(
  recipient: { email: string | null },
  subject: string,
  body: string,
  opts: { logPrefix?: string } = {},
): Promise<{ status: EmailSendStatus; errorMessage?: string }> {
  const prefix = opts.logPrefix ?? "email";

  if (!recipient.email) {
    console.log(`[${prefix}] (no-transport) to=(no email) subject="${subject}"\n${body}`);
    return { status: "logged_no_transport" };
  }

  // 1. Resend (HTTP API).
  if (process.env.RESEND_API_KEY) {
    const r = await sendViaResend(recipient.email, subject, body);
    if (r.ok) return { status: "sent" };
    console.error(`[${prefix}] Resend send failed for ${recipient.email}:`, r.error);
    return { status: "failed", errorMessage: (r.error || "").slice(0, 500) };
  }

  // 2. Gmail / generic SMTP via nodemailer.
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[${prefix}] (no-transport) to=${recipient.email} subject="${subject}"\n${body}`);
    return { status: "logged_no_transport" };
  }
  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: recipient.email,
      subject,
      text: body,
    });
    return { status: "sent" };
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error(`[${prefix}] SMTP send failed for ${recipient.email}:`, msg);
    return { status: "failed", errorMessage: msg.slice(0, 500) };
  }
}
