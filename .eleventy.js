module.exports = function(eleventyConfig) {
  // Pass through static assets
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("_assets/images");
  
  // Add language filter
  eleventyConfig.addFilter("langUrl", function(url, lang) {
    // Convert URL to other language version
    const otherLang = lang === "en" ? "ua" : "en";
    return url.replace(`/${lang}/`, `/${otherLang}/`);
  });

  // Add navigation data
  eleventyConfig.addGlobalData("navigation", {
    en: [
      { title: "Home", url: "/en/" },
      { title: "About", url: "/en/about/" },
      { title: "Doctrine", url: "/en/doctrine/" },
      { title: "Case Studies", url: "/en/cases/" },
      { title: "Method", url: "/en/method/" },
      { title: "Boundaries", url: "/en/boundaries/" },
      { title: "Contact", url: "/en/contact/" }
    ],
    ua: [
      { title: "Головна", url: "/ua/" },
      { title: "Про проєкт", url: "/ua/about/" },
      { title: "Доктрина", url: "/ua/doctrine/" },
      { title: "Кейси", url: "/ua/cases/" },
      { title: "Метод", url: "/ua/method/" },
      { title: "Межі", url: "/ua/boundaries/" },
      { title: "Контакти", url: "/ua/contact/" }
    ]
  });

  return {
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
