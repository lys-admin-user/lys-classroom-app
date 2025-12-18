import OpenAI from "openai";
import { storage } from "../storage";
import type { InsertStandardsStaging } from "@shared/schema";
import crypto from "crypto";

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

interface ExtractedStandard {
  code: string;
  statement: string;
  gradeLevel?: string;
  parentCode?: string;
  depth?: number;
}

interface ExtractionResult {
  standards: ExtractedStandard[];
  rawBulletCount: number;
  extractedCount: number;
  confidence: number;
  validationPassed: boolean;
  validationMessage: string;
}

function countBulletPoints(text: string): number {
  const bulletPatterns = [
    /^[\s]*[-•*]\s+/gm,
    /^[\s]*\d+\.\s+/gm,
    /^[\s]*[a-zA-Z]\)\s+/gm,
    /^[\s]*\([a-zA-Z0-9]+\)\s+/gm,
    /^\s*[A-Z]{2,}\.[A-Z0-9.-]+/gm,
  ];

  let count = 0;
  for (const pattern of bulletPatterns) {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  }

  const lines = text.split("\n").filter(line => line.trim().length > 20);
  return Math.max(count, Math.floor(lines.length * 0.3));
}

export async function extractStandardsFromText(
  rawText: string,
  jurisdictionName: string,
  subject?: string,
  gradeLevel?: string
): Promise<ExtractionResult> {
  const openai = getOpenAI();
  if (!openai) {
    return {
      standards: [],
      rawBulletCount: 0,
      extractedCount: 0,
      confidence: 0,
      validationPassed: false,
      validationMessage: "OpenAI API key not configured",
    };
  }

  const rawBulletCount = countBulletPoints(rawText);

  const systemPrompt = `Act as a Curriculum Engineer. Convert the following text into a machine-readable JSON array of educational standards. 

IMPORTANT RULES:
1. Maintain hierarchy (Parent/Child relationships) using the parentCode field
2. If a standard code is missing, generate a consistent slug using the format: ${jurisdictionName.toUpperCase().replace(/\s/g, "-")}-${subject?.toUpperCase().replace(/\s/g, "-") || "GEN"}-{NUMBER}
3. Extract ALL standards, learning objectives, and competencies from the text
4. Preserve the exact wording of each standard statement
5. Identify grade levels when mentioned

Return ONLY valid JSON in this exact format:
{
  "standards": [
    {
      "code": "TEKS.ELA.1.1",
      "statement": "The student will demonstrate...",
      "gradeLevel": "1",
      "parentCode": null,
      "depth": 0
    }
  ],
  "confidence": 85
}`;

  const userPrompt = `Extract educational standards from the following ${jurisdictionName} curriculum document${subject ? ` for ${subject}` : ""}${gradeLevel ? ` (Grade ${gradeLevel})` : ""}:

---
${rawText.slice(0, 15000)}
${rawText.length > 15000 ? "\n\n[Document truncated due to length...]" : ""}
---

Return the JSON array of standards:`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return {
        standards: [],
        rawBulletCount,
        extractedCount: 0,
        confidence: 0,
        validationPassed: false,
        validationMessage: "No response from AI model",
      };
    }

    const parsed = JSON.parse(content);
    const standards: ExtractedStandard[] = parsed.standards || [];
    const aiConfidence = parsed.confidence || 50;

    const extractedCount = standards.length;
    const toleranceRange = 0.2;
    const minExpected = Math.floor(rawBulletCount * (1 - toleranceRange));
    const maxExpected = Math.ceil(rawBulletCount * (1 + toleranceRange));
    
    const validationPassed = extractedCount >= minExpected && extractedCount <= maxExpected;
    const validationMessage = validationPassed
      ? `Validation passed: ${extractedCount} standards extracted (expected ~${rawBulletCount})`
      : `Validation warning: ${extractedCount} standards extracted but ${rawBulletCount} bullet points detected. Review recommended.`;

    const confidence = validationPassed ? aiConfidence : Math.floor(aiConfidence * 0.7);

    return {
      standards,
      rawBulletCount,
      extractedCount,
      confidence,
      validationPassed,
      validationMessage,
    };
  } catch (error) {
    console.error("LLM extraction error:", error);
    return {
      standards: [],
      rawBulletCount,
      extractedCount: 0,
      confidence: 0,
      validationPassed: false,
      validationMessage: `Extraction failed: ${error}`,
    };
  }
}

