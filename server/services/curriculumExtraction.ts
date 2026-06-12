// AI-powered extraction of structured standards from a customer-uploaded
// curriculum document. The raw text was already saved to the document row;
// here we ask OpenAI to pull out structured codes + descriptions and persist
// them into org_extracted_standards (org-private; never pooled publicly).

import { openai } from "../openai";
import {
  updateExtractionStatus,
  insertOrgExtractedStandards,
  getCurriculumDocument,
} from "./curriculumLibrary";
import { sanitizePromptText } from "./piiSanitizer";

type ExtractedStandard = {
  code: string;
  description: string;
  subject?: string;
  gradeLevel?: string;
  strand?: string;
};

const EXTRACTION_SYSTEM_PROMPT = `You are an expert curriculum analyst. Given the raw text of a school's
scope-and-sequence, year-at-a-glance (YAG), or curriculum framework, extract
every distinct learning standard into a structured list.

Rules:
- Output ONLY a JSON object: { "standards": [...] }
- Each standard MUST have: { code, description }.
- Optional fields: subject, gradeLevel, strand.
- "code" should be the official identifier as written in the document
  (e.g. "MA.6.NS.1", "AC9M6N01", "K.CC.A.1"). If the document presents the
  standard with no code, generate a stable short code like "TOPIC-G6-01".
- "description" is the full text of the learning objective.
- Do NOT invent standards not present in the document.
- Do NOT include unit summaries, pacing notes, or framing text — only the
  standards themselves.
- If you cannot find any structured standards, return { "standards": [] }.`;

export async function extractStandardsFromDocument(
  documentId: string,
): Promise<{ count: number; error?: string }> {
  const doc = await getCurriculumDocument(documentId);
  if (!doc) return { count: 0, error: "Document not found" };
  if (!doc.extractedText || doc.extractedText.trim().length < 50) {
    await updateExtractionStatus(documentId, "skipped", {
      extractionError: "Insufficient text content to extract standards",
    });
    return { count: 0, error: "Insufficient text" };
  }
  if (!doc.organizationId) {
    await updateExtractionStatus(documentId, "skipped", {
      extractionError: "Personal documents skip standards extraction",
    });
    return { count: 0 };
  }

  if (!openai) {
    await updateExtractionStatus(documentId, "failed", {
      extractionError: "OpenAI not configured — set OPENAI_API_KEY",
    });
    return { count: 0, error: "OpenAI not configured" };
  }

  await updateExtractionStatus(documentId, "processing");

  try {
    // Cap at 60K chars (~15K tokens) to stay within model context
    const sanitized = sanitizePromptText(doc.extractedText.slice(0, 60_000));

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      response_format: { type: "json_object" },
      reasoning_effort: "minimal",
      messages: [
        { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            `Document title: ${doc.title}`,
            doc.subject ? `Subject: ${doc.subject}` : null,
            doc.gradeLevels && (doc.gradeLevels as string[]).length > 0
              ? `Grade levels: ${(doc.gradeLevels as string[]).join(", ")}`
              : null,
            doc.country ? `Country: ${doc.country}` : null,
            doc.state ? `State/Region: ${doc.state}` : null,
            "",
            "Document text:",
            sanitized,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    const parsed = JSON.parse(raw) as { standards?: ExtractedStandard[] };
    const standards = (parsed.standards || []).filter(
      (s) => s && typeof s.code === "string" && typeof s.description === "string",
    );

    const count = await insertOrgExtractedStandards(
      doc.organizationId,
      documentId,
      standards.map((s) => ({
        code: s.code.trim(),
        description: s.description.trim(),
        subject: s.subject?.trim() || doc.subject,
        gradeLevel:
          s.gradeLevel?.trim() ||
          ((doc.gradeLevels as string[] | null)?.[0] ?? null),
        strand: s.strand?.trim() || null,
      })),
    );

    await updateExtractionStatus(documentId, "extracted", {
      standardsExtractedCount: count,
    });
    return { count };
  } catch (err: any) {
    const msg = err?.message || String(err);
    await updateExtractionStatus(documentId, "failed", {
      extractionError: msg.slice(0, 500),
    });
    return { count: 0, error: msg };
  }
}

// Fire-and-forget background runner. Routes call this after upload — we
// don't make the user wait for OpenAI.
export function extractStandardsInBackground(documentId: string): void {
  extractStandardsFromDocument(documentId).catch((err) => {
    console.error(`[curriculumExtraction] background run failed:`, err);
  });
}
