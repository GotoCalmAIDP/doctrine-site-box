import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
// Already supplied by the locked Eleventy -> posthtml-parser dependency tree.
import { Parser } from "htmlparser2";

export const SEARCH_VERSION = 1;
export const SEARCH_BASE_PATH = "/doctrine-site-box";
const LANGUAGES = ["en", "ua"];
const BLOCK_TAGS = new Set([
  "address", "article", "blockquote", "br", "caption", "dd", "details", "div",
  "dl", "dt", "figcaption", "figure", "h1", "h2", "h3", "h4", "h5", "h6",
  "hr", "li", "ol", "p", "pre", "section", "summary", "table", "td", "th", "tr", "ul"
]);
const EXCLUDED_TAGS = new Set(["script", "style", "template", "noscript", "header", "footer", "nav"]);
const EXCLUDED_CLASSES = new Set(["toc", "reader-toc", "site-search", "search-panel"]);
const cleanText = value => value.replace(/\s+/gu, " ").trim();

function excluded(tag, attributes) {
  return EXCLUDED_TAGS.has(tag)
    || "data-search-exclude" in attributes
    || "data-reader-toc" in attributes
    || "data-site-search" in attributes
    || "hidden" in attributes
    || attributes["aria-hidden"] === "true"
    || (attributes.class || "").split(/\s+/u).some(name => EXCLUDED_CLASSES.has(name));
}

function findDois(value) {
  return [...value.matchAll(/\b10\.\d{4,9}\/[^\s<>"?&#]+/giu)].map(match => {
    let doi = match[0].replace(/[.,;:!]+$/u, "");
    for (const [open, close] of [["(", ")"], ["[", "]"], ["{", "}"]]) {
      while (doi.endsWith(close) && doi.split(close).length > doi.split(open).length) doi = doi.slice(0, -1);
    }
    return doi.toLowerCase();
  });
}

/** Extract only the public article, never the document shell or executable text. */
export function extractArticle(html) {
  const stack = [];
  const chunks = [];
  const headings = [];
  const linkDois = [];
  let articleCount = 0;
  const parser = new Parser({
    onopentag(tag, attributes) {
      const parent = stack.at(-1);
      const startsArticle = tag === "article"
        && (attributes.class || "").split(/\s+/u).includes("content")
        && stack.some(element => element.tag === "main");
      if (startsArticle) articleCount += 1;
      const element = {
        tag,
        inArticle: startsArticle || Boolean(parent?.inArticle),
        excluded: Boolean(parent?.excluded) || excluded(tag, attributes),
        heading: parent?.heading
      };
      if (element.inArticle && !element.excluded) {
        if (BLOCK_TAGS.has(tag)) chunks.push(" ");
        if (/^h[1-6]$/u.test(tag)) {
          element.heading = { level: Number(tag[1]), chunks: [] };
          headings.push(element.heading);
        }
        if (tag === "a" && attributes.href) linkDois.push(...findDois(attributes.href));
      }
      stack.push(element);
    },
    ontext(text) {
      const element = stack.at(-1);
      if (element?.inArticle && !element.excluded) {
        chunks.push(text);
        element.heading?.chunks.push(text);
      }
    },
    onclosetag() {
      const element = stack.pop();
      if (element?.inArticle && !element.excluded && BLOCK_TAGS.has(element.tag)) chunks.push(" ");
    }
  }, { decodeEntities: true });
  parser.end(html);
  if (articleCount !== 1) throw new Error(`Expected one main article.content; found ${articleCount}`);
  const text = cleanText(chunks.join(""));
  if (!text) throw new Error("The public main article is empty");
  const readableHeadings = headings.map(heading => ({ ...heading, text: cleanText(heading.chunks.join("")) }))
    .filter(heading => heading.text);
  return {
    title: readableHeadings.find(heading => heading.level === 1)?.text || "",
    headings: readableHeadings.map(heading => heading.text),
    text,
    dois: [...new Set([...findDois(text), ...linkDois])].sort()
  };
}

/** Metadata is the sole route allowlist. There is deliberately no directory crawl. */
export async function buildSearchIndexes({
  siteDir = resolve("_site"),
  metadataPath = resolve("src/_data/pageMetadata.json")
} = {}) {
  const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
  if (!metadata || Array.isArray(metadata) || typeof metadata !== "object") throw new Error("Invalid page metadata allowlist");
  const indexes = Object.fromEntries(LANGUAGES.map(language => [language, {
    version: SEARCH_VERSION, language, pages: []
  }]));
  for (const route of Object.keys(metadata).sort()) {
    const match = route.match(/^\/(en|ua)\/(?:[a-z0-9][a-z0-9-]*\/)*$/u);
    if (!match) throw new Error(`Invalid public search route: ${route}`);
    const language = match[1];
    const file = resolve(siteDir, `.${route}`, "index.html");
    let article;
    try {
      article = extractArticle(await readFile(file, "utf8"));
    } catch (error) {
      throw new Error(`Cannot index ${route}: ${error.message}`, { cause: error });
    }
    const title = article.title;
    if (!title) throw new Error(`Missing public title: ${route}`);
    indexes[language].pages.push({
      url: `${SEARCH_BASE_PATH}${route}`,
      lang: language,
      title,
      headings: article.headings,
      text: article.text,
      dois: article.dois
    });
  }
  for (const language of LANGUAGES) {
    if (!indexes[language].pages.length) throw new Error(`No public pages for ${language}`);
  }
  return indexes;
}

export async function writeSearchIndexes(options = {}) {
  const indexes = await buildSearchIndexes(options);
  const outputDir = resolve(options.siteDir || "_site", "assets/search");
  await mkdir(outputDir, { recursive: true });
  for (const language of LANGUAGES) {
    await writeFile(resolve(outputDir, `${language}.json`), `${JSON.stringify(indexes[language])}\n`, "utf8");
  }
  return indexes;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const indexes = await writeSearchIndexes({ siteDir: resolve(process.argv[2] || "_site") });
  console.log(`Search indexes: ${indexes.en.pages.length} EN + ${indexes.ua.pages.length} UA public articles.`);
}
