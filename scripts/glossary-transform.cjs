const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { Parser } = require('htmlparser2');

const ROOT = resolve(__dirname, '..');
const BASE = '/doctrine-site-box';
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const textOf = html => {
  let text = '';
  const parser = new Parser({ ontext: value => { text += value; } }, { decodeEntities: true });
  parser.end(html);
  return text.trim();
};
const headingsOf = markdown => [...markdown.matchAll(/^##[ \t]+(.+?)[ \t]*$/gm)].map(match => match[1]);

/** Only the existing canonical headings supply titles and language mappings. */
function collectTerms({ rootDir = ROOT } = {}) {
  const english = headingsOf(readFileSync(resolve(rootDir, 'src/en/glossary.md'), 'utf8'));
  const ukrainian = headingsOf(readFileSync(resolve(rootDir, 'src/ua/glossary.md'), 'utf8'));
  const terms = ukrainian.flatMap(uaTitle => {
    const match = uaTitle.match(/^(.+?)\s+\(([A-Za-z][A-Za-z -]+)\)$/);
    if (!match) return [];
    const [, uaLabel, enTitle] = match;
    if (english.filter(title => title === enTitle).length !== 1) {
      throw new Error(`Glossary term lacks one exact English source heading: ${enTitle}`);
    }
    return [{ id: `term-${enTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`, enTitle, uaTitle, uaLabel }];
  });
  if (terms.length !== 23 || new Set(terms.map(term => term.id)).size !== 23) {
    throw new Error('Expected 23 unique bilingual terms from the canonical glossary headings');
  }
  return terms;
}

const COPY = {
  en: {
    index: 'Find a term', help: 'Choose a title to jump to its definition. All definitions remain below.',
    filter: 'Filter term titles', hint: 'Type an English or Ukrainian term.', clear: 'Clear',
    empty: 'No matching term titles. Clear the filter to show all terms.', all: 'Back to term index',
    counterpart: 'Українською', count: '23 terms'
  },
  ua: {
    index: 'Знайти термін', help: 'Оберіть назву, щоб перейти до визначення. Усі визначення залишаються нижче.',
    filter: 'Фільтр назв термінів', hint: 'Введіть термін українською або англійською.', clear: 'Очистити',
    empty: 'Назв термінів не знайдено. Очистіть фільтр, щоб показати всі терміни.', all: 'До покажчика термінів',
    counterpart: 'In English', count: '23 терміни'
  }
};

function indexHtml(terms, lang) {
  const copy = COPY[lang];
  const collator = new Intl.Collator(lang === 'ua' ? 'uk' : 'en', { sensitivity: 'base' });
  const ordered = [...terms].sort((a, b) => collator.compare(lang === 'ua' ? a.uaLabel : a.enTitle, lang === 'ua' ? b.uaLabel : b.enTitle));
  const links = ordered.map(term => `<li data-glossary-item data-glossary-titles="${escapeHtml(`${term.enTitle} ${term.uaTitle}`)}"><a href="#${term.id}">${escapeHtml(lang === 'ua' ? term.uaTitle : term.enTitle)}</a></li>`).join('\n');
  return `<nav id="glossary-index" class="glossary-index" aria-labelledby="glossary-index-title" data-glossary-index data-language="${lang}" data-search-exclude>
<h2 id="glossary-index-title">${copy.index}</h2>
<p class="glossary-index-help">${copy.help}</p>
<form class="glossary-filter" data-glossary-form hidden>
<label for="glossary-filter">${copy.filter}</label>
<div class="glossary-filter-controls"><input id="glossary-filter" data-glossary-filter type="search" maxlength="240" autocomplete="off" spellcheck="false" aria-describedby="glossary-filter-hint" aria-controls="glossary-term-list"><button type="button" data-glossary-clear>${copy.clear}</button></div>
<p id="glossary-filter-hint" class="glossary-filter-hint">${copy.hint}</p>
<p class="glossary-filter-status" data-glossary-status role="status" aria-live="polite" aria-atomic="true">${copy.count}</p>
</form>
<p class="glossary-filter-empty" data-glossary-empty hidden>${copy.empty}</p>
<ul id="glossary-term-list" class="glossary-term-list">${links}</ul>
</nav>\n`;
}

/** Preserve source HTML byte-for-byte except additive navigation and attributes. */
function enhanceGlossary(html, { lang, baseurl = BASE, terms = collectTerms() } = {}) {
  if (!COPY[lang]) throw new Error(`Unsupported glossary language: ${lang}`);
  if (/\bdata-glossary-index(?:\s|>)/.test(html)) return html;
  const ids = new Set();
  const parser = new Parser({
    onopentag(tag, attributes) {
      if (!attributes.id) return;
      if (ids.has(attributes.id)) throw new Error(`Duplicate existing glossary ID: ${attributes.id}`);
      ids.add(attributes.id);
    }
  });
  parser.end(html);
  for (const reserved of ['glossary-index', 'glossary-index-title', 'glossary-filter', 'glossary-filter-hint', 'glossary-term-list']) {
    if (ids.has(reserved)) throw new Error(`Glossary navigation ID collision: ${reserved}`);
  }
  const byTitle = new Map(terms.map(term => [lang === 'ua' ? term.uaTitle : term.enTitle, term]));
  const seen = new Set();
  let articleFound = false;
  const enhanced = html.replace(/(<article\b[^>]*\bclass="[^"]*\breader-document\b[^"]*"[^>]*>)([\s\S]*?)(<\/article>)/, (_, opening, article, closing) => {
    articleFound = true;
    const content = article.replace(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/g, (original, attributes, titleHtml) => {
      const term = byTitle.get(textOf(titleHtml));
      if (!term) return original;
      if (seen.has(term.id)) throw new Error(`Duplicate glossary heading: ${term.id}`);
      const first = seen.size === 0;
      seen.add(term.id);
      let existingAttributes = {};
      const headingParser = new Parser({ onopentag: (tag, values) => { existingAttributes = values; } });
      headingParser.end(`<h2${attributes}></h2>`);
      const existingId = existingAttributes.id || '';
      if (ids.has(term.id) && existingId !== term.id) throw new Error(`Glossary term ID collision: ${term.id}`);
      ids.add(term.id);
      const alias = existingId && existingId !== term.id
        ? `<span id="${term.id}" class="glossary-term-anchor" aria-hidden="true"></span>` : '';
      const id = existingId ? '' : ` id="${term.id}"`;
      const tabindex = "tabindex" in existingAttributes ? '' : ' tabindex="-1"';
      const heading = `<h2${attributes}${id}${tabindex} data-glossary-term="${term.id}">${titleHtml}</h2>`;
      const other = lang === 'en' ? 'ua' : 'en';
      const copy = COPY[lang];
      const tools = `\n<p class="glossary-term-tools" data-search-exclude><a href="#glossary-index">${copy.all}</a><span aria-hidden="true"> · </span><a href="${escapeHtml(baseurl)}/${other}/glossary/#${term.id}" lang="${other === 'ua' ? 'uk' : 'en'}" hreflang="${other === 'ua' ? 'uk' : 'en'}" data-glossary-counterpart>${copy.counterpart}</a></p>`;
      return (first ? indexHtml(terms, lang) : '') + alias + heading + tools;
    });
    return opening + content + closing;
  });
  if (!articleFound || seen.size !== terms.length) throw new Error(`Expected ${terms.length} exact ${lang} glossary headings; found ${seen.size}`);
  return enhanced;
}

function glossaryTransform(html, outputPath) {
  const match = String(outputPath || '').replace(/\\/g, '/').match(/\/(en|ua)\/glossary\/index\.html$/);
  if (!match) return html;
  return enhanceGlossary(html, { lang: match[1] });
}
module.exports = glossaryTransform;
module.exports.collectTerms = collectTerms;
module.exports.enhanceGlossary = enhanceGlossary;
