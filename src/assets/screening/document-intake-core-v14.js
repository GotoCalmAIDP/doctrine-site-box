export const DOCUMENT_INTAKE_VERSION = "document-intake 0.3.0-alpha";
export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const DOCUMENT_MAX_FILES = 3;
export const DOCUMENT_MAX_XML_BYTES = 16 * 1024 * 1024;
export const DOCUMENT_MAX_TEXT_CHARACTERS = 60000;
export const DOCUMENT_ALLOWED_EXTENSIONS = [".docx", ".txt", ".md"];
export const REGULATORY_HORIZON_AS_OF = "2026-09-22";

const UTF8 = new TextDecoder("utf-8", { fatal: true });
const ZIP_LOCAL_HEADER = 0x04034b50;
const ZIP_CENTRAL_HEADER = 0x02014b50;
const ZIP_END = 0x06054b50;
const MAX_ZIP_ENTRIES = 4096;
const RETAINED_ENTRIES = new Set([
  "word/document.xml",
  "docProps/core.xml",
  "docProps/app.xml"
]);

const AXIS_CUES = {
  scope: ["scope", "applicability", "intended use", "validity", "exclusion", "dependency", "обсяг", "застосовн", "применим", "виключ", "залежн"],
  explanation: ["assumption", "explanation", "uncertainty", "limitation", "semantic", "припущ", "поясн", "невизнач", "обмежен", "семантич"],
  authority: ["authority", "accountable", "human", "mandate", "approval", "повноваж", "відповідаль", "людськ", "мандат", "схвал"],
  commit: ["commit", "execution", "admissibility", "proof obligation", "revocation", "фіксац", "виконан", "допустим", "відклик"],
  evidence: ["evidence", "record", "audit", "proof", "provenance", "receipt", "свідчен", "доказ", "запис", "аудит", "походжен"],
  consequence: ["consequence", "reversibility", "irreversible", "harm", "preservation", "наслід", "зворотн", "незворот", "шкод", "збережен"],
  topology: ["topology", "alternate path", "replica", "agent", "integration", "verification island", "тополог", "альтернативн", "реплік", "агент", "інтеграц"],
  drift: ["change", "update", "drift", "trajectory", "reassessment", "post-market", "зміна", "оновлен", "дрейф", "траєктор", "повторн"],
  runtime: ["runtime", "invariant", "suppression", "verifier", "operational state", "виконання", "інваріант", "пригнічен", "верифікатор", "операційн"]
};

export const DOCUMENT_INTAKE_AXES = Object.freeze(Object.keys(AXIS_CUES));

export const REGULATORY_SOURCES = {
  aiAct: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
  aiActEnforcement: "https://digital-strategy.ec.europa.eu/en/policies/enforcement-ai-act",
  cra: "https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act",
  machinery: "https://eur-lex.europa.eu/eli/reg/2023/1230/oj/eng",
  nis2: "https://digital-strategy.ec.europa.eu/en/policies/nis2-directive"
};

export const REGULATORY_MILESTONES = [
  {
    id: "ai-act-current",
    instrument: "ai-act",
    phase: "current",
    date: "2026-08-02",
    source: REGULATORY_SOURCES.aiAct,
    condition: "ai"
  },
  {
    id: "ai-act-annex-iii",
    instrument: "ai-act",
    phase: "future",
    date: "2027-12-02",
    source: REGULATORY_SOURCES.aiActEnforcement,
    condition: "ai"
  },
  {
    id: "ai-act-product",
    instrument: "ai-act-product",
    phase: "future",
    date: "2028-08-02",
    source: REGULATORY_SOURCES.aiActEnforcement,
    condition: "machinery"
  },
  {
    id: "cra-reporting",
    instrument: "cra",
    phase: "current",
    date: "2026-09-11",
    source: REGULATORY_SOURCES.cra,
    condition: "digitalProduct"
  },
  {
    id: "cra-main",
    instrument: "cra",
    phase: "future",
    date: "2027-12-11",
    source: REGULATORY_SOURCES.cra,
    condition: "digitalProduct"
  },
  {
    id: "machinery-main",
    instrument: "machinery",
    phase: "future",
    date: "2027-01-14",
    source: REGULATORY_SOURCES.machinery,
    condition: "machinery"
  },
  {
    id: "nis2-national",
    instrument: "nis2",
    phase: "current",
    date: "2024-10-17",
    source: REGULATORY_SOURCES.nis2,
    condition: "nis2Entity"
  }
];

