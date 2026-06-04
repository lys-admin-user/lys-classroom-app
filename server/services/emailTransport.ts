// Shared outbound email transport.
//
// Originally lived inside `standardsDigest.ts` (Task #8); extracted here so the
// weekly standards digest and the daily moderation-backlog alert (Task #12)
// share one nodemailer singleton + the same "no SMTP configured" fallback.
//
// When SMTP credentials are absent (the normal case in dev / unconfigured
// Replit envs) we log the rendered email and return `logged_no_transport` so
// callers can still persist a paper trail. To enable real delivery, set
// SMTP_HOST, SMTP_PORT, and (optionally) SMTP_USER / SMTP_PASS plus a from
// address via DIGEST_FROM_EMAIL or SMTP_FROM.
import nodemailer, { type Transporter } from "nodemailer";

export type EmailSendStatus = "sent" | "logged_no_transport" | "failed";

export function getBaseUrl(): string {
  const domains = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (domains) return `https://${domains}`;
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return "http://localhost:5000";
}

// Lazily constructed singleton so we don't reconnect for every recipient and
// don't try to connect at all when no SMTP credentials are configured.
let cachedTransporter: Transporter | null | undefined; // undefined = not yet checked, null = no-transport

function getTransporter(): Transporter | null {
  if (cachedTransporter !== undefined) return cachedTransporter;
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

function getFromAddress(): string {
  return (
    process.env.DIGEST_FROM_EMAIL ||
    process.env.SMTP_FROM ||
    "LYS <no-reply@laddering-your-success.local>"
  );
}

export async function sendEmail(
  recipient: { email: string | null },
  subject: string,
  body: string,
  opts: { logPrefix?: string } = {},
): Promise<{ status: EmailSendStatus; errorMessage?: string }> {
  const prefix = opts.logPrefix ?? "email";
  const transporter = getTransporter();
  if (!transporter || !recipient.email) {
    console.log(
      `[${prefix}] (no-transport) to=${recipient.email ?? "(no email)"} subject="${subject}"\n${body}`,
    );
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
