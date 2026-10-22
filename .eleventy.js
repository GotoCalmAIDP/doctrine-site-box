module.exports = function(eleventyConfig) {
  // Site base path for GitHub Pages
  const pathPrefix = "/doctrine-site-box";
  
  // Add pathPrefix as global data
  eleventyConfig.addGlobalData("baseurl", pathPrefix);
  
  // Pass through static assets
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("_assets/images");
  eleventyConfig.addPassthroughCopy({"src/assets": "assets"});
  
  // Add keyboard-accessible table scrolling without changing source content.
  eleventyConfig.addTransform("readerTables", require("./scripts/reader-transform.cjs"));

  // Add language filter
  eleventyConfig.addFilter("langUrl", function(url, lang) {
    // Convert URL to other language version
    const otherLang = lang === "en" ? "ua" : "en";
    return url.replace(`/${lang}/`, `/${otherLang}/`);
  });

  // Resolve generated page metadata by a page URL without exposing a fallback map.
  eleventyConfig.addFilter("metadataFor", function(metadata, url) {
    return metadata && metadata[url] ? metadata[url] : {};
  });

  // Add navigation data with pathPrefix
  const navigation = {
    en: [
      { title: "Home", url: pathPrefix + "/en/" },
      { title: "Screening", url: pathPrefix + "/en/screening/" },
      { title: "Index", url: pathPrefix + "/en/index-note/" },
      { title: "About", url: pathPrefix + "/en/about/" },
      { title: "Doctrine", url: pathPrefix + "/en/doctrine/" },
      { title: "Scope and Limitations", url: pathPrefix + "/en/scope-and-limitations/" },
      { title: "Canonical Definition", url: pathPrefix + "/en/definition/" },
      { title: "Concept Context", url: pathPrefix + "/en/applicability-boundary-context/" },
      { title: "Concept Lineage", url: pathPrefix + "/en/concept-lineage/" },
      { title: "Structural Properties", url: pathPrefix + "/en/doctrine-theorems/" },
      { title: "External Evidence Notes", url: pathPrefix + "/en/external-evidence/" },
      { title: "Architectural Questions", url: pathPrefix + "/en/architectural-questions/" },
      { title: "Case Studies", url: pathPrefix + "/en/case-studies/" },
      { title: "Method", url: pathPrefix + "/en/method/" },
      { title: "Boundaries", url: pathPrefix + "/en/boundaries/" },
      { title: "For Operators", url: pathPrefix + "/en/for-operators/" },
      { title: "For Regulators", url: pathPrefix + "/en/for-regulators/" },
      { title: "For Architects", url: pathPrefix + "/en/for-architects/" },
      { title: "For Engineers", url: pathPrefix + "/en/for-engineers/" },
      { title: "For Auditors", url: pathPrefix + "/en/for-auditors/" },
      { title: "For Investors", url: pathPrefix + "/en/for-investors/" },
      { title: "For Insurers", url: pathPrefix + "/en/for-insurers/" },
      { title: "Framework", url: pathPrefix + "/en/framework-overview/" },
      { title: "Citation", url: pathPrefix + "/en/citation/" },
      { title: "Doctrine Stability", url: pathPrefix + "/en/doctrine-stability/" },
      { title: "Contact", url: pathPrefix + "/en/contact/" }
    ],
    ua: [
      { title: "Головна", url: pathPrefix + "/ua/" },
      { title: "Скринінг", url: pathPrefix + "/ua/screening/" },
      { title: "Вступ", url: pathPrefix + "/ua/index-note/" },
      { title: "Про проєкт", url: pathPrefix + "/ua/about/" },
      { title: "Доктрина", url: pathPrefix + "/ua/doctrine/" },
      { title: "Обсяг та обмеження", url: pathPrefix + "/ua/scope-and-limitations/" },
      { title: "Канонічне визначення", url: pathPrefix + "/ua/definition/" },
      { title: "Концептуальний контекст", url: pathPrefix + "/ua/applicability-boundary-context/" },
      { title: "Походження концепції", url: pathPrefix + "/ua/concept-lineage/" },
      { title: "Структурні властивості", url: pathPrefix + "/ua/doctrine-theorems/" },
      { title: "Нотатки зовнішніх свідчень", url: pathPrefix + "/ua/external-evidence/" },
      { title: "Архітектурні питання", url: pathPrefix + "/ua/architectural-questions/" },
      { title: "Концептуальні кейси", url: pathPrefix + "/ua/case-studies/" },
      { title: "Метод", url: pathPrefix + "/ua/method/" },
      { title: "Межі", url: pathPrefix + "/ua/boundaries/" },
      { title: "Для операторів", url: pathPrefix + "/ua/for-operators/" },
      { title: "Для регуляторів", url: pathPrefix + "/ua/for-regulators/" },
      { title: "Для архітекторів", url: pathPrefix + "/ua/for-architects/" },
      { title: "Для інженерів", url: pathPrefix + "/ua/for-engineers/" },
      { title: "Для аудиторів", url: pathPrefix + "/ua/for-auditors/" },
      { title: "Для інвесторів", url: pathPrefix + "/ua/for-investors/" },
      { title: "Для страховиків", url: pathPrefix + "/ua/for-insurers/" },
      { title: "Рамка", url: pathPrefix + "/ua/framework-overview/" },
      { title: "Цитування", url: pathPrefix + "/ua/citation/" },
      { title: "Стабільність доктрини", url: pathPrefix + "/ua/doctrine-stability/" },
      { title: "Контакти", url: pathPrefix + "/ua/contact/" }
    ]
  };
  eleventyConfig.addGlobalData("navigation", navigation);

  // Eleventy page URLs omit pathPrefix; navigation links include it.
  eleventyConfig.addFilter("isCurrentPage", function(linkUrl, pageUrl) {
    const normalize = value => {
      const pathname = String(value || "").split(/[?#]/)[0];
      const withoutPrefix = pathname === pathPrefix || pathname.startsWith(pathPrefix + "/")
        ? pathname.slice(pathPrefix.length) : pathname;
      return withoutPrefix.replace(/\/$/, "") || "/";
    };
    return normalize(linkUrl) === normalize(pageUrl);
  });

  eleventyConfig.addGlobalData("readerNavigation", {
    en: [
      { title: "Home", url: pathPrefix + "/en/" },
      { title: "Reading Order", url: pathPrefix + "/en/reading-order-note/" },
      { title: "Doctrine", url: pathPrefix + "/en/doctrine/" },
      { title: "Screening", url: pathPrefix + "/en/screening/" },
      { title: "Search", url: pathPrefix + "/en/index-note/#site-search" }
    ],
    ua: [
      { title: "Головна", url: pathPrefix + "/ua/" },
      { title: "Порядок читання", url: pathPrefix + "/ua/reading-order-note/" },
      { title: "Доктрина", url: pathPrefix + "/ua/doctrine/" },
      { title: "Скринінг", url: pathPrefix + "/ua/screening/" },
      { title: "Пошук", url: pathPrefix + "/ua/index-note/#site-search" }
    ]
  });

  // Keep the catalog complete as the library grows. Every language page is
  // included once; source titles are used unless a concise nav label exists.
  eleventyConfig.addFilter("readerCatalog", function(pages, lang) {
    const groups = [
      { title: { en: "Start here", ua: "Початок читання" }, slugs: ["", "index-note", "reading-order-note", "boundary-note", "evidence-note", "scope-note", "cases-overview-note", "about"] },
      { title: { en: "Doctrine & foundations", ua: "Доктрина та основи" }, slugs: ["doctrine", "scope-and-limitations", "definition", "applicability-boundary-definition", "applicability-boundary-context", "concept-lineage", "doctrine-theorems", "framework-overview", "doctrine-stability", "architecture", "applicability-architecture"] },
      { title: { en: "Concepts & evidence", ua: "Поняття та свідчення" }, slugs: ["method", "boundaries", "terminology-applicability", "terminology-authority", "notes-applicability", "glossary", "applicability-failure-map", "applicability-incident-lens", "annex-failure-archetypes", "architectural-questions", "external-evidence"] },
      { title: { en: "Cases", ua: "Кейси" }, slugs: ["case-studies", "cases", "case-template"], matches: slug => /^case-\d|^cases\//.test(slug) },
      { title: { en: "Reader perspectives", ua: "Для читачів" }, slugs: ["screening", "for-operators", "for-regulators", "for-architects", "for-engineers", "for-auditors", "for-investors", "for-insurers"] },
      { title: { en: "Reference & site information", ua: "Довідка та інформація про сайт" }, slugs: ["citation", "scope", "evidence", "change-log", "contact", "terms", "privacy", "cookies", "disclaimer"] }
    ].map(group => ({ ...group, items: [] }));
    const labels = new Map((navigation[lang] || []).map(item => [item.url, item.title]));
    labels.set(pathPrefix + `/${lang}/reading-order-note/`, lang === "en" ? "Reading Order" : "Порядок читання");
    for (const page of pages || []) {
      if (!page.url || !page.url.startsWith(`/${lang}/`)) continue;
      const slug = page.url.slice(lang.length + 2).replace(/\/$/, "");
      const group = groups.find(item => item.slugs.includes(slug) || item.matches?.(slug)) || groups[groups.length - 1];
      const url = pathPrefix + page.url;
      group.items.push({ title: labels.get(url) || page.data.title || slug, url, slug });
    }
    for (const group of groups) {
      group.items.sort((a, b) => {
        const rank = slug => { const index = group.slugs.indexOf(slug); return index < 0 ? 999 : index; };
        return rank(a.slug) - rank(b.slug) || a.url.localeCompare(b.url);
      });
      group.title = group.title[lang] || group.title.en;
    }
    return groups.filter(group => group.items.length);
  });

  return {
    pathPrefix: pathPrefix,
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html"]
  };
};
