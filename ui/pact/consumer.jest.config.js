const {defaults} = require('jest-config')
const regularJestConfig = require('../jest.config')

module.exports = {
  ...regularJestConfig,
  rootDir: '..',
  globalSetup: './pact/deleteContracts.ts',
  testMatch: ['**/*.consumer.pact.test.(js|jsx|ts|tsx)'],
  testPathIgnorePatterns: defaults.testPathIgnorePatterns,
  testTimeout: 30000
};
