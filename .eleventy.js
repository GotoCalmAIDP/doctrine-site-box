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
      { title: "Case Studies", url: pathPrefix + "/en/cases/" },
      { title: "Method", url: pathPrefix + "/en/method/" },
      { title: "Boundaries", url: pathPrefix + "/en/boundaries/" },
      { title: "Contact", url: pathPrefix + "/en/contact/" }
    ],
    ua: [
      { title: "Головна", url: pathPrefix + "/ua/" },
      { title: "Вступ", url: pathPrefix + "/ua/index-note/" },
      { title: "Про проєкт", url: pathPrefix + "/ua/about/" },
      { title: "Доктрина", url: pathPrefix + "/ua/doctrine/" },
      { title: "Кейси", url: pathPrefix + "/ua/cases/" },
      { title: "Метод", url: pathPrefix + "/ua/method/" },
      { title: "Межі", url: pathPrefix + "/ua/boundaries/" },
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
