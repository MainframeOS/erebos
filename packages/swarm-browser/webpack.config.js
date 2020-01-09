/* eslint-disable */
'use strict'

const path = require('path')
const TerserPlugin = require('terser-webpack-plugin')
const isProduction = process.env.NODE_ENV === 'production'

module.exports = () => {
  const envName = isProduction ? 'production' : 'development'
  return {
    bail: isProduction,
    mode: envName,
    devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
    entry: [path.join(__dirname, `src`, 'index.ts')],
    output: {
      path: path.join(__dirname, `dist/`),
      filename: `erebos.swarm.${envName}.js`,
      sourceMapFilename: `erebos.swarm.${envName}.js.map`,
      library: ['Erebos', 'swarm'],
      libraryTarget: 'umd',
      devtoolModuleFilenameTemplate: info =>
        path.resolve(info.absoluteResourcePath).replace(/\\/g, '/'),
    },
    module: {
      rules: [
        {
          test: /\.(ts|js)$/,
          include: path.join(__dirname, `src/`),
          use: {
            loader: 'babel-loader',
          },
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json'],
    },
    optimization: {
      minimize: isProduction,
      minimizer: [
        // This is only used in production mode
        new TerserPlugin({
          terserOptions: {
            parse: {
              // we want terser to parse ecma 8 code. However, we don't want it
              // to apply any minfication steps that turns valid ecma 5 code
              // into invalid ecma 5 code. This is why the 'compress' and 'output'
              // sections only apply transformations that are ecma 5 safe
              // https://github.com/facebook/create-react-app/pull/4234
              ecma: 8,
            },
            compress: {
              ecma: 5,
              warnings: false,
            },
            mangle: {
              safari10: true,
            },
            output: {
              ecma: 5,
              comments: false,
            },
          },
          // Use multi-process parallel running to improve the build speed
          // Default number of concurrent runs: os.cpus().length - 1
          parallel: true,
          // Enable file caching
          cache: true,
          sourceMap: true,
        }),
      ],
    },
    target: 'web',
    node: {
      console: false,
      global: true,
      process: true,
      Buffer: true,
    },
    performance: {
      hints: false,
    },
    stats: 'minimal',
  }
}
