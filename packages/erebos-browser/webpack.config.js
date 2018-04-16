const path = require('path')

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'erebos.js',
    library: 'erebos',
    libraryTarget: 'umd',
  },
  module: {
    rules: [{ test: /\.js$/, use: 'babel-loader' }],
  },
}
