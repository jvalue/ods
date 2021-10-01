const {defaults} = require('jest-config')

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  moduleFileExtensions: [
    'js',
    'jsx',
    'json',
    'vue',
    'ts',
    'tsx'
  ],

  transform: {
    '^.+\\.vue$': 'vue-jest',
    '.+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
    '^.+\\.tsx?$': 'ts-jest'
  },

  transformIgnorePatterns: [
    '/node_modules/'
  ],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  snapshotSerializers: [
    'jest-serializer-vue'
  ],

  testMatch: [
    '**/*.test.(js|jsx|ts|tsx)|**/__tests__/*.(js|jsx|ts|tsx)'
  ],

  testPathIgnorePatterns: [
    ...defaults.testPathIgnorePatterns,
    '.*\\.pact\\.test\\.ts$'
  ],

  testURL: 'http://localhost/',

  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],

  globals: {
    'ts-jest': {
      babelConfig: true
    }
  }
};
  
