const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const FixStyleOnlyEntriesPlugin = require("webpack-fix-style-only-entries");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const path = require("path")
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
    }),
    new HtmlWebpackPlugin({
        title : 'Tobias Gatschet',
        filename: 'index.html',
        template: 'index.html',
        minify: {
          removeComments: true,
          collapseWhitespace: true
        }
      }),
  ],
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