import { storage } from "../storage";
import type { InsertStandardsJurisdiction, InsertStandardSet, InsertEducationalStandard } from "@shared/schema";
import crypto from "crypto";

const CSP_API_BASE = "https://api.commonstandardsproject.com/api/v1";

interface CSPJurisdiction {
  id: string;
  title: string;
  type?: string;
}

interface CSPStandardSet {
  id: string;
  title: string;
  subject: string;
  educationLevels?: string[];
  document?: {
    id: string;
    valid: string;
    title: string;
    sourceURL?: string;
    asnIdentifier?: string;
    publicationStatus?: string;
  };
  license?: {
    title: string;
    URL: string;
    rightsHolder?: string;
  };
  jurisdiction?: {
    id: string;
    title: string;
  };
  standards?: Record<string, CSPStandard>;
}

interface CSPStandard {
  id: string;
  asnIdentifier?: string;
  position: number;
  depth: number;
  statementNotation: string;
  statementLabel?: string;
  description: string;
  ancestorIds?: string[];
}

function generateUid(...parts: string[]): string {
  const input = parts.filter(Boolean).join("|").toLowerCase();
  return crypto.createHash("md5").update(input).digest("hex");
}

function mapStateAbbreviation(stateName: string): string {
  const stateMap: Record<string, string> = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
    "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA",
    "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
    "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
    "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO",
    "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
    "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
    "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
    "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
    "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
    "District of Columbia": "DC", "Common Core State Standards": "CCSS",
  };
  return stateMap[stateName] || stateName.substring(0, 2).toUpperCase();
}

function getStandardsName(stateName: string): string {
  const namesMap: Record<string, string> = {
    "Texas": "TEKS",
    "California": "CCSS",
    "Florida": "B.E.S.T.",
    "New York": "NYSLS",
    "Common Core State Standards": "CCSS",
    "Next Generation Science Standards": "NGSS",
  };
  return namesMap[stateName] || `${stateName} Standards`;
}

