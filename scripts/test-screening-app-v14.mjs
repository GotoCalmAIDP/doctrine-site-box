import assert from 'node:assert/strict';
import { QUESTIONS, evaluateScreening } from '../src/assets/screening/screening-core.js';
import { buildEvidenceWorkspaceExport, createEvidenceRows } from '../src/assets/screening/evidence-workspace-core-v08.js';

// Controller harness only: a deliberately small DOM/storage adapter. It does not
// claim browser layout, native parser or accessibility verification.
let sequence = 0;
async function app({ language = 'en', storage = new Map(), unavailable = false, aggregateMode = 'off', fetchHandler, existingRoot } = {}) {
  const handlers = {};
  const note = { textContent: '', classList: { toggle() {} } };
  const root = existingRoot || {
    isConnected: true,
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
  Object.assign(root.dataset, { language, aggregateMode });
  root.addEventListener = (name, handler) => { handlers[name] = handler; };
  let networkCalls = 0;
  const requests = [];
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
  globalThis.fetch = async (url, options) => { networkCalls++; requests.push({ url, options }); if (fetchHandler) return fetchHandler(url, options); throw new Error('offline'); };
  globalThis.FormData = class { constructor(form) { this.form = form; } get() { return this.form.answer; } };
  await import(new URL(`../src/assets/screening/screening-v14.js?controller=${++sequence}`, import.meta.url));
  await Promise.resolve();
  const click = (action) => handlers.click({ target: { closest: () => ({ dataset: { action } }) }, preventDefault() {} });
  const change = (kind, extra = {}) => handlers.change({ target: { matches: (selector) => selector === `[data-${kind}]`, value: '', ...extra } });
  const submit = (form, answer) => handlers.submit({ preventDefault() {}, target: { dataset: { form }, answer, querySelector: () => ({ hidden: true }) } });
  const snapshot = () => JSON.parse(storage.get('goto-calm:screening-tab-draft:screening.example') || 'null');
  return { root, handlers, click, change, submit, snapshot, storage, note, networkCalls: () => networkCalls, requests };
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

const fileBounds = await app();
await fileBounds.change('terms-consent', { checked: true });
fileBounds.click('document-intake');
for (const descriptor of [
  { name: 'rejected.exe', size: 64, expected: 'Only .docx, .txt and .md' },
  { name: 'oversized.txt', size: 10 * 1024 * 1024 + 1, expected: 'larger than 10 MiB' },
  { name: 'empty.txt', size: 0, expected: 'file is empty' }
]) {
  let reads = 0;
  await fileBounds.change('document-input', { files: [{ ...descriptor, arrayBuffer: async () => { reads++; return new ArrayBuffer(64); } }] });
  assert.equal(reads, 0, `${descriptor.name} must be rejected before arrayBuffer is called`);
  assert.equal(fileBounds.snapshot().documentIntake.reports.length, 0);
  assert.ok(fileBounds.root.innerHTML.includes(descriptor.expected));
}
const acceptedText = new TextEncoder().encode('Scope\nSynthetic context v1\nEvidence records require review before reliance.');
let acceptedReads = 0;
await fileBounds.change('document-input', { files: [{ name: 'accepted.txt', size: acceptedText.byteLength, arrayBuffer: async () => { acceptedReads++; return acceptedText.buffer; } }] });
assert.equal(acceptedReads, 1, 'a valid supported file still reaches the local read');
assert.equal(fileBounds.snapshot().documentIntake.status, 'ready');
assert.equal(fileBounds.snapshot().documentIntake.reports.length, 1);
assert.equal(fileBounds.snapshot().documentIntake.reports[0].file.name, 'accepted.txt');
assert.equal(fileBounds.networkCalls(), 0, 'descriptor checks and accepted local read do not upload file data');

let finishOversizeScan;
const oversizedImportScan = fileBounds.change('document-input', { files: [{ name: 'still-active.txt', size: acceptedText.byteLength, arrayBuffer: () => new Promise(resolve => { finishOversizeScan = resolve; }) }] });
let oversizedImportReads = 0;
await fileBounds.change('workspace-import', { files: [{ size: 512 * 1024 + 1, text: async () => { oversizedImportReads++; return '{}'; } }] });
assert.equal(oversizedImportReads, 0, 'oversized JSON import is rejected before reading');
assert.equal(fileBounds.snapshot().documentIntake.status, 'ready', 'persisted draft retains the last completed scan while current one is pending');
finishOversizeScan(acceptedText.buffer);
await oversizedImportScan;
assert.equal(fileBounds.snapshot().documentIntake.status, 'ready');
assert.equal(fileBounds.snapshot().documentIntake.reports.length, 2, 'oversized import does not cancel the active document scan');
let finishCanceledScan;
const canceledScan = fileBounds.change('document-input', { files: [{ name: 'cancelled-by-import.txt', size: acceptedText.byteLength, arrayBuffer: () => new Promise(resolve => { finishCanceledScan = resolve; }) }] });
await fileBounds.change('workspace-import', { files: [{ size: 1, text: async () => '{' }] });
assert.equal(fileBounds.snapshot().documentIntake.status, 'ready', 'malformed replacement import settles canceled scan to prior ready state');
assert.equal(fileBounds.snapshot().documentIntake.reports.length, 2, 'prior completed reports survive a malformed import');
finishCanceledScan(acceptedText.buffer);
await canceledScan;
assert.equal(fileBounds.snapshot().documentIntake.reports.length, 2, 'canceled scan cannot revive after import failure');
let afterFailureReads = 0;
await fileBounds.change('document-input', { files: [{ name: 'after-import-failure.txt', size: acceptedText.byteLength, arrayBuffer: async () => { afterFailureReads++; return acceptedText.buffer; } }] });
assert.equal(afterFailureReads, 1, 'another valid document scan is possible after failed import');
assert.equal(fileBounds.snapshot().documentIntake.reports.length, 3);

const inverse = await app();
await inverse.change('terms-consent', { checked: true });
inverse.click('document-intake');
const replacementPayload = structuredClone(exported);
replacementPayload.context.referenceLabel = 'IMPORTED_OBJECT';
let finishOldImport;
const oldImport = inverse.change('workspace-import', { files: [{ size: 12000, text: () => new Promise(resolve => { finishOldImport = resolve; }) }] });
let finishNewScan;
const newScan = inverse.change('document-input', { files: [{ name: 'NEW_OBJECT_SCAN.txt', size: acceptedText.byteLength, arrayBuffer: () => new Promise(resolve => { finishNewScan = resolve; }) }] });
finishOldImport(JSON.stringify(replacementPayload));
await oldImport;
assert.notEqual(inverse.snapshot().workspace.context.referenceLabel, 'IMPORTED_OBJECT', 'a later accepted scan supersedes the pending replacement import');
finishNewScan(acceptedText.buffer);
await newScan;
assert.equal(inverse.snapshot().documentIntake.reports[0].file.name, 'NEW_OBJECT_SCAN.txt');
assert.notEqual(inverse.snapshot().workspace.context.referenceLabel, 'IMPORTED_OBJECT', 'late scan must not append into a workspace replaced by its superseded import');
let finishImportAfterReject;
const survivingImport = inverse.change('workspace-import', { files: [{ size: 12000, text: () => new Promise(resolve => { finishImportAfterReject = resolve; }) }] });
let rejectedAfterImportReads = 0;
await inverse.change('document-input', { files: [{ name: 'rejected-after-import.exe', size: 100, arrayBuffer: async () => { rejectedAfterImportReads++; return new ArrayBuffer(100); } }] });
assert.equal(rejectedAfterImportReads, 0);
finishImportAfterReject(JSON.stringify(replacementPayload));
await survivingImport;
assert.equal(inverse.snapshot().workspace.context.referenceLabel, 'IMPORTED_OBJECT', 'a descriptor reject does not supersede a pending valid import');

const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };
const getCount = current => current.requests.filter(request => request.options?.method !== 'POST').length;
async function pendingContribution({ bodyPending = false } = {}) {
  let resolvePost, rejectPost, resolveBody;
  const post = new Promise((resolve, reject) => { resolvePost = resolve; rejectPost = reject; });
  let bodyReads = 0;
  const body = new Promise(resolve => { resolveBody = resolve; });
  const current = await app({ aggregateMode: 'on', fetchHandler: (_url, options) => {
    if (options?.method === 'POST') return bodyPending ? { ok: true, json: () => { bodyReads++; return body; } } : post;
    throw new Error('mock aggregate unavailable');
  } });
  await complete(current, 'critical');
  await current.change('contribution-consent', { checked: true });
  current.click('contribute');
  await flush();
  assert.equal(current.snapshot().contribution.status, 'sending');
  assert.equal(current.requests.filter(request => request.options?.method === 'POST').length, 1);
  return { current, resolvePost, rejectPost, resolveBody, bodyReads: () => bodyReads };
}
for (const mode of ['fetch-success', 'body-success', 'fetch-reject']) {
  const pendingContributionCase = await pendingContribution({ bodyPending: mode === 'body-success' });
  const current = pendingContributionCase.current;
  if (mode === 'body-success') assert.equal(pendingContributionCase.bodyReads(), 1, 'body promise is pending before reset');
  current.click('reset-tab');
  await complete(current, 'unknown');
  const before = JSON.stringify(current.snapshot().contribution);
  const getsBefore = getCount(current);
  if (mode === 'fetch-success') pendingContributionCase.resolvePost({ ok: true, json: async () => ({ accepted: true }) });
  else if (mode === 'body-success') pendingContributionCase.resolveBody({ accepted: true });
  else pendingContributionCase.rejectPost(new Error('old request rejected'));
  await flush();
  assert.equal(JSON.stringify(current.snapshot().contribution), before, `${mode}: stale reply cannot change new session contribution status/token`);
  assert.equal(current.snapshot().contribution.status, 'idle');
  assert.equal(getCount(current), getsBefore, `${mode}: stale reply cannot initiate aggregate refresh`);
}
const currentContribution = await pendingContribution();
const getsBeforeSuccess = getCount(currentContribution.current);
currentContribution.resolvePost({ ok: true, json: async () => ({ accepted: true }) });
await flush();
assert.equal(currentContribution.current.snapshot().contribution.status, 'sent', 'a current consented reply is still accepted');
assert.equal(getCount(currentContribution.current), getsBeforeSuccess + 1, 'current success refreshes the public aggregate once');

for (const lifecycle of ['detached-root', 'same-root-new-controller']) {
  const sharedStorage = new Map();
  const oldController = await app({ storage: sharedStorage });
  await oldController.change('terms-consent', { checked: true });
  oldController.click('document-intake');
  let finishOldRead;
  const oldRead = oldController.change('document-input', { files: [{ name: 'STALE_OLD_WORK.txt', size: acceptedText.byteLength, arrayBuffer: () => new Promise(resolve => { finishOldRead = resolve; }) }] });
  if (lifecycle === 'detached-root') oldController.root.isConnected = false;
  const nextController = await app({ storage: sharedStorage, existingRoot: lifecycle === 'same-root-new-controller' ? oldController.root : undefined });
  nextController.click('reset-tab');
  assert.equal(sharedStorage.size, 0);
  const newMarkup = nextController.root.innerHTML;
  oldController.click('document-intake');
  assert.equal(sharedStorage.size, 0, `${lifecycle}: obsolete event listeners cannot write the current tab draft`);
  finishOldRead(acceptedText.buffer);
  await oldRead;
  assert.equal(sharedStorage.size, 0, `${lifecycle}: old pending read cannot repopulate the new controller's Reset session`);
  assert.equal(nextController.root.innerHTML, newMarkup, `${lifecycle}: obsolete completion cannot rerender current interface`);
}

for (const lifecycle of ['detached-root', 'same-root-new-controller']) {
  const oldContribution = await pendingContribution({ bodyPending: true });
  const oldController = oldContribution.current;
  if (lifecycle === 'detached-root') oldController.root.isConnected = false;
  const nextController = await app({ storage: oldController.storage, existingRoot: lifecycle === 'same-root-new-controller' ? oldController.root : undefined });
  nextController.click('reset-tab');
  const markup = nextController.root.innerHTML;
  oldContribution.resolveBody({ accepted: true });
  await flush();
  assert.equal(nextController.storage.size, 0, `${lifecycle}: obsolete POST response cannot write a new draft`);
  assert.equal(nextController.root.innerHTML, markup, `${lifecycle}: obsolete POST response cannot rerender the current root`);
  assert.equal(nextController.networkCalls(), 0, `${lifecycle}: obsolete POST response cannot refresh aggregate through current controller`);
}
let finishOldAggregate;
const aggregateOwner = await app({ aggregateMode: 'on', fetchHandler: () => new Promise(resolve => { finishOldAggregate = resolve; }) });
const aggregateReplacement = await app({ storage: aggregateOwner.storage, existingRoot: aggregateOwner.root });
await aggregateReplacement.change('terms-consent', { checked: true });
aggregateReplacement.click('document-intake');
const aggregateMarkup = aggregateReplacement.root.innerHTML;
finishOldAggregate({ ok: true, json: async () => ({}) });
await flush();
assert.equal(aggregateReplacement.root.innerHTML, aggregateMarkup, 'obsolete aggregate GET cannot rerender the shared root after replacement');
assert.equal(aggregateReplacement.networkCalls(), 0);

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
console.log('screening-app-v14: completion/reload/import/reset race/file-read bounds/import-scan lifecycle/aggregate stale reply/detached-or-superseded controller/legacy/storage-offline controller oracles PASS');
