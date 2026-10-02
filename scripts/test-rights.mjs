import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { RIGHTS_VERSION, acceptTerms, buildRightsMetadata, hasCurrentTermsConsent, termsUrl } from "../src/assets/screening/rights-core-v13.js";
import { buildEvidenceWorkspaceExport, createEvidenceRows, parseEvidenceWorkspaceImport } from "../src/assets/screening/evidence-workspace-core-v08.js";
import { QUESTIONS, evaluateScreening } from "../src/assets/screening/screening-core.js";

const now = new Date("2026-10-03T09:00:00Z");
const accepted = acceptTerms(now);
assert.equal(accepted.version, RIGHTS_VERSION);
assert.equal(hasCurrentTermsConsent(accepted, now), true);
assert.equal(hasCurrentTermsConsent(null, now), false);
assert.equal(hasCurrentTermsConsent({ ...accepted, version: "old" }, now), false);
assert.equal(hasCurrentTermsConsent({ ...accepted, acceptedAt: "invalid" }, now), false);
assert.equal(hasCurrentTermsConsent(acceptTerms(new Date("2027-01-01")), now), false);
assert.equal(termsUrl("ua"), "https://gotocalmaidp.github.io/doctrine-site-box/ua/terms/");
assert.equal(termsUrl("anything"), "https://gotocalmaidp.github.io/doctrine-site-box/en/terms/");

for (const language of ["en", "ua"]) {
  const metadata = buildRightsMetadata(language);
  assert.equal(metadata.frameworkOwner, "Vadym Partasyuk");
  assert.equal(metadata.noticeVersion, RIGHTS_VERSION);
  assert.ok(metadata.userInformation.includes("does not claim ownership"));
  assert.ok(metadata.licensedUse.includes("prior and third-party licences"));
  assert.ok(!JSON.stringify(metadata).includes("acceptedAt"));
  const screening = evaluateScreening({
    consequenceClass: "unknown", sectorContext: "general", lifecycle: "concept",
    responseBasis: "mixed", answers: Object.fromEntries(QUESTIONS.map(q => [q.id, "unknown"]))
  });
  const payload = buildEvidenceWorkspaceExport({
    language, context: { referenceLabel: "RIGHTS-QA", assessmentDate: "2026-10-03" },
    screening, rows: createEvidenceRows(), maritime: null
  });
  const legacy = parseEvidenceWorkspaceImport(payload);
  payload.rights = metadata;
  assert.deepEqual(parseEvidenceWorkspaceImport(payload), legacy);
}

const script = await readFile(new URL("../src/assets/screening/screening-v13.js", import.meta.url), "utf8");
assert.ok(script.includes('data-terms-consent'));
assert.ok(script.includes('saved.rightsConsent'));
assert.ok(script.includes('renderTermsGate();'));
assert.equal((script.match(/payload.rights = buildRightsMetadata\(language\)/g) || []).length, 2);
assert.ok(script.includes('${renderRightsNotice()}'));
assert.ok(!script.includes("buildPublicSubmission(result, contributionToken, rightsConsent)"));
assert.ok(script.includes('data-requires-terms'));
console.log("Rights checks PASS: versioned local acceptance, stale consent, EN/UA attribution, export/import compatibility, no contribution opt-in coupling.");

// A non-browser, isolated UI/state simulation. It creates no account, makes no
// agreement on a user's behalf and sends no request to the public service.
const storage = new Map();
class TestRoot {
  dataset = { language: "en" };
  handlers = {};
  html = "";
  buttons = [];
  set innerHTML(value) {
    this.html = value;
    this.buttons = [...value.matchAll(/data-requires-terms([^>]*)/g)]
      .map(match => ({ disabled: match[1].includes("disabled") }));
  }
  get innerHTML() { return this.html; }
  addEventListener(name, handler) { this.handlers[name] = handler; }
  querySelectorAll(selector) { return selector === "[data-requires-terms]" ? this.buttons : []; }
  querySelector(selector) {
    if (selector === ".gc-session-guard" && !this.html.includes("gc-session-guard")) return null;
    return { focus() {}, insertAdjacentHTML() {}, click() {} };
  }
  insertAdjacentHTML(_, value) { this.html += value; }
  scrollIntoView() {}
  async click(action) {
    return this.handlers.click({ target: { closest: () => ({ dataset: { action } }) }, preventDefault() {} });
  }
  async consent(checked) {
    return this.handlers.change({ target: {
      checked, matches: selector => selector === "[data-terms-consent]"
    } });
  }
}
globalThis.window = { sessionStorage: {
  getItem: key => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key)
}, confirm: () => true };
globalThis.fetch = async () => { throw new Error("Network deliberately disabled in this test"); };
let root = new TestRoot();
globalThis.document = { querySelector: () => root, getElementById: () => null };
const scriptUrl = new URL("../src/assets/screening/screening-v13.js", import.meta.url);
await import(scriptUrl.href + "?rights-ui-test=initial");
await new Promise(resolve => setImmediate(resolve));
assert.equal(root.buttons.length, 4);
assert.ok(root.buttons.every(button => button.disabled));
await root.click("open-workspace-blank");
assert.ok(!root.html.includes('class="gc-workspace"'));
await root.consent(true);
assert.ok(root.buttons.every(button => !button.disabled));
await root.consent(false);
assert.ok(root.buttons.every(button => button.disabled));
await root.consent(true);
await root.click("open-workspace-blank");
assert.ok(root.html.includes('class="gc-workspace"'));
assert.ok(root.html.includes("Framework / template © 2026 Vadym Partasyuk"));
root.handlers.input({ target: { dataset: { contextField: "referenceLabel" }, value: "RIGHTS-MIGRATION-QA" } });
const key = "goto-calm:screening-tab-draft";
const saved = JSON.parse(storage.get(key));
assert.equal(saved.contribution.status, "idle");
assert.equal(saved.workspace.context.referenceLabel, "RIGHTS-MIGRATION-QA");
delete saved.rightsConsent;
storage.set(key, JSON.stringify(saved));
root = new TestRoot();
await import(scriptUrl.href + "?rights-ui-test=legacy");
assert.ok(root.html.includes("Your draft is preserved."));
assert.equal(JSON.parse(storage.get(key)).workspace.context.referenceLabel, "RIGHTS-MIGRATION-QA");
await root.consent(true);
await root.click("rights-continue");
assert.ok(root.html.includes('value="RIGHTS-MIGRATION-QA"'));
assert.ok(root.html.includes("Framework / template © 2026 Vadym Partasyuk"));
assert.equal(JSON.parse(storage.get(key)).contribution.status, "idle");
console.log("UI/state simulation PASS: all four entry routes blocked before agreement; unchecking disables; legacy draft preserved and resumed; attribution present; no aggregate contribution.");
