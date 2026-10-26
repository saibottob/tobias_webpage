const path = require("path");
const { rssPlugin } = require("@11ty/eleventy-plugin-rss");
const {
  isoDate,
  modifiedDate,
  feedUpdated,
  createImageDimensions,
  warnIncompleteBlogPosts,
  sitemapEntries,
  jsonld,
} = require("./lib/seo");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(rssPlugin);

  eleventyConfig.addPassthroughCopy("src/assets/");
  eleventyConfig.addPassthroughCopy("src/css/");
  eleventyConfig.addPassthroughCopy("src/js/");
  eleventyConfig.addPassthroughCopy("src/robots.txt");

  // Self-hosted animation libs
  eleventyConfig.addPassthroughCopy({
    "node_modules/three/build/three.module.js": "vendor/three/three.module.js",
    "node_modules/three/build/three.core.js": "vendor/three/three.core.js",
    "node_modules/animejs/dist/bundles/anime.esm.min.js": "vendor/anime.esm.min.js",
    "node_modules/motion/dist/motion.js": "vendor/motion.js",
  });

  eleventyConfig.addFilter("limit", (arr, limit) => arr.slice(0, limit));
  eleventyConfig.addFilter("isoDate", isoDate);
  eleventyConfig.addFilter("modifiedDate", modifiedDate);
  eleventyConfig.addFilter("feedUpdated", feedUpdated);
  eleventyConfig.addFilter("imageDimensions", createImageDimensions(path.join(__dirname, "src")));
  eleventyConfig.addFilter("sitemapEntries", sitemapEntries);
  eleventyConfig.addFilter("jsonld", jsonld);

  eleventyConfig.addFilter("displayCategory", function (value) {
    if (!value) return "";
    const v = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    return v === "Politik" ? "Gesellschaft" : v;
  });

  eleventyConfig.addFilter("readingTime", function (html) {
    const words = String(html || "")
      .replace(/<[^>]*>/g, " ")
      .split(/\s+/)
      .filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  });

  eleventyConfig.addFilter("date", function (value, format) {
    const d = new Date(value);
    if (!format || format === "dd.MM.yyyy") {
      return d.toLocaleDateString("de-CH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
    return d.toLocaleDateString("de-CH");
  });

  eleventyConfig.addWatchTarget("src/css/");

  eleventyConfig.addCollection("blog", function (collectionApi) {
    const posts = collectionApi.getFilteredByTag("blog").sort((a, b) => {
      return b.date - a.date; // Neueste zuerst
    });
    warnIncompleteBlogPosts(posts);
    return posts;
  });

  eleventyConfig.addCollection("experience", function (collectionApi) {
    return collectionApi.getFilteredByTag("experience").sort((a, b) => {
      return new Date(b.data.startDate) - new Date(a.data.startDate); // Neueste zuerst
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
