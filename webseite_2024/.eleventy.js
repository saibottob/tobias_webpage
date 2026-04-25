module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets/");
  eleventyConfig.addPassthroughCopy("src/css/");
  eleventyConfig.addPassthroughCopy("src/js/");

  eleventyConfig.addFilter("limit", (arr, limit) => arr.slice(0, limit));

  eleventyConfig.addFilter("date", function (value, format) {
    const d = new Date(value);
    if (!format || format === "dd.MM.yyyy") {
      return d.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
    }
    return d.toLocaleDateString("de-CH");
  });

  eleventyConfig.addWatchTarget("src/css/");

  eleventyConfig.addCollection("blog", function (collectionApi) {
    return collectionApi.getFilteredByTag("blog").sort((a, b) => {
      return b.date - a.date; // Neueste zuerst
    });
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "dist",
    },
    templateFormats: ["njk", "html", "md"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
  };
};
