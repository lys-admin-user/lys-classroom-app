// Generates docs/editing-workflow.pdf — a polished, email-ready guide to how an
// edit travels from Replit -> GitHub -> Render (live), plus the main vs staging
// workflows. Pure pdfkit (no headless browser needed).
// Run: node scripts/generate-editing-workflow-pdf.mjs
import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("docs/editing-workflow.pdf");

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
    Title: "Publishing Your Changes — LYS Editing Workflow",
    Author: "Laddering Your Success",
    Subject: "How an edit goes from the workspace to the live website",
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

function numbered(items, accent = TEAL) {
  doc.fontSize(11).font("Helvetica").fill(INK);
  let i = 1;
  for (const item of items) {
    ensureSpace(28);
    const startY = doc.y;
    doc.circle(M + 6, startY + 6, 8).fill(accent);
    doc
      .fill("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(String(i), M + 2, startY + 2, { width: 8, align: "center" });
    doc.fill(INK).font("Helvetica").fontSize(11);
    if (Array.isArray(item)) {
      doc.text("", M + 22, startY, { width: CONTENT_W - 22, continued: true, lineGap: 3 });
      doc.font("Helvetica-Bold").text(item[0] + " ", { continued: true });
      doc.font("Helvetica").text(item[1], { lineGap: 3 });
    } else {
      doc.text(item, M + 22, startY, { width: CONTENT_W - 22, lineGap: 3 });
    }
    doc.moveDown(0.4);
    i++;
  }
  doc.moveDown(0.2);
}

// Draws the "Edit -> GitHub -> Render -> Live" flow as four connected chips.
function flowDiagram(steps) {
  ensureSpace(90);
  const gap = 10;
  const chipH = 46;
  const chipW = (CONTENT_W - gap * (steps.length - 1)) / steps.length;
  const y = doc.y;
  steps.forEach((step, idx) => {
    const x = M + idx * (chipW + gap);
    doc.roundedRect(x, y, chipW, chipH, 6).fill(idx === steps.length - 1 ? TEAL : LIGHT);
    doc
      .fill(idx === steps.length - 1 ? "#FFFFFF" : INK)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(step[0], x + 6, y + 8, { width: chipW - 12, align: "center" });
    doc
      .fill(idx === steps.length - 1 ? YELLOW : MUTED)
      .font("Helvetica")
      .fontSize(7.5)
      .text(step[1], x + 6, y + 24, { width: chipW - 12, align: "center" });
    if (idx < steps.length - 1) {
      doc
        .fill(RED)
        .font("Helvetica-Bold")
        .fontSize(14)
        .text(">", x + chipW - 2, y + chipH / 2 - 8, { width: gap + 4, align: "center" });
    }
  });
  doc.y = y + chipH;
  doc.moveDown(0.8);
}

// ---- Header band -----------------------------------------------------------
doc.rect(0, 0, PAGE_W, 132).fill(TEAL);
doc
  .fill("#FFFFFF")
  .font("Helvetica-Bold")
  .fontSize(24)
  .text("Publishing Your Changes", M, 40, { width: CONTENT_W });
doc
  .fill(YELLOW)
  .font("Helvetica-Oblique")
  .fontSize(12)
  .text(
    "How an edit travels from the workspace to your live website — and how to test it safely first.",
    M,
    78,
    { width: CONTENT_W },
  );

doc.y = 160;
doc.x = M;

// ---- Body ------------------------------------------------------------------
heading("The big picture", RED);
paragraph(
  "Making a change is only half the job — the change also has to be published before the public can see it. Here is the whole journey at a glance:",
);
flowDiagram([
  ["Make an edit", "in the workspace"],
  ["Save to GitHub", "commit + push"],
  ["Render builds it", "a few minutes"],
  ["It's live", "on your website"],
]);
paragraph(
  "The key thing to remember: a change that only lives in the workspace is not live yet. It becomes live once it is saved (\u201Cpushed\u201D) to GitHub, and the host (Render) automatically rebuilds and publishes the site.",
  { color: MUTED },
);

heading("The three places involved", TEAL);
bullets(
  [
    ["The workspace \u2014", "where you make the edit and preview how it looks."],
    ["GitHub \u2014", "the official storage that holds the real copy of the site. Nothing goes live until it arrives here."],
    ["Render \u2014", "the host that runs the live website and republishes automatically when GitHub receives a new change."],
  ],
  TEAL,
);

heading("A few words in plain language", TEAL);
bullets(
  [
    ["Branch \u2014", "a separate copy you can change without affecting the live one. \u201Cmain\u201D is the real/live copy; \u201Cstaging\u201D is a safe practice copy."],
    ["Commit \u2014", "saving a snapshot of your changes with a short note describing them."],
    ["Push \u2014", "sending your saved changes up to GitHub. This starts the path to going live."],
    ["Merge \u2014", "copying finished, tested changes from one branch (staging) into another (main)."],
  ],
  TEAL,
);

heading("How to publish (no command line needed)", RED);
paragraph("In the workspace:");
numbered(
  [
    ["Open the version-control panel", "(the branching icon in the left tool strip)."],
    ["Review the changed files", "so you know exactly what you are about to publish."],
    ["Write a short message", "describing the change, e.g. \u201CUpdated hero headline and button color.\u201D"],
    ["Click Commit, then Push.", "Your change is now on its way to the live site."],
  ],
  RED,
);
paragraph(
  "You can also simply ask the assistant to \u201Ccommit and push these changes\u201D \u2014 just always review what it is about to publish first.",
  { color: MUTED },
);

heading("Workflow A \u2014 quick, low-risk changes", TEAL);
paragraph(
  "Use this only for small edits you are confident about (a typo, a color, swapping an image). You work directly on the live copy (\u201Cmain\u201D):",
);
numbered(
  [
    "Make your change on the main branch.",
    "Preview it and confirm it looks right.",
    "Commit with a clear message and push to GitHub.",
    "Render republishes in a few minutes \u2014 check the live site.",
  ],
  TEAL,
);
paragraph(
  "Because \u201Cmain\u201D is the live copy, a mistake here can appear publicly before you catch it. For anything bigger than a trivial tweak, use Workflow B.",
  { color: MUTED },
);

heading("Workflow B \u2014 test on staging first (recommended)", RED);
paragraph(
  "This lets you rehearse changes safely, then publish once you are happy:",
);
numbered(
  [
    "Switch to the staging branch and make your change.",
    "Preview it, then commit and push staging to GitHub.",
    ["Test it thoroughly.", "If a staging site is connected, you can view it on a private test URL \u2014 a rehearsal with no risk to the public site. Check the affected pages on both phone and computer."],
    ["When satisfied, merge staging into main.", "The simplest way is a Pull Request on GitHub: open one from staging into main, review the changes, and click Merge."],
    "Once merged into main, Render publishes it to the live site automatically.",
  ],
  RED,
);
paragraph(
  "In short: practice on staging -> prove it works -> promote to main -> it goes live.",
  { font: "Helvetica-Oblique", color: MUTED },
);

heading("Before every publish \u2014 quick checklist", TEAL);
bullets(
  [
    "The change is a visual / wording change (not data, logins, payments, permissions, or settings). If it touches those, stop and ask your developer.",
    "You previewed it and it looks right.",
    "Your commit message clearly says what changed.",
    "For anything beyond a tiny tweak, you did it on staging and tested before merging to main.",
  ],
  TEAL,
);

// ---- Closing callout -------------------------------------------------------
ensureSpace(130);
doc.moveDown(0.4);
const boxY = doc.y;
const boxPad = 16;
const boxText =
  "If something looks wrong after publishing, don't worry \u2014 nothing is permanent. You can roll back to an earlier checkpoint in the workspace, and every past version is saved in GitHub, so your developer can restore the last good version quickly. When in doubt, pause and send them a short note of what changed.";
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

doc.end();
console.log("Wrote", OUT);
