import assert from "node:assert/strict";
import { QUESTIONS, evaluateScreening } from "../src/assets/screening/screening-core.js";

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
console.log("screening-core: 6 fixtures passed");
