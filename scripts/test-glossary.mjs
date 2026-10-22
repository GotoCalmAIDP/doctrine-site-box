import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import MarkdownIt from "markdown-it";
import { parseDocument } from "htmlparser2";
import { textContent } from "domutils";
import { extractArticle } from "./build-search-index.mjs";
import { normalizeGlossaryQuery, matchesGlossaryTitle } from "../src/assets/glossary/glossary-core.mjs";

const require = createRequire(import.meta.url);
const glossaryTransform = require("./glossary-transform.cjs");
const { collectTerms, enhanceGlossary } = glossaryTransform;
const siteDir = resolve(process.argv[2] || "_site");
const prefix = "/doctrine-site-box";
const clean = value => value.replace(/\s+/gu, " ").trim();
const sha256 = value => createHash("sha256").update(value).digest("hex");
const nodes = (root, predicate) => {
  const found = [];
  const visit = node => {
    if (predicate(node)) found.push(node);
    for (const child of node.children || []) visit(child);
  };
  visit(root);
  return found;
};
const tag = (node, name) => node.type === "tag" && node.name === name;
const hasClass = (node, name) => (node.attribs?.class || "").split(/\s+/u).includes(name);
const text = node => clean(textContent(node));
const byId = (root, id) => nodes(root, node => node.attribs?.id === id);
const sourceHashes = {
  en: "27ed7bb209d5628aa99be29ee9520ee00b3580b3fa2860d7a88a14d8a4f3d531",
  ua: "20444017ae39aee764be51ed143545fe2565f2bfeff2f94d9ded4d9d182de8a5"
};

// Exact EN/UA correspondence checked against the B3 navigation source pack:
// https://app.notion.com/p/4012a14e14ce8131a6b8ce83c563c397
// Definitions remain in their canonical Markdown; this test does not maintain
// a second glossary database or reconcile other pages' terminology.
const mapping = [
  ["applicability", "Applicability", "Застосовність"],
  ["boundary", "Boundary", "Межа"],
  ["boundary-note", "Boundary Note", "Примітка про межі"],
  ["case", "Case", "Кейс"],
  ["canonical", "Canonical", "Канонічний"],
  ["claim", "Claim", "Твердження"],
  ["compliance-theater", "Compliance Theater", "Театр відповідності"],
  ["conceptual-note", "Conceptual Note", "Концептуальна примітка"],
  ["evidence", "Evidence", "Доказ"],
  ["evidence-note", "Evidence Note", "Примітка про докази"],
  ["explanation", "Explanation", "Пояснення"],
  ["illustrative", "Illustrative", "Ілюстративний"],
  ["non-claim", "Non-Claim", "Без тверджень"],
  ["scope", "Scope", "Обсяг"],
  ["scope-note", "Scope Note", "Примітка про обсяг"],
  ["structural-translation", "Structural Translation", "Структурний переклад"],
  ["verbatim", "Verbatim", "Дослівно"],
  ["operational-mode", "Operational Mode", "Операційний режим"],
  ["applicability-boundary", "Applicability Boundary", "Межа застосовності"],
  ["invalid-operational-mode", "Invalid Operational Mode", "Недійсний операційний режим"],
  ["behaviour-governance", "Behaviour Governance", "Управління поведінкою"],
  ["system-legitimacy", "System Legitimacy", "Легітимність системи"],
  ["operational-assumptions", "Operational Assumptions", "Операційні припущення"]
];
assert.equal(mapping.length, 23);
const render = new MarkdownIt({ html: true });
const canonical = {};
const terms = collectTerms();
assert.equal(terms.length, 23);

function nextDefinition(heading) {
  const siblings = heading.parent.children;
  for (let index = siblings.indexOf(heading) + 1; index < siblings.length; index += 1) {
    const sibling = siblings[index];
    if (tag(sibling, "p") && !("data-search-exclude" in (sibling.attribs || {}))) return sibling;
    if (tag(sibling, "hr") || /^h[1-6]$/u.test(sibling.name || "")) break;
  }
  assert.fail(`Missing definition following ${text(heading)}`);
}

