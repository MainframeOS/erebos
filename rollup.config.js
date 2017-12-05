import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import builtins from 'rollup-plugin-node-builtins'
import resolve from 'rollup-plugin-node-resolve'
import uglify from 'rollup-plugin-uglify'

const env = process.env.NODE_ENV

const config = {
  input: 'src/index.js',
  output: {
    file: env === 'production' ? 'dist/erebos.min.js' : 'dist/erebos.js',
    format: 'umd',
    name: 'erebos',
  },
  plugins: [
    resolve({
      extensions: ['.web.js', '.js'],
    }),
    builtins(),
    babel({
      exclude: '**/node_modules/**',
    }),
    commonjs(),
  ],
  treeshake: {
    pureExternalModules: true,
    propertyReadSideEffects: false,
  },
}

if (env === 'production') {
  config.plugins.push(
    uglify({
      compress: {
        dead_code: true,
        warnings: false,
      },
    }),
  )
}

export default config
