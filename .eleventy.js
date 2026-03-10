module.exports = function(eleventyConfig) {
  // Site base path for GitHub Pages
  const pathPrefix = "/doctrine-site-box";
  
  // Add pathPrefix as global data
  eleventyConfig.addGlobalData("baseurl", pathPrefix);
  
  // Pass through static assets
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("_assets/images");
  
  // Add language filter
  eleventyConfig.addFilter("langUrl", function(url, lang) {
    // Convert URL to other language version
    const otherLang = lang === "en" ? "ua" : "en";
    return url.replace(`/${lang}/`, `/${otherLang}/`);
  });

  // Add navigation data with pathPrefix
  eleventyConfig.addGlobalData("navigation", {
    en: [
      { title: "Home", url: pathPrefix + "/en/" },
      { title: "Index", url: pathPrefix + "/en/index-note/" },
      { title: "About", url: pathPrefix + "/en/about/" },
      { title: "Doctrine", url: pathPrefix + "/en/doctrine/" },
      { title: "Canonical Definition", url: pathPrefix + "/en/definition/" },
      { title: "Case Studies", url: pathPrefix + "/en/cases/" },
      { title: "Method", url: pathPrefix + "/en/method/" },
      { title: "Boundaries", url: pathPrefix + "/en/boundaries/" },
      { title: "For Operators", url: pathPrefix + "/en/for-operators/" },
      { title: "For Regulators", url: pathPrefix + "/en/for-regulators/" },
      { title: "For Architects", url: pathPrefix + "/en/for-architects/" },
      { title: "For Investors", url: pathPrefix + "/en/for-investors/" },
      { title: "For Insurers", url: pathPrefix + "/en/for-insurers/" },
      { title: "Framework", url: pathPrefix + "/en/framework-overview/" },
      { title: "Citation", url: pathPrefix + "/en/citation/" },
      { title: "Contact", url: pathPrefix + "/en/contact/" }
    ],
    ua: [
      { title: "Головна", url: pathPrefix + "/ua/" },
      { title: "Вступ", url: pathPrefix + "/ua/index-note/" },
      { title: "Про проєкт", url: pathPrefix + "/ua/about/" },
      { title: "Доктрина", url: pathPrefix + "/ua/doctrine/" },
      { title: "Канонічне визначення", url: pathPrefix + "/ua/definition/" },
      { title: "Кейси", url: pathPrefix + "/ua/cases/" },
      { title: "Метод", url: pathPrefix + "/ua/method/" },
      { title: "Межі", url: pathPrefix + "/ua/boundaries/" },
      { title: "Для операторів", url: pathPrefix + "/ua/for-operators/" },
      { title: "Для регуляторів", url: pathPrefix + "/ua/for-regulators/" },
      { title: "Для архітекторів", url: pathPrefix + "/ua/for-architects/" },
      { title: "Для інвесторів", url: pathPrefix + "/ua/for-investors/" },
      { title: "Для страховиків", url: pathPrefix + "/ua/for-insurers/" },
      { title: "Рамка", url: pathPrefix + "/ua/framework-overview/" },
      { title: "Цитування", url: pathPrefix + "/ua/citation/" },
      { title: "Контакти", url: pathPrefix + "/ua/contact/" }
    ]
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
