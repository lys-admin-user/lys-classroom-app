#!/usr/bin/env node
// Regenerates server/reference/lys/embedded.ts from the .txt files in the
// same directory. The version field is a sha256-12 of the concatenated source
// so any text change invalidates the lesson-prompt cache automatically.
//
// Run: node scripts/regen_lys_embedded.mjs

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const DIR = "server/reference/lys";

const files = readdirSync(DIR)
  .filter((f) => f.endsWith(".txt"))
  .sort();

if (files.length === 0) {
  console.error(`No .txt files found in ${DIR}`);
  process.exit(1);
}

const contents = files.map((f) => readFileSync(join(DIR, f), "utf8"));
const concat = contents.join("");
const hash = createHash("sha256").update(concat).digest("hex").slice(0, 12);

const toExportName = (filename) =>
  filename.replace(/\.txt$/, "").toUpperCase();

const lines = [
  "// AUTO-GENERATED from server/reference/lys/*.txt — do not edit by hand.",
  "// To regenerate: node scripts/regen_lys_embedded.mjs",
  `// Version (sha256-12 of concatenated source): ${hash}`,
  "",
  `export const LYS_REF_VERSION = ${JSON.stringify(hash)};`,
  "",
];

for (let i = 0; i < files.length; i++) {
  const name = toExportName(files[i]);
  lines.push(`export const ${name} = ${JSON.stringify(contents[i])};`);
  lines.push("");
}

writeFileSync(join(DIR, "embedded.ts"), lines.join("\n"));
console.log(
  `Wrote ${DIR}/embedded.ts — version ${hash}, ${files.length} files:`
);
for (const f of files) console.log(`  - ${f} → ${toExportName(f)}`);
