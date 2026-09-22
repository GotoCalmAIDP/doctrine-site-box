import assert from "node:assert/strict";
import {
  buildPublicSubmission,
  normalizePublicAggregate
} from "../src/assets/screening/public-activity-core.js";

const belowThreshold = normalizePublicAggregate({
  schema: "goto-calm:screening-public-aggregate:0.1",
  generatedAt: "2026-09-22T00:00:00.000Z",
  windowDays: 30,
  privacyThreshold: 10,
  reportable: false
});
assert.equal(belowThreshold.reportable, false);
assert.equal("total" in belowThreshold, false);

const aggregate = normalizePublicAggregate({
  schema: "goto-calm:screening-public-aggregate:0.1",
  generatedAt: "2026-09-22T00:00:00.000Z",
  windowDays: 30,
  privacyThreshold: 10,
  reportable: true,
  total: 10,
  scopedTier2PlusPercent: 70,
  classes: [
    { key: "informational", count: 1, percent: 10 },
    { key: "limited", count: 2, percent: 20 },
    { key: "enterprise", count: 4, percent: 40 },
    { key: "high", count: 2, percent: 20 },
    { key: "critical", count: 1, percent: 10 },
    { key: "unknown", count: 0, percent: 0 }
  ]
});
assert.equal(aggregate.total, 10);
assert.equal(aggregate.classes[2].key, "enterprise");

const submission = buildPublicSubmission({
  consequenceClass: "enterprise",
  sectorContext: "maritime",
  outcome: "review",
  responseBasis: "records",
  version: "screening-core 0.3.0-alpha"
}, "0123456789abcdef0123456789abcdef");
assert.equal(submission.sectorContext, "maritime");
assert.equal(Object.hasOwn(submission, "answers"), false);
assert.throws(() => buildPublicSubmission({ ...submission, responseBasis: "exploratory" }, "0123456789abcdef0123456789abcdef"));

console.log("Public activity tests passed: 8 assertions");
