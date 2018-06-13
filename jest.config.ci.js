module.exports = {
  automock: false,
  collectCoverage: true,
  reporters: ['default', 'jest-junit'],
  setupFiles: [
    "./setupJest.js"
  ]
}
