import { matchesGlossaryTitle, normalizeGlossaryQuery } from './glossary-core.mjs';

export function initGlossaryFilter(root) {
  if (!root) return;
  const form = root.querySelector('[data-glossary-form]');
  const input = root.querySelector('[data-glossary-filter]');
  const clear = root.querySelector('[data-glossary-clear]');
  const status = root.querySelector('[data-glossary-status]');
  const empty = root.querySelector('[data-glossary-empty]');
  const items = [...root.querySelectorAll('[data-glossary-item]')];
  if (!form || !input || !clear || !status || !empty || !items.length) return;
  const ukrainian = root.dataset.language === 'ua';
  const update = () => {
    let count = 0;
    for (const item of items) {
      const matches = matchesGlossaryTitle(item.dataset.glossaryTitles, input.value);
      item.hidden = !matches;
      if (matches) count += 1;
    }
    const filtered = Boolean(normalizeGlossaryQuery(input.value));
    status.textContent = ukrainian
      ? (filtered ? `Знайдено ${count} із ${items.length}. Усі визначення залишаються нижче.` : `${items.length} терміни. Усі визначення залишаються нижче.`)
      : (filtered ? `${count} of ${items.length} terms. All definitions remain below.` : `${items.length} terms. All definitions remain below.`);
    empty.hidden = count !== 0;
  };
  form.addEventListener('submit', event => event.preventDefault());
  input.addEventListener('input', update);
  clear.addEventListener('click', () => { input.value = ''; update(); input.focus(); });
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); input.value = ''; update(); }
  });
  update();
  form.hidden = false;
}
if (typeof document !== 'undefined') initGlossaryFilter(document.querySelector('[data-glossary-index]'));