export async function fetchCSPJurisdictions(): Promise<CSPJurisdiction[]> {
  try {
    const response = await fetch(`${CSP_API_BASE}/jurisdictions`);
    if (!response.ok) {
      throw new Error(`CSP API error: ${response.status}`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Failed to fetch CSP jurisdictions:", error);
    throw error;
  }
}

export async function fetchCSPStandardSet(standardSetId: string): Promise<CSPStandardSet | null> {
  try {
    const response = await fetch(`${CSP_API_BASE}/standard_sets/${standardSetId}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`CSP API error: ${response.status}`);
    }
    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error(`Failed to fetch CSP standard set ${standardSetId}:`, error);
    throw error;
  }
}

export async function fetchCSPStandardSetsForJurisdiction(jurisdictionExternalId: string): Promise<{ id: string; title: string; subject: string }[]> {
  try {
    const response = await fetch(`${CSP_API_BASE}/jurisdictions/${jurisdictionExternalId}`);
    if (!response.ok) {
      throw new Error(`CSP API error: ${response.status}`);
    }
    const data = await response.json();
    const standardSets = data.data?.standardSets || [];
    return standardSets.map((s: any) => ({
      id: s.id,
      title: s.title,
      subject: s.subject || "General",
    }));
  } catch (error) {
    console.error(`Failed to fetch CSP standard sets for jurisdiction ${jurisdictionExternalId}:`, error);
    throw error;
  }
}

export async function syncJurisdictionsFromCSP(triggeredBy?: string): Promise<{
  newCount: number;
  updatedCount: number;
  totalProcessed: number;
  syncLogId: string;
}> {
  const syncLog = await storage.createSyncLog({
    source: "csp",
    status: "started",
    triggeredBy: triggeredBy || "manual",
    totalRecords: 0,
    processedRecords: 0,
    newRecords: 0,
    updatedRecords: 0,
    errorCount: 0,
    errorMessages: [],
  });

  let newCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  const errorMessages: string[] = [];

  try {
    const jurisdictions = await fetchCSPJurisdictions();
    
    await storage.updateSyncLog(syncLog.id, {
      status: "in_progress",
      totalRecords: jurisdictions.length,
    });

    for (const cspJurisdiction of jurisdictions) {
      try {
        const abbreviation = mapStateAbbreviation(cspJurisdiction.title);
        const existing = await storage.getJurisdictionByAbbr("United States", abbreviation);
        
        if (existing) {
          await storage.updateJurisdiction(existing.id, {
            externalId: cspJurisdiction.id,
            lastSyncedAt: new Date(),
          });
          updatedCount++;
        } else {
          await storage.createJurisdiction({
            externalId: cspJurisdiction.id,
            country: "United States",
            name: cspJurisdiction.title,
            abbreviation,
            standardsName: getStandardsName(cspJurisdiction.title),
            source: "csp",
            sourceUrl: `${CSP_API_BASE}/jurisdictions/${cspJurisdiction.id}`,
            lastSyncedAt: new Date(),
          });
          newCount++;
        }
      } catch (err) {
        errorCount++;
        errorMessages.push(`Failed to process jurisdiction ${cspJurisdiction.title}: ${err}`);
      }
    }

    await storage.updateSyncLog(syncLog.id, {
      status: "completed",
      processedRecords: jurisdictions.length,
      newRecords: newCount,
      updatedRecords: updatedCount,
      errorCount,
      errorMessages,
      completedAt: new Date(),
    });

    return {
      newCount,
      updatedCount,
      totalProcessed: jurisdictions.length,
      syncLogId: syncLog.id,
    };
  } catch (error) {
    await storage.updateSyncLog(syncLog.id, {
      status: "failed",
      errorCount: 1,
      errorMessages: [`Sync failed: ${error}`],
      completedAt: new Date(),
    });
    throw error;
  }
}

export async function syncStandardSetFromCSP(
  externalSetId: string,
  jurisdictionId: string,
  triggeredBy?: string
): Promise<{
  standardSetId: string;
  newStandards: number;
  updatedStandards: number;
  syncLogId: string;
}> {
  const syncLog = await storage.createSyncLog({
    source: "csp",
    jurisdictionId,
    status: "started",
    triggeredBy: triggeredBy || "manual",
    totalRecords: 0,
    processedRecords: 0,
    newRecords: 0,
    updatedRecords: 0,
    errorCount: 0,
    errorMessages: [],
  });

  try {
    const cspData = await fetchCSPStandardSet(externalSetId);
    if (!cspData) {
      throw new Error(`Standard set ${externalSetId} not found`);
    }

    const jurisdiction = await storage.getJurisdiction(jurisdictionId);
    if (!jurisdiction) {
      throw new Error(`Jurisdiction ${jurisdictionId} not found`);
    }

    const uid = generateUid(
      jurisdiction.country,
      jurisdiction.abbreviation,
      cspData.document?.valid || "current",
      cspData.title,
      cspData.subject
    );

    let standardSet = await storage.getStandardSetByUid(uid);
    let isNewSet = false;

    if (!standardSet) {
      standardSet = await storage.createStandardSet({
        uid,
        externalId: externalSetId,
        jurisdictionId,
        title: cspData.title,
        subject: cspData.subject,
        educationLevels: cspData.educationLevels || [],
        documentTitle: cspData.document?.title,
        documentUrl: cspData.document?.sourceURL,
        documentYear: cspData.document?.valid,
        licenseTitle: cspData.license?.title,
        licenseUrl: cspData.license?.URL,
        source: "csp",
        lastSyncedAt: new Date(),
      });
      isNewSet = true;
    } else {
      await storage.updateStandardSet(standardSet.id, {
        lastSyncedAt: new Date(),
      });
    }

    await storage.updateSyncLog(syncLog.id, {
      standardSetId: standardSet.id,
      status: "in_progress",
    });

    const standards = cspData.standards || {};
    const standardsArray = Object.values(standards);
    
    await storage.updateSyncLog(syncLog.id, {
      totalRecords: standardsArray.length,
    });

    let newStandards = 0;
    let updatedStandards = 0;
    const errorMessages: string[] = [];

    for (const cspStandard of standardsArray) {
      try {
        const standardUid = generateUid(
          uid,
          cspStandard.id,
          cspStandard.statementNotation
        );

        const existing = await storage.getEducationalStandardByUid(standardUid);

        if (existing) {
          if (existing.statement !== cspStandard.description) {
            const versionHistory = existing.versionHistory || [];
            versionHistory.push({
              version: new Date().toISOString(),
              changedAt: new Date().toISOString(),
              previousStatement: existing.statement,
              changeType: "update",
            });

            await storage.updateEducationalStandard(existing.id, {
              statement: cspStandard.description,
              versionHistory,
            });
            updatedStandards++;
          }
        } else {
          await storage.createEducationalStandard({
            uid: standardUid,
            externalId: cspStandard.id,
            asnIdentifier: cspStandard.asnIdentifier,
            standardSetId: standardSet.id,
            humanCoding: cspStandard.statementNotation,
            statementLabel: cspStandard.statementLabel,
            statement: cspStandard.description,
            depth: cspStandard.depth,
            position: cspStandard.position,
            parentId: cspStandard.ancestorIds?.[cspStandard.ancestorIds.length - 1],
            versionHistory: [{
              version: "1.0",
              changedAt: new Date().toISOString(),
              changeType: "create",
            }],
            isActive: true,
            source: "csp",
          });
          newStandards++;
        }
      } catch (err) {
        errorMessages.push(`Failed to process standard ${cspStandard.statementNotation}: ${err}`);
      }
    }

    await storage.updateSyncLog(syncLog.id, {
      status: "completed",
      processedRecords: standardsArray.length,
      newRecords: newStandards + (isNewSet ? 1 : 0),
      updatedRecords: updatedStandards,
      errorCount: errorMessages.length,
      errorMessages,
      completedAt: new Date(),
    });

    return {
      standardSetId: standardSet.id,
      newStandards,
      updatedStandards,
      syncLogId: syncLog.id,
    };
  } catch (error) {
    await storage.updateSyncLog(syncLog.id, {
      status: "failed",
      errorCount: 1,
      errorMessages: [`Sync failed: ${error}`],
      completedAt: new Date(),
    });
    throw error;
  }
}

export async function getSyncStatus(): Promise<{
  lastSync: Date | null;
  totalJurisdictions: number;
  totalStandardSets: number;
  totalStandards: number;
  recentLogs: Array<{
    id: string;
    source: string;
    status: string;
    startedAt: Date | null;
    completedAt: Date | null;
    newRecords: number | null;
    updatedRecords: number | null;
    errorCount: number | null;
  }>;
}> {
  const logs = await storage.getLatestSyncLogs(10);
  const jurisdictions = await storage.getJurisdictions();
  
  let totalStandardSets = 0;
  let totalStandards = 0;

  for (const j of jurisdictions) {
    const sets = await storage.getStandardSets(j.id);
    totalStandardSets += sets.length;
    for (const s of sets) {
      const standards = await storage.getEducationalStandards(s.id);
      totalStandards += standards.length;
    }
  }

  return {
    lastSync: logs.length > 0 ? logs[0].startedAt : null,
    totalJurisdictions: jurisdictions.length,
    totalStandardSets,
    totalStandards,
    recentLogs: logs.map(l => ({
      id: l.id,
      source: l.source,
      status: l.status,
      startedAt: l.startedAt,
      completedAt: l.completedAt,
      newRecords: l.newRecords,
      updatedRecords: l.updatedRecords,
      errorCount: l.errorCount,
    })),
  };
}

export interface FullImportProgress {
  status: "idle" | "syncing_jurisdictions" | "syncing_standard_sets" | "syncing_standards" | "completed" | "failed";
  currentJurisdiction?: string;
  currentStandardSet?: string;
  jurisdictionsTotal: number;
  jurisdictionsProcessed: number;
  standardSetsTotal: number;
  standardSetsProcessed: number;
  standardsTotal: number;
  standardsProcessed: number;
  errors: string[];
  startedAt?: Date;
  completedAt?: Date;
}

let currentImportProgress: FullImportProgress = {
  status: "idle",
  jurisdictionsTotal: 0,
  jurisdictionsProcessed: 0,
  standardSetsTotal: 0,
  standardSetsProcessed: 0,
  standardsTotal: 0,
  standardsProcessed: 0,
  errors: [],
};

export function getImportProgress(): FullImportProgress {
  return { ...currentImportProgress };
}

export async function syncAllStandardsFromCSP(triggeredBy?: string): Promise<{
  syncLogId: string;
  jurisdictionsProcessed: number;
  standardSetsProcessed: number;
  standardsProcessed: number;
  errors: string[];
}> {
  currentImportProgress = {
    status: "syncing_jurisdictions",
    jurisdictionsTotal: 0,
    jurisdictionsProcessed: 0,
    standardSetsTotal: 0,
    standardSetsProcessed: 0,
    standardsTotal: 0,
    standardsProcessed: 0,
    errors: [],
    startedAt: new Date(),
  };

  const syncLog = await storage.createSyncLog({
    source: "csp",
    status: "started",
    triggeredBy: triggeredBy || "full_import",
    totalRecords: 0,
    processedRecords: 0,
    newRecords: 0,
    updatedRecords: 0,
    errorCount: 0,
    errorMessages: [],
  });

  try {
    const cspJurisdictions = await fetchCSPJurisdictions();
    currentImportProgress.jurisdictionsTotal = cspJurisdictions.length;
    
    await storage.updateSyncLog(syncLog.id, {
      status: "in_progress",
      totalRecords: cspJurisdictions.length,
    });

    let totalNewRecords = 0;
    let totalUpdatedRecords = 0;
    let totalStandardSets = 0;
    let totalStandards = 0;

    for (const cspJurisdiction of cspJurisdictions) {
      currentImportProgress.currentJurisdiction = cspJurisdiction.title;
      currentImportProgress.status = "syncing_jurisdictions";

      try {
        const abbreviation = mapStateAbbreviation(cspJurisdiction.title);
        let jurisdiction = await storage.getJurisdictionByAbbr("United States", abbreviation);
        
        if (!jurisdiction) {
          jurisdiction = await storage.createJurisdiction({
            externalId: cspJurisdiction.id,
            country: "United States",
            name: cspJurisdiction.title,
            abbreviation,
            standardsName: getStandardsName(cspJurisdiction.title),
            source: "csp",
            sourceUrl: `${CSP_API_BASE}/jurisdictions/${cspJurisdiction.id}`,
            lastSyncedAt: new Date(),
          });
          totalNewRecords++;
        } else {
          await storage.updateJurisdiction(jurisdiction.id, {
            externalId: cspJurisdiction.id,
            lastSyncedAt: new Date(),
          });
          totalUpdatedRecords++;
        }

        currentImportProgress.status = "syncing_standard_sets";
        const standardSets = await fetchCSPStandardSetsForJurisdiction(cspJurisdiction.id);
        currentImportProgress.standardSetsTotal += standardSets.length;

        for (const setInfo of standardSets) {
          currentImportProgress.currentStandardSet = setInfo.title;
          
          try {
            currentImportProgress.status = "syncing_standards";
            const result = await syncStandardSetFromCSP(setInfo.id, jurisdiction.id, triggeredBy);
            totalStandardSets++;
            totalStandards += result.newStandards + result.updatedStandards;
            currentImportProgress.standardSetsProcessed++;
            currentImportProgress.standardsTotal += result.newStandards + result.updatedStandards;
            currentImportProgress.standardsProcessed += result.newStandards + result.updatedStandards;
          } catch (err) {
            const errorMsg = `Failed to sync standard set ${setInfo.title}: ${err}`;
            currentImportProgress.errors.push(errorMsg);
            console.error(errorMsg);
          }

          await new Promise(resolve => setTimeout(resolve, 100));
        }

        currentImportProgress.jurisdictionsProcessed++;
      } catch (err) {
        const errorMsg = `Failed to process jurisdiction ${cspJurisdiction.title}: ${err}`;
        currentImportProgress.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    currentImportProgress.status = "completed";
    currentImportProgress.completedAt = new Date();

    await storage.updateSyncLog(syncLog.id, {
      status: "completed",
      processedRecords: cspJurisdictions.length,
      newRecords: totalNewRecords,
      updatedRecords: totalUpdatedRecords,
      errorCount: currentImportProgress.errors.length,
      errorMessages: currentImportProgress.errors,
      completedAt: new Date(),
    });

    return {
      syncLogId: syncLog.id,
      jurisdictionsProcessed: currentImportProgress.jurisdictionsProcessed,
      standardSetsProcessed: totalStandardSets,
      standardsProcessed: totalStandards,
      errors: currentImportProgress.errors,
    };
  } catch (error) {
    currentImportProgress.status = "failed";
    currentImportProgress.errors.push(`Full sync failed: ${error}`);
    currentImportProgress.completedAt = new Date();

    await storage.updateSyncLog(syncLog.id, {
      status: "failed",
      errorCount: 1,
      errorMessages: [`Full sync failed: ${error}`],
      completedAt: new Date(),
    });
    throw error;
  }
}
