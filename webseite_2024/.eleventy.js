module.exports = function(eleventyConfig) {
    // Add a filter using the Config API
    eleventyConfig.addFilter("myFilter", function(value) {
        return value.toUpperCase();
    });

    // Copy the `img` and `css` folders to the output
    eleventyConfig.addPassthroughCopy("img");
    eleventyConfig.addPassthroughCopy("css");

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