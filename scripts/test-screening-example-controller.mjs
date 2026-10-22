import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Parser } from "htmlparser2";
import { ASSESSMENT_VERSION, QUESTIONS } from "../src/assets/screening/screening-core.js";
import { RIGHTS_VERSION } from "../src/assets/screening/rights-core-v13.js";
import { emptyTabCompletions } from "../src/assets/screening/screening-session-v14.js";
import {
  buildEvidenceReviewBrief,
  buildEvidenceWorkspaceExport,
  parseEvidenceWorkspaceImport
} from "../src/assets/screening/evidence-workspace-core-v08.js";

// Node controller oracle only, adapted from test-screening-app-v14.mjs.
// The real pinned controller handles the file-input event and parses/applies the
// shipped JSON. DOM, storage, confirmations and fetch are isolated test doubles.
// No browser, real account, real storage or network is used. The synthetic rights
// fixture below is NOT a user agreement. No terms-consent event is dispatched,
// acceptTerms is never called, and no actual legal terms are accepted here.
const HOST = "screening-example.invalid";
const SESSION_KEY = `goto-calm:screening-tab-draft:${HOST}`;
const syntheticRightsFixture = Object.freeze({
  version: RIGHTS_VERSION,
  acceptedAt: "2026-10-03T00:00:00.000Z",
  syntheticTestFixture: true
});
const example = JSON.parse(await readFile(new URL("../src/_data/screeningExample.json", import.meta.url), "utf8"));
const controllerUrl = new URL("../src/assets/screening/screening-v14.js", import.meta.url);
const controllerBytes = await readFile(controllerUrl);
assert.equal(createHash("sha256").update(controllerBytes).digest("hex"), example.provenance.sharedRuntimeSha256,
  "The controller oracle must exercise the exact pinned runtime bytes");

let sequence = 0;
async function app({ language, syntheticRights = false } = {}) {
  const storage = new Map();
  if (syntheticRights) {
    storage.set(SESSION_KEY, JSON.stringify({
      schema: "goto-calm:screening-tab-draft:0.2",
      coreVersion: ASSESSMENT_VERSION,
      state: { phase: "intro", answers: {}, maritimeAnswers: {} },
      rightsConsent: syntheticRightsFixture,
      tabCompletions: emptyTabCompletions(),
      contribution: { status: "idle", token: null }
    }));
  }
  const handlers = {};
  const requests = [];
  const confirmations = [];
  const events = [];
  const note = { textContent: "", classList: { toggle() {} } };
  let confirmationResult = true;
  const root = {
    isConnected: true,
    dataset: { language, aggregateMode: "off", doctrineBase: "/doctrine-site-box", contactUrl: "/contact" },
    innerHTML: "",
    addEventListener(name, handler) { handlers[name] = handler; },
    querySelector(selector) {
      if (selector === ".gc-tab-status" && this.innerHTML.includes('class="gc-panel gc-tab-status"')) return {};
      if (selector === ".gc-session-guard" && this.innerHTML.includes('class="gc-session-guard"')) return {};
      if (selector === "[data-storage-status]") return note;
      return null;
    },
    querySelectorAll() { return []; },
    insertAdjacentHTML(position, html) { this.innerHTML = position === "afterbegin" ? html + this.innerHTML : this.innerHTML + html; },
    scrollIntoView() {}
  };
  globalThis.location = { host: HOST };
  globalThis.document = { querySelector: () => root, body: { classList: { add() {}, remove() {} } } };
  globalThis.window = {
    sessionStorage: {
      getItem: key => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key)
    },
    confirm(message) { confirmations.push(message); return confirmationResult; }
  };
  globalThis.fetch = async (...args) => {
    requests.push(args);
    throw new Error("Network is disabled in this synthetic controller oracle");
  };
  const url = new URL(controllerUrl);
  url.searchParams.set("example-controller-oracle", String(++sequence));
  await import(url);
  await Promise.resolve();
  return {
    root, storage, requests, confirmations, events,
    snapshot: () => JSON.parse(storage.get(SESSION_KEY) || "null"),
    confirmNext: value => { confirmationResult = value; },
    async importJson(bytes) {
      let reads = 0;
      events.push("workspace-import");
      await handlers.change({ target: {
        matches: selector => selector === "[data-workspace-import]",
        value: "synthetic-fixture.json",
        files: [{
          name: `screening-${language}.json`,
          size: Buffer.byteLength(bytes),
          text: async () => { reads += 1; return bytes; }
        }]
      } });
      return reads;
    }
  };
}

function inspectRenderedWorkspace(html) {
  const stack = [];
  const counts = [];
  const context = {};
  let notice = "";
  const parser = new Parser({
    onopentag(tag, attributes) {
      const parent = stack.at(-1);
      const classes = (attributes.class || "").split(/\s+/);
      const inCounts = classes.includes("gc-readiness-grid") || Boolean(parent?.inCounts);
      const inNotice = classes.includes("gc-live-status") || Boolean(parent?.inNotice);
      if (tag === "input" && attributes["data-context-field"]) context[attributes["data-context-field"]] = attributes.value;
      stack.push({ tag, inCounts, inNotice });
    },
    ontext(text) {
      const element = stack.at(-1);
      if (element?.inCounts && element.tag === "strong") counts.push(Number(text));
      if (element?.inNotice) notice += text;
    },
    onclosetag() { stack.pop(); }
  }, { decodeEntities: true });
  parser.end(html);
  return { counts, context, notice };
}

