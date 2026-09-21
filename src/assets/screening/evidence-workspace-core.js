import { AXES, CONSEQUENCE_CLASSES, QUESTIONS, SECTOR_CONTEXTS, normalizeConsequenceClass } from "./screening-core.js";

export const EVIDENCE_WORKSPACE_VERSION = "evidence-readiness-workspace 0.2.0-alpha";
export const EVIDENCE_WORKSPACE_SCHEMA = "goto-calm:evidence-readiness-workspace:0.2";
export const LEGACY_EVIDENCE_WORKSPACE_SCHEMA = "goto-calm:evidence-readiness-workspace:0.1";

const MAX_CONTEXT_LENGTH = 160;
const MAX_LOCATOR_LENGTH = 320;
const SOURCE_ANSWERS = new Set(["3", "2", "1", "0", "unknown", "out"]);
const CONSEQUENCE_CLASS_VALUES = new Set(CONSEQUENCE_CLASSES);
const SECTOR_CONTEXT_VALUES = new Set(SECTOR_CONTEXTS);
const LIFECYCLE_CONTEXTS = new Set(["concept", "design", "pilot", "live"]);
const SCREENING_OUTCOMES = new Set(["indeterminate", "review", "no-escalation"]);

export const EVIDENCE_CLASSES = [
  { value: "unclassified", en: "Not classified", ua: "Не класифіковано" },
  { value: "declarative", en: "Declarative", ua: "Декларативне" },
  { value: "observational", en: "Observational", ua: "Спостережне" },
  { value: "documentary", en: "Documentary", ua: "Документальне" },
  { value: "independent", en: "Independent corroboration", ua: "Незалежне підтвердження" }
];

export const EVIDENCE_STATUSES = [
  { value: "documented", en: "Documented record identified", ua: "Задокументований запис визначено" },
  { value: "partial", en: "Partial or informal basis", ua: "Часткова або неформальна підстава" },
  { value: "missing", en: "No record identified", ua: "Запис не визначено" },
  { value: "unknown", en: "Unknown", ua: "Невідомо" },
  { value: "excluded", en: "Outside stated scope", ua: "Поза заявленим обсягом" }
];

export const FRESHNESS_STATES = [
  { value: "current", en: "Current for the stated context", ua: "Актуальне для заявленого контексту" },
  { value: "stale", en: "Not recently checked", ua: "Давно не перевірялося" },
  { value: "unknown", en: "Freshness unknown", ua: "Актуальність невідома" },
  { value: "not-applicable", en: "Not applicable", ua: "Не застосовується" }
];

export const CONFLICT_STATES = [
  { value: "no", en: "No known conflict", ua: "Відомого конфлікту немає" },
  { value: "yes", en: "Conflict identified", ua: "Конфлікт виявлено" },
  { value: "unknown", en: "Conflict status unknown", ua: "Стан конфлікту невідомий" },
  { value: "not-applicable", en: "Not applicable", ua: "Не застосовується" }
];

const VALID = {
  evidenceClass: new Set(EVIDENCE_CLASSES.map((item) => item.value)),
  evidenceStatus: new Set(EVIDENCE_STATUSES.map((item) => item.value)),
  freshness: new Set(FRESHNESS_STATES.map((item) => item.value)),
  conflict: new Set(CONFLICT_STATES.map((item) => item.value))
};

const SCREENING_TO_STATUS = {
  "3": "documented",
  "2": "documented",
  "1": "partial",
  "0": "missing",
  unknown: "unknown",
  out: "excluded"
};

const SCREENING_TO_FRESHNESS = {
  "3": "current",
  "2": "stale",
  "1": "unknown",
  "0": "unknown",
  unknown: "unknown",
  out: "not-applicable"
};

function assertOption(field, value) {
  if (!VALID[field].has(value)) {
    throw new Error(`Invalid ${field}: ${value}`);
  }
}

function boundedString(value, maxLength, field) {
  if (typeof value !== "string") throw new Error(`Invalid ${field}`);
  if (value.length > maxLength) throw new Error(`${field} is too long`);
  return value;
}

export function createEvidenceRows(screeningAnswers = {}) {
  return QUESTIONS.map((question) => {
    const sourceAnswer = String(screeningAnswers[question.id] ?? "unknown");
    const evidenceStatus = SCREENING_TO_STATUS[sourceAnswer] || "unknown";
    const excluded = evidenceStatus === "excluded";
    return {
      questionId: question.id,
      axis: question.axis,
      critical: Boolean(question.critical),
      sourceAnswer,
      evidenceStatus,
      evidenceClass: "unclassified",
      recordLocator: "",
      freshness: SCREENING_TO_FRESHNESS[sourceAnswer] || "unknown",
      conflict: excluded ? "not-applicable" : "unknown"
    };
  });
}

