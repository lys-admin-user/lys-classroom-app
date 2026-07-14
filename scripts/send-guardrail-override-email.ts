// Emails the newest guardrail-override log entry to the developer.
//
// Run after appending an entry to docs/guardrail-override-log.md:
//   npx tsx scripts/send-guardrail-override-email.ts
//
// Recipient defaults to bayo@maskil.dev; override with GUARDRAIL_LOG_EMAIL.
// Uses the app's shared outbound email transport (Resend/SendGrid/SMTP).
import fs from "node:fs";
import path from "node:path";
import { sendEmail } from "../server/services/emailTransport";

const LOG_PATH = path.resolve("docs/guardrail-override-log.md");
const RECIPIENT = process.env.GUARDRAIL_LOG_EMAIL || "bayo@maskil.dev";

function newestEntry(markdown: string): string | null {
  // Entries start with "## [YYYY-MM-DD" — the "## Entry template" section and
  // its fenced example are excluded because the real entries sit above it and
  // the template heading doesn't match the date pattern.
  const entryPattern = /^## \[\d{4}-\d{2}-\d{2}[^\n]*$/m;
  const start = markdown.search(entryPattern);
  if (start === -1) return null;
  const rest = markdown.slice(start);
  // Entry ends at the next entry heading, a horizontal rule, or end of file.
  const endMatch = rest.slice(3).search(/^(## \[\d{4}-\d{2}-\d{2}|---\s*$)/m);
  return (endMatch === -1 ? rest : rest.slice(0, endMatch + 3)).trim();
}

async function main() {
  const markdown = fs.readFileSync(LOG_PATH, "utf8");
  const entry = newestEntry(markdown);
  if (!entry) {
    console.error("No log entries found in", LOG_PATH, "- nothing sent.");
    process.exit(1);
  }

  const titleLine = entry.split("\n")[0].replace(/^##\s*/, "");
  const subject = `Guardrail override: ${titleLine}`;
  const body = [
    "A protected-area change went ahead without prior developer sign-off.",
    "",
    entry,
    "",
    "Full log: docs/guardrail-override-log.md in the LYS project.",
  ].join("\n");

  const result = await sendEmail({ email: RECIPIENT }, subject, body, {
    logPrefix: "guardrail-override",
  });
  console.log(`Guardrail override email to ${RECIPIENT}: ${result.status}`);
  if (result.status === "failed") {
    console.error(result.errorMessage);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("send-guardrail-override-email failed:", err);
  process.exit(1);
});
