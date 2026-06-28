#!/usr/bin/env node
/**
 * Standalone dependency-audit gate.
 *
 * Runs `npm audit --json` and fails (exit 1) when high or critical advisories
 * are present, EXCEPT for an explicit allow-list of advisories that either
 * require a major upgrade of the pre-configured build/ORM toolchain (vite,
 * esbuild, drizzle-kit, drizzle-orm) or have no upstream fix and are confined
 * to offline dev tooling (xlsx — used only by scripts/ingest-bls-careers.ts to
 * regenerate the career catalog; never imported by the server runtime / request
 * path). Those are tracked as accepted residual risks and must be revisited
 * during a dedicated upgrade pass.
 *
 * Usage: node scripts/audit-deps.mjs
 *
 * Kept as a standalone runner (not a package.json script) so it can be wired
 * into CI / the Replit validation check without touching package.json scripts.
 */
import { execSync } from "node:child_process";

// Package names whose remaining high/critical advisories are knowingly deferred
// because the only fix is a major bump of pre-configured tooling.
const ALLOWED = new Set(["vite", "esbuild", "drizzle-kit", "drizzle-orm", "@esbuild-kit/core-utils", "@esbuild-kit/esm-loader", "xlsx"]);

let raw = "";
try {
  raw = execSync("npm audit --json", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
} catch (e) {
  // npm audit exits non-zero when vulnerabilities exist; the JSON is still on stdout.
  raw = e.stdout?.toString() || "";
}

if (!raw) {
  console.error("audit-deps: could not read npm audit output");
  process.exit(2);
}

const report = JSON.parse(raw);
const vulns = report.vulnerabilities || {};

const blocking = [];
const deferred = [];
for (const v of Object.values(vulns)) {
  if (v.severity !== "high" && v.severity !== "critical") continue;
  (ALLOWED.has(v.name) ? deferred : blocking).push(v);
}

const meta = report.metadata?.vulnerabilities || {};
console.log(
  `audit-deps: total=${meta.total ?? "?"} critical=${meta.critical ?? 0} high=${meta.high ?? 0} moderate=${meta.moderate ?? 0} low=${meta.low ?? 0}`,
);

if (deferred.length) {
  console.log("\nDeferred (accepted residual risk — needs major upgrade):");
  for (const v of deferred) console.log(`  - ${v.name} (${v.severity})`);
}

if (blocking.length) {
  console.error("\nBLOCKING high/critical advisories (not allow-listed):");
  for (const v of blocking) console.error(`  - ${v.name} (${v.severity}): ${v.range}`);
  console.error("\nRun `npm audit fix` or add to the allow-list with justification.");
  process.exit(1);
}

console.log("\naudit-deps: OK — no blocking high/critical advisories.");
process.exit(0);
