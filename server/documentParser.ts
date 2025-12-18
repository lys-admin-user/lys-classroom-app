import mammoth from "mammoth";

export interface ParsedUnit {
  title: string;
  description?: string;
  standards?: string[];
  weeks?: number;
}

export interface ParsedDocument {
  title?: string;
  subject?: string;
  gradeLevel?: string;
  units: ParsedUnit[];
  rawText: string;
}

export async function parseDocument(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<ParsedDocument> {
  let rawText = "";

  if (mimeType === "application/pdf" || filename.endsWith(".pdf")) {
    // Dynamic import for pdf-parse
    const pdfModule = await import("pdf-parse");
    const pdfParse = (pdfModule as any).default || pdfModule;
    const data = await pdfParse(buffer);
    rawText = data.text;
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    filename.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    rawText = result.value;
  } else if (mimeType === "text/plain" || filename.endsWith(".txt")) {
    rawText = buffer.toString("utf-8");
  } else {
    rawText = buffer.toString("utf-8");
  }

  return extractUnitsFromText(rawText);
}

function extractUnitsFromText(text: string): ParsedDocument {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const units: ParsedUnit[] = [];

  const unitPatterns = [
    /^unit\s*(\d+|[ivxlcdm]+)?[:\s-]*(.+)?$/i,
    /^chapter\s*(\d+)[:\s-]*(.+)?$/i,
    /^module\s*(\d+)[:\s-]*(.+)?$/i,
    /^week(?:s)?\s*(\d+(?:\s*-\s*\d+)?)[:\s-]*(.+)?$/i,
  ];

  let title: string | undefined;
  let subject: string | undefined;
  let gradeLevel: string | undefined;

  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i];
    if (!title && line.length > 10 && line.length < 100) {
      title = line;
    }
    if (/grade\s*(\d+|k|kindergarten)/i.test(line)) {
      const match = line.match(/grade\s*(\d+|k|kindergarten)/i);
      gradeLevel = match ? match[1] : undefined;
    }
    if (/subject[:\s]+(.+)/i.test(line)) {
      const match = line.match(/subject[:\s]+(.+)/i);
      subject = match ? match[1].trim() : undefined;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of unitPatterns) {
      const match = line.match(pattern);
      if (match) {
        const unitTitle = match[2]?.trim() || `Unit ${match[1] || units.length + 1}`;
        let description = "";
        if (i + 1 < lines.length && !unitPatterns.some((p) => p.test(lines[i + 1]))) {
          description = lines[i + 1];
        }
        units.push({
          title: unitTitle,
          description: description || undefined,
        });
        break;
      }
    }
  }

  if (units.length === 0) {
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 20);
    paragraphs.slice(0, 6).forEach((p, idx) => {
      const firstLine = p.split("\n")[0].trim();
      units.push({
        title: firstLine.slice(0, 60) || `Topic ${idx + 1}`,
        description: p.trim().slice(0, 200),
      });
    });
  }

  return {
    title,
    subject,
    gradeLevel,
    units,
    rawText: text.slice(0, 5000),
  };
}
