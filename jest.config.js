module.exports = {
  automock: false,
  bail: true,
  collectCoverage: true,
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
  preset: 'jest-puppeteer',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
}
