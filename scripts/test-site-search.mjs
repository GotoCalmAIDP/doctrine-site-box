import assert from "node:assert/strict";
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { buildSearchIndexes, extractArticle, writeSearchIndexes } from "./build-search-index.mjs";
import { normalizeQuery, searchPages } from "../src/assets/search/search-core.mjs";

const fixtureHtml = `<!doctype html><html><head><title>HEAD_SECRET</title></head><body>
  <header>HEADER_SECRET<nav>CATALOG_SECRET</nav></header>
  <main><section data-site-search>SEARCH_SECRET</section><article class="content reader-document">
    <h1>Public &amp; visible</h1><h2>Operational <em>boundary</em></h2>
    <p>Reader’s evidence &lt;scope&gt; remains visible.<br>Second line.</p>
    <p>Inline <strong>public</strong> words.</p>
    <p><a href="https://doi.org/10.5281/zenodo.12345678">Published reference</a></p>
    <p>DOI: 10.5281/zenodo.23456789.</p>
    <script>const secret = "SCRIPT_SECRET";</script><style>STYLE_SECRET</style>
    <template>TEMPLATE_SECRET</template><noscript>NOSCRIPT_SECRET</noscript>
    <nav><h2>TOC_SECRET</h2><a href="#x">TOC_LINK_SECRET</a></nav>
    <section data-search-exclude><h2>EXCLUDED_SECRET</h2><p>EXCLUDED_BODY_SECRET</p></section>
    <div class="reader-toc">READER_TOC_SECRET</div><div class="site-search">INNER_SEARCH_SECRET</div>
    <p hidden>HIDDEN_SECRET</p><p aria-hidden="true">ARIA_SECRET</p>
    <header>ARTICLE_HEADER_SECRET</header><footer>ARTICLE_FOOTER_SECRET</footer>
  </article><section id="search-panel">AFTER_ARTICLE_SECRET</section></main>
  <footer>FOOTER_SECRET</footer><article class="content">OUTSIDE_MAIN_SECRET</article>
</body></html>`;
const extracted = extractArticle(fixtureHtml);
assert.equal(extracted.title, "Public & visible");
assert.deepEqual(extracted.headings, ["Public & visible", "Operational boundary"]);
assert.ok(extracted.text.includes("Reader’s evidence <scope> remains visible. Second line."));
assert.ok(extracted.text.includes("Inline public words."));
assert.deepEqual(extracted.dois, ["10.5281/zenodo.12345678", "10.5281/zenodo.23456789"]);
assert.ok(!JSON.stringify(extracted).includes("SECRET"), "Shell, scripts, search, TOC or hidden content leaked");
assert.throws(() => extractArticle("<main><p>Not an article</p></main>"), /Expected one main article/);
assert.throws(() => extractArticle('<main><article class="content">One</article><article class="content">Two</article></main>'), /found 2/);

// An isolated built-site fixture proves that the generator reads the allowlist,
// not other pages, repository documents, backups, or a directory crawl.
const temporary = await mkdtemp(join(tmpdir(), "doctrine-search-"));
try {
  const siteDir = join(temporary, "_site");
  const metadataPath = join(temporary, "pageMetadata.json");
  const metadata = {
    "/ua/example/": { title: "Fallback UA" },
    "/en/example/": { title: "Fallback EN" }
  };
  const write = async (file, text) => {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, text, "utf8");
  };
  for (const route of Object.keys(metadata)) await write(join(siteDir, route, "index.html"), fixtureHtml);
  for (const file of ["_site/en/unlisted/index.html", "_site/docs/index.html", "docs/source.md", "backups/index.html", "userdocs/private.txt"]) {
    await write(join(temporary, file), "UNALLOWLISTED_SECRET");
  }
  await write(metadataPath, JSON.stringify(metadata));
  const indexes = await writeSearchIndexes({ siteDir, metadataPath });
  for (const language of ["en", "ua"]) {
    assert.equal(indexes[language].pages.length, 1);
    assert.equal(indexes[language].pages[0].url, `/doctrine-site-box/${language}/example/`);
    assert.equal(indexes[language].pages[0].lang, language);
    assert.ok(!JSON.stringify(indexes[language]).includes("SECRET"));
  }
  const first = await readFile(join(siteDir, "assets/search/en.json"), "utf8");
  await write(metadataPath, JSON.stringify(Object.fromEntries(Object.entries(metadata).reverse())));
  await writeSearchIndexes({ siteDir, metadataPath });
  assert.equal(await readFile(join(siteDir, "assets/search/en.json"), "utf8"), first, "Allowlist order changed output bytes");
  await write(metadataPath, JSON.stringify({ ...metadata, "/en/../private/": { title: "Invalid" } }));
  await assert.rejects(buildSearchIndexes({ siteDir, metadataPath }), /Invalid public search route/);
  await write(metadataPath, JSON.stringify({ ...metadata, "/en/missing/": { title: "Missing" } }));
  await assert.rejects(buildSearchIndexes({ siteDir, metadataPath }), /Cannot index \/en\/missing\//);
} finally {
  await rm(temporary, { recursive: true, force: true });
}

