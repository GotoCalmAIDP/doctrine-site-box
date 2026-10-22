import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import nunjucks from "nunjucks";
import { Parser } from "htmlparser2";
import { ASSESSMENT_DATE, QUESTIONS, evaluateScreening } from "../src/assets/screening/screening-core.js";
import {
  buildEvidenceReviewBrief,
  buildEvidenceWorkspaceExport,
  parseEvidenceWorkspaceImport
} from "../src/assets/screening/evidence-workspace-core-v08.js";
import {
  buildScreeningExample,
  writeScreeningExample,
  EXAMPLE_ASSESSMENT_DATE,
  EXAMPLE_GENERATED_AT,
  EXAMPLE_RELEASE_ID,
  EXAMPLE_SHARED_SOURCE_COMMIT,
  EXAMPLE_MANIFEST_SHA256
} from "./build-screening-example.mjs";

const rootDir = resolve(".");
const prefix = "/doctrine-site-box";
const expectedPaths = [
  "src/_data/screeningExample.json",
  "src/assets/examples/screening-en.json",
  "src/assets/examples/screening-en.md",
  "src/assets/examples/screening-ua.json",
  "src/assets/examples/screening-ua.md"
];
const expectedSummary = { mapped: 0, open: 17, excluded: 0, priorityOpen: 11 };
const { data, files } = await buildScreeningExample({ rootDir });
assert.deepEqual(Object.keys(files).sort(), expectedPaths);
assert.deepEqual(await buildScreeningExample({ rootDir }), { data, files }, "Generation must be deterministic");
assert.equal(data.fictional, true);
assert.equal(data.nonnormative, true);
assert.equal(data.evidenceReviewed, false);
assert.equal(data.answerCount, 17);
assert.equal(data.screening.unknownCount, 17);
assert.equal(data.screening.outOfScopeCount, 0);
assert.equal(data.screening.priorityFlags.length, 7);
assert.equal(data.screening.outcome, "exploratory");
assert.deepEqual(data.summary, expectedSummary);
assert.equal(data.brief.status, "training-only");
assert.equal(data.brief.exploratory, true);
assert.deepEqual(data.brief.contextGaps, []);
assert.deepEqual(data.brief.nextActions, ["rerun-substantive", "resolve-priority-records", "complete-open-records"]);
assert.deepEqual(data.brief.priorityItems.map(item => item.questionId), ["scope_object", "applicability_basis", "authority_effectiveness"]);
assert.equal(data.dates.coreBasisDate, ASSESSMENT_DATE);
assert.equal(data.dates.assessmentDate, EXAMPLE_ASSESSMENT_DATE);
assert.equal(data.dates.generatedAt, EXAMPLE_GENERATED_AT);
assert.notEqual(data.dates.coreBasisDate, data.dates.assessmentDate, "Core rule-set date is distinct from the fictional assessment date");
assert.equal(data.provenance.releaseId, EXAMPLE_RELEASE_ID);
assert.equal(data.provenance.sharedSourceCommit, EXAMPLE_SHARED_SOURCE_COMMIT);
assert.equal(data.provenance.manifestSha256, EXAMPLE_MANIFEST_SHA256);
assert.equal(data.provenance.sharedRuntimeSha256, "ad98aae6d3a4abc089889f6ef1882225d45105f69190536c8cb32f2b84a0d911");
assert.equal(data.provenance.schema, "goto-calm:evidence-readiness-workspace:0.4");

