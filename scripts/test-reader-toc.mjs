import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { parseDocument } from "htmlparser2";
import { extractArticle } from "./build-search-index.mjs";

const require = createRequire(import.meta.url);
const transform = require("./reader-toc.cjs");
const { enhanceReaderToc } = transform;
const clean = value => value.replace(/\s+/gu, " ").trim();
const isTag = (node, name) => node.type === "tag" && node.name === name;
const hasClass = (node, name) => (node.attribs?.class || "").split(/\s+/u).includes(name);
const all = (root, predicate) => {
  const result = [];
  const visit = node => {
    if (predicate(node)) result.push(node);
    for (const child of node.children || []) visit(child);
  };
  visit(root);
  return result;
};
const excludedTags = new Set(["nav", "header", "footer", "script", "style", "template", "noscript", "form", "button"]);
const excludedClasses = ["site-search", "search-panel", "glossary-index", "screening-example", "reader-toc"];
function excluded(node) {
  const attributes = node.attribs || {};
  return excludedTags.has(node.name) || "hidden" in attributes || attributes["aria-hidden"] === "true"
    || "data-search-exclude" in attributes || "data-reader-toc" in attributes
    || attributes.id === "gc-screening" || excludedClasses.some(name => hasClass(node, name))
    || /display\s*:\s*none|visibility\s*:\s*hidden/iu.test(attributes.style || "");
}
function visibleText(node) {
  if (excluded(node)) return "";
  if (node.type === "text") return node.data;
  return (node.children || []).map(visibleText).join("");
}
function eligibleHeadings(article) {
  const headings = [];
  const visit = node => {
    if (excluded(node)) return;
    if ((isTag(node, "h2") || isTag(node, "h3")) && clean(visibleText(node))) headings.push(node);
    for (const child of node.children || []) visit(child);
  };
  visit(article);
  return headings;
}
const readerArticle = document => all(document, node => isTag(node, "article") && hasClass(node, "reader-document"))[0];
function verifyToc(html, language) {
  const document = parseDocument(html);
  const article = readerArticle(document);
  assert.ok(article, "Expected the public reader article");
  const tocs = all(document, node => isTag(node, "details") && "data-reader-toc" in node.attribs);
  assert.equal(tocs.length, 1);
  const toc = tocs[0];
  assert.ok(!("open" in toc.attribs), "The native TOC must initially be collapsed");
  assert.ok(!("hidden" in toc.attribs), "The summary must remain available without JavaScript");
  assert.ok("data-search-exclude" in toc.attribs);
  for (let node = toc; node; node = node.parent) assert.notEqual(node, article, "TOC must be outside the canonical article");
  const elements = toc.children.filter(node => node.type === "tag");
  assert.equal(elements[0].name, "summary", "Native details needs a first summary for keyboard/no-JS use");
  const expectedLabel = language === "ua" ? "На цій сторінці" : "On this page";
  assert.equal(clean(visibleText(elements[0])), expectedLabel);
  assert.notEqual(elements[0].attribs.tabindex, "-1");
  assert.equal(all(toc, node => "hidden" in (node.attribs || {}) || node.attribs?.["aria-hidden"] === "true").length, 0,
    "Opening native details must reveal its links without a script");
  assert.equal(all(toc, node => node.name === "script").length, 0);
  const headings = eligibleHeadings(article);
  const links = all(toc, node => isTag(node, "a"));
  assert.equal(links.length, headings.length);
  const ids = all(document, node => Boolean(node.attribs?.id)).map(node => node.attribs.id);
  assert.equal(new Set(ids).size, ids.length, "All page IDs must be unique after enhancement");
  for (let index = 0; index < links.length; index += 1) {
    const link = links[index];
    const heading = headings[index];
    assert.equal(clean(visibleText(link)), clean(visibleText(heading)), "TOC labels must retain exact rendered heading text and source order");
    assert.equal(decodeURIComponent(link.attribs.href), `#${heading.attribs.id}`, "Every TOC link must reach its own heading");
    assert.notEqual(link.attribs.tabindex, "-1");
    assert.ok("tabindex" in heading.attribs, "Anchor targets must accept keyboard focus");
    let item = link.parent;
    while (item && !isTag(item, "li")) item = item.parent;
    assert.equal(item?.attribs["data-toc-level"], heading.name.slice(1), "H3 entries must retain their subordinate level");
  }
  return { document, headings, toc };
}

