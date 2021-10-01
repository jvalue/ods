const { defaults } = require('jest-config')

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['./src'],
  testPathIgnorePatterns: [
    ...defaults.testPathIgnorePatterns,
    '.*\\.pact\\.test\\.ts$'
  ]
}
