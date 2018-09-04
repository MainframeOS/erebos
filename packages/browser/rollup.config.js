import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import globals from 'rollup-plugin-node-globals'
import resolve from 'rollup-plugin-node-resolve'
import { uglify } from 'rollup-plugin-uglify'

const env = process.env.NODE_ENV

const config = {
  input: 'src/index.js',
  output: {
    file: env === 'production' ? 'dist/erebos.min.js' : 'dist/erebos.js',
    format: 'umd',
    name: 'Erebos',
  },
  plugins: [
    resolve({
      browser: true,
      jsnext: true,
    }),
    globals(),
    babel({
      exclude: '**/node_modules/**',
      runtimeHelpers: true,
    }),
    commonjs(),
  ],
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
