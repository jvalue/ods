const {defaults} = require('jest-config')
const regularJestConfig = require('./jest.config')

module.exports = {
  ...regularJestConfig,
  testMatch: ['**/*.consumer.pact.test.(js|jsx|ts|tsx)'],
  testPathIgnorePatterns: defaults.testPathIgnorePatterns,
  testTimeout: 30000
};
