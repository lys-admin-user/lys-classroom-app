import { db } from "../db";
import { blsSyncLog, type BlsSyncLog, type InsertBlsSyncLog } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { storage } from "../storage";

const BLS_API_BASE = "https://api.bls.gov/publicAPI/v2";
const SYNC_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

interface BlsSeriesData {
  seriesID: string;
  data: Array<{
    year: string;
    period: string;
    periodName: string;
    value: string;
    footnotes: Array<{ code: string; text: string }>;
  }>;
}

interface BlsApiResponse {
  status: string;
  responseTime: number;
  message: string[];
  Results: {
    series: BlsSeriesData[];
  };
}

interface OccupationData {
  socCode: string;
  title: string;
  medianWage: number;
  employment: number;
  projectedGrowth?: number;
  projectedOpenings?: number;
}

const BLS_SOC_SERIES_PREFIX = "OEUM";

const SOC_CODES: Record<string, { title: string; category: string }> = {
  "15-1252": { title: "Software Developer", category: "technology" },
  "15-1211": { title: "Computer Systems Analyst", category: "technology" },
  "15-1299": { title: "Computer Occupations, All Other", category: "technology" },
  "29-1141": { title: "Registered Nurse", category: "healthcare" },
  "29-1215": { title: "Family Medicine Physician", category: "healthcare" },
  "31-1120": { title: "Home Health and Personal Care Aide", category: "healthcare" },
  "11-1021": { title: "General and Operations Manager", category: "business" },
  "13-2011": { title: "Accountant and Auditor", category: "business" },
  "41-3091": { title: "Sales Representative", category: "business" },
  "47-2111": { title: "Electrician", category: "trades" },
  "49-9021": { title: "HVAC Technician", category: "trades" },
  "47-2031": { title: "Carpenter", category: "trades" },
  "27-1024": { title: "Graphic Designer", category: "creative" },
  "27-3023": { title: "News Analyst/Reporter", category: "creative" },
  "25-2021": { title: "Elementary School Teacher", category: "education" },
  "25-2031": { title: "Secondary School Teacher", category: "education" },
  "23-1011": { title: "Lawyer", category: "legal" },
  "23-2011": { title: "Paralegal", category: "legal" },
  "21-1021": { title: "Child, Family, Social Worker", category: "social_services" },
  "21-1014": { title: "Mental Health Counselor", category: "social_services" },
  "15-2051": { title: "AI / Machine Learning Engineer", category: "technology" },
  "15-1241": { title: "Cloud Architect", category: "technology" },
  "15-1255": { title: "UX/UI Designer", category: "creative" },
  "17-3024": { title: "Robotics Technician", category: "technology" },
  "19-2041": { title: "Sustainability Analyst", category: "science" },
  "19-1029": { title: "Biotech Research Associate", category: "science" },
  "53-6051": { title: "Drone Pilot", category: "technology" },
  "11-2021": { title: "Product Manager", category: "business" },
  "49-3023": { title: "EV / Battery Technician", category: "trades" },
  "29-2042": { title: "EMT / Paramedic", category: "public_safety" },
  "33-2011": { title: "Firefighter", category: "public_safety" },
  "47-2152": { title: "Plumber", category: "trades" },
  "51-4121": { title: "Welder", category: "trades" },
  "49-3031": { title: "Diesel Mechanic", category: "trades" },
  "53-3032": { title: "CDL Truck Driver", category: "trades" },
  "31-9092": { title: "Medical Assistant", category: "healthcare" },
  "29-2052": { title: "Pharmacy Technician", category: "healthcare" },
  "29-2061": { title: "Licensed Vocational Nurse", category: "healthcare" },
  "31-1131": { title: "Certified Nursing Assistant", category: "healthcare" },
  "29-1292": { title: "Dental Hygienist", category: "healthcare" },
  "41-9022": { title: "Real Estate Agent", category: "personal_services" },
  "39-5012": { title: "Cosmetologist / Barber", category: "personal_services" },
};

export async function getLastSyncStatus(): Promise<BlsSyncLog | null> {
  const [lastSync] = await db
    .select()
    .from(blsSyncLog)
    .orderBy(desc(blsSyncLog.startedAt))
    .limit(1);
  return lastSync || null;
}

export async function getSyncHistory(limit: number = 10): Promise<BlsSyncLog[]> {
  return db
    .select()
    .from(blsSyncLog)
    .orderBy(desc(blsSyncLog.startedAt))
    .limit(limit);
}

async function createSyncLog(data: InsertBlsSyncLog): Promise<BlsSyncLog> {
  const [log] = await db.insert(blsSyncLog).values(data as any).returning();
  return log;
}

async function updateSyncLog(id: string, updates: Partial<BlsSyncLog>): Promise<void> {
  await db.update(blsSyncLog).set(updates).where(eq(blsSyncLog.id, id));
}

