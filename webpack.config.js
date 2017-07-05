module.exports = {
    entry: "./src/TLNetwork.ts",
    output: {
        filename: "trustlines-network.js",
        path: __dirname + "/dist",
        libraryTarget: "umd"
    },

    externals: [
        "eth-lightwallet",
        "rxjs",
        "reconnecting-websocket",
        "isomorphic-fetch",
        "@types/isomorphic-fetch",
        "es6-promise"
    ],

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"]
    },

    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            { test: /\.tsx?$/, loader: "awesome-typescript-loader" },

            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
        ]
    },
};
