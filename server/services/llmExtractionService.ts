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

// Split text into chunks on line boundaries so we can feed an ENTIRE document
// to the LLM across multiple calls instead of silently truncating it. A single
// oversized line is hard-split as a last resort.
function chunkTextByLines(text: string, chunkSize: number): string[] {
  if (text.length <= chunkSize) return [text];
  const lines = text.split("\n");
  const chunks: string[] = [];
  let current = "";
  for (const line of lines) {
    if (line.length > chunkSize) {
      if (current) { chunks.push(current); current = ""; }
      for (let i = 0; i < line.length; i += chunkSize) {
        chunks.push(line.slice(i, i + chunkSize));
      }
      continue;
    }
    if (current.length + line.length + 1 > chunkSize) {
      chunks.push(current);
      current = line;
    } else {
      current = current ? `${current}\n${line}` : line;
    }
  }
  if (current) chunks.push(current);
  return chunks;
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

  // Process the ENTIRE document in line-aligned chunks. The previous
  // implementation sliced rawText to 15k chars and sent a single call, which
  // silently dropped every standard past the cutoff for long curriculum
  // documents — the exact "partial ingestion" failure we must never ship.
  const CHUNK_SIZE = 12000;
  const MAX_CHUNKS = 40; // hard ceiling (~480k chars) to bound API cost
  const allChunks = chunkTextByLines(rawText, CHUNK_SIZE);
  const chunks = allChunks.slice(0, MAX_CHUNKS);
  const exceededChunkLimit = allChunks.length > MAX_CHUNKS;

  const byKey = new Map<string, ExtractedStandard>();
  const ordered: ExtractedStandard[] = [];
  let confidenceSum = 0;
  let chunkSuccesses = 0;
  let chunkFailures = 0;

  for (let i = 0; i < chunks.length; i++) {
    const partLabel =
      chunks.length > 1 ? ` This is part ${i + 1} of ${chunks.length}; extract EVERY standard in this part.` : "";
    const userPrompt = `Extract educational standards from the following ${jurisdictionName} curriculum document${subject ? ` for ${subject}` : ""}${gradeLevel ? ` (Grade ${gradeLevel})` : ""}.${partLabel}

---
${chunks[i]}
---

Return the JSON array of standards:`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 8000,
        reasoning_effort: "minimal",
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        chunkFailures++;
        continue;
      }

      const parsed = JSON.parse(content);
      const chunkStandards: ExtractedStandard[] = parsed.standards || [];
      confidenceSum += parsed.confidence || 50;
      chunkSuccesses++;

      for (const std of chunkStandards) {
        // Composite key (code + statement). A code reused across chunks — the
        // model often re-numbers per chunk — must NOT clobber a distinct
        // statement, or we silently drop real standards during the merge.
        const codeKey = (std.code || "").trim().toLowerCase();
        const statementKey = (std.statement || "").trim().toLowerCase();
        const key = `${codeKey}|${statementKey}`;
        if (key === "|" || byKey.has(key)) continue;
        byKey.set(key, std);
        ordered.push(std);
      }
    } catch (error) {
      console.error(`LLM extraction error (chunk ${i + 1}/${chunks.length}):`, error);
      chunkFailures++;
    }
  }

  if (chunkSuccesses === 0) {
    return {
      standards: [],
      rawBulletCount,
      extractedCount: 0,
      confidence: 0,
      validationPassed: false,
      validationMessage:
        chunkFailures > 0
          ? `Extraction failed across all ${chunkFailures} chunk(s)`
          : "No response from AI model",
    };
  }

  const standards = ordered;
  const extractedCount = standards.length;
  const aiConfidence = Math.floor(confidenceSum / chunkSuccesses);

  const toleranceRange = 0.2;
  const minExpected = Math.floor(rawBulletCount * (1 - toleranceRange));
  // Completeness is what matters: flag when we extracted FEWER than expected
  // (possible partial extraction). Extracting more fine-grained sub-standards
  // than the rough bullet heuristic predicted is not a failure.
  const completeEnough = extractedCount >= minExpected;
  const allChunksProcessed = chunkFailures === 0 && !exceededChunkLimit;
  const validationPassed = completeEnough && allChunksProcessed;

  let validationMessage: string;
  if (!allChunksProcessed) {
    validationMessage =
      `Validation warning: incomplete ingestion — ${chunkFailures} chunk(s) failed` +
      `${exceededChunkLimit ? `, document exceeded the ${MAX_CHUNKS}-chunk limit` : ""}. ` +
      `${extractedCount} standards extracted (expected ~${rawBulletCount}). Review required before publishing.`;
  } else if (!completeEnough) {
    validationMessage =
      `Validation warning: ${extractedCount} standards extracted but ~${rawBulletCount} expected. ` +
      `Possible partial extraction — review recommended.`;
  } else {
    validationMessage = `Validation passed: ${extractedCount} standards extracted across ${chunkSuccesses} chunk(s) (expected ~${rawBulletCount})`;
  }

  const confidence = validationPassed ? aiConfidence : Math.floor(aiConfidence * 0.7);

  return {
    standards,
    rawBulletCount,
    extractedCount,
    confidence,
    validationPassed,
    validationMessage,
  };
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

    // Never auto-complete a partial ingestion. If validation did not pass
    // (failed chunks, exceeded chunk ceiling, or fewer standards than expected)
    // the staged rows still exist for manual review, but the import job is
    // marked "failed" with a loud message so incomplete data is never treated
    // as a finished, publishable set.
    if (!result.validationPassed) {
      await storage.updatePdfImport(pdfImportId, {
        status: "failed",
        errorMessage: `Incomplete ingestion — manual review required before publishing. ${result.validationMessage}`,
        processedAt: new Date(),
      });
      return {
        success: false,
        stagingCount: created.length,
        message: `${created.length} standards staged but ingestion is INCOMPLETE — manual review required. ${result.validationMessage}`,
      };
    }

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
