import { AXES, CONSEQUENCE_CLASSES, QUESTIONS, RESPONSE_BASES, SECTOR_CONTEXTS, normalizeConsequenceClass } from "./screening-core.js";
import {
  MARITIME_BRIDGE_SCHEMA,
  MARITIME_BRIDGE_VERSION,
  MARITIME_LOCI,
  MARITIME_QUESTIONS,
  MARITIME_RELATIONS,
  evaluateMaritimeBridge
} from "./maritime-core.js";

export const EVIDENCE_WORKSPACE_VERSION = "evidence-readiness-workspace 0.5.0-alpha";
export const EVIDENCE_WORKSPACE_SCHEMA = "goto-calm:evidence-readiness-workspace:0.4";
export const LEGACY_EVIDENCE_WORKSPACE_SCHEMA = "goto-calm:evidence-readiness-workspace:0.1";
export const PREVIOUS_EVIDENCE_WORKSPACE_SCHEMA = "goto-calm:evidence-readiness-workspace:0.2";
export const PREVIOUS_COMBINED_EVIDENCE_WORKSPACE_SCHEMA = "goto-calm:evidence-readiness-workspace:0.3";

const MAX_CONTEXT_LENGTH = 160;
const MAX_LOCATOR_LENGTH = 320;
const SOURCE_ANSWERS = new Set(["3", "2", "1", "0", "unknown", "out"]);
const CONSEQUENCE_CLASS_VALUES = new Set(CONSEQUENCE_CLASSES);
const SECTOR_CONTEXT_VALUES = new Set(SECTOR_CONTEXTS);
const RESPONSE_BASIS_VALUES = new Set(RESPONSE_BASES);
const LIFECYCLE_CONTEXTS = new Set(["concept", "design", "pilot", "live"]);
const SCREENING_OUTCOMES = new Set(["exploratory", "indeterminate", "review", "no-escalation"]);
const MARITIME_RELATION_VALUES = new Set(MARITIME_RELATIONS.map((item) => item.value));
const MARITIME_LOCUS_VALUES = new Set(MARITIME_LOCI.map((item) => item.value));
const MARITIME_ROUTES = new Set(["exploratory", "scope-first", "tier1-sector", "tier2", "tier3"]);

export const MARITIME_EVIDENCE_AXES = [
  { id: "mode", en: "Mode boundary", ua: "Межа режиму" },
  { id: "control", en: "Control locus", ua: "Locus керування" },
  { id: "authority", en: "Authority reachability", ua: "Досяжність повноважень" },
  { id: "commit", en: "Commit topology", ua: "Топологія commit-шляхів" },
  { id: "transition", en: "Transition and handover", ua: "Перехід і handover" },
  { id: "preservation", en: "Fallback and preservation", ua: "Fallback і збереження" },
  { id: "runtime", en: "Runtime verification", ua: "Runtime-перевірка" },
  { id: "external", en: "External standing", ua: "Зовнішній статус" }
];

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