const page = (url, title, { headings = [], text = "", dois = [] } = {}) => ({ url, lang: "en", title, headings, text, dois });
const queryFixtures = [
  page("/title/", "Operational boundary", { text: "Public definition." }),
  page("/body/", "Other document", { text: "The operational boundary is present in the body." }),
  page("/heading/", "Heading match", { headings: ["Operational boundary"], text: "A separate paragraph." }),
  page("/doi/", "Publication", { dois: ["10.5281/zenodo.12345678"], text: "Published reference." }),
  page("/literal/", "Literal symbols", { text: "A reader’s evidence contains a+b and [scope]." })
];
assert.equal(normalizeQuery("  Межа\nЗАСТОСОВНОСТІ — reader’s  "), "межа застосовності reader's");
assert.equal(normalizeQuery("https://doi.org/10.5281/zenodo.12345678"), "10.5281/zenodo.12345678");
assert.equal(normalizeQuery("x".repeat(1000)).length, 240);
assert.deepEqual(searchPages(queryFixtures, "   "), { total: 0, results: [], truncated: false });
assert.equal(searchPages(queryFixtures, "operational boundary").results[0].page.url, "/title/", "Title must rank before body");
assert.ok(searchPages(queryFixtures, "operational boundary").results.some(result => result.page.url === "/heading/"));
assert.equal(searchPages(queryFixtures, "operational missing").total, 0, "All query terms must match");
assert.equal(searchPages(queryFixtures, "reader's").results[0].page.url, "/literal/");
assert.equal(searchPages(queryFixtures, "a+b").results[0].page.url, "/literal/", "Query punctuation must be literal");
assert.equal(searchPages(queryFixtures, "[scope]").total, 1);
assert.equal(searchPages(queryFixtures, ".*").total, 0, "Queries must not execute as regular expressions");
assert.equal(searchPages(queryFixtures, '<img src=x onerror=alert(1)>').total, 0);
assert.equal(searchPages(queryFixtures, "https://doi.org/10.5281/zenodo.12345678").results[0].page.url, "/doi/");
const unicode = [page("/unicode/", "Unicode", { text: "Маи\u0306бутні перевірки та ﬃ remain public." })];
assert.equal(searchPages(unicode, "майбутні").total, 1, "Composed/decomposed Ukrainian must match");
assert.equal(searchPages(unicode, "ffi").total, 1, "Compatibility characters must match their normalized query");
const expandedUnicode = [page("/unicode-offset/", "Unicode example", {
  text: `${"ﬃ".repeat(150)} ${"x".repeat(200)} target`
})];
assert.ok(searchPages(expandedUnicode, "target").results[0].snippet.includes("target"),
  "An excerpt must retain its match after length-changing Unicode normalization");
const unbrokenText = [page("/unbroken-offset/", "Unbroken text", { text: `${"x".repeat(400)}target` })];
assert.ok(searchPages(unbrokenText, "target").results[0].snippet.includes("target"),
  "An excerpt must retain a match when there is no nearby word boundary");
const limited = searchPages(queryFixtures, "operational", { limit: 2 });
assert.equal(limited.total, 3);
assert.equal(limited.results.length, 2);
assert.equal(limited.truncated, true);
assert.ok(limited.results.every(result => typeof result.snippet === "string" && result.snippet.length <= 242));

