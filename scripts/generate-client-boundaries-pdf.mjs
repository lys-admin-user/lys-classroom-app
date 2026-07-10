// Generates docs/client-editing-boundaries.pdf — a polished, email-ready,
// client-facing document. Pure pdfkit (no headless browser needed).
// Run: node scripts/generate-client-boundaries-pdf.mjs
import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("docs/client-editing-boundaries.pdf");

// LYS brand palette (approx. hex of the app's HSL theme tokens)
const RED = "#E8482B";
const TEAL = "#016974";
const YELLOW = "#F5C542";
const INK = "#1F2937";
const MUTED = "#5B6470";
const LIGHT = "#F3F5F6";

const doc = new PDFDocument({
  size: "LETTER",
  margins: { top: 64, bottom: 64, left: 64, right: 64 },
  info: {
    Title: "Making Changes to Your LYS Platform",
    Author: "Laddering Your Success",
    Subject: "What you can change yourself and what to leave to your developer",
  },
});

doc.pipe(fs.createWriteStream(OUT));

const PAGE_W = doc.page.width;
const M = doc.page.margins.left;
const CONTENT_W = PAGE_W - M * 2;

function ensureSpace(needed) {
  if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
}

function heading(text, color = TEAL) {
  ensureSpace(60);
  doc.moveDown(0.8);
  const y = doc.y;
  doc.rect(M, y + 2, 4, 16).fill(color);
  doc
    .fill(color)
    .font("Helvetica-Bold")
    .fontSize(15)
    .text(text, M + 14, y, { width: CONTENT_W - 14 });
  doc.moveDown(0.4);
}

function paragraph(text, opts = {}) {
  ensureSpace(40);
  doc
    .fill(opts.color || INK)
    .font(opts.font || "Helvetica")
    .fontSize(opts.size || 11)
    .text(text, M, doc.y, { width: CONTENT_W, align: "left", lineGap: 3 });
  doc.moveDown(opts.gap ?? 0.5);
}

function bullets(items, accent = RED) {
  doc.fontSize(11).font("Helvetica").fill(INK);
  for (const item of items) {
    ensureSpace(28);
    const startY = doc.y;
    doc.circle(M + 4, startY + 6, 2.2).fill(accent);
    doc.fill(INK).font("Helvetica");
    if (Array.isArray(item)) {
      // [boldLead, rest]
      doc.text("", M + 14, startY, { width: CONTENT_W - 14, continued: true, lineGap: 3 });
      doc.font("Helvetica-Bold").text(item[0] + " ", { continued: true });
      doc.font("Helvetica").text(item[1], { lineGap: 3 });
    } else {
      doc.text(item, M + 14, startY, { width: CONTENT_W - 14, lineGap: 3 });
    }
    doc.moveDown(0.35);
  }
  doc.moveDown(0.2);
}

// ---- Header band -----------------------------------------------------------
doc.rect(0, 0, PAGE_W, 132).fill(TEAL);
doc
  .fill("#FFFFFF")
  .font("Helvetica-Bold")
  .fontSize(24)
  .text("Making Changes to Your LYS Platform", M, 40, { width: CONTENT_W });
doc
  .fill(YELLOW)
  .font("Helvetica-Oblique")
  .fontSize(12)
  .text(
    "A short, friendly guide to what you can adjust yourself — and what to leave to your developer.",
    M,
    82,
    { width: CONTENT_W },
  );

doc.y = 160;
doc.x = M;

// ---- Body ------------------------------------------------------------------
heading("Welcome", RED);
paragraph(
  "Your LYS platform is built so you can keep it feeling fresh and on-brand without waiting on anyone. This short guide explains what you are free to change on your own, and which parts are best handled by your developer so that everything keeps running smoothly and safely.",
);
paragraph(
  "The short version: you can change how the site looks and reads; your developer handles anything to do with data, accounts, payments, and security.",
  { font: "Helvetica-Oblique", color: MUTED },
);