export async function processPdfImport(pdfImportId: string): Promise<{
  success: boolean;
  stagingCount: number;
  message: string;
}> {
  const pdfImport = await storage.getPdfImport(pdfImportId);
  if (!pdfImport) {
    return { success: false, stagingCount: 0, message: "PDF import not found" };
  }

  await storage.updatePdfImport(pdfImportId, { status: "processing" });

  try {
    const rawText = pdfImport.extractedData?.rawText || "";
    if (!rawText) {
      await storage.updatePdfImport(pdfImportId, {
        status: "failed",
        errorMessage: "No text content to process",
      });
      return { success: false, stagingCount: 0, message: "No text content to process" };
    }

    const jurisdiction = await storage.getJurisdictionByAbbr(pdfImport.country, pdfImport.jurisdiction);
    if (!jurisdiction) {
      await storage.updatePdfImport(pdfImportId, {
        status: "failed",
        errorMessage: "Jurisdiction not found",
      });
      return { success: false, stagingCount: 0, message: "Jurisdiction not found" };
    }

    const result = await extractStandardsFromText(
      rawText,
      pdfImport.jurisdiction,
      pdfImport.subject || undefined,
      pdfImport.gradeLevel || undefined
    );

    await storage.updatePdfImport(pdfImportId, {
      extractedData: {
        ...pdfImport.extractedData,
        standards: result.standards,
        confidence: result.confidence,
      },
    });

    if (result.standards.length === 0) {
      await storage.updatePdfImport(pdfImportId, {
        status: "failed",
        errorMessage: result.validationMessage,
      });
      return { success: false, stagingCount: 0, message: result.validationMessage };
    }

    const stagingRecords: InsertStandardsStaging[] = result.standards.map((std, idx) => ({
      jurisdictionId: jurisdiction.id,
      humanCoding: std.code,
      statement: std.statement,
      gradeLevel: std.gradeLevel || pdfImport.gradeLevel,
      depth: std.depth || 0,
      position: idx,
      parentCode: std.parentCode,
      source: "llm_extract",
      rawSourceText: rawText.slice(0, 500),
      extractionConfidence: result.confidence,
      status: "pending",
    }));

    const created = await storage.bulkCreateStagingStandards(stagingRecords);

    await storage.updatePdfImport(pdfImportId, {
      status: "completed",
      processedAt: new Date(),
    });

    return {
      success: true,
      stagingCount: created.length,
      message: `${created.length} standards extracted and sent to staging queue. ${result.validationMessage}`,
    };
  } catch (error) {
    console.error("PDF processing error:", error);
    await storage.updatePdfImport(pdfImportId, {
      status: "failed",
      errorMessage: `Processing error: ${error}`,
    });
    return { success: false, stagingCount: 0, message: `Processing error: ${error}` };
  }
}

export async function checkSourceForChanges(sourceUrl: string): Promise<{
  hasChanged: boolean;
  newChecksum: string | null;
  message: string;
}> {
  try {
    const response = await fetch(sourceUrl, { method: "HEAD" });
    
    if (!response.ok) {
      return { hasChanged: false, newChecksum: null, message: `Failed to fetch: ${response.status}` };
    }

    const etag = response.headers.get("etag");
    const contentLength = response.headers.get("content-length");
    const lastModified = response.headers.get("last-modified");

    const newChecksum = etag || crypto.createHash("md5")
      .update(`${contentLength || ""}-${lastModified || ""}`)
      .digest("hex");

    const existing = await storage.getSourceChecksum(sourceUrl);

    if (!existing) {
      await storage.createSourceChecksum({
        sourceUrl,
        sourceName: new URL(sourceUrl).hostname,
        etag: etag || undefined,
        md5Hash: newChecksum,
        contentLength: contentLength ? parseInt(contentLength) : undefined,
        lastModified: lastModified ? new Date(lastModified) : undefined,
        lastCheckedAt: new Date(),
        hasChanged: false,
      });
      return { hasChanged: false, newChecksum, message: "New source registered" };
    }

    const hasChanged = existing.md5Hash !== newChecksum || existing.etag !== etag;

    await storage.updateSourceChecksum(existing.id, {
      etag: etag || undefined,
      md5Hash: newChecksum,
      contentLength: contentLength ? parseInt(contentLength) : undefined,
      lastModified: lastModified ? new Date(lastModified) : undefined,
      hasChanged,
      changeDetectedAt: hasChanged ? new Date() : existing.changeDetectedAt,
    });

    return {
      hasChanged,
      newChecksum,
      message: hasChanged ? "Source has changed - re-scrape recommended" : "No changes detected",
    };
  } catch (error) {
    return { hasChanged: false, newChecksum: null, message: `Check failed: ${error}` };
  }
}
