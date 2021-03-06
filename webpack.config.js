/* global require, module, __dirname */

const path = require("path");

module.exports = {
  entry: {
    feature: "./feature.js/index.js",
    content: "./content.js/index.js",
    frontend: "./frontend.js/index.js",
  },
  output: {
    path: path.resolve(__dirname, "./build/static/js"),
    filename: "[name].js",
    sourceMapFilename: "[name].js.map",
    pathinfo: true,
  },
  resolve: {
    extensions: [".js"],
  },
  mode: "development",
  devtool: "inline-source-map",
};
/* eslint-env node */
