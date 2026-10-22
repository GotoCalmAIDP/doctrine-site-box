// Public-library search only. Queries remain in the caller's memory.
export const MAX_QUERY_LENGTH = 240;

export function normalizeQuery(value) {
  return String(value ?? "").slice(0, MAX_QUERY_LENGTH).normalize("NFKC")
    .toLowerCase().replace(/[‘’ʼ`]/g, "'").replace(/[–—−]/g, " ")
    .replace(/https?:\/\/(?:dx\.)?doi\.org\//g, "")
    .replace(/\s+/g, " ").trim();
}

function normalizeText(value) {
  return String(value ?? "").normalize("NFKC").toLowerCase()
    .replace(/[‘’ʼ`]/g, "'").replace(/[–—−]/g, " ").replace(/\s+/g, " ");
}

function excerpt(text, terms) {
  const source = String(text ?? "").replace(/\s+/g, " ").trim();
  const searchable = normalizeText(source);
  const positions = terms.map(term => searchable.indexOf(term)).filter(n => n >= 0);
  // NFKC can expand a ligature or combine letters. Map its offset back to the
  // original text before cutting an excerpt, so Ukrainian/Unicode stays intact.
  let matchOffset = 0;
  if (positions.length) {
    const target = Math.min(...positions);
    let low = 0, high = source.length;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (normalizeText(source.slice(0, middle)).length < target) low = middle + 1;
      else high = middle;
    }
    matchOffset = low;
  }
  let start = Math.max(0, matchOffset - 65);
  if (start) {
    const boundary = source.indexOf(" ", start);
    if (boundary >= 0 && boundary < start + 25) start = boundary + 1;
  }
  const end = Math.min(source.length, start + 240);
  return `${start ? "…" : ""}${source.slice(start, end).trim()}${end < source.length ? "…" : ""}`;
}

export function searchPages(pages, query, { limit = 30 } = {}) {
  const normalized = normalizeQuery(query);
  if (!normalized) return { total: 0, results: [], truncated: false };
  const terms = [...new Set(normalized.split(" "))];
  const found = [];
  for (const page of pages) {
    const title = normalizeText(page.title);
    const headings = normalizeText((page.headings ?? []).join(" "));
    const text = normalizeText(page.text);
    const dois = normalizeText((page.dois ?? []).join(" "));
    const haystack = `${title}\n${headings}\n${text}\n${dois}`;
    if (!terms.every(term => haystack.includes(term))) continue;
    let score = title === normalized ? 120 : title.includes(normalized) ? 60 : 0;
    if (dois.includes(normalized)) score += 90;
    for (const term of terms) {
      score += title.includes(term) ? 12 : headings.includes(term) ? 6 : 1;
    }
    found.push({ page, score, snippet: excerpt(page.text, terms) });
  }
  found.sort((a, b) => b.score - a.score || a.page.url.localeCompare(b.page.url, "en"));
  const count = Math.max(1, Math.min(200, Number(limit) || 30));
  return { total: found.length, results: found.slice(0, count), truncated: found.length > count };
}
