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

function storedZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const [name, value] of Object.entries(entries)) {
    const nameBytes = Buffer.from(name);
    const data = Buffer.from(value);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    localParts.push(local, nameBytes, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, nameBytes);
    offset += local.length + nameBytes.length + data.length;
  }
  const centralSize = centralParts.reduce((size, part) => size + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(entries).length, 8);
  end.writeUInt16LE(Object.keys(entries).length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, ...centralParts, end]);
}

const fixtureXml = `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>Portable Doctrine Fixture v0.3</w:t></w:r></w:p>
<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Scope and applicability</w:t></w:r></w:p>
<w:p><w:r><w:t>Scope applicability limitation assumption uncertainty authority accountable human mandate commit execution admissibility evidence record audit consequence reversibility harm topology alternate path integration change update drift reassessment runtime invariant verifier.</w:t></w:r></w:p>
</w:body></w:document>`;
const fixture = storedZip({
  "word/document.xml": fixtureXml,
  "docProps/core.xml": `<cp:coreProperties xmlns:cp="x" xmlns:dc="y"><dc:title>Portable Doctrine Fixture</dc:title></cp:coreProperties>`,
  "docProps/app.xml": `<Properties><Pages>1</Pages><Words>34</Words><Tables>0</Tables></Properties>`
});
const fixtureBuffer = fixture.buffer.slice(fixture.byteOffset, fixture.byteOffset + fixture.byteLength);
const reports = [await analyzeDocxArrayBuffer({
  name: "Portable_Doctrine_Fixture_v0.3.docx",
  size: fixture.byteLength,
  lastModified: Date.UTC(2026, 8, 22)
}, fixtureBuffer)];

let corpusCount = 0;
for (const path of sources) {
  let buffer;
  try {
    buffer = await readFile(path);
  } catch (error) {
    if (error.code === "ENOENT") continue;
    throw error;
  }
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const report = await analyzeDocxArrayBuffer({
    name: basename(path),
    size: buffer.byteLength,
    lastModified: Date.UTC(2026, 8, 22)
  }, arrayBuffer);
  reports.push(report);
  corpusCount += 1;
}

for (const report of reports) {
  assert.equal(report.file.type, "DOCX");
  assert.ok(report.file.size > 0);
  assert.ok(report.metadata.title.length > 3);
  assert.ok(report.metrics.paragraphs > 2);
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

console.log(`document intake tests passed (portable fixture + ${corpusCount} calibration DOCX files)`);
