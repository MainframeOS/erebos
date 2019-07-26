const config = require('./jest.config')

module.exports = {
  ...config,
  bail: false,
  reporters: ['default', 'jest-junit'],
}