const globals = new Map(["location", "document", "window", "fetch"].map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
try {
  for (const language of ["en", "ua"]) {
    const bytes = await readFile(new URL(`../src/assets/examples/screening-${language}.json`, import.meta.url), "utf8");
    const payload = JSON.parse(bytes);

    // An ordinary initial controller without any fixture consent must reject
    // the event before reading the file; importing must never accept terms.
    const gated = await app({ language });
    assert.equal(await gated.importJson(bytes), 0, "Import must remain gated without rights consent");
    assert.equal(gated.snapshot(), null);
    assert.equal(gated.storage.size, 0);
    assert.equal(gated.confirmations.length, 0);
    assert.equal(gated.requests.length, 0);
    assert.deepEqual(gated.events, ["workspace-import"]);
    assert.ok(!/data-terms-consent[^>]*\bchecked\b/.test(gated.root.innerHTML), "The terms checkbox must remain unchecked");

    // A purely synthetic prior-rights state allows the real controller's normal
    // import path to be tested without acting on any actual user's consent.
    const current = await app({ language, syntheticRights: true });
    assert.deepEqual(current.snapshot().rightsConsent, syntheticRightsFixture);
    assert.equal(await current.importJson(bytes), 1, "The controller must read the actual generated JSON once");
    const imported = current.snapshot();
    const expected = parseEvidenceWorkspaceImport(payload);
    assert.equal(imported.state.phase, "workspace");
    assert.deepEqual(imported.workspace, {
      context: expected.context, screening: expected.screening, rows: expected.rows, maritime: null
    }, "The controller must apply the native imported workspace");
    assert.deepEqual(imported.state.answers, Object.fromEntries(QUESTIONS.map(question => [question.id, "unknown"])));
    assert.equal(imported.state.responseBasis, "exploratory");
    assert.equal(imported.state.consequenceClass, "unknown");
    assert.equal(imported.workspace.context.assessmentDate, example.dates.assessmentDate);
    assert.equal(buildEvidenceReviewBrief(imported.workspace).status, "training-only");
    assert.deepEqual(buildEvidenceReviewBrief(imported.workspace).summary, example.summary);
    assert.deepEqual(buildEvidenceWorkspaceExport({ language, ...imported.workspace, generatedAt: payload.generatedAt }), payload,
      "Controller-applied data must reproduce the portable sample when the original export timestamp is supplied explicitly");
    assert.deepEqual(imported.tabCompletions, emptyTabCompletions(), "Import must not record a completed screening");
    assert.deepEqual(imported.rightsConsent, syntheticRightsFixture, "Import must not create or alter the synthetic prior-rights state");
    assert.deepEqual(imported.contribution, { status: "idle", token: null });
    assert.equal(imported.documentIntake.reports.length, 0);
    assert.equal(current.requests.length, 0, "Import must make no aggregate or other fetch call");
    assert.equal(current.confirmations.length, 0, "An initial import does not replace an existing workspace");
    assert.deepEqual(current.events, ["workspace-import"], "No terms or contribution-consent event may be dispatched");
    const rendered = inspectRenderedWorkspace(current.root.innerHTML);
    assert.deepEqual(rendered.counts, [0, 17, 0, 11], "The real workspace rendering must display the computed counts");
    assert.deepEqual(rendered.context, payload.context, "The real workspace inputs must show the sample labels and assessment date");
    assert.ok(current.root.innerHTML.includes(example.languages[language].statusLabel), "The real workspace must show the localized training-only status");
    assert.ok(rendered.notice.includes(language === "en" ? "JSON snapshot restored and analyzed locally" : "Знімок JSON локально відновлено й проаналізовано"));

    // The existing-workspace path must ask before replacement. Declining the
    // synthetic prompt leaves the applied workspace, rights and counter intact.
    current.confirmNext(false);
    const beforeDecline = current.snapshot();
    assert.equal(await current.importJson(bytes), 1);
    assert.equal(current.confirmations.length, 1);
    assert.ok(current.confirmations[0].includes(language === "en" ? "Replace the current Tier 1 workspace" : "Замінити поточний робочий простір Tier 1"));
    assert.deepEqual(current.snapshot(), beforeDecline);
    assert.equal(current.requests.length, 0);
    assert.ok(current.events.every(event => event === "workspace-import"));
    current.root.isConnected = false;
  }
} finally {
  for (const [name, descriptor] of globals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
}

console.log("Screening example controller checks PASS: actual pinned file-import handler applied EN/UA JSON; training-only, UNKNOWN, 0 mapped / 17 open / 11 priority-open; fixed scenario date; completion count 0; prior synthetic rights unchanged; no consent events or network; declined replacement preserved state. Node mock evidence only, not browser acceptance or a real terms agreement.");
