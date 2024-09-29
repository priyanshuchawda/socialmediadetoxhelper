const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
   mode: "production",
   entry: {
      background: path.resolve(__dirname, "src", "background.ts"),
      popup: path.resolve(__dirname, "src", "popup.tsx"),
   },
   output: {
      path: path.join(__dirname, "dist"),
      filename: "[name].js",
   },
   resolve: {
      extensions: [".ts", ".tsx", ".js"],
   },
   module: {
      rules: [
         {
            test: /\.tsx?$/,
            loader: "ts-loader",
            exclude: /node_modules/,
         },
      ],
   },
   plugins: [
      new CopyPlugin({
         patterns: [
            { from: "public", to: "." },
            { from: "manifest.json", to: "." },
            { from: "public/icon16.png", to: "." },
            { from: "public/icon48.png", to: "." },
            { from: "public/icon128.png", to: "." },
         ],
      }),
   ],
};