function actionsFor(row) {
  if (row.evidenceStatus === "excluded") return ["confirm-scope-boundary"];
  const actions = [];
  if (row.evidenceStatus === "unknown") actions.push("identify-record-status");
  if (row.evidenceStatus === "missing") actions.push("locate-or-create-record");
  if (row.evidenceStatus === "partial") actions.push("complete-record-basis");
  if (row.evidenceClass === "unclassified") actions.push("classify-evidence");
  if (!row.recordLocator.trim()) actions.push("add-record-locator");
  if (row.freshness === "stale") actions.push("recheck-currentness");
  if (row.freshness === "unknown") actions.push("establish-currentness");
  if (row.conflict === "yes") actions.push("resolve-evidence-conflict");
  if (row.conflict === "unknown") actions.push("check-for-conflict");
  return actions;
}

export function evaluateEvidenceReadiness(rows) {
  if (!Array.isArray(rows) || rows.length !== QUESTIONS.length) {
    throw new Error(`Expected ${QUESTIONS.length} evidence rows`);
  }

  const expectedIds = new Set(QUESTIONS.map((question) => question.id));
  const seen = new Set();
  const evaluatedRows = rows.map((row) => {
    if (!expectedIds.has(row.questionId) || seen.has(row.questionId)) {
      throw new Error(`Unexpected or duplicate questionId: ${row.questionId}`);
    }
    seen.add(row.questionId);
    assertOption("evidenceStatus", row.evidenceStatus);
    assertOption("evidenceClass", row.evidenceClass);
    assertOption("freshness", row.freshness);
    assertOption("conflict", row.conflict);

    const excluded = row.evidenceStatus === "excluded";
    const mapped = !excluded &&
      row.evidenceStatus === "documented" &&
      row.evidenceClass !== "unclassified" &&
      Boolean(row.recordLocator.trim()) &&
      row.freshness === "current" &&
      row.conflict === "no";
    const actions = actionsFor(row);
    return {
      ...row,
      state: excluded ? "excluded" : mapped ? "mapped" : "open",
      actions
    };
  });

  const summary = evaluatedRows.reduce((counts, row) => {
    counts[row.state] += 1;
    if (row.state === "open" && row.critical) counts.priorityOpen += 1;
    return counts;
  }, { mapped: 0, open: 0, excluded: 0, priorityOpen: 0 });

  const byAxis = AXES.map((axis) => {
    const axisRows = evaluatedRows.filter((row) => row.axis === axis.id);
    return {
      ...axis,
      mapped: axisRows.filter((row) => row.state === "mapped").length,
      open: axisRows.filter((row) => row.state === "open").length,
      excluded: axisRows.filter((row) => row.state === "excluded").length
    };
  });

  return {
    summary,
    byAxis,
    rows: evaluatedRows,
    openActions: evaluatedRows
      .filter((row) => row.state !== "mapped")
      .map((row) => ({
        questionId: row.questionId,
        axis: row.axis,
        priority: row.state === "open" && row.critical,
        state: row.state,
        actions: row.actions
      }))
  };
}

export function buildEvidenceWorkspaceExport({ language, context, screening, rows, generatedAt = new Date().toISOString() }) {
  if (!new Set(["en", "ua"]).has(language)) throw new Error(`Unsupported language: ${language}`);
  const evaluation = evaluateEvidenceReadiness(rows);
  return {
    schema: EVIDENCE_WORKSPACE_SCHEMA,
    version: EVIDENCE_WORKSPACE_VERSION,
    generatedAt,
    language,
    status: "self-reported local working record",
    context: {
      referenceLabel: String(context.referenceLabel || ""),
      assessedVersion: String(context.assessedVersion || ""),
      assessmentDate: String(context.assessmentDate || ""),
      contextLabel: String(context.contextLabel || "")
    },
    screening: {
      consequenceClass: normalizeConsequenceClass(screening.consequenceClass ?? screening.materialConsequence),
      sectorContext: SECTOR_CONTEXT_VALUES.has(screening.sectorContext) ? screening.sectorContext : "general",
      lifecycle: screening.lifecycle || "concept",
      outcome: screening.outcome || "indeterminate",
      screeningVersion: screening.version || "unknown",
      evidenceReviewed: false
    },
    summary: evaluation.summary,
    evidenceRecords: evaluation.rows.map((row) => ({
      questionId: row.questionId,
      axis: row.axis,
      sourceAnswer: row.sourceAnswer,
      evidenceStatus: row.evidenceStatus,
      evidenceClass: row.evidenceClass,
      recordLocator: row.recordLocator,
      freshness: row.freshness,
      conflict: row.conflict,
      mappingState: row.state,
      openActions: row.actions
    })),
    limitations: [
      "This record is self-reported and no evidence was independently reviewed.",
      "Mapped records are not proof of applicability, admissibility, safety, compliance or conformance.",
      "This record cannot authorize execution, continuation, restoration or certification.",
      "The export contains record locators and user-entered labels; it should not contain raw evidence or confidential data."
    ]
  };
}