export function emptyRegulatoryProfile() {
  return {
    jurisdiction: "unresolved",
    marketRole: "unresolved",
    ai: "unknown",
    digitalProduct: "unknown",
    machinery: "unknown",
    nis2Entity: "unknown",
    confirmed: false
  };
}

export function fileExtension(name) {
  const match = String(name || "").toLowerCase().match(/\.[a-z0-9]+$/);
  return match ? match[0] : "";
}

export function formatFileSize(bytes) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size < 0) return "0 B";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(size < 10 * 1024 ? 1 : 0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateDocumentFileDescriptor(file) {
  if (!file || typeof file !== "object") throw new Error("document-file-missing");
  const name = String(file.name || "");
  const extension = fileExtension(name);
  if (!DOCUMENT_ALLOWED_EXTENSIONS.includes(extension)) throw new Error("document-type-unsupported");
  const size = Number(file.size);
  if (!Number.isFinite(size) || size <= 0) throw new Error("document-file-empty");
  if (size > DOCUMENT_MAX_BYTES) throw new Error("document-file-too-large");
  return { name, extension, size };
}

function readU16(view, offset) {
  if (offset < 0 || offset + 2 > view.byteLength) throw new Error("docx-truncated");
  return view.getUint16(offset, true);
}

function readU32(view, offset) {
  if (offset < 0 || offset + 4 > view.byteLength) throw new Error("docx-truncated");
  return view.getUint32(offset, true);
}

function findZipEnd(view) {
  const start = Math.max(0, view.byteLength - 65557);
  for (let offset = view.byteLength - 22; offset >= start; offset -= 1) {
    if (readU32(view, offset) === ZIP_END && offset + 22 + readU16(view, offset + 20) === view.byteLength) return offset;
  }
  throw new Error("docx-invalid-container");
}

const CRC32_TABLE = Uint32Array.from({ length: 256 }, (_value, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  return value >>> 0;
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ byte) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

function decodeUtf8(bytes, errorCode = "docx-xml-invalid") {
  try {
    return UTF8.decode(bytes);
  } catch {
    throw new Error(errorCode);
  }
}

async function inflateRaw(bytes, expectedBytes) {
  if (typeof DecompressionStream !== "function") throw new Error("docx-decompression-unavailable");
  let decompressor;
  try {
    decompressor = new DecompressionStream("deflate-raw");
  } catch {
    throw new Error("docx-decompression-unavailable");
  }
  const reader = new Blob([bytes]).stream().pipeThrough(decompressor).getReader();
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      length += next.value.byteLength;
      // Enforce both limits while streaming, before allocating the full result.
      if (length > DOCUMENT_MAX_XML_BYTES || length > expectedBytes) {
        await reader.cancel();
        throw new Error("docx-expanded-content-invalid");
      }
      chunks.push(next.value);
    }
  } catch (error) {
    if (error.message === "docx-expanded-content-invalid") throw error;
    throw new Error("docx-expanded-content-invalid");
  } finally {
    reader.releaseLock();
  }
  const output = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

async function readZipEntry(view, bytes, entry) {
  const offset = entry.localOffset;
  if (offset + 30 > entry.centralOffset) throw new Error("docx-invalid-local-entry");
  if (readU32(view, offset) !== ZIP_LOCAL_HEADER) throw new Error("docx-invalid-local-entry");
  const flags = readU16(view, offset + 6);
  if (flags & 0x2041) throw new Error("docx-encrypted-unsupported");
  if (flags !== entry.flags || readU16(view, offset + 8) !== entry.method) throw new Error("docx-invalid-local-entry");
  const nameLength = readU16(view, offset + 26);
  const extraLength = readU16(view, offset + 28);
  const dataOffset = offset + 30 + nameLength + extraLength;
  const dataEnd = dataOffset + entry.compressedSize;
  if (dataOffset > entry.centralOffset || dataEnd > entry.centralOffset) throw new Error("docx-truncated-entry");
  if (decodeUtf8(bytes.subarray(offset + 30, offset + 30 + nameLength)) !== entry.name) throw new Error("docx-invalid-local-entry");
  if (!(flags & 8) && (readU32(view, offset + 14) !== entry.crc || readU32(view, offset + 18) !== entry.compressedSize || readU32(view, offset + 22) !== entry.uncompressedSize)) {
    throw new Error("docx-invalid-local-entry");
  }
  const compressed = bytes.subarray(dataOffset, dataEnd);
  let output;
  if (entry.method === 0) output = compressed;
  else if (entry.method === 8) output = await inflateRaw(compressed, entry.uncompressedSize);
  else throw new Error("docx-compression-unsupported");
  if (output.byteLength > DOCUMENT_MAX_XML_BYTES || output.byteLength !== entry.uncompressedSize) {
    throw new Error("docx-expanded-content-invalid");
  }
  if (crc32(output) !== entry.crc) throw new Error("docx-crc-invalid");
  const xml = decodeUtf8(output);
  validateXml(xml);
  return xml;
}

async function readDocxXml(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  if (bytes.byteLength < 22 || readU32(view, 0) !== ZIP_LOCAL_HEADER) throw new Error("docx-invalid-container");
  const end = findZipEnd(view);
  if (readU16(view, end + 4) !== 0 || readU16(view, end + 6) !== 0 || readU16(view, end + 8) !== readU16(view, end + 10)) throw new Error("docx-central-directory-invalid");
  const entryCount = readU16(view, end + 10);
  const centralSize = readU32(view, end + 12);
  const centralOffset = readU32(view, end + 16);
  if (!entryCount || entryCount > MAX_ZIP_ENTRIES) throw new Error("docx-entry-count-invalid");
  if (centralOffset + centralSize !== end) throw new Error("docx-central-directory-invalid");
  const retained = [];
  const retainedNames = new Set();
  let cursor = centralOffset;
  let macroDetected = false;
  for (let index = 0; index < entryCount; index += 1) {
    if (cursor + 46 > end) throw new Error("docx-central-entry-invalid");
    if (readU32(view, cursor) !== ZIP_CENTRAL_HEADER) throw new Error("docx-central-entry-invalid");
    const flags = readU16(view, cursor + 8);
    const method = readU16(view, cursor + 10);
    const crc = readU32(view, cursor + 16);
    const compressedSize = readU32(view, cursor + 20);
    const uncompressedSize = readU32(view, cursor + 24);
    const nameLength = readU16(view, cursor + 28);
    const extraLength = readU16(view, cursor + 30);
    const commentLength = readU16(view, cursor + 32);
    const localOffset = readU32(view, cursor + 42);
    const nameStart = cursor + 46;
    const nameEnd = nameStart + nameLength;
    if (nameEnd + extraLength + commentLength > end || readU16(view, cursor + 34) !== 0) throw new Error("docx-central-entry-invalid");
    const name = decodeUtf8(bytes.subarray(nameStart, nameEnd));
    if (flags & 0x2041) throw new Error("docx-encrypted-unsupported");
    if (/vbaProject\.bin$/i.test(name)) macroDetected = true;
    if (RETAINED_ENTRIES.has(name)) {
      if (retainedNames.has(name)) throw new Error("docx-duplicate-entry");
      retainedNames.add(name);
      if (uncompressedSize > DOCUMENT_MAX_XML_BYTES) throw new Error("docx-expanded-content-invalid");
      retained.push({ name, flags, crc, method, compressedSize, uncompressedSize, localOffset, centralOffset });
    }
    cursor = nameEnd + extraLength + commentLength;
  }
  if (cursor !== end) throw new Error("docx-central-directory-invalid");
  if (macroDetected) throw new Error("docx-macros-unsupported");
  const byName = new Map();
  for (const entry of retained) byName.set(entry.name, await readZipEntry(view, bytes, entry));
  if (!byName.has("word/document.xml")) throw new Error("docx-document-xml-missing");
  return byName;
}

function validateXml(xml) {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(xml)) throw new Error("docx-xml-invalid");
  for (const entity of xml.matchAll(/&#(x[\da-fA-F]+|\d+);/gu)) {
    const point = entity[1][0] === "x" ? Number.parseInt(entity[1].slice(1), 16) : Number(entity[1]);
    if (![9, 10, 13].includes(point) && !(point >= 0x20 && point <= 0xd7ff) && !(point >= 0xe000 && point <= 0xfffd) && !(point >= 0x10000 && point <= 0x10ffff)) throw new Error("docx-xml-invalid");
  }
  // Browser parsing validates namespace and XML syntax without resolving external entities.
  if (typeof DOMParser === "function") {
    const parsed = new DOMParser().parseFromString(xml, "application/xml");
    if (parsed.getElementsByTagName("parsererror").length) throw new Error("docx-xml-invalid");
    return;
  }
  // Keep local/Node verification useful without adding a parser dependency.
  const stack = [];
  let cursor = 0;
  let roots = 0;
  while (cursor < xml.length) {
    const start = xml.indexOf("<", cursor);
    const text = xml.slice(cursor, start < 0 ? xml.length : start);
    if ((!stack.length && text.trim()) || /&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-fA-F]+);)/u.test(text)) throw new Error("docx-xml-invalid");
    if (start < 0) break;
    if (xml.startsWith("<!--", start) || xml.startsWith("<![CDATA[", start) || xml.startsWith("<?", start)) {
      const [prefix, suffix] = xml.startsWith("<!--", start) ? ["<!--", "-->"] : xml.startsWith("<![CDATA[", start) ? ["<![CDATA[", "]]>"] : ["<?", "?>"];
      const end = xml.indexOf(suffix, start + prefix.length);
      if (end < 0 || (prefix === "<![CDATA[" && !stack.length)) throw new Error("docx-xml-invalid");
      cursor = end + suffix.length;
      continue;
    }
    let quote = "";
    let end = start + 1;
    for (; end < xml.length; end += 1) {
      const character = xml[end];
      if (quote) { if (character === quote) quote = ""; }
      else if (character === '"' || character === "'") quote = character;
      else if (character === ">") break;
      else if (character === "<") throw new Error("docx-xml-invalid");
    }
    if (end === xml.length || quote) throw new Error("docx-xml-invalid");
    const token = xml.slice(start + 1, end);
    const close = token.match(/^\/([\w:.-]+)\s*$/u);
    if (close) {
      if (stack.pop() !== close[1]) throw new Error("docx-xml-invalid");
    } else {
      const open = token.match(/^([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"<]*"|'[^'<]*'))*)\s*(\/?)$/u);
      if (!open || /&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-fA-F]+);)/u.test(open[2])) throw new Error("docx-xml-invalid");
      const attributeNames = [...open[2].matchAll(/([\w:.-]+)\s*=\s*(?:"[^"]*"|'[^']*')/gu)].map((match) => match[1]);
      if (new Set(attributeNames).size !== attributeNames.length) throw new Error("docx-xml-invalid");
      if (!stack.length) roots += 1;
      if (!open[3]) stack.push(open[1]);
    }
    cursor = end + 1;
  }
  if (stack.length || roots !== 1) throw new Error("docx-xml-invalid");
}

