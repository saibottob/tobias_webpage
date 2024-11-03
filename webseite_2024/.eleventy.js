module.exports = function(eleventyConfig) {
    // Copy the `img` and `css` folders to the output
    eleventyConfig.addPassthroughCopy("src/assets/");
    eleventyConfig.addPassthroughCopy("src/css/");
    eleventyConfig.addPassthroughCopy("src/js/");

    eleventyConfig.addWatchTarget("src/css/");

    // You can return your Config object (optional)
    return {
        dir: {
            input: "src",
            includes: "_includes",
            output: "dist"
        },
        templateFormats: ["njk", "html", "md"],
        markdownTemplateEngine: "njk",
        HTMLTemplateElement: "njk",
        dataTemenplateEngine: "njk"
    };
};