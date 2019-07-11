import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import json from 'rollup-plugin-json'
import globals from 'rollup-plugin-node-globals'
import resolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-replace'
import { uglify } from 'rollup-plugin-uglify'

const env = process.env.NODE_ENV
const extensions = ['.js', '.ts']

const config = {
  input: 'src/index.ts',
  output: {
    file: `dist/erebos.swarm.${env}.js`,
    format: 'umd',
    name: 'Erebos.swarm',
  },
  plugins: [
    resolve({
      browser: true,
      extensions,
    }),
    babel({
      exclude: '**/node_modules/**',
      extensions,
      runtimeHelpers: true,
    }),
    commonjs(),
    json(),
    globals(),
    replace({
      'process.env.NODE_ENV': JSON.stringify(env),
    }),
  ],
}

if (env === 'production') {
  config.plugins.push(uglify())
}

export default config
