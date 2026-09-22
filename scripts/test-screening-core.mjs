import assert from "node:assert/strict";
import { QUESTIONS, evaluateScreening } from "../src/assets/screening/screening-core.js";
import {
  EVIDENCE_WORKSPACE_SCHEMA,
  LEGACY_EVIDENCE_WORKSPACE_SCHEMA,
  PREVIOUS_EVIDENCE_WORKSPACE_SCHEMA,
  buildEvidenceReviewBrief,
  buildEvidenceWorkspaceExport,
  createEvidenceRows,
  evaluateEvidenceReadiness,
  parseEvidenceWorkspaceImport
} from "../src/assets/screening/evidence-workspace-core.js";

const answers = (value) => Object.fromEntries(QUESTIONS.map((question) => [question.id, value]));
const evaluate = (input) => evaluateScreening({ responseBasis: "records", ...input });

assert.equal(evaluate({
  consequenceClass: "informational",
  sectorContext: "general",
  lifecycle: "concept",
  answers: answers("3")
}).outcome, "no-escalation");

assert.equal(evaluate({
  consequenceClass: "enterprise",
  sectorContext: "enterprise",
  lifecycle: "live",
  answers: answers("3")
}).outcome, "review");

assert.equal(evaluate({
  consequenceClass: "unknown",
  sectorContext: "general",
  lifecycle: "design",
  answers: answers("3")
}).outcome, "indeterminate");

const criticalGap = answers("3");
criticalGap.commit_preconditions = "0";
assert.equal(evaluate({
  consequenceClass: "limited",
  sectorContext: "general",
  lifecycle: "design",
  answers: criticalGap
}).outcome, "review");

const unknowns = answers("3");
for (const question of QUESTIONS.slice(3, 7)) unknowns[question.id] = "unknown";
assert.equal(evaluate({
  consequenceClass: "informational",
  sectorContext: "general",
  lifecycle: "concept",
  answers: unknowns
}).outcome, "indeterminate");

const excluded = answers("3");
excluded.boundary_disclosure = "out";
assert.equal(evaluate({
  consequenceClass: "informational",
  sectorContext: "general",
  lifecycle: "concept",
  answers: excluded
}).outcome, "indeterminate");

assert.equal(evaluate({
  consequenceClass: "critical",
  sectorContext: "maritime",
  lifecycle: "pilot",
  answers: answers("3")
}).outcome, "review");

assert.equal(evaluate({
  consequenceClass: "limited",
  sectorContext: "unbounded",
  lifecycle: "design",
  answers: answers("3")
}).outcome, "indeterminate");

assert.equal(QUESTIONS.length, 17);

const mixedBasis = evaluate({
  consequenceClass: "informational",
  sectorContext: "general",
  lifecycle: "concept",
  responseBasis: "mixed",
  answers: answers("3")
});
assert.equal(mixedBasis.outcome, "indeterminate");
assert.equal(mixedBasis.responseBasis, "mixed");

const exploratoryAnswers = answers("3");
QUESTIONS.slice(5).forEach((question, index) => {
  exploratoryAnswers[question.id] = ["0", "1", "2", "unknown"][index % 4];
});
const exploratory = evaluate({
  consequenceClass: "critical",
  sectorContext: "enterprise",
  lifecycle: "pilot",
  responseBasis: "exploratory",
  answers: exploratoryAnswers
});
assert.equal(exploratory.outcome, "exploratory");
assert.equal(exploratory.answerDistribution.reduce((total, item) => total + item.count, 0), 17);
assert.equal(exploratory.axes.find((axis) => axis.id === "runtime").promptCount, 1);

const workspaceRows = createEvidenceRows(answers("3"));
assert.equal(workspaceRows.length, 17);
assert.deepEqual(evaluateEvidenceReadiness(workspaceRows).summary, {
  mapped: 0,
  open: 17,
  excluded: 0,
  priorityOpen: QUESTIONS.filter((question) => question.critical).length
});

workspaceRows[0].evidenceClass = "documentary";
workspaceRows[0].recordLocator = "REGISTER/CASE-014/OBJECT";
workspaceRows[0].freshness = "current";
workspaceRows[0].conflict = "no";
assert.equal(evaluateEvidenceReadiness(workspaceRows).rows[0].state, "mapped");

const excludedRows = createEvidenceRows({ ...answers("3"), boundary_disclosure: "out" });
assert.equal(evaluateEvidenceReadiness(excludedRows).summary.excluded, 1);

const staleRows = createEvidenceRows({ ...answers("3"), evidence_freshness: "2" });
const staleEvaluation = evaluateEvidenceReadiness(staleRows);
assert.ok(staleEvaluation.rows.find((row) => row.questionId === "evidence_freshness").actions.includes("recheck-currentness"));

assert.throws(() => evaluateEvidenceReadiness(workspaceRows.slice(1)), /Expected 17 evidence rows/);

