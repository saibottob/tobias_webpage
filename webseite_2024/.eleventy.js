module.exports = function (eleventyConfig) {
  // Copy the `img` and `css` folders to the output
  eleventyConfig.addPassthroughCopy("src/assets/");
  eleventyConfig.addPassthroughCopy("src/css/");
  eleventyConfig.addPassthroughCopy("src/js/");

  eleventyConfig.addWatchTarget("src/css/");

  module.exports = function (eleventyConfig) {
    eleventyConfig.addCollection("blog", function (collectionApi) {
      return collectionApi.getFilteredByTag("blog").sort((a, b) => {
        return a.date - b.date; // Neueste zuerst
      });
    });
  };

  // You can return your Config object (optional)
  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "dist",
    },
    templateFormats: ["njk", "html", "md"],
    markdownTemplateEngine: "njk",
    HTMLTemplateElement: "njk",
    dataTemenplateEngine: "njk",
  };
};
