import assert from 'node:assert/strict';
import { QUESTIONS, evaluateScreening } from '../src/assets/screening/screening-core.js';
import { buildEvidenceWorkspaceExport, createEvidenceRows } from '../src/assets/screening/evidence-workspace-core-v08.js';

// Controller harness only: a deliberately small DOM/storage adapter. It does not
// claim browser layout, native parser or accessibility verification.
let sequence = 0;
async function app({ language = 'en', storage = new Map(), unavailable = false, aggregateMode = 'off' } = {}) {
  const handlers = {};
  const note = { textContent: '', classList: { toggle() {} } };
  const root = {
    dataset: { language, aggregateMode, doctrineBase: 'https://gotocalmaidp.github.io/doctrine-site-box', contactUrl: '/contact' },
    innerHTML: '',
    addEventListener(name, handler) { handlers[name] = handler; },
    querySelector(selector) {
      if (selector === '.gc-tab-status' && this.innerHTML.includes('class="gc-panel gc-tab-status"')) return {};
      if (selector === '.gc-session-guard' && this.innerHTML.includes('class="gc-session-guard"')) return {};
      if (selector === '[data-storage-status]') return note;
      return null;
    },
    querySelectorAll() { return []; },
    insertAdjacentHTML(position, html) { this.innerHTML = position === 'afterbegin' ? html + this.innerHTML : this.innerHTML + html; },
    scrollIntoView() {}
  };
  let networkCalls = 0;
  globalThis.location = { host: 'screening.example' };
  globalThis.document = { querySelector: () => root, body: { classList: { add() {}, remove() {} } } };
  globalThis.window = {
    sessionStorage: {
      getItem(key) { if (unavailable) throw new Error('denied'); return storage.get(key) || null; },
      setItem(key, value) { if (unavailable) throw new Error('denied'); storage.set(key, value); },
      removeItem(key) { if (unavailable) throw new Error('denied'); storage.delete(key); }
    },
    confirm: () => true
  };
  globalThis.fetch = async () => { networkCalls++; throw new Error('offline'); };
  globalThis.FormData = class { constructor(form) { this.form = form; } get() { return this.form.answer; } };
  await import(new URL(`../src/assets/screening/screening-v14.js?controller=${++sequence}`, import.meta.url));
  await Promise.resolve();
  const click = (action) => handlers.click({ target: { closest: () => ({ dataset: { action } }) }, preventDefault() {} });
  const change = (kind, extra = {}) => handlers.change({ target: { matches: (selector) => selector === `[data-${kind}]`, value: '', ...extra } });
  const submit = (form, answer) => handlers.submit({ preventDefault() {}, target: { dataset: { form }, answer, querySelector: () => ({ hidden: true }) } });
  const snapshot = () => JSON.parse(storage.get('goto-calm:screening-tab-draft:screening.example') || 'null');
  return { root, handlers, click, change, submit, snapshot, storage, note, networkCalls: () => networkCalls };
}
async function complete(current, consequence, answer = 'unknown') {
  await current.change('terms-consent', { checked: true });
  current.click('start');
  current.submit('routing', consequence);
  current.submit('routing', 'general');
  current.submit('routing', 'concept');
  for (const ignored of QUESTIONS) current.submit('question', answer);
  current.submit('basis', 'records');
}

const orientation = await app();
await orientation.change('terms-consent', { checked: true });
orientation.handlers.input({ target: { matches: selector => selector === '[data-orientation-text]', value: 'SECRET_TEXT_742: live vessel control could cause a collision.' } });
orientation.submit('orientation');
assert.ok(orientation.root.innerHTML.includes('value="critical"'), 'all canonical classes remain selectable');
assert.ok(!JSON.stringify(orientation.snapshot()).includes('SECRET_TEXT_742'), 'raw description is never saved');
assert.equal(orientation.snapshot().state.consequenceClass, null, 'text cue cannot silently classify the canonical assessment');
await orientation.change('orientation-class', { value: 'critical' });
orientation.click('orientation-continue');
assert.equal(orientation.snapshot().state.consequenceClass, 'critical', 'explicit confirmation retains Critical distinctly');
assert.equal(orientation.snapshot().state.routingIndex, 1);
assert.equal(orientation.snapshot().tabCompletions.count, 0, 'orientation is not a completed canonical screening');
assert.ok(!orientation.root.innerHTML.includes('SECRET_TEXT_742'), 'raw description leaves the DOM on continuation');

