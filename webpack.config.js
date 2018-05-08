const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const PATHS = {
    entryPoint: path.resolve(__dirname, 'src/TLNetwork.ts'),
    bundles: path.resolve(__dirname, '_bundles')
}

module.exports = {
    entry: {
        'trustlines-network': [PATHS.entryPoint],
        'trustlines-network.min': [PATHS.entryPoint]
    },
    output: {
        path: PATHS.bundles,
        filename: '[name].js',
        libraryTarget: 'umd',
        library: 'TLNetwork',
        umdNamedDefine: true,
        libraryExport: 'default'
    },
    externals: [
        '@types/isomorphic-fetch',
        'es6-promise'
    ],

    // Enable sourcemaps for debugging webpack's output.
    devtool: 'source-map',

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: ['.ts', '.tsx', '.js', '.json']
    },

    optimization: {
        minimizer: [
            // we specify a custom UglifyJsPlugin here to get source maps in production
            new UglifyJsPlugin({
                uglifyOptions: {
                    output: {
                        comments: false
                    },
                    compress: {
                        unsafe_comps: true,
                        properties: true,
                        keep_fargs: false,
                        pure_getters: true,
                        collapse_vars: true,
                        unsafe: true,
                        warnings: false,
                        sequences: true,
                        dead_code: true,
                        drop_debugger: true,
                        comparisons: true,
                        conditionals: true,
                        evaluate: true,
                        booleans: true,
                        loops: true,
                        unused: true,
                        hoist_funs: true,
                        if_return: true,
                        join_vars: true,
                        drop_console: true
                    }
                }
            })
        ]
    },

    module: {
      // Webpack doesn't understand TypeScript files and a loader is needed.
      // `node_modules` folder is excluded in order to prevent problems with
      // the library dependencies, as well as `__tests__` folders that
      // contain the tests for the library
      rules: [{
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