const fixture = `<!doctype html><html><body><header><span id="section-repeat-2">Outside ID</span></header>
<main><article class="content reader-document"><h1>Original title</h1>
<p><a href="#section-repeat">Existing deep link</a></p>
<h2>Repeat</h2><p>First definition, unchanged.</p>
<h2>Repeat</h2><p>Second definition, unchanged.</p>
<h2 id="section-repeat" tabindex="0">Published <em>anchor</em> &amp; title</h2><p>Existing target.</p>
<h3>Доказ і межа</h3><p>Український текст зберігається.</p>
<h4>Not a TOC level</h4>
<nav><h2>Navigation utility</h2></nav><div data-search-exclude><h2>Excluded utility</h2></div>
<div hidden><h2>Hidden heading</h2></div><div aria-hidden="true"><h2>Assistive hidden</h2></div>
<div style="display:none"><h2>Style hidden</h2></div><form><h2>Form heading</h2></form>
<div class="site-search"><h2>Search UI</h2></div>
</article></main><footer>Original footer.</footer></body></html>`;
for (const language of ["en", "ua"]) {
  const enhanced = enhanceReaderToc(fixture, { lang: language });
  const { document, headings } = verifyToc(enhanced, language);
  assert.equal(headings.length, 4, "Hidden/UI headings must not enter the TOC");
  assert.deepEqual(headings.slice(0, 2).map(node => node.attribs.id), ["section-repeat-3", "section-repeat-4"],
    "Generated IDs must avoid both later explicit IDs and IDs outside the article");
  assert.equal(headings[2].attribs.id, "section-repeat");
  assert.equal(headings[2].attribs.tabindex, "0", "Existing focus attributes must survive");
  assert.match(headings[3].attribs.id, /[а-яіїєґ]/u, "Ukrainian headings must retain deterministic Unicode anchors");
  const oldLinks = all(document, node => isTag(node, "a") && clean(visibleText(node)) === "Existing deep link");
  assert.equal(oldLinks[0].attribs.href, "#section-repeat", "Existing deep links must remain unchanged");
  assert.deepEqual(extractArticle(enhanced), extractArticle(fixture), "TOC enhancement changed canonical article text");
  assert.equal(enhanceReaderToc(fixture, { lang: language }), enhanced, "Output must be deterministic");
  assert.equal(enhanceReaderToc(enhanced, { lang: language }), enhanced, "A repeated transform must not duplicate the TOC");
}
const shortArticle = '<main><article class="content reader-document"><h1>Short</h1><h2>One</h2><h3>Two</h3><h2>Three</h2><nav><h2>Utility fourth</h2></nav></article></main>';
assert.equal(enhanceReaderToc(shortArticle, { lang: "en" }), shortArticle, "Three eligible headings must not create a TOC");
const duplicateIds = fixture.replace('<h2>Repeat</h2>', '<h2 id="section-repeat-2">Repeat</h2>');
assert.throws(() => enhanceReaderToc(duplicateIds, { lang: "en" }), /duplicate|collision/iu,
  "Pre-existing duplicate IDs must fail closed");
const reservedIdsFixture = fixture
  .replace('<h2>Repeat</h2>', '<h2 id="release%20notes">Repeat</h2>')
  .replace('<h3>Доказ і межа</h3>', '<h3 id="release#notes?draft&amp;review=1">Доказ і межа</h3>');
const reservedResult = verifyToc(enhanceReaderToc(reservedIdsFixture, { lang: "en" }), "en");
assert.equal(reservedResult.headings[0].attribs.id, "release%20notes", "A literal percent sequence in an existing ID must survive");
assert.equal(reservedResult.headings[3].attribs.id, "release#notes?draft&review=1", "Reserved characters in existing IDs must survive");
const reservedLinks = all(reservedResult.toc, node => isTag(node, "a"));
assert.equal(reservedLinks[0].attribs.href, "#release%2520notes", "Percent sequences must be encoded, not interpreted as spaces");
assert.equal(reservedLinks[3].attribs.href, "#release%23notes%3Fdraft%26review%3D1", "Fragment targets must encode URL-reserved characters");
assert.deepEqual(extractArticle(enhanceReaderToc(reservedIdsFixture, { lang: "en" })), extractArticle(reservedIdsFixture));
for (const route of ["_site/en/screening/index.html", "_site/ua/glossary/index.html", "_site/404.html"]) {
  assert.equal(transform(fixture, route), fixture, `TOC must not modify ${route}`);
}

const siteDir = resolve(process.argv[2] || "_site");
const metadata = JSON.parse(await readFile(resolve("src/_data/pageMetadata.json"), "utf8"));
let eligiblePages = 0;
for (const route of Object.keys(metadata)) {
  const html = await readFile(resolve(siteDir, `.${route}`, "index.html"), "utf8");
  const document = parseDocument(html);
  const article = readerArticle(document);
  const excludedRoute = /^\/(?:en|ua)\/(?:screening|glossary)\/$/u.test(route);
  const count = article ? eligibleHeadings(article).length : 0;
  const tocs = all(document, node => "data-reader-toc" in (node.attribs || {}));
  if (!excludedRoute && count >= 4) {
    verifyToc(html, route.startsWith("/ua/") ? "ua" : "en");
    eligiblePages += 1;
  } else assert.equal(tocs.length, 0, `Unexpected TOC on excluded/short page ${route}`);
}
assert.ok(eligiblePages > 0, "The built corpus must exercise the TOC");

// Approved 23 October 2026 Terms/Privacy clarification baseline.
// Compared with B4 production 7bb85a1e4c2fc7f5ddcadab49e2cf377867a0878:
// only EN/UA Terms and Privacy records changed; all other 112 records are identical.
// Reader navigation must not introduce further searchable-content changes.
const indexHashes = {
  en: "25210f36a669bbb0625ca9e95867f91fb61dec9348b6d76c603beee7dba03308",
  ua: "0237a823fcd1931d2c953a5f2e3ff0a26ee508016e8c0010d6907bd9adb233e7"
};
for (const language of ["en", "ua"]) {
  const bytes = await readFile(resolve(siteDir, "assets/search", `${language}.json`));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), indexHashes[language], `${language} public search index changed`);
}
console.log(`Reader TOC checks PASS: ${eligiblePages} eligible built pages; exact headings, Unicode/collision-safe preserved anchors, native collapsed no-JS navigation, exclusions and unchanged full EN/UA search indexes.`);
