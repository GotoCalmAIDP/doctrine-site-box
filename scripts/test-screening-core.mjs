import assert from "node:assert/strict";
import { QUESTIONS, evaluateScreening } from "../src/assets/screening/screening-core.js";
import {
  EVIDENCE_WORKSPACE_SCHEMA,
  buildEvidenceWorkspaceExport,
  createEvidenceRows,
  evaluateEvidenceReadiness
} from "../src/assets/screening/evidence-workspace-core.js";

const answers = (value) => Object.fromEntries(QUESTIONS.map((question) => [question.id, value]));

assert.equal(evaluateScreening({
  materialConsequence: "no",
  lifecycle: "concept",
  answers: answers("3")
}).outcome, "no-escalation");

assert.equal(evaluateScreening({
  materialConsequence: "yes",
  lifecycle: "live",
  answers: answers("3")
}).outcome, "review");

assert.equal(evaluateScreening({
  materialConsequence: "unknown",
  lifecycle: "design",
  answers: answers("3")
}).outcome, "indeterminate");

const criticalGap = answers("3");
criticalGap.commit_preconditions = "0";
assert.equal(evaluateScreening({
  materialConsequence: "no",
  lifecycle: "design",
  answers: criticalGap
}).outcome, "review");

const unknowns = answers("3");
for (const question of QUESTIONS.slice(3, 7)) unknowns[question.id] = "unknown";
assert.equal(evaluateScreening({
  materialConsequence: "no",
  lifecycle: "concept",
  answers: unknowns
}).outcome, "indeterminate");

const excluded = answers("3");
excluded.boundary_disclosure = "out";
assert.equal(evaluateScreening({
  materialConsequence: "no",
  lifecycle: "concept",
  answers: excluded
}).outcome, "indeterminate");

assert.equal(QUESTIONS.length, 17);

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
  screening: evaluateScreening({ materialConsequence: "no", lifecycle: "concept", answers: answers("3") }),
  rows: workspaceRows,
  generatedAt: "2026-09-21T00:00:00.000Z"
});
assert.equal(exported.schema, EVIDENCE_WORKSPACE_SCHEMA);
assert.equal(exported.evidenceRecords.length, 17);
assert.equal(exported.screening.evidenceReviewed, false);
assert.equal(exported.summary.mapped, 1);
assert.ok(exported.limitations.some((item) => item.includes("cannot authorize")));

console.log("screening and evidence-workspace cores: 12 fixtures passed");
