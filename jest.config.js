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
  setupFiles: ['./jest.setup.js'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
}
