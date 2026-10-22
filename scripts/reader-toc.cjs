const { Parser } = require('htmlparser2');

const EXCLUDED_TAGS = new Set(['nav', 'header', 'footer', 'script', 'style', 'template', 'noscript', 'form', 'button']);
const EXCLUDED_CLASSES = new Set(['site-search', 'search-panel', 'glossary-index', 'screening-example', 'reader-toc']);
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const excluded = (tag, attributes) => EXCLUDED_TAGS.has(tag)
  || 'hidden' in attributes || attributes['aria-hidden'] === 'true'
  || 'data-search-exclude' in attributes || 'data-reader-toc' in attributes
  || attributes.id === 'gc-screening'
  || /(?:display\s*:\s*none|visibility\s*:\s*hidden)/i.test(attributes.style || '')
  || (attributes.class || '').split(/\s+/).some(name => EXCLUDED_CLASSES.has(name));

/** Read existing HTML without serializing or changing canonical content. */
function enhanceReaderToc(html, { lang = 'en', minimum = 4 } = {}) {
  const stack = [];
  const ids = new Map();
  const headings = [];
  let articleStart = -1;
  let articleCount = 0;
  let skipPage = false;
  const parser = new Parser({
    onopentag(tag, attributes) {
      const parent = stack.at(-1);
      const classes = (attributes.class || '').split(/\s+/);
      if (attributes.id) ids.set(attributes.id, (ids.get(attributes.id) || 0) + 1);
      if ('data-reader-toc' in attributes || 'data-glossary-index' in attributes || attributes.id === 'gc-screening') skipPage = true;
      const startsArticle = tag === 'article' && classes.includes('content') && classes.includes('reader-document')
        && stack.some(element => element.tag === 'main');
      if (startsArticle) { articleStart = parser.startIndex; articleCount += 1; }
      const element = {
        tag, inArticle: startsArticle || Boolean(parent?.inArticle),
        excluded: Boolean(parent?.excluded) || excluded(tag, attributes),
        heading: parent?.heading
      };
      if (element.inArticle && !element.excluded && (tag === 'h2' || tag === 'h3')) {
        element.heading = { level: Number(tag[1]), attributes, start: parser.startIndex, end: parser.endIndex + 1, chunks: [] };
        headings.push(element.heading);
      }
      stack.push(element);
    },
    ontext(text) {
      const element = stack.at(-1);
      if (element?.inArticle && !element.excluded && element.heading) element.heading.chunks.push(text);
    },
    onclosetag() { stack.pop(); }
  }, { decodeEntities: true });
  parser.end(html);
  if (skipPage || articleStart < 0) return html;
  const eligible = headings.map(heading => ({ ...heading, title: heading.chunks.join('').replace(/\s+/gu, ' ').trim() }))
    .filter(heading => heading.title);
  if (eligible.length < minimum) return html;
  if (articleCount !== 1) throw new Error('Reader TOC requires one canonical article');
  for (const [id, count] of ids) if (count > 1) throw new Error(`Duplicate existing page ID prevents safe reader TOC: ${id}`);
  const patches = [];
  for (const heading of eligible) {
    let id = heading.attributes.id;
    let added = '';
    if (!id) {
      const slug = heading.title.normalize('NFKC').toLocaleLowerCase(lang === 'ua' ? 'uk' : 'en')
        .replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'heading';
      const base = `section-${slug}`;
      id = base;
      for (let suffix = 2; ids.has(id); suffix += 1) id = `${base}-${suffix}`;
      ids.set(id, 1);
      added += ` id="${escapeHtml(id)}"`;
    }
    if (!('tabindex' in heading.attributes)) added += ' tabindex="-1"';
    added += ' data-reader-toc-target';
    patches.push({ start: heading.end - 1, end: heading.end - 1, value: added });
    heading.id = id;
  }
  const title = lang === 'ua' ? 'На цій сторінці' : 'On this page';
  const links = eligible.map(heading => `<li data-toc-level="${heading.level}"><a href="#${escapeHtml(encodeURIComponent(heading.id))}">${escapeHtml(heading.title)}</a></li>`).join('\n');
  const toc = `<details class="reader-toc" data-reader-toc data-search-exclude><summary>${title}</summary><nav aria-label="${title}"><ol role="list">${links}</ol></nav></details>\n`;
  patches.push({ start: articleStart, end: articleStart, value: toc });
  patches.sort((a, b) => b.start - a.start);
  let output = html;
  for (const patch of patches) output = output.slice(0, patch.start) + patch.value + output.slice(patch.end);
  return output;
}

function readerToc(html, outputPath) {
  const path = String(outputPath || '').replace(/\\/g, '/');
  const route = path.match(/\/(en|ua)\/(.*?)index\.html$/);
  if (!route || /^(?:screening|glossary)\/$/.test(route[2])) return html;
  return enhanceReaderToc(html, { lang: route[1] });
}
module.exports = readerToc;
module.exports.enhanceReaderToc = enhanceReaderToc;
