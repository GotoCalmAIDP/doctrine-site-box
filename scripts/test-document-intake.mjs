import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import {
  DOCUMENT_MAX_BYTES,
  analyzeDocxArrayBuffer,
  buildRegulatoryReadiness,
  emptyRegulatoryProfile,
  formatFileSize,
  validateDocumentFileDescriptor
} from "../src/assets/screening/document-intake-core.js";

const sources = [
  "01-02_Canonical_Doctrine_Standard_v0.3.docx",
  "02-03_Boundary_Ontology_and_PMM_v0.3.docx",
  "03-04_Applicability_Commit_Enforcement_Standard_v0.3.docx",
  "04-05_Runtime_Applicability_and_Anti_Simulation_Standard_v0.4.docx",
  "05-09_Chat_Intake_Register_Live_v0.2.docx"
].map((name) => `/workspace/scratch/b6d91d763a94/project_sources/${name}`);

const reports = [];
for (const path of sources) {
  const buffer = await readFile(path);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const report = await analyzeDocxArrayBuffer({
    name: basename(path),
    size: buffer.byteLength,
    lastModified: Date.UTC(2026, 8, 22)
  }, arrayBuffer);
  reports.push(report);
  assert.equal(report.file.type, "DOCX");
  assert.equal(report.file.size, buffer.byteLength);
  assert.ok(report.metadata.title.length > 3);
  assert.ok(report.metrics.paragraphs > 10);
  assert.ok(report.axisSuggestions.length >= 5);
  assert.equal(report.retainedContent, "derived-metadata-and-section-locators-only");
  const serialized = JSON.stringify(report);
  assert.ok(!serialized.includes("A system may remain powered"));
  assert.ok(!serialized.includes('"author"'));
  assert.ok(!serialized.includes('"fullText"'));
}

assert.equal(reports[0].suggestions.assessedVersion, "v0.3");
assert.equal(reports[0].axisSuggestions.length, 9);
assert.equal(formatFileSize(45_377), "44 KB");
assert.throws(
  () => validateDocumentFileDescriptor({ name: "evidence.pdf", size: 200 }),
  /document-type-unsupported/
);
assert.throws(
  () => validateDocumentFileDescriptor({ name: "evidence.docx", size: DOCUMENT_MAX_BYTES + 1 }),
  /document-file-too-large/
);

const unresolved = buildRegulatoryReadiness({
  profile: emptyRegulatoryProfile(),
  context: {},
  screening: { consequenceClass: "unknown", lifecycle: "concept" },
  evaluation: { summary: { mapped: 0, open: 17, priorityOpen: 4 } }
});
assert.equal(unresolved.level, 0);
assert.equal(unresolved.urgency, "before-claim");
assert.deepEqual(unresolved.milestones, []);

const reviewReady = buildRegulatoryReadiness({
  profile: {
    jurisdiction: "eu-eea",
    marketRole: "provider",
    ai: "yes",
    digitalProduct: "yes",
    machinery: "yes",
    nis2Entity: "yes",
    confirmed: true
  },
  context: { referenceLabel: "SYSTEM-A", assessedVersion: "v1" },
  screening: { consequenceClass: "critical", lifecycle: "live" },
  evaluation: { summary: { mapped: 17, open: 0, priorityOpen: 0 } },
  documentReport: reports[0]
});
assert.equal(reviewReady.level, 3);
assert.equal(reviewReady.urgency, "now");
assert.ok(reviewReady.milestones.some((item) => item.phase === "current"));
assert.ok(reviewReady.milestones.some((item) => item.phase === "future"));

console.log(`document intake tests passed (${reports.length} DOCX files)`);
