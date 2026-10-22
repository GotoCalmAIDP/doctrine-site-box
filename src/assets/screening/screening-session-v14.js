import { CONSEQUENCE_CLASSES, ASSESSMENT_VERSION } from "./screening-core.js";

export const PORTABLE_UI_VERSION = "screening-portable-ui 0.1.0-alpha";
export const PRELIMINARY_TEXT_LIMIT = 6000;
export const COMPLETIONS_SCHEMA = "goto-calm:screening-tab-completions:0.1";
const OUTCOMES = ["exploratory", "indeterminate", "review", "no-escalation"];
const patterns = {
  high: [/\b(?:death|fatal(?:ity|ities)?|injur\w*|irreversible|life[- ]critical|safety[- ]critical|medical dosing|drug dosage|live vessel control|collision|catastrophic)\b/giu, /(?:смерт\p{L}*|загибел\p{L}*|травм\p{L}*|незворот\p{L}*|зіткнен\p{L}*|критичн\p{L}*\s+(?:інфраструктур\p{L}*|для\s+безпеки)|дозуван\p{L}*\s+ліків|необратим\p{L}*|столкновен\p{L}*|летальн\p{L}*)/giu],
  enterprise: [/\b(?:enterprise|production|payroll|financial (?:loss|transaction)|customer data|personal data|sensitive data|legal rights|business continuity|contractual|bank transfer|data breach|regulatory|revenue)\b/giu, /(?:підприємств\p{L}*|производств\p{L}*|продакшн|персональн\p{L}*\s+дан\p{L}*|дан\p{L}*\s+клієнт\p{L}*|финансов\p{L}*\s+(?:потер\p{L}*|операц\p{L}*)|фінансов\p{L}*\s+(?:втрат\p{L}*|операц\p{L}*)|зарплат\p{L}*|договірн\p{L}*|юридичн\p{L}*\s+прав\p{L}*|банківськ\p{L}*\s+переказ\p{L}*)/giu],
  limited: [/\b(?:minor inconvenience|minor harm|low[- ]impact|easily reversible|reversible draft|small reversible|manual correction|temporary inconvenience)\b/giu, /(?:легк\p{L}*\s+(?:шкод\p{L}*|наслід\p{L}*)|незначн\p{L}*\s+(?:шкод\p{L}*|наслід\p{L}*|незручн\p{L}*)|легко\s+зворот\p{L}*|ручн\p{L}*\s+виправ\p{L}*|тимчасов\p{L}*\s+незручн\p{L}*|незначительн\p{L}*\s+последств\p{L}*)/giu],
  informational: [/\b(?:no harm|without harm|no consequential action|purely informational|personal brainstorming|fictional offline demo|information only)\b/giu, /(?:без\s+шкоди|лише\s+інформац\p{L}*|тільки\s+інформац\p{L}*|без\s+дій\s+із\s+наслідками|особист\p{L}*\s+мозков\p{L}*\s+штурм|без\s+вреда|только\s+информац\p{L}*)/giu]
};
function negated(text, index) {
  const before = text.slice(Math.max(0, index - 70), index).split(/[.!?;\n]/u).at(-1);
  return /(?:\b(?:no|not|without|never|exclude[ds]?|excluding)|(?:немає|нема|без|не|відсутн\p{L}*|нет|исключ\p{L}*))\s+(?:(?:risk of|any|real|actual|ризику|жодн\p{L}*)\s+)?$/iu.test(before);
}

// Keyword orientation only. It never supplies canonical answers, evidence, or authorization.
// Derived flags deliberately omit text excerpts so raw user text need not enter a snapshot.
export function analyzePreliminaryText(value) {
  if (typeof value !== "string" || value.length > PRELIMINARY_TEXT_LIMIT) throw new Error("preliminary-text-limit");
  const text = value.trim();
  if (text.length < 20) throw new Error("preliminary-text-insufficient");
  const cueGroups = Object.entries(patterns).filter(([, expressions]) => expressions.some((expression) =>
    [...text.matchAll(expression)].some((match) => !negated(text, match.index))
  )).map(([key]) => key);
  const suggestedClass = ["high", "enterprise", "limited", "informational"].find((key) => cueGroups.includes(key)) || "unknown";
  return { version: PORTABLE_UI_VERSION, suggestedClass, cueGroups, source: "unverified-text-cues", requiresConfirmation: true };
}

export function emptyTabCompletions() {
  return { schema: COMPLETIONS_SCHEMA, count: 0, activeRun: null, completedRun: null, last: null };
}
const validRun = (value) => typeof value === "string" && /^[a-zA-Z0-9_-]{1,96}$/.test(value);
export function restoreTabCompletions(value) {
  const initial = emptyTabCompletions();
  if (!value || value.schema !== COMPLETIONS_SCHEMA || !Number.isSafeInteger(value.count) || value.count < 0) return initial;
  const last = value.last;
  if (value.count > 0 && (!last || typeof last.at !== "string" || Number.isNaN(Date.parse(last.at)) ||
    !CONSEQUENCE_CLASSES.includes(last.consequenceClass) || !OUTCOMES.includes(last.outcome) || last.coreVersion !== ASSESSMENT_VERSION)) return initial;
  return {
    schema: COMPLETIONS_SCHEMA,
    count: value.count,
    activeRun: validRun(value.activeRun) ? value.activeRun : null,
    completedRun: validRun(value.completedRun) ? value.completedRun : null,
    last: value.count ? { at: last.at, consequenceClass: last.consequenceClass, outcome: last.outcome, coreVersion: last.coreVersion } : null
  };
}
export function beginTabRun(value, id) {
  if (!validRun(id)) throw new Error("completion-run-invalid");
  return { ...restoreTabCompletions(value), activeRun: id, completedRun: null };
}
export function completeTabRun(value, result, at = new Date().toISOString()) {
  const current = restoreTabCompletions(value);
  if (!current.activeRun || current.completedRun === current.activeRun) return current;
  if (!CONSEQUENCE_CLASSES.includes(result?.consequenceClass) || !OUTCOMES.includes(result?.outcome) ||
      result?.version !== ASSESSMENT_VERSION || typeof at !== "string" || Number.isNaN(Date.parse(at))) throw new Error("completion-result-invalid");
  if (current.count === Number.MAX_SAFE_INTEGER) return current;
  return { ...current, count: current.count + 1, completedRun: current.activeRun,
    last: { at, consequenceClass: result.consequenceClass, outcome: result.outcome, coreVersion: result.version } };
}

function safeHref(value, fallback, basePath = false) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const input = value.trim();
  try {
    const relative = input.startsWith("/") && !input.startsWith("//");
    const url = new URL(input, relative ? "https://local.invalid" : undefined);
    if (url.protocol !== "https:" || url.username || url.password) return fallback;
    if (!relative && !/^https:\/\//i.test(input)) return fallback;
    const href = relative ? `${url.pathname}${basePath ? "" : url.search + url.hash}` : basePath ? `${url.origin}${url.pathname}` : url.href;
    return basePath ? href.replace(/\/+$/, "") : href;
  } catch { return fallback; }
}
export function normalizeScreeningLinks(dataset = {}, language = "en") {
  const lang = language === "ua" ? "ua" : "en";
  const doctrineBase = safeHref(dataset.doctrineBase, "/doctrine-site-box", true);
  return {
    doctrineBase,
    contactUrl: safeHref(dataset.contactUrl, `${doctrineBase}/${lang}/contact/`),
    aggregateEnabled: dataset.aggregateMode !== "off"
  };
}
