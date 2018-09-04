module.exports = {
  automock: false,
  collectCoverage: true,
  preset: 'jest-puppeteer',
  reporters: ['default', 'jest-junit'],
  setupFiles: ['./jest.setup.js'],
}