function assertVisibleWithoutScript(node, description) {
  for (let element = node; element; element = element.parent) {
    assert.ok(!("hidden" in (element.attribs || {})), `${description} is hidden in the built HTML`);
    assert.notEqual(element.attribs?.["aria-hidden"], "true", `${description} is hidden from assistive technology`);
    assert.ok(!tag(element, "details") || "open" in element.attribs, `${description} is collapsed without JavaScript`);
    assert.ok(!/display\s*:\s*none|visibility\s*:\s*hidden/iu.test(element.attribs?.style || ""), `${description} has a hiding inline style`);
  }
}

for (const language of ["en", "ua"]) {
  const source = await readFile(resolve(`src/${language}/glossary.md`));
  assert.equal(sha256(source), sourceHashes[language], `Canonical ${language} glossary Markdown changed`);
  const body = source.toString("utf8").replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/u, "");
  canonical[language] = `<main><article class="content">${render.render(body)}</article></main>`;
  const original = parseDocument(canonical[language]);
  const html = await readFile(resolve(siteDir, language, "glossary/index.html"), "utf8");
  const document = parseDocument(html);
  const ids = nodes(document, node => Boolean(node.attribs?.id)).map(node => node.attribs.id);
  assert.equal(new Set(ids).size, ids.length, `Duplicate ${language} page IDs`);
  const indexes = byId(document, "glossary-index");
  assert.equal(indexes.length, 1, `Missing ${language} glossary index`);
  const index = indexes[0];
  assert.ok("data-search-exclude" in index.attribs, "The index must not duplicate B2 searchable content");
  assertVisibleWithoutScript(index, `${language} alphabetic term index`);
  const items = nodes(index, node => tag(node, "li") && "data-glossary-item" in node.attribs);
  assert.equal(items.length, 23, `The ${language} index must list only the 23 glossary terms`);
  const actualOrder = items.map(item => text(nodes(item, node => tag(node, "a"))[0]));
  assert.deepEqual(actualOrder, [...actualOrder].sort(new Intl.Collator(language === "ua" ? "uk" : "en").compare),
    `${language} terms are not in locale alphabetic order`);
  assert.equal(new Set(actualOrder).size, 23);
  const forms = nodes(index, node => tag(node, "form") && "data-glossary-form" in node.attribs);
  assert.equal(forms.length, 1);
  assert.ok("hidden" in forms[0].attribs, "Filtering controls must wait for JavaScript; the full index stays visible");
  const statuses = nodes(index, node => "data-glossary-status" in (node.attribs || {}));
  assert.equal(statuses.length, 1);
  assert.equal(statuses[0].attribs.role, "status");

  for (const [slug, english, ukrainian] of mapping) {
    const id = `term-${slug}`;
    const title = language === "en" ? english : `${ukrainian} (${english})`;
    const headings = nodes(document, node => tag(node, "h2") && node.attribs["data-glossary-term"] === id);
    assert.equal(headings.length, 1, `Missing or duplicate ${language} heading ${english}`);
    const heading = headings[0];
    assert.equal(text(heading), title, `Published title changed for ${language} ${english}`);
    assert.equal(heading.attribs.id, id, `New stable anchor missing for ${language} ${english}`);
    const sourceHeading = nodes(original, node => tag(node, "h2") && text(node) === title);
    assert.equal(sourceHeading.length, 1);
    const definition = nextDefinition(heading);
    assert.equal(text(definition), text(nextDefinition(sourceHeading[0])), `Definition mismatch for ${language} ${english}`);
    assertVisibleWithoutScript(heading, title);
    assertVisibleWithoutScript(definition, `${title} definition`);
    const links = nodes(index, node => tag(node, "a") && node.attribs.href === `#${id}`);
    assert.equal(links.length, 1, `Index must link once to the exact ${language} definition for ${english}`);
    assert.ok([title, language === "en" ? english : ukrainian].includes(text(links[0])));
    const filterTitles = links[0].parent.attribs["data-glossary-titles"];
    assert.ok(filterTitles.includes(english) && filterTitles.includes(ukrainian), `Both source titles must filter ${english}`);
    assert.notEqual(links[0].attribs.tabindex, "-1", "Term links must be keyboard reachable");
    const opposite = language === "en" ? "ua" : "en";
    const counterpart = nodes(document, node => tag(node, "a")
      && node.attribs.href === `${prefix}/${opposite}/glossary/#${id}`);
    assert.equal(counterpart.length, 1, `Missing exact EN/UA counterpart for ${english}`);
  }

  // The entire canonical article, including status, related links and closing
  // notice, must survive unchanged. Reader controls are explicitly excluded.
  const expectedArticle = extractArticle(canonical[language]);
  const actualArticle = extractArticle(html);
  assert.deepEqual(actualArticle, expectedArticle, `${language} published canonical article changed`);
  const search = JSON.parse(await readFile(resolve(siteDir, "assets/search", `${language}.json`), "utf8"));
  const glossaryRecords = search.pages.filter(page => page.url === `${prefix}/${language}/glossary/`);
  assert.equal(glossaryRecords.length, 1, "B2 must contain one glossary record per language");
  const { url, lang, ...searchArticle } = glossaryRecords[0];
  assert.deepEqual(searchArticle, expectedArticle, "Glossary index links or help duplicated B2 search content");

  const primary = nodes(document, node => tag(node, "nav") && hasClass(node, "primary-nav"));
  assert.equal(primary.length, 1);
  const currentGlossary = nodes(primary[0], node => tag(node, "a") && node.attribs.href === `${prefix}/${language}/glossary/`);
  assert.equal(currentGlossary.length, 1, "Glossary must be visible in primary navigation");
  assert.equal(currentGlossary[0].attribs["aria-current"], "page");
  assert.equal(text(currentGlossary[0]), language === "en" ? "Glossary" : "Глосарій");
  const catalog = nodes(document, node => hasClass(node, "document-catalog"));
  assert.equal(nodes(catalog[0], node => tag(node, "a") && node.attribs.href === `${prefix}/${language}/glossary/`
    && node.attribs["aria-current"] === "page").length, 1);
}

