module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets/");
  eleventyConfig.addPassthroughCopy("src/css/");
  eleventyConfig.addPassthroughCopy("src/js/");

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