async function fetchBlsWageData(socCodes: string[], stateCode?: string): Promise<Map<string, number>> {
  const wageMap = new Map<string, number>();
  
  const areaCode = stateCode ? getStateAreaCode(stateCode) : "0000000";
  const seriesIds = socCodes.slice(0, 50).map(soc => {
    const cleanSoc = soc.replace("-", "");
    return `OEUM${areaCode}${cleanSoc}000000004`;
  });

  try {
    const response = await fetch(`${BLS_API_BASE}/timeseries/data/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seriesid: seriesIds,
        startyear: new Date().getFullYear() - 1,
        endyear: new Date().getFullYear(),
      }),
    });

    if (!response.ok) {
      console.error("BLS API request failed:", response.status);
      return wageMap;
    }

    const data: BlsApiResponse = await response.json();
    
    if (data.status === "REQUEST_SUCCEEDED" && data.Results?.series) {
      for (const series of data.Results.series) {
        const socMatch = series.seriesID.match(/OEUM\d{7}(\d{6})/);
        if (socMatch && series.data.length > 0) {
          const rawSoc = socMatch[1];
          const formattedSoc = `${rawSoc.slice(0, 2)}-${rawSoc.slice(2)}`;
          const latestValue = parseFloat(series.data[0].value);
          if (!isNaN(latestValue)) {
            wageMap.set(formattedSoc, latestValue * 2080);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error fetching BLS wage data:", error);
  }

  return wageMap;
}

function getStateAreaCode(stateAbbr: string): string {
  const stateCodes: Record<string, string> = {
    "TX": "4800000", "CA": "0600000", "NY": "3600000", "FL": "1200000",
    "WA": "5300000", "VA": "5100000", "AZ": "0400000", "IA": "1900000",
    "OK": "4000000", "IL": "1700000", "PA": "4200000", "OH": "3900000",
    "GA": "1300000", "NC": "3700000", "MI": "2600000", "NJ": "3400000",
    "MA": "2500000", "CO": "0800000", "TN": "4700000", "MD": "2400000",
  };
  return stateCodes[stateAbbr] || "0000000";
}

export async function syncBlsData(triggeredBy: string = "scheduled"): Promise<BlsSyncLog> {
  const syncLog = await createSyncLog({
    syncType: "full",
    status: "started",
    totalOccupations: Object.keys(SOC_CODES).length,
    processedOccupations: 0,
    updatedOccupations: 0,
    newOccupations: 0,
    errorCount: 0,
    dataSource: "bls_api",
    apiVersion: "v2",
    triggeredBy,
    nextScheduledAt: new Date(Date.now() + SYNC_INTERVAL_MS),
  });

  try {
    await updateSyncLog(syncLog.id, { status: "in_progress" });

    const socCodes = Object.keys(SOC_CODES);
    const wageData = await fetchBlsWageData(socCodes);
    
    let processedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    const existingCareers = await storage.getCareers();
    
    for (const [socCode, info] of Object.entries(SOC_CODES)) {
      try {
        processedCount++;
        
        const newWage = wageData.get(socCode);
        if (newWage) {
          const existingCareer = existingCareers.find(c => c.blsCode === socCode);
          if (existingCareer) {
            const wageChanged = Math.abs(existingCareer.salaryMedian - newWage) > 1000;
            if (wageChanged) {
              const updated = await storage.updateCareerFromBls(socCode, {
                salaryMedian: newWage,
                salaryMin: Math.round(newWage * 0.6),
                salaryMax: Math.round(newWage * 1.4),
              });
              if (updated) {
                updatedCount++;
                console.log(`Updated wage for ${info.title}: $${existingCareer.salaryMedian} -> $${newWage}`);
              }
            }
          }
        }

        if (processedCount % 10 === 0) {
          await updateSyncLog(syncLog.id, {
            processedOccupations: processedCount,
            updatedOccupations: updatedCount,
          });
        }
      } catch (err) {
        const errorMsg = `Error processing ${socCode}: ${err instanceof Error ? err.message : "Unknown error"}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    await updateSyncLog(syncLog.id, {
      status: "completed",
      processedOccupations: processedCount,
      updatedOccupations: updatedCount,
      errorCount: errors.length,
      errorMessages: errors.length > 0 ? errors : undefined,
      completedAt: new Date(),
    });

    console.log(`BLS sync completed: ${processedCount} processed, ${updatedCount} updated`);
    
    const [updated] = await db
      .select()
      .from(blsSyncLog)
      .where(eq(blsSyncLog.id, syncLog.id));
    return updated;

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    await updateSyncLog(syncLog.id, {
      status: "failed",
      errorCount: 1,
      errorMessages: [errorMsg],
      completedAt: new Date(),
    });
    
    console.error("BLS sync failed:", errorMsg);
    throw error;
  }
}

let schedulerInterval: NodeJS.Timeout | null = null;

export function startBlsScheduler(): void {
  if (schedulerInterval) {
    console.log("BLS scheduler already running");
    return;
  }

  console.log("Starting BLS data scheduler (weekly sync)");

  checkAndRunSync();

  schedulerInterval = setInterval(async () => {
    await checkAndRunSync();
  }, 60 * 60 * 1000);
}

async function checkAndRunSync(): Promise<void> {
  try {
    const lastSync = await getLastSyncStatus();
    
    if (!lastSync) {
      console.log("No previous BLS sync found, running initial sync...");
      await syncBlsData("scheduled");
      return;
    }

    const now = new Date();
    const lastSyncTime = lastSync.completedAt || lastSync.startedAt;
    
    if (lastSyncTime && now.getTime() - lastSyncTime.getTime() >= SYNC_INTERVAL_MS) {
      console.log("Weekly BLS sync interval reached, syncing...");
      await syncBlsData("scheduled");
    } else if (lastSync.nextScheduledAt && now >= lastSync.nextScheduledAt) {
      console.log("Scheduled BLS sync time reached, syncing...");
      await syncBlsData("scheduled");
    }
  } catch (error) {
    console.error("Error in BLS scheduler check:", error);
  }
}

export function stopBlsScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("BLS scheduler stopped");
  }
}

export function getSchedulerStatus(): { running: boolean; nextCheck: Date | null } {
  return {
    running: schedulerInterval !== null,
    nextCheck: schedulerInterval ? new Date(Date.now() + 60 * 60 * 1000) : null,
  };
}