assert.equal(normalizeGlossaryQuery("  МЕЖА\nзастосовності  "), "межа застосовності");
assert.equal(normalizeGlossaryQuery("Reader’s"), "reader's");
assert.equal(normalizeGlossaryQuery("x".repeat(1000)).length, 240);
assert.ok(matchesGlossaryTitle("Applicability Boundary Межа застосовності", "МЕЖА"));
assert.ok(matchesGlossaryTitle("Applicability Boundary Межа застосовності", "boundary межа"));
assert.ok(matchesGlossaryTitle("Маи\u0306бутні", "майбутні"));
assert.ok(matchesGlossaryTitle("ﬃ", "ffi"));
assert.ok(matchesGlossaryTitle("Reader’s evidence", "reader's"));
assert.ok(matchesGlossaryTitle("Any title", "   "), "Clear/empty query must restore every term");
assert.ok(!matchesGlossaryTitle("Applicability Boundary", ".*"), "Filter queries must remain literal");
assert.ok(matchesGlossaryTitle("Literal [scope]", "[scope]"));
assert.ok(!matchesGlossaryTitle("Applicability Boundary", "boundary nonexistent"));
assert.ok(!matchesGlossaryTitle("Applicability Boundary", "<img src=x onerror=alert(1)>"));

const fixture = canonical.en.replace('<article class="content">', '<article class="content reader-document">')
  .replace("<h2>Applicability</h2>", '<h2 id="published-applicability">Applicability</h2>');
const enhanced = enhanceGlossary(fixture, { lang: "en", baseurl: prefix, terms });
const enhancedDocument = parseDocument(enhanced);
assert.equal(byId(enhancedDocument, "published-applicability").length, 1, "Existing public heading IDs must survive");
assert.equal(text(byId(enhancedDocument, "published-applicability")[0]), "Applicability");
assert.equal(byId(enhancedDocument, "term-applicability").length, 1, "Stable bilingual alias must remain unique");
const alias = byId(enhancedDocument, "term-applicability")[0];
const followingElements = alias.parent.children.slice(alias.parent.children.indexOf(alias) + 1).filter(node => node.type === "tag");
assert.equal(followingElements[0].attribs.id, "published-applicability", "The stable alias must land on the preserved heading");
const fixtureIds = nodes(enhancedDocument, node => Boolean(node.attribs?.id)).map(node => node.attribs.id);
assert.equal(new Set(fixtureIds).size, fixtureIds.length);
assert.equal(enhanceGlossary(enhanced, { lang: "en", baseurl: prefix, terms }), enhanced, "Repeated enhancement must be idempotent");
assert.deepEqual(extractArticle(enhanced), extractArticle(fixture), "Existing-ID fixture text changed");
const collision = fixture.replace("<main>", '<main><span id="term-applicability">Existing unrelated anchor</span>');
assert.throws(() => enhanceGlossary(collision, { lang: "en", baseurl: prefix, terms }), /id|anchor|collision/iu,
  "An occupied stable anchor must fail rather than generate duplicate IDs or a wrong link");