function createRows(questions, answers = {}) {
  return questions.map((question) => {
    const sourceAnswer = String(answers[question.id] ?? "unknown");
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

export function createEvidenceRows(screeningAnswers = {}) {
  return createRows(QUESTIONS, screeningAnswers);
}

export function createMaritimeEvidenceRows(maritimeAnswers = {}) {
  return createRows(MARITIME_QUESTIONS, maritimeAnswers);
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

function evaluateRows(rows, questions, axes) {
  if (!Array.isArray(rows) || rows.length !== questions.length) {
    throw new Error(`Expected ${questions.length} evidence rows`);
  }

  const expectedIds = new Set(questions.map((question) => question.id));
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

  const byAxis = axes.map((axis) => {
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

export function evaluateEvidenceReadiness(rows) {
  return evaluateRows(rows, QUESTIONS, AXES);
}

export function evaluateMaritimeEvidenceReadiness(rows) {
  return evaluateRows(rows, MARITIME_QUESTIONS, MARITIME_EVIDENCE_AXES);
}

export function evaluateCombinedEvidenceReadiness({ rows, maritime = null }) {
  const core = evaluateEvidenceReadiness(rows);
  const sector = maritime ? evaluateMaritimeEvidenceReadiness(maritime.rows) : null;
  const summary = {
    mapped: core.summary.mapped + (sector?.summary.mapped || 0),
    open: core.summary.open + (sector?.summary.open || 0),
    excluded: core.summary.excluded + (sector?.summary.excluded || 0),
    priorityOpen: core.summary.priorityOpen + (sector?.summary.priorityOpen || 0)
  };
  const openActions = [
    ...core.openActions.map((item) => ({ ...item, packageType: "core" })),
    ...(sector?.openActions || []).map((item) => ({ ...item, packageType: "maritime-dp" }))
  ];
  return { summary, core, sector, openActions };
}

export function createMaritimeEvidencePackage(result) {
  if (!result || result.version !== MARITIME_BRIDGE_VERSION) {
    throw new Error("Invalid maritime bridge result");
  }
  const verified = evaluateMaritimeBridge({
    consequenceClass: result.consequenceClass,
    responseBasis: result.responseBasis,
    relation: result.relation,
    locus: result.locus,
    answers: result.answers
  });
  if (verified.route !== result.route) throw new Error("Maritime route does not match the answer set");
  return {
    packageType: "maritime-dp",
    bridgeVersion: result.version,
    route: result.route,
    operationalRelation: result.relation,
    controlLocus: result.locus,
    rows: createMaritimeEvidenceRows(result.answers)
  };
}

function validateMaritimePackage(maritime, screening) {
  if (!maritime || typeof maritime !== "object" || Array.isArray(maritime)) {
    throw new Error("Invalid Maritime / DP evidence package");
  }
  if (maritime.packageType !== "maritime-dp") throw new Error("Invalid sector package type");
  if (!MARITIME_RELATION_VALUES.has(maritime.operationalRelation)) {
    throw new Error(`Invalid maritime relation: ${String(maritime.operationalRelation)}`);
  }
  if (!MARITIME_LOCUS_VALUES.has(maritime.controlLocus)) {
    throw new Error(`Invalid maritime locus: ${String(maritime.controlLocus)}`);
  }
  if (!MARITIME_ROUTES.has(maritime.route)) throw new Error(`Invalid maritime route: ${String(maritime.route)}`);
  const evaluation = evaluateMaritimeEvidenceReadiness(maritime.rows);
  const answers = Object.fromEntries(maritime.rows.map((row) => [row.questionId, row.sourceAnswer]));
  const verified = evaluateMaritimeBridge({
    consequenceClass: screening.consequenceClass,
    responseBasis: screening.responseBasis,
    relation: maritime.operationalRelation,
    locus: maritime.controlLocus,
    answers
  });
  if (verified.route !== maritime.route) throw new Error("Maritime route does not match the workspace answer set");
  return evaluation;
}

export function buildEvidenceReviewBrief({ context, screening, rows, maritime = null }) {
  if (maritime) validateMaritimePackage(maritime, screening);
  const evaluation = evaluateCombinedEvidenceReadiness({ rows, maritime });
  const contextGaps = ["referenceLabel", "assessedVersion", "assessmentDate", "contextLabel"]
    .filter((field) => !String(context?.[field] || "").trim());
  const exploratory = screening?.responseBasis === "exploratory" || screening?.outcome === "exploratory";
  const missingSectorPackage = screening?.sectorContext === "maritime" && !maritime;

  let status = "mapping-complete";
  if (exploratory) status = "training-only";
  else if (contextGaps.length) status = "context-required";
  else if (missingSectorPackage) status = "sector-package-required";
  else if (evaluation.summary.priorityOpen) status = "priority-open";
  else if (evaluation.summary.open) status = "mapping-open";

  const nextActions = [];
  if (exploratory) nextActions.push("rerun-substantive");
  if (contextGaps.length) nextActions.push("complete-context");
  if (missingSectorPackage) nextActions.push("add-maritime-package");
  if (evaluation.summary.priorityOpen) nextActions.push("resolve-priority-records");
  if (evaluation.summary.open) nextActions.push("complete-open-records");
  nextActions.push("independent-review");

  return {
    status,
    exploratory,
    missingSectorPackage,
    contextGaps,
    summary: evaluation.summary,
    priorityItems: evaluation.openActions.filter((item) => item.priority).slice(0, 3),
    nextActions: [...new Set(nextActions)].slice(0, 3)
  };
}

function serializeEvidenceRows(rows) {
  return rows.map((row) => ({
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
  }));
}

export function buildEvidenceWorkspaceExport({ language, context, screening, rows, maritime = null, generatedAt = new Date().toISOString() }) {
  if (!new Set(["en", "ua"]).has(language)) throw new Error(`Unsupported language: ${language}`);
  const evaluation = evaluateCombinedEvidenceReadiness({ rows, maritime });
  if (maritime && screening.sectorContext !== "maritime") {
    throw new Error("Maritime package requires the maritime sector context");
  }
  if (maritime) validateMaritimePackage(maritime, screening);
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
      responseBasis: RESPONSE_BASIS_VALUES.has(screening.responseBasis) ? screening.responseBasis : "mixed",
      outcome: screening.outcome || "indeterminate",
      screeningVersion: screening.version || "unknown",
      evidenceReviewed: false
    },
    summary: {
      ...evaluation.summary,
      core: evaluation.core.summary,
      maritimeDp: evaluation.sector?.summary || null
    },
    evidenceRecords: serializeEvidenceRows(evaluation.core.rows),
    sectorPackages: maritime ? [{
      packageType: "maritime-dp",
      bridgeVersion: maritime.bridgeVersion || MARITIME_BRIDGE_VERSION,
      route: maritime.route,
      operationalRelation: maritime.operationalRelation,
      controlLocus: maritime.controlLocus,
      summary: evaluation.sector.summary,
      evidenceRecords: serializeEvidenceRows(evaluation.sector.rows)
    }] : [],
    limitations: [
      "This record is self-reported and no evidence was independently reviewed.",
      "Mapped records are not proof of applicability, admissibility, safety, compliance or conformance.",
      "This record cannot authorize execution, continuation, restoration or certification.",
      "The export contains record locators and user-entered labels; it should not contain raw evidence or confidential data.",
      "A Maritime / DP package is not a DP class, FMEA, proving-trials, ASOG, CAMO, TAM, flag, class, engineering or safety-case conclusion."
    ]
  };
}

function parseEvidenceRows(recordsPayload, questions) {
  if (!Array.isArray(recordsPayload) || recordsPayload.length !== questions.length) {
    throw new Error(`Expected ${questions.length} evidence records`);
  }
  const records = new Map();
  for (const record of recordsPayload) {
    if (!record || typeof record !== "object" || typeof record.questionId !== "string") {
      throw new Error("Invalid evidence record");
    }
    if (records.has(record.questionId)) throw new Error(`Duplicate questionId: ${record.questionId}`);
    records.set(record.questionId, record);
  }
  return questions.map((question) => {
    const record = records.get(question.id);
    if (!record) throw new Error(`Missing evidence record: ${question.id}`);
    const sourceAnswer = String(record.sourceAnswer ?? "unknown");
    if (!SOURCE_ANSWERS.has(sourceAnswer)) throw new Error(`Invalid sourceAnswer: ${sourceAnswer}`);
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
}

function outcomeForMaritimeRoute(route) {
  if (route === "exploratory") return "exploratory";
  if (route === "scope-first") return "indeterminate";
  if (route === "tier1-sector") return "no-escalation";
  return "review";
}

export function parseMaritimeBridgeImport(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Snapshot must be a JSON object");
  if (payload.schema !== MARITIME_BRIDGE_SCHEMA) throw new Error(`Unsupported maritime schema: ${String(payload.schema || "missing")}`);
  if (!new Set(["en", "ua"]).has(payload.language)) throw new Error(`Unsupported language: ${String(payload.language || "missing")}`);
  if (!payload.context || typeof payload.context !== "object") throw new Error("Maritime context is missing");
  if (!payload.result || typeof payload.result !== "object") throw new Error("Maritime result is missing");
  if (!Array.isArray(payload.answers) || payload.answers.length !== MARITIME_QUESTIONS.length) {
    throw new Error(`Expected ${MARITIME_QUESTIONS.length} maritime answers`);
  }
  const answers = {};
  for (const item of payload.answers) {
    if (!item || typeof item.questionId !== "string" || answers[item.questionId] !== undefined) {
      throw new Error("Invalid or duplicate maritime answer");
    }
    const value = String(item.value ?? "unknown");
    if (!SOURCE_ANSWERS.has(value)) throw new Error(`Invalid maritime answer: ${value}`);
    answers[item.questionId] = value;
  }
  for (const question of MARITIME_QUESTIONS) {
    if (answers[question.id] === undefined) throw new Error(`Missing maritime answer: ${question.id}`);
  }
  const lifecycle = String(payload.context.lifecycle ?? "concept");
  if (!LIFECYCLE_CONTEXTS.has(lifecycle)) throw new Error(`Invalid lifecycle: ${lifecycle}`);
  const result = evaluateMaritimeBridge({
    consequenceClass: String(payload.context.consequenceClass ?? "unknown"),
    responseBasis: String(payload.context.responseBasis ?? "mixed"),
    relation: String(payload.context.operationalRelation ?? "unresolved"),
    locus: String(payload.context.controlLocus ?? "unresolved"),
    answers
  });
  if (payload.result.route !== result.route) throw new Error("Maritime route does not match the imported answers");
  for (const field of ["priorityGapCount", "unknownCount", "outOfScopeCount"]) {
    if (Number(payload.result[field]) !== result[field]) throw new Error(`Maritime ${field} does not match the imported answers`);
  }
  return {
    context: {
      referenceLabel: "",
      assessedVersion: "",
      assessmentDate: "",
      contextLabel: ""
    },
    screening: {
      consequenceClass: result.consequenceClass,
      sectorContext: "maritime",
      lifecycle,
      responseBasis: result.responseBasis,
      outcome: outcomeForMaritimeRoute(result.route),
      version: "maritime bridge import"
    },
    rows: createEvidenceRows(),
    maritime: createMaritimeEvidencePackage(result),
    importedFrom: {
      generatedAt: typeof payload.generatedAt === "string" ? payload.generatedAt : "",
      language: payload.language,
      version: typeof payload.version === "string" ? payload.version : ""
    }
  };
}

export function mergeMaritimeBridgeIntoWorkspace(workspace, imported) {
  if (!workspace?.screening || !Array.isArray(workspace.rows)) throw new Error("Workspace is not initialized");
  if (!imported?.maritime || !imported?.screening) throw new Error("Maritime import is missing");
  if (workspace.screening.sectorContext !== "maritime") throw new Error("The current workspace is not scoped to Maritime / DP");
  for (const field of ["consequenceClass", "lifecycle", "responseBasis"]) {
    if (workspace.screening[field] !== imported.screening[field]) {
      throw new Error(`Maritime import conflicts with workspace ${field}`);
    }
  }
  validateMaritimePackage(imported.maritime, workspace.screening);
  return { ...workspace, maritime: imported.maritime };
}

export function parseEvidenceWorkspaceImport(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Snapshot must be a JSON object");
  }
  const legacySchema = payload.schema === LEGACY_EVIDENCE_WORKSPACE_SCHEMA;
  const previousSchema = payload.schema === PREVIOUS_EVIDENCE_WORKSPACE_SCHEMA;
  const previousCombinedSchema = payload.schema === PREVIOUS_COMBINED_EVIDENCE_WORKSPACE_SCHEMA;
  if (payload.schema !== EVIDENCE_WORKSPACE_SCHEMA && !legacySchema && !previousSchema && !previousCombinedSchema) {
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
  const rows = parseEvidenceRows(payload.evidenceRecords, QUESTIONS);

  evaluateEvidenceReadiness(rows);
  const rawConsequenceClass = String(payload.screening.consequenceClass ?? payload.screening.materialConsequence ?? "unknown");
  const consequenceClass = legacySchema
    ? normalizeConsequenceClass(payload.screening.materialConsequence)
    : rawConsequenceClass;
  const sectorContext = legacySchema ? "general" : String(payload.screening.sectorContext ?? "general");
  const responseBasis = String(payload.screening.responseBasis ?? "mixed");
  const lifecycle = String(payload.screening.lifecycle ?? "concept");
  const outcome = String(payload.screening.outcome ?? "indeterminate");
  if (!CONSEQUENCE_CLASS_VALUES.has(consequenceClass)) throw new Error(`Invalid consequenceClass: ${consequenceClass}`);
  if (!SECTOR_CONTEXT_VALUES.has(sectorContext)) throw new Error(`Invalid sectorContext: ${sectorContext}`);
  if (!RESPONSE_BASIS_VALUES.has(responseBasis)) throw new Error(`Invalid responseBasis: ${responseBasis}`);
  if (!LIFECYCLE_CONTEXTS.has(lifecycle)) throw new Error(`Invalid lifecycle: ${lifecycle}`);
  if (!SCREENING_OUTCOMES.has(outcome)) throw new Error(`Invalid screening outcome: ${outcome}`);
  const resolvedOutcome = responseBasis === "exploratory"
    ? "exploratory"
    : responseBasis === "mixed"
      ? "indeterminate"
      : outcome;

  const assessmentDate = boundedString(payload.context.assessmentDate ?? "", 10, "assessmentDate");
  if (assessmentDate && !/^\d{4}-\d{2}-\d{2}$/.test(assessmentDate)) {
    throw new Error("Invalid assessmentDate");
  }

  let maritime = null;
  const sectorPackages = payload.schema === EVIDENCE_WORKSPACE_SCHEMA ? (payload.sectorPackages ?? []) : [];
  if (!Array.isArray(sectorPackages)) throw new Error("sectorPackages must be an array");
  if (sectorPackages.length > 1) throw new Error("Only one sector package is supported");
  if (sectorPackages.length === 1) {
    const sectorPackage = sectorPackages[0];
    if (!sectorPackage || sectorPackage.packageType !== "maritime-dp") throw new Error("Unsupported sector package");
    if (sectorContext !== "maritime") throw new Error("Maritime package requires the maritime sector context");
    const maritimeRows = parseEvidenceRows(sectorPackage.evidenceRecords, MARITIME_QUESTIONS);
    maritime = {
      packageType: "maritime-dp",
      bridgeVersion: boundedString(sectorPackage.bridgeVersion ?? MARITIME_BRIDGE_VERSION, MAX_CONTEXT_LENGTH, "bridgeVersion"),
      route: String(sectorPackage.route ?? "scope-first"),
      operationalRelation: String(sectorPackage.operationalRelation ?? "unresolved"),
      controlLocus: String(sectorPackage.controlLocus ?? "unresolved"),
      rows: maritimeRows
    };
    validateMaritimePackage(maritime, { consequenceClass, responseBasis });
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
      responseBasis,
      outcome: resolvedOutcome,
      version: boundedString(payload.screening.screeningVersion ?? "unknown", MAX_CONTEXT_LENGTH, "screeningVersion")
    },
    rows,
    maritime,
    importedFrom: {
      generatedAt: typeof payload.generatedAt === "string" ? payload.generatedAt : "",
      language: payload.language,
      version: typeof payload.version === "string" ? payload.version : ""
    }
  };
}
