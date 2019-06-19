module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  "reporters": [
    "default",
    ["./node_modules/jest-html-reporter", {
        "pageTitle": "UI - Unit Test Report",
        "outputPath": "build/test-results/unit-test-results.html"
    }]
  ],

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
    '**/tests/unit/**/*.spec.(js|jsx|ts|tsx)|**/__tests__/*.(js|jsx|ts|tsx)'
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
  