assert.equal(glossaryTransform(fixture, "_site/en/definition/index.html"), fixture, "Other public articles must not be enhanced");

// Exercise the actual controller with only the index exposed. Any attempt to
// select or hide canonical definition nodes fails this isolated UI harness.
const { initGlossaryFilter } = await import("../src/assets/glossary/glossary.js");
const control = () => ({
  hidden: false, value: "", textContent: "", focused: false, handlers: {},
  addEventListener(name, handler) { this.handlers[name] = handler; },
  focus() { this.focused = true; }
});
for (const language of ["en", "ua"]) {
  const controls = Object.fromEntries(["form", "filter", "clear", "status", "empty"]
    .map(name => [`[data-glossary-${name}]`, control()]));
  const form = controls["[data-glossary-form]"];
  const input = controls["[data-glossary-filter]"];
  const clear = controls["[data-glossary-clear]"];
  const empty = controls["[data-glossary-empty]"];
  const status = controls["[data-glossary-status]"];
  form.hidden = true;
  const items = mapping.map(([, english, ukrainian]) => ({ hidden: false, dataset: { glossaryTitles: `${english} ${ukrainian}` } }));
  const root = {
    dataset: { language },
    querySelector(selector) {
      assert.ok(selector in controls, `Unexpected selector outside index controls: ${selector}`);
      return controls[selector];
    },
    querySelectorAll(selector) {
      assert.equal(selector, "[data-glossary-item]", "Filtering must target index items only");
      return items;
    }
  };
  initGlossaryFilter(root);
  assert.equal(form.hidden, false);
  assert.equal(items.filter(item => !item.hidden).length, 23);
  input.value = "МЕЖА";
  input.handlers.input();
  assert.equal(items.filter(item => !item.hidden).length, 2);
  assert.equal(empty.hidden, true);
  input.value = "no_such_public_term";
  input.handlers.input();
  assert.equal(items.filter(item => !item.hidden).length, 0);
  assert.equal(empty.hidden, false);
  assert.match(status.textContent, /0/);
  clear.handlers.click();
  assert.equal(input.value, "");
  assert.equal(input.focused, true, "Clear must return focus to the filter");
  assert.equal(items.filter(item => !item.hidden).length, 23);
  assert.equal(empty.hidden, true);
  input.value = "Boundary";
  input.handlers.input();
  let prevented = false;
  input.handlers.keydown({ key: "Escape", preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(input.value, "");
  assert.equal(items.filter(item => !item.hidden).length, 23);
  prevented = false;
  form.handlers.submit({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true, "Filter submission must not navigate away from the glossary");
}

const metadata = JSON.parse(await readFile(resolve("src/_data/pageMetadata.json"), "utf8"));
for (const route of Object.keys(metadata)) {
  const html = await readFile(resolve(siteDir, `.${route}`, "index.html"), "utf8");
  const document = parseDocument(html);
  const assets = nodes(document, node => node.name === "script" || node.name === "link")
    .map(node => node.attribs.src || node.attribs.href || "").filter(url => url.includes("/assets/glossary/"));
  if (/^\/(en|ua)\/glossary\/$/u.test(route)) {
    assert.ok(assets.includes(`${prefix}/assets/glossary/glossary.js`));
    assert.ok(assets.includes(`${prefix}/assets/glossary/glossary.css`));
  } else {
    assert.deepEqual(assets, [], `Glossary-only assets leaked onto ${route}`);
    assert.equal(nodes(document, node => "data-glossary-term" in (node.attribs || {})).length, 0);
  }
}

console.log("Glossary checks PASS: canonical source bytes and article/search text preserved; all 23 exact definitions and EN/UA pairs; alphabetic links, unique/preserved anchors, visible no-JS content, scoped assets and literal Unicode filtering.");
