// Barrel for the storage layer.
//
// Historically the entire implementation lived in server/storage.ts.
// It was moved to server/storage/database.ts as part of Task #2 to enable
// per-domain splits over time without breaking imports. Every existing
// `import { storage } from "./storage"` and `import { storage } from "../storage"`
// continues to resolve through this barrel unchanged.
export {
  storage,
  DatabaseStorage,
  type IStorage,
  type EducatorPerformanceMetric,
  type CampusPerformanceMetric,
  type OrganizationPerformanceMetric,
  type SystemWideStats,
  type MatriculationStats,
  type AchievementStats,
} from "./database";
