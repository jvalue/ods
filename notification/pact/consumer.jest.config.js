const { defaults } = require('jest-config')
const regularJestConfig = require('../jest.config')

module.exports = {
  ...regularJestConfig,
  rootDir: '..',
  testMatch: ['**/*.consumer.pact.test.(js|jsx|ts|tsx)'],
  testPathIgnorePatterns: defaults.testPathIgnorePatterns,
  testTimeout: 30000
}