export function parseEvidenceWorkspaceImport(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Snapshot must be a JSON object");
  }
  const legacySchema = payload.schema === LEGACY_EVIDENCE_WORKSPACE_SCHEMA;
  if (payload.schema !== EVIDENCE_WORKSPACE_SCHEMA && !legacySchema) {
    throw new Error(`Unsupported snapshot schema: ${String(payload.schema || "missing")}`);
  }
  if (!new Set(["en", "ua"]).has(payload.language)) {
    throw new Error(`Unsupported language: ${String(payload.language || "missing")}`);
  }
  if (!payload.context || typeof payload.context !== "object") {
    throw new Error("Snapshot context is missing");
  }
  if (!payload.screening || typeof payload.screening !== "object") {
    throw new Error("Snapshot screening record is missing");
  }
  if (!Array.isArray(payload.evidenceRecords) || payload.evidenceRecords.length !== QUESTIONS.length) {
    throw new Error(`Expected ${QUESTIONS.length} evidence records`);
  }

  const records = new Map();
  for (const record of payload.evidenceRecords) {
    if (!record || typeof record !== "object" || typeof record.questionId !== "string") {
      throw new Error("Invalid evidence record");
    }
    if (records.has(record.questionId)) {
      throw new Error(`Duplicate questionId: ${record.questionId}`);
    }
    records.set(record.questionId, record);
  }

  const rows = QUESTIONS.map((question) => {
    const record = records.get(question.id);
    if (!record) throw new Error(`Missing evidence record: ${question.id}`);
    const sourceAnswer = String(record.sourceAnswer ?? "unknown");
    if (!SOURCE_ANSWERS.has(sourceAnswer)) {
      throw new Error(`Invalid sourceAnswer: ${sourceAnswer}`);
    }
    assertOption("evidenceStatus", record.evidenceStatus);
    assertOption("evidenceClass", record.evidenceClass);
    assertOption("freshness", record.freshness);
    assertOption("conflict", record.conflict);
    return {
      questionId: question.id,
      axis: question.axis,
      critical: Boolean(question.critical),
      sourceAnswer,
      evidenceStatus: record.evidenceStatus,
      evidenceClass: record.evidenceClass,
      recordLocator: boundedString(record.recordLocator ?? "", MAX_LOCATOR_LENGTH, "recordLocator"),
      freshness: record.freshness,
      conflict: record.conflict
    };
  });

  evaluateEvidenceReadiness(rows);
  const rawConsequenceClass = String(payload.screening.consequenceClass ?? payload.screening.materialConsequence ?? "unknown");
  const consequenceClass = legacySchema
    ? normalizeConsequenceClass(payload.screening.materialConsequence)
    : rawConsequenceClass;
  const sectorContext = legacySchema ? "general" : String(payload.screening.sectorContext ?? "general");
  const lifecycle = String(payload.screening.lifecycle ?? "concept");
  const outcome = String(payload.screening.outcome ?? "indeterminate");
  if (!CONSEQUENCE_CLASS_VALUES.has(consequenceClass)) throw new Error(`Invalid consequenceClass: ${consequenceClass}`);
  if (!SECTOR_CONTEXT_VALUES.has(sectorContext)) throw new Error(`Invalid sectorContext: ${sectorContext}`);
  if (!LIFECYCLE_CONTEXTS.has(lifecycle)) throw new Error(`Invalid lifecycle: ${lifecycle}`);
  if (!SCREENING_OUTCOMES.has(outcome)) throw new Error(`Invalid screening outcome: ${outcome}`);

  const assessmentDate = boundedString(payload.context.assessmentDate ?? "", 10, "assessmentDate");
  if (assessmentDate && !/^\d{4}-\d{2}-\d{2}$/.test(assessmentDate)) {
    throw new Error("Invalid assessmentDate");
  }

  return {
    context: {
      referenceLabel: boundedString(payload.context.referenceLabel ?? "", MAX_CONTEXT_LENGTH, "referenceLabel"),
      assessedVersion: boundedString(payload.context.assessedVersion ?? "", MAX_CONTEXT_LENGTH, "assessedVersion"),
      assessmentDate,
      contextLabel: boundedString(payload.context.contextLabel ?? "", MAX_CONTEXT_LENGTH, "contextLabel")
    },
    screening: {
      consequenceClass,
      sectorContext,
      lifecycle,
      outcome,
      version: boundedString(payload.screening.screeningVersion ?? "unknown", MAX_CONTEXT_LENGTH, "screeningVersion")
    },
    rows,
    importedFrom: {
      generatedAt: typeof payload.generatedAt === "string" ? payload.generatedAt : "",
      language: payload.language,
      version: typeof payload.version === "string" ? payload.version : ""
    }
  };
}
