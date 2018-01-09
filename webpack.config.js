var path = require("path");
var webpack = require("webpack");

var PATHS = {
    entryPoint: path.resolve(__dirname, "src/TLNetwork.ts"),
    bundles: path.resolve(__dirname, "_bundles")
}

module.exports = {
    entry: {
        "trustlines-network": [PATHS.entryPoint],
        "trustlines-network.min": [PATHS.entryPoint]
    },
    output: {
        path: PATHS.bundles,
        filename: "[name].js",
        libraryTarget: "umd",
        library: "TLNetwork",
        umdNamedDefine: true
    },
    externals: [
        "eth-lightwallet",
        "rxjs",
        "@types/isomorphic-fetch",
        "es6-promise",
        "ethereumjs-util"
    ],

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"]
    },

    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            minimize: true,
            sourceMap: true,
            include: /\.min\.js$/
        })
    ],

    module: {
      // Webpack doesn't understand TypeScript files and a loader is needed.
      // `node_modules` folder is excluded in order to prevent problems with
      // the library dependencies, as well as `__tests__` folders that
      // contain the tests for the library
      loaders: [{
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader',
        exclude: /node_modules/,
        query: {
          // we don't want any declaration file in the bundles
          // folder since it wouldn't be of any use ans the source
          // map already include everything for debugging
          declaration: false,
        }
      }]
    }
};
