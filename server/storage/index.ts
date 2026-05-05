// Barrel for the storage layer. Composed from per-domain modules.
//
// History: this file used to re-export from a monolithic server/storage.ts
// (then briefly server/storage/database.ts). It now imports the per-domain
// modules for their side effects (each one augments DatabaseStorage.prototype
// via Object.assign), then exports the same `storage` instance everyone
// already imports as `{ storage } from "./storage"`.
import { DatabaseStorage } from "./_base";
import "./admin";
import "./org";
import "./student";
import "./curriculum";
import "./parent";
import "./lessons";
import "./classroom";
import "./careers";
import "./integrations";
import "./portfolio";
import "./marketplace";
import "./collaboration";
import "./payments";
import "./account";
import "./analytics";
import "./misc";
import "./lessonAi";

export {
  DatabaseStorage,
  type IStorage,
  type EducatorPerformanceMetric,
  type CampusPerformanceMetric,
  type OrganizationPerformanceMetric,
  type SystemWideStats,
  type MatriculationStats,
  type AchievementStats,
} from "./_base";

export const storage = new DatabaseStorage();