const first = await app();
await complete(first, 'critical');
assert.equal(first.snapshot().tabCompletions.count, 1);
assert.equal(first.snapshot().tabCompletions.last.outcome, 'indeterminate', 'unknown axes must survive a critical consequence selection');
assert.equal(first.networkCalls(), 0, 'aggregate off disables GET and POST, not just presentation');
first.submit('basis', 'records');
assert.equal(first.snapshot().tabCompletions.count, 1, 'revisiting basis does not count a second completion');
first.click('open-workspace');
assert.equal(first.snapshot().tabCompletions.count, 1, 'workspace view does not count');
first.click('new-screening');
assert.equal(first.snapshot().tabCompletions.count, 1, 'another screening preserves history');
await complete(first, 'informational', '3');
assert.equal(first.snapshot().tabCompletions.count, 2);
assert.equal(first.snapshot().tabCompletions.last.outcome, 'no-escalation');
const savedAt = first.snapshot().tabCompletions.last.at;
const legacyFixture = structuredClone(first.snapshot());
const reloaded = await app({ storage: first.storage });
assert.equal(reloaded.snapshot().tabCompletions.count, 2, 'same-origin tab reload preserves count without adding one');
assert.equal(reloaded.snapshot().tabCompletions.last.at, savedAt, 'reload preserves original completion time');
const state = reloaded.snapshot().state;
const exported = buildEvidenceWorkspaceExport({ language: 'en', context: { referenceLabel: 'test', assessedVersion: '1', assessmentDate: '2026-10-22', contextLabel: 'offline synthetic fixture' }, screening: evaluateScreening(state), rows: createEvidenceRows(state.answers), maritime: null });
await reloaded.change('workspace-import', { files: [{ size: 12000, text: async () => JSON.stringify(exported) }] });
assert.equal(reloaded.snapshot().tabCompletions.count, 2, 'portable import does not add a completion');
assert.equal(reloaded.snapshot().tabCompletions.activeRun, null, 'an imported snapshot cannot become a new recorded run automatically');
reloaded.click('record-completion');
assert.equal(reloaded.snapshot().tabCompletions.count, 2);
reloaded.click('new-screening');
reloaded.click('document-intake');
let finishRead;
const pending = reloaded.change('document-input', { files: [{ name: 'pending.docx', size: 100, arrayBuffer: () => new Promise(resolve => { finishRead = resolve; }) }] });
reloaded.click('reset-tab');
finishRead(new ArrayBuffer(100));
await pending;
assert.equal(reloaded.storage.size, 0, 'reset clears current and legacy draft');
assert.ok(reloaded.root.innerHTML.includes('Completions in this tab'));
assert.ok(!reloaded.root.innerHTML.includes('pending.docx'), 'late file read cannot revive a reset workspace');

const legacy = { ...legacyFixture, schema: 'goto-calm:screening-tab-draft:0.1' };
delete legacy.tabCompletions;
delete legacy.coreVersion;
const migrated = await app({ storage: new Map([['goto-calm:screening-tab-draft', JSON.stringify(legacy)]]) });
assert.equal(migrated.snapshot().schema, 'goto-calm:screening-tab-draft:0.2');
assert.equal(migrated.snapshot().tabCompletions.count, 0, 'legacy restore does not invent completion history');

const denied = await app({ unavailable: true, language: 'ua' });
assert.ok(denied.root.innerHTML.includes('Сховище браузера недоступне'));
await complete(denied, 'unknown');
assert.ok(denied.root.innerHTML.includes('Завершень у цій вкладці'));
assert.equal(denied.networkCalls(), 0);
console.log('screening-app-v14: completion/reload/import/reset race/legacy/storage-offline controller oracles PASS');
