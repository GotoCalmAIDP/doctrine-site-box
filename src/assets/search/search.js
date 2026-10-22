import { searchPages, MAX_QUERY_LENGTH } from "./search-core.mjs";

const root = document.querySelector("#site-search");
if (root) {
  const ua = root.dataset.language === "ua";
  const copy = ua ? {
    empty: "Введіть слова або DOI, щоб знайти публічні сторінки.",
    loading: "Завантаження індексу публічних сторінок…",
    error: "Не вдалося завантажити індекс. Натисніть «Знайти», щоб повторити, або скористайтеся каталогом.",
    none: "Збігів немає. Спробуйте коротший запит, інші слова або іншу мову.",
    count: (n, shown) => `Знайдено сторінок: ${n}.${shown < n ? ` Показано: ${shown}.` : ""}`,
    doi: "DOI", page: "Сторінка"
  } : {
    empty: "Enter words or a DOI to find public pages.",
    loading: "Loading the public-page index…",
    error: "The index could not be loaded. Press Search to retry, or browse the catalogue.",
    none: "No matches. Try fewer words, another term or the other language.",
    count: (n, shown) => `${n} ${n === 1 ? "page" : "pages"} found.${shown < n ? ` Showing ${shown}.` : ""}`,
    doi: "DOI", page: "Page"
  };
  const form = root.querySelector("form");
  const input = root.querySelector("#search-query");
  const language = root.querySelector("#search-language");
  const status = root.querySelector(".search-status");
  const list = root.querySelector(".search-results");
  const more = root.querySelector(".search-more");
  const clear = root.querySelector(".search-clear");
  const baseurl = root.dataset.baseurl;
  const cache = new Map();
  let pages = null;
  let requestId = 0;
  let loading = false;
  let limit = 30;
  let inputTimer;

  function render() {
    list.replaceChildren();
    more.hidden = true;
    if (loading) { status.textContent = copy.loading; return; }
    if (!pages) { status.textContent = copy.error; return; }
    if (!input.value.trim()) { status.textContent = copy.empty; return; }
    const matches = searchPages(pages, input.value, { limit });
    status.textContent = matches.total ? copy.count(matches.total, matches.results.length) : copy.none;
    const fragment = document.createDocumentFragment();
    for (const { page, snippet } of matches.results) {
      const item = document.createElement("li");
      item.lang = page.lang === "ua" ? "uk" : "en";
      const heading = document.createElement("h3");
      const link = document.createElement("a");
      link.href = page.url;
      link.textContent = page.title;
      heading.append(link);
      const path = document.createElement("p");
      path.className = "search-result-path";
      path.textContent = `${page.lang === "ua" ? "UA" : "EN"} · ${page.url.slice(baseurl.length)}`;
      const excerpt = document.createElement("p");
      excerpt.className = "search-result-excerpt";
      excerpt.textContent = snippet;
      item.append(heading, path, excerpt);
      if (page.dois.length) {
        const doi = document.createElement("p");
        doi.className = "search-result-doi";
        doi.textContent = `${copy.doi}: ${page.dois.slice(0, 3).join(" · ")}${page.dois.length > 3 ? " …" : ""}`;
        item.append(doi);
      }
      fragment.append(item);
    }
    list.append(fragment);
    more.hidden = !matches.truncated;
  }

  async function load() {
    const id = ++requestId;
    const lang = language.value === "ua" ? "ua" : "en";
    loading = true;
    pages = null;
    list.setAttribute("aria-busy", "true");
    render();
    try {
      if (!cache.has(lang)) {
        const response = await fetch(`${baseurl}/assets/search/${lang}.json`, { credentials: "omit", mode: "same-origin", referrerPolicy: "no-referrer" });
        if (!response.ok) throw new Error("Index unavailable");
        const index = await response.json();
        if (index.version !== 1 || index.language !== lang || !Array.isArray(index.pages) || !index.pages.every(page =>
          page.lang === lang && typeof page.title === "string" && typeof page.text === "string" &&
          typeof page.url === "string" && page.url.startsWith(`${baseurl}/${lang}/`) &&
          !page.url.includes("..") && !/[?#\\]/.test(page.url) &&
          Array.isArray(page.headings) && Array.isArray(page.dois)
        )) throw new Error("Invalid index");
        cache.set(lang, index.pages);
      }
      if (id !== requestId) return;
      pages = cache.get(lang);
    } catch {
      if (id !== requestId) return;
      pages = null;
    }
    if (id === requestId) {
      loading = false;
      list.removeAttribute("aria-busy");
      render();
    }
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    clearTimeout(inputTimer);
    limit = 30;
    if (!pages && !loading) void load(); else render();
  });
  input.addEventListener("input", () => {
    input.value = input.value.slice(0, MAX_QUERY_LENGTH);
    limit = 30;
    clearTimeout(inputTimer);
    inputTimer = setTimeout(render, 120);
  });
  language.addEventListener("change", () => { limit = 30; void load(); });
  clear.addEventListener("click", () => {
    clearTimeout(inputTimer);
    input.value = "";
    limit = 30;
    render();
    input.focus();
  });
  more.addEventListener("click", () => {
    // Move focus to the first newly revealed link before hiding its trigger.
    const previous = list.children.length;
    limit = 200;
    render();
    list.children[previous]?.querySelector("a")?.focus();
  });
  for (const control of form.querySelectorAll("input, select, button")) control.disabled = false;
  void load();
}