const exported = buildEvidenceWorkspaceExport({
  language: "en",
  context: {
    referenceLabel: "SYSTEM-A",
    assessedVersion: "v2.4",
    assessmentDate: "2026-09-21",
    contextLabel: "pre-deployment review"
  },
  screening: evaluate({ consequenceClass: "informational", sectorContext: "general", lifecycle: "concept", answers: answers("3") }),
  rows: workspaceRows,
  generatedAt: "2026-09-21T00:00:00.000Z"
});
assert.equal(exported.schema, EVIDENCE_WORKSPACE_SCHEMA);
assert.equal(exported.evidenceRecords.length, 17);
assert.equal(exported.screening.evidenceReviewed, false);
assert.equal(exported.screening.consequenceClass, "informational");
assert.equal(exported.screening.sectorContext, "general");
assert.equal(exported.screening.responseBasis, "records");
assert.equal(exported.summary.mapped, 1);
assert.ok(exported.limitations.some((item) => item.includes("cannot authorize")));

const imported = parseEvidenceWorkspaceImport(exported);
assert.equal(imported.context.referenceLabel, "SYSTEM-A");
assert.equal(imported.rows.length, 17);
assert.equal(evaluateEvidenceReadiness(imported.rows).summary.mapped, 1);
assert.equal(imported.importedFrom.language, "en");

const exploratoryBrief = buildEvidenceReviewBrief({
  context: { referenceLabel: "", assessedVersion: "", assessmentDate: "2026-09-22", contextLabel: "" },
  screening: { ...exploratory, responseBasis: "exploratory", outcome: "exploratory" },
  rows: createEvidenceRows(exploratoryAnswers)
});
assert.equal(exploratoryBrief.status, "training-only");
assert.deepEqual(exploratoryBrief.contextGaps, ["referenceLabel", "assessedVersion", "contextLabel"]);
assert.equal(exploratoryBrief.priorityItems.length, 3);
assert.deepEqual(exploratoryBrief.nextActions, [
  "rerun-substantive",
  "complete-context",
  "resolve-priority-records"
]);

const completeBrief = buildEvidenceReviewBrief({
  context: imported.context,
  screening: imported.screening,
  rows: imported.rows.map((row) => ({
    ...row,
    evidenceStatus: "documented",
    evidenceClass: "documentary",
    recordLocator: `REGISTER/${row.questionId}`,
    freshness: "current",
    conflict: "no"
  }))
});
assert.equal(completeBrief.status, "mapping-complete");
assert.deepEqual(completeBrief.nextActions, ["independent-review"]);

const previousSnapshot = {
  ...exported,
  schema: PREVIOUS_EVIDENCE_WORKSPACE_SCHEMA,
  screening: { ...exported.screening, responseBasis: undefined }
};
const importedPrevious = parseEvidenceWorkspaceImport(previousSnapshot);
assert.equal(importedPrevious.screening.responseBasis, "mixed");
assert.equal(importedPrevious.screening.outcome, "indeterminate");

const legacySnapshot = {
  ...exported,
  schema: LEGACY_EVIDENCE_WORKSPACE_SCHEMA,
  screening: {
    materialConsequence: "yes",
    lifecycle: "design",
    outcome: "review",
    screeningVersion: "screening-core 0.1.0-alpha",
    evidenceReviewed: false
  }
};
const importedLegacy = parseEvidenceWorkspaceImport(legacySnapshot);
assert.equal(importedLegacy.screening.consequenceClass, "enterprise");
assert.equal(importedLegacy.screening.sectorContext, "general");

assert.throws(() => parseEvidenceWorkspaceImport({ ...exported, schema: "unknown" }), /Unsupported snapshot schema/);
assert.throws(() => parseEvidenceWorkspaceImport({
  ...exported,
  screening: { ...exported.screening, consequenceClass: "catastrophic-ish" }
}), /Invalid consequenceClass/);
assert.throws(() => parseEvidenceWorkspaceImport({
  ...exported,
  screening: { ...exported.screening, sectorContext: "ocean" }
}), /Invalid sectorContext/);
assert.throws(() => parseEvidenceWorkspaceImport({ ...exported, evidenceRecords: exported.evidenceRecords.slice(1) }), /Expected 17 evidence records/);
assert.throws(() => parseEvidenceWorkspaceImport({
  ...exported,
  evidenceRecords: [...exported.evidenceRecords.slice(0, -1), exported.evidenceRecords[0]]
}), /Duplicate questionId/);
assert.throws(() => parseEvidenceWorkspaceImport({
  ...exported,
  evidenceRecords: exported.evidenceRecords.map((record, index) => index === 0 ? { ...record, recordLocator: "x".repeat(321) } : record)
}), /recordLocator is too long/);

console.log("screening and evidence-workspace cores: 42 checks passed");