function decodeXml(value) {
  return String(value || "")
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#([0-9]+);/g, (_match, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function extractTag(xml, localName) {
  if (!xml) return "";
  const match = xml.match(new RegExp(`<[^>]*:?${localName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/[^>]*:?${localName}>`, "i"));
  return match ? decodeXml(match[1].replace(/<[^>]+>/g, "")).trim() : "";
}

function extractParagraphs(documentXml) {
  const paragraphs = [];
  const blocks = documentXml.match(/<w:p\b[\s\S]*?<\/w:p>/g) || [];
  for (const block of blocks) {
    const styleMatch = block.match(/<w:pStyle\b[^>]*w:val="([^"]+)"/i);
    const style = styleMatch ? decodeXml(styleMatch[1]) : "";
    const pieces = [];
    const tokenRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>|<w:tab\b[^>]*\/>|<w:br\b[^>]*\/>/gi;
    let token;
    while ((token = tokenRegex.exec(block))) {
      if (token[1] !== undefined) pieces.push(decodeXml(token[1]));
      else pieces.push(" ");
    }
    const text = pieces.join("").replace(/\s+/g, " ").trim();
    if (!text) continue;
    paragraphs.push({
      index: paragraphs.length + 1,
      text,
      style,
      heading: /heading|title/i.test(style)
    });
  }
  return paragraphs;
}