heading("What you can change yourself", TEAL);
paragraph(
  "These are the “look and feel” parts of your platform. Adjust them freely — they are easy to change and easy to undo.",
);
bullets(
  [
    ["Colors —", "your brand colors, buttons, and background tones."],
    ["Fonts and text styling —", "headings, body text, sizes, and emphasis."],
    ["Wording —", "headlines, button labels, descriptions, and help text."],
    ["Spacing and layout —", "how roomy sections feel and the order they appear in."],
    ["Images and logos —", "swapping in new pictures, icons, or a refreshed logo."],
  ],
  TEAL,
);
paragraph("If it is about how the site looks or what it says, it is yours to adjust.", {
  color: MUTED,
});

heading("What your developer should handle", RED);
paragraph(
  "These parts run quietly in the background and keep your platform accurate, secure, and trustworthy. They should always go through your developer:",
);
bullets(
  [
    ["Your data and records —", "everything your users and students have saved."],
    ["Sign-in and accounts —", "how people log in and stay logged in."],
    ["Security features —", "the extra verification steps that protect accounts."],
    ["Payments and billing —", "plans, prices, checkout, and subscriptions."],
    ["Permissions —", "who is allowed to see and do what across the platform."],
    ["Behind-the-scenes settings —", "the technical configuration that ties it all together."],
  ],
  RED,
);
paragraph(
  "None of these ever need to change just to update a color, some text, or an image. If a change starts to touch any of them, that is the moment to loop in your developer.",
  { color: MUTED },
);

heading("Working safely with the built-in assistant", TEAL);
paragraph(
  "Your platform is edited with the help of an AI assistant. A few simple habits keep the experience smooth:",
);
bullets(
  [
    ["Start with your boundaries.", "At the beginning of each session, tell the assistant you only want visual and wording changes — nothing involving data, logins, payments, or security."],
    ["One change at a time.", "Make a single adjustment, take a look, then continue. Small steps are easy to review."],
    ["You can always undo.", "The system automatically saves checkpoints as you work, so you can roll back to an earlier version if something does not look right. Nothing is permanent by accident."],
    ["Watch for anything unexpected.", "If the assistant mentions data, accounts, payments, security, or adding new software in response to a simple visual request, pause — that is a sign to check with your developer."],
  ],
  TEAL,
);

heading("When to loop in your developer", RED);
paragraph("Reach out to your developer whenever a change involves:");
bullets(
  [
    "Adding, changing, or removing stored information.",
    "Anything about how people sign in, or account security.",
    "Prices, plans, payments, or billing.",
    "Who can access which parts of the platform.",
    "A request that suddenly needs a password, a key, or new software.",
  ],
  RED,
);
paragraph(
  "Asking first is always the smart move. It is far quicker to check in than to undo a change that affected something important — and your developer would much rather hear from you early.",
  { color: MUTED },
);

// ---- Closing callout -------------------------------------------------------
ensureSpace(120);
doc.moveDown(0.6);
const boxY = doc.y;
const boxPad = 16;
const boxText =
  "You are in the driver's seat for the look and feel of your platform. Keep it vibrant, keep it on-brand, and enjoy making it your own. For anything involving data, accounts, payments, or security, your developer is just a message away.";
doc.font("Helvetica-Bold").fontSize(12);
const textH = doc.heightOfString(boxText, { width: CONTENT_W - boxPad * 2, lineGap: 3 });
const boxH = textH + boxPad * 2;
doc.roundedRect(M, boxY, CONTENT_W, boxH, 8).fill(LIGHT);
doc.rect(M, boxY, 4, boxH).fill(YELLOW);
doc
  .fill(INK)
  .font("Helvetica-Bold")
  .fontSize(12)
  .text(boxText, M + boxPad, boxY + boxPad, { width: CONTENT_W - boxPad * 2, lineGap: 3 });
doc.y = boxY + boxH;
doc.moveDown(0.6);
paragraph(
  "Thank you for taking care of your platform — these simple boundaries keep it beautiful on the outside and rock-solid underneath.",
  { font: "Helvetica-Oblique", color: MUTED },
);

// ---- Footer on every page --------------------------------------------------
const range = doc.bufferedPageRange();
doc.end();

doc.on("end", () => {});

console.log("Wrote", OUT);