// Reproduce the stored deliverables in an isolated directory; this also checks
// the writer cannot silently generate HTML routes or an extra client script.
const temporary = await mkdtemp(join(tmpdir(), "doctrine-screening-example-"));
try {
  await writeScreeningExample({ rootDir, outputDir: temporary });
  for (const path of expectedPaths) {
    assert.equal(await readFile(resolve(temporary, path), "utf8"), files[path]);
    assert.equal(await readFile(resolve(rootDir, path), "utf8"), files[path], `Stale generated sample: ${path}`);
  }
  await writeScreeningExample({ rootDir, outputDir: temporary });
  for (const path of expectedPaths) {
    assert.equal(await readFile(resolve(temporary, path), "utf8"), files[path], `Second generation changed bytes: ${path}`);
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}

const payloads = {};
for (const language of ["en", "ua"]) {
  const payload = JSON.parse(files[`src/assets/examples/screening-${language}.json`]);
  payloads[language] = payload;
  const view = data.languages[language];
  assert.equal(payload.language, language);
  assert.equal(payload.schema, data.provenance.schema);
  assert.equal(payload.version, data.provenance.evidenceVersion);
  assert.equal(payload.generatedAt, data.dates.generatedAt);
  assert.equal(payload.context.assessmentDate, data.dates.assessmentDate);
  assert.equal(payload.screening.screeningVersion, data.provenance.coreVersion);
  assert.equal(payload.screening.evidenceReviewed, false);
  assert.equal(payload.screening.consequenceClass, "unknown");
  assert.equal(payload.screening.responseBasis, "exploratory");
  assert.equal(payload.screening.outcome, "exploratory");
  assert.equal(payload.screening.lifecycle, "concept");
  assert.equal(payload.screening.sectorContext, "general");
  assert.deepEqual(payload.sectorPackages, []);
  assert.deepEqual(payload.summary.core, expectedSummary);
  assert.equal(payload.summary.maritimeDp, null);
  assert.deepEqual(payload.evidenceRecords.map(row => row.questionId), QUESTIONS.map(question => question.id));
  for (const row of payload.evidenceRecords) {
    assert.equal(row.sourceAnswer, "unknown");
    assert.equal(row.evidenceStatus, "unknown");
    assert.equal(row.evidenceClass, "unclassified");
    assert.equal(row.recordLocator, "");
    assert.equal(row.freshness, "unknown");
    assert.equal(row.conflict, "unknown");
    assert.equal(row.mappingState, "open");
  }
  const imported = parseEvidenceWorkspaceImport(payload);
  assert.deepEqual(buildEvidenceWorkspaceExport({ language, ...imported, generatedAt: payload.generatedAt }), payload,
    `${language} export must roundtrip exactly through the pinned importer`);
  assert.deepEqual(buildEvidenceReviewBrief(imported), data.brief);
  assert.deepEqual(evaluateScreening({
    ...imported.screening,
    answers: Object.fromEntries(imported.rows.map(row => [row.questionId, row.sourceAnswer]))
  }), data.screening, "Displayed screening values must be reproducible from the downloadable answers");
  assert.deepEqual(view.metrics.map(metric => [metric.key, metric.value]), [
    ["unknownCount", 17], ["outOfScopeCount", 0], ["mapped", 0], ["open", 17], ["priorityOpen", 11]
  ]);
  assert.deepEqual(view.nextActions.map(item => item.id), data.brief.nextActions);
  assert.deepEqual(view.priorityItems.map(item => item.id), data.brief.priorityItems.map(item => item.questionId));
  const markdown = files[`src/assets/examples/screening-${language}.md`];
  for (const text of [view.copy.scenario, view.copy.interpretation, view.copy.boundary, view.copy.interaction, view.copy.dateNote,
    view.statusLabel, ...view.nextActions.map(item => item.text), ...view.priorityItems.map(item => item.text)]) {
    assert.ok(markdown.includes(text), `Missing ${language} brief content: ${text}`);
  }
  for (const question of QUESTIONS) assert.ok(markdown.includes(question[language]), `Missing ${language} question ${question.id}`);
  for (const row of [...view.dateRows, ...view.provenanceRows]) assert.ok(markdown.includes(row.value));
  assert.ok(!/\b(?:undefined|NaN)\b/.test(markdown));
}
// Only language and fictional context wording differ; all machine semantics,
// standard limitations and other native export fields remain identical.
const machineFields = ({ language, context, ...payload }) => payload;
assert.deepEqual(machineFields(payloads.en), machineFields(payloads.ua));
assert.equal(payloads.en.context.assessedVersion, payloads.ua.context.assessedVersion);
assert.equal(payloads.en.context.assessmentDate, payloads.ua.context.assessmentDate);
assert.notEqual(payloads.en.context.referenceLabel, payloads.ua.context.referenceLabel);

function inspectSample(html, language, { fullPage = false } = {}) {
  const stack = [];
  const anchors = [];
  const forbidden = [];
  const detailStates = [];
  const headings = [];
  let sampleCount = 0;
  let text = "";
  let sampleOutsideArticle = false;
  let sampleOutsideController = false;
  const parser = new Parser({
    onopentag(tag, attributes) {
      const startsSample = attributes.id === "screening-example";
      const inSample = startsSample || Boolean(stack.at(-1)?.inSample);
      if (startsSample) {
        sampleCount += 1;
        sampleOutsideArticle = !stack.some(element => element.tag === "article");
        sampleOutsideController = !stack.some(element => element.id === "gc-screening");
        assert.ok("data-search-exclude" in attributes);
      }
      if (inSample) {
        if (/^h[1-6]$/.test(tag)) headings.push(tag);
        if (["script", "form", "input", "select", "button", "iframe"].includes(tag)) forbidden.push(tag);
        for (const name of Object.keys(attributes)) {
          assert.ok(!/^on/i.test(name), `Inline handler found: ${name}`);
          assert.ok(!/^data-(?:action|form|workspace|context|terms|contribution)/.test(name), `Runtime hook found: ${name}`);
        }
        if (tag === "a") anchors.push(attributes);
        if (tag === "details") detailStates.push("open" in attributes);
      }
      stack.push({ tag, id: attributes.id, inSample });
    },
    ontext(value) { if (stack.at(-1)?.inSample) text += value; },
    onclosetag() { stack.pop(); }
  }, { decodeEntities: true });
  parser.end(html);
  assert.equal(sampleCount, 1);
  assert.equal(sampleOutsideArticle, true, "Sample must be outside the canonical article");
  assert.equal(sampleOutsideController, true, "Sample must be outside the live screening mount");
  assert.deepEqual(forbidden, [], "Viewing the sample must not run code or submit a form");
  assert.deepEqual(detailStates, [false, false], "Sample and provenance must start collapsed without JS");
  assert.equal(headings[0], "h2", "Sample heading must precede its h3 subsections");
  assert.deepEqual(anchors.map(anchor => anchor.href), [
    `${prefix}/assets/examples/screening-${language}.json`,
    `${prefix}/assets/examples/screening-${language}.md`
  ]);
  assert.deepEqual(anchors.map(anchor => anchor.download), [`screening-${language}.json`, `screening-${language}.md`]);
  const view = data.languages[language];
  for (const expected of [view.copy.title, view.copy.boundary, view.copy.interaction, view.statusLabel,
    ...view.contextRows.map(row => row.value), ...view.nextActions.map(item => item.text)]) {
    assert.ok(text.includes(expected), `Missing ${language} rendered sample text`);
  }
  if (fullPage) {
    assert.ok(html.includes(`${prefix}/assets/examples/example.css`), "Sample CSS not connected");
    assert.ok(html.includes('id="gc-screening"'), "Existing screening mount must remain present");
  }
}

const template = await readFile(resolve(rootDir, "src/_includes/screening-example.njk"), "utf8");
const environment = new nunjucks.Environment(null, { autoescape: true, throwOnUndefined: true });
for (const lang of ["en", "ua"]) {
  inspectSample(environment.renderString(template, { lang, baseurl: prefix, screeningExample: data }), lang);
}
const css = await readFile(resolve(rootDir, "src/assets/examples/example.css"), "utf8");
assert.ok(!/@import\b|url\s*\(/i.test(css), "Sample stylesheet must not fetch more assets");
assert.ok(css.includes(":focus-visible"));

// Pass the built site directory after Eleventy to verify the final wrapper and
// passthrough bytes as part of the root integration pipeline.
if (process.argv[2]) {
  const siteDir = resolve(process.argv[2]);
  for (const lang of ["en", "ua"]) {
    inspectSample(await readFile(join(siteDir, lang, "screening/index.html"), "utf8"), lang, { fullPage: true });
    for (const extension of ["json", "md"]) {
      assert.equal(await readFile(join(siteDir, "assets/examples", `screening-${lang}.${extension}`), "utf8"),
        files[`src/assets/examples/screening-${lang}.${extension}`]);
    }
  }
  assert.equal(await readFile(join(siteDir, "assets/examples/example.css"), "utf8"), css);
}

console.log(`Screening example checks PASS: five deterministic generated files; both language exports roundtrip; ${data.answerCount} UNKNOWN; ${data.summary.mapped} mapped / ${data.summary.open} open / ${data.summary.priorityOpen} priority-open; ${data.brief.status}; static collapsed downloads${process.argv[2] ? "; built wrapper isolation and passthrough" : ""}.`);
