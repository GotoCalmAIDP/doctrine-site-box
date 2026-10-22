import assert from "node:assert/strict";
import { deflateRawSync } from "node:zlib";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  DOCUMENT_ALLOWED_EXTENSIONS,
  DOCUMENT_INTAKE_VERSION,
  DOCUMENT_MAX_BYTES,
  DOCUMENT_MAX_FILES,
  DOCUMENT_MAX_TEXT_CHARACTERS,
  DOCUMENT_MAX_XML_BYTES,
  analyzeDocxArrayBuffer
} from "../src/assets/screening/document-intake-core-v14.js";

// Fixture CRC uses the standard polynomial; the known vector prevents matching
// an accidentally identical implementation error in the application.
function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
  }
  return (value ^ 0xffffffff) >>> 0;
}
assert.equal(crc32(Buffer.from("123456789")), 0xcbf43926);

function zip(entries) {
  const parts = [], central = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name), raw = Buffer.from(entry.raw);
    const method = entry.method ?? 0, flags = entry.flags ?? 0;
    const compressed = method === 8 ? deflateRawSync(raw) : raw;
    const crc = entry.crc ?? crc32(raw), expanded = entry.expanded ?? raw.length;
    const local = Buffer.alloc(30), directory = Buffer.alloc(46);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4);
    local.writeUInt16LE(flags, 6); local.writeUInt16LE(method, 8);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(expanded, 22); local.writeUInt16LE(name.length, 26);
    directory.writeUInt32LE(0x02014b50, 0); directory.writeUInt16LE(20, 4); directory.writeUInt16LE(20, 6);
    directory.writeUInt16LE(flags, 8); directory.writeUInt16LE(method, 10);
    directory.writeUInt32LE(crc, 16); directory.writeUInt32LE(compressed.length, 20);
    directory.writeUInt32LE(expanded, 24); directory.writeUInt16LE(name.length, 28);
    directory.writeUInt32LE(offset, 42);
    parts.push(local, name, compressed); central.push(directory, name);
    offset += local.length + name.length + compressed.length;
  }
  const end = Buffer.alloc(22), centralBytes = Buffer.concat(central);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBytes.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, centralBytes, end]);
}
const xml = `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Scope applicability authority accountable evidence record runtime verifier.</w:t></w:r></w:p></w:body></w:document>`;
const file = (name, buffer) => ({ name, size: buffer.length, lastModified: 0 });
const analyze = (buffer, name = "fixture.docx") => analyzeDocxArrayBuffer(file(name, buffer), buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
const entry = (options = {}) => ({ name: "word/document.xml", raw: xml, ...options });

const valid = zip([
  entry(),
  { name: "docProps/core.xml", raw: '<cp:coreProperties xmlns:cp="x" xmlns:dc="y" xmlns:dcterms="z"><dc:title>Preserved Title</dc:title><dcterms:created>2026-10-22</dcterms:created></cp:coreProperties>' },
  { name: "docProps/app.xml", raw: "<Properties><Pages>7</Pages><Words>50</Words><Tables>2</Tables></Properties>" }
]);
const report = await analyze(valid);
assert.equal(report.metadata.title, "Preserved Title");
assert.equal(report.metadata.created, "2026-10-22");
assert.equal(report.metrics.pages, 7);
assert.equal(report.metrics.tables, 2);
assert.equal(report.retainedContent, "derived-metadata-and-section-locators-only");
assert.equal(report.file.type, "DOCX");
assert.equal(report.version, DOCUMENT_INTAKE_VERSION);
assert.ok(report.axisSuggestions.some((suggestion) => suggestion.axis === "authority"));
assert.equal((await analyze(zip([entry({ method: 8 })]))).file.type, "DOCX");

await assert.rejects(analyze(zip([entry({ crc: 1 })])), /docx-crc-invalid/);
await assert.rejects(analyze(zip([entry({ flags: 1 })])), /docx-encrypted-unsupported/);
await assert.rejects(analyze(zip([entry(), entry()])), /docx-duplicate-entry/);
await assert.rejects(analyze(zip([entry(), { name: "vbaProject.bin", raw: "macro" }])), /docx-macros-unsupported/);
await assert.rejects(analyze(zip([entry({ method: 12 })])), /docx-compression-unsupported/);
await assert.rejects(analyze(zip([entry({ expanded: DOCUMENT_MAX_XML_BYTES + 1 })])), /docx-expanded-content-invalid/);
// A small advertised size must be enforced while inflating larger real output.
await assert.rejects(analyze(zip([entry({ method: 8, raw: xml.repeat(5000), expanded: 128 })])), /docx-expanded-content-invalid/);

const localMismatch = Buffer.from(valid);
localMismatch.writeUInt16LE(8, 8);
await assert.rejects(analyze(localMismatch), /docx-invalid-local-entry/);
const localNameMismatch = Buffer.from(valid);
localNameMismatch[30] = "X".charCodeAt(0);
await assert.rejects(analyze(localNameMismatch), /docx-invalid-local-entry/);
await assert.rejects(analyze(valid.subarray(0, valid.length - 1)), /docx-invalid-container|docx-truncated/);

await assert.rejects(analyze(zip([entry({ raw: Buffer.from([0xc3, 0x28]) })])), /docx-xml-invalid/);
await assert.rejects(analyze(zip([entry({ raw: '<!DOCTYPE w:document [<!ENTITY x "expanded">]>' + xml })])), /docx-xml-invalid/);
await assert.rejects(analyze(zip([entry({ raw: xml.replace("</w:body>", "</w:wrong>") })])), /docx-xml-invalid/);
await assert.rejects(analyze(zip([entry({ raw: xml.replace("Scope", "&#0;") })])), /docx-xml-invalid/);

const text = Buffer.from("Scope v2.1\nApplicability boundary and authority need evidence.\n" + "x".repeat(300) + "RAW_SENTINEL_NOT_RETAINED");
const textReport = await analyze(text, "notes_v2.1.txt");
assert.equal(textReport.file.type, "TXT");
assert.equal(textReport.suggestions.assessedVersion, "v2.1");
assert.equal(textReport.metrics.paragraphs, 3);
assert.equal(textReport.retainedContent, "derived-metadata-and-section-locators-only");
assert.ok(!JSON.stringify(textReport).includes("RAW_SENTINEL_NOT_RETAINED"));
assert.ok(!Object.hasOwn(textReport, "text"));
const markdown = await analyze(Buffer.from("# Scope\nApplicability authority evidence record.\n## Runtime\nRuntime verifier invariant."), "brief.md");
assert.equal(markdown.file.type, "MD");
assert.equal(markdown.metrics.headings, 2);
await assert.rejects(analyze(Buffer.from([0xc3, 0x28]), "bad.txt"), /document-text-invalid/);
await assert.rejects(analyze(Buffer.from("safe\u0000unsafe"), "bad.md"), /document-text-invalid/);
await assert.rejects(analyze(Buffer.from("x".repeat(DOCUMENT_MAX_TEXT_CHARACTERS + 1)), "large.txt"), /document-text-too-long/);
await assert.rejects(analyze(Buffer.from("   \n"), "empty.txt"), /docx-no-readable-text/);
await assert.rejects(analyze(Buffer.from("pdf"), "evidence.pdf"), /document-type-unsupported/);
// Do not narrow the established DOCX extraction limit to the new TXT/MD limit.
const longDocx = zip([entry({ raw: xml.replace("Scope", "x".repeat(60001)) })]);
assert.equal((await analyze(longDocx)).file.type, "DOCX");
assert.equal(DOCUMENT_MAX_BYTES, 10 * 1024 * 1024);
assert.equal(DOCUMENT_MAX_FILES, 3);
assert.deepEqual(DOCUMENT_ALLOWED_EXTENSIONS, [".docx", ".txt", ".md"]);

let calibrationCount = 0;
// Captured from the pinned f82c696 public parser before modification. Excludes
// only the intake version label; verifies rich metadata and suggestions survive.
const calibrationOracles = {
  "01-02_Canonical_Doctrine_Standard_v0.3.docx": "c89c0c2122aaa9d4bc6c355628a8b7d074cdf26ad51475bf62428115fe5a7205",
  "02-03_Boundary_Ontology_and_PMM_v0.3.docx": "5606a6df827e6a40ae3d0ae63e315ff037563f4f954be85e51cdadb4191335e6",
  "03-04_Applicability_Commit_Enforcement_Standard_v0.3.docx": "06cf1a21df1cb53bb3e2df4f8e740deaf9f7092dd7f3c3f897ae23daab20bdab",
  "04-05_Runtime_Applicability_and_Anti_Simulation_Standard_v0.4.docx": "88bdaa552a83b6e861f02bc5b3174c9b022f4919230f6b9031603234caf402d8",
  "05-09_Chat_Intake_Register_Live_v0.2.docx": "4eba4eaaa8fcd7374825749c3b7ca4d955cf3ff8680fa20cbcfc1d46fd302aa9"
};
for (const [name, expectedHash] of Object.entries(calibrationOracles)) {
  let bytes;
  try {
    bytes = await readFile(new URL(`../../project_sources/${name}`, import.meta.url));
  } catch (error) {
    if (error.code === "ENOENT") continue;
    throw error;
  }
  const calibration = await analyze(bytes, name);
  assert.ok(calibration.metrics.paragraphs > 2);
  assert.ok(calibration.axisSuggestions.length >= 5);
  const normalized = { ...calibration };
  delete normalized.version;
  assert.equal(createHash("sha256").update(JSON.stringify(normalized)).digest("hex"), expectedHash);
  calibrationCount += 1;
}
console.log(`v14 intake hardening passed: CRC/limits/corruption/TXT/MD/metadata + ${calibrationCount} real DOCX calibrations`);
