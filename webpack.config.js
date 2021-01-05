const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const FixStyleOnlyEntriesPlugin = require("webpack-fix-style-only-entries");
const HTMLWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const path = require("path")
// We need Nodes fs module to read directory contents
const fs = require('fs')

// Our function that generates our html plugins
function generateHtmlPlugins (templateDir) {
  // Read files in template directory
  const templateFiles = fs.readdirSync(path.resolve(__dirname, templateDir))
  return templateFiles.map(item => {
    // Split names and extension
    const parts = item.split('.')
    const name = parts[0]
    const extension = parts[1]
    // Create new HTMLWebpackPlugin with options
    return new HTMLWebpackPlugin({
      title : 'Tobias Gatschet',
      filename: `${name}.html`,
      template: path.resolve(__dirname, `${templateDir}/${name}.${extension}`),
      minify: {
          removeComments: true,
          collapseWhitespace: true
        }
    })
  })
}

// Call our function on our views directory.
const htmlPlugins = generateHtmlPlugins('./html')

module.exports = {
  entry: ['./sass/main.scss', './js/app.js'],
  output: {
    path: path.resolve(__dirname, 'lib')
  },
  module: {
    rules: [
      // Extracts the compiled CSS from the SASS files defined in the entry
      {
        test: /\.scss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader
          },
          {
            // Interprets CSS
            loader: "css-loader",
            options: {
              importLoaders: 2
            }
          },
          {
            loader: 'sass-loader' // 将 Sass 编译成 CSS
          }
        ]
      }
    ],
  },
  plugins: [
    new FixStyleOnlyEntriesPlugin(),
    // Where the compiled SASS is saved to
    new MiniCssExtractPlugin({
      filename: 'index.css',
      allChunks: true,
    })
  ]
  // We join our htmlPlugin array to the end
  // of our webpack plugins array.
  .concat(htmlPlugins),
  optimization: {
    minimize: true,
    minimizer: [
      new OptimizeCSSAssetsPlugin({
        cssProcessorOptions: {
          safe: true
        }
      }),
      new TerserPlugin(),
    ]
  },
};