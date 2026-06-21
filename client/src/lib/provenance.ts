// Provenance markers for downloadable AI-assisted outputs.
//
// We can't cryptographically watermark plain text/CSV/HTML, but we can attach a
// clear, machine-readable provenance note so exported artifacts disclose that
// they were produced with AI assistance via the platform.
import { COMPANY } from "@shared/legal";

export const PROVENANCE_NOTE = `Generated with AI assistance via ${COMPANY.platformLongName} (${COMPANY.platformName}). Review before instructional use.`;

export function provenanceHtmlComment(): string {
  return `<!-- ai-provenance: source=${COMPANY.platformName}; note=${PROVENANCE_NOTE}; exportedAt=${new Date().toISOString()} -->`;
}

export function provenanceCsvHeader(): string {
  return `# ${PROVENANCE_NOTE} Exported ${new Date().toISOString()}`;
}
