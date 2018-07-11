const path = require('path')

const PATHS = {
  entryPoint: path.resolve(__dirname, 'src/TLNetwork.ts'),
  bundles: path.resolve(__dirname, '_bundles')
}

module.exports = {
	mode: 'production',
  entry: {
    'trustlines-network': [PATHS.entryPoint]
  },
  output: {
    path: PATHS.bundles,
    filename: '[name].js',
    libraryTarget: 'umd',
    library: 'TLNetwork',
    umdNamedDefine: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json']
  },
  module: {
    rules: [{
      test: /\.tsx?$/,
      loader: 'awesome-typescript-loader',
      exclude: /node_modules/
    }]
  }
}
