// Regenerates docs/workflow-knowledge-base.pdf from docs/workflow-knowledge-base.md.
// Supports the markdown subset used in that file: #/##/### headings, paragraphs,
// "- " bullets, **bold** spans, and simple pipe tables.
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

const SRC = path.resolve("docs/workflow-knowledge-base.md");
const OUT = path.resolve("docs/workflow-knowledge-base.pdf");

const md = fs.readFileSync(SRC, "utf8");
const lines = md.split("\n");

const doc = new PDFDocument({ size: "LETTER", margins: { top: 60, bottom: 60, left: 64, right: 64 } });
doc.pipe(fs.createWriteStream(OUT));

const NAVY = "#1f2a44";
const BODY = "#222222";
const GRAY = "#555555";

function boldSegments(text: string): { text: string; bold: boolean }[] {
  const parts = text.split(/\*\*/);
  return parts.map((p, i) => ({ text: p, bold: i % 2 === 1 })).filter((p) => p.text.length > 0);
}

function writeRich(text: string, opts: { indent?: number; fontSize?: number; color?: string } = {}) {
  const segs = boldSegments(text);
  const size = opts.fontSize ?? 10.5;
  const color = opts.color ?? BODY;
  segs.forEach((seg, i) => {
    doc
      .font(seg.bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(size)
      .fillColor(color)
      .text(seg.text, i === 0 ? { continued: i < segs.length - 1, indent: opts.indent ?? 0 } : { continued: i < segs.length - 1 });
  });
  doc.moveDown(0.4);
}

function drawTable(rows: string[][]) {
  const colCount = rows[0].length;
  const tableWidth = doc.page.width - 128;
  const colWidth = tableWidth / colCount;
  const startX = 64;
  rows.forEach((row, r) => {
    const isHeader = r === 0;
    let y = doc.y;
    // measure row height
    let rowH = 0;
    row.forEach((cell) => {
      doc.font(isHeader ? "Helvetica-Bold" : "Helvetica").fontSize(9);
      const h = doc.heightOfString(cell, { width: colWidth - 12 });
      rowH = Math.max(rowH, h + 10);
    });
    if (y + rowH > doc.page.height - 60) {
      doc.addPage();
      y = doc.y;
    }
    if (isHeader) {
      doc.rect(startX, y, tableWidth, rowH).fill("#e8ecf4");
    } else if (r % 2 === 0) {
      doc.rect(startX, y, tableWidth, rowH).fill("#f6f7fa");
    }
    row.forEach((cell, c) => {
      doc
        .font(isHeader ? "Helvetica-Bold" : "Helvetica")
        .fontSize(9)
        .fillColor(isHeader ? NAVY : BODY)
        .text(cell, startX + c * colWidth + 6, y + 5, { width: colWidth - 12 });
    });
    doc.rect(startX, y, tableWidth, rowH).strokeColor("#c9d0dd").lineWidth(0.5).stroke();
    doc.y = y + rowH;
    doc.x = startX;
  });
  doc.moveDown(0.8);
}

let i = 0;
while (i < lines.length) {
  const line = lines[i];

  if (line.startsWith("| ")) {
    const tableLines: string[] = [];
    while (i < lines.length && lines[i].startsWith("|")) {
      tableLines.push(lines[i]);
      i++;
    }
    const rows = tableLines
      .filter((l) => !/^\|[\s\-|]+\|$/.test(l.replace(/ /g, "")))
      .map((l) => l.split("|").slice(1, -1).map((c) => c.trim()));
    drawTable(rows);
    continue;
  }

  if (line.startsWith("### ")) {
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").fontSize(13).fillColor(NAVY).text(line.slice(4));
    doc.moveDown(0.3);
  } else if (line.startsWith("## ")) {
    doc.moveDown(0.7);
    doc.font("Helvetica-Bold").fontSize(17).fillColor(NAVY).text(line.slice(3));
    doc
      .moveTo(64, doc.y + 2)
      .lineTo(doc.page.width - 64, doc.y + 2)
      .strokeColor("#c9d0dd")
      .lineWidth(1)
      .stroke();
    doc.moveDown(0.6);
  } else if (line.startsWith("# ")) {
    doc.font("Helvetica-Bold").fontSize(22).fillColor(NAVY).text(line.slice(2));
    doc.moveDown(0.5);
  } else if (line.startsWith("- ")) {
    const segs = boldSegments(line.slice(2));
    doc.font("Helvetica").fontSize(10.5).fillColor(BODY).text("•  ", 74, doc.y, { continued: true });
    segs.forEach((seg, j) => {
      doc
        .font(seg.bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(10.5)
        .fillColor(BODY)
        .text(seg.text, { continued: j < segs.length - 1, width: doc.page.width - 148 });
    });
    doc.x = 64;
    doc.moveDown(0.25);
  } else if (line.startsWith("Last updated:")) {
    doc.font("Helvetica-Oblique").fontSize(9.5).fillColor(GRAY).text(line);
    doc.moveDown(0.5);
  } else if (line.trim().length > 0) {
    writeRich(line);
  }
  i++;
}

doc.end();
console.log(`Wrote ${OUT}`);
