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
    libraryTarget: 'var',
    library: 'trustlines'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader',
        exclude: /node_modules/
      }
    ]
  },
  externals: ['ethers']
}
