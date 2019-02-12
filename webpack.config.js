const path = require('path')

const PATHS = {
  entryPoint: path.resolve(__dirname, 'src/TLNetwork.ts'),
  bundles: path.resolve(__dirname, '_bundles')
}

module.exports = {
  mode: 'production',
  entry: {
    'trustlines-clientlib': [PATHS.entryPoint]
  },
  output: {
    path: PATHS.bundles,
    filename: '[name].js',
    libraryTarget: 'umd',
    library: 'TLNetwork'
  },
  resolve: {
    extensions: ['.ts', '.js', '.json']
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'awesome-typescript-loader'
          }
        ]
      }
    ]
  }
}