// Verify the delivered indexes against the complete public route inventory and
// publication corpus. Run after npm run build, as the integrity workflow does.
const siteDir = resolve(process.argv[2] || "_site");
const metadata = JSON.parse(await readFile(resolve("src/_data/pageMetadata.json"), "utf8"));
const publications = JSON.parse(await readFile(resolve("src/assets/data/publications.json"), "utf8"));
const regenerated = await buildSearchIndexes({ siteDir });
for (const language of ["en", "ua"]) {
  const bytes = await readFile(join(siteDir, "assets/search", `${language}.json`), "utf8");
  const index = JSON.parse(bytes);
  assert.equal(index.version, 1);
  assert.equal(index.language, language);
  assert.equal(index.pages.length, 58, `Expected all 58 ${language} public pages`);
  const allowedUrls = Object.keys(metadata).filter(route => route.startsWith(`/${language}/`)).sort()
    .map(route => `/doctrine-site-box${route}`);
  assert.deepEqual(index.pages.map(record => record.url), allowedUrls);
  assert.equal(new Set(index.pages.map(record => record.url)).size, 58);
  assert.equal(bytes, `${JSON.stringify(regenerated[language])}\n`, "Built index is stale or nondeterministic");
  const shellPhrases = language === "en"
    ? ["Skip to content", "All documents", "Doctrine Site — Versioned Conceptual Framework", "Search public pages", "Your query stays in this browser and is not saved."]
    : ["Перейти до вмісту", "Усі документи", "Doctrine Site — Версіонована концептуальна рамка", "Пошук публічними сторінками", "Запит залишається в цьому браузері й не зберігається."];
  for (const record of index.pages) {
    assert.equal(record.lang, language);
    assert.ok(record.title && record.text);
    assert.ok(Array.isArray(record.headings) && record.headings.every(heading => typeof heading === "string"));
    assert.ok(Array.isArray(record.dois));
    for (const phrase of shellPhrases) {
      assert.ok(!JSON.stringify(record).includes(phrase), `Shell content leaked into ${record.url}: ${phrase}`);
    }
    await access(join(siteDir, record.url.slice("/doctrine-site-box".length), "index.html"));
  }
  const citationUrl = `/doctrine-site-box/${language}/citation/`;
  const citation = index.pages.find(record => record.url === citationUrl);
  for (const publication of publications.records) {
    assert.ok(citation.dois.includes(publication.version_doi), `Missing public DOI ${publication.version_doi} in ${language}`);
    assert.ok(searchPages(index.pages, publication.version_doi).results.some(result => result.page.url === citationUrl));
  }
  const query = language === "en" ? "canonical definition" : "канонічне визначення";
  assert.equal(searchPages(index.pages, query).results[0].page.url, `/doctrine-site-box/${language}/definition/`);
  const boundaryQuery = language === "en" ? "applicability boundary" : "межа застосовності";
  assert.ok(searchPages(index.pages, boundaryQuery).total > 0);
  assert.ok(searchPages(index.pages, boundaryQuery).results.every(result => result.page.lang === language));
  const expectedQueries = language === "en"
    ? [["authority", "terminology-authority/"], ["commit", "citation/"]]
    : [["повноваження", "terminology-authority/"], ["межі", "boundaries/"]];
  for (const [term, route] of [...expectedQueries, ["DP", "citation/"]]) {
    const matches = searchPages(index.pages, term, { limit: 200 });
    assert.ok(matches.results.some(result => result.page.url === `/doctrine-site-box/${language}/${route}`),
      `Expected public article missing for ${language} query ${term}`);
  }
  // A1–A9 are queried literally against published article content. The current
  // corpus has only A7 in Contact's fingerprint; runtime screening labels must
  // not be added to make the other terms produce artificial article results.
  assert.equal(searchPages(index.pages, "A1–A9").total, 0, "Dynamic screening axes are not public article content");
  for (let number = 1; number <= 9; number += 1) {
    const matches = searchPages(index.pages, `A${number}`, { limit: 200 });
    assert.deepEqual(matches.results.map(result => result.page.url), number === 7
      ? [`/doctrine-site-box/${language}/contact/`] : []);
  }
  const cases = searchPages(index.pages, "001", { limit: 200 }).results.map(result => result.page);
  const originalCase = cases.find(record => record.url === `/doctrine-site-box/${language}/cases/case-001/`);
  const modeDriftCase = cases.find(record => record.url === `/doctrine-site-box/${language}/case-001-mode-validity-drift/`);
  assert.ok(originalCase && modeDriftCase, `Both 001 case families must remain discoverable in ${language}`);
  assert.notEqual(originalCase.title, modeDriftCase.title, "Distinct case families must retain their published titles");
  assert.equal(searchPages(index.pages, "zzq_unfindable_public_search_fixture").total, 0);
}
console.log("Search checks PASS: 58 EN + 58 UA allowlisted built articles; deterministic indexes; shell/script/search/TOC exclusions; public DOI coverage; bilingual literal queries, ranking, normalization and limits.");
