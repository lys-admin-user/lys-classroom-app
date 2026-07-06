// Shared outbound email transport.
//
// Originally lived inside `standardsDigest.ts` (Task #8); extracted here so the
// weekly standards digest, the daily moderation-backlog alert (Task #12), the
// pre-billing reminder notices, and any other outbound mail share one path +
// the same "no transport configured" fallback.
//
// Provider resolution order (first one configured wins):
//   1. Resend       — set RESEND_API_KEY (+ optional RESEND_FROM_EMAIL).
//   2. SendGrid     — set SENDGRID_API_KEY (HTTPS API, no SMTP needed).
//   3. Gmail (SMTP) — set GMAIL_USER + GMAIL_APP_PASSWORD (a Google App Password).
//   4. Generic SMTP — set SMTP_HOST, SMTP_PORT (+ optional SMTP_USER / SMTP_PASS).
//   5. None         — log the rendered email and return `logged_no_transport`
//                     so callers can still persist a paper trail.
//
// The "from" address comes from RESEND_FROM_EMAIL / DIGEST_FROM_EMAIL / SMTP_FROM
// (a plain "you@example.com" or an "LYS <you@example.com>" form both work). Note
// that Resend/SendGrid require the sending domain/address to be verified in their
// dashboards before real delivery succeeds.
import nodemailer, { type Transporter } from "nodemailer";

export type EmailSendStatus = "sent" | "logged_no_transport" | "failed";

// True when at least one real outbound email provider is configured. Used by the
// 2FA layer to decide whether email-code delivery can actually reach a user
// (so we never lock an educator out of login by requiring a code we can't send).
export function isEmailConfigured(): boolean {
  return !!(
    process.env.RESEND_API_KEY ||
    process.env.SENDGRID_API_KEY ||
    (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) ||
    (process.env.SMTP_HOST && process.env.SMTP_PORT)
  );
}

export function getBaseUrl(): string {
  const domains = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (domains) return `https://${domains}`;
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return "http://localhost:5000";
}

type ProviderKind = "resend" | "sendgrid" | "smtp" | "none";

// Resolve the active provider from the environment. Resend and SendGrid only
// need a single API key, so they take precedence over SMTP. The "smtp" kind
// covers both Gmail (App Password) and a generic SMTP host — getSmtpTransporter
// picks the right one.
function getActiveProvider(): ProviderKind {
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.SENDGRID_API_KEY) return "sendgrid";
  if (
    (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) ||
    (process.env.SMTP_HOST && process.env.SMTP_PORT)
  ) {
    return "smtp";
  }
  return "none";
}

const DEFAULT_FROM = "LYS <no-reply@laddering-your-success.local>";

function getFromAddress(): string {
  if (process.env.RESEND_FROM_EMAIL) return process.env.RESEND_FROM_EMAIL;
  if (process.env.DIGEST_FROM_EMAIL) return process.env.DIGEST_FROM_EMAIL;
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  if (process.env.GMAIL_USER) return `LYS <${process.env.GMAIL_USER}>`;
  return DEFAULT_FROM;
}

// Split "Name <email@host>" into its parts; a bare "email@host" yields no name.
function parseFromAddress(raw: string): { email: string; name?: string } {
  const match = raw.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
  if (match) {
    const name = match[1].trim();
    return { email: match[2].trim(), name: name || undefined };
  }
  return { email: raw.trim() };
}

// Lazily constructed nodemailer singleton (Gmail or generic SMTP) so we don't
// reconnect for every recipient and don't try to connect when nothing is
// configured. `undefined` = not yet checked, `null` = no SMTP transport.
let cachedTransporter: Transporter | null | undefined;

function getSmtpTransporter(): Transporter | null {
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

async function sendViaResend(to: string, subject: string, body: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: [to],
      subject,
      text: body,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${detail.slice(0, 300)}`);
  }
}

async function sendViaSendgrid(to: string, subject: string, body: string): Promise<void> {
  const from = parseFromAddress(getFromAddress());
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: from.name ? { email: from.email, name: from.name } : { email: from.email },
      subject,
      content: [{ type: "text/plain", value: body }],
    }),
  });
  // SendGrid returns 202 Accepted on success.
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`SendGrid ${res.status}: ${detail.slice(0, 300)}`);
  }
}

async function sendViaSmtp(to: string, subject: string, body: string): Promise<void> {
  const transporter = getSmtpTransporter();
  if (!transporter) throw new Error("SMTP transporter unavailable");
  await transporter.sendMail({ from: getFromAddress(), to, subject, text: body });
}

export async function sendEmail(
  recipient: { email: string | null },
  subject: string,
  body: string,
  opts: { logPrefix?: string } = {},
): Promise<{ status: EmailSendStatus; errorMessage?: string }> {
  const prefix = opts.logPrefix ?? "email";
  const provider = getActiveProvider();

  if (provider === "none" || !recipient.email) {
    console.log(
      `[${prefix}] (no-transport) to=${recipient.email ?? "(no email)"} subject="${subject}"\n${body}`,
    );
    return { status: "logged_no_transport" };
  }

  try {
    if (provider === "resend") await sendViaResend(recipient.email, subject, body);
    else if (provider === "sendgrid") await sendViaSendgrid(recipient.email, subject, body);
    else await sendViaSmtp(recipient.email, subject, body);
    return { status: "sent" };
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error(`[${prefix}] ${provider} send failed for ${recipient.email}:`, msg);
    return { status: "failed", errorMessage: msg.slice(0, 500) };
  }
}