function safeNameStem(name) {
  return String(name || "document")
    .replace(/\.[^.]+$/, "")
    .replace(/^\d+[-_]/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160) || "document";
}

function detectVersion(name, text) {
  const source = `${name}\n${text.slice(0, 3000)}`;
  const match = source.match(/(?:\bversion\s*[:—-]?\s*|\bверс(?:ія|ия)\s*[:—-]?\s*)?(v\d+(?:\.\d+){0,3})\b/i);
  return match ? match[1] : "";
}

function countMatches(text, cues) {
  const lower = text.toLowerCase();
  return cues.reduce((count, cue) => count + (lower.includes(cue.toLowerCase()) ? 1 : 0), 0);
}

function nearestHeading(paragraphs, atIndex) {
  for (let index = atIndex; index >= 0; index -= 1) {
    if (paragraphs[index]?.heading) return paragraphs[index].text.slice(0, 180);
  }
  return "";
}

function locatorName(name) {
  return String(name || "document.docx")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "document.docx";
}

function buildAxisSuggestions(paragraphs, name) {
  const suggestions = [];
  for (const [axis, cues] of Object.entries(AXIS_CUES)) {
    const candidates = paragraphs
      .map((paragraph, index) => ({ paragraph, index, score: countMatches(paragraph.text, cues) + (paragraph.heading ? 1 : 0) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.index - b.index);
    const best = candidates[0];
    if (!best) continue;
    const section = nearestHeading(paragraphs, best.index) || best.paragraph.text.slice(0, 180);
    suggestions.push({
      axis,
      matches: candidates.length,
      section,
      paragraph: best.paragraph.index,
      locator: `DOC:${locatorName(name)}#P${best.paragraph.index}`
    });
  }
  return suggestions;
}

function detectSector(text) {
  const maritime = countMatches(text, ["maritime", "vessel", "ship", "dynamic positioning", " dp ", "flag state", "class society", "marine"]);
  const critical = countMatches(text, ["critical infrastructure", "industrial ot", "scada", "actuation", "machinery", "safety-critical"]);
  const enterprise = countMatches(text, ["enterprise", "organization", "workforce", "financial", "customer"]);
  const generalDoctrine = countMatches(text.slice(0, 6000), ["doctrine", "conceptual standard", "ontology", "methodology", "reference model"]);
  if (maritime >= 3) return "maritime";
  if (generalDoctrine < 2 && critical >= 3) return "critical-infrastructure";
  if (generalDoctrine < 2 && enterprise >= 3) return "enterprise";
  return "general";
}

function detectLifecycle(text) {
  const sample = text.slice(0, 5000).toLowerCase();
  if (/\b(live|production deployment|in service|operational deployment)\b/.test(sample)) return "live";
  if (/\b(pilot|limited operation|trial deployment)\b/.test(sample)) return "pilot";
  if (/\b(procurement|pre-deployment|design review)\b/.test(sample)) return "design";
  if (/\b(draft|concept|research|working register)\b/.test(sample)) return "concept";
  return "concept";
}

function triState(hasPositive, hasNegative = false) {
  if (hasPositive) return "yes";
  if (hasNegative) return "no";
  return "unknown";
}

function detectRegulatoryProfile(text) {
  const lower = ` ${text.toLowerCase()} `;
  const european = /(regulation \(eu\)|european union|eur-lex|\beu ai act\b|\bnis2\b|cyber resilience act)/.test(lower);
  const provider = countMatches(lower, ["provider", "manufacturer", "placing on the market"]);
  const operator = countMatches(lower, ["deployer", "operator", "operation"]);
  const integrator = countMatches(lower, ["integrator", "component", "integration"]);
  const advisory = countMatches(lower, ["doctrine", "standard", "research", "advisory"]);
  let marketRole = "unresolved";
  const roleScores = [["provider", provider], ["operator", operator], ["integrator", integrator], ["advisory", advisory]].sort((a, b) => b[1] - a[1]);
  if (roleScores[0][1] > 0 && roleScores[0][1] > roleScores[1][1]) marketRole = roleScores[0][0];
  return {
    jurisdiction: european ? "eu-eea" : "unresolved",
    marketRole,
    ai: triState(/\bartificial intelligence\b|\bai-enabled\b|\bai system\b/.test(lower)),
    digitalProduct: triState(/product with digital elements|\bsoftware\b|\bfirmware\b|connected hardware/.test(lower)),
    machinery: triState(/\bmachinery\b|\bmachine\b|\bactuator\b|industrial equipment/.test(lower)),
    nis2Entity: triState(/\bnis2\b|essential entity|important entity|critical infrastructure/.test(lower)),
    confirmed: false
  };
}

function parseAppMetrics(appXml, paragraphs) {
  const number = (tag) => {
    const value = Number.parseInt(extractTag(appXml, tag), 10);
    return Number.isFinite(value) && value >= 0 ? value : 0;
  };
  const computedWords = paragraphs.reduce((count, paragraph) => count + (paragraph.text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length, 0);
  return {
    pages: number("Pages"),
    words: number("Words") || computedWords,
    paragraphs: paragraphs.length,
    headings: paragraphs.filter((paragraph) => paragraph.heading).length,
    tables: number("Tables")
  };
}

export async function analyzeDocxArrayBuffer(file, arrayBuffer) {
  const descriptor = validateDocumentFileDescriptor(file);
  if (!(arrayBuffer instanceof ArrayBuffer) || arrayBuffer.byteLength !== descriptor.size) {
    throw new Error("document-buffer-invalid");
  }
  let xml = new Map();
  let paragraphs;
  if (descriptor.extension === ".docx") {
    xml = await readDocxXml(arrayBuffer);
    paragraphs = extractParagraphs(xml.get("word/document.xml"));
  } else {
    const text = decodeUtf8(new Uint8Array(arrayBuffer), "document-text-invalid");
    if (text.includes("\u0000")) throw new Error("document-text-invalid");
    if (text.length > DOCUMENT_MAX_TEXT_CHARACTERS) throw new Error("document-text-too-long");
    paragraphs = text.split(/\r\n|\n|\r/u).map((line) => {
      const heading = descriptor.extension === ".md" && /^(?:#{1,6})\s+\S/u.test(line);
      return { text: (heading ? line.replace(/^#{1,6}\s+/u, "") : line).trim(), style: heading ? "Heading" : "", heading };
    }).filter((paragraph) => paragraph.text).map((paragraph, index) => ({ ...paragraph, index: index + 1 }));
  }
  if (!paragraphs.length) throw new Error("docx-no-readable-text");
  const fullText = paragraphs.map((paragraph) => paragraph.text).join("\n");
  const core = xml.get("docProps/core.xml") || "";
  const styledTitle = paragraphs.find((paragraph) => /title/i.test(paragraph.style))?.text || "";
  const title = (extractTag(core, "title") || styledTitle || safeNameStem(descriptor.name))
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  const sectorContext = detectSector(fullText);
  const sectorNames = {
    general: "document evidence intake",
    enterprise: "enterprise document review",
    maritime: "maritime / DP document review",
    "critical-infrastructure": "critical-systems document review"
  };
  const regulatoryProfile = detectRegulatoryProfile(fullText);
  const report = {
    version: DOCUMENT_INTAKE_VERSION,
    file: {
      name: descriptor.name,
      type: descriptor.extension.slice(1).toUpperCase(),
      extension: descriptor.extension,
      size: descriptor.size,
      sizeLabel: formatFileSize(descriptor.size),
      lastModified: Number.isFinite(Number(file.lastModified)) ? new Date(Number(file.lastModified)).toISOString() : ""
    },
    metrics: parseAppMetrics(xml.get("docProps/app.xml") || "", paragraphs),
    metadata: {
      title,
      created: extractTag(core, "created"),
      modified: extractTag(core, "modified")
    },
    suggestions: {
      referenceLabel: title,
      assessedVersion: detectVersion(descriptor.name, fullText),
      contextLabel: sectorNames[sectorContext],
      sectorContext,
      lifecycle: detectLifecycle(fullText),
      regulatoryProfile
    },
    axisSuggestions: buildAxisSuggestions(paragraphs, descriptor.name),
    retainedContent: "derived-metadata-and-section-locators-only"
  };
  return report;
}

function retainedReports(reports) {
  return (Array.isArray(reports) ? reports : [])
    .filter((report) => report?.retainedContent === "derived-metadata-and-section-locators-only")
    .slice(0, DOCUMENT_MAX_FILES);
}

export function selectBestAxisSuggestions(reports) {
  const best = new Map();
  retainedReports(reports).forEach((report, documentIndex) => {
    for (const suggestion of report.axisSuggestions || []) {
      if (!DOCUMENT_INTAKE_AXES.includes(suggestion.axis)) continue;
      const candidate = {
        ...suggestion,
        sourceFile: report.file?.name || "document.docx",
        documentIndex
      };
      const current = best.get(suggestion.axis);
      if (!current || Number(candidate.matches || 0) > Number(current.matches || 0)) {
        best.set(suggestion.axis, candidate);
      }
    }
  });
  return DOCUMENT_INTAKE_AXES.map((axis) => best.get(axis)).filter(Boolean);
}

export function buildDocumentIntakeAssessment({ reports, context, screening, profile } = {}) {
  const retained = retainedReports(reports);
  const coveredAxes = selectBestAxisSuggestions(retained).map((item) => item.axis);
  const missingAxes = DOCUMENT_INTAKE_AXES.filter((axis) => !coveredAxes.includes(axis));
  const gaps = [];
  const consequence = String(screening?.consequenceClass || "unknown");
  const referenceLabel = String(context?.referenceLabel || "").trim();
  const assessedVersion = String(context?.assessedVersion || "").trim();
  const contextLabel = String(context?.contextLabel || "").trim();
  const jurisdiction = String(profile?.jurisdiction || "unresolved");
  const marketRole = String(profile?.marketRole || "unresolved");

  if (!retained.length) gaps.push("document");
  if (consequence === "unknown") gaps.push("consequence");
  if (!referenceLabel) gaps.push("object");
  if (!assessedVersion) gaps.push("version");
  if (!contextLabel) gaps.push("context");
  if (jurisdiction === "unresolved") gaps.push("jurisdiction");
  if (marketRole === "unresolved") gaps.push("market-role");
  if (!profile?.confirmed) gaps.push("confirmation");
  if (missingAxes.length) gaps.push("missing-axes");
  gaps.push("evidence-review");

  let status = "empty";
  if (retained.length) {
    const coreContextReady = consequence !== "unknown" && referenceLabel && assessedVersion && contextLabel;
    if (!coreContextReady || coveredAxes.length < 4) status = "insufficient";
    else if (coveredAxes.length >= 7) status = "bounded";
    else status = "partial";
  }

  const questionKeys = gaps.filter((gap) => [
    "consequence",
    "object",
    "version",
    "context",
    "jurisdiction",
    "market-role",
    "confirmation"
  ].includes(gap));

  return {
    status,
    fileCount: retained.length,
    coveredAxes,
    missingAxes,
    coveragePercent: Math.round((coveredAxes.length / DOCUMENT_INTAKE_AXES.length) * 100),
    gaps,
    questionKeys,
    canAddDocument: retained.length < DOCUMENT_MAX_FILES,
    boundary: "structure-only-not-evidence"
  };
}

function conditionState(profile, condition) {
  return profile?.[condition] || "unknown";
}

export function buildRegulatoryReadiness({ profile, context, screening, evaluation, documentReport = null }) {
  const resolved = { ...emptyRegulatoryProfile(), ...(profile || {}) };
  const gaps = [];
  if (resolved.jurisdiction === "unresolved") gaps.push("jurisdiction");
  if (resolved.marketRole === "unresolved") gaps.push("market-role");
  if (!String(context?.referenceLabel || "").trim()) gaps.push("object");
  if (!String(context?.assessedVersion || "").trim()) gaps.push("version");
  if (!resolved.confirmed) gaps.push("confirmation");

  const mapped = Number(evaluation?.summary?.mapped || 0);
  const open = Number(evaluation?.summary?.open || 0);
  const priorityOpen = Number(evaluation?.summary?.priorityOpen || 0);
  let level = 0;
  if (resolved.jurisdiction !== "unresolved" && resolved.marketRole !== "unresolved") level = 1;
  if (level >= 1 && !gaps.includes("object") && !gaps.includes("version") && documentReport) level = 2;
  if (level >= 2 && open === 0 && priorityOpen === 0 && mapped > 0 && resolved.confirmed) level = 3;

  let urgency = "before-claim";
  if (["high", "critical"].includes(screening?.consequenceClass) || screening?.lifecycle === "live") urgency = "now";
  else if (screening?.lifecycle === "pilot") urgency = "before-next-test";
  else if (screening?.lifecycle === "design") urgency = "before-deployment";

  const milestones = resolved.jurisdiction === "eu-eea"
    ? REGULATORY_MILESTONES
      .map((item) => ({ ...item, applicability: conditionState(resolved, item.condition) }))
      .filter((item) => item.applicability !== "no")
    : [];

  return {
    asOf: REGULATORY_HORIZON_AS_OF,
    level,
    gaps,
    urgency,
    milestones,
    profile: resolved,
    counts: { mapped, open, priorityOpen },
    boundary: "orientation-only-not-a-legal-determination"
  };
}
