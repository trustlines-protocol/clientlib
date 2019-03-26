const path = require('path')

const PATHS = {
  entryPoint: path.resolve(__dirname, 'src/TLNetwork.ts'),
  bundles: path.resolve(__dirname, '_bundles')
}

module.exports = {
  mode: 'production',
  node: {
    fs: 'empty',
    child_process: 'empty'
  },
  entry: {
    'trustlines-clientlib': [PATHS.entryPoint]
  },
  output: {
    path: PATHS.bundles,
    filename: '[name].js',
    libraryTarget: 'var',
    library: 'trustlines'
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
