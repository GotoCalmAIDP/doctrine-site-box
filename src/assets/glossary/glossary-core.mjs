/** A literal title-only filter; no regular expression is built from user input. */
export function normalizeGlossaryQuery(value) {
  return String(value ?? '').slice(0, 240).normalize('NFKC')
    .replace(/[’‘ʼ`]/gu, "'").toLocaleLowerCase('uk').replace(/\s+/gu, ' ').trim();
}
export function matchesGlossaryTitle(titles, query) {
  const normalized = normalizeGlossaryQuery(query);
  if (!normalized) return true;
  const haystack = String(titles ?? '').normalize('NFKC')
    .replace(/[’‘ʼ`]/gu, "'").toLocaleLowerCase('uk').replace(/\s+/gu, ' ').trim();
  return normalized.split(' ').every(term => haystack.includes(term));
}